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
      <div className="flex items-center justify-center h-16 shrink-0">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" rx="8" fill="#1b4332" />
          <path d="M11 16l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 px-2 mt-2">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
              ${isActive
                ? 'text-white'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: '#1b4332',
              boxShadow: '0 4px 10px rgba(27, 67, 50, 0.2)',
            } : {}}
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">{item.icon}</span>
            <span className="nav-label text-[13px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Connection Status */}
      <div className="px-3 pb-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-[#10b981] pulse-dot' : 'bg-gray-400'}`} />
        <span className="nav-label text-[10px] font-bold tracking-wider uppercase"
              style={{ color: isConnected ? '#10b981' : '#6b7280' }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </nav>
  );
}
