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

  const { type = 'all' } = req.query;
  
  const endpoints = {
    protons: 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-plot-6-hour.json',
    kp: 'https://services.swpc.noaa.gov/json/planetary_k_index_1m.json',
    solarWind: 'https://services.swpc.noaa.gov/products/summary/solar-wind-mag-field.json',
    forecast: 'https://services.swpc.noaa.gov/text/3-day-forecast.txt'
  };

  try {
    if (type === 'protons') {
      const response = await fetch(endpoints.protons);
      if (!response.ok) throw new Error(`NOAA Protons API Error: ${response.status}`);
      const data = await response.json();
      return res.status(200).json(data);
    } 
    
    if (type === 'kp') {
      const response = await fetch(endpoints.kp);
      if (!response.ok) throw new Error(`NOAA Kp API Error: ${response.status}`);
      const data = await response.json();
      return res.status(200).json(data);
    }
    
    if (type === 'solar-wind') {
      const response = await fetch(endpoints.solarWind);
      if (!response.ok) throw new Error(`NOAA Solar Wind API Error: ${response.status}`);
      const data = await response.json();
      return res.status(200).json(data);
    }
    
    if (type === 'forecast') {
      const response = await fetch(endpoints.forecast);
      if (!response.ok) throw new Error(`NOAA Forecast API Error: ${response.status}`);
      const data = await response.text();
      return res.status(200).send(data);
    }
    
    if (type === 'all') {
      const results = {
        proton_flux_pfu: 0,
        kp_index: 0,
        solar_wind_speed: 0,
        x_ray_class_raw: "A",
        alert_level: "GREEN",
        last_updated: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        errors: []
      };

      try {
        const pRes = await fetch(endpoints.protons);
        if (pRes.ok) {
          const pData = await pRes.json();
          // Find last entry for >=10 MeV
          const meV10Data = pData.filter(d => d.energy === '>=10 MeV');
          if (meV10Data.length > 0) {
            const lastEntry = meV10Data[meV10Data.length - 1];
            results.proton_flux_pfu = lastEntry.flux;
            results.last_updated = lastEntry.time_tag;
            
            const flux = results.proton_flux_pfu;
            results.alert_level = flux >= 1000 ? 'CRITICAL' : flux >= 100 ? 'RED' : flux >= 10 ? 'AMBER' : 'GREEN';
            
            // Very rough approximation for X-ray class based on proton flux if we don't have direct X-ray data
            // In reality, X-ray class comes from a different endpoint, but for this demo, we'll estimate or use a placeholder
            // Let's fetch the x-ray data too
             try {
                const xRes = await fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json');
                if (xRes.ok) {
                    const xData = await xRes.json();
                    if(xData && xData.length > 0) {
                        const lastX = xData[xData.length - 1];
                        const xFlux = lastX.flux;
                        if(xFlux >= 1e-4) results.x_ray_class_raw = 'X';
                        else if(xFlux >= 1e-5) results.x_ray_class_raw = 'M';
                        else if(xFlux >= 1e-6) results.x_ray_class_raw = 'C';
                        else if(xFlux >= 1e-7) results.x_ray_class_raw = 'B';
                        else results.x_ray_class_raw = 'A';
                    }
                }
             } catch(e) {
                 results.errors.push({type: 'xray', error: e.message});
             }
          }
        } else {
            results.errors.push({type: 'protons', error: `Status ${pRes.status}`});
        }
      } catch (e) {
        results.errors.push({type: 'protons', error: e.message});
      }

      try {
        const kRes = await fetch(endpoints.kp);
        if (kRes.ok) {
          const kData = await kRes.json();
          if (kData.length > 0) {
            // New format (updated March/April 2026): array of objects
            const lastEntry = kData[kData.length - 1];
            results.kp_index = lastEntry.kp_index !== undefined ? lastEntry.kp_index : (lastEntry.Kp || 0);
          }
        } else {
            results.errors.push({type: 'kp', error: `Status ${kRes.status}`});
        }
      } catch (e) {
        results.errors.push({type: 'kp', error: e.message});
      }

      try {
        const swRes = await fetch(endpoints.solarWind);
        if (swRes.ok) {
          const swData = await swRes.json();
          results.solar_wind_speed = swData.WindSpeed || swData.solar_wind_speed || 0;
        } else {
             results.errors.push({type: 'solarWind', error: `Status ${swRes.status}`});
        }
      } catch (e) {
        results.errors.push({type: 'solarWind', error: e.message});
      }

      return res.status(200).json(results);
    }
    
    return res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error) {
    console.error('NOAA Proxy Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
