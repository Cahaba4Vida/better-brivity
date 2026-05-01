import { useState, useEffect } from 'react'
import { Plus, Save, Trash2, Eye, EyeOff, Mail, MessageSquare, FileText, Share2 } from 'lucide-react'

const TYPE_META = {
  email:    { icon: Mail,         color: '#3b5bdb', label: 'Email' },
  sms:      { icon: MessageSquare,color: '#34a853', label: 'iMessage / SMS' },
  document: { icon: FileText,     color: '#f59e0b', label: 'Document' },
  social:   { icon: Share2,       color: '#8b5cf6', label: 'Social post' },
}

function extractVariables(text) {
  const matches = text?.match(/\{\{(\w+)\}\}/g) || []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
}

function fillPreview(text, values) {
  return text?.replace(/\{\{(\w+)\}\}/g, (_, k) =>
    values[k] ? `<mark style="background:rgba(59,91,219,0.2);color:#7c9dff;padding:0 2px;border-radius:3px">${values[k]}</mark>`
              : `<span style="background:rgba(239,68,68,0.15);color:#f87171;padding:0 2px;border-radius:3px">{{${k}}}</span>`
  ) || ''
}

const inputStyle = {
  width: '100%', padding: '8px 10px',
  background: '#0d0f14', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 7, color: '#e8eaf0', fontSize: 13, outline: 'none',
  fontFamily: 'DM Sans, system-ui'
}
const labelStyle = { fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5, fontWeight: 500 }

const STARTER = {
  name: 'New template', type: 'sms', subject: '', body: '',
  is_active: true
}

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(false)
  const [previewVars, setPreviewVars] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        setTemplates(list)
        if (list.length > 0) setSelected(list[0].id)
        setLoading(false)
      })
      .catch(() => {
        // fallback demo
        const demo = [
          { id:'t1', name:'New buyer welcome text', type:'sms', subject:'', body:'Hi {{client_name}}! This is Zack\'s assistant. Thanks for reaching out about buying a home. Reply STOP to opt out.', is_active:true },
          { id:'t2', name:'Offer submitted text', type:'sms', subject:'', body:'Great news {{client_name}} — Zack just submitted your offer on {{property_address}} for {{offer_price}}. We\'ll hear back by {{response_deadline}}!', is_active:true },
          { id:'t3', name:'Listing live email', type:'email', subject:'Your home at {{property_address}} is LIVE!', body:'Hi {{client_name}},\n\nYour listing at {{property_address}} is now live on the MLS!\n\nList Price: {{list_price}}\nMLS #: {{mls_number}}\n\n{{listing_description}}\n\n— Zack\'s Team', is_active:true },
        ]
        setTemplates(demo)
        setSelected('t1')
        setLoading(false)
      })
  }, [])

  const tmpl = selected ? templates.find(t => t.id === selected) : null

  function updateTmpl(fields) {
    setTemplates(prev => prev.map(t => t.id === selected ? { ...t, ...fields } : t))
    setSaved(false)
  }

  async function saveTemplate() {
    if (!tmpl) return
    setSaving(true)
    try {
      await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tmpl)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  function createTemplate() {
    const id = `t-${Date.now()}`
    setTemplates(prev => [...prev, { ...STARTER, id }])
    setSelected(id)
    setSaved(false)
  }

  function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id))
    if (selected === id) setSelected(templates[0]?.id || null)
    fetch(`/api/templates?id=${id}`, { method: 'DELETE' }).catch(console.error)
  }

  const variables = tmpl ? extractVariables((tmpl.subject || '') + ' ' + (tmpl.body || '')) : []

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Templates</span>
          <button onClick={createTemplate} className="btn-primary" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={12} /> New
          </button>
        </div>

        {/* Type filters */}
        <div style={{ padding: '0 8px 12px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {Object.entries(TYPE_META).map(([k, v]) => {
            const count = templates.filter(t => t.type === k).length
            if (!count) return null
            const Icon = v.icon
            return (
              <span key={k} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 99,
                background: `${v.color}15`, color: v.color, display: 'flex', alignItems: 'center', gap: 4
              }}>
                <Icon size={9} /> {count}
              </span>
            )
          })}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 16px' }}>
          {loading ? (
            <p style={{ fontSize: 12, color: '#4b5563', padding: '0 8px' }}>Loading…</p>
          ) : templates.map(t => {
            const meta = TYPE_META[t.type]
            const Icon = meta?.icon || Mail
            return (
              <div key={t.id}
                onClick={() => { setSelected(t.id); setPreview(false) }}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: selected === t.id ? 'rgba(59,91,219,0.15)' : 'transparent',
                  border: `1px solid ${selected === t.id ? 'rgba(59,91,219,0.3)' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                <Icon size={12} color={meta?.color || '#6b7280'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: selected === t.id ? '#7c9dff' : '#e8eaf0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 1 }}>{meta?.label}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!tmpl ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <FileText size={32} color="#1a1e28" />
            <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>Select a template or create a new one</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                value={tmpl.name}
                onChange={e => updateTmpl({ name: e.target.value })}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 17, fontWeight: 600, color: '#e8eaf0', fontFamily: 'DM Sans, system-ui' }}
              />
              <select value={tmpl.type} onChange={e => updateTmpl({ type: e.target.value })}
                style={{ ...inputStyle, width: 'auto', fontSize: 12, padding: '6px 10px' }}>
                {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={() => setPreview(!preview)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                background: preview ? 'rgba(59,91,219,0.15)' : 'transparent',
                color: preview ? '#7c9dff' : '#6b7280', fontSize: 12, cursor: 'pointer'
              }}>
                {preview ? <EyeOff size={12} /> : <Eye size={12} />} {preview ? 'Edit' : 'Preview'}
              </button>
              <button onClick={() => deleteTemplate(tmpl.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '7px' }}>
                <Trash2 size={14} />
              </button>
              <button onClick={saveTemplate}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 7, background: saved ? '#34a853' : '#3b5bdb',
                  border: 'none', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s'
                }}>
                <Save size={12} /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Main editor */}
              <div style={{ flex: 1, padding: '20px 24px', overflow: 'auto' }}>

                {/* Email subject */}
                {tmpl.type === 'email' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={labelStyle}>Subject line</label>
                    <input value={tmpl.subject || ''} onChange={e => updateTmpl({ subject: e.target.value })}
                      placeholder="Your home at {{property_address}} is LIVE!"
                      style={inputStyle} />
                  </div>
                )}

                {/* Body */}
                <div>
                  <label style={labelStyle}>
                    {tmpl.type === 'sms' ? 'Message body' : tmpl.type === 'document' ? 'Document content' : 'Email body'}
                  </label>

                  {preview ? (
                    <div style={{
                      padding: 16, borderRadius: 8, minHeight: 200,
                      background: '#0d0f14', border: '1px solid rgba(255,255,255,0.09)',
                      fontSize: 13, lineHeight: 1.7, color: '#e8eaf0',
                      whiteSpace: 'pre-wrap'
                    }}
                      dangerouslySetInnerHTML={{ __html: fillPreview(tmpl.body, previewVars) }}
                    />
                  ) : (
                    <textarea
                      value={tmpl.body || ''}
                      onChange={e => updateTmpl({ body: e.target.value })}
                      rows={tmpl.type === 'sms' ? 5 : 14}
                      placeholder={tmpl.type === 'sms'
                        ? 'Hi {{client_name}}, just wanted to follow up on {{property_address}}…'
                        : 'Dear {{client_name}},\n\nYour listing at {{property_address}} is now live…'}
                      style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                    />
                  )}
                </div>

                {/* Hint */}
                <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8 }}>
                  Use {'{{variable_name}}'} for dynamic values. The AI fills these from the client record automatically.
                </div>
              </div>

              {/* Variable sidebar */}
              {variables.length > 0 && (
                <div style={{
                  width: 220, flexShrink: 0, padding: '20px 16px',
                  borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'auto'
                }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 12 }}>
                    Variables ({variables.length})
                  </div>
                  {variables.map(v => (
                    <div key={v} style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 10, color: '#4b5563', display: 'block', marginBottom: 3, fontFamily: 'DM Mono, monospace' }}>
                        {`{{${v}}}`}
                      </label>
                      <input
                        value={previewVars[v] || ''}
                        onChange={e => setPreviewVars(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`preview ${v}`}
                        style={{ ...inputStyle, fontSize: 12, padding: '6px 8px' }}
                      />
                    </div>
                  ))}
                  {!preview && (
                    <button onClick={() => setPreview(true)} style={{
                      marginTop: 8, width: '100%', padding: '7px', borderRadius: 6,
                      background: 'rgba(59,91,219,0.15)', border: '1px solid rgba(59,91,219,0.3)',
                      color: '#7c9dff', fontSize: 11, cursor: 'pointer'
                    }}>
                      Preview with these values
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
