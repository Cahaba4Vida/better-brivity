// ================================================================
// Netlify Function: run-workflow
// POST /api/run-workflow
// Executes workflow steps — runs parallel steps simultaneously
// ================================================================

import { getDb, updateWorkflowRun } from './lib/db.js'
import { sendMessage, sendEmail } from './lib/messaging.js'
import { fillTemplate, generateListingDescription } from './lib/ai.js'

export default async function handler(req) {
  // Auth check
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.API_SECRET_KEY) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { workflow_run_id } = await req.json()
  if (!workflow_run_id) return new Response('Missing workflow_run_id', { status: 400 })

  const sql = getDb()

  // Load run + workflow definition
  const [run] = await sql`
    SELECT wr.*, w.steps, w.name as workflow_name
    FROM workflow_runs wr
    JOIN workflows w ON w.id = wr.workflow_id
    WHERE wr.id = ${workflow_run_id}
  `
  if (!run) return new Response('Run not found', { status: 404 })

  // Load client context
  const [client] = await sql`SELECT * FROM clients WHERE id = ${run.client_id}`
  const capturedRows = await sql`SELECT field_name, field_value FROM captured_fields WHERE client_id = ${run.client_id}`
  const context = {
    ...run.context,
    ...Object.fromEntries(capturedRows.map(r => [r.field_name, r.field_value])),
    client_name: client?.name || 'there',
    client_phone: client?.phone
  }

  await updateWorkflowRun(workflow_run_id, { status: 'running', current_step_idx: 0, context })

  const steps = Array.isArray(run.steps) ? run.steps : JSON.parse(run.steps || '[]')
  const results = []

  // ── Process steps sequentially, parallel steps run together ─
  let i = 0
  while (i < steps.length) {
    const currentStep = steps[i]

    // Collect all parallel steps starting at this index
    const parallelGroup = [currentStep]
    if (currentStep.parallel) {
      while (i + 1 < steps.length && steps[i + 1].parallel) {
        i++
        parallelGroup.push(steps[i])
      }
    }

    // Run parallel group simultaneously
    const groupResults = await Promise.allSettled(
      parallelGroup.map(step => runStep(step, context, client))
    )

    for (let j = 0; j < parallelGroup.length; j++) {
      const step = parallelGroup[j]
      const result = groupResults[j]
      results.push({
        step_id: step.id,
        name: step.name,
        status: result.status === 'fulfilled' ? 'completed' : 'failed',
        output: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason?.message : null
      })
    }

    i++
  }

  const allPassed = results.every(r => r.status === 'completed')
  await updateWorkflowRun(workflow_run_id, {
    status: allPassed ? 'completed' : 'failed',
    current_step_idx: steps.length,
    step_results: results,
    context,
    error: allPassed ? null : results.find(r => r.error)?.error
  })

  return new Response(JSON.stringify({ ok: true, results }), { status: 200 })
}

// ── Execute a single step ────────────────────────────────────

async function runStep(step, context, client) {
  const slug = step.skill_slug

  switch (true) {

    // SMS / iMessage
    case slug === 'send-imessage-bluesend' || slug === 'send-sms-twilio': {
      const to = step.to === 'zack'
        ? process.env.BLUESEND_PHONE_NUMBER
        : context.client_phone
      if (!to) throw new Error('No recipient phone number')
      const body = step.message
        ? await fillTemplate(step.message, context)
        : 'Message placeholder'
      return sendMessage(to, body, slug.includes('imessage') ? 'imessage' : 'sms')
    }

    // Email
    case slug === 'send-email-resend': {
      const to = step.to_email || context.client_email
      if (!to) throw new Error('No recipient email')
      const body = await fillTemplate(step.body || 'Email body', context)
      return sendEmail({ to, subject: step.subject || 'Message from Zack', text: body })
    }

    // AI generate
    case slug === 'ai-listing-description': {
      const description = await generateListingDescription(
        context.notes || '',
        context.features || '',
        context.photos_description || ''
      )
      context.listing_description = description
      return { description }
    }

    case slug === 'ai-draft-message': {
      const { fillTemplate: fill } = await import('./lib/ai.js')
      const draft = await fill(step.prompt || 'Draft a message for this client', context)
      return { draft }
    }

    // Conditions
    case slug === 'condition-field-exists': {
      const value = context[step.field]
      return { field: step.field, exists: !!value, value }
    }

    // Delays
    case slug === 'delay-minutes': {
      await new Promise(r => setTimeout(r, (step.minutes || 1) * 60 * 1000))
      return { delayed_minutes: step.minutes }
    }

    // Browser skills
    case slug?.startsWith('browser-'): {
      // Queue to skill_jobs table for async Playwright execution
      const sql = getDb()
      const [job] = await sql`
        INSERT INTO skill_jobs (skill_id, client_id, status, input)
        SELECT id, ${client?.id}, 'queued', ${JSON.stringify(context)}::jsonb
        FROM skills WHERE slug = ${slug}
        RETURNING id
      `
      return { job_id: job?.id, status: 'queued_async' }
    }

    default:
      throw new Error(`Unknown skill slug: ${slug}`)
  }
}
