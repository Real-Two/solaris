import { useState, useEffect, useRef, useCallback } from 'react';

// Timeline data points — simplified Oct 30 2025 SPE
const TIMELINE = [
  { time: 14.0, flux: 0.3, label: 'Pre-event, nominal conditions', phase: 'nominal' },
  { time: 15.0, flux: 0.5, phase: 'nominal' },
  { time: 16.0, flux: 2.1, phase: 'onset' },
  { time: 16.5, flux: 45, label: 'SPE onset detected', phase: 'onset' },
  { time: 17.0, flux: 380, phase: 'rising' },
  { time: 17.3, flux: 1200, label: 'SOLARIS advisory issued to ICE673', phase: 'advisory' },
  { time: 17.8, flux: 2800, label: '⚠ Incident window — unmanaged aircraft affected', phase: 'incident' },
  { time: 18.0, flux: 3400, phase: 'peak' },
  { time: 18.5, flux: 3900, phase: 'peak' },
  { time: 19.0, flux: 4200, label: 'Peak flux 4200 pfu', phase: 'peak' },
  { time: 19.5, flux: 3800, phase: 'decline' },
  { time: 20.0, flux: 2600, phase: 'decline' },
  { time: 20.5, flux: 1400, phase: 'decline' },
  { time: 21.0, flux: 620, label: 'Event subsiding', phase: 'decline' },
  { time: 21.5, flux: 180, phase: 'recovery' },
  { time: 22.0, flux: 45, phase: 'recovery' },
];

const MARKERS = [
  { time: 14.0, text: 'Pre-event, nominal conditions', color: '#10b981' },
  { time: 16.5, text: 'SPE onset detected', color: '#f59e0b' },
  { time: 17.3, text: 'SOLARIS advisory issued to ICE673', color: '#2d6a4f' },
  { time: 17.8, text: '⚠ Incident window', color: '#ef4444' },
  { time: 19.0, text: 'Peak flux 4200 pfu', color: '#9333ea' },
  { time: 21.0, text: 'Event subsiding', color: '#f59e0b' },
];

const EVENT_LOG = [
  { time: '14:00', text: 'NOAA reports nominal solar conditions. All fleet at GREEN status.', type: 'nominal' },
  { time: '16:30', text: 'GOES-16 detects sudden proton flux increase. SOLARIS monitoring enters AMBER alert.', type: 'warning' },
  { time: '17:18', text: 'SOLARIS issues ACARS advisory to ICE673 (KEF→JFK): "Descend to FL310, reduce SEU exposure by 62%".', type: 'advisory' },
  { time: '17:30', text: 'ICE673 acknowledges advisory. Begins descent from FL390 to FL310.', type: 'success' },
  { time: '17:48', text: 'Unmanaged JetBlue A320 at FL390 over North Atlantic experiences avionics anomaly due to SEU event.', type: 'critical' },
  { time: '18:00', text: 'SOLARIS escalates 3 additional aircraft (ACA875, SAS903, FIN5) to RED/CRITICAL status.', type: 'warning' },
  { time: '19:00', text: 'Peak proton flux reaches 4200 pfu. All SOLARIS-managed aircraft safely at lower altitudes.', type: 'critical' },
  { time: '21:00', text: 'Flux levels declining. SOLARIS begins clearing advisories for southern-route aircraft.', type: 'success' },
  { time: '22:00', text: 'Event subsiding. Fleet returning to nominal operations. 3 diversions prevented, 28.4t CO₂ saved.', type: 'nominal' },
];

function getFluxAtTime(t) {
  if (t <= TIMELINE[0].time) return TIMELINE[0].flux;
  if (t >= TIMELINE[TIMELINE.length - 1].time) return TIMELINE[TIMELINE.length - 1].flux;
  for (let i = 0; i < TIMELINE.length - 1; i++) {
    if (t >= TIMELINE[i].time && t <= TIMELINE[i + 1].time) {
      const pct = (t - TIMELINE[i].time) / (TIMELINE[i + 1].time - TIMELINE[i].time);
      return TIMELINE[i].flux + (TIMELINE[i + 1].flux - TIMELINE[i].flux) * pct;
    }
  }
  return 0;
}

// ─── Flux Chart (SVG-based) ───
function FluxChart({ currentTime, tinted }) {
  const w = 480, h = 160, pad = 30;
  const plotW = w - pad * 2, plotH = h - pad * 2;
  const maxFlux = 4500;

  // Build path from TIMELINE
  const points = TIMELINE.map(p => {
    const x = pad + ((p.time - 14) / 8) * plotW;
    const y = pad + plotH - (Math.min(p.flux, maxFlux) / maxFlux) * plotH;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x.toFixed(1)} ${pad + plotH} L ${points[0].x.toFixed(1)} ${pad + plotH} Z`;

  // Current time indicator
  const cursorX = pad + ((currentTime - 14) / 8) * plotW;

  // Threshold line at 100 pfu
  const thresholdY = pad + plotH - (100 / maxFlux) * plotH;

  return (
    <svg width="100%" height="180" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {/* Area fill */}
      <defs>
        <linearGradient id={`flux-grad-${tinted}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tinted === 'red' ? '#ef4444' : '#2d6a4f'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={tinted === 'red' ? '#ef4444' : '#2d6a4f'} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#flux-grad-${tinted})`} />
      <path d={linePath} fill="none" stroke={tinted === 'red' ? '#ef4444' : '#2d6a4f'} strokeWidth="2" opacity="0.8" />

      {/* Threshold line */}
      <line x1={pad} y1={thresholdY} x2={pad + plotW} y2={thresholdY}
        stroke="#ef4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
      <text x={pad + plotW - 2} y={thresholdY - 4} textAnchor="end" fill="#ef4444" fontSize="9" fontFamily="'IBM Plex Mono'">100 pfu threshold</text>

      {/* Cursor */}
      <line x1={cursorX} y1={pad} x2={cursorX} y2={pad + plotH} stroke="black" strokeWidth="1" opacity="0.5" />
      <circle cx={cursorX} cy={pad + plotH - (Math.min(getFluxAtTime(currentTime), maxFlux) / maxFlux) * plotH}
        r="4" fill="#111827" stroke="none" />

      {/* X axis labels */}
      {[14, 16, 18, 20, 22].map(t => (
        <text key={t} x={pad + ((t - 14) / 8) * plotW} y={h - 5} textAnchor="middle"
          fill="#6b7280" fontSize="9" fontFamily="'IBM Plex Mono'">{t}:00</text>
      ))}
    </svg>
  );
}

export default function EventReplay() {
  const [currentTime, setCurrentTime] = useState(14.0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  const handlePlay = useCallback(() => {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    if (currentTime >= 22) setCurrentTime(14);
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= 22) {
          clearInterval(intervalRef.current);
          setPlaying(false);
          return 22;
        }
        return prev + 0.5; // 1 hour every 2 seconds (0.5 per second at 1s interval)
      });
    }, 1000);
  }, [playing, currentTime]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const flux = getFluxAtTime(currentTime);
  const isAdvisoryIssued = currentTime >= 17.3;
  const isIncidentWindow = currentTime >= 17.8;
  const visibleEvents = EVENT_LOG.filter(e => {
    const h = parseInt(e.time.split(':')[0]);
    const m = parseInt(e.time.split(':')[1]);
    return h + m / 60 <= currentTime;
  });

  const typeColor = { nominal: '#10b981', warning: '#f59e0b', advisory: '#2d6a4f', success: '#10b981', critical: '#ef4444' };

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">October 30, 2025 — Solar Proton Event Replay</h1>
        <p className="text-[13px] text-gray-500 mt-1">JetBlue A320 incident scenario · Demonstrating SOLARIS intervention capability</p>
      </div>

      {/* Scrubber */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={handlePlay}
            className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all"
            style={{
              background: playing ? 'rgba(239,68,68,0.1)' : 'rgba(45,106,79,0.1)',
              border: `1px solid ${playing ? 'rgba(239,68,68,0.3)' : 'rgba(45,106,79,0.3)'}`,
              color: playing ? '#ef4444' : '#2d6a4f',
            }}>
            {playing ? '⏸' : '▶'}
          </button>
          <div className="flex-1">
            <input type="range" min="14" max="22" step="0.1" value={currentTime}
              onChange={e => setCurrentTime(parseFloat(e.target.value))}
              className="replay-slider w-full" />
          </div>
          <div className="font-mono text-lg font-bold text-gray-900 shrink-0 w-20 text-right">
            {Math.floor(currentTime)}:{String(Math.round((currentTime % 1) * 60)).padStart(2, '0')} UTC
          </div>
        </div>
        {/* Marker labels */}
        <div className="relative h-5 ml-14 mr-20">
          {MARKERS.map((m, i) => (
            <div key={i} className="absolute text-[8px] font-mono" style={{
              left: `${((m.time - 14) / 8) * 100}%`,
              color: m.color,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
            }}>▼</div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-1 ml-14">
          <span className="font-mono text-sm text-gray-500">Flux:</span>
          <span className={`font-mono text-lg font-bold ${flux > 100 ? 'text-red-500' : flux > 10 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {flux.toFixed(1)} pfu
          </span>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-2 gap-4">
        {/* WITHOUT SOLARIS */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
          <div className="text-[10px] tracking-[0.15em] text-red-500 uppercase font-bold mb-3">WITHOUT SOLARIS</div>
          {isIncidentWindow && (
            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span className="text-[12px] font-bold text-red-600">⚠ SEU EVENT — Avionics anomaly detected on ICE673-equivalent</span>
              <p className="text-[11px] text-gray-600 mt-1">Aircraft at FL390 with no advisory. Crew unaware of elevated radiation.</p>
            </div>
          )}
          {!isIncidentWindow && (
            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <span className="text-[12px] text-gray-600">
                {currentTime < 16.5 ? 'No monitoring system active. Standard operations.' : 'Flux rising — no automated detection or advisory system.'}
              </span>
            </div>
          )}
          <FluxChart currentTime={currentTime} tinted="red" />
        </div>

        {/* WITH SOLARIS */}
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(45,106,79,0.03)', border: '1px solid rgba(45,106,79,0.1)' }}>
          <div className="text-[10px] tracking-[0.15em] text-[#2d6a4f] uppercase font-bold mb-3">WITH SOLARIS</div>
          {isAdvisoryIssued && (
            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="text-[12px] font-bold text-emerald-600">✓ Advisory issued — ICE673 descended to FL310</span>
              <p className="text-[11px] text-gray-600 mt-1">30 minutes before incident window. SEU exposure reduced by 62%.</p>
            </div>
          )}
          {!isAdvisoryIssued && (
            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.03)' }}>
              <span className="text-[12px] text-gray-600">
                {currentTime < 16.5 ? 'SOLARIS monitoring active. All 25 aircraft at GREEN status.' : 'SOLARIS detecting flux anomaly. Preparing advisories for polar-route aircraft.'}
              </span>
            </div>
          )}
          <FluxChart currentTime={currentTime} tinted="teal" />
        </div>
      </div>

      {/* Event Log Timeline */}
      <div className="glass-card p-5">
        <div className="text-[10px] tracking-[0.15em] text-gray-500 uppercase font-semibold mb-4">Event Timeline</div>
        <div className="space-y-0">
          {visibleEvents.map((evt, i) => (
            <div key={i} className="flex gap-4 py-3 border-l-2 pl-4 ml-2"
              style={{ borderColor: typeColor[evt.type] || '#6b7280' }}>
              <span className="text-[12px] font-mono font-bold text-gray-500 shrink-0 w-12">{evt.time}</span>
              <span className="text-[12px] text-gray-900">{evt.text}</span>
            </div>
          ))}
          {visibleEvents.length === 0 && (
            <div className="text-[12px] text-gray-500 py-4 text-center">Advance the timeline to see events...</div>
          )}
        </div>
      </div>
    </div>
  );
}
