// ================================================================
// Netlify Function: clients
// GET /api/clients, GET /api/clients?id=xxx
// ================================================================

import { getDb } from './lib/db.js'

export default async function handler(req) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const sql = getDb()

  if (id) {
    const [client] = await sql`SELECT * FROM clients WHERE id = ${id}`
    if (!client) return new Response('Not found', { status: 404 })

    const [fields, history, deals, runs] = await Promise.all([
      sql`SELECT * FROM captured_fields WHERE client_id = ${id} ORDER BY captured_at DESC`,
      sql`SELECT role, content, sent_at FROM conversations WHERE client_id = ${id} ORDER BY sent_at ASC LIMIT 100`,
      sql`SELECT * FROM deals WHERE client_id = ${id} ORDER BY created_at DESC`,
      sql`
        SELECT wr.*, w.name as workflow_name
        FROM workflow_runs wr
        JOIN workflows w ON w.id = wr.workflow_id
        WHERE wr.client_id = ${id}
        ORDER BY wr.started_at DESC
      `
    ])

    return new Response(JSON.stringify({ client, fields, history, deals, runs }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const clients = await sql`
    SELECT c.*, COUNT(cv.id) as message_count
    FROM clients c
    LEFT JOIN conversations cv ON cv.client_id = c.id
    GROUP BY c.id
    ORDER BY c.last_contact_at DESC
  `
  return new Response(JSON.stringify(clients), {
    headers: { 'Content-Type': 'application/json' }
  })
}
