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
import { fetchSolar, fetchFleet, fetchSummary } from './api';
import { DEMO_SOLAR, DEMO_SUMMARY, applyDemoOverrides } from './demoData';

const REFRESH_INTERVAL = 30000;

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
  const [demoMode, setDemoMode] = useState(true); // Boot into demo mode by default
  const navigate = useNavigate();

  const liveDataRef = useRef({ solar: null, fleet: null, summary: null });
  const countdownRef = useRef(null);
  const pollRef = useRef(null);
  const initializedDemoRef = useRef(false);

  const refreshAll = useCallback(async () => {
    setFetching(true);
    try {
      const [solarData, fleetData, summaryData] = await Promise.all([
        fetchSolar(), fetchFleet(), fetchSummary(),
      ]);
      liveDataRef.current = { solar: solarData, fleet: fleetData, summary: summaryData };
      if (!demoMode) {
        setSolar(solarData);
        setFleet(fleetData);
        setSummary(summaryData);
        // Ensure selectedAircraft reference updates if live data updates
        if (selectedAircraft) {
          const updated = fleetData.aircraft.find(a => a.callsign === selectedAircraft.callsign);
          if (updated) setSelectedAircraft(updated);
        }
      }
      setError(null);
      setLastFetchTime(Date.now());
      setCountdown(30);
      setDataVersion(v => v + 1);
    } catch (err) {
      setError('Backend offline');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [demoMode, selectedAircraft]);

  useEffect(() => { refreshAll(); }, []);

  // Initialize demo mode data
  useEffect(() => {
    if (demoMode && !initializedDemoRef.current) {
      initializedDemoRef.current = true;
      const liveFleet = liveDataRef.current.fleet || null;
      const demoFleet = applyDemoOverrides(liveFleet);
      setSolar(DEMO_SOLAR);
      setFleet(demoFleet);
      setSummary(DEMO_SUMMARY);
      setError(null);
      setDataVersion(v => v + 1);
      
      // Auto-select ICE673 on load in demo mode
      const ice673 = demoFleet.aircraft.find(a => a.callsign === 'ICE673');
      if (ice673) setSelectedAircraft(ice673);
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) { if (pollRef.current) clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(refreshAll, REFRESH_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [refreshAll, demoMode]);

  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 30)), 1000);
    return () => clearInterval(countdownRef.current);
  }, []);

  const handleToggleDemo = useCallback(() => {
    setDemoMode(prev => {
      const next = !prev;
      if (next) {
        const liveFleet = liveDataRef.current.fleet || fleet;
        const demoFleet = applyDemoOverrides(liveFleet);
        setSolar(DEMO_SOLAR);
        setFleet(demoFleet);
        setSummary(DEMO_SUMMARY);
        setError(null);
        setDataVersion(v => v + 1);
        
        // Auto-select ICE673 when toggling ON
        const ice673 = demoFleet.aircraft.find(a => a.callsign === 'ICE673');
        if (ice673) setSelectedAircraft(ice673);
      } else {
        const live = liveDataRef.current;
        setSolar(live.solar);
        setFleet(live.fleet);
        setSummary(live.summary);
        setSelectedAircraft(null);
        setDataVersion(v => v + 1);
        setTimeout(() => refreshAll(), 100);
      }
      return next;
    });
  }, [fleet, refreshAll]);

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
      <TopBar solar={solar} fetching={fetching} isStale={isStale} demoMode={demoMode} onToggleDemo={handleToggleDemo} />
      {error && !demoMode && <ErrorBanner />}

      {/* Main: Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar isConnected={isConnected} />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <Routes>
              <Route path="/" element={
                <Overview fleet={fleet} solar={solar} summary={summary} loading={loading} demoMode={demoMode}
                          onNavigateToAircraft={handleNavigateToAircraft} />
              } />
              <Route path="/map" element={
                <FleetMap fleet={fleet} solar={solar} selectedCallsign={selectedCallsign}
                          selectedAircraft={selectedAircraft} onSelect={handleSelectAircraft}
                          loading={loading} dataVersion={dataVersion} demoMode={demoMode} />
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
