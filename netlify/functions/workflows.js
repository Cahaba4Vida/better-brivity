// ================================================================
// Netlify Function: workflows
// GET /api/workflows  — list all
// POST /api/workflows — create/update
// ================================================================
import { getDb } from './lib/db.js'

export default async function handler(req) {
  const sql = getDb()

  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM workflows ORDER BY created_at DESC`
    return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method === 'POST') {
    const body = await req.json()
    const { id, name, slug, description, trigger, trigger_config, steps, is_active } = body

    if (id && !id.startsWith('wf-new')) {
      // Update existing
      const [row] = await sql`
        UPDATE workflows SET
          name = ${name}, description = ${description},
          trigger = ${trigger}, steps = ${JSON.stringify(steps)}::jsonb,
          is_active = ${is_active ?? true}, updated_at = now()
        WHERE id = ${id} RETURNING *
      `
      return new Response(JSON.stringify(row), { headers: { 'Content-Type': 'application/json' } })
    }

    // Insert new
    const safeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const [row] = await sql`
      INSERT INTO workflows (name, slug, description, trigger, steps, is_active)
      VALUES (${name}, ${safeSlug}, ${description || ''}, ${trigger || 'manual'}, ${JSON.stringify(steps || [])}::jsonb, ${is_active ?? true})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name, steps = EXCLUDED.steps, updated_at = now()
      RETURNING *
    `
    return new Response(JSON.stringify(row), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response('Method not allowed', { status: 405 })
}
