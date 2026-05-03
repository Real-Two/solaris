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

/**
 * Apply demo overrides to a live fleet response.
 * Merges the 4 demo aircraft into the fleet, re-sorts by risk descending.
 */
export function applyDemoOverrides(liveFleet) {
  if (!liveFleet?.aircraft) return liveFleet;

  const merged = liveFleet.aircraft.map(ac => {
    const override = DEMO_AIRCRAFT_OVERRIDES[ac.callsign];
    if (override) {
      return { ...ac, ...override };
    }
    return ac;
  });

  // Sort highest risk first
  merged.sort((a, b) => b.risk_score - a.risk_score);

  return { ...liveFleet, aircraft: merged };
}
