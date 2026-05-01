// pages/Contacts.js
import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';

const TYPE_COLORS = {
  seller: { color: '#d4a843', bg: 'rgba(212,168,67,0.1)', border: 'rgba(212,168,67,0.3)' },
  buyer: { color: 'var(--accent-blue-light)', bg: 'rgba(74,127,165,0.1)', border: 'rgba(74,127,165,0.3)' },
  lender: { color: '#6bc49a', bg: 'rgba(74,148,112,0.1)', border: 'rgba(74,148,112,0.3)' },
  title: { color: 'var(--text-secondary)', bg: 'var(--bg-elevated)', border: 'var(--border-medium)' },
  agent: { color: 'var(--accent-gold)', bg: 'var(--accent-gold-dim)', border: 'var(--border-gold)' },
};

export default function Contacts() {
  const { contacts } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.email || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Contacts</h1>
      </div>
      <div style={styles.toolbar}>
        <input style={styles.search} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." />
        <div style={styles.filters}>
          {['all', 'buyer', 'seller', 'lender', 'title', 'agent'].map(f => (
            <button key={f} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.list}>
        {filtered.map(c => {
          const tc = TYPE_COLORS[c.type] || TYPE_COLORS.agent;
          return (
            <div key={c.id} style={styles.contactRow}>
              <div style={styles.avatar}>{c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div style={styles.info}>
                <div style={styles.name}>{c.name}</div>
                <div style={styles.contact}>{c.email} {c.phone && `· ${c.phone}`}</div>
              </div>
              <span style={{ ...styles.typeTag, color: tc.color, background: tc.bg, border: `1px solid ${tc.border}` }}>
                {c.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '36px 40px', animation: 'fadeUp 0.4s ease forwards' },
  header: { marginBottom: 24 },
  title: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text-primary)' },
  toolbar: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
  search: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 14px',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    width: 260,
  },
  filters: { display: 'flex', gap: 6 },
  filterBtn: {
    padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border-medium)',
    background: 'transparent', color: 'var(--text-tertiary)', fontSize: 11, cursor: 'pointer',
    fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
  },
  filterActive: { background: 'var(--accent-gold-dim)', color: 'var(--accent-gold)', borderColor: 'var(--border-gold)' },
  list: { display: 'flex', flexDirection: 'column', gap: 2 },
  contactRow: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)',
    border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', letterSpacing: '0.04em',
  },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 },
  contact: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  typeTag: {
    fontFamily: 'var(--font-mono)', fontSize: 9, border: '1px solid', borderRadius: 3,
    padding: '2px 7px', letterSpacing: '0.08em', textTransform: 'uppercase',
  },
};
