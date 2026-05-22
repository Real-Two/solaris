import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import BottomBar from './components/BottomBar';
import ErrorBanner from './components/ErrorBanner';
import Overview from './pages/Overview';
import FleetMap from './pages/FleetMap';
import FleetTable from './pages/FleetTable';
import EventReplay from './pages/EventReplay';
import Analytics from './pages/Analytics';
import { DEMO_SOLAR, DEMO_SUMMARY, applyDemoOverrides } from './demoData';
import { fetchAllLiveData } from './services/liveApi';
import { calculateFleetRisk } from './services/riskCalculator';
import { seedHistoricalData } from './services/flightLog';

export default function App() {
  const [solar, setSolar] = useState(null);
  const [fleet, setFleet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [dataVersion, setDataVersion] = useState(0);
  const [demoMode, setDemoMode] = useState(() => {
    const saved = localStorage.getItem('solaris_demo_mode');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [nmdbData, setNmdbData] = useState(null);
  const [apiStatus, setApiStatus] = useState({ noaa: 'unknown', nmdb: 'unknown', opensky: 'unknown' });
  const navigate = useNavigate();

  const liveDataRef = useRef({ solar: null, fleet: null, summary: null });
  const countdownRef = useRef(null);
  const pollRef = useRef(null);
  const initializedDemoRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('solaris_demo_mode', JSON.stringify(demoMode));
  }, [demoMode]);

  const refreshAll = useCallback(async (overrideMode) => {
    const isDemo = overrideMode !== undefined ? overrideMode : demoMode;
    setFetching(true);
    try {
      if (isDemo) {
        // Demo mode: use existing demo data (unchanged)
        const liveFleet = liveDataRef.current.fleet || null;
        const demoFleet = applyDemoOverrides(liveFleet);
        setSolar(DEMO_SOLAR);
        setFleet(demoFleet);
        setSummary(DEMO_SUMMARY);
        setError(null);
        // Auto-select ICE673
        const ice673 = demoFleet.aircraft.find(a => a.callsign === 'ICE673');
        if (ice673 && !selectedAircraft) setSelectedAircraft(ice673);
      } else {
        // Live mode: fetch from proxy APIs
        const liveData = await fetchAllLiveData();

        // Update API status
        const newStatus = {
          noaa: liveData.solar ? 'ok' : 'error',
          nmdb: liveData.nmdb ? 'ok' : 'error',
          opensky: liveData.flights ? 'ok' : 'error'
        };
        setApiStatus(newStatus);

        // Solar data
        if (liveData.solar) {
          setSolar(liveData.solar);
        }

        // NMDB data
        if (liveData.nmdb) {
          setNmdbData(liveData.nmdb);
        }

        // Fleet data — calculate risk scores
        if (liveData.flights && liveData.flights.aircraft) {
          const noaa = liveData.solar || solar;
          const nmdb = liveData.nmdb || nmdbData || { average: 5000 };
          const enrichedFleet = calculateFleetRisk(liveData.flights.aircraft, noaa, nmdb);
          setFleet({ aircraft: enrichedFleet, count: enrichedFleet.length });

          // Update selected aircraft if it exists in new data
          if (selectedAircraft) {
            const updated = enrichedFleet.find(a => a.callsign === selectedAircraft.callsign);
            if (updated) setSelectedAircraft(updated);
          }
        } else {
          // If flight data failed to load, clear the fleet to prevent showing stale demo data
          setFleet({ aircraft: [], count: 0 });
        }

        // Summary (computed from live data)
        // In live mode, compute summary from fleet + log
        const fleetArr = fleet?.aircraft || [];
        const atRisk = fleetArr.filter(a => a.tier === 'RED' || a.tier === 'CRITICAL').length;
        setSummary({
          co2_saved_tonnes: atRisk * 9.5,
          diversions_prevented: Math.max(0, atRisk - 1),
          fleet_at_risk: atRisk
        });

        // Set errors
        if (liveData.errors.length > 0) {
          if (liveData.errors.length === 3) {
            setError('All APIs offline');
          } else {
            setError(`Partial: ${liveData.errors.map(e => e.api).join(', ')} unavailable`);
          }
        } else {
          setError(null);
        }
      }

      setLastFetchTime(Date.now());
      setCountdown(30);
      setDataVersion(v => v + 1);
    } catch (err) {
      setError('Data fetch failed');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [demoMode, selectedAircraft, solar, nmdbData, fleet]);

  // Initial load — seed historical data and fetch
  useEffect(() => {
    seedHistoricalData();
    refreshAll();
  }, []);

  // Demo mode initialization — navigate to overview on first demo load
  useEffect(() => {
    if (demoMode && !initializedDemoRef.current) {
      initializedDemoRef.current = true;
      navigate('/');
    }
  }, [demoMode, navigate]);

  // Polling interval — 120s in live mode for OpenSky rate limits
  useEffect(() => {
    if (demoMode) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    // Live mode: refresh every 2 minutes (120s) for OpenSky rate limits
    pollRef.current = setInterval(refreshAll, 120000);
    return () => clearInterval(pollRef.current);
  }, [refreshAll, demoMode]);

  // Countdown timer (visual only)
  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 30)), 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const handleToggleDemo = useCallback(() => {
    setDemoMode(prev => {
      const next = !prev;
      initializedDemoRef.current = false; // Reset so demo re-initializes
      if (!next) {
        // Switching to live mode — clear demo data, trigger refresh
        setSelectedAircraft(null);
        setLoading(true);
        setTimeout(() => refreshAll(false), 100);
      }
      return next;
    });
  }, [refreshAll]);

  const handleSelectAircraft = useCallback((ac) => {
    // Note: ac can be a callsign (string) from Map or full object from table.
    // If it's a string (callsign), find the object
    if (typeof ac === 'string') {
      const obj = fleet?.aircraft.find(a => a.callsign === ac);
      setSelectedAircraft(prev => prev?.callsign === ac ? null : (obj || null));
    } else {
      setSelectedAircraft(prev => prev?.callsign === ac?.callsign ? null : ac);
    }
  }, [fleet]);

  // Navigate to map with a selected aircraft
  const handleNavigateToAircraft = useCallback((ac) => {
    if (typeof ac === 'string') {
      const obj = fleet?.aircraft.find(a => a.callsign === ac);
      if (obj) setSelectedAircraft(obj);
    } else {
      setSelectedAircraft(ac);
    }
    navigate('/map');
  }, [navigate, fleet]);

  const isStale = !lastFetchTime || (Date.now() - lastFetchTime > 60000);
  const isConnected = !error && !isStale;

  // Pass selectedCallsign down for components that still expect it
  const selectedCallsign = selectedAircraft?.callsign || null;

  return (
    <div className="relative flex flex-col w-screen h-screen overflow-hidden" style={{ zIndex: 1 }}>
      {/* Top Bar — always visible */}
      <TopBar solar={solar} fetching={fetching} isStale={isStale} demoMode={demoMode} onToggleDemo={handleToggleDemo} apiStatus={apiStatus} />
      {error && !demoMode && <ErrorBanner />}

      {/* Main: Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar isConnected={isConnected} />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <Routes>
              <Route path="/" element={
                <Overview fleet={fleet} solar={solar} summary={summary} loading={loading} demoMode={demoMode}
                          onNavigateToAircraft={handleNavigateToAircraft} nmdbData={nmdbData} />
              } />
              <Route path="/map" element={
                <FleetMap fleet={fleet} solar={solar} selectedCallsign={selectedCallsign}
                          selectedAircraft={selectedAircraft} onSelect={handleSelectAircraft}
                          loading={loading} dataVersion={dataVersion} demoMode={demoMode} nmdbData={nmdbData} />
              } />
              <Route path="/fleet" element={
                <FleetTable fleet={fleet} loading={loading} onNavigateToAircraft={handleNavigateToAircraft} />
              } />
              <Route path="/replay" element={<EventReplay />} />
              <Route path="/analytics" element={
                <Analytics fleet={fleet} summary={summary} demoMode={demoMode} />
              } />
            </Routes>
          </div>

          {/* Bottom Bar — always visible */}
          <BottomBar summary={summary} fleet={fleet} countdown={countdown} dataVersion={dataVersion} demoMode={demoMode} />
        </div>
      </div>
    </div>
  );
}
