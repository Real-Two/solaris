function getBearing(lat1, lon1, lat2, lon2) {
    const toRad = x => x * Math.PI / 180;
    const toDeg = x => x * 180 / Math.PI;
    const phi1 = toRad(lat1), phi2 = toRad(lat2);
    const dLam = toRad(lon2 - lon1);
    const y = Math.sin(dLam) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLam);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const airports = {
  JFK: [40.64, -73.78], LHR: [51.47, -0.46], CDG: [49.01, 2.55],
  FRA: [50.03, 8.57], YYZ: [43.68, -79.63], AMS: [52.31, 4.76],
  EWR: [40.69, -74.17], BOS: [42.36, -71.01], YVR: [49.19, -123.18],
  CPH: [55.62, 12.66], KEF: [63.99, -22.61], OSL: [60.19, 11.10]
};

const routes = [
    { callsign: "UAL14", origin: "EWR", dest: "LHR", lat: 51.5, lon: -40.2 },
    { callsign: "DAL99", origin: "BOS", dest: "CDG", lat: 48.2, lon: -35.1 },
    { callsign: "BAW203", origin: "LHR", dest: "BOS", lat: 53.1, lon: -25.8 },
    { callsign: "AFR22", origin: "CDG", dest: "JFK", lat: 51.4, lon: -20.5 },
    { callsign: "KLM641", origin: "AMS", dest: "JFK", lat: 54.2, lon: -30.9 },
    { callsign: "DLH418", origin: "FRA", dest: "IAD", lat: 52.8, lon: -32.5 }, // IAD is 38.95, -77.45
    { callsign: "ACA855", origin: "LHR", dest: "YVR", lat: 60.1, lon: -15.3 },
    { callsign: "VIR11", origin: "LHR", dest: "BOS", lat: 52.5, lon: -45.1 },
    { callsign: "SAS925", origin: "CPH", dest: "IAD", lat: 59.2, lon: -28.4 },
    { callsign: "ICE615", origin: "KEF", dest: "JFK", lat: 60.1, lon: -35.2 },
    { callsign: "FIN6", origin: "JFK", dest: "HEL", lat: 58.4, lon: -45.8 },
    { callsign: "UAE202", origin: "JFK", dest: "DXB", lat: 45.2, lon: -50.1 },
    { callsign: "QTR701", origin: "DOH", dest: "JFK", lat: 48.5, lon: -40.2 },
    { callsign: "SWR14", origin: "ZRH", dest: "JFK", lat: 50.1, lon: -28.4 },
    { callsign: "AUA87", origin: "VIE", dest: "JFK", lat: 51.5, lon: -33.1 },
    { callsign: "LOT26", origin: "WAW", dest: "JFK", lat: 54.2, lon: -25.8 },
    { callsign: "AAL104", origin: "JFK", dest: "LHR", lat: 52.8, lon: -15.2 },
    { callsign: "JBU43", origin: "JFK", dest: "LHR", lat: 51.2, lon: -20.5 },
    { callsign: "WJA3", origin: "LGW", dest: "YYZ", lat: 55.4, lon: -38.2 },
    { callsign: "TSC11", origin: "LGW", dest: "YYZ", lat: 54.2, lon: -40.1 },
    { callsign: "TAP201", origin: "LIS", dest: "EWR", lat: 40.5, lon: -45.2 },
    { callsign: "IBE6251", origin: "MAD", dest: "JFK", lat: 42.1, lon: -35.8 },
    { callsign: "AZA604", origin: "FCO", dest: "JFK", lat: 45.8, lon: -25.1 },
    { callsign: "THY1", origin: "IST", dest: "JFK", lat: 48.5, lon: -15.2 },
    { callsign: "ELY1", origin: "TLV", dest: "JFK", lat: 49.2, lon: -10.5 }
];

const IAD = [38.95, -77.45];
const DXB = [25.25, 55.36];
const DOH = [25.26, 51.56];
const ZRH = [47.46, 8.54];
const VIE = [48.11, 16.56];
const WAW = [52.16, 20.96];
const LIS = [38.78, -9.14];
const MAD = [40.47, -3.56];
const FCO = [41.80, 12.25];
const IST = [41.26, 28.73];
const TLV = [32.01, 34.88];

const allAirports = { ...airports, IAD, DXB, DOH, ZRH, VIE, WAW, LIS, MAD, FCO, IST, TLV };

const out = routes.map(r => {
    const dest = allAirports[r.dest];
    if (!dest) console.log("Missing dest", r.dest);
    const heading = Math.round(getBearing(r.lat, r.lon, dest[0], dest[1]));
    return `{ callsign: "${r.callsign}", origin_country: "Live", origin: "${r.origin}", dest: "${r.dest}", lat: ${r.lat}, lon: ${r.lon}, altitude_m: 11000, alt_fl: 360, heading: ${heading}, velocity: 250, vertical_rate: 0, last_contact: Math.floor(Date.now()/1000) }`;
});

console.log(out.join(",\n"));
