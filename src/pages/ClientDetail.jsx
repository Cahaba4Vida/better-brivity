import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Database, GitBranch } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
      fontSize: 12, fontWeight: 500,
      background: active ? 'rgba(59,91,219,0.2)' : 'transparent',
      color: active ? '#7c9dff' : '#6b7280'
    }}>
      {children}
    </button>
  )
}

export default function ClientDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('conversation')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clients?id=${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 32, color: '#4b5563', fontSize: 13 }}>Loading...</div>
  if (!data) return <div style={{ padding: 32, color: '#f87171', fontSize: 13 }}>Client not found</div>

  const { client, fields, history, deals, runs } = data

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      {/* Back */}
      <Link to="/clients" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280', textDecoration: 'none', marginBottom: 20 }}>
        <ArrowLeft size={13} /> Back to clients
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(59,91,219,0.15)', border: '1px solid rgba(59,91,219,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 600, color: '#7c9dff'
          }}>
            {(client.name || client.phone || '?')[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{client.name || 'Unknown'}</h1>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
              {client.phone}
              {client.email && ` · ${client.email}`}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge badge-${client.stage === 'active' ? 'green' : 'gray'}`}>{client.stage}</span>
          <span className="badge badge-blue">{client.intent}</span>
        </div>
      </div>

      {/* Captured fields summary */}
      {fields.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {fields.map(f => (
            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.field_name}</span>
              <span style={{ fontSize: 13, color: '#e8eaf0', fontWeight: 500 }}>{f.field_value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        <Tab active={tab === 'conversation'} onClick={() => setTab('conversation')}>
          Conversation ({history.length})
        </Tab>
        <Tab active={tab === 'deals'} onClick={() => setTab('deals')}>
          Deals ({deals.length})
        </Tab>
        <Tab active={tab === 'workflows'} onClick={() => setTab('workflows')}>
          Workflows ({runs.length})
        </Tab>
      </div>

      {/* Conversation */}
      {tab === 'conversation' && (
        <div className="card" style={{ padding: 20 }}>
          {history.length === 0 ? (
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>No messages yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-start' : 'flex-end',
                  gap: 10
                }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
                    background: msg.role === 'user' ? '#1a1e28' : 'rgba(59,91,219,0.2)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.06)' : 'rgba(59,91,219,0.3)'}`,
                  }}>
                    <div style={{ fontSize: 13, color: '#e8eaf0', lineHeight: 1.5 }}>{msg.content}</div>
                    <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>
                      {format(new Date(msg.sent_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deals */}
      {tab === 'deals' && (
        <div className="card" style={{ padding: 20 }}>
          {deals.length === 0 ? (
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>No deals yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {deals.map(deal => (
                <div key={deal.id} style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{deal.property_address || 'Address TBD'}</div>
                    <span className={`badge badge-${deal.status === 'under_contract' ? 'amber' : 'green'}`}>{deal.status}</span>
                  </div>
                  {deal.list_price && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      List: ${Number(deal.list_price).toLocaleString()}
                      {deal.close_date && ` · Close: ${new Date(deal.close_date).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflow runs */}
      {tab === 'workflows' && (
        <div className="card" style={{ padding: 20 }}>
          {runs.length === 0 ? (
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>No workflows run yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {runs.map(run => (
                <div key={run.id} style={{ padding: 14, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{run.workflow_name}</div>
                    <span className={`badge badge-${run.status === 'completed' ? 'green' : run.status === 'failed' ? 'red' : 'amber'}`}>
                      {run.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>
                    Started {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                    · Step {run.current_step_idx}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
