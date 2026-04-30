import { db, audit } from './_shared/db.mjs';
import { sendAgentText } from './_shared/sendblue.mjs';
import { getTeamId, handleError, json } from './_shared/http.mjs';

export const handler = async () => {
  try {
    const teamId = getTeamId();
    const sql = db();
    const [counts] = await sql`
      select
        (select count(*)::int from leads where team_id = ${teamId} and automation_enabled = true and status = 'active' and (next_follow_up_at is null or next_follow_up_at <= now())) as due_leads,
        (select count(*)::int from messages where team_id = ${teamId} and status = 'needs_review') as messages_need_review,
        (select count(*)::int from tasks where team_id = ${teamId} and status = 'open') as open_tasks,
        (select count(*)::int from signing_requests where team_id = ${teamId} and status in ('sent','viewed','needs_review','missing_fields')) as active_signings
    `;
    const text = `Daily autopilot summary: ${counts.due_leads} leads due, ${counts.messages_need_review} messages need review, ${counts.open_tasks} open tasks, ${counts.active_signings} active signing packets.`;
    const result = await sendAgentText(text).catch((error) => ({ error: error.message }));
    await audit({ teamId, action: 'summary.daily_sent', summary: text, payload: { counts, result } });
    return json(200, { ok: true, counts, result });
  } catch (error) {
    return handleError(error);
  }
};
