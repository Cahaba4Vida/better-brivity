// ================================================================
// Netlify Function: inbound-message
// POST /api/inbound-message
// Called by Bluesend webhook when a client texts in
// ================================================================

import {
  getClientByPhone, createClient, saveMessage,
  getConversationHistory, getCapturedFields,
  upsertCapturedField, updateClient, createWorkflowRun
} from './lib/db.js'
import { runIntakeAgent, extractFields } from './lib/ai.js'
import { sendMessage } from './lib/messaging.js'
import { getDb } from './lib/db.js'

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { from, body: messageBody, service } = body

  if (!from || !messageBody) {
    return new Response('Missing from or body', { status: 400 })
  }

  // ── TCPA: handle opt-out ─────────────────────────────────
  const normalized = messageBody.trim().toUpperCase()
  if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT'].includes(normalized)) {
    const client = await getClientByPhone(from)
    if (client) {
      await updateClient(client.id, { opted_out: true, opted_out_at: new Date().toISOString() })
    }
    await sendMessage(from, "You've been unsubscribed. Reply START to re-subscribe.", service || 'imessage')
    return new Response(JSON.stringify({ ok: true, action: 'opted_out' }), { status: 200 })
  }

  if (normalized === 'START') {
    const client = await getClientByPhone(from)
    if (client) await updateClient(client.id, { opted_out: false })
    await sendMessage(from, "Welcome back! How can Zack's team help you today?", service || 'imessage')
    return new Response(JSON.stringify({ ok: true, action: 'opted_in' }), { status: 200 })
  }

  // ── Get or create client ─────────────────────────────────
  let client = await getClientByPhone(from)
  const isNew = !client

  if (!client) {
    client = await createClient(from, service || 'imessage')
  }

  // Check opt-out
  if (client.opted_out) {
    return new Response(JSON.stringify({ ok: true, action: 'ignored_opted_out' }), { status: 200 })
  }

  // ── Save inbound message ─────────────────────────────────
  await saveMessage(client.id, 'user', messageBody, service || 'imessage', { raw: body })

  // ── Load context ─────────────────────────────────────────
  const [history, capturedFields] = await Promise.all([
    getConversationHistory(client.id, 30),
    getCapturedFields(client.id)
  ])

  // Attach captured fields to client object for AI context
  client.captured_fields = capturedFields

  // ── Run AI intake agent ──────────────────────────────────
  let aiReply
  try {
    aiReply = await runIntakeAgent(client, history, messageBody)
  } catch (err) {
    console.error('[INTAKE] AI error:', err)
    aiReply = "Hi! Thanks for reaching out to Zack's team. We're experiencing a brief delay — we'll get back to you shortly!"
  }

  // ── Check if AI signals ready for workflow ───────────────
  const workflowMatch = aiReply.match(/\[READY:([a-z_-]+)\]/)
  const cleanReply = aiReply.replace(/\[READY:[a-z_-]+\]/g, '').trim()

  // ── Save AI reply ────────────────────────────────────────
  await saveMessage(client.id, 'assistant', cleanReply, service || 'imessage')

  // ── Send reply to client ─────────────────────────────────
  await sendMessage(from, cleanReply, service || 'imessage')

  // ── Extract and save any new fields ─────────────────────
  try {
    const recentText = history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
      + `\nuser: ${messageBody}\nassistant: ${cleanReply}`

    const extracted = await extractFields(recentText, client.intent)

    for (const [field, value] of Object.entries(extracted)) {
      if (value && field !== 'ready_for_workflow') {
        await upsertCapturedField(client.id, field, String(value))

        // Update top-level client fields
        if (field === 'name') await updateClient(client.id, { name: value })
        if (field === 'intent') await updateClient(client.id, { intent: value })
      }
    }
  } catch (err) {
    console.warn('[INTAKE] Field extraction failed:', err.message)
  }

  // ── Trigger workflow if ready ────────────────────────────
  if (workflowMatch) {
    const workflowSlug = workflowMatch[1]
    try {
      const sql = getDb()
      const workflows = await sql`SELECT id FROM workflows WHERE slug = ${workflowSlug} LIMIT 1`
      if (workflows[0]) {
        const run = await createWorkflowRun(workflows[0].id, client.id, { ...capturedFields, client_phone: from })
        await updateClient(client.id, {
          stage: 'active',
          assigned_workflow: workflowSlug,
          workflow_run_id: run.id
        })

        // Kick off workflow async (fire and forget)
        fetch(`${process.env.URL || 'http://localhost:8888'}/.netlify/functions/run-workflow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.API_SECRET_KEY },
          body: JSON.stringify({ workflow_run_id: run.id })
        }).catch(err => console.error('[INTAKE] Failed to kick off workflow:', err))
      }
    } catch (err) {
      console.error('[INTAKE] Workflow trigger failed:', err)
    }
  }

  return new Response(JSON.stringify({ ok: true, is_new_client: isNew }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
