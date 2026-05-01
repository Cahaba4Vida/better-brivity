// ================================================================
// Netlify Function: skills
// GET /api/skills
// POST /api/skills       — create a new recorded browser skill
// DELETE /api/skills?id= — soft-delete a custom skill
// ================================================================

import { getDb } from './lib/db.js'

export default async function handler(req) {
  const sql = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT * FROM skills
      WHERE is_active = true
      ORDER BY is_builtin DESC, created_at DESC
    `
    return new Response(JSON.stringify(rows), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const { name, slug, type, description, config, steps } = body
    const safeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    const [row] = await sql`
      INSERT INTO skills (name, slug, type, description, config, steps, is_builtin)
      VALUES (
        ${name},
        ${safeSlug},
        ${type},
        ${description || ''},
        ${JSON.stringify(config || {})}::jsonb,
        ${JSON.stringify(steps || [])}::jsonb,
        false
      )
      ON CONFLICT (slug) DO UPDATE SET
        steps = EXCLUDED.steps,
        updated_at = now()
      RETURNING *
    `
    return new Response(JSON.stringify(row), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method === 'DELETE' && id) {
    await sql`
      UPDATE skills SET is_active = false
      WHERE id = ${id} AND is_builtin = false
    `
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Method not allowed', { status: 405 })
}
