import { useState, useEffect } from 'react'
import { Globe, Brain, Mail, MessageSquare, FileText, GitBranch, Clock, Plus, Play, Trash2, Circle, Square } from 'lucide-react'

const TYPE_META = {
  browser:     { icon: Globe,         color: '#06b6d4', label: 'Browser' },
  ai_generate: { icon: Brain,         color: '#8b5cf6', label: 'AI generate' },
  email:       { icon: Mail,          color: '#3b5bdb', label: 'Email' },
  sms:         { icon: MessageSquare, color: '#34a853', label: 'iMessage / SMS' },
  document:    { icon: FileText,      color: '#f59e0b', label: 'Document' },
  condition:   { icon: GitBranch,     color: '#ec4899', label: 'Condition' },
  delay:       { icon: Clock,         color: '#6b7280', label: 'Delay' },
}

// ── Browser Recorder Modal ───────────────────────────────────
function RecorderModal({ onSave, onClose }) {
  const [url, setUrl]       = useState('')
  const [name, setName]     = useState('')
  const [recording, setRecording] = useState(false)
  const [steps, setSteps]   = useState([])
  const [status, setStatus] = useState('idle') // idle | recording | done

  function startRecording() {
    if (!url) return
    setRecording(true)
    setStatus('recording')
    setSteps([])
    // In production: this opens a Chrome extension recording session
    // For now we simulate step capture
    simulateCapture()
  }

  function simulateCapture() {
    const mockSteps = [
      { action: 'navigate', url, timestamp: Date.now() },
    ]
    const interval = setInterval(() => {
      mockSteps.push({
        action: ['click','fill','wait','navigate'][Math.floor(Math.random()*4)],
        selector: `#field-${mockSteps.length}`,
        value: `value-${mockSteps.length}`,
        timestamp: Date.now()
      })
      setSteps([...mockSteps])
    }, 800)
    setTimeout(() => {
      clearInterval(interval)
      setRecording(false)
      setStatus('done')
    }, 5000)
  }

  function stopRecording() {
    setRecording(false)
    setStatus('done')
  }

  function save() {
    if (!name) return
    onSave({ name, url, steps, type: 'browser', slug: `browser-${name.toLowerCase().replace(/\s+/g,'-')}` })
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px',
    background: '#0d0f14', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 7, color: '#e8eaf0', fontSize: 13, outline: 'none',
    fontFamily: 'DM Sans, system-ui'
  }

  return (
    <div style={{
      minHeight: 500, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12
    }}>
      <div style={{
        background: '#13161e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 14, padding: 28, width: 520
      }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Record browser skill</div>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>
          Enter a URL, hit Record, then perform your actions in the browser. Every click and input is captured as a replayable Playwright script.
        </p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Starting URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://navica.com/login"
            style={inputStyle} disabled={recording || status === 'done'} />
        </div>

        {/* Recording controls */}
        {status === 'idle' && (
          <button onClick={startRecording} disabled={!url}
            style={{
              width: '100%', padding: '10px', borderRadius: 8,
              background: '#ef4444', border: 'none', color: 'white',
              fontSize: 13, fontWeight: 500, cursor: url ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: url ? 1 : 0.5
            }}>
            <Circle size={13} /> Start recording
          </button>
        )}

        {status === 'recording' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)'
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
                animation: 'pulse-dot 1s ease-in-out infinite'
              }} />
              <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 500 }}>Recording… perform your actions in the browser</span>
            </div>
            <button onClick={stopRecording}
              style={{
                width: '100%', padding: '9px', borderRadius: 8,
                background: '#1a1e28', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e8eaf0', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}>
              <Square size={12} /> Stop recording
            </button>
          </div>
        )}

        {/* Captured steps */}
        {steps.length > 0 && (
          <div style={{ margin: '14px 0', maxHeight: 160, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 6 }}>{steps.length} steps captured</div>
            {steps.map((s, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'center',
                padding: '4px 8px', borderRadius: 5, marginBottom: 3,
                background: 'rgba(255,255,255,0.03)', fontSize: 11, color: '#9ca3af',
                fontFamily: 'DM Mono, monospace'
              }}>
                <span style={{ color: '#06b6d4', minWidth: 60 }}>{s.action}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.selector || s.url || ''}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Save */}
        {status === 'done' && (
          <div style={{ marginTop: 14 }}>
            <label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5 }}>Name this skill</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Log into Navica MLS"
              style={{ ...inputStyle, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '9px', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={save} disabled={!name}
                style={{ flex: 2, padding: '9px', borderRadius: 7, background: name ? '#3b5bdb' : '#1a1e28', border: 'none', color: 'white', cursor: name ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 500 }}>
                Save skill
              </button>
            </div>
          </div>
        )}

        {status !== 'done' && (
          <button onClick={onClose}
            style={{ marginTop: 12, width: '100%', padding: '8px', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', cursor: 'pointer', fontSize: 12 }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ── Skill card ───────────────────────────────────────────────
function SkillCard({ skill, onDelete }) {
  const meta = TYPE_META[skill.type] || TYPE_META.ai_generate
  const Icon = meta.icon

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `${meta.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={16} color={meta.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#e8eaf0' }}>{skill.name}</span>
            {skill.is_builtin && (
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(255,255,255,0.07)', color: '#6b7280' }}>
                built-in
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{skill.description || skill.slug}</div>
          {skill.type === 'browser' && skill.steps?.length > 0 && (
            <div style={{ fontSize: 11, color: '#06b6d4', marginTop: 4 }}>{skill.steps.length} recorded steps</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <span className={`badge`} style={{
            background: `${meta.color}18`, color: meta.color,
            fontSize: 10, padding: '2px 8px', borderRadius: 99
          }}>
            {meta.label}
          </span>
          {!skill.is_builtin && (
            <button onClick={() => onDelete(skill.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '2px 4px' }}>
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Skills page ──────────────────────────────────────────────
export default function Skills() {
  const [skills, setSkills] = useState([])
  const [showRecorder, setShowRecorder] = useState(false)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/skills')
      .then(r => r.json())
      .then(d => { setSkills(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => {
        // Fallback demo data
        setSkills([
          { id:'1', name:'Send email via Resend', slug:'send-email-resend', type:'email', description:'Resend transactional email', is_builtin:true },
          { id:'2', name:'Send iMessage via Bluesend', slug:'send-imessage-bluesend', type:'sms', description:'iMessage delivery', is_builtin:true },
          { id:'3', name:'Send DocuSign envelope', slug:'send-docusign-envelope', type:'document', description:'E-sign + timestamp', is_builtin:true },
          { id:'4', name:'AI draft message', slug:'ai-draft-message', type:'ai_generate', description:'Ollama drafts personalized content', is_builtin:true },
          { id:'5', name:'AI listing description', slug:'ai-listing-description', type:'ai_generate', description:'From notes + photos', is_builtin:true },
          { id:'6', name:'Condition: check field', slug:'condition-field-exists', type:'condition', description:'Branch on captured data', is_builtin:true },
          { id:'7', name:'Wait / delay', slug:'delay-minutes', type:'delay', description:'Pause workflow', is_builtin:true },
        ])
        setLoading(false)
      })
  }, [])

  function saveRecordedSkill(data) {
    const skill = {
      id: `skill-${Date.now()}`,
      ...data,
      is_builtin: false,
      description: `Recorded: ${data.steps?.length || 0} steps from ${data.url}`
    }
    setSkills(prev => [skill, ...prev])
    setShowRecorder(false)
    // POST to API
    fetch('/api/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill)
    }).catch(console.error)
  }

  function deleteSkill(id) {
    setSkills(prev => prev.filter(s => s.id !== id))
    fetch(`/api/skills?id=${id}`, { method: 'DELETE' }).catch(console.error)
  }

  const types = ['all', ...Object.keys(TYPE_META)]
  const filtered = filter === 'all' ? skills : skills.filter(s => s.type === filter)
  const browserSkills = skills.filter(s => s.type === 'browser' && !s.is_builtin)

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Skills</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>
            Built-in and recorded skills — the atomic blocks of every workflow step
          </p>
        </div>
        <button onClick={() => setShowRecorder(true)} className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Globe size={13} /> Record browser skill
        </button>
      </div>

      {/* Recorder */}
      {showRecorder && (
        <div style={{ marginBottom: 24 }}>
          <RecorderModal onSave={saveRecordedSkill} onClose={() => setShowRecorder(false)} />
        </div>
      )}

      {/* Your recorded browser skills */}
      {browserSkills.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={12} color="#06b6d4" /> Your recorded skills
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {browserSkills.map(s => <SkillCard key={s.id} skill={s} onDelete={deleteSkill} />)}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            background: filter === t ? 'rgba(59,91,219,0.2)' : 'rgba(255,255,255,0.04)',
            color: filter === t ? '#7c9dff' : '#6b7280'
          }}>
            {t === 'all' ? `All (${skills.length})` : TYPE_META[t]?.label}
          </button>
        ))}
      </div>

      {/* Skills list */}
      {loading ? (
        <p style={{ fontSize: 13, color: '#4b5563' }}>Loading skills…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(s => <SkillCard key={s.id} skill={s} onDelete={deleteSkill} />)}
        </div>
      )}
    </div>
  )
}
