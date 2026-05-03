import { useMemo } from 'react';
import { tierColor, displayScore } from '../api';

// ─── Stat Card ───
function StatCard({ icon, title, children, glowClass }) {
  return (
    <div className={`glass-card p-6 flex flex-col gap-3 ${glowClass || ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── SVG Arc ───
function MiniArc({ value, max, color }) {
  const r = 36;
  const circ = Math.PI * r; // semicircle
  const pct = Math.min(value / max, 1);
  const offset = circ - pct * circ;
  return (
    <svg width="88" height="50" viewBox="0 0 88 50">
      <path d="M 6 44 A 38 38 0 0 1 82 44" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="5" strokeLinecap="round"/>
      <path d="M 6 44 A 38 38 0 0 1 82 44" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${circ}`} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${color}50)` }}/>
      <text x="44" y="38" textAnchor="middle" fill={color} fontFamily="'IBM Plex Mono'" fontWeight="700" fontSize="16">{value}</text>
    </svg>
  );
}

export default function Overview({ fleet, solar, summary, loading, demoMode, onNavigateToAircraft }) {
  const aircraft = fleet?.aircraft || [];

  const tierCounts = useMemo(() => {
    const c = { GREEN: 0, AMBER: 0, RED: 0, CRITICAL: 0 };
    aircraft.forEach(ac => { if (c[ac.tier] !== undefined) c[ac.tier]++; });
    return c;
  }, [aircraft]);

  const peakAircraft = useMemo(() => {
    if (!aircraft.length) return null;
    return aircraft.reduce((a, b) => (b.risk_score > a.risk_score ? b : a), aircraft[0]);
  }, [aircraft]);

  const top5 = useMemo(() => aircraft.slice(0, 5), [aircraft]);
  const atRisk = tierCounts.RED + tierCounts.CRITICAL;
  const alertLevel = solar?.alert_level || 'GREEN';
  const co2 = summary?.co2_saved_tonnes ?? 0;
  const diversions = summary?.diversions_prevented ?? 0;
  const peakScore = peakAircraft ? displayScore(peakAircraft.risk_score) : 0;
  const fuelSaved = diversions * 2400;

  const alertColor = { GREEN: '#10b981', AMBER: '#f59e0b', RED: '#ef4444', CRITICAL: '#9333ea' }[alertLevel] || '#10b981';
  const peakGradient = peakScore > 80 ? 'gradient-text-critical' : peakScore > 50 ? 'gradient-text-amber' : 'gradient-text-teal';

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        <div className="col-span-4 skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Row 1: 4 stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Fleet Status */}
        <StatCard icon="✈️" title="Fleet Status">
          <div className="font-mono text-4xl font-bold gradient-text-teal">{aircraft.length}</div>
          <div className="flex items-center gap-2 mt-1">
            {[
              { count: tierCounts.GREEN, color: '#00ff88' },
              { count: tierCounts.AMBER, color: '#ffaa00' },
              { count: tierCounts.RED, color: '#ff4444' },
              { count: tierCounts.CRITICAL, color: '#cc00ff' },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-[11px] font-mono text-gray-500">{t.count}</span>
              </div>
            ))}
          </div>
        </StatCard>

        {/* Peak Risk */}
        <StatCard icon="⚠️" title="Peak Risk Score"
          glowClass={peakScore > 80 ? 'glow-pulse-red' : ''}>
          <div className={`font-mono text-4xl font-bold ${peakGradient}`}>
            {peakScore}<span className="text-lg">%</span>
          </div>
          {peakAircraft && (
            <div className="text-[11px] text-gray-500 font-mono">
              {peakAircraft.callsign} · {peakAircraft.origin} → {peakAircraft.dest}
            </div>
          )}
        </StatCard>

        {/* CO₂ Avoided */}
        <StatCard icon="🌱" title="CO₂ Avoided">
          <div className="font-mono text-4xl font-bold gradient-text-green">
            {co2.toFixed(1)}<span className="text-lg">t</span>
          </div>
          <div className="text-[11px] text-gray-500">
            ≈ {(co2 * 0.21).toFixed(1)} cars off road for a year
          </div>
        </StatCard>

        {/* Solar Alert */}
        <StatCard icon="☀️" title="Solar Alert Level"
          glowClass={alertLevel === 'RED' || alertLevel === 'CRITICAL' ? 'glow-pulse-red' : ''}>
          <div className="font-mono text-3xl font-bold" style={{ color: alertColor }}>{alertLevel}</div>
          <div className="flex gap-4 text-[11px] font-mono text-gray-500">
            <span>{solar?.proton_flux_pfu?.toFixed(1) || '—'} pfu</span>
            <span>Kp {solar?.kp_index?.toFixed(1) || '—'}</span>
          </div>
        </StatCard>
      </div>

      {/* Row 2: Top Risk + Advisories */}
      <div className="grid grid-cols-5 gap-4">
        {/* Top Risk Aircraft (3 cols) */}
        <div className="col-span-3 glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-4">
            Highest Risk Fleet Members
          </div>
          <div className="space-y-2">
            {top5.map(ac => {
              const color = tierColor(ac.tier);
              const score = displayScore(ac.risk_score);
              return (
                <div key={ac.callsign}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onNavigateToAircraft(ac.callsign)}>
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">{ac.callsign}</span>
                      <span className="text-[11px] text-gray-500 font-mono">{ac.origin} → {ac.dest}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}50` }} />
                    </div>
                  </div>
                  <span className="font-mono text-lg font-bold shrink-0" style={{ color }}>{score}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advisories (2 cols) */}
        <div className="col-span-2 glass-card p-6">
          <div className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-4">
            ACARS Advisories Issued
          </div>
          {atRisk > 0 ? (
            <div className="space-y-3">
              {aircraft.filter(ac => ac.tier === 'CRITICAL' || ac.tier === 'RED').slice(0, 3).map(ac => (
                <div key={ac.callsign} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-gray-900">{ac.callsign}</span>
                      <span className="text-[11px] text-gray-500 ml-2">{ac.origin} → {ac.dest}</span>
                    </div>
                    <span className="text-[9px] font-bold tracking-wider px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${tierColor(ac.tier)}15`, color: tierColor(ac.tier) }}>
                      {ac.tier}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">
                    {ac.deviations?.[0]?.label || 'Advisory pending'}
                  </div>
                  <button className="mt-2 text-[10px] font-bold tracking-wider text-[#2d6a4f] hover:underline cursor-pointer"
                    onClick={() => onNavigateToAircraft(ac.callsign)}>
                    View on Map →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-[13px] text-gray-500">No active advisories — fleet nominal</div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Diversions + Fuel + At Risk */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon="🛡️" title="Diversions Prevented">
          <div className="flex items-center gap-4">
            <MiniArc value={diversions} max={5} color="#2d6a4f" />
            <div>
              <div className="font-mono text-3xl font-bold gradient-text-teal">{diversions}</div>
              <div className="text-[11px] text-gray-500 mt-1">Unnecessary diversions avoided</div>
            </div>
          </div>
        </StatCard>

        <StatCard icon="⛽" title="Fuel Saved">
          <div className="font-mono text-3xl font-bold gradient-text-teal">
            {fuelSaved.toLocaleString()}<span className="text-base ml-1">kg</span>
          </div>
          <div className="text-[11px] text-gray-500">Kilograms of jet fuel saved</div>
        </StatCard>

        <StatCard icon="⚡" title="Fleet at Risk"
          glowClass={atRisk > 0 ? 'glow-pulse-red' : 'glow-pulse-teal'}>
          {atRisk > 0 ? (
            <>
              <div className="font-mono text-4xl font-bold gradient-text-critical">{atRisk}</div>
              <div className="text-[11px] text-red-500">Aircraft requiring immediate advisory</div>
            </>
          ) : (
            <>
              <div className="font-mono text-3xl font-bold gradient-text-green">All Clear</div>
              <div className="text-[11px] text-emerald-500">No aircraft at elevated risk</div>
            </>
          )}
        </StatCard>
      </div>
    </div>
  );
}
