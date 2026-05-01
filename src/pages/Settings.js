// pages/Settings.js
import React, { useState } from 'react';
import { useApp } from '../lib/AppContext';

export default function Settings() {
  const { agentProfile, setAgentProfile } = useApp();
  const [form, setForm] = useState({ ...agentProfile });
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rp_apiKey') || '');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    setAgentProfile(form);
    if (apiKey) localStorage.setItem('rp_apiKey', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Settings</h1>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Agent Profile</div>
        <div style={styles.form}>
          {[
            ['name', 'Full Name', 'text', 'Jane Smith'],
            ['brokerage', 'Brokerage', 'text', 'Keller Williams Austin'],
            ['license', 'License Number', 'text', 'TX-12345678'],
            ['phone', 'Phone', 'tel', '(512) 555-0100'],
            ['email', 'Email', 'email', 'jane@brokerage.com'],
          ].map(([key, label, type, placeholder]) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input
                style={styles.input}
                type={type}
                value={form[key] || ''}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Anthropic API Key</div>
        <div style={styles.sectionDesc}>Required to use the AI Assistant. Your key is stored locally in your browser and never sent anywhere except Anthropic's API.</div>
        <div style={styles.field}>
          <label style={styles.label}>API Key</label>
          <input
            style={styles.input}
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
          />
        </div>
        <div style={styles.apiNote}>
          Get your API key at <span style={{ color: 'var(--accent-gold)' }}>console.anthropic.com</span>
        </div>
      </div>

      <button style={styles.saveBtn} onClick={save}>
        {saved ? '✓ Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}

const styles = {
  page: { padding: '36px 40px', maxWidth: 600, animation: 'fadeUp 0.4s ease forwards' },
  title: { fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 32 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16,
    paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)',
  },
  sectionDesc: { fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14, lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: {
    background: 'var(--bg-card)', border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
    fontSize: 13, color: 'var(--text-primary)', outline: 'none',
  },
  apiNote: { fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8, fontFamily: 'var(--font-mono)' },
  saveBtn: {
    padding: '10px 28px', borderRadius: 'var(--radius-sm)', border: 'none',
    background: 'var(--accent-gold)', color: '#08090e', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
    letterSpacing: '0.03em', transition: 'all 0.15s',
  },
};
