// ─── DEMO MODE: Oct 30 2025 SPE Scenario ───

export const DEMO_SOLAR = {
  proton_flux_pfu: 4200,
  kp_index: 8.0,
  x_ray_class_raw: "X2.8",
  x_ray_numeric: 280,
  alert_level: "CRITICAL",
  last_updated: "2025-10-30T17:48:00+00:00",
};

const DEMO_DEVIATIONS = [
  { label: "Descend to FL310", flux_reduction_pct: 62, extra_fuel_kg: 340, extra_time_min: 18, co2_delta_tonnes: 1.1, recommended: true },
  { label: "Lateral deviation 100nm", flux_reduction_pct: 44, extra_fuel_kg: 180, extra_time_min: 11, co2_delta_tonnes: 0.6, recommended: false },
  { label: "Delay departure 2.5 hrs", flux_reduction_pct: 91, extra_fuel_kg: 0, extra_time_min: 150, co2_delta_tonnes: 0.0, recommended: false },
];

const DEMO_ACARS_ICE673 = `SOLARIS RADIATION ADVISORY 1748Z
ACFT: ICE673  FLT: KEF-JFK
SOLAR CONDITION: CRITICAL | PROTON FLUX 4200.0 PFU
SEU RISK SCORE: 97.2% — TIER CRITICAL
RECOMMENDED ACTION: DESCEND TO FL310
FLUX REDUCTION: -62%  |  EXTRA FUEL: +340 KG  |  TIME IMPACT: +18 MIN
THIS IS AN ADVISORY. CREW AND OPS DISCRETION APPLIES.
SOLARIS / TEAM 168-6925`;

// Overrides keyed by callsign — only these 4 get modified
export const DEMO_AIRCRAFT_OVERRIDES = {
  ICE673: {
    risk_score: 97.2,
    tier: "CRITICAL",
    corrected_flux: 4180,
    deviations: DEMO_DEVIATIONS,
    acars: DEMO_ACARS_ICE673,
  },
  ACA875: {
    risk_score: 94.8,
    tier: "CRITICAL",
    corrected_flux: 3920,
    deviations: DEMO_DEVIATIONS,
    acars: null,
  },
  SAS903: {
    risk_score: 89.1,
    tier: "RED",
    corrected_flux: 2840,
    deviations: DEMO_DEVIATIONS,
    acars: null,
  },
  FIN5: {
    risk_score: 82.4,
    tier: "RED",
    corrected_flux: 2210,
    deviations: DEMO_DEVIATIONS,
    acars: null,
  },
};

export const DEMO_SUMMARY = {
  co2_saved_tonnes: 28.4,
  diversions_prevented: 3,
  fleet_at_risk: 4,
};

const BASE_FLEET = [
  { callsign: "IBE6274", origin: "MAD", dest: "JFK", lat: 52.1, lon: -20.3, alt_fl: 390, heading: 285, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "BAW178", origin: "LHR", dest: "ORD", lat: 55.8, lon: -30.1, alt_fl: 370, heading: 270, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "AFR084", origin: "CDG", dest: "LAX", lat: 48.5, lon: -15.2, alt_fl: 390, heading: 292, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "DLH401", origin: "FRA", dest: "YYZ", lat: 53.2, lon: -25.6, alt_fl: 350, heading: 278, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "UAE201", origin: "DXB", dest: "LHR", lat: 44.1, lon: 18.3, alt_fl: 390, heading: 310, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "QFA1", origin: "SYD", dest: "LAX", lat: 12.3, lon: -155.8, alt_fl: 390, heading: 45, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "SIA321", origin: "SIN", dest: "LHR", lat: 30.5, lon: 62.1, alt_fl: 390, heading: 315, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "EZY8820", origin: "LGW", dest: "FCO", lat: 45.3, lon: 12.1, alt_fl: 310, heading: 145, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "RYR4401", origin: "STN", dest: "AGP", lat: 42.1, lon: -5.3, alt_fl: 350, heading: 195, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "VLG6102", origin: "BCN", dest: "PMI", lat: 41.5, lon: 2.8, alt_fl: 280, heading: 112, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "AAL100", origin: "JFK", dest: "LHR", lat: 52.8, lon: -32.1, alt_fl: 390, heading: 65, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "UAL901", origin: "EWR", dest: "FRA", lat: 54.3, lon: -28.9, alt_fl: 390, heading: 58, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "DAL404", origin: "ATL", dest: "AMS", lat: 51.9, lon: -22.4, alt_fl: 390, heading: 55, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "FIN5", origin: "HEL", dest: "NYC", lat: 62.1, lon: -18.5, alt_fl: 390, heading: 278, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "NOZ801", origin: "OSL", dest: "LHR", lat: 59.3, lon: -2.1, alt_fl: 350, heading: 218, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "SAS903", origin: "CPH", dest: "BOS", lat: 63.8, lon: -10.2, alt_fl: 390, heading: 262, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "ICE673", origin: "KEF", dest: "JFK", lat: 66.1, lon: -25.8, alt_fl: 390, heading: 258, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "ACA875", origin: "YVR", dest: "LHR", lat: 65.4, lon: -50.3, alt_fl: 390, heading: 38, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "WJA2201", origin: "YYC", dest: "LGW", lat: 64.9, lon: -42.1, alt_fl: 390, heading: 42, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "THY4", origin: "IST", dest: "ORD", lat: 55.1, lon: -18.3, alt_fl: 370, heading: 280, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "EIN104", origin: "DUB", dest: "BOS", lat: 53.5, lon: -35.8, alt_fl: 350, heading: 260, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "TAP932", origin: "LIS", dest: "GRU", lat: 20.3, lon: -28.1, alt_fl: 390, heading: 215, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "LAN803", origin: "SCL", dest: "MAD", lat: 18.8, lon: -22.5, alt_fl: 390, heading: 38, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "KLM642", origin: "AMS", dest: "NRT", lat: 58.1, lon: 45.3, alt_fl: 390, heading: 52, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
  { callsign: "ANA8", origin: "NRT", dest: "LHR", lat: 56.9, lon: 72.4, alt_fl: 390, heading: 312, risk_score: 0.2, tier: "GREEN", corrected_flux: 0.1 },
];

/**
 * Apply demo overrides to a live fleet response.
 * Merges the 4 demo aircraft into the fleet, re-sorts by risk descending.
 */
export function applyDemoOverrides(liveFleet) {
  const baseAircraft = liveFleet?.aircraft || BASE_FLEET;

  const merged = baseAircraft.map(ac => {
    const override = DEMO_AIRCRAFT_OVERRIDES[ac.callsign];
    if (override) {
      return { ...ac, ...override };
    }
    return ac;
  });

  // Sort highest risk first
  merged.sort((a, b) => b.risk_score - a.risk_score);

  return { ...liveFleet, aircraft: merged, count: merged.length };
}
