// ================================================================
// Netlify Function: templates
// GET /api/templates
// POST /api/templates       — create or update a template
// DELETE /api/templates?id= — soft-delete a template
// ================================================================

import { getDb } from './lib/db.js'

export default async function handler(req) {
  const sql = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT * FROM templates
      WHERE is_active = true
      ORDER BY type, name
    `
    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const { id: bodyId, name, type, subject, body: tmplBody } = body

    // Extract variable names from {{variable}} syntax
    const variables = JSON.stringify(
      [...new Set((tmplBody?.match(/\{\{(\w+)\}\}/g) || []).map(m => m.slice(2, -2)))]
    )

    if (bodyId && !bodyId.startsWith('t-')) {
      // Update existing
      const [row] = await sql`
        UPDATE templates SET
          name     = ${name},
          type     = ${type},
          subject  = ${subject || ''},
          body     = ${tmplBody || ''},
          variables = ${variables}::jsonb,
          updated_at = now()
        WHERE id = ${bodyId}
        RETURNING *
      `
      return new Response(JSON.stringify(row), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Insert new
    const [row] = await sql`
      INSERT INTO templates (name, type, subject, body, variables)
      VALUES (${name}, ${type}, ${subject || ''}, ${tmplBody || ''}, ${variables}::jsonb)
      RETURNING *
    `
    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'DELETE' && id) {
    await sql`UPDATE templates SET is_active = false WHERE id = ${id}`
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Method not allowed', { status: 405 })
}
