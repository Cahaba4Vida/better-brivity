// pages/AIChat.js
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../lib/AppContext';

const MODES = {
  executive: {
    label: 'Executive Assistant',
    short: 'EA',
    color: 'var(--accent-gold)',
    bg: 'var(--accent-gold-dim)',
    border: 'var(--border-gold)',
    icon: '✦',
    description: 'Drafts emails, texts, follow-ups, objection scripts, presentations & strategy',
    systemPrompt: `You are an elite Executive Assistant for a high-performing solo real estate agent. You help with:
- Drafting professional emails and texts to clients, other agents, lenders, and title companies
- Writing follow-up sequences and touch campaigns
- Creating objection handling scripts and talking points
- Preparing for buyer/seller consultations with specific talking points
- Drafting social media content (market updates, just listed, just sold, testimonials)
- Generating buyer and seller presentations
- Strategic advice on "what to do next" with specific clients
- Writing negotiation strategy and offer analysis summaries

Be direct, professional, and practical. Match the tone of a luxury brokerage — polished but not stuffy. Always give actionable, specific output. When drafting communications, write them ready-to-send. Format clearly with subject lines for emails.`,
    starters: [
      'Draft a follow-up email for a buyer who went silent after 3 showings',
      'Write a "just listed" text blast to my sphere of influence',
      'Help me prepare talking points for a listing appointment tomorrow',
      'Write an objection script for "we want to wait until spring"',
      'Draft a price reduction conversation for my seller',
      'Create a 3-touch follow-up sequence for a new lead',
    ],
  },
  transaction: {
    label: 'Transaction Manager',
    short: 'TXN',
    color: 'var(--accent-blue-light)',
    bg: 'rgba(74, 127, 165, 0.12)',
    border: 'rgba(74, 127, 165, 0.3)',
    icon: '⊡',
    description: 'Tracks deals, flags risks, generates checklists, drafts addenda & counter-offer language',
    systemPrompt: `You are an expert Transaction Manager and real estate coordinator for a solo agent. You help with:
- Reviewing transaction timelines and flagging items at risk or approaching deadline
- Generating comprehensive under-contract checklists for each deal stage
- Drafting professional addendum language (repair amendments, extensions, termination notices)
- Writing counter-offer language and contingency waiver requests
- Creating milestone reminder messages for all parties (buyers, sellers, lenders, title)
- Tracking earnest money, option periods, appraisal, and financing deadlines
- Preparing closing day checklists and final walkthrough reminders
- Advising on what to do when contingencies are in jeopardy

Be precise, deadline-focused, and risk-aware. Always flag what could go wrong. Format checklists clearly with checkboxes. Use professional real estate terminology.`,
    starters: [
      'Generate a complete under-contract checklist for my buyer deal',
      'Draft a repair amendment requesting $8,500 credit in lieu of repairs',
      'My appraisal came in low — what are my options and next steps?',
      'Write a 5-day closing extension addendum',
      'What should I be tracking this week across all my transactions?',
      'Draft a termination notice for a buyer in their option period',
    ],
  },
  listing: {
    label: 'Listing Coordinator',
    short: 'LIST',
    color: '#6bc49a',
    bg: 'rgba(74, 148, 112, 0.12)',
    border: 'rgba(74, 148, 112, 0.3)',
    icon: '⊞',
    description: 'Manages launch checklists, writes listing copy, creates social campaigns & tracks feedback',
    systemPrompt: `You are an expert Listing Coordinator and marketing specialist for a top-producing real estate agent. You help with:
- Creating comprehensive pre-listing and launch checklists
- Writing compelling MLS property descriptions that sell lifestyle, not just features (300-400 word sweet spot)
- Generating social media campaign plans with post copy for Instagram, Facebook, and LinkedIn
- Writing "coming soon" content and open house promotions
- Creating showing feedback surveys and tracking templates
- Drafting weekly activity reports for seller clients
- Writing price improvement announcements that reframe the narrative positively
- Building listing marketing packages and feature sheets
- Creating just-sold announcements to leverage for future business

Write with sophistication and warmth. Property descriptions should be evocative and specific — no generic filler phrases. Social content should feel authentic, not corporate.`,
    starters: [
      'Write an MLS listing description for a 4/3 mid-century modern with a pool',
      'Create a 2-week social media campaign for my new listing',
      'Generate a complete listing launch checklist',
      'Write a weekly activity report email to my seller showing 7 showings, 0 offers',
      'Draft a price improvement social post that reframes the narrative positively',
      'Write a coming soon campaign for a luxury townhome',
    ],
  },
};

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ ...msgStyles.wrap, flexDirection: isUser ? 'row-reverse' : 'row', marginBottom: 16 }}>
      {!isUser && (
        <div style={msgStyles.avatar}>AI</div>
      )}
      <div style={{ ...msgStyles.bubble, background: isUser ? 'var(--accent-gold-dim)' : 'var(--bg-elevated)', border: `1px solid ${isUser ? 'var(--border-gold)' : 'var(--border-subtle)'}`, borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px', maxWidth: '72%' }}>
        <div style={msgStyles.text}>{msg.content}</div>
        {msg.timestamp && (
          <div style={msgStyles.time}>{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ ...msgStyles.wrap, marginBottom: 16 }}>
      <div style={msgStyles.avatar}>AI</div>
      <div style={{ ...msgStyles.bubble, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-gold)', animation: `pulse 1.2s ease ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AIChat() {
  const { aiMode, setAiMode, chatHistory, appendChatMessage, clearChatHistory, buildAIContext, agentProfile, deals } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('rp_apiKey') || '');
  const [showApiInput, setShowApiInput] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const messages = chatHistory[aiMode] || [];
  const mode = MODES[aiMode];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('rp_apiKey', key);
    setShowApiInput(false);
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    if (!apiKey) { setShowApiInput(true); return; }

    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    appendChatMessage(aiMode, userMsg);
    setInput('');
    setLoading(true);

    try {
      const contextSummary = buildAIContext();
      const systemContent = mode.systemPrompt + '\n\n---\nCURRENT DEAL CONTEXT:\n' + contextSummary + `\n\nAgent name: ${agentProfile.name} | Brokerage: ${agentProfile.brokerage}`;

      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemContent,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiText = data.content?.[0]?.text || 'No response received.';
      appendChatMessage(aiMode, { role: 'assistant', content: aiText, timestamp: Date.now() });
    } catch (err) {
      appendChatMessage(aiMode, { role: 'assistant', content: `Error: ${err.message}. Please check your API key in settings.`, timestamp: Date.now() });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={styles.page}>
      {/* Left: Mode sidebar */}
      <div style={styles.modeSidebar}>
        <div style={styles.modeHeader}>AI Mode</div>
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            style={{ ...styles.modeBtn, ...(aiMode === key ? { background: m.bg, border: `1px solid ${m.border}`, color: m.color } : {}) }}
            onClick={() => setAiMode(key)}
          >
            <span style={{ fontSize: 18 }}>{m.icon}</span>
            <div style={styles.modeBtnContent}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: aiMode === key ? m.color : 'var(--text-tertiary)', opacity: 0.8, lineHeight: 1.4 }}>{m.description}</div>
            </div>
          </button>
        ))}

        <div style={styles.contextPreview}>
          <div style={styles.contextLabel}>Deal Context</div>
          <div style={styles.contextText}>{deals.length} deals loaded into AI memory</div>
          <button style={styles.apiBtn} onClick={() => setShowApiInput(s => !s)}>
            {apiKey ? '⊙ API Key Set' : '⚠ Set API Key'}
          </button>
        </div>
      </div>

      {/* Right: Chat area */}
      <div style={styles.chatArea}>
        {/* Chat header */}
        <div style={styles.chatHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ ...styles.modeTag, color: mode.color, background: mode.bg, border: `1px solid ${mode.border}` }}>
              {mode.icon} {mode.short}
            </div>
            <span style={styles.chatTitle}>{mode.label}</span>
          </div>
          <button style={styles.clearBtn} onClick={() => clearChatHistory(aiMode)}>Clear chat</button>
        </div>

        {/* API key input */}
        {showApiInput && (
          <div style={styles.apiKeyBanner}>
            <span style={styles.apiKeyLabel}>Enter your Anthropic API key to enable AI:</span>
            <input
              style={styles.apiKeyInput}
              type="password"
              placeholder="sk-ant-..."
              defaultValue={apiKey}
              onKeyDown={e => { if (e.key === 'Enter') saveApiKey(e.target.value); }}
              autoFocus
            />
            <button style={styles.apiKeySave} onClick={e => saveApiKey(e.target.previousSibling.value)}>Save</button>
          </div>
        )}

        {/* Messages */}
        <div style={styles.messages}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{mode.icon}</div>
              <div style={styles.emptyTitle}>{mode.label}</div>
              <div style={styles.emptyDesc}>{mode.description}</div>
              <div style={styles.starterGrid}>
                {mode.starters.map((s, i) => (
                  <button key={i} style={styles.starterBtn} onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            style={styles.input}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Ask your ${mode.label}...`}
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
            }}
          />
          <button
            style={{ ...styles.sendBtn, background: input.trim() && !loading ? mode.color : 'var(--bg-elevated)', color: input.trim() && !loading ? '#08090e' : 'var(--text-tertiary)' }}
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
        <div style={styles.inputHint}>Enter to send · Shift+Enter for new line · Context: {deals.length} deals loaded</div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', height: '100vh', overflow: 'hidden' },
  modeSidebar: {
    width: 280,
    minWidth: 280,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-subtle)',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    overflowY: 'auto',
  },
  modeHeader: {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    color: 'var(--text-tertiary)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '0 8px 8px',
    borderBottom: '1px solid var(--border-subtle)',
    marginBottom: 6,
  },
  modeBtn: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  modeBtnContent: { flex: 1 },
  contextPreview: {
    marginTop: 'auto',
    padding: '14px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
  },
  contextLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 },
  contextText: { fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 },
  apiBtn: {
    width: '100%',
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-medium)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 11,
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
    textAlign: 'center',
  },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-secondary)',
    flexShrink: 0,
  },
  modeTag: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    border: '1px solid',
    borderRadius: 4,
    padding: '3px 8px',
    letterSpacing: '0.06em',
  },
  chatTitle: { fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' },
  clearBtn: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', cursor: 'pointer', letterSpacing: '0.04em' },
  apiKeyBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 24px',
    background: 'rgba(201, 169, 110, 0.06)',
    borderBottom: '1px solid var(--border-gold)',
    flexShrink: 0,
  },
  apiKeyLabel: { fontSize: 12, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', letterSpacing: '0.03em' },
  apiKeyInput: {
    flex: 1,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-gold)',
    borderRadius: 'var(--radius-sm)',
    padding: '7px 12px',
    fontSize: 12,
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'var(--font-mono)',
  },
  apiKeySave: {
    padding: '7px 16px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'var(--accent-gold)',
    color: '#08090e',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    whiteSpace: 'nowrap',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 20px',
  },
  emptyTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 28,
    fontWeight: 400,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    maxWidth: 480,
    lineHeight: 1.6,
    marginBottom: 32,
  },
  starterGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    maxWidth: 640,
    width: '100%',
  },
  starterBtn: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 14px',
    fontSize: 12,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textAlign: 'left',
    lineHeight: 1.4,
    transition: 'all 0.15s',
    fontFamily: 'var(--font-body)',
  },
  inputArea: {
    display: 'flex',
    gap: 10,
    padding: '16px 24px',
    borderTop: '1px solid var(--border-subtle)',
    background: 'var(--bg-secondary)',
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-medium)',
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'none',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.5,
    minHeight: 44,
    maxHeight: 140,
    overflow: 'auto',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
    fontWeight: 600,
  },
  inputHint: {
    padding: '6px 24px 10px',
    fontSize: 10,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    letterSpacing: '0.04em',
    background: 'var(--bg-secondary)',
  },
};

const msgStyles = {
  wrap: { display: 'flex', gap: 10, alignItems: 'flex-start' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--accent-gold-dim)',
    border: '1px solid var(--border-gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
    color: 'var(--accent-gold)',
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
  bubble: { padding: '12px 16px' },
  text: {
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  time: {
    fontSize: 9,
    color: 'var(--text-tertiary)',
    fontFamily: 'var(--font-mono)',
    marginTop: 6,
    textAlign: 'right',
  },
};
