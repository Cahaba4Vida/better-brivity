import { db, audit } from './_shared/db.mjs';
import { assertAdmin, getPagination, getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    const teamId = getTeamId();
    const sql = db();

    if (event.httpMethod === 'GET') {
      const { limit, offset } = getPagination(event, { limit: 50, max: 150 });
      const rows = await sql`
        select t.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
        from tasks t
        left join leads l on l.id = t.lead_id
        where t.team_id = ${teamId} and t.status = coalesce(${event.queryStringParameters?.status || null}, t.status)
        order by case t.priority when 'high' then 0 when 'normal' then 1 else 2 end, t.created_at desc
        limit ${limit} offset ${offset}
      `;
      return json(200, { tasks: rows });
    }

    if (event.httpMethod === 'PATCH' || event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      if (!body.id) return json(400, { error: 'id is required' });
      const [task] = await sql`
        update tasks
        set status = coalesce(${body.status || null}, status), priority = coalesce(${body.priority || null}, priority)
        where team_id = ${teamId} and id = ${body.id}
        returning *
      `;
      if (!task) return json(404, { error: 'Task not found' });
      await audit({ teamId, action: 'task.updated', entityType: 'task', entityId: task.id, summary: `Task updated: ${task.title}`, payload: body });
      return json(200, { task });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    return handleError(error);
  }
};
