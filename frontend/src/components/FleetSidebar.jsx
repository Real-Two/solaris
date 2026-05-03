import { useMemo } from 'react';
import { tierColor, tierClass, displayScore } from '../api';

function SkeletonCard() {
  return (
    <div className="glass-card rounded-lg p-3 mb-2">
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
      className={`glass-card rounded-lg cursor-pointer fleet-card overflow-hidden
        hover:bg-gray-50 transition-colors duration-200
        ${isSelected ? 'ring-2 ring-[#2d6a4f]/50' : ''}`}
      onClick={() => onSelect(aircraft.callsign)}
      role="button"
      tabIndex={0}
      id={`fleet-card-${aircraft.callsign}`}
    >
      <div className="flex items-stretch">
        {/* Tier Color Bar */}
        <div
          className="w-1 shrink-0 rounded-l"
          style={{ backgroundColor: color }}
        />

        {/* Content */}
        <div className="flex-1 flex items-center justify-between p-3 pl-3 min-w-0">
          <div className="min-w-0">
            <div className="font-mono text-sm font-bold text-gray-900 truncate">
              {aircraft.callsign}
            </div>
            <div className="text-[11px] text-gray-500 font-mono mt-0.5">
              {aircraft.origin} → {aircraft.dest}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Tier Badge */}
            <span
              className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full"
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
      className="shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden"
      style={{ width: 280 }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] tracking-[0.15em] text-gray-500 uppercase font-semibold">
            Fleet Monitor
          </span>
          <span className="font-mono text-[11px] text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded-full">
            {aircraft.length}
          </span>
        </div>

        {/* Quick-Stat Chips */}
        {!loading && (
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1 text-[10px] font-mono bg-red-50 text-red-600 px-2 py-1 rounded-full">
              <span>🔴</span>
              <span>{tierCounts.CRITICAL + tierCounts.RED} critical</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
              <span>🟡</span>
              <span>{tierCounts.AMBER} amber</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
              <span>🟢</span>
              <span>{tierCounts.GREEN} safe</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
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
