import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Table2, Clock, BarChart3, Satellite } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { path: '/map', label: 'Fleet Map', icon: <Map size={20} /> },
  { path: '/fleet', label: 'Fleet Table', icon: <Table2 size={20} /> },
  { path: '/replay', label: 'Event Replay', icon: <Clock size={20} /> },
  { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
];

export default function Sidebar({ isConnected }) {
  return (
    <nav className="nav-sidebar shrink-0 h-full flex flex-col z-30 group">
      {/* Logo */}
      <div className="flex items-center justify-start px-4 h-[70px] shrink-0 border-b border-white/5 gap-3 overflow-hidden whitespace-nowrap">
        <Satellite size={28} color="#00d4ff" className="shrink-0" />
        <span className="nav-label font-mono font-bold text-[#00d4ff] text-xl tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          SOLARIS
        </span>
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
