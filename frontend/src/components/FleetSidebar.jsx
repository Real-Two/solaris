import { useMemo } from 'react';
import { tierColor, tierClass, displayScore } from '../api';

function SkeletonCard() {
  return (
    <div className="glass-card rounded-lg p-3 mb-2 border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
      <div className="flex items-center gap-3">
        <div className="skeleton w-1 h-10 rounded" />
        <div className="flex-1">
          <div className="skeleton h-4 w-20 mb-2" />
          <div className="skeleton h-3 w-28" />
        </div>
        <div className="skeleton h-8 w-12 rounded" />
      </div>
    </div>
  );
}

function FleetCard({ aircraft, isSelected, onSelect }) {
  const color = tierColor(aircraft.tier);

  return (
    <div
      className={`glass-card rounded-[12px] cursor-pointer fleet-card overflow-hidden
        hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-200 border-[rgba(255,255,255,0.05)]
        ${isSelected ? 'ring-2 ring-[#0075ff]/50 bg-[rgba(255,255,255,0.05)]' : 'bg-[rgba(255,255,255,0.02)]'}`}
      onClick={() => onSelect(aircraft.callsign)}
      role="button"
      tabIndex={0}
      id={`fleet-card-${aircraft.callsign}`}
    >
      <div className="flex items-stretch">
        {/* Tier Color Bar */}
        <div
          className="w-1.5 shrink-0"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />

        {/* Content */}
        <div className="flex-1 flex items-center justify-between p-3 pl-3 min-w-0">
          <div className="min-w-0">
            <div className="font-mono text-[13px] font-bold text-white truncate">
              {aircraft.callsign}
            </div>
            <div className="text-[11px] text-[#a0aec0] font-mono mt-0.5">
              {aircraft.origin} → {aircraft.dest}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Tier Badge */}
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-2 py-1 rounded-[6px]"
              style={{
                backgroundColor: `${color}20`,
                color: color,
              }}
            >
              {aircraft.tier}
            </span>

            {/* Risk Score */}
            <div className="text-right">
              <span
                className="font-mono text-lg font-bold leading-none"
                style={{ color }}
              >
                {displayScore(aircraft.risk_score)}
              </span>
              <span
                className="font-mono text-[10px] ml-0.5"
                style={{ color }}
              >
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FleetSidebar({ fleet, loading, selectedCallsign, onSelect, dataVersion }) {
  const aircraft = fleet?.aircraft || [];

  const tierCounts = useMemo(() => {
    const counts = { CRITICAL: 0, RED: 0, AMBER: 0, GREEN: 0 };
    aircraft.forEach(ac => {
      if (counts[ac.tier] !== undefined) counts[ac.tier]++;
    });
    return counts;
  }, [aircraft]);

  return (
    <div
      className="shrink-0 flex flex-col border-r border-[rgba(255,255,255,0.05)] bg-[rgba(6,11,40,0.4)] backdrop-blur-3xl overflow-hidden"
      style={{ width: 280 }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-3 shrink-0 border-b border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold">
            Fleet Monitor
          </span>
          <span className="font-mono text-[11px] text-[#0075ff] font-bold bg-[#0075ff]/20 px-2 py-0.5 rounded-full">
            {aircraft.length}
          </span>
        </div>

        {/* Quick-Stat Chips */}
        {!loading && (
          <div className="flex gap-2 mb-2">
            <div className="flex items-center gap-1 text-[10px] font-mono bg-[rgba(255,68,68,0.1)] text-[#ff4444] font-bold px-2 py-1 rounded-[8px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4444] shadow-[0_0_5px_#ff4444]" />
              <span>{tierCounts.CRITICAL + tierCounts.RED}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono bg-[rgba(255,170,0,0.1)] text-[#ffaa00] font-bold px-2 py-1 rounded-[8px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] shadow-[0_0_5px_#ffaa00]" />
              <span>{tierCounts.AMBER}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono bg-[rgba(0,255,136,0.1)] text-[#00ff88] font-bold px-2 py-1 rounded-[8px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] shadow-[0_0_5px_#00ff88]" />
              <span>{tierCounts.GREEN}</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          aircraft.map(ac => (
            <FleetCard
              key={ac.callsign}
              aircraft={ac}
              isSelected={selectedCallsign === ac.callsign}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}
