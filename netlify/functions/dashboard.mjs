import { db } from './_shared/db.mjs';
import { assertAdmin, getTeamId, handleError, json } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    const teamId = getTeamId();
    const sql = db();
    const [counts] = await sql`
      select
        (select count(*)::int from leads where team_id = ${teamId}) as total_leads,
        (select count(*)::int from leads where team_id = ${teamId} and automation_enabled = true and status = 'active' and (next_follow_up_at is null or next_follow_up_at <= now())) as due_leads,
        (select count(*)::int from messages where team_id = ${teamId} and status in ('needs_review','draft','queued')) as review_messages,
        (select count(*)::int from tasks where team_id = ${teamId} and status = 'open') as open_tasks,
        (select count(*)::int from signing_requests where team_id = ${teamId} and status not in ('completed','voided','declined','failed')) as active_signings
    `;
    const recentAudit = await sql`
      select action, summary, created_at
      from audit_log
      where team_id = ${teamId}
      order by created_at desc
      limit 12
    `;
    return json(200, { counts, recentAudit });
  } catch (error) {
    return handleError(error);
  }
};
