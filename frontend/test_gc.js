function greatCircle(lat1, lon1, lat2, lon2, points = 30) {
  const toRad = x => x * Math.PI / 180;
  const toDeg = x => x * 180 / Math.PI;
  
  const phi1 = toRad(lat1), lam1 = toRad(lon1);
  const phi2 = toRad(lat2), lam2 = toRad(lon2);
  
  const dLam = lam2 - lam1;
  const sinPhi1 = Math.sin(phi1), cosPhi1 = Math.cos(phi1);
  const sinPhi2 = Math.sin(phi2), cosPhi2 = Math.cos(phi2);
  
  // Central angle
  const deltaSigma = Math.acos(sinPhi1 * sinPhi2 + cosPhi1 * cosPhi2 * Math.cos(dLam));
  if (deltaSigma === 0) return [[lat1, lon1]];
  
  const route = [];
  for (let i = 0; i <= points; i++) {
    const f = i / points;
    const a = Math.sin((1 - f) * deltaSigma) / Math.sin(deltaSigma);
    const b = Math.sin(f * deltaSigma) / Math.sin(deltaSigma);
    const x = a * cosPhi1 * Math.cos(lam1) + b * cosPhi2 * Math.cos(lam2);
    const y = a * cosPhi1 * Math.sin(lam1) + b * cosPhi2 * Math.sin(lam2);
    const z = a * sinPhi1 + b * sinPhi2;
    const phi = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    const lam = Math.atan2(y, x);
    route.push([toDeg(phi), toDeg(lam)]);
  }
  return route;
}

console.log(greatCircle(51, -114, 51, 0, 5));
