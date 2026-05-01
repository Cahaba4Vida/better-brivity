import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, GitBranch,
  Zap, FileText, ChevronRight, Bot
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',   icon: Users,           label: 'Clients' },
  { to: '/workflows', icon: GitBranch,       label: 'Workflows' },
  { to: '/skills',    icon: Zap,             label: 'Skills' },
  { to: '/templates', icon: FileText,        label: 'Templates' },
]

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: '#0d0f14',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0'
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #3b5bdb, #5c7cfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bot size={16} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>Zack AI</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 1 }}>Real Estate Portal</div>
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 11, color: '#6b7280' }}>AI agent active</span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 12px' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              color: isActive ? '#e8eaf0' : '#6b7280',
              background: isActive ? 'rgba(59,91,219,0.15)' : 'transparent',
              transition: 'all 0.15s'
            })}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: 11, color: '#4b5563' }}>
            Powered by Ollama + Netlify
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: '#0d0f14' }}>
        <Outlet />
      </main>
    </div>
  )
}
