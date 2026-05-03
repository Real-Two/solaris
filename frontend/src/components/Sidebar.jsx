import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    path: '/map',
    label: 'Fleet Map',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
      </svg>
    ),
  },
  {
    path: '/fleet',
    label: 'Fleet Table',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    ),
  },
  {
    path: '/replay',
    label: 'Event Replay',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function Sidebar({ isConnected }) {
  return (
    <nav className="nav-sidebar shrink-0 h-full flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center justify-center h-[70px] shrink-0 border-b border-white/5">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" rx="8" fill="#0075ff" />
          <path d="M11 16l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-2 px-3 mt-6">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-[12px] transition-all duration-200 group relative
              ${isActive
                ? 'text-white'
                : 'text-[#a0aec0] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: '#0075ff',
              boxShadow: '0 4px 15px rgba(0, 117, 255, 0.4)',
            } : {}}
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
            <span className="nav-label text-[13px] font-bold">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Connection Status */}
      <div className="px-4 pb-6 flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isConnected ? 'bg-[#00ff88] shadow-[0_0_8px_#00ff88] pulse-dot' : 'bg-gray-500'}`} />
        <span className="nav-label text-[10px] font-bold tracking-widest uppercase"
              style={{ color: isConnected ? '#00ff88' : '#a0aec0' }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </nav>
  );
}
