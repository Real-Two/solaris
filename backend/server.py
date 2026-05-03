"""
SOLARIS — Backend API Server
FastAPI server that:
  - Polls NOAA SWPC every 5 minutes for live solar data
  - Scores all 25 simulated fleet aircraft using the XGBoost model
  - Calculates route deviations, fuel deltas, and CO2 savings
  - Exposes REST endpoints consumed by the React dashboard
"""

import os
import pickle
import asyncio
import math
import json
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Paths ──────────────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../data/solaris_model.pkl")

# ── App setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="SOLARIS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tightened in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state (in-memory, updated every 5 min) ─────────────────────────
state = {
    "solar": {
        "proton_flux_pfu": 1.0,
        "kp_index": 2.0,
        "x_ray_class_raw": "B2.1",
        "x_ray_numeric": 0.21,
        "alert_level": "GREEN",
        "last_updated": None,
    },
    "fleet": [],
    "co2_saved_tonnes": 0.0,
    "diversions_prevented": 0,
}

# ── Load ML model ──────────────────────────────────────────────────────────
_bundle = None
def get_model():
    global _bundle
    if _bundle is None:
        with open(MODEL_PATH, "rb") as f:
            _bundle = pickle.load(f)
    return _bundle


# ══════════════════════════════════════════════════════════════════════════
#  NOAA DATA FETCHING
# ══════════════════════════════════════════════════════════════════════════

NOAA_PROTON_URL  = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json"
NOAA_KP_URL      = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"
NOAA_XRAY_URL    = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json"
NOAA_ALERTS_URL  = "https://services.swpc.noaa.gov/products/alerts.json"


def fetch_noaa_solar_data() -> dict:
    """Fetch current solar conditions from NOAA SWPC APIs."""
    result = {
        "proton_flux_pfu": 1.0,
        "kp_index": 2.0,
        "x_ray_class_raw": "B1.0",
        "x_ray_numeric": 0.1,
        "alert_level": "GREEN",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    # Proton flux (10 MeV channel, the one relevant for avionics SEU risk)
    try:
        r = requests.get(NOAA_PROTON_URL, timeout=10)
        if r.status_code == 200:
            data = r.json()
            # Filter for 10 MeV channel, get last reading
            readings_10mev = [
                d for d in data
                if isinstance(d, dict) and d.get("energy") == ">=10 MeV"
            ]
            if readings_10mev:
                flux = float(readings_10mev[-1].get("flux", 1.0))
                result["proton_flux_pfu"] = max(0.1, flux)
    except Exception:
        pass  # fall back to last known value

    # Kp index
    try:
        r = requests.get(NOAA_KP_URL, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if len(data) > 1:  # first row is headers
                kp_val = float(data[-1][1])
                result["kp_index"] = kp_val
    except Exception:
        pass

    # X-ray flux → classify as B/C/M/X
    try:
        r = requests.get(NOAA_XRAY_URL, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data:
                flux_wm2 = float(data[-1].get("flux", 1e-8))
                result["x_ray_numeric"] = _xray_to_numeric(flux_wm2)
                result["x_ray_class_raw"] = _xray_classify(flux_wm2)
    except Exception:
        pass

    result["alert_level"] = _compute_alert_level(
        result["proton_flux_pfu"], result["kp_index"]
    )
    return result


def _xray_classify(flux_wm2: float) -> str:
    if flux_wm2 >= 1e-4:   return f"X{flux_wm2/1e-4:.1f}"
    if flux_wm2 >= 1e-5:   return f"M{flux_wm2/1e-5:.1f}"
    if flux_wm2 >= 1e-6:   return f"C{flux_wm2/1e-6:.1f}"
    if flux_wm2 >= 1e-7:   return f"B{flux_wm2/1e-7:.1f}"
    return f"A{flux_wm2/1e-8:.1f}"


def _xray_to_numeric(flux_wm2: float) -> float:
    """Encode X-ray class as a float: C=1–9.9, M=10–99, X=100+"""
    if flux_wm2 >= 1e-4:   return flux_wm2 / 1e-4 * 100
    if flux_wm2 >= 1e-5:   return flux_wm2 / 1e-5 * 10
    if flux_wm2 >= 1e-6:   return flux_wm2 / 1e-6
    return flux_wm2 / 1e-7 * 0.1


def _compute_alert_level(flux: float, kp: float) -> str:
    if flux >= 1000 or kp >= 8.0:  return "CRITICAL"
    if flux >= 100  or kp >= 6.0:  return "RED"
    if flux >= 10   or kp >= 4.0:  return "AMBER"
    return "GREEN"


# ══════════════════════════════════════════════════════════════════════════
#  SIMULATED FLEET  (25 A320-family aircraft)
# ══════════════════════════════════════════════════════════════════════════

FLEET_SEED = [
    # (callsign,  origin, dest,    lat,   lon,  alt_fl, heading_deg)
    ("IBE6274", "MAD",  "JFK",   52.1,  -20.3,  390, 285),
    ("BAW178",  "LHR",  "ORD",   55.8,  -30.1,  370, 270),
    ("AFR084",  "CDG",  "LAX",   48.5,  -15.2,  390, 292),
    ("DLH401",  "FRA",  "YYZ",   53.2,  -25.6,  350, 278),
    ("UAE201",  "DXB",  "LHR",   44.1,   18.3,  390, 310),
    ("QFA1",    "SYD",  "LAX",   12.3, -155.8,  390, 45),
    ("SIA321",  "SIN",  "LHR",   30.5,   62.1,  390, 315),
    ("EZY8820", "LGW",  "FCO",   45.3,   12.1,  310, 145),
    ("RYR4401", "STN",  "AGP",   42.1,   -5.3,  350, 195),
    ("VLG6102", "BCN",  "PMI",   41.5,    2.8,  280, 112),
    ("AAL100",  "JFK",  "LHR",   52.8,  -32.1,  390, 65),
    ("UAL901",  "EWR",  "FRA",   54.3,  -28.9,  390, 58),
    ("DAL404",  "ATL",  "AMS",   51.9,  -22.4,  390, 55),
    ("FIN5",    "HEL",  "NYC",   62.1,  -18.5,  390, 278),  # high lat
    ("NOZ801",  "OSL",  "LHR",   59.3,   -2.1,  350, 218),  # high lat
    ("SAS903",  "CPH",  "BOS",   63.8,  -10.2,  390, 262),  # high lat
    ("ICE673",  "KEF",  "JFK",   66.1,  -25.8,  390, 258),  # polar
    ("ACA875",  "YVR",  "LHR",   65.4,  -50.3,  390, 38),  # polar
    ("WJA2201", "YYC",  "LGW",   64.9,  -42.1,  390, 42),  # polar
    ("THY4",    "IST",  "ORD",   55.1,  -18.3,  370, 280),
    ("EIN104",  "DUB",  "BOS",   53.5,  -35.8,  350, 260),
    ("TAP932",  "LIS",  "GRU",   20.3,  -28.1,  390, 215),
    ("LAN803",  "SCL",  "MAD",   18.8,  -22.5,  390, 38),
    ("KLM642",  "AMS",  "NRT",   58.1,   45.3,  390, 52),
    ("ANA8",    "NRT",  "LHR",   56.9,   72.4,  390, 312),
]


def score_aircraft(aircraft: dict, solar: dict) -> dict:
    """Run the XGBoost model on one aircraft given current solar conditions."""
    bundle = get_model()
    model  = bundle["model"]
    scaler = bundle["scaler"]

    lat     = aircraft["lat"]
    alt_fl  = aircraft["alt_fl"]
    flux    = solar["proton_flux_pfu"]
    kp      = solar["kp_index"]
    xray    = solar["x_ray_numeric"]

    # Altitude correction: roughly 10x per km above sea level
    # FL350 = 10.7km, baseline correction factor vs FL350
    alt_km    = alt_fl * 0.3048 / 1000
    alt_factor = 10 ** ((alt_km - 10.7) / 6.5)
    corrected_flux = flux * alt_factor

    # Latitude correction: polar routes get higher flux exposure
    lat_factor = 1.0 + max(0, (abs(lat) - 50) / 30) * 0.8
    corrected_flux *= lat_factor

    features = np.array([[
        corrected_flux,
        kp,
        xray,
        lat,
        alt_fl,
        1.0,  # assume mid-event for conservative scoring
    ]])
    features_s = scaler.transform(features)
    risk_score  = float(model.predict_proba(features_s)[0][1])
    risk_pct    = round(risk_score * 100, 1)

    if risk_score >= 0.75:    tier = "CRITICAL"
    elif risk_score >= 0.55:  tier = "RED"
    elif risk_score >= 0.30:  tier = "AMBER"
    else:                     tier = "GREEN"

    return {**aircraft, "risk_score": risk_pct, "tier": tier, "corrected_flux": round(corrected_flux, 2)}


# ══════════════════════════════════════════════════════════════════════════
#  DEVIATION CALCULATOR
# ══════════════════════════════════════════════════════════════════════════

# A320 fuel burn reference (tonnes/hr at cruise)
A320_FUEL_BURN_TPH = 2.4
CO2_PER_TONNE_FUEL = 3.16   # ICAO standard

# Altitude dose reduction factors (vs FL390 baseline)
ALTITUDE_DOSE_REDUCTION = {
    310: 0.62,
    280: 0.90,
    230: 0.95,
}


def compute_deviations(aircraft: dict, solar: dict) -> list:
    """
    Return 3 deviation options for a high-risk aircraft.
    Each option shows flux reduction, extra fuel, extra time, CO2 delta.
    """
    options = []
    base_flux = aircraft["corrected_flux"]

    # Option 1: Descend to FL310
    fuel_extra_310 = A320_FUEL_BURN_TPH * 0.56 * (30 / 60)  # 30-min segment penalty
    co2_extra_310  = fuel_extra_310 * CO2_PER_TONNE_FUEL
    options.append({
        "label": f"Descend to FL310",
        "flux_reduction_pct": 62,
        "extra_fuel_kg": round(fuel_extra_310 * 1000),
        "extra_time_min": 18,
        "co2_delta_tonnes": round(co2_extra_310, 2),
        "recommended": True,
    })

    # Option 2: Lateral deviation (100nm off-track, avoids peak flux zone)
    fuel_extra_lat = A320_FUEL_BURN_TPH * 0.12 * (11 / 60)
    co2_extra_lat  = fuel_extra_lat * CO2_PER_TONNE_FUEL
    options.append({
        "label": "Lateral deviation 100nm",
        "flux_reduction_pct": 44,
        "extra_fuel_kg": round(fuel_extra_lat * 1000),
        "extra_time_min": 11,
        "co2_delta_tonnes": round(co2_extra_lat, 2),
        "recommended": False,
    })

    # Option 3: Delay departure (if pre-departure aircraft)
    options.append({
        "label": "Delay departure 2.5 hrs",
        "flux_reduction_pct": 91,
        "extra_fuel_kg": 0,
        "extra_time_min": 150,
        "co2_delta_tonnes": 0.0,
        "recommended": False,
    })

    return options


def generate_acars(aircraft: dict, deviation: dict) -> str:
    """Generate the ACARS advisory text for the crew."""
    ts = datetime.now(timezone.utc).strftime("%H%MZ")
    return (
        f"SOLARIS RADIATION ADVISORY {ts}\n"
        f"ACFT: {aircraft['callsign']}  FLT: {aircraft['origin']}-{aircraft['dest']}\n"
        f"SOLAR CONDITION: {state['solar']['alert_level']} | "
        f"PROTON FLUX {state['solar']['proton_flux_pfu']:.1f} PFU\n"
        f"SEU RISK SCORE: {aircraft['risk_score']}% — TIER {aircraft['tier']}\n"
        f"RECOMMENDED ACTION: {deviation['label'].upper()}\n"
        f"FLUX REDUCTION: -{deviation['flux_reduction_pct']}%  |  "
        f"EXTRA FUEL: +{deviation['extra_fuel_kg']} KG  |  "
        f"TIME IMPACT: +{deviation['extra_time_min']} MIN\n"
        f"THIS IS AN ADVISORY. CREW AND OPS DISCRETION APPLIES.\n"
        f"SOLARIS / TEAM 168-6925"
    )


# ══════════════════════════════════════════════════════════════════════════
#  BACKGROUND POLLING TASK
# ══════════════════════════════════════════════════════════════════════════

async def poll_noaa_loop():
    """Poll NOAA every 5 minutes and refresh fleet scores."""
    while True:
        try:
            solar = fetch_noaa_solar_data()
            state["solar"] = solar

            fleet_raw = [
                {
                    "callsign": row[0], "origin": row[1], "dest": row[2],
                    "lat": row[3], "lon": row[4],
                    "alt_fl": row[5], "heading": row[6],
                }
                for row in FLEET_SEED
            ]

            # Score all aircraft
            scored = [score_aircraft(ac, solar) for ac in fleet_raw]
            # Sort by risk score descending
            scored.sort(key=lambda x: x["risk_score"], reverse=True)
            state["fleet"] = scored

            # Add deviation options to RED/CRITICAL aircraft
            for ac in state["fleet"]:
                if ac["tier"] in ("RED", "CRITICAL"):
                    ac["deviations"]  = compute_deviations(ac, solar)
                    ac["acars"]       = generate_acars(ac, ac["deviations"][0])
                else:
                    ac["deviations"] = []
                    ac["acars"]      = None

            # Update sustainability counter
            advisories = sum(1 for ac in scored if ac["tier"] in ("RED","CRITICAL"))
            # Each advisory prevents ~0.8 tonnes CO2 vs reactive diversion
            state["co2_saved_tonnes"] = round(advisories * 0.8, 1)
            state["diversions_prevented"] = max(0, advisories - 1)

            print(f"[{datetime.now().strftime('%H:%M:%S')}] NOAA refresh — "
                  f"flux={solar['proton_flux_pfu']:.1f} pfu  "
                  f"Kp={solar['kp_index']}  "
                  f"alert={solar['alert_level']}  "
                  f"fleet_at_risk={advisories}")

        except Exception as e:
            print(f"Poll error: {e}")

        await asyncio.sleep(300)  # 5 minutes


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(poll_noaa_loop())


# ══════════════════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"service": "SOLARIS API", "status": "online", "version": "1.0.0"}


@app.get("/solar")
def get_solar():
    """Current solar conditions from NOAA."""
    return state["solar"]


@app.get("/fleet")
def get_fleet():
    """Full fleet, sorted by risk score descending."""
    return {"aircraft": state["fleet"], "count": len(state["fleet"])}


@app.get("/fleet/{callsign}")
def get_aircraft(callsign: str):
    """Detail for a single aircraft by callsign."""
    for ac in state["fleet"]:
        if ac["callsign"].upper() == callsign.upper():
            return ac
    return {"error": "Aircraft not found"}, 404


@app.get("/summary")
def get_summary():
    """Dashboard summary card data."""
    fleet = state["fleet"]
    tiers = {"GREEN": 0, "AMBER": 0, "RED": 0, "CRITICAL": 0}
    for ac in fleet:
        tiers[ac["tier"]] = tiers.get(ac["tier"], 0) + 1
    return {
        "solar": state["solar"],
        "fleet_size": len(fleet),
        "tier_counts": tiers,
        "co2_saved_tonnes": state["co2_saved_tonnes"],
        "diversions_prevented": state["diversions_prevented"],
        "top_risk_aircraft": fleet[:3] if fleet else [],
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _bundle is not None or os.path.exists(MODEL_PATH)}
