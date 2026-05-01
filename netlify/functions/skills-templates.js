// ================================================================
// Netlify Function: skills
// GET /api/skills  POST /api/skills  DELETE /api/skills?id=xxx
// ================================================================
import { getDb } from './lib/db.js'

export async function skillsHandler(req) {
  const sql = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM skills WHERE is_active = true ORDER BY is_builtin DESC, created_at DESC`
    return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const { name, slug, type, description, config, steps } = body
    const safeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const [row] = await sql`
      INSERT INTO skills (name, slug, type, description, config, steps, is_builtin)
      VALUES (${name}, ${safeSlug}, ${type}, ${description || ''}, ${JSON.stringify(config || {})}::jsonb, ${JSON.stringify(steps || [])}::jsonb, false)
      ON CONFLICT (slug) DO UPDATE SET steps = EXCLUDED.steps, updated_at = now()
      RETURNING *
    `
    return new Response(JSON.stringify(row), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method === 'DELETE' && id) {
    await sql`UPDATE skills SET is_active = false WHERE id = ${id} AND is_builtin = false`
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  return new Response('Method not allowed', { status: 405 })
}

// ================================================================
// Netlify Function: templates
// GET /api/templates  POST /api/templates  DELETE /api/templates?id=xxx
// ================================================================
export async function templatesHandler(req) {
  const sql = getDb()
  const url = new URL(req.url)
  const id = url.searchParams.get('id')

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM templates WHERE is_active = true ORDER BY type, name`
    return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const { id: bodyId, name, type, subject, body: tmplBody } = body
    const vars = JSON.stringify([...(tmplBody?.match(/\{\{(\w+)\}\}/g) || [])].map(m => m.slice(2,-2)))

    if (bodyId && !bodyId.startsWith('t-')) {
      const [row] = await sql`
        UPDATE templates SET name=${name}, type=${type}, subject=${subject||''}, body=${tmplBody||''}, variables=${vars}::jsonb, updated_at=now()
        WHERE id=${bodyId} RETURNING *
      `
      return new Response(JSON.stringify(row), { headers: { 'Content-Type': 'application/json' } })
    }

    const [row] = await sql`
      INSERT INTO templates (name, type, subject, body, variables)
      VALUES (${name}, ${type}, ${subject||''}, ${tmplBody||''}, ${vars}::jsonb)
      RETURNING *
    `
    return new Response(JSON.stringify(row), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method === 'DELETE' && id) {
    await sql`UPDATE templates SET is_active = false WHERE id = ${id}`
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  }

  return new Response('Method not allowed', { status: 405 })
}
