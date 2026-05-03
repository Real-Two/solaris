import { useState, useMemo } from 'react';
import { tierColor, displayScore } from '../api';

const TIERS = ['ALL', 'GREEN', 'AMBER', 'RED', 'CRITICAL'];

export default function FleetTable({ fleet, loading, onNavigateToAircraft }) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const aircraft = fleet?.aircraft || [];

  const filtered = useMemo(() => {
    return aircraft.filter(ac => {
      const matchSearch = !search || ac.callsign.toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === 'ALL' || ac.tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [aircraft, search, tierFilter]);

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-4 h-full">
      {/* Filters */}
      <div className="flex items-center gap-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search callsign..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl text-[13px] font-mono bg-white border border-gray-200
              text-gray-900 placeholder-gray-400 outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f] w-64 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {TIERS.map(t => {
            const active = tierFilter === t;
            const color = t === 'ALL' ? '#2d6a4f' : tierColor(t);
            return (
              <button key={t}
                onClick={() => setTierFilter(t)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-all"
                style={{
                  background: active ? `${color}18` : 'rgba(0,0,0,0.02)',
                  color: active ? color : '#6b7280',
                  border: `1px solid ${active ? `${color}40` : 'rgba(0,0,0,0.05)'}`,
                }}>
                {t}
              </button>
            );
          })}
        </div>
        <span className="ml-auto text-[11px] font-mono text-gray-500">{filtered.length} aircraft</span>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="grid grid-cols-9 gap-2 px-5 py-3 text-[9px] tracking-[0.15em] text-gray-500 uppercase font-semibold shrink-0"
          style={{ background: '#f9fafb', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <span>Callsign</span>
          <span>Route</span>
          <span>Position</span>
          <span>Altitude</span>
          <span>Heading</span>
          <span>Risk Score</span>
          <span>Tier</span>
          <span>Flux</span>
          <span>Status</span>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(ac => {
            const color = tierColor(ac.tier);
            const score = displayScore(ac.risk_score);
            const isHighRisk = ac.tier === 'RED' || ac.tier === 'CRITICAL';
            return (
              <div key={ac.callsign}
                className="grid grid-cols-9 gap-2 px-5 py-3 items-center border-b border-gray-100
                  hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onNavigateToAircraft(ac.callsign)}>
                <span className="font-mono text-[13px] font-bold text-gray-900">{ac.callsign}</span>
                <span className="text-[12px] text-gray-500 font-mono">{ac.origin} → {ac.dest}</span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {Math.abs(ac.lat).toFixed(1)}°{ac.lat >= 0 ? 'N' : 'S'} {Math.abs(ac.lon).toFixed(1)}°{ac.lon >= 0 ? 'E' : 'W'}
                </span>
                <span className="text-[12px] font-mono text-gray-500">FL{ac.alt_fl}</span>
                <span className="text-[12px] font-mono text-gray-500">{ac.heading}°</span>
                <span className="font-mono text-[14px] font-bold" style={{ color }}>{score}%</span>
                <span className="text-[9px] font-bold tracking-wider px-2 py-1 rounded-full w-fit"
                  style={{ backgroundColor: `${color}15`, color }}>
                  {ac.tier}
                </span>
                <span className="text-[12px] font-mono text-gray-500">{ac.corrected_flux?.toFixed(1) || '—'} pfu</span>
                <span className={`text-[11px] font-medium ${isHighRisk ? 'text-red-500' : 'text-gray-400'}`}>
                  {isHighRisk ? '⚠ Advisory Issued' : 'Nominal'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
