// pages/Listings.js
import React from 'react';
import { useApp } from '../lib/AppContext';

export default function Listings() {
  const { deals } = useApp();
  const listings = deals.filter(d => d.type === 'listing');

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Listings</h1>
      <div style={styles.sub}>Phase 4 — Full listing coordinator with launch checklists & marketing tools coming soon</div>

      <div style={styles.grid}>
        {listings.map(deal => (
          <div key={deal.id} style={styles.card}>
            <div style={styles.cardImg}>
              <span style={styles.cardImgText}>{deal.address.split(' ').slice(0, 2).join(' ')}</span>
            </div>
            <div style={styles.cardBody}>
              <div style={styles.address}>{deal.address}</div>
              <div style={styles.city}>{deal.city}</div>
              <div style={styles.meta}>
                <span style={styles.price}>${deal.price?.toLocaleString()}</span>
                {deal.daysOnMarket !== undefined && (
                  <span style={styles.dom}>{deal.daysOnMarket} DOM</span>
                )}
              </div>
              <div style={styles.statsRow}>
                {deal.showings !== undefined && <span style={styles.stat}>{deal.showings} showings</span>}
                {deal.mlsNumber && <span style={styles.mls}>{deal.mlsNumber}</span>}
              </div>
              {deal.client && <div style={styles.client}>{deal.client}</div>}
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <div style={styles.empty}>No active listings. Add a deal with type "listing" from the Deals page.</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '36px 40px', animation: 'fadeUp 0.4s ease forwards' },
  title: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 6 },
  sub: { fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 28 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' },
  cardImg: {
    height: 140, background: 'linear-gradient(135deg, var(--bg-elevated) 0%, #1e2235 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderBottom: '1px solid var(--border-subtle)',
  },
  cardImgText: { fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text-tertiary)', opacity: 0.5 },
  cardBody: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  address: { fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' },
  city: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 4 },
  meta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--accent-gold)', fontWeight: 500 },
  dom: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' },
  statsRow: { display: 'flex', justifyContent: 'space-between' },
  stat: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' },
  mls: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' },
  client: { fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 },
  empty: { fontSize: 13, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', gridColumn: '1/-1', textAlign: 'center', padding: 40 },
};
