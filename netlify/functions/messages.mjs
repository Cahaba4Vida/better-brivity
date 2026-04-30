import { db, audit } from './_shared/db.mjs';
import { deliverMessage } from './_shared/delivery.mjs';
import { assertAdmin, getPagination, getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    const teamId = getTeamId();
    const sql = db();

    if (event.httpMethod === 'GET') {
      const { limit, offset } = getPagination(event, { limit: 75, max: 200 });
      const status = event.queryStringParameters?.status || '';
      const rows = await sql`
        select m.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email
        from messages m
        left join leads l on l.id = m.lead_id
        where m.team_id = ${teamId}
          and (${status} = '' or m.status = ${status})
        order by m.created_at desc
        limit ${limit} offset ${offset}
      `;
      return json(200, { messages: rows });
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      if (body.action === 'send') {
        if (!body.id) return json(400, { error: 'id is required' });
        await sql`update messages set approved_at = now(), requires_human_review = false, status = 'queued' where team_id = ${teamId} and id = ${body.id}`;
        const result = await deliverMessage(teamId, body.id);
        return json(200, result);
      }

      if (!body.lead_id || !body.channel || !body.body) return json(400, { error: 'lead_id, channel, and body are required' });
      const [message] = await sql`
        insert into messages (team_id, lead_id, channel, direction, subject, body, status, ai_generated, requires_human_review, idempotency_key)
        values (${teamId}, ${body.lead_id}, ${body.channel}, 'outbound', ${body.subject || null}, ${body.body}, ${body.status || 'needs_review'}, ${Boolean(body.ai_generated)}, ${body.requires_human_review !== false}, ${body.idempotency_key || `${body.channel}_${body.lead_id}_${Date.now()}`})
        returning *
      `;
      await audit({ teamId, action: 'message.created', entityType: 'message', entityId: message.id, summary: `Message created for review`, payload: body });
      return json(201, { message });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    return handleError(error);
  }
};
