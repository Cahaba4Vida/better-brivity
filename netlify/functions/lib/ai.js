// ================================================================
// AI Brain — Ollama (local) with Groq cloud fallback
// ================================================================

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1'
const GROQ_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

// ── Core chat function ───────────────────────────────────────

export async function chat(messages, options = {}) {
  try {
    return await ollamaChat(messages, options)
  } catch (err) {
    console.warn('[AI] Ollama unreachable, falling back to Groq:', err.message)
    if (GROQ_KEY) return await groqChat(messages, options)
    throw new Error('Both Ollama and Groq are unavailable')
  }
}

async function ollamaChat(messages, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: options.model || OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 500,
      }
    })
  })
  clearTimeout(timeout)
  if (!res.ok) throw new Error(`Ollama ${res.status}`)
  const data = await res.json()
  return data.message?.content || ''
}

async function groqChat(messages, options = {}) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 500,
    })
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

// ── Client intake conversation agent ────────────────────────

export async function runIntakeAgent(client, conversationHistory, newMessage) {
  const capturedSummary = client.captured_fields
    ? Object.entries(client.captured_fields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : 'Nothing captured yet'

  const systemPrompt = `You are Zack's AI real estate assistant. Zack is a licensed real estate agent.
Your job is to have a natural, warm conversation with clients via text message to:
1. Understand what they need (buy, sell, or both)
2. Capture key information (see required fields below)
3. Qualify them and trigger the right workflow when you have enough info

REQUIRED FIELDS TO CAPTURE:
- For buyers: name, budget, preferred_zip_codes, bedrooms_min, timeline, pre_approved (yes/no)
- For sellers: name, property_address, desired_price, timeline, motivation

RULES:
- Always be warm, professional, and concise — this is a TEXT MESSAGE
- Ask only ONE question at a time
- NEVER sound like a robot or a form
- If they ask a real estate question, answer it helpfully
- Always identify as Zack's assistant (not Zack himself)
- Include "Reply STOP to opt out" only on the very first message
- If someone says STOP or unsubscribe, reply only: "You've been unsubscribed. Reply START to re-subscribe."

WHAT YOU KNOW ABOUT THIS CLIENT SO FAR:
Name: ${client.name || 'unknown'}
Intent: ${client.intent || 'unknown'}
Stage: ${client.stage || 'intake'}
Captured info:
${capturedSummary}

When you have enough info to start a workflow, end your message with the exact tag:
[READY:buyer_intake] or [READY:listing_launch] or [READY:offer_workflow]`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: newMessage }
  ]

  const reply = await chat(messages, { temperature: 0.75, maxTokens: 300 })
  return reply
}

// ── Extract structured fields from conversation ──────────────

export async function extractFields(conversationText, currentIntent) {
  const prompt = `Extract structured information from this real estate conversation.
Return ONLY valid JSON, no explanation, no markdown.

Conversation:
${conversationText}

Extract these fields if present (use null if not found):
{
  "name": null,
  "intent": null,
  "budget": null,
  "preferred_zip_codes": null,
  "bedrooms_min": null,
  "bathrooms_min": null,
  "timeline": null,
  "pre_approved": null,
  "property_address": null,
  "desired_price": null,
  "motivation": null,
  "ready_for_workflow": null
}`

  const messages = [
    { role: 'system', content: 'You are a data extraction assistant. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ]

  const raw = await chat(messages, { temperature: 0.1, maxTokens: 400 })

  try {
    const clean = raw.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {}
  }
}

// ── Generate listing description ────────────────────────────

export async function generateListingDescription(notes, features, photosDescription) {
  const messages = [
    {
      role: 'system',
      content: 'You are a real estate copywriter. Write compelling, accurate MLS listing descriptions that attract buyers. Be specific, vivid, and professional. Aim for 150–200 words.'
    },
    {
      role: 'user',
      content: `Write an MLS listing description from these notes:

Agent notes: ${notes}
Property features: ${features}
Photo descriptions: ${photosDescription || 'not provided'}

Format: One paragraph opening hook, then features, then call to action.`
    }
  ]
  return chat(messages, { temperature: 0.8, maxTokens: 400 })
}

// ── Fill template variables with AI ─────────────────────────

export async function fillTemplate(templateBody, clientContext) {
  const variables = Object.entries(clientContext)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const messages = [
    {
      role: 'system',
      content: 'You are a template filler. Replace {{variable}} placeholders with the provided values. Return only the filled template, no explanation.'
    },
    {
      role: 'user',
      content: `Template:\n${templateBody}\n\nValues:\n${variables}`
    }
  ]
  return chat(messages, { temperature: 0.3, maxTokens: 600 })
}
