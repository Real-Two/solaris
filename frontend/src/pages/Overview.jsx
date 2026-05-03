import { useMemo } from 'react';
import { tierColor, displayScore } from '../api';

// ─── Vision UI Stat Card ───
function StatCard({ title, value, subtitle, iconNode, subColor = "text-[#00ff88]" }) {
  return (
    <div className="glass-card p-5 flex items-center justify-between h-full">
      <div className="flex flex-col justify-center">
        <div className="text-[12px] text-[#a0aec0] font-bold mb-1">{title}</div>
        <div className="text-white font-bold text-xl flex items-baseline gap-2">
          {value}
          {subtitle && <span className={`text-[12px] font-bold ${subColor}`}>{subtitle}</span>}
        </div>
      </div>
      <div className="w-11 h-11 rounded-[12px] bg-[#0075ff] flex items-center justify-center shadow-[0_4px_15px_rgba(0,117,255,0.4)] text-white text-xl shrink-0">
        {iconNode}
      </div>
    </div>
  );
}

// ─── SVG Arc for Vision UI ───
function MiniArc({ value, max, color }) {
  const r = 45;
  const circ = Math.PI * r; // semicircle
  const pct = Math.min(value / max, 1);
  const offset = circ - pct * circ;
  return (
    <svg width="110" height="60" viewBox="0 0 110 60">
      <path d="M 10 50 A 45 45 0 0 1 100 50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round"/>
      <path d="M 10 50 A 45 45 0 0 1 100 50" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${circ}`} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 8px ${color})` }}/>
      <text x="55" y="42" textAnchor="middle" fill="#ffffff" fontFamily="'Plus Jakarta Sans'" fontWeight="bold" fontSize="24">{value}</text>
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

  if (loading) {
    return (
      <div className="p-6 grid grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        <div className="col-span-4 skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex-1 overflow-y-auto h-full min-h-0">
      
      {/* ─── Row 1: 4 Stat Cards ─── */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard 
          title="Fleet Status" 
          value={aircraft.length} 
          subtitle={`${tierCounts.GREEN} Safe`} 
          iconNode={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>}
        />
        <StatCard 
          title="Solar Alert Level" 
          value={alertLevel} 
          subtitle={`${solar?.proton_flux_pfu?.toFixed(1) || '0'} pfu`}
          subColor={alertLevel === 'RED' || alertLevel === 'CRITICAL' ? 'text-[#ff4444]' : 'text-[#00ff88]'}
          iconNode={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 17a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM5.636 5.636a1 1 0 011.414 0l1.414 1.414a1 1 0 01-1.414 1.414L5.636 7.05a1 1 0 010-1.414zm11.314 11.314a1 1 0 011.414 0l1.414 1.414a1 1 0 01-1.414 1.414l-1.414-1.414a1 1 0 010-1.414zM2 12a1 1 0 011-1h2a1 1 0 110 2H3a1 1 0 01-1-1zm17 0a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM7.05 16.95a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM18.364 5.636a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM12 7a5 5 0 100 10 5 5 0 000-10z"/></svg>}
        />
        <StatCard 
          title="CO₂ Avoided" 
          value={`${co2.toFixed(1)}t`} 
          subtitle="This Session"
          iconNode={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
        <StatCard 
          title="Fuel Saved" 
          value={`${fuelSaved.toLocaleString()}kg`} 
          subtitle="Aviation Fuel"
          iconNode={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.62 3.82l-1.41-1.41C17.84 2.03 17.33 1.83 16.82 2h-9.64C6.67 1.83 6.16 2.03 5.78 2.41L4.38 3.82c-.38.38-.58.89-.58 1.41v14.14c0 1.05.85 1.91 1.91 1.91h12.58c1.05 0 1.91-.85 1.91-1.91V5.23c0-.52-.2-1.03-.58-1.41zM11 16H8v-2h3v2zm4 0h-3v-2h3v2zm0-4H8v-2h7v2zm0-4H8V6h7v2z"/></svg>}
        />
      </div>

      {/* ─── Row 2: Visual Cards ─── */}
      <div className="grid grid-cols-12 gap-6 h-[280px]">
        
        {/* Welcome Card (col-span-5) */}
        <div className="col-span-5 glass-card relative overflow-hidden p-6 flex flex-col justify-between">
          {/* Background image & gradient */}
          <div className="absolute inset-0 bg-cover bg-center z-0 scale-105" style={{ backgroundImage: 'url(/jellyfish.png)', opacity: 0.7 }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b28] via-[#060b28]/80 to-transparent z-0" />
          
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="text-[#a0aec0] font-bold text-[13px] mb-1 tracking-wide">Welcome to SOLARIS</div>
            <div className="text-white text-[28px] font-bold mb-3 leading-tight">Operations <br />Center</div>
            <div className="text-[#a0aec0] text-[13px] leading-relaxed max-w-[220px]">
              Real-time solar radiation monitoring active. Fleet exposure is being tracked globally.
            </div>
            <div className="mt-auto">
              <button className="text-white text-[13px] font-bold flex items-center gap-1 hover:text-[#0075ff] transition-colors cursor-pointer group">
                Tap to record <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Satisfaction Rate equivalent (Diversions Prevented) (col-span-3) */}
        <div className="col-span-3 card-dark p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div>
            <div className="text-white font-bold text-lg mb-1">Interventions</div>
            <div className="text-[12px] text-white/70">Diversions Prevented</div>
          </div>
          
          <div className="flex-1 flex items-center justify-center mt-2">
            <MiniArc value={diversions} max={5} color="#ffffff" />
          </div>
          
          <div className="flex justify-between mt-4 text-[11px] text-white/80 px-4 bg-[rgba(255,255,255,0.1)] rounded-[12px] py-3 backdrop-blur-sm">
            <div className="flex flex-col items-center"><span>Est. CO2</span><span className="font-bold text-white">{co2.toFixed(1)}t</span></div>
            <div className="w-[1px] bg-white/20" />
            <div className="flex flex-col items-center"><span>Est. Fuel</span><span className="font-bold text-white">{fuelSaved}kg</span></div>
          </div>
        </div>

        {/* Referral Tracking equivalent (Fleet at Risk) (col-span-4) */}
        <div className="col-span-4 glass-card p-6 flex items-center justify-between">
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="text-white font-bold text-lg mb-1">Fleet Tracking</div>
              <div className="text-[12px] text-[#a0aec0]">Real-time Risk Score</div>
            </div>
            
            <div className="bg-[rgba(0,117,255,0.1)] px-5 py-3 rounded-[12px] border border-[rgba(0,117,255,0.2)]">
              <div className="text-[#a0aec0] text-[10px] uppercase font-bold mb-1 tracking-widest">Target Status</div>
              <div className="text-white font-bold text-xl">{atRisk} <span className="text-sm font-normal text-[#a0aec0]">At Risk</span></div>
            </div>
          </div>
          
          <div className="relative flex items-center justify-center h-full aspect-square right-4">
            {/* Glowing circle container */}
            <div className="absolute inset-0 bg-[#00ff88] rounded-full blur-[40px] opacity-10" />
            <div className="relative w-[130px] h-[130px] rounded-full border-[6px] border-[rgba(0,255,136,0.2)] flex flex-col items-center justify-center">
              {/* Inner arc progress visually simulated with border */}
              <div className="absolute inset-0 rounded-full border-[6px] border-[#00ff88] opacity-80" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${peakScore}%, 0 100%)` }} />
              <div className="text-white text-[32px] font-bold leading-none">{peakScore}<span className="text-[14px] text-[#a0aec0]">%</span></div>
              <div className="text-[#a0aec0] text-[10px] uppercase mt-2 font-bold tracking-wider">Peak Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Row 3: Lists ─── */}
      <div className="grid grid-cols-12 gap-6 pb-6">
        
        {/* Highest Risk Fleet Members (col-span-7) */}
        <div className="col-span-7 glass-card p-6 flex flex-col min-h-[350px]">
          <div className="text-white font-bold text-lg mb-1">Highest Risk Fleet Members</div>
          <div className="text-[#a0aec0] text-[12px] mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" /> 
            <span className="font-bold text-[#00ff88]">Live</span> tracking data
          </div>
          
          <div className="space-y-4 flex-1">
            {top5.map(ac => {
              const color = tierColor(ac.tier);
              const score = displayScore(ac.risk_score);
              return (
                <div key={ac.callsign} className="flex items-center justify-between p-3 rounded-[12px] hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer border border-transparent hover:border-[rgba(255,255,255,0.05)]" onClick={() => onNavigateToAircraft(ac.callsign)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-white font-mono text-[10px] font-bold border border-[rgba(255,255,255,0.1)]">
                      {ac.callsign.substring(0,2)}
                    </div>
                    <div>
                      <div className="font-mono text-[14px] font-bold text-white">{ac.callsign}</div>
                      <div className="text-[11px] text-[#a0aec0] font-mono">{ac.origin} → {ac.dest}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="font-mono text-[16px] font-bold w-12 text-right" style={{ color }}>{score}%</div>
                    <div className="w-32 h-1.5 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advisories Issued (col-span-5) */}
        <div className="col-span-5 glass-card p-6 flex flex-col min-h-[350px]">
          <div className="text-white font-bold text-lg mb-1">ACARS Advisories</div>
          <div className="text-[#a0aec0] text-[12px] mb-6">
            <span className="font-bold text-white">{atRisk > 0 ? atRisk : 'No'}</span> active advisories issued
          </div>
          
          <div className="space-y-4 flex-1">
            {atRisk > 0 ? (
              aircraft.filter(ac => ac.tier === 'CRITICAL' || ac.tier === 'RED').slice(0, 3).map(ac => (
                <div key={ac.callsign} className="p-4 rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-mono text-[14px] font-bold text-white">{ac.callsign}</div>
                    <span className="text-[10px] font-bold tracking-widest px-2 py-1 rounded-lg uppercase"
                      style={{ backgroundColor: `${tierColor(ac.tier)}20`, color: tierColor(ac.tier) }}>
                      {ac.tier}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#a0aec0] leading-relaxed">
                    {ac.deviations?.[0]?.label || 'Advisory transmission pending. Recommend altitude adjustment to reduce SEU risk.'}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <div className="text-4xl mb-3">🛡️</div>
                <div className="text-[13px] text-white font-bold">Fleet Nominal</div>
                <div className="text-[11px] text-[#a0aec0]">No active risk interventions</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

