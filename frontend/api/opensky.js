export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Add Cache headers (120 seconds for rate limits)
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  const clientId = process.env.OPENSKY_CLIENT_ID;
  const clientSecret = process.env.OPENSKY_CLIENT_SECRET;
  
  const headers = {};
  if (clientId && clientSecret) {
      headers['Authorization'] = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');
  }

  // North Atlantic Bounding Box
  const url = 'https://opensky-network.org/api/states/all?lamin=40&lomin=-80&lamax=75&lomax=30';

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`OpenSky API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    let aircraft = [];
    if (data && data.states) {
        aircraft = data.states
            .filter(state => {
                // Filter out ground traffic, missing coords, missing callsigns
                if (state[8]) return false; // on_ground
                if (state[5] === null || state[6] === null) return false;
                if (!state[1] || state[1].trim() === '') return false;
                if (state[7] === null || state[7] < 5000) return false; // Must be > 5000m
                return true;
            })
            .map(state => {
                const meters = state[7];
                return {
                    callsign: state[1].trim(),
                    origin_country: state[2],
                    lat: state[6],
                    lon: state[5],
                    altitude_m: meters,
                    alt_fl: Math.round((meters * 3.28084) / 100),
                    heading: state[10],
                    velocity: state[9],
                    vertical_rate: state[11],
                    last_contact: state[4]
                };
            });
    }

    return res.status(200).json({
        aircraft,
        count: aircraft.length,
        timestamp: new Date().toISOString(),
        bounding_box: { lamin: 40, lomin: -80, lamax: 75, lomax: 30 }
    });

  } catch (error) {
    console.error('OpenSky Proxy Error:', error);
    return res.status(200).json({ // Return 200 to prevent complete crash
        aircraft: [],
        count: 0,
        error: error.message,
        timestamp: new Date().toISOString()
    });
  }
}
