// Base API functions removed - now using src/services/liveApi.js

export function metersToFlightLevel(meters) {
  return Math.round((meters * 3.28084) / 100);
}

export function deriveSolarAlertLevel(protonFlux) {
  if (protonFlux >= 1000) return 'CRITICAL';
  if (protonFlux >= 100) return 'RED';
  if (protonFlux >= 10) return 'AMBER';
  return 'GREEN';
}

export function tierColor(tier) {
  switch (tier) {
    case 'GREEN': return '#00ff88';
    case 'AMBER': return '#ffaa00';
    case 'RED': return '#ff4444';
    case 'CRITICAL': return '#cc00ff';
    default: return '#6b7280';
  }
}

export function tierClass(tier) {
  switch (tier) {
    case 'GREEN': return 'tier-green';
    case 'AMBER': return 'tier-amber';
    case 'RED': return 'tier-red';
    case 'CRITICAL': return 'tier-critical';
    default: return '';
  }
}

export function tierBgClass(tier) {
  switch (tier) {
    case 'GREEN': return 'tier-bg-green';
    case 'AMBER': return 'tier-bg-amber';
    case 'RED': return 'tier-bg-red';
    case 'CRITICAL': return 'tier-bg-critical';
    default: return '';
  }
}

// Normalize risk score: Backend already returns 0-100 percentage.
export function displayScore(riskScore) {
  return parseFloat(Number(riskScore).toFixed(1));
}

// Airport rough coordinates for drawing route lines
export const AIRPORT_COORDS = {
  MAD: [40.47, -3.56], JFK: [40.64, -73.78], LHR: [51.47, -0.46],
  ORD: [41.97, -87.91], CDG: [49.01, 2.55], LAX: [33.94, -118.41],
  FRA: [50.03, 8.57], YYZ: [43.68, -79.63], DXB: [25.25, 55.36],
  SYD: [-33.95, 151.18], SIN: [1.36, 103.99], LGW: [51.15, -0.19],
  FCO: [41.80, 12.25], STN: [51.89, 0.26], AGP: [36.67, -4.49],
  BCN: [41.30, 2.08], PMI: [39.55, 2.74], EWR: [40.69, -74.17],
  AMS: [52.31, 4.76], ATL: [33.64, -84.43], HEL: [60.32, 24.96],
  NYC: [40.64, -73.78], OSL: [60.19, 11.10], CPH: [55.62, 12.66],
  BOS: [42.36, -71.01], KEF: [63.99, -22.61], YVR: [49.19, -123.18],
  YYC: [51.13, -114.02], IST: [41.26, 28.73], DUB: [53.42, -6.27],
  LIS: [38.78, -9.14], GRU: [-23.43, -46.47], SCL: [-33.39, -70.79],
  NRT: [35.76, 140.39],
};
