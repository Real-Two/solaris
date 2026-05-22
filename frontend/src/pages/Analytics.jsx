import React, { useMemo, useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ComposedChart, ReferenceLine, Legend
} from 'recharts';
import { tierColor } from '../api';
import { getFlightLog, getAnalytics, exportCSV } from '../services/flightLog';
import { getDecisionColor } from '../services/decisionEngine';

// ─── Demo Data ───
const FLUX_DATA = [
  { time: '14:00', flux: 0.3 }, { time: '14:30', flux: 0.4 }, { time: '15:00', flux: 0.5 },
  { time: '15:30', flux: 1.2 }, { time: '16:00', flux: 2.1 }, { time: '16:30', flux: 45 },
  { time: '17:00', flux: 380 }, { time: '17:18', flux: 850 }, { time: '17:30', flux: 1200 },
  { time: '17:48', flux: 2100 }, { time: '18:00', flux: 2800 }, { time: '18:30', flux: 3400 },
  { time: '19:00', flux: 4200 }, { time: '19:30', flux: 3800 }, { time: '20:00', flux: 2600 },
  { time: '20:30', flux: 1400 }, { time: '21:00', flux: 620 }, { time: '21:30', flux: 180 },
  { time: '22:00', flux: 45 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(11,20,55,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#a0aec0', fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill || '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono'" }}>
          {p.name}: {typeof p.value === 'number' ? (p.value % 1 === 0 ? p.value : p.value.toFixed(1)) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics({ fleet, summary, demoMode }) {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [decisionFilter, setDecisionFilter] = useState('all');

  useEffect(() => {
    // We poll flight logs every 5s just in case they update
    const fetchLogs = () => {
        setLogs(getFlightLog({ dateRange, decision: decisionFilter }));
        setStats(getAnalytics());
    };
    fetchLogs();
    const intv = setInterval(fetchLogs, 5000);
    return () => clearInterval(intv);
  }, [dateRange, decisionFilter]);

  const aircraft = fleet?.aircraft || [];
  const tierDistribution = useMemo(() => {
    const counts = { GREEN: 0, AMBER: 0, RED: 0, CRITICAL: 0 };
    aircraft.forEach(ac => { if (counts[ac.tier] !== undefined) counts[ac.tier]++; });
    return Object.entries(counts).map(([tier, count]) => ({
      name: tier, value: count, color: tierColor(tier),
    })).filter(d => d.value > 0);
  }, [aircraft]);

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto h-full overflow-y-auto pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[24px] font-bold text-white">Continuous Assessment Analytics</h1>
          <p className="text-[13px] text-[#a0aec0] mt-1">
            {demoMode ? 'October 30, 2025 — Solar Proton Event (Demo)' : 'Real-time learning & fleet analytics'}
          </p>
        </div>
        {!demoMode && (
           <button onClick={() => exportCSV()} className="px-4 py-2 bg-[rgba(0,117,255,0.1)] border border-[rgba(0,117,255,0.3)] text-[#00d4ff] text-[12px] font-bold rounded hover:bg-[rgba(0,117,255,0.2)] transition">
             Download CSV Report
           </button>
        )}
      </div>

      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="text-[10px] tracking-[0.1em] text-[#a0aec0] uppercase font-bold">Total Monitored</div>
          <div className="text-[28px] font-mono font-bold text-white">{stats.totalMonitored.toLocaleString()}</div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="text-[10px] tracking-[0.1em] text-[#a0aec0] uppercase font-bold">Deviations Prevented</div>
          <div className="text-[28px] font-mono font-bold text-[#00d4ff]">{stats.deviationsRecommended}</div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="text-[10px] tracking-[0.1em] text-[#a0aec0] uppercase font-bold">CO₂ Saved (Tonnes)</div>
          <div className="text-[28px] font-mono font-bold text-[#00ff88]">{stats.co2SavedTonnes.toFixed(1)}</div>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between">
          <div className="text-[10px] tracking-[0.1em] text-[#a0aec0] uppercase font-bold">Incidents Prevented</div>
          <div className="text-[28px] font-mono font-bold text-[#ff4444]">{stats.incidentsPrevented}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Model Accuracy */}
        <div className="glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-4">Prediction Accuracy Over Time</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.weeklyAccuracy} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tickFormatter={v => `Week ${v}`} tick={{ fill: '#a0aec0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis domain={[70, 100]} tick={{ fill: '#a0aec0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Area type="monotone" dataKey="accuracy" stroke="#00d4ff" fillOpacity={1} fill="url(#accGrad)" name="Accuracy %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Trends */}
        <div className="glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-4">Solar Event Frequency by Region (90d)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.regionalTrends} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" tick={{ fill: '#a0aec0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis dataKey="region" type="category" tick={{ fill: '#a0aec0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="events" fill="#ffaa00" radius={[0, 4, 4, 0]} name="High-Risk Events" barSize={20}>
                  {stats.regionalTrends.map((d,i) => <Cell key={i} fill={d.events > 50 ? '#ff4444' : '#ffaa00'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demo Mode Flux Timeline (preserved for backward compat) */}
      {demoMode && (
        <div className="glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-6">Proton Flux Over Time — Oct 30 Event</div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={FLUX_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="fluxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0075ff" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#ff4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#0b1437" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#a0aec0', fontSize: 10 }} interval={2} tickLine={false} axisLine={false} />
              <YAxis scale="log" domain={[0.1, 5000]} allowDataOverflow tick={{ fill: '#a0aec0', fontSize: 10 }}
                tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
              <ReferenceLine y={100} stroke="#ff4444" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: 'SEU Risk Threshold', position: 'top', fill: '#ff4444', fontSize: 10 }} />
              <ReferenceLine x="17:48" stroke="#ff4444" strokeDasharray="6 4" strokeWidth={1.5} label={{ value: '⚠ Incident Window', position: 'insideTopLeft', fill: '#ff4444', fontSize: 10 }} />
              <Area type="monotone" dataKey="flux" fill="url(#fluxGrad)" stroke="none" />
              <Line type="monotone" dataKey="flux" stroke="#0075ff" strokeWidth={3} dot={false} name="Proton Flux (pfu)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Flight Log Table */}
      {!demoMode && (
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
            <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold">Flight Decision Log</div>
            <div className="flex gap-2">
                <select className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-[11px] rounded p-1"
                        value={decisionFilter} onChange={e => setDecisionFilter(e.target.value)}>
                    <option value="all">All Decisions</option>
                    <option value="GO">GO Only</option>
                    <option value="DEVIATE">DEVIATE Only</option>
                    <option value="NO-GO">NO-GO Only</option>
                </select>
                <select className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-[11px] rounded p-1"
                        value={dateRange} onChange={e => setDateRange(e.target.value)}>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="all">All Time</option>
                </select>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)]">
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Date/Time</th>
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Flight</th>
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Route</th>
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Risk Score</th>
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Decision</th>
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Outcome</th>
                        <th className="p-2 text-[10px] uppercase tracking-wider text-[#a0aec0]">Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.slice(0, 50).map((log, i) => (
                        <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                            <td className="p-2 text-[11px] text-[#a0aec0] font-mono">
                                {new Date(log.timestamp).toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-2 text-[12px] font-bold text-white">{log.callsign}</td>
                            <td className="p-2 text-[11px] text-[#a0aec0]">{log.route || 'N/A'}</td>
                            <td className="p-2 text-[12px] font-mono" style={{color: tierColor(log.tier)}}>{log.riskScore}%</td>
                            <td className="p-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded border" style={{
                                    color: getDecisionColor(log.decision),
                                    borderColor: getDecisionColor(log.decision),
                                    background: `${getDecisionColor(log.decision)}20`
                                }}>{log.decision}</span>
                            </td>
                            <td className="p-2 text-[11px] text-white">{log.outcome}</td>
                            <td className="p-2 text-[11px] text-[#a0aec0] truncate max-w-[200px]">{log.notes || '—'}</td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr><td colSpan="7" className="p-4 text-center text-[#a0aec0] text-[12px]">No log entries found</td></tr>
                    )}
                </tbody>
            </table>
            {logs.length > 50 && <div className="text-center p-2 text-[11px] text-[#a0aec0] mt-2">Showing 50 most recent entries</div>}
        </div>
      </div>
      )}
    </div>
  );
}
