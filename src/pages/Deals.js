// pages/Deals.js
import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';

const STATUS_OPTIONS = ['active', 'under_contract', 'searching', 'pending', 'closed'];
const TYPE_OPTIONS = ['listing', 'transaction', 'buyer'];

function AddDealModal({ onClose, onSave }) {
  const [form, setForm] = useState({ address: '', city: '', type: 'listing', status: 'active', price: '', client: '', clientEmail: '', clientPhone: '', notes: '', closeDate: '', contractDate: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={e => e.stopPropagation()}>
        <div style={modal.header}>
          <span style={modal.title}>Add New Deal</span>
          <button style={modal.close} onClick={onClose}>✕</button>
        </div>
        <div style={modal.body}>
          <div style={modal.row}>
            <label style={modal.label}>Address *</label>
            <input style={modal.input} value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street" />
          </div>
          <div style={modal.row}>
            <label style={modal.label}>City, State ZIP</label>
            <input style={modal.input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="Austin, TX 78701" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={modal.row}>
              <label style={modal.label}>Deal Type</label>
              <select style={modal.select} value={form.type} onChange={e => set('type', e.target.value)}>
                {TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={modal.row}>
              <label style={modal.label}>Status</label>
              <select style={modal.select} value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={modal.row}>
            <label style={modal.label}>Client Name *</label>
            <input style={modal.input} value={form.client} onChange={e => set('client', e.target.value)} placeholder="Full name or family name" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={modal.row}>
              <label style={modal.label}>Client Email</label>
              <input style={modal.input} value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} type="email" />
            </div>
            <div style={modal.row}>
              <label style={modal.label}>Client Phone</label>
              <input style={modal.input} value={form.clientPhone} onChange={e => set('clientPhone', e.target.value)} placeholder="(512) 555-0000" />
            </div>
          </div>
          <div style={modal.row}>
            <label style={modal.label}>Price</label>
            <input style={modal.input} value={form.price} onChange={e => set('price', e.target.value)} type="number" placeholder="750000" />
          </div>
          {(form.type === 'transaction') && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={modal.row}>
                <label style={modal.label}>Contract Date</label>
                <input style={modal.input} value={form.contractDate} onChange={e => set('contractDate', e.target.value)} type="date" />
              </div>
              <div style={modal.row}>
                <label style={modal.label}>Close Date</label>
                <input style={modal.input} value={form.closeDate} onChange={e => set('closeDate', e.target.value)} type="date" />
              </div>
            </div>
          )}
          <div style={modal.row}>
            <label style={modal.label}>Notes</label>
            <textarea style={{ ...modal.input, height: 72, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div style={modal.footer}>
          <button style={modal.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={modal.saveBtn} onClick={() => {
            if (!form.address || !form.client) return alert('Address and client name are required.');
            onSave({ ...form, price: Number(form.price) || 0 });
            onClose();
          }}>Add Deal</button>
        </div>
      </div>
    </div>
  );
}

function DealDetail({ deal, onClose, onUpdate, onAddTask, onToggleTask }) {
  const [newTask, setNewTask] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const statusColors = {
    active: '#6bc49a', under_contract: '#6b9fc4', searching: '#d4a843', closed: '#9a9590'
  };

  return (
    <div style={detail.overlay} onClick={onClose}>
      <div style={detail.panel} onClick={e => e.stopPropagation()}>
        <div style={detail.header}>
          <div>
            <div style={detail.dealType}>{deal.type.toUpperCase()}</div>
            <h2 style={detail.address}>{deal.address}</h2>
            <div style={detail.city}>{deal.city}</div>
          </div>
          <button style={detail.close} onClick={onClose}>✕</button>
        </div>

        <div style={detail.body}>
          {/* Info grid */}
          <div style={detail.infoGrid}>
            {[
              ['Client', deal.client],
              ['Price', `$${deal.price?.toLocaleString()}`],
              ['Email', deal.clientEmail || '—'],
              ['Phone', deal.clientPhone || '—'],
              ['Status', deal.status?.replace('_',' ')],
              deal.closeDate && ['Close Date', deal.closeDate],
              deal.mlsNumber && ['MLS#', deal.mlsNumber],
              deal.lender && ['Lender', deal.lender],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={detail.infoRow}>
                <span style={detail.infoKey}>{k}</span>
                <span style={detail.infoVal}>{v}</span>
              </div>
            ))}
          </div>

          {deal.notes && (
            <div style={detail.notesBox}>
              <div style={detail.sectionLabel}>Notes</div>
              <div style={detail.notesText}>{deal.notes}</div>
            </div>
          )}

          {/* Contingencies */}
          {(deal.contingencies || []).length > 0 && (
            <div style={detail.section}>
              <div style={detail.sectionLabel}>Contingencies</div>
              {deal.contingencies.map((c, i) => (
                <div key={i} style={detail.contingencyRow}>
                  <span style={{ ...detail.contingencyDot, background: c.done ? 'var(--accent-green)' : 'var(--accent-amber)' }} />
                  <span style={detail.contingencyName}>{c.name}</span>
                  <span style={detail.contingencyDate}>{c.deadline}</span>
                  <span style={{ ...detail.contingencyStatus, color: c.done ? '#6bc49a' : '#d4a843' }}>{c.done ? 'Done' : 'Pending'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          <div style={detail.section}>
            <div style={detail.sectionLabel}>Tasks ({(deal.tasks || []).filter(t => !t.done).length} pending)</div>
            {(deal.tasks || []).map(task => (
              <div key={task.id} style={{ ...detail.taskRow, opacity: task.done ? 0.45 : 1 }}>
                <button style={{ ...detail.checkbox, background: task.done ? 'var(--accent-gold-dim)' : 'transparent' }} onClick={() => onToggleTask(deal.id, task.id)}>
                  {task.done && <span style={{ fontSize: 9, color: 'var(--accent-gold)' }}>✓</span>}
                </button>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>{task.text}</span>
                {task.urgent && <span style={detail.urgentTag}>URGENT</span>}
              </div>
            ))}
            <div style={detail.addTaskRow}>
              <input
                style={detail.taskInput}
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                placeholder="Add a task..."
                onKeyDown={e => { if (e.key === 'Enter' && newTask.trim()) { onAddTask(deal.id, newTask.trim(), isUrgent); setNewTask(''); } }}
              />
              <button
                style={{ ...detail.urgentToggle, background: isUrgent ? 'rgba(160,74,74,0.2)' : 'transparent', color: isUrgent ? '#e07070' : 'var(--text-tertiary)', borderColor: isUrgent ? 'rgba(160,74,74,0.4)' : 'var(--border-medium)' }}
                onClick={() => setIsUrgent(u => !u)}
              >⚑</button>
              <button style={detail.addTaskBtn} onClick={() => { if (newTask.trim()) { onAddTask(deal.id, newTask.trim(), isUrgent); setNewTask(''); } }}>Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Deals() {
  const { deals, addDeal, updateDeal, toggleTask, addTask, activeDealId, setActiveDealId } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');

  const activeDeal = deals.find(d => d.id === activeDealId);

  const filtered = filter === 'all' ? deals : deals.filter(d => d.type === filter);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Deals</h1>
          <div style={styles.sub}>All active clients &amp; transactions</div>
        </div>
        <button style={styles.addBtn} onClick={() => setShowAdd(true)}>+ New Deal</button>
      </div>

      <div style={styles.filters}>
        {['all', 'listing', 'transaction', 'buyer'].map(f => (
          <button key={f} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      <div style={styles.dealsGrid}>
        {filtered.map(deal => {
          const pending = (deal.tasks || []).filter(t => !t.done).length;
          const urgent = (deal.tasks || []).filter(t => !t.done && t.urgent).length;
          const typeColor = deal.type === 'listing' ? 'var(--accent-gold)' : deal.type === 'transaction' ? 'var(--accent-blue-light)' : '#d4a843';
          return (
            <div key={deal.id} style={styles.dealCard} onClick={() => setActiveDealId(deal.id)}>
              <div style={styles.dealCardHeader}>
                <span style={{ ...styles.typeTag, color: typeColor, borderColor: typeColor + '44', background: typeColor + '11' }}>
                  {deal.type === 'listing' ? '⊞ LISTING' : deal.type === 'transaction' ? '⊡ TXN' : '⊕ BUYER'}
                </span>
                {urgent > 0 && <span style={styles.urgentTag}>⚑ {urgent} urgent</span>}
              </div>
              <h3 style={styles.dealAddress}>{deal.address}</h3>
              <div style={styles.dealCity}>{deal.city}</div>
              <div style={styles.dealClient}>{deal.client}</div>
              <div style={styles.dealFooter}>
                <span style={styles.dealPrice}>${deal.price?.toLocaleString()}</span>
                <span style={styles.dealTasks}>{pending} task{pending !== 1 ? 's' : ''}</span>
              </div>
              {deal.closeDate && (
                <div style={styles.closeDate}>Closes {deal.closeDate}</div>
              )}
            </div>
          );
        })}
        <div style={styles.addCard} onClick={() => setShowAdd(true)}>
          <span style={styles.addIcon}>+</span>
          <span style={styles.addLabel}>Add Deal</span>
        </div>
      </div>

      {showAdd && (
        <AddDealModal onClose={() => setShowAdd(false)} onSave={addDeal} />
      )}

      {activeDeal && (
        <DealDetail
          deal={activeDeal}
          onClose={() => setActiveDealId(null)}
          onUpdate={updateDeal}
          onAddTask={addTask}
          onToggleTask={toggleTask}
        />
      )}
    </div>
  );
}

const styles = {
  page: { padding: '36px 40px', animation: 'fadeUp 0.4s ease forwards' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 },
  title: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text-primary)' },
  sub: { fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginTop: 2 },
  addBtn: {
    background: 'var(--accent-gold)',
    color: '#08090e',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '9px 18px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    letterSpacing: '0.03em',
  },
  filters: { display: 'flex', gap: 6, marginBottom: 20 },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: 20,
    border: '1px solid var(--border-medium)',
    background: 'transparent',
    color: 'var(--text-tertiary)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
  },
  filterBtnActive: {
    background: 'var(--accent-gold-dim)',
    color: 'var(--accent-gold)',
    borderColor: 'var(--border-gold)',
  },
  dealsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  dealCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
  },
  dealCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  typeTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    border: '1px solid',
    borderRadius: 3,
    padding: '2px 6px',
    letterSpacing: '0.08em',
  },
  urgentTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: '#e07070',
    letterSpacing: '0.04em',
  },
  dealAddress: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    marginBottom: 3,
    lineHeight: 1.3,
  },
  dealCity: { fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8 },
  dealClient: { fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 },
  dealFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dealPrice: { fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent-gold)', fontWeight: 500 },
  dealTasks: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' },
  closeDate: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue-light)', marginTop: 6 },
  addCard: {
    background: 'transparent',
    border: '1px dashed var(--border-medium)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 160,
    transition: 'border-color 0.2s',
  },
  addIcon: { fontSize: 24, color: 'var(--text-tertiary)' },
  addLabel: { fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
};

const modal = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 100, animation: 'fadeIn 0.2s ease',
  },
  box: {
    background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-xl)',
    width: 520, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-elevated)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)' },
  close: { fontSize: 16, color: 'var(--text-tertiary)', cursor: 'pointer', lineHeight: 1 },
  body: { padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 },
  row: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)',
    padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', width: '100%',
  },
  select: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)',
    padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', width: '100%',
  },
  footer: {
    display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px',
    borderTop: '1px solid var(--border-subtle)',
  },
  cancelBtn: {
    padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)',
    background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--accent-gold)', color: '#08090e', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
};

const detail = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex',
    alignItems: 'stretch', justifyContent: 'flex-end', zIndex: 100, animation: 'fadeIn 0.2s ease',
  },
  panel: {
    width: 480, background: 'var(--bg-card)', borderLeft: '1px solid var(--border-medium)',
    display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-elevated)', overflowY: 'auto',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '28px 24px 20px', borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-elevated)',
  },
  dealType: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-gold)', letterSpacing: '0.1em', marginBottom: 8 },
  address: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 3 },
  city: { fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' },
  close: { fontSize: 16, color: 'var(--text-tertiary)', cursor: 'pointer', flexShrink: 0 },
  body: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  infoRow: { display: 'flex', flexDirection: 'column', gap: 2 },
  infoKey: { fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  infoVal: { fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 },
  notesBox: { background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px' },
  notesText: { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 6 },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 },
  contingencyRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border-subtle)' },
  contingencyDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  contingencyName: { flex: 1, fontSize: 12, color: 'var(--text-primary)' },
  contingencyDate: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)' },
  contingencyStatus: { fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em' },
  taskRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' },
  checkbox: {
    width: 16, height: 16, border: '1px solid var(--border-medium)', borderRadius: 3,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
  },
  urgentTag: { fontFamily: 'var(--font-mono)', fontSize: 8, color: '#e07070', background: 'rgba(160,74,74,0.1)', border: '1px solid rgba(160,74,74,0.25)', borderRadius: 2, padding: '1px 5px', letterSpacing: '0.06em' },
  addTaskRow: { display: 'flex', gap: 6, marginTop: 8 },
  taskInput: {
    flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)',
    padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none',
  },
  urgentToggle: { padding: '7px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid', fontSize: 12, cursor: 'pointer' },
  addTaskBtn: { padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-gold)', color: '#08090e', fontSize: 11, fontWeight: 600, cursor: 'pointer' },
};
