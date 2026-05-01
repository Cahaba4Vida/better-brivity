// components/Sidebar.js
import React from 'react';
import { useApp } from '../lib/AppContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'deals', label: 'Deals', icon: '◉' },
  { id: 'ai-chat', label: 'AI Assistant', icon: '✦' },
  { id: 'transactions', label: 'Transactions', icon: '⊡' },
  { id: 'listings', label: 'Listings', icon: '⊞' },
  { id: 'contacts', label: 'Contacts', icon: '⊕' },
  { id: 'settings', label: 'Settings', icon: '⊙' },
];

export default function Sidebar() {
  const { activeView, setActiveView, agentProfile, urgentTasks } = useApp();

  return (
    <aside style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoMark}>A</div>
        <div>
          <div style={styles.logoText}>AGENT</div>
          <div style={styles.logoSub}>PORTAL</div>
        </div>
      </div>

      {/* Agent info */}
      <div style={styles.agentCard}>
        <div style={styles.agentAvatar}>
          {agentProfile.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style={styles.agentInfo}>
          <div style={styles.agentName}>{agentProfile.name}</div>
          <div style={styles.agentBrokerage}>{agentProfile.brokerage}</div>
        </div>
      </div>

      {urgentTasks.length > 0 && (
        <div style={styles.urgentBadge} onClick={() => setActiveView('dashboard')}>
          <span style={styles.urgentDot} />
          <span>{urgentTasks.length} urgent task{urgentTasks.length !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Navigation */}
      <nav style={styles.nav}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            style={{
              ...styles.navItem,
              ...(activeView === item.id ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveView(item.id)}
          >
            <span style={styles.navIcon}>{item.icon}</span>
            <span style={styles.navLabel}>{item.label}</span>
            {activeView === item.id && <span style={styles.navIndicator} />}
          </button>
        ))}
      </nav>

      <div style={styles.sidebarFooter}>
        <div style={styles.footerText}>© 2025 Agent Portal</div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 220,
    minWidth: 220,
    height: '100vh',
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 24px 0',
    position: 'sticky',
    top: 0,
    overflow: 'hidden',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '28px 20px 24px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  logoMark: {
    width: 32,
    height: 32,
    background: 'linear-gradient(135deg, var(--accent-gold), var(--accent-gold-light))',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: 18,
    color: '#08090e',
  },
  logoText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--text-primary)',
    letterSpacing: '0.18em',
  },
  logoSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.2em',
  },
  agentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 20px',
    margin: '12px 12px 4px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
  },
  agentAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--accent-gold-dim)',
    border: '1px solid var(--border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--accent-gold)',
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono)',
  },
  agentInfo: { flex: 1, minWidth: 0 },
  agentName: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  agentBrokerage: {
    fontSize: 10,
    color: 'var(--text-tertiary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'var(--font-mono)',
  },
  urgentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '8px 12px',
    padding: '6px 10px',
    background: 'rgba(160, 74, 74, 0.12)',
    border: '1px solid rgba(160, 74, 74, 0.3)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 11,
    color: '#e07070',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.02em',
  },
  urgentDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#e07070',
    animation: 'pulse 1.5s ease infinite',
    display: 'inline-block',
  },
  nav: {
    flex: 1,
    padding: '12px 12px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 400,
    color: 'var(--text-tertiary)',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    position: 'relative',
    letterSpacing: '0.03em',
    fontFamily: 'var(--font-body)',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'var(--bg-card)',
  },
  navIcon: {
    fontSize: 14,
    width: 18,
    textAlign: 'center',
    color: 'var(--accent-gold)',
    flexShrink: 0,
  },
  navLabel: { flex: 1 },
  navIndicator: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 3,
    height: 20,
    background: 'var(--accent-gold)',
    borderRadius: '2px 0 0 2px',
  },
  sidebarFooter: {
    padding: '12px 20px 0',
    borderTop: '1px solid var(--border-subtle)',
    marginTop: 8,
  },
  footerText: {
    fontSize: 10,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.05em',
  },
};
