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
  const [selectedCallsign, setSelectedCallsign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [dataVersion, setDataVersion] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const navigate = useNavigate();

  const liveDataRef = useRef({ solar: null, fleet: null, summary: null });
  const countdownRef = useRef(null);
  const pollRef = useRef(null);

  const selectedAircraft = useMemo(() => {
    if (!selectedCallsign || !fleet?.aircraft) return null;
    return fleet.aircraft.find(a => a.callsign.toUpperCase() === selectedCallsign.toUpperCase()) || null;
  }, [selectedCallsign, fleet]);

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
  }, [demoMode]);

  useEffect(() => { refreshAll(); }, []);

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
        setSolar(DEMO_SOLAR);
        setFleet(liveFleet ? applyDemoOverrides(liveFleet) : null);
        setSummary(DEMO_SUMMARY);
        setError(null);
        setDataVersion(v => v + 1);
      } else {
        const live = liveDataRef.current;
        setSolar(live.solar);
        setFleet(live.fleet);
        setSummary(live.summary);
        setSelectedCallsign(null);
        setDataVersion(v => v + 1);
        setTimeout(() => refreshAll(), 100);
      }
      return next;
    });
  }, [fleet, refreshAll]);

  const handleSelectAircraft = useCallback((callsign) => {
    setSelectedCallsign(prev => prev === callsign ? null : callsign);
  }, []);

  // Navigate to map with a selected aircraft
  const handleNavigateToAircraft = useCallback((callsign) => {
    setSelectedCallsign(callsign);
    navigate('/map');
  }, [navigate]);

  const isStale = !lastFetchTime || (Date.now() - lastFetchTime > 60000);
  const isConnected = !error && !isStale;

  return (
    <div className="relative flex flex-col w-screen h-screen overflow-hidden" style={{ zIndex: 1 }}>
      {/* Top Bar — always visible */}
      <TopBar solar={solar} fetching={fetching} isStale={isStale} demoMode={demoMode} onToggleDemo={handleToggleDemo} />
      {error && <ErrorBanner />}

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
