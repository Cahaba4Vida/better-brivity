import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, getStoredKeys, saveKeys } from './api.js';
import './styles.css';

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StatusPill({ children, tone = 'neutral' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function ErrorBanner({ error, onClear }) {
  if (!error) return null;
  return (
    <div className="banner error">
      <span>{error}</span>
      <button onClick={onClear}>Clear</button>
    </div>
  );
}

function SuccessBanner({ message, onClear }) {
  if (!message) return null;
  return (
    <div className="banner success">
      <span>{message}</span>
      <button onClick={onClear}>Clear</button>
    </div>
  );
}

function SettingsPanel({ onRefresh, setError, setSuccess }) {
  const [keys, setKeys] = useState(getStoredKeys());
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    saveKeys(keys);
    setSuccess('Saved dashboard keys in this browser.');
    await checkHealth();
  }

  async function checkHealth() {
    setLoading(true);
    try {
      const data = await api('/health');
      setHealth(data);
      setSuccess('Health check complete.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function setupDb() {
    setLoading(true);
    try {
      saveKeys(keys);
      const data = await api('/setup-db', { method: 'POST', body: {} });
      setSuccess(`Database setup complete. Ran ${data.statementCount} SQL statements.`);
      await onRefresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <section className="card settings-card">
      <div className="card-header">
        <div>
          <h2>Setup</h2>
          <p>Paste the same secrets you set in Netlify environment variables.</p>
        </div>
        <button onClick={checkHealth} disabled={loading}>Check Health</button>
      </div>
      <div className="grid two">
        <label>
          Admin API Key
          <input type="password" value={keys.adminKey} onChange={(e) => setKeys({ ...keys, adminKey: e.target.value })} placeholder="ADMIN_API_KEY" />
        </label>
        <label>
          Setup Secret
          <input type="password" value={keys.setupSecret} onChange={(e) => setKeys({ ...keys, setupSecret: e.target.value })} placeholder="SETUP_SECRET" />
        </label>
      </div>
      <div className="actions">
        <button onClick={save}>Save Keys</button>
        <button className="secondary" onClick={setupDb} disabled={loading}>Run DB Setup</button>
      </div>
      {health && (
        <div className="health-grid">
          <StatusPill tone={health.ok ? 'good' : 'warn'}>DB: {health.database}</StatusPill>
          <StatusPill>Ollama: {health.env.ollamaApiUrl}</StatusPill>
          <StatusPill>Sendblue: {health.env.sendblue}</StatusPill>
          <StatusPill>Resend: {health.env.resend}</StatusPill>
          <StatusPill>DocuSign: {health.env.docusign}</StatusPill>
          <StatusPill tone={health.env.mockProviders === 'true' ? 'warn' : 'good'}>Mock providers: {health.env.mockProviders}</StatusPill>
        </div>
      )}
    </section>
  );
}

function AddLeadForm({ onCreated, setError, setSuccess }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'manual',
    buyer_or_seller: 'buyer',
    location: '',
    notes: '',
    sms_consent_status: 'unknown',
    email_consent_status: 'unknown',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/leads', { method: 'POST', body: form });
      setForm({ ...form, name: '', phone: '', email: '', location: '', notes: '' });
      setSuccess('Lead created.');
      await onCreated();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>Add Lead</h2>
          <p>Manual lead capture for the MVP.</p>
        </div>
      </div>
      <form onSubmit={submit} className="lead-form">
        <div className="grid three">
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sarah Johnson" /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+15555550101" /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sarah@example.com" /></label>
        </div>
        <div className="grid four">
          <label>Lead Type<select value={form.buyer_or_seller} onChange={(e) => setForm({ ...form, buyer_or_seller: e.target.value })}><option value="buyer">Buyer</option><option value="seller">Seller</option><option value="both">Both</option><option value="unknown">Unknown</option></select></label>
          <label>Location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Boise, ID" /></label>
          <label>SMS Consent<select value={form.sms_consent_status} onChange={(e) => setForm({ ...form, sms_consent_status: e.target.value })}><option value="unknown">Unknown</option><option value="opted_in">Opted in</option><option value="opted_out">Opted out</option></select></label>
          <label>Email Consent<select value={form.email_consent_status} onChange={(e) => setForm({ ...form, email_consent_status: e.target.value })}><option value="unknown">Unknown</option><option value="opted_in">Opted in</option><option value="opted_out">Opted out</option></select></label>
        </div>
        <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Looking under $500k, wants a weekend showing..." /></label>
        <button disabled={loading}>{loading ? 'Creating...' : 'Create Lead'}</button>
      </form>
    </section>
  );
}

function LeadsTable({ leads }) {
  return (
    <section className="card wide">
      <div className="card-header">
        <div>
          <h2>Leads</h2>
          <p>Simple pipeline. The AI decides next best action from these fields and recent messages.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Stage</th><th>Consent</th><th>Next Follow-Up</th><th>Contact</th><th>Notes</th></tr></thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td><strong>{lead.name || 'Unnamed'}</strong><br /><small>{lead.source}</small></td>
                <td>{lead.buyer_or_seller}</td>
                <td><StatusPill>{lead.stage}</StatusPill></td>
                <td><small>SMS: {lead.sms_consent_status}<br />Email: {lead.email_consent_status}</small></td>
                <td>{lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : '—'}</td>
                <td><small>{lead.phone || '—'}<br />{lead.email || '—'}</small></td>
                <td className="notes-cell">{lead.notes || lead.location || '—'}</td>
              </tr>
            ))}
            {!leads.length && <tr><td colSpan="7" className="empty">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AutopilotPanel({ setError, setSuccess, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [notifyAgent, setNotifyAgent] = useState(true);
  const [result, setResult] = useState(null);

  async function run() {
    setLoading(true);
    try {
      const data = await api('/run-autopilot', { method: 'POST', body: { limit: 10, autoSend, notifyAgent } });
      setResult(data);
      setSuccess(`Autopilot complete: ${data.due} leads reviewed.`);
      await onRefresh();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card accent">
      <div className="card-header">
        <div>
          <h2>One-Button Autopilot</h2>
          <p>Reviews due leads, creates messages/tasks, and optionally sends safe messages.</p>
        </div>
      </div>
      <div className="toggle-row">
        <label><input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} /> Auto-send low-risk messages</label>
        <label><input type="checkbox" checked={notifyAgent} onChange={(e) => setNotifyAgent(e.target.checked)} /> Text agent summary</label>
      </div>
      <button className="big-button" onClick={run} disabled={loading}>{loading ? 'Running...' : 'Run Today’s Follow-Up'}</button>
      {result && <pre className="result-box">{JSON.stringify(result, null, 2)}</pre>}
    </section>
  );
}

function ReviewQueue({ messages, tasks, onRefresh, setError, setSuccess }) {
  const reviewMessages = messages.filter((m) => ['needs_review', 'draft', 'queued', 'failed'].includes(m.status)).slice(0, 20);
  const openTasks = tasks.filter((t) => t.status === 'open').slice(0, 20);

  async function send(message) {
    try {
      await api('/messages', { method: 'POST', body: { action: 'send', id: message.id } });
      setSuccess('Message sent.');
      await onRefresh();
    } catch (error) {
      setError(error.message);
    }
  }

  async function completeTask(task) {
    try {
      await api('/tasks', { method: 'PATCH', body: { id: task.id, status: 'done' } });
      setSuccess('Task marked done.');
      await onRefresh();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="grid two review-grid">
      <div className="card">
        <div className="card-header"><div><h2>Message Review</h2><p>AI-generated messages wait here before sending.</p></div></div>
        <div className="stack">
          {reviewMessages.map((m) => (
            <div className="review-item" key={m.id}>
              <div className="item-top"><strong>{m.lead_name || 'Lead'}</strong><StatusPill tone={m.status === 'failed' ? 'bad' : 'warn'}>{m.status}</StatusPill></div>
              <p>{m.body}</p>
              <small>{m.channel} · {m.failure_reason || 'Ready for review'}</small>
              <div className="actions"><button onClick={() => send(m)}>Approve + Send</button></div>
            </div>
          ))}
          {!reviewMessages.length && <div className="empty">No messages need review.</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-header"><div><h2>Tasks</h2><p>Only exceptions and human-review items.</p></div></div>
        <div className="stack">
          {openTasks.map((t) => (
            <div className="review-item" key={t.id}>
              <div className="item-top"><strong>{t.title}</strong><StatusPill tone={t.priority === 'high' ? 'bad' : 'neutral'}>{t.priority}</StatusPill></div>
              <p>{t.description || '—'}</p>
              <small>{t.lead_name || 'No lead'} · {t.type}</small>
              <div className="actions"><button className="secondary" onClick={() => completeTask(t)}>Mark Done</button></div>
            </div>
          ))}
          {!openTasks.length && <div className="empty">No open tasks.</div>}
        </div>
      </div>
    </section>
  );
}

function SigningCenter({ leads, signings, onRefresh, setError, setSuccess }) {
  const [leadId, setLeadId] = useState('');
  const [docType, setDocType] = useState('buyer_agreement');
  const [sendNow, setSendNow] = useState(false);
  const eligibleLeads = useMemo(() => leads.filter((l) => l.email), [leads]);

  useEffect(() => {
    if (!leadId && eligibleLeads[0]) setLeadId(eligibleLeads[0].id);
  }, [eligibleLeads, leadId]);

  async function createSigning() {
    try {
      await api('/create-signing-request', { method: 'POST', body: { lead_id: leadId, document_type: docType, send_now: sendNow, require_review: !sendNow } });
      setSuccess('Signing request created.');
      await onRefresh();
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section className="card wide">
      <div className="card-header">
        <div><h2>Document Signing</h2><p>Creates a DocuSign-ready packet record and review task. Real sending works when DocuSign env vars are set.</p></div>
      </div>
      <div className="grid three align-end">
        <label>Lead<select value={leadId} onChange={(e) => setLeadId(e.target.value)}>{eligibleLeads.map((l) => <option key={l.id} value={l.id}>{l.name || l.email}</option>)}</select></label>
        <label>Document Type<select value={docType} onChange={(e) => setDocType(e.target.value)}><option value="buyer_agreement">Buyer Agreement</option><option value="listing_agreement">Listing Agreement</option><option value="showing_agreement">Showing Agreement</option><option value="disclosure">Disclosure</option></select></label>
        <label className="checkbox-line"><input type="checkbox" checked={sendNow} onChange={(e) => setSendNow(e.target.checked)} /> Send now without review</label>
      </div>
      <div className="actions"><button onClick={createSigning} disabled={!leadId}>Prepare Signing Packet</button></div>
      <div className="table-wrap compact">
        <table>
          <thead><tr><th>Lead</th><th>Type</th><th>Status</th><th>Missing</th><th>Created</th></tr></thead>
          <tbody>
            {signings.map((s) => (
              <tr key={s.id}><td>{s.lead_name || '—'}</td><td>{s.document_type}</td><td><StatusPill>{s.status}</StatusPill></td><td>{Array.isArray(s.missing_fields) ? s.missing_fields.join(', ') : '—'}</td><td>{new Date(s.created_at).toLocaleString()}</td></tr>
            ))}
            {!signings.length && <tr><td colSpan="5" className="empty">No signing requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [leads, setLeads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [signings, setSignings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [dash, leadData, messageData, taskData, signingData] = await Promise.all([
        api('/dashboard'),
        api('/leads'),
        api('/messages'),
        api('/tasks'),
        api('/signing-requests'),
      ]);
      setDashboard(dash);
      setLeads(leadData.leads || []);
      setMessages(messageData.messages || []);
      setTasks(taskData.tasks || []);
      setSignings(signingData.signingRequests || []);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const counts = dashboard?.counts || {};

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Real Estate AI Autopilot</p>
          <h1>One button follow-up, review queue, and document signing.</h1>
          <p className="hero-subtitle">Netlify frontend/functions + Neon Postgres + Ollama worker + Sendblue + Resend + DocuSign hooks.</p>
        </div>
        <button onClick={refresh} disabled={loading}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </header>

      <ErrorBanner error={error} onClear={() => setError('')} />
      <SuccessBanner message={success} onClear={() => setSuccess('')} />

      <section className="stats-grid">
        <StatCard label="Total Leads" value={counts.total_leads} />
        <StatCard label="Due Leads" value={counts.due_leads} />
        <StatCard label="Messages to Review" value={counts.review_messages} />
        <StatCard label="Open Tasks" value={counts.open_tasks} />
        <StatCard label="Active Signings" value={counts.active_signings} />
      </section>

      <SettingsPanel onRefresh={refresh} setError={setError} setSuccess={setSuccess} />
      <AutopilotPanel setError={setError} setSuccess={setSuccess} onRefresh={refresh} />
      <ReviewQueue messages={messages} tasks={tasks} onRefresh={refresh} setError={setError} setSuccess={setSuccess} />
      <AddLeadForm onCreated={refresh} setError={setError} setSuccess={setSuccess} />
      <SigningCenter leads={leads} signings={signings} onRefresh={refresh} setError={setError} setSuccess={setSuccess} />
      <LeadsTable leads={leads} />

      <section className="card wide">
        <div className="card-header"><div><h2>Recent Activity</h2><p>Last audit events from the backend.</p></div></div>
        <div className="activity-list">
          {(dashboard?.recentAudit || []).map((a, index) => (
            <div key={`${a.created_at}-${index}`} className="activity-row"><span>{a.action}</span><strong>{a.summary || '—'}</strong><small>{new Date(a.created_at).toLocaleString()}</small></div>
          ))}
          {!dashboard?.recentAudit?.length && <div className="empty">No audit events yet.</div>}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
