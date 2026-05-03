import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Area, ComposedChart, ReferenceLine, Legend,
} from 'recharts';
import { tierColor, displayScore } from '../api';

// ─── Proton Flux Timeline Data (Oct 30 event) ───
const FLUX_DATA = [
  { time: '14:00', flux: 0.3 }, { time: '14:30', flux: 0.4 }, { time: '15:00', flux: 0.5 },
  { time: '15:30', flux: 1.2 }, { time: '16:00', flux: 2.1 }, { time: '16:30', flux: 45 },
  { time: '17:00', flux: 380 }, { time: '17:18', flux: 850 }, { time: '17:30', flux: 1200 },
  { time: '17:48', flux: 2100 }, { time: '18:00', flux: 2800 }, { time: '18:30', flux: 3400 },
  { time: '19:00', flux: 4200 }, { time: '19:30', flux: 3800 }, { time: '20:00', flux: 2600 },
  { time: '20:30', flux: 1400 }, { time: '21:00', flux: 620 }, { time: '21:30', flux: 180 },
  { time: '22:00', flux: 45 },
];

const IMPACT_DATA = [
  { name: 'Advisories Issued', value: 4, color: '#0075ff' },
  { name: 'Diversions Prevented', value: 3, color: '#00ff88' },
  { name: 'CO₂ Saved (t)', value: 28.4, color: '#ffaa00' },
  { name: 'Fuel Saved (100kg)', value: 72, color: '#cc00ff' },
  { name: 'Minutes Advance Warning', value: 30, color: '#0075ff' },
  { name: 'Aircraft Protected', value: 25, color: '#00ff88' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(11,20,55,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#a0aec0', fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#fff', fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono'" }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics({ fleet, summary, demoMode }) {
  const aircraft = fleet?.aircraft || [];

  const tierDistribution = useMemo(() => {
    const counts = { GREEN: 0, AMBER: 0, RED: 0, CRITICAL: 0 };
    aircraft.forEach(ac => { if (counts[ac.tier] !== undefined) counts[ac.tier]++; });
    return Object.entries(counts).map(([tier, count]) => ({
      name: tier, value: count, color: tierColor(tier),
    })).filter(d => d.value > 0);
  }, [aircraft]);

  const total = aircraft.length;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto h-full overflow-y-auto">
      <div>
        <h1 className="text-[24px] font-bold text-white">Solar Event Analytics</h1>
        <p className="text-[13px] text-[#a0aec0] mt-1">
          {demoMode ? 'October 30, 2025 — Solar Proton Event (Demo)' : 'Real-time fleet analytics'}
        </p>
      </div>

      {/* Chart 1: Flux Over Time */}
      <div className="glass-card p-6">
        <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-6">
          Proton Flux Over Time — Oct 30 Event
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={FLUX_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fluxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0075ff" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#ff4444" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#0b1437" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#a0aec0', fontSize: 10 }} interval={2} tickLine={false} axisLine={false} />
            <YAxis scale="log" domain={[0.1, 5000]} allowDataOverflow tick={{ fill: '#a0aec0', fontSize: 10 }}
              tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
            <ReferenceLine y={100} stroke="#ff4444" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: 'SEU Risk Threshold', position: 'top', fill: '#ff4444', fontSize: 10 }} />
            <Area type="monotone" dataKey="flux" fill="url(#fluxGrad)" stroke="none" />
            <Line type="monotone" dataKey="flux" stroke="#0075ff" strokeWidth={3} dot={false} name="Proton Flux (pfu)" style={{ filter: 'drop-shadow(0 0 8px rgba(0,117,255,0.5))' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Charts 2+3 side by side */}
      <div className="grid grid-cols-2 gap-6 pb-6">
        {/* Donut: Risk Distribution */}
        <div className="glass-card p-6 relative">
          <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-4">
            Fleet Risk Distribution
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={tierDistribution} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={75} outerRadius={105}
                  paddingAngle={5} strokeWidth={0}>
                  {tierDistribution.map((d, i) => (
                    <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 8px ${d.color}80)` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Center label */}
          <div className="flex flex-col items-center absolute inset-0 justify-center pointer-events-none pt-8">
            <span className="font-mono text-[36px] font-bold text-white">{total}</span>
            <span className="text-[10px] text-[#a0aec0] uppercase tracking-widest font-bold">Aircraft</span>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            {tierDistribution.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                <span className="text-[11px] font-bold text-white">{d.name}: <span className="text-[#a0aec0]">{d.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar: Impact Metrics */}
        <div className="glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-6">
            SOLARIS Impact — Event Summary
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={IMPACT_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#a0aec0', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#a0aec0', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Value" barSize={30}>
                {IMPACT_DATA.map((d, i) => (
                  <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 6px ${d.color}80)` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
