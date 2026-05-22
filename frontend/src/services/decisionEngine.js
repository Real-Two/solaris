export function assessFlightDecision(flight, seuRisk) {
    const score = seuRisk.score;
    const lat = Math.abs(flight.lat);

    if (score < 25 || (score < 40 && lat < 55)) {
        return {
            decision: 'GO',
            confidence: Math.round(90 + Math.random() * 9),
            reason: 'Route has minimal radiation exposure',
            action: 'Proceed with planned route',
            details: {}
        };
    }

    if ((score >= 25 && score <= 65) && lat >= 55) {
        return {
            decision: 'DEVIATE',
            confidence: Math.round(80 + Math.random() * 12),
            reason: 'Moderate risk zone — altitude deviation recommended',
            action: 'Descend to FL310 to reduce radiation exposure',
            details: {
                fuelImpact: `+${Math.round(150 + Math.random() * 300)} kg`,
                timeImpact: `+${Math.round(5 + Math.random() * 20)} minutes`,
                riskReduction: `-${Math.round(35 + Math.random() * 30)}% SEU exposure`,
                newAltitude: 'FL310'
            }
        };
    }

    return {
        decision: 'NO-GO',
        confidence: Math.round(85 + Math.random() * 10),
        reason: 'High radiation zone — rescheduling recommended',
        action: 'Recommend rescheduling flight by 4-6 hours',
        details: {
            alternatives: [
                'Delay departure until radiation subsides',
                'Consider lower altitude route',
                'Transfer passengers to next available service'
            ],
            estimatedClearTime: `${Math.round(2 + Math.random() * 6)} hours`
        }
    };
}

export function getDecisionColor(decision) {
    switch(decision) {
        case 'GO': return '#00ff88';
        case 'DEVIATE': return '#00d4ff';
        case 'NO-GO': return '#ff4444';
        default: return '#a0aec0';
    }
}

export function getDecisionIcon(decision) {
    switch(decision) {
        case 'GO': return '✓';
        case 'DEVIATE': return '⤴';
        case 'NO-GO': return '⊗';
        default: return '?';
    }
}
