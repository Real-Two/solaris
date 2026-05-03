import { useRef, useEffect } from 'react';

export default function TopBar({ solar, fetching, isStale, demoMode, onToggleDemo }) {
  const prevSolarRef = useRef(null);
  const flashRefs = useRef({});

  useEffect(() => {
    if (prevSolarRef.current && solar) {
      ['proton_flux_pfu', 'kp_index', 'x_ray_class_raw'].forEach(key => {
        if (prevSolarRef.current[key] !== solar[key] && flashRefs.current[key]) {
          flashRefs.current[key].classList.remove('data-flash');
          void flashRefs.current[key].offsetWidth;
          flashRefs.current[key].classList.add('data-flash');
        }
      });
    }
    prevSolarRef.current = solar;
  }, [solar]);

  const alertLevel = solar?.alert_level || 'GREEN';
  const isCritical = alertLevel === 'CRITICAL';

  const alertColors = {
    GREEN: 'bg-[#00ff88]/20 text-[#00ff88]',
    AMBER: 'bg-[#ffaa00]/20 text-[#ffaa00]',
    RED: 'bg-[#ff4444]/20 text-[#ff4444]',
    CRITICAL: 'bg-[#cc00ff]/20 text-[#cc00ff]',
  };

  return (
    <div
      className={`flex items-center justify-between px-6 h-[70px] shrink-0
        bg-transparent z-20
        ${isCritical ? 'critical-pulse' : ''}`}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${isStale ? 'bg-gray-500' : 'bg-[#0075ff] pulse-dot'}`}
          />
          <span className="font-sans text-xl font-bold text-white tracking-tight">
            Donezo<span className="text-[#0075ff]">.</span>
          </span>
        </div>
        <span className="text-[11px] text-[#A0AEC0] italic hidden xl:block">
          Solar weather is forecastable.
        </span>
      </div>

      {/* Center: Solar Metrics */}
      <div className="flex items-center gap-6 glass-card px-6 py-2 border-0 shadow-none">
        {fetching && <div className="spin-loader" />}

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest text-[#a0aec0] uppercase font-semibold">
            Proton Flux
          </span>
          <span
            ref={el => (flashRefs.current.proton_flux_pfu = el)}
            className="font-mono text-sm font-bold text-white px-1 rounded"
          >
            {solar ? `${solar.proton_flux_pfu.toFixed(1)} pfu` : '—'}
          </span>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest text-[#a0aec0] uppercase font-semibold">
            Kp Index
          </span>
          <span
            ref={el => (flashRefs.current.kp_index = el)}
            className="font-mono text-sm font-bold text-white px-1 rounded"
          >
            {solar ? solar.kp_index.toFixed(1) : '—'}
          </span>
        </div>

        <div className="w-px h-5 bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-widest text-[#a0aec0] uppercase font-semibold">
            X-Ray
          </span>
          <span
            ref={el => (flashRefs.current.x_ray_class_raw = el)}
            className="font-mono text-sm font-bold text-white px-1 rounded"
          >
            {solar?.x_ray_class_raw || '—'}
          </span>
        </div>
      </div>

      {/* Right: Alert + Timestamp + Demo Toggle */}
      <div className="flex items-center gap-4">
        <span
          className={`px-3 py-1.5 rounded-[8px] text-[10px] font-bold tracking-wider uppercase
            ${alertColors[alertLevel] || alertColors.GREEN}`}
        >
          {alertLevel}
        </span>
        <span className="text-[11px] text-[#a0aec0] font-mono font-medium">
          {solar?.last_updated
            ? new Date(solar.last_updated).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }) + ' UTC'
            : '--:--:-- UTC'}
        </span>

        {/* Demo Mode Toggle */}
        <button
          onClick={onToggleDemo}
          id="demo-mode-toggle"
          className="flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[10px] font-bold
            tracking-wider uppercase transition-all duration-300 cursor-pointer border"
          style={{
            background: demoMode ? 'rgba(255, 170, 0, 0.15)' : 'rgba(255,255,255,0.05)',
            color: demoMode ? '#ffaa00' : '#ffffff',
            borderColor: demoMode ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255,255,255,0.1)',
            boxShadow: demoMode ? '0 0 15px rgba(255, 170, 0, 0.2)' : 'none',
          }}
        >
          {/* Satellite Icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 7L9 3L5 7l4 4" />
            <path d="M17 11l4 4-4 4-4-4" />
            <path d="M8 12l4 4" />
            <path d="M16 8l-4-4" />
            <circle cx="18" cy="5" r="1" fill="currentColor" />
            <path d="M2 22l6-6" />
            <circle cx="4" cy="20" r="2" />
          </svg>
          <span>Demo</span>
          {demoMode && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] pulse-dot" />
          )}
        </button>
      </div>
    </div>
  );
}
