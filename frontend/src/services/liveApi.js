// Helper with retry logic
async function fetchWithRetry(url, retries = 1, delay = 2000) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (retries > 0) {
      console.warn(`Fetch failed for ${url}, retrying in ${delay}ms...`, err);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, retries - 1, delay * 2);
    }
    throw err;
  }
}

// Fetch live NOAA solar data
export async function fetchLiveNOAA() {
  return fetchWithRetry('/api/noaa?type=all');
}

// Fetch live NMDB neutron monitor data  
export async function fetchLiveNMDB() {
  return fetchWithRetry('/api/nmdb');
}

// Fetch live flights from OpenSky
export async function fetchLiveFlights() {
  return fetchWithRetry('/api/opensky');
}

// Orchestrate all live data fetching with error isolation
export async function fetchAllLiveData() {
  const results = { solar: null, nmdb: null, flights: null, errors: [] };
  
  const tasks = [
    fetchLiveNOAA()
        .then(d => { if(d.errors && d.errors.length === 3) throw new Error("NOAA Failed"); results.solar = d; })
        .catch(e => { results.errors.push({api: 'noaa', error: e.message}); }),
    fetchLiveNMDB()
        .then(d => { if(d.error) throw new Error(d.error); results.nmdb = d; })
        .catch(e => { results.errors.push({api: 'nmdb', error: e.message}); }),
    fetchLiveFlights()
        .then(d => { if(d.error) throw new Error(d.error); results.flights = d; })
        .catch(e => { results.errors.push({api: 'opensky', error: e.message}); }),
  ];
  
  await Promise.allSettled(tasks);
  return results;
}
