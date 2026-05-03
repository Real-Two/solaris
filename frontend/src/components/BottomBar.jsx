import { useState, useEffect, useRef } from 'react';

function AnimatedCounter({ target, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (target === undefined || target === null) return;
    const from = fromRef.current;
    const diff = target - from;
    if (diff === 0) return;

    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = from + diff * eased;
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  const isDecimal = target % 1 !== 0;
  return <span>{isDecimal ? display.toFixed(1) : Math.round(display)}</span>;
}

export default function BottomBar({ summary, fleet, countdown, dataVersion, demoMode }) {
  const aircraft = fleet?.aircraft || [];
  const atRisk = aircraft.filter(ac => ac.tier === 'RED' || ac.tier === 'CRITICAL').length;
  const co2 = summary?.co2_saved_tonnes ?? 0;
  const diversions = summary?.diversions_prevented ?? 0;

  const metrics = [
    {
      icon: '🌱',
      label: 'CO₂ Avoided This Event',
      value: <AnimatedCounter target={co2} />,
      unit: 't',
      color: '#10b981',
    },
    {
      icon: '✈️',
      label: 'Diversions Prevented',
      value: <AnimatedCounter target={diversions} />,
      unit: '',
      color: '#2d6a4f',
    },
    {
      icon: '⚡',
      label: 'Fleet at Risk',
      value: atRisk,
      unit: '',
      color: atRisk > 0 ? '#ef4444' : '#10b981',
    },
    {
      icon: '🕐',
      label: demoMode ? 'Mode' : 'Next Refresh',
      value: demoMode ? 'DEMO' : countdown,
      unit: demoMode ? '' : 's',
      color: demoMode ? '#f59e0b' : '#2d6a4f',
    },
  ];

  return (
    <div
      className="shrink-0 flex items-center justify-around px-6 border-t border-gray-200 bg-white"
      style={{ height: 52 }}
    >
      {metrics.map((m, i) => (
        <div key={i} className="flex flex-col items-center" id={`metric-${i}`}>
          <span className="text-[9px] tracking-[0.12em] text-gray-500 font-medium uppercase mb-0.5">
            {m.icon} {m.label}
          </span>
          <span
            className="font-mono text-lg font-bold leading-none"
            style={{ color: m.color }}
          >
            {m.value}
            {m.unit && (
              <span className="text-[11px] ml-0.5 text-gray-500">{m.unit}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
