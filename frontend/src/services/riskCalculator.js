export function deriveSolarAlertLevel(protonFlux) {
    if (protonFlux >= 1000) return 'CRITICAL';
    if (protonFlux >= 100) return 'RED';
    if (protonFlux >= 10) return 'AMBER';
    return 'GREEN';
}

export function calculateSEURisk(flight, noaaData, nmdbData) {
    const flightLevel = flight.alt_fl || 0;
    const latitude = flight.lat || 0;
    const protonFlux = noaaData?.proton_flux_pfu || 0;
    const neutronCount = nmdbData?.average || 5000;

    // Altitude factor: exponential increase above FL250
    // At FL250 = 1.0, FL400 = ~2.7
    let altFactor = 1.0;
    if (flightLevel > 250) {
        altFactor = Math.exp((flightLevel - 250) / 150);
    }

    // Latitude factor: 1x at equator, 10x at poles
    const latFactor = 1 + (Math.abs(latitude) / 90) * 9;

    // Solar factor: spikes during solar storms
    const solarFactor = 1 + (protonFlux / 1000);

    // GCR factor: normalized typical count (~5000 counts/s)
    const gcrFactor = neutronCount / 5000;

    // Combined SEU probability (0-100 scale)
    const rawScore = (altFactor * latFactor * solarFactor * gcrFactor) * 1.5; // Multiplier to make scores realistic
    const score = Math.min(100, Math.max(0, rawScore));

    let tier = 'GREEN';
    if (score >= 75) tier = 'CRITICAL';
    else if (score >= 50) tier = 'RED';
    else if (score >= 25) tier = 'AMBER';

    const correctedFlux = protonFlux * latFactor * (altFactor / 2);

    return {
        score,
        tier,
        factors: {
            altitude: { value: flightLevel, factor: altFactor, description: 'Altitude radiation scaling' },
            latitude: { value: latitude, factor: latFactor, description: 'Geomagnetic latitude effect' },
            solar: { value: protonFlux, factor: solarFactor, description: 'Solar proton storm impact' },
            gcr: { value: neutronCount, factor: gcrFactor, description: 'Galactic cosmic ray baseline' }
        },
        corrected_flux: correctedFlux
    };
}

export function calculateFleetRisk(flights, noaaData, nmdbData) {
    if (!flights || !Array.isArray(flights)) return [];
    
    const enriched = flights.map(flight => {
        const risk = calculateSEURisk(flight, noaaData, nmdbData);
        return {
            ...flight,
            risk_score: risk.score,
            tier: risk.tier,
            corrected_flux: risk.corrected_flux
        };
    });

    // Sort by risk score descending
    return enriched.sort((a, b) => b.risk_score - a.risk_score);
}
