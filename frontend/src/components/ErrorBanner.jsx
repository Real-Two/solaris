export default function ErrorBanner() {
  return (
    <div className="w-full px-5 py-2 text-[13px] font-medium z-20 flex items-center justify-center gap-2"
      style={{ background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', borderBottom: '1px solid rgba(255, 68, 68, 0.2)' }}
    >
      <span>⚠</span>
      <span>
        LIVE API CONNECTION DEGRADED — Some real-time data sources (NOAA, NMDB, OpenSky) are currently unreachable. Retrying automatically.
      </span>
    </div>
  );
}
