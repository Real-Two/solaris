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
  { time: 14.0, text: 'Pre-event, nominal conditions', color: '#00ff88' },
  { time: 16.5, text: 'SPE onset detected', color: '#ffaa00' },
  { time: 17.3, text: 'SOLARIS advisory issued to ICE673', color: '#0075ff' },
  { time: 17.8, text: '⚠ Incident window', color: '#ff4444' },
  { time: 19.0, text: 'Peak flux 4200 pfu', color: '#cc00ff' },
  { time: 21.0, text: 'Event subsiding', color: '#ffaa00' },
];

const timelineEvents = [
  { time: '14:00', text: 'NOAA reports nominal solar conditions. All fleet at GREEN status.', type: 'normal' },
  { time: '16:30', text: 'SPE onset detected. Proton flux rising above 10 pfu. SOLARIS alert level changes to AMBER.', type: 'warning' },
  { time: '17:18', text: 'SOLARIS issues ACARS advisory to ICE673, ACA875, SAS903, FIN5. Recommends descent to FL310.', type: 'success' },
  { time: '17:48', text: 'Incident window — unmanaged aircraft in this corridor experienced avionics anomalies. SOLARIS-monitored aircraft already below threshold.', type: 'critical' },
  { time: '19:00', text: 'Peak flux reached 4,200 pfu. All 4 advised aircraft operating safely at FL310.', type: 'critical' },
  { time: '21:00', text: 'Event subsiding. Flux declining. Fleet returns to normal cruise altitude.', type: 'normal' },
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
  const baseColor = tinted === 'red' ? '#ff4444' : '#0075ff';

  return (
    <svg width="100%" height="180" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {/* Area fill */}
      <defs>
        <linearGradient id={`flux-grad-${tinted}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={baseColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={baseColor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#flux-grad-${tinted})`} />
      <path d={linePath} fill="none" stroke={baseColor} strokeWidth="2" opacity="0.8" style={{ filter: `drop-shadow(0 0 5px ${baseColor})` }} />

      {/* Threshold line */}
      <line x1={pad} y1={thresholdY} x2={pad + plotW} y2={thresholdY}
        stroke="#ff4444" strokeWidth="1" strokeDasharray="4,4" opacity="0.6" />
      <text x={pad + plotW - 2} y={thresholdY - 4} textAnchor="end" fill="#ff4444" fontSize="9" fontFamily="'IBM Plex Mono'">100 pfu threshold</text>

      {/* Cursor */}
      <line x1={cursorX} y1={pad} x2={cursorX} y2={pad + plotH} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <circle cx={cursorX} cy={pad + plotH - (Math.min(getFluxAtTime(currentTime), maxFlux) / maxFlux) * plotH}
        r="4" fill="#ffffff" stroke="none" style={{ filter: 'drop-shadow(0 0 4px white)' }} />

      {/* X axis labels */}
      {[14, 16, 18, 20, 22].map(t => (
        <text key={t} x={pad + ((t - 14) / 8) * plotW} y={h - 5} textAnchor="middle"
          fill="#a0aec0" fontSize="9" fontFamily="'IBM Plex Mono'">{t}:00</text>
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
    let start = currentTime;
    if (start >= 22) {
      setCurrentTime(14);
      start = 14;
    }
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 0.25; // 15 minutes
        if (next >= 22) {
          clearInterval(intervalRef.current);
          setPlaying(false);
          return 22;
        }
        return next;
      });
    }, 600);
  }, [playing, currentTime]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const flux = getFluxAtTime(currentTime);
  const isAdvisoryIssued = currentTime >= 17.3;
  const isIncidentWindow = currentTime >= 17.8;

  // Track the previous time state for flashing effects
  const [flashRed, setFlashRed] = useState(false);
  useEffect(() => {
    if (currentTime >= 17.8 && currentTime < 18.1 && playing) {
      setFlashRed(true);
      const t = setTimeout(() => setFlashRed(false), 800);
      return () => clearTimeout(t);
    }
  }, [currentTime, playing]);

  const typeColor = { normal: '#6b7280', warning: '#ffaa00', success: '#00d4ff', critical: '#ff4444' };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto h-full overflow-y-auto">
      {/* Title */}
      <div>
        <h1 className="text-[24px] font-bold text-white">October 30, 2025 — Solar Proton Event Replay</h1>
        <p className="text-[13px] text-[#a0aec0] mt-1">JetBlue A320 incident scenario · Demonstrating SOLARIS intervention capability</p>
      </div>

      {/* Scrubber */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-6 mb-4">
          <button onClick={handlePlay}
            className="w-12 h-12 rounded-[12px] flex items-center justify-center cursor-pointer transition-all border"
            style={{
              background: playing ? 'rgba(255,68,68,0.1)' : 'rgba(0,117,255,0.1)',
              borderColor: playing ? 'rgba(255,68,68,0.3)' : 'rgba(0,117,255,0.3)',
              color: playing ? '#ff4444' : '#0075ff',
              boxShadow: playing ? '0 0 15px rgba(255,68,68,0.2)' : '0 0 15px rgba(0,117,255,0.2)',
            }}>
            {playing ? '⏸' : '▶'}
          </button>
          <div className="flex-1">
            <input type="range" min="14" max="22" step="0.1" value={currentTime}
              onChange={e => setCurrentTime(parseFloat(e.target.value))}
              className="replay-slider w-full" />
          </div>
          <div className="font-mono text-[22px] font-bold text-white shrink-0 w-[120px] text-right">
            {Math.floor(currentTime)}:{String(Math.round((currentTime % 1) * 60)).padStart(2, '0')} <span className="text-[14px] text-[#a0aec0]">UTC</span>
          </div>
        </div>
        {/* Marker labels */}
        <div className="relative h-5 ml-[76px] mr-[130px]">
          {MARKERS.map((m, i) => (
            <div key={i} className="absolute text-[9px] font-mono font-bold" style={{
              left: `${((m.time - 14) / 8) * 100}%`,
              color: m.color,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              textShadow: `0 0 5px ${m.color}`,
            }}>▼</div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 ml-[76px]">
          <span className="font-mono text-[13px] text-[#a0aec0]">Flux:</span>
          <span className={`font-mono text-[20px] font-bold ${flux > 100 ? 'text-[#ff4444]' : flux > 10 ? 'text-[#ffaa00]' : 'text-[#00ff88]'}`}
                style={{ textShadow: `0 0 10px ${flux > 100 ? '#ff4444' : flux > 10 ? '#ffaa00' : '#00ff88'}` }}>
             {flux.toFixed(1)} pfu
          </span>
        </div>
      </div>

      {/* Split View */}
      <div className="grid grid-cols-2 gap-6">
        {/* WITHOUT SOLARIS */}
        <div className={`p-6 rounded-[20px] transition-all duration-300 ${flashRed ? 'bg-[rgba(255,68,68,0.2)] shadow-[0_0_40px_rgba(255,68,68,0.6)] border-[rgba(255,68,68,0.5)]' : isIncidentWindow ? 'shadow-[0_0_30px_rgba(255,68,68,0.4)]' : ''}`} style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.1)' }}>
          <div className="text-[11px] tracking-[0.15em] text-[#ff4444] uppercase font-bold mb-4">WITHOUT SOLARIS</div>
          {isIncidentWindow && (
            <div className="mb-4 p-4 rounded-[12px] animate-pulse" style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', boxShadow: '0 0 15px rgba(255,68,68,0.3)' }}>
              <span className="text-[13px] font-bold text-[#ff4444]">⚠ Incident Window</span>
              <p className="text-[12px] text-white/80 mt-1">Aircraft at FL390 with no advisory. Crew unaware of elevated radiation.</p>
            </div>
          )}
          {!isIncidentWindow && (
            <div className="mb-4 p-4 rounded-[12px]" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span className="text-[13px] text-[#a0aec0]">
                {currentTime < 16.5 ? 'No monitoring system active. Standard operations.' : 'Flux rising — no automated detection or advisory system.'}
              </span>
            </div>
          )}
          <FluxChart currentTime={currentTime} tinted="red" />
        </div>

        {/* WITH SOLARIS */}
        <div className={`p-6 rounded-[20px] transition-all duration-300 ${isAdvisoryIssued ? 'shadow-[0_0_30px_rgba(0,255,136,0.3)]' : ''}`} style={{ background: 'rgba(0,117,255,0.05)', border: '1px solid rgba(0,117,255,0.1)' }}>
          <div className="text-[11px] tracking-[0.15em] text-[#0075ff] uppercase font-bold mb-4">WITH SOLARIS</div>
          {isAdvisoryIssued && (
            <div className="mb-4 p-4 rounded-[12px] animate-pulse" style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)', boxShadow: '0 0 15px rgba(0,255,136,0.3)' }}>
              <span className="text-[13px] font-bold text-[#00ff88]">✓ SOLARIS Advisory Issued</span>
              <p className="text-[12px] text-white/80 mt-1">30 minutes before incident window. SEU exposure reduced by 62%.</p>
            </div>
          )}
          {!isAdvisoryIssued && (
            <div className="mb-4 p-4 rounded-[12px]" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span className="text-[13px] text-[#a0aec0]">
                {currentTime < 16.5 ? 'SOLARIS monitoring active. All 25 aircraft at GREEN status.' : 'SOLARIS detecting flux anomaly. Preparing advisories for polar-route aircraft.'}
              </span>
            </div>
          )}
          <FluxChart currentTime={currentTime} tinted="teal" />
        </div>
      </div>

      {/* Event Log Timeline */}
      <div className="glass-card p-6 pb-8">
        <div className="text-[10px] tracking-[0.15em] text-[#a0aec0] uppercase font-bold mb-6">Event Timeline</div>
        <div className="space-y-4">
          {timelineEvents.map((evt, i) => {
            const h = parseInt(evt.time.split(':')[0]);
            const m = parseInt(evt.time.split(':')[1]);
            const evtTime = h + m / 60;
            const isPassed = currentTime >= evtTime;
            
            let extraGlow = '';
            let textGlow = '';
            let prefix = '';
            
            if (evt.time === '17:18') {
              if (isPassed) {
                extraGlow = '0 0 15px rgba(0,212,255,0.4)';
              }
            } else if (evt.time === '17:48') {
              prefix = '⚠ ';
              if (isPassed) {
                extraGlow = '0 0 15px rgba(255,68,68,0.4)';
              }
            }
            
            return (
              <div key={i} className="flex gap-6 py-2 border-l-[3px] pl-5 ml-2 transition-all duration-300"
                style={{ 
                  borderColor: typeColor[evt.type],
                  boxShadow: extraGlow,
                  opacity: isPassed ? 1 : 0.4
                }}>
                <span className="text-[14px] font-mono font-bold text-[#00d4ff] shrink-0 w-14 pt-0.5">{evt.time}</span>
                <span className={`text-[13px] leading-relaxed font-medium ${isPassed ? 'text-white' : 'text-[#a0aec0]'}`}>
                  <span className="text-[#ff4444] font-bold">{prefix}</span>{evt.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
