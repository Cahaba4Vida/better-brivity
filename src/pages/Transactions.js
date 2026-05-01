// pages/Transactions.js
import React from 'react';
import { useApp } from '../lib/AppContext';

export default function Transactions() {
  const { activeTransactions, deals } = useApp();
  const txDeals = deals.filter(d => d.type === 'transaction');

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Transactions</h1>
      <div style={styles.sub}>Phase 3 — Full transaction tracker with contingency timeline coming soon</div>

      <div style={styles.grid}>
        {txDeals.map(deal => {
          const contingencies = deal.contingencies || [];
          const done = contingencies.filter(c => c.done).length;
          const today = new Date();

          return (
            <div key={deal.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.address}>{deal.address}</div>
                <div style={styles.client}>{deal.client}</div>
              </div>
              <div style={styles.priceRow}>
                <span style={styles.price}>${deal.price?.toLocaleString()}</span>
                {deal.closeDate && <span style={styles.close}>Closes {deal.closeDate}</span>}
              </div>
              {contingencies.length > 0 && (
                <div style={styles.contingencies}>
                  <div style={styles.contingencyLabel}>Contingencies {done}/{contingencies.length}</div>
                  {contingencies.map((c, i) => {
                    const days = c.deadline ? Math.ceil((new Date(c.deadline) - today) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <div key={i} style={styles.contingencyRow}>
                        <span style={{ ...styles.dot, background: c.done ? '#6bc49a' : days !== null && days <= 3 ? '#e07070' : '#d4a843' }} />
                        <span style={styles.contingencyName}>{c.name}</span>
                        {days !== null && !c.done && (
                          <span style={{ ...styles.days, color: days <= 3 ? '#e07070' : '#d4a843' }}>
                            {days === 0 ? 'TODAY' : `${days}d`}
                          </span>
                        )}
                        {c.done && <span style={styles.doneLabel}>Done</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {(deal.tasks || []).filter(t => !t.done).length > 0 && (
                <div style={styles.taskPreview}>
                  <span style={styles.taskCount}>{(deal.tasks || []).filter(t => !t.done).length} pending tasks</span>
                </div>
              )}
            </div>
          );
        })}
        {txDeals.length === 0 && (
          <div style={styles.empty}>No active transactions. Add a deal with type "transaction" from the Deals page.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '36px 40px', animation: 'fadeUp 0.4s ease forwards' },
  title: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 6 },
  sub: { fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 28 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 },
  cardTop: {},
  address: { fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 },
  client: { fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-gold)', fontWeight: 500 },
  close: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue-light)' },
  contingencies: { background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 },
  contingencyLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 },
  contingencyRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  contingencyName: { flex: 1, fontSize: 12, color: 'var(--text-primary)' },
  days: { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500 },
  doneLabel: { fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6bc49a' },
  taskPreview: { borderTop: '1px solid var(--border-subtle)', paddingTop: 10 },
  taskCount: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' },
  empty: { fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', gridColumn: '1/-1', textAlign: 'center', padding: 40 },
};
