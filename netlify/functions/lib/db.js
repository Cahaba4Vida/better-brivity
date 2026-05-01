import { neon } from '@neondatabase/serverless'

let _sql = null

export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL environment variable is not set')
    _sql = neon(url)
  }
  return _sql
}

export async function query(strings, ...values) {
  const sql = getDb()
  return sql(strings, ...values)
}

// ── Client helpers ──────────────────────────────────────────

export async function getClientByPhone(phone) {
  const sql = getDb()
  const rows = await sql`
    SELECT * FROM clients WHERE phone = ${normalizePhone(phone)} LIMIT 1
  `
  return rows[0] || null
}

export async function createClient(phone, channel = 'imessage') {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO clients (phone, channel)
    VALUES (${normalizePhone(phone)}, ${channel})
    ON CONFLICT (phone) DO UPDATE SET last_contact_at = now()
    RETURNING *
  `
  return rows[0]
}

export async function updateClient(id, fields) {
  const sql = getDb()
  const sets = Object.entries(fields)
    .map(([k, v]) => `${k} = '${v}'`)
    .join(', ')
  const rows = await sql`
    UPDATE clients SET ${sql.unsafe(sets)}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0]
}

// ── Conversation helpers ─────────────────────────────────────

export async function getConversationHistory(clientId, limit = 40) {
  const sql = getDb()
  return sql`
    SELECT role, content, sent_at
    FROM conversations
    WHERE client_id = ${clientId}
    ORDER BY sent_at ASC
    LIMIT ${limit}
  `
}

export async function saveMessage(clientId, role, content, channel = 'imessage', metadata = {}) {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO conversations (client_id, role, content, channel, metadata)
    VALUES (${clientId}, ${role}, ${content}, ${channel}, ${JSON.stringify(metadata)})
    RETURNING *
  `
  // Update last contact
  await sql`UPDATE clients SET last_contact_at = now() WHERE id = ${clientId}`
  return rows[0]
}

// ── Captured fields helpers ──────────────────────────────────

export async function getCapturedFields(clientId) {
  const sql = getDb()
  const rows = await sql`
    SELECT field_name, field_value, confidence
    FROM captured_fields
    WHERE client_id = ${clientId}
  `
  return Object.fromEntries(rows.map(r => [r.field_name, r.field_value]))
}

export async function upsertCapturedField(clientId, fieldName, fieldValue, confidence = 1.0) {
  const sql = getDb()
  return sql`
    INSERT INTO captured_fields (client_id, field_name, field_value, confidence)
    VALUES (${clientId}, ${fieldName}, ${fieldValue}, ${confidence})
    ON CONFLICT (client_id, field_name)
    DO UPDATE SET field_value = EXCLUDED.field_value,
                  confidence = EXCLUDED.confidence,
                  captured_at = now()
  `
}

// ── Workflow helpers ─────────────────────────────────────────

export async function createWorkflowRun(workflowId, clientId, context = {}) {
  const sql = getDb()
  const rows = await sql`
    INSERT INTO workflow_runs (workflow_id, client_id, status, context)
    VALUES (${workflowId}, ${clientId}, 'pending', ${JSON.stringify(context)})
    RETURNING *
  `
  return rows[0]
}

export async function updateWorkflowRun(id, fields) {
  const sql = getDb()
  const rows = await sql`
    UPDATE workflow_runs
    SET status = ${fields.status || 'running'},
        current_step_idx = ${fields.current_step_idx ?? 0},
        step_results = ${JSON.stringify(fields.step_results || [])},
        context = ${JSON.stringify(fields.context || {})},
        error = ${fields.error || null},
        completed_at = ${fields.status === 'completed' || fields.status === 'failed' ? new Date().toISOString() : null},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0]
}

// ── Dashboard helpers ────────────────────────────────────────

export async function getDashboardData() {
  const sql = getDb()
  const [activeDeals, activeClients, urgentTasks, recentMessages] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM deals WHERE status IN ('active','under_contract')`,
    sql`SELECT COUNT(*) as count FROM clients WHERE stage NOT IN ('closed','inactive')`,
    sql`SELECT * FROM tasks WHERE status = 'pending' AND due_date < now() + interval '48 hours' ORDER BY due_date ASC LIMIT 10`,
    sql`
      SELECT c.name, c.phone, cv.content, cv.sent_at
      FROM conversations cv
      JOIN clients c ON c.id = cv.client_id
      WHERE cv.role = 'user'
      ORDER BY cv.sent_at DESC
      LIMIT 5
    `
  ])
  return {
    activeDeals: activeDeals[0].count,
    activeClients: activeClients[0].count,
    urgentTasks,
    recentMessages
  }
}

// ── Utils ────────────────────────────────────────────────────

export function normalizePhone(phone) {
  const digits = phone.replace(/\D/g, '')
  return digits.startsWith('1') ? `+${digits}` : `+1${digits}`
}
