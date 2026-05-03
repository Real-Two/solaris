import { useState, useCallback } from 'react';
import { tierColor, displayScore } from '../api';

// ─── Risk Score Gauge (SVG Arc) ───
function RiskGauge({ score, tier }) {
  const color = tierColor(tier);
  const normalizedScore = displayScore(score);
  const radius = 52;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (normalizedScore / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="relative flex items-center justify-center my-4">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Background arc */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={stroke}
        />
        {/* Progress arc */}
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{
            transition: 'stroke-dashoffset 0.8s ease',
            filter: `drop-shadow(0 0 6px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-2xl font-bold" style={{ color }}>
          {normalizedScore}
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Risk</span>
      </div>
    </div>
  );
}

// ─── Solar Exposure Bar ───
function FluxBar({ flux }) {
  // Bar shows 0 to 200 pfu range, log scale representation
  const maxDisplay = 200;
  const pct = Math.min((flux / maxDisplay) * 100, 100);
  const amberPct = (10 / maxDisplay) * 100;
  const redPct = (100 / maxDisplay) * 100;

  return (
    <div className="mt-2">
      <div className="relative w-full h-3 rounded-full overflow-hidden bg-gray-200">
        {/* Green zone */}
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500/20"
          style={{ width: `${amberPct}%` }}
        />
        {/* Amber zone */}
        <div
          className="absolute inset-y-0 bg-amber-500/20"
          style={{ left: `${amberPct}%`, width: `${redPct - amberPct}%` }}
        />
        {/* Red zone */}
        <div
          className="absolute inset-y-0 bg-red-500/20"
          style={{ left: `${redPct}%`, width: `${100 - redPct}%` }}
        />
        {/* Dividers */}
        <div
          className="absolute inset-y-0 w-px bg-amber-500/50"
          style={{ left: `${amberPct}%` }}
        />
        <div
          className="absolute inset-y-0 w-px bg-red-500/50"
          style={{ left: `${redPct}%` }}
        />
        {/* Indicator needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gray-800 rounded-full"
          style={{
            left: `${pct}%`,
            boxShadow: '0 0 6px rgba(0,0,0,0.2)',
            transition: 'left 0.5s ease',
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-gray-500 font-mono">
        <span>0 pfu</span>
        <span>10</span>
        <span>100</span>
        <span>200+</span>
      </div>
    </div>
  );
}

// ─── Deviation Option Card ───
function DeviationCard({ option, isRecommended }) {
  return (
    <div
      className={`glass-card rounded-lg p-3 relative
        ${isRecommended ? 'border-[#2d6a4f]/40 border' : ''}`}
    >
      {isRecommended && (
        <span className="absolute top-2 right-2 text-[8px] font-bold tracking-wider text-[#2d6a4f] bg-[#2d6a4f]/10 px-1.5 py-0.5 rounded">
          RECOMMENDED
        </span>
      )}
      <div className="text-[13px] font-medium text-gray-900 mb-2">
        {option.label}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-mono font-bold text-[#2d6a4f] bg-[#2d6a4f]/10 px-2 py-0.5 rounded">
          −{option.flux_reduction_pct}% flux
        </span>
      </div>
      <div className="flex gap-2">
        <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          +{option.extra_fuel_kg} kg fuel
        </span>
        <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          +{option.extra_time_min} min
        </span>
        <span className="text-[10px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {option.co2_delta_tonnes > 0 ? '+' : ''}{option.co2_delta_tonnes}t CO₂
        </span>
      </div>
    </div>
  );
}

export default function DetailPanel({ aircraft }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (aircraft?.acars) {
      navigator.clipboard.writeText(aircraft.acars).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [aircraft]);

  const showDeviations = aircraft?.tier === 'AMBER' || aircraft?.tier === 'RED' || aircraft?.tier === 'CRITICAL';
  const showAcars = aircraft?.tier === 'RED' || aircraft?.tier === 'CRITICAL';

  return (
    <div
      className="shrink-0 flex flex-col border-l border-gray-200 bg-white overflow-hidden"
      style={{ width: 320 }}
    >
      {!aircraft ? (
        /* Default empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <svg
            className="w-16 h-16 text-gray-300 opacity-80 mb-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2 L14 8 L21 10 L14 12 L14 18 L17 20 L17 21 L12 19 L7 21 L7 20 L10 18 L10 12 L3 10 L10 8 Z" />
          </svg>
          <span className="text-[13px] text-gray-500">
            Select an aircraft to view details
          </span>
        </div>
      ) : (
        /* Aircraft Detail */
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header */}
          <div>
            <div className="font-mono text-xl font-bold text-gray-900">
              {aircraft.callsign}
            </div>
            <div className="text-[13px] text-gray-500 font-mono mt-1">
              {aircraft.origin} → {aircraft.dest}
            </div>
            <div className="flex gap-4 mt-2 text-[11px] font-mono text-gray-500">
              <span>{Math.abs(aircraft.lat).toFixed(2)}°{aircraft.lat >= 0 ? 'N' : 'S'}, {Math.abs(aircraft.lon).toFixed(2)}°{aircraft.lon >= 0 ? 'E' : 'W'}</span>
            </div>
            <div className="flex gap-4 mt-1 text-[11px] font-mono text-gray-500">
              <span>FL{aircraft.alt_fl}</span>
              <span>HDG {aircraft.heading}°</span>
            </div>
          </div>

          {/* Risk Gauge */}
          <RiskGauge score={aircraft.risk_score} tier={aircraft.tier} />

          {/* Solar Exposure */}
          <div className="glass-card rounded-lg p-3">
            <div className="text-[10px] tracking-[0.12em] text-gray-500 uppercase font-semibold mb-2">
              Solar Exposure at Position
            </div>
            <div className="font-mono text-lg font-bold text-[#2d6a4f]">
              {aircraft.corrected_flux?.toFixed(2) || '—'}{' '}
              <span className="text-[11px] text-gray-500">pfu</span>
            </div>
            <FluxBar flux={aircraft.corrected_flux || 0} />
          </div>

          {/* Deviation Options */}
          {showDeviations && aircraft.deviations && aircraft.deviations.length > 0 && (
            <div>
              <div className="text-[10px] tracking-[0.12em] text-gray-500 uppercase font-semibold mb-2">
                Recommended Actions
              </div>
              <div className="space-y-2">
                {aircraft.deviations.map((opt, i) => (
                  <DeviationCard
                    key={i}
                    option={opt}
                    isRecommended={opt.recommended}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ACARS Advisory */}
          {showAcars && aircraft.acars && (
            <div>
              <div className="text-[10px] tracking-[0.12em] text-gray-500 uppercase font-semibold mb-2">
                ACARS Advisory
              </div>
              <pre className="glass-card rounded-lg p-3 text-[11px] font-mono text-gray-700 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {aircraft.acars}
              </pre>
              <button
                onClick={handleCopy}
                className="w-full mt-2 py-2 rounded-lg text-[12px] font-semibold tracking-wider
                  transition-all duration-200 cursor-pointer"
                style={{
                  background: copied ? 'rgba(16, 185, 129, 0.1)' : 'rgba(45, 106, 79, 0.1)',
                  color: copied ? '#10b981' : '#2d6a4f',
                  border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(45, 106, 79, 0.3)'}`,
                }}
                id="copy-acars-btn"
              >
                {copied ? 'Copied ✓' : 'Copy to Clipboard'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
