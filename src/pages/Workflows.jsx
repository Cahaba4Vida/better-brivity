import { useState, useCallback, useRef } from 'react'
import { Plus, Play, Save, Trash2, ChevronDown, ChevronUp, Zap, Mail, MessageSquare, Globe, FileText, Brain, Clock, GitBranch, X } from 'lucide-react'

// ── Skill type definitions ───────────────────────────────────
const SKILL_TYPES = [
  { type: 'ai_generate',  label: 'AI generate',     icon: Brain,        color: '#8b5cf6', desc: 'Ollama drafts content from a prompt' },
  { type: 'sms',          label: 'Send iMessage',   icon: MessageSquare,color: '#34a853', desc: 'Bluesend iMessage or Twilio SMS' },
  { type: 'email',        label: 'Send email',      icon: Mail,         color: '#3b5bdb', desc: 'Resend transactional email' },
  { type: 'document',     label: 'Send document',   icon: FileText,     color: '#f59e0b', desc: 'DocuSign e-signature envelope' },
  { type: 'browser',      label: 'Browser skill',   icon: Globe,        color: '#06b6d4', desc: 'Replay a recorded browser session' },
  { type: 'condition',    label: 'Condition',        icon: GitBranch,    color: '#ec4899', desc: 'Branch based on client data' },
  { type: 'delay',        label: 'Wait / delay',    icon: Clock,        color: '#6b7280', desc: 'Pause before next step' },
]

const SKILL_ICON = Object.fromEntries(SKILL_TYPES.map(s => [s.type, s]))

// ── Built-in skill slugs per type ────────────────────────────
const SKILL_SLUGS = {
  ai_generate: ['ai-draft-message','ai-listing-description','ai-social-posts','ai-extract-client-info'],
  sms:         ['send-imessage-bluesend','send-sms-twilio'],
  email:       ['send-email-resend'],
  document:    ['send-docusign-envelope'],
  browser:     ['browser-navica-upload','browser-custom'],
  condition:   ['condition-field-exists'],
  delay:       ['delay-minutes','delay-until-date'],
}

function genId() { return `step-${Date.now()}-${Math.random().toString(36).slice(2,6)}` }

// ── Single step card ─────────────────────────────────────────
function StepCard({ step, index, total, onChange, onDelete, onMoveUp, onMoveDown }) {
  const [expanded, setExpanded] = useState(true)
  const info = SKILL_ICON[step.type] || SKILL_TYPES[0]
  const Icon = info.icon

  return (
    <div style={{
      background: '#13161e',
      border: `1px solid ${expanded ? info.color + '44' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', cursor: 'pointer',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none'
      }} onClick={() => setExpanded(!expanded)}>
        {/* Drag handle + number */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          background: `${info.color}22`, border: `1px solid ${info.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: info.color
        }}>
          {index + 1}
        </div>

        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: `${info.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={14} color={info.color} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#e8eaf0' }}>
            {step.name || `Step ${index + 1}`}
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{info.label}</div>
        </div>

        {/* Parallel badge */}
        {step.parallel && (
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 99,
            background: 'rgba(59,91,219,0.2)', color: '#7c9dff', fontWeight: 500
          }}>parallel</span>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onMoveUp()} disabled={index === 0}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '2px 4px', opacity: index === 0 ? 0.3 : 1 }}>
            <ChevronUp size={13} />
          </button>
          <button onClick={() => onMoveDown()} disabled={index === total - 1}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '2px 4px', opacity: index === total - 1 ? 0.3 : 1 }}>
            <ChevronDown size={13} />
          </button>
          <button onClick={() => onDelete()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', padding: '2px 4px' }}>
            <Trash2 size={13} />
          </button>
        </div>

        {expanded ? <ChevronUp size={13} color="#4b5563" /> : <ChevronDown size={13} color="#4b5563" />}
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Step name */}
          <div>
            <label style={labelStyle}>Step name</label>
            <input value={step.name || ''} onChange={e => onChange({ ...step, name: e.target.value })}
              placeholder={`Step ${index + 1} — ${info.label}`}
              style={inputStyle} />
          </div>

          {/* Skill slug */}
          <div>
            <label style={labelStyle}>Skill</label>
            <select value={step.skill_slug || ''} onChange={e => onChange({ ...step, skill_slug: e.target.value })}
              style={inputStyle}>
              <option value="">— select a skill —</option>
              {(SKILL_SLUGS[step.type] || []).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Type-specific fields */}
          {(step.type === 'sms' || step.type === 'email') && (
            <div>
              <label style={labelStyle}>Message / template body</label>
              <textarea value={step.message || step.body || ''} rows={3}
                onChange={e => onChange({ ...step, message: e.target.value, body: e.target.value })}
                placeholder="Hi {{client_name}}, just following up on {{property_address}}…"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
              <div style={{ fontSize: 10, color: '#4b5563', marginTop: 4 }}>
                Use {'{{variable}}'} for dynamic values — AI fills these from the client record
              </div>
            </div>
          )}

          {step.type === 'ai_generate' && (
            <div>
              <label style={labelStyle}>Prompt</label>
              <textarea value={step.prompt || ''} rows={3}
                onChange={e => onChange({ ...step, prompt: e.target.value })}
                placeholder="Draft a follow-up message for a buyer who viewed {{property_address}}…"
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }} />
            </div>
          )}

          {step.type === 'condition' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Check field</label>
                <input value={step.field || ''} onChange={e => onChange({ ...step, field: e.target.value })}
                  placeholder="e.g. budget" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>If missing, go to step</label>
                <input value={step.on_false || ''} onChange={e => onChange({ ...step, on_false: e.target.value })}
                  placeholder="step ID" style={inputStyle} />
              </div>
            </div>
          )}

          {step.type === 'delay' && (
            <div>
              <label style={labelStyle}>Wait (minutes)</label>
              <input type="number" value={step.minutes || 60} min={1}
                onChange={e => onChange({ ...step, minutes: Number(e.target.value) })}
                style={{ ...inputStyle, width: 120 }} />
            </div>
          )}

          {step.type === 'browser' && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
              fontSize: 12, color: '#67e8f9'
            }}>
              Browser skills replay a recorded session via Playwright. Record a skill in the Skills tab first, then select it above.
            </div>
          )}

          {/* Parallel toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <div
                onClick={() => onChange({ ...step, parallel: !step.parallel })}
                style={{
                  width: 36, height: 20, borderRadius: 10, position: 'relative',
                  background: step.parallel ? '#3b5bdb' : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0
                }}>
                <div style={{
                  position: 'absolute', top: 3, left: step.parallel ? 19 : 3,
                  width: 14, height: 14, borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s'
                }} />
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                Run in parallel with adjacent steps
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 5, fontWeight: 500 }
const inputStyle = {
  width: '100%', padding: '8px 10px',
  background: '#0d0f14', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 7, color: '#e8eaf0', fontSize: 13, outline: 'none',
  fontFamily: 'DM Sans, system-ui, sans-serif'
}

// ── Skill picker modal ───────────────────────────────────────
function SkillPicker({ onSelect, onClose }) {
  return (
    <div style={{
      minHeight: 400, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12
    }}>
      <div style={{
        background: '#13161e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: 24, width: 480
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Add a step</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {SKILL_TYPES.map(skill => {
            const Icon = skill.icon
            return (
              <button key={skill.type}
                onClick={() => onSelect(skill.type)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid rgba(255,255,255,0.07)`,
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border-color 0.15s, background 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = skill.color + '55'
                  e.currentTarget.style.background = skill.color + '0e'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: `${skill.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={16} color={skill.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8eaf0' }}>{skill.label}</div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 1 }}>{skill.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Workflows page ──────────────────────────────────────
export default function Workflows() {
  const [workflows, setWorkflows] = useState([
    {
      id: 'wf-1', name: 'Buyer intake', slug: 'buyer-intake',
      description: 'Triggered when AI qualifies a buyer client',
      trigger: 'intake_complete', is_active: true, steps: []
    },
    {
      id: 'wf-2', name: 'Listing launch', slug: 'listing-launch',
      description: 'Full launch sequence from notes to live MLS',
      trigger: 'manual', is_active: true, steps: []
    }
  ])
  const [selected, setSelected] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const wf = selected ? workflows.find(w => w.id === selected) : null

  function updateWf(fields) {
    setWorkflows(prev => prev.map(w => w.id === selected ? { ...w, ...fields } : w))
  }

  function addStep(type) {
    const step = {
      id: genId(), type, name: '', skill_slug: '',
      parallel: false, message: '', prompt: '', field: '', minutes: 60
    }
    updateWf({ steps: [...(wf.steps || []), step] })
    setShowPicker(false)
  }

  function updateStep(idx, newStep) {
    const steps = [...wf.steps]
    steps[idx] = newStep
    updateWf({ steps })
  }

  function deleteStep(idx) {
    const steps = wf.steps.filter((_, i) => i !== idx)
    updateWf({ steps })
  }

  function moveStep(idx, dir) {
    const steps = [...wf.steps]
    const target = idx + dir
    if (target < 0 || target >= steps.length) return
    ;[steps[idx], steps[target]] = [steps[target], steps[idx]]
    updateWf({ steps })
  }

  async function saveWorkflow() {
    setSaving(true)
    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wf)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    }
    setSaving(false)
  }

  async function runWorkflow() {
    if (!wf) return
    await fetch('/api/run-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'local' },
      body: JSON.stringify({ workflow_id: wf.id })
    })
    alert('Workflow queued!')
  }

  function createWorkflow() {
    const id = genId()
    const newWf = {
      id, name: 'New workflow', slug: `workflow-${id}`,
      description: '', trigger: 'manual', is_active: true, steps: []
    }
    setWorkflows(prev => [...prev, newWf])
    setSelected(id)
  }

  const TRIGGER_LABELS = {
    manual: 'Manual — run from dashboard',
    intake_complete: 'Auto — when client is qualified',
    date: 'Date — on a specific date',
    webhook: 'Webhook — external trigger'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Left sidebar — workflow list */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '24px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>Workflows</span>
          <button onClick={createWorkflow} className="btn-primary" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={12} /> New
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 16px' }}>
          {workflows.map(w => (
            <div key={w.id}
              onClick={() => setSelected(w.id)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                background: selected === w.id ? 'rgba(59,91,219,0.15)' : 'transparent',
                border: `1px solid ${selected === w.id ? 'rgba(59,91,219,0.3)' : 'transparent'}`,
              }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: selected === w.id ? '#7c9dff' : '#e8eaf0' }}>
                {w.name}
              </div>
              <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>
                {w.steps?.length || 0} steps · {TRIGGER_LABELS[w.trigger]?.split(' — ')[0] || w.trigger}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main canvas */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!wf ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
            <GitBranch size={32} color="#1a1e28" />
            <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>Select a workflow or create a new one</p>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div style={{
              padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <input
                value={wf.name}
                onChange={e => updateWf({ name: e.target.value })}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 18, fontWeight: 600, color: '#e8eaf0', fontFamily: 'DM Sans, system-ui'
                }}
              />
              <select value={wf.trigger} onChange={e => updateWf({ trigger: e.target.value })}
                style={{ ...inputStyle, width: 'auto', fontSize: 12, padding: '6px 10px' }}>
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button onClick={runWorkflow}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 7, border: '1px solid rgba(52,168,83,0.3)',
                  background: 'rgba(52,168,83,0.1)', color: '#6fcf97',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer'
                }}>
                <Play size={12} /> Run now
              </button>
              <button onClick={saveWorkflow}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 7, background: saved ? '#34a853' : '#3b5bdb',
                  border: 'none', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  transition: 'background 0.2s'
                }}>
                <Save size={12} /> {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>

            {/* Description */}
            <div style={{ padding: '12px 24px 0' }}>
              <input
                value={wf.description || ''}
                onChange={e => updateWf({ description: e.target.value })}
                placeholder="Workflow description…"
                style={{ ...inputStyle, fontSize: 12, color: '#6b7280', background: 'transparent', border: 'none', padding: '4px 0' }}
              />
            </div>

            {/* Steps canvas */}
            <div style={{ flex: 1, padding: '16px 24px 32px', overflow: 'auto' }}>

              {/* Trigger indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16
              }}>
                <div style={{
                  padding: '7px 14px', borderRadius: 8,
                  background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                  fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 7
                }}>
                  <Zap size={12} />
                  Trigger: {TRIGGER_LABELS[wf.trigger]}
                </div>
              </div>

              {/* Connector line + steps */}
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                {/* Vertical line */}
                {wf.steps?.length > 0 && (
                  <div style={{
                    position: 'absolute', left: 8, top: 0, bottom: 40,
                    width: 1, background: 'rgba(255,255,255,0.07)'
                  }} />
                )}

                {(wf.steps || []).map((step, idx) => {
                  const info = SKILL_ICON[step.type] || SKILL_TYPES[0]
                  return (
                    <div key={step.id} style={{ position: 'relative', marginBottom: 12 }}>
                      {/* Connector dot */}
                      <div style={{
                        position: 'absolute', left: -16, top: 20,
                        width: 8, height: 8, borderRadius: '50%',
                        background: info.color, zIndex: 1
                      }} />
                      <StepCard
                        step={step}
                        index={idx}
                        total={wf.steps.length}
                        onChange={s => updateStep(idx, s)}
                        onDelete={() => deleteStep(idx)}
                        onMoveUp={() => moveStep(idx, -1)}
                        onMoveDown={() => moveStep(idx, 1)}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Add step button */}
              {showPicker ? (
                <div style={{ marginTop: 16 }}>
                  <SkillPicker onSelect={addStep} onClose={() => setShowPicker(false)} />
                </div>
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  style={{
                    marginTop: 16, width: '100%', padding: '12px',
                    borderRadius: 10, border: '1px dashed rgba(255,255,255,0.12)',
                    background: 'transparent', color: '#4b5563', cursor: 'pointer',
                    fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'border-color 0.15s, color 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b5bdb'; e.currentTarget.style.color = '#7c9dff' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#4b5563' }}
                >
                  <Plus size={14} /> Add step
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
