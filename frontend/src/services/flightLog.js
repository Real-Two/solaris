const LOG_KEY = 'solaris_flight_log';
const SEED_KEY = 'solaris_log_seeded';

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

export function logDecision(entry) {
    const logs = getFlightLog({});
    const newEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        outcome: 'pending',
        notes: '',
        ...entry
    };
    
    logs.unshift(newEntry);
    
    // Keep max 10000
    if (logs.length > 10000) logs.length = 10000;
    
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    return newEntry;
}

export function getFlightLog(options = {}) {
    const { dateRange = 'all', decision = 'all', search = '' } = options;
    
    let logs = [];
    try {
        const stored = localStorage.getItem(LOG_KEY);
        if (stored) logs = JSON.parse(stored);
    } catch(e) {
        console.error("Error reading log", e);
    }

    if (logs.length === 0) return [];

    let filtered = logs;

    if (decision !== 'all') {
        filtered = filtered.filter(l => l.decision === decision);
    }

    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(l => 
            l.callsign?.toLowerCase().includes(s) || 
            l.route?.toLowerCase().includes(s) ||
            l.notes?.toLowerCase().includes(s)
        );
    }

    if (dateRange !== 'all') {
        const now = new Date();
        const cutoff = new Date();
        if (dateRange === '7d') cutoff.setDate(now.getDate() - 7);
        if (dateRange === '30d') cutoff.setDate(now.getDate() - 30);
        if (dateRange === '90d') cutoff.setDate(now.getDate() - 90);
        
        filtered = filtered.filter(l => new Date(l.timestamp) >= cutoff);
    }

    return filtered;
}

export function updateOutcome(id, outcome, notes) {
    const logs = getFlightLog({});
    const idx = logs.findIndex(l => l.id === id);
    if (idx >= 0) {
        logs[idx].outcome = outcome;
        if (notes !== undefined) logs[idx].notes = notes;
        localStorage.setItem(LOG_KEY, JSON.stringify(logs));
        return true;
    }
    return false;
}

export function getAnalytics() {
    const logs = getFlightLog({});
    const totalMonitored = logs.length;
    const deviations = logs.filter(l => l.decision === 'DEVIATE').length;
    const noGos = logs.filter(l => l.decision === 'NO-GO').length;
    
    return {
        totalMonitored,
        deviationsRecommended: deviations,
        noGoCount: noGos,
        co2SavedTonnes: (deviations * 9.5) + (noGos * 22),
        incidentsPrevented: noGos + Math.floor(deviations * 0.2), // rough estimate
        avgRiskReduction: 42.5, // placeholder
        weeklyAccuracy: [
            { week: 1, accuracy: 82 },
            { week: 2, accuracy: 85 },
            { week: 3, accuracy: 89 },
            { week: 4, accuracy: 91 },
            { week: 5, accuracy: 94 }
        ],
        regionalTrends: [
            { region: 'North Atlantic', events: Math.round(deviations * 0.6) },
            { region: 'Pacific', events: Math.round(deviations * 0.2) },
            { region: 'Arctic', events: Math.round(deviations * 0.15) },
            { region: 'Equatorial', events: Math.round(deviations * 0.05) }
        ],
        deviationEffectiveness: []
    };
}

export function exportCSV() {
    const logs = getFlightLog({});
    if(logs.length === 0) return;

    const headers = ['Date/Time', 'Flight', 'Route', 'Risk Score', 'Tier', 'Decision', 'Confidence', 'Outcome', 'Notes'];
    const rows = logs.map(l => [
        `"${new Date(l.timestamp).toLocaleString()}"`,
        `"${l.callsign || ''}"`,
        `"${l.route || ''}"`,
        l.riskScore || 0,
        `"${l.tier || ''}"`,
        `"${l.decision || ''}"`,
        l.confidence || 0,
        `"${l.outcome || ''}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solaris_flight_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function seedHistoricalData() {
    if (localStorage.getItem(SEED_KEY)) return;

    const callsigns = ['BAW117', 'AFR22', 'DLH400', 'ICE673', 'ACA875', 'SAS903', 'FIN5', 'AAL100', 'UAL15', 'DAL44'];
    const routes = ['LHR-JFK', 'CDG-LAX', 'FRA-JFK', 'KEF-JFK', 'YVR-LHR', 'CPH-BOS', 'HEL-JFK', 'LHR-ORD'];
    
    const logs = [];
    const now = new Date();
    
    for (let i = 0; i < 200; i++) {
        const date = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        const r = Math.random();
        
        let decision = 'GO';
        let tier = 'GREEN';
        let score = Math.random() * 24;
        
        if (r > 0.9) {
            decision = 'NO-GO';
            tier = 'CRITICAL';
            score = 75 + Math.random() * 25;
        } else if (r > 0.7) {
            decision = 'DEVIATE';
            tier = Math.random() > 0.5 ? 'AMBER' : 'RED';
            score = 25 + Math.random() * 45;
        }

        logs.push({
            id: generateId(),
            timestamp: date.toISOString(),
            callsign: callsigns[Math.floor(Math.random() * callsigns.length)],
            route: routes[Math.floor(Math.random() * routes.length)],
            riskScore: score.toFixed(1),
            tier,
            decision,
            confidence: Math.round(80 + Math.random() * 19),
            outcome: decision === 'GO' ? 'Completed' : (decision === 'DEVIATE' ? 'Accepted' : 'Rescheduled'),
            notes: decision === 'DEVIATE' ? '-45% SEU exposure' : ''
        });
    }

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    localStorage.setItem(SEED_KEY, 'true');
}
