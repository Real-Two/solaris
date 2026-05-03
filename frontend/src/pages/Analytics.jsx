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
  { name: 'Advisories Issued', value: 4, color: '#2d6a4f' },
  { name: 'Diversions Prevented', value: 3, color: '#10b981' },
  { name: 'CO₂ Saved (t)', value: 28.4, color: '#f59e0b' },
  { name: 'Fuel Saved (100kg)', value: 72, color: '#9333ea' },
  { name: 'Minutes Advance Warning', value: 30, color: '#2d6a4f' },
  { name: 'Aircraft Protected', value: 25, color: '#10b981' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#6b7280', fontSize: 11, fontFamily: "'IBM Plex Mono'" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono'" }}>
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
    <div className="p-6 space-y-4 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Solar Event Analytics</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {demoMode ? 'October 30, 2025 — Solar Proton Event (Demo)' : 'Real-time fleet analytics'}
        </p>
      </div>

      {/* Chart 1: Flux Over Time */}
      <div className="glass-card p-6">
        <div className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-4">
          Proton Flux Over Time — Oct 30 Event
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={FLUX_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fluxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2d6a4f" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={2} />
            <YAxis scale="log" domain={[0.1, 5000]} allowDataOverflow tick={{ fontSize: 10 }}
              tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="6 4" strokeWidth={1.5}
              label={{ value: 'SEU Risk Threshold', position: 'top', fill: '#ef4444', fontSize: 10 }} />
            <Area type="monotone" dataKey="flux" fill="url(#fluxGrad)" stroke="none" />
            <Line type="monotone" dataKey="flux" stroke="#111827" strokeWidth={2} dot={false} name="Proton Flux (pfu)" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Charts 2+3 side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Donut: Risk Distribution */}
        <div className="glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-4">
            Fleet Risk Distribution
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tierDistribution} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                  paddingAngle={3} strokeWidth={0}>
                  {tierDistribution.map((d, i) => (
                    <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 6px ${d.color}40)` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Center label */}
          <div className="flex flex-col items-center -mt-40 relative z-10 pointer-events-none">
            <span className="font-mono text-3xl font-bold text-gray-900">{total}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Aircraft</span>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-10">
            {tierDistribution.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] text-gray-500">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar: Impact Metrics */}
        <div className="glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-4">
            SOLARIS Impact — Event Summary
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={IMPACT_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Value">
                {IMPACT_DATA.map((d, i) => (
                  <Cell key={i} fill={d.color} style={{ filter: `drop-shadow(0 0 4px ${d.color}40)` }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
