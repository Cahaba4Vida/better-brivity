import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Home, AlertCircle, MessageSquare, GitBranch, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ icon: Icon, label, value, color = '#3b5bdb' }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 600, color: '#e8eaf0', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

function StageBar({ data }) {
  const stages = ['intake','qualifying','active','under_contract','closed']
  const max = Math.max(...stages.map(s => data[s] || 0), 1)
  const colors = {
    intake: '#6b7280', qualifying: '#3b5bdb', active: '#34a853',
    under_contract: '#f59e0b', closed: '#9ca3af'
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
      {stages.map(s => (
        <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: '100%', borderRadius: 4,
            height: Math.max(4, ((data[s] || 0) / max) * 50),
            background: colors[s]
          }} />
          <span style={{ fontSize: 9, color: '#4b5563', textTransform: 'capitalize' }}>
            {s.replace('_', ' ')}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 32, color: '#4b5563', fontSize: 13 }}>Loading dashboard...</div>
  )

  const d = data || {}

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: '#e8eaf0' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard icon={Users} label="Active clients" value={d.clients?.length || 0} color="#3b5bdb" />
        <StatCard icon={Home} label="Active deals" value={d.deals?.length || 0} color="#34a853" />
        <StatCard icon={AlertCircle} label="Urgent tasks" value={(d.tasks || []).filter(t => new Date(t.due_date) < new Date()).length} color="#f59e0b" />
        <StatCard icon={GitBranch} label="Running workflows" value={d.workflowRuns?.length || 0} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Recent messages */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={15} color="#3b5bdb" />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Recent client messages</span>
            </div>
            <Link to="/clients" style={{ fontSize: 11, color: '#3b5bdb', textDecoration: 'none' }}>View all</Link>
          </div>
          {(d.recentMessages || []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>No messages yet. Clients will appear here when they text in.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(d.recentMessages || []).map((m, i) => (
                <Link key={i} to={`/clients/${m.client_id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', gap: 10, padding: '10px 12px',
                    borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                    cursor: 'pointer'
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: '#1a1e28', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, color: '#3b5bdb'
                    }}>
                      {(m.name || m.phone || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#e8eaf0' }}>
                        {m.name || m.phone}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.content}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#4b5563', whiteSpace: 'nowrap' }}>
                      {formatDistanceToNow(new Date(m.sent_at), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Client pipeline */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={15} color="#34a853" />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Client pipeline</span>
          </div>
          <StageBar data={d.clientsByStage || {}} />
        </div>
      </div>

      {/* Active deals + Tasks row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Active deals */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Home size={15} color="#34a853" /> Active deals
          </div>
          {(d.deals || []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>No active deals yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d.deals || []).slice(0, 5).map(deal => (
                <div key={deal.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)'
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 500 }}>
                      {deal.property_address || 'Address TBD'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {deal.close_date ? `Close: ${new Date(deal.close_date).toLocaleDateString()}` : 'No close date set'}
                    </div>
                  </div>
                  <span className={`badge badge-${deal.status === 'under_contract' ? 'amber' : 'green'}`}>
                    {deal.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgent tasks */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} color="#f59e0b" /> Tasks due soon
          </div>
          {(d.tasks || []).length === 0 ? (
            <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>No urgent tasks. You're all caught up!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d.tasks || []).slice(0, 6).map(task => (
                <div key={task.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.03)'
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#e8eaf0' }}>{task.title}</div>
                    {task.due_date && (
                      <div style={{ fontSize: 10, color: new Date(task.due_date) < new Date() ? '#f87171' : '#6b7280', marginTop: 2 }}>
                        {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'amber' : 'gray'}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
