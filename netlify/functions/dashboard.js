// ================================================================
// Netlify Function: dashboard
// GET /api/dashboard
// ================================================================

import { getDb } from './lib/db.js'

export default async function handler(req) {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 })

  const sql = getDb()

  const [
    dealsResult,
    clientsResult,
    tasksResult,
    recentMessages,
    workflowRuns,
    clientsByStage
  ] = await Promise.all([
    sql`SELECT id, type, status, property_address, list_price, close_date FROM deals WHERE status IN ('active','under_contract') ORDER BY updated_at DESC`,
    sql`SELECT id, name, phone, intent, stage, last_contact_at FROM clients WHERE stage NOT IN ('closed','inactive') ORDER BY last_contact_at DESC LIMIT 20`,
    sql`SELECT * FROM tasks WHERE status = 'pending' AND due_date IS NOT NULL ORDER BY due_date ASC LIMIT 15`,
    sql`
      SELECT c.id as client_id, c.name, c.phone, cv.content, cv.sent_at, cv.role
      FROM conversations cv
      JOIN clients c ON c.id = cv.client_id
      WHERE cv.role = 'user'
      ORDER BY cv.sent_at DESC
      LIMIT 8
    `,
    sql`
      SELECT wr.id, wr.status, wr.current_step_idx, wr.started_at, w.name as workflow_name, c.name as client_name
      FROM workflow_runs wr
      JOIN workflows w ON w.id = wr.workflow_id
      LEFT JOIN clients c ON c.id = wr.client_id
      WHERE wr.status IN ('pending','running')
      ORDER BY wr.started_at DESC
      LIMIT 10
    `,
    sql`SELECT stage, COUNT(*) as count FROM clients GROUP BY stage`
  ])

  return new Response(JSON.stringify({
    deals: dealsResult,
    clients: clientsResult,
    tasks: tasksResult,
    recentMessages,
    workflowRuns,
    clientsByStage: Object.fromEntries(clientsByStage.map(r => [r.stage, Number(r.count)]))
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
