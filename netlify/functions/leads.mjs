import { db, audit, addLeadEvent } from './_shared/db.mjs';
import { assertAdmin, getPagination, getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    assertAdmin(event);
    const teamId = getTeamId();
    const sql = db();

    if (event.httpMethod === 'GET') {
      const { limit, offset } = getPagination(event, { limit: 100, max: 250 });
      const q = event.queryStringParameters?.q || '';
      const status = event.queryStringParameters?.status || '';
      const rows = await sql`
        select id, name, phone, email, source, buyer_or_seller, stage, status, location, notes,
               last_contacted_at, last_inbound_at, next_follow_up_at, sms_consent_status, email_consent_status,
               automation_enabled, created_at, updated_at
        from leads
        where team_id = ${teamId}
          and (${q} = '' or coalesce(name,'') ilike ${`%${q}%`} or coalesce(email,'') ilike ${`%${q}%`} or coalesce(phone,'') ilike ${`%${q}%`})
          and (${status} = '' or status = ${status})
        order by coalesce(next_follow_up_at, created_at) asc
        limit ${limit} offset ${offset}
      `;
      return json(200, { leads: rows });
    }

    if (event.httpMethod === 'POST') {
      const body = parseJsonBody(event);
      const [lead] = await sql`
        insert into leads (
          team_id, name, phone, email, source, buyer_or_seller, stage, status, location, notes,
          sms_consent_status, email_consent_status, next_follow_up_at
        ) values (
          ${teamId}, ${body.name || null}, ${body.phone || null}, ${body.email || null}, ${body.source || 'manual'},
          ${body.buyer_or_seller || 'unknown'}, ${body.stage || 'new'}, ${body.status || 'active'}, ${body.location || null}, ${body.notes || null},
          ${body.sms_consent_status || 'unknown'}, ${body.email_consent_status || 'unknown'}, ${body.next_follow_up_at || new Date().toISOString()}
        ) returning *
      `;
      await addLeadEvent({ teamId, leadId: lead.id, eventType: 'lead.created', summary: 'Lead created manually', payload: body });
      await audit({ teamId, action: 'lead.created', entityType: 'lead', entityId: lead.id, summary: `Lead created: ${lead.name || lead.email || lead.phone}`, payload: body });
      return json(201, { lead });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (error) {
    return handleError(error);
  }
};
