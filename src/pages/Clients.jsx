import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MessageSquare, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STAGE_BADGE = {
  intake: 'badge-gray', qualifying: 'badge-blue',
  active: 'badge-green', under_contract: 'badge-amber',
  closed: 'badge-gray', inactive: 'badge-gray'
}

const INTENT_COLOR = { buy: '#3b5bdb', sell: '#34a853', both: '#8b5cf6', unknown: '#6b7280' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(d => { setClients(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = clients.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Clients</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{clients.length} total</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          style={{
            width: '100%', padding: '9px 12px 9px 34px',
            background: '#13161e', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, color: '#e8eaf0', fontSize: 13, outline: 'none'
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: '#4b5563', fontSize: 13 }}>Loading clients...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <MessageSquare size={32} color="#1a1e28" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#4b5563', fontSize: 13, margin: 0 }}>
            {search ? 'No clients match your search.' : 'No clients yet. They\'ll appear here when they text in.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(client => (
            <Link key={client.id} to={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'border-color 0.15s'
              }}>
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: `${INTENT_COLOR[client.intent] || '#1a1e28'}22`,
                  border: `1px solid ${INTENT_COLOR[client.intent] || '#6b7280'}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, color: INTENT_COLOR[client.intent] || '#6b7280'
                }}>
                  {(client.name || client.phone || '?')[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#e8eaf0' }}>
                      {client.name || 'Unknown'}
                    </span>
                    <span className={`badge ${STAGE_BADGE[client.stage] || 'badge-gray'}`}>
                      {client.stage}
                    </span>
                    {client.intent !== 'unknown' && (
                      <span className="badge badge-blue">{client.intent}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {client.phone} · {Number(client.message_count) || 0} messages
                    {client.last_contact_at && ` · Last contact ${formatDistanceToNow(new Date(client.last_contact_at), { addSuffix: true })}`}
                  </div>
                </div>
                <ChevronRight size={14} color="#4b5563" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
