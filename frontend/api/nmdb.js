export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Add Cache headers (60 seconds)
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');

  const url = `https://www.nmdb.eu/nest/draw_graph.php?formchk=1&stations[]=JUNG&stations[]=THUL&stations[]=NEWK&tabchoice=revori&dtype=corr_for_efficiency&tresolution=60&yunits=0&date_choice=bydate&start_day=${dd}&start_month=${mm}&start_year=${yyyy}&start_hour=00&start_min=00&end_day=${dd}&end_month=${mm}&end_year=${yyyy}&end_hour=23&end_min=59&output=ascii`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`NMDB API Error: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Parse ASCII response
    const lines = text.split('\n');
    let lastValidLine = null;
    
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        // Skip comments and empty lines, wait for a line starting with a date e.g. 2026-05-22
        if (line && !line.startsWith('#') && line.match(/^\d{4}-\d{2}-\d{2}/)) {
            // Check if it has 3 values after the timestamp (which is YYYY-MM-DD HH:MM)
            const parts = line.split(/\s+/);
            if (parts.length >= 5) { // Date, Time, Val1, Val2, Val3
                lastValidLine = parts;
                break;
            }
        }
    }

    if (lastValidLine) {
        // parts[0] = YYYY-MM-DD, parts[1] = HH:MM:SS
        const valJung = parseFloat(lastValidLine[2]);
        const valThul = parseFloat(lastValidLine[3]);
        const valNewk = parseFloat(lastValidLine[4]);
        
        let validVals = [];
        if (!isNaN(valJung) && valJung > 0) validVals.push(valJung);
        if (!isNaN(valThul) && valThul > 0) validVals.push(valThul);
        if (!isNaN(valNewk) && valNewk > 0) validVals.push(valNewk);
        
        const avg = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : 5000;

        return res.status(200).json({
            stations: [
                { name: "JUNG", count: isNaN(valJung) ? 0 : valJung, location: "Jungfraujoch, Switzerland" },
                { name: "THUL", count: isNaN(valThul) ? 0 : valThul, location: "Thule, Greenland" },
                { name: "NEWK", count: isNaN(valNewk) ? 0 : valNewk, location: "Newark, USA" }
            ],
            average: avg,
            fallback: false,
            timestamp: new Date().toISOString()
        });
    }

    // Fallback if no valid lines found
    return res.status(200).json({
        stations: [],
        average: 5000,
        fallback: true,
        timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('NMDB Proxy Error:', error);
    return res.status(200).json({ // Return 200 with fallback to prevent UI crash
        stations: [],
        average: 5000,
        fallback: true,
        error: error.message,
        timestamp: new Date().toISOString()
    });
  }
}
