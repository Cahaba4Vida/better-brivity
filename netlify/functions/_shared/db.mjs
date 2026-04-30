import { neon } from '@neondatabase/serverless';
import { requireEnv } from './http.mjs';

let client;

export function db() {
  if (!client) client = neon(requireEnv('DATABASE_URL'));
  return client;
}

export async function audit({ teamId, actorUserId = null, actorType = 'system', action, entityType = null, entityId = null, summary = null, payload = {} }) {
  const sql = db();
  await sql`
    insert into audit_log (team_id, actor_user_id, actor_type, action, entity_type, entity_id, summary, payload)
    values (${teamId || null}, ${actorUserId}, ${actorType}, ${action}, ${entityType}, ${entityId}, ${summary}, ${JSON.stringify(payload)}::jsonb)
  `;
}

export async function addLeadEvent({ teamId, leadId, eventType, summary = null, payload = {} }) {
  const sql = db();
  await sql`
    insert into lead_events (team_id, lead_id, event_type, summary, payload)
    values (${teamId}, ${leadId}, ${eventType}, ${summary}, ${JSON.stringify(payload)}::jsonb)
  `;
}

export async function getLeadContext(teamId, leadId) {
  const sql = db();
  const [lead] = await sql`
    select * from leads where team_id = ${teamId} and id = ${leadId}
  `;
  if (!lead) return null;
  const messages = await sql`
    select id, channel, direction, subject, body, status, created_at
    from messages
    where team_id = ${teamId} and lead_id = ${leadId}
    order by created_at desc
    limit 8
  `;
  const tasks = await sql`
    select id, type, status, title, description, priority, due_at, created_at
    from tasks
    where team_id = ${teamId} and lead_id = ${leadId} and status = 'open'
    order by created_at desc
    limit 5
  `;
  return { lead, messages, tasks };
}
