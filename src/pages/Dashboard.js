// pages/Dashboard.js
import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ ...cardStyles.stat, borderColor: accent ? 'var(--border-gold)' : 'var(--border-subtle)' }}>
      <div style={{ ...cardStyles.statValue, color: accent ? 'var(--accent-gold)' : 'var(--text-primary)' }}>{value}</div>
      <div style={cardStyles.statLabel}>{label}</div>
      {sub && <div style={cardStyles.statSub}>{sub}</div>}
    </div>
  );
}

function DealRow({ deal, onClick }) {
  const statusColors = {
    active: { bg: 'rgba(74, 148, 112, 0.12)', color: '#6bc49a', border: 'rgba(74, 148, 112, 0.3)' },
    under_contract: { bg: 'rgba(74, 127, 165, 0.12)', color: '#6b9fc4', border: 'rgba(74, 127, 165, 0.3)' },
    searching: { bg: 'rgba(184, 131, 42, 0.12)', color: '#d4a843', border: 'rgba(184, 131, 42, 0.3)' },
    closed: { bg: 'rgba(90, 86, 80, 0.12)', color: '#9a9590', border: 'rgba(90, 86, 80, 0.3)' },
  };
  const sc = statusColors[deal.status] || statusColors.closed;
  const pendingTasks = (deal.tasks || []).filter(t => !t.done);
  const urgentCount = pendingTasks.filter(t => t.urgent).length;

  return (
    <div style={cardStyles.dealRow} onClick={onClick}>
      <div style={cardStyles.dealLeft}>
        <div style={cardStyles.dealType}>{deal.type === 'listing' ? 'LIST' : deal.type === 'transaction' ? 'TXN' : 'BUY'}</div>
        <div>
          <div style={cardStyles.dealAddress}>{deal.address}</div>
          <div style={cardStyles.dealClient}>{deal.client}</div>
        </div>
      </div>
      <div style={cardStyles.dealRight}>
        <div style={cardStyles.dealPrice}>${deal.price?.toLocaleString()}</div>
        <div style={{ ...cardStyles.dealStatus, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
          {deal.status.replace('_', ' ')}
        </div>
        {urgentCount > 0 && (
          <div style={cardStyles.urgentFlag}>⚑ {urgentCount}</div>
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, onToggle }) {
  return (
    <div style={{ ...cardStyles.taskRow, opacity: task.done ? 0.45 : 1 }}>
      <button style={{ ...cardStyles.checkbox, background: task.done ? 'var(--accent-gold-dim)' : 'transparent' }} onClick={onToggle}>
        {task.done && <span style={{ color: 'var(--accent-gold)', fontSize: 10 }}>✓</span>}
      </button>
      <div style={cardStyles.taskContent}>
        <span style={{ ...cardStyles.taskText, textDecoration: task.done ? 'line-through' : 'none' }}>{task.text}</span>
        <span style={cardStyles.taskDeal}>{task.dealAddress}</span>
      </div>
      {task.urgent && !task.done && <span style={cardStyles.urgentChip}>URGENT</span>}
    </div>
  );
}

export default function Dashboard() {
  const { deals, activeListings, activeTransactions, buyerLeads, urgentTasks, toggleTask, setActiveView, setActiveDealId } = useApp();
  const allPendingTasks = deals.flatMap(d =>
    (d.tasks || []).filter(t => !t.done).map(t => ({ ...t, dealAddress: d.address, dealId: d.id }))
  ).slice(0, 8);

  const totalVolume = deals.reduce((sum, d) => sum + (d.price || 0), 0);

  const today = new Date();
  const upcomingDeadlines = deals.flatMap(d =>
    (d.contingencies || [])
      .filter(c => !c.done && c.deadline)
      .map(c => ({ ...c, dealAddress: d.address, dealId: d.id }))
  ).filter(c => {
    const days = Math.ceil((new Date(c.deadline) - today) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 14;
  }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 4);

  const greeting = () => {
    const h = today.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.greeting}>{greeting()}</div>
          <h1 style={styles.title}>Command Center</h1>
        </div>
        <div style={styles.dateChip}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <StatCard label="Active Listings" value={activeListings.length} accent />
        <StatCard label="Under Contract" value={activeTransactions.length} />
        <StatCard label="Buyer Leads" value={buyerLeads.length} />
        <StatCard label="Total Pipeline" value={`$${(totalVolume / 1e6).toFixed(2)}M`} />
        <StatCard label="Urgent Tasks" value={urgentTasks.length} sub="need attention" />
      </div>

      {/* Main grid */}
      <div style={styles.grid}>
        {/* Left column */}
        <div style={styles.col}>
          {/* Active deals */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Active Deals</span>
              <button style={styles.cardAction} onClick={() => setActiveView('deals')}>View all →</button>
            </div>
            <div style={styles.cardBody}>
              {deals.length === 0
                ? <div style={styles.empty}>No active deals. Add your first deal.</div>
                : deals.slice(0, 5).map(deal => (
                  <DealRow key={deal.id} deal={deal} onClick={() => { setActiveDealId(deal.id); setActiveView('deals'); }} />
                ))}
            </div>
          </div>

          {/* Upcoming deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Upcoming Deadlines</span>
                <span style={styles.cardSubtitle}>Next 14 days</span>
              </div>
              <div style={styles.cardBody}>
                {upcomingDeadlines.map((c, i) => {
                  const days = Math.ceil((new Date(c.deadline) - today) / (1000 * 60 * 60 * 24));
                  const isHot = days <= 3;
                  return (
                    <div key={i} style={styles.deadlineRow}>
                      <div style={{ ...styles.deadlineDays, color: isHot ? '#e07070' : 'var(--accent-gold)' }}>
                        {days === 0 ? 'TODAY' : `${days}d`}
                      </div>
                      <div>
                        <div style={styles.deadlineName}>{c.name}</div>
                        <div style={styles.deadlineDeal}>{c.dealAddress}</div>
                      </div>
                      <div style={styles.deadlineDate}>{new Date(c.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={styles.col}>
          {/* Tasks */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Priority Tasks</span>
              <span style={styles.cardSubtitle}>{allPendingTasks.length} pending</span>
            </div>
            <div style={styles.cardBody}>
              {allPendingTasks.length === 0
                ? <div style={styles.empty}>All clear — no pending tasks!</div>
                : allPendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task.dealId, task.id)}
                  />
                ))}
            </div>
          </div>

          {/* Quick AI prompts */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Quick AI Actions</span>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.quickGrid}>
                {[
                  { label: 'Draft follow-up email', mode: 'executive' },
                  { label: 'Generate listing description', mode: 'listing' },
                  { label: 'Check transaction status', mode: 'transaction' },
                  { label: 'Create offer strategy', mode: 'executive' },
                  { label: 'Write social post', mode: 'listing' },
                  { label: 'Flag at-risk deals', mode: 'transaction' },
                ].map((item, i) => (
                  <button
                    key={i}
                    style={styles.quickBtn}
                    onClick={() => setActiveView('ai-chat')}
                  >
                    <span style={styles.quickMode}>{item.mode.slice(0,2).toUpperCase()}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '36px 40px', maxWidth: 1200, animation: 'fadeUp 0.4s ease forwards' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  greeting: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.1em',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 36,
    fontWeight: 400,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  dateChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-tertiary)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '6px 12px',
    letterSpacing: '0.04em',
  },
  statsRow: {
    display: 'flex',
    gap: 12,
    marginBottom: 28,
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  col: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  cardTitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    color: 'var(--text-primary)',
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  cardSubtitle: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-tertiary)',
  },
  cardAction: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--accent-gold)',
    cursor: 'pointer',
    letterSpacing: '0.04em',
  },
  cardBody: { padding: '8px 0' },
  empty: {
    padding: '20px',
    fontSize: 12,
    color: 'var(--text-tertiary)',
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
  },
};

const cardStyles = {
  stat: {
    flex: 1,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 18px',
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 32,
    fontWeight: 400,
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--text-tertiary)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  statSub: { fontSize: 10, color: 'var(--accent-red)', marginTop: 2, fontFamily: 'var(--font-mono)' },
  dealRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  dealLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  dealType: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 500,
    color: 'var(--accent-gold)',
    background: 'var(--accent-gold-dim)',
    border: '1px solid var(--border-gold)',
    borderRadius: 3,
    padding: '2px 6px',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  dealAddress: { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 1 },
  dealClient: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  dealRight: { display: 'flex', alignItems: 'center', gap: 8 },
  dealPrice: { fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' },
  dealStatus: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    borderRadius: 3,
    padding: '2px 6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  urgentFlag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#e07070',
    letterSpacing: '0.06em',
  },
  taskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 20px',
    borderBottom: '1px solid var(--border-subtle)',
    transition: 'opacity 0.2s',
  },
  checkbox: {
    width: 16,
    height: 16,
    border: '1px solid var(--border-medium)',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 1,
    transition: 'all 0.15s',
  },
  taskContent: { flex: 1, minWidth: 0 },
  taskText: { fontSize: 12, color: 'var(--text-primary)', display: 'block', marginBottom: 2 },
  taskDeal: { fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  urgentChip: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: '#e07070',
    background: 'rgba(160,74,74,0.1)',
    border: '1px solid rgba(160,74,74,0.25)',
    borderRadius: 2,
    padding: '1px 5px',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  deadlineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '10px 20px',
    borderBottom: '1px solid var(--border-subtle)',
  },
  deadlineDays: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 500,
    minWidth: 36,
    textAlign: 'right',
  },
  deadlineName: { fontSize: 12, color: 'var(--text-primary)', marginBottom: 1 },
  deadlineDeal: { fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  deadlineDate: { marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    padding: '12px',
  },
  quickBtn: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 10px',
    fontSize: 11,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.3,
  },
  quickMode: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    color: 'var(--accent-gold)',
    background: 'var(--accent-gold-dim)',
    borderRadius: 2,
    padding: '1px 4px',
    flexShrink: 0,
    letterSpacing: '0.04em',
  },
};
