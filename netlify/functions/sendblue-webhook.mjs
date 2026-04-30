import { db, audit, addLeadEvent } from './_shared/db.mjs';
import { detectStopIntent } from './_shared/policy.mjs';
import { handleError, json, parseJsonBody } from './_shared/http.mjs';

function normalizePhone(value = '') {
  return String(value).replace(/[^+0-9]/g, '');
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    const payload = parseJsonBody(event);
    const sql = db();
    const teamId = process.env.DEFAULT_TEAM_ID || '00000000-0000-0000-0000-000000000001';

    const content = payload.content || payload.message || payload.body || '';
    const fromNumber = normalizePhone(payload.number || payload.from_number || payload.from || payload.sender || '');
    const providerMessageId = payload.message_handle || payload.message_id || payload.id || null;
    const status = String(payload.status || '').toLowerCase();
    const isInbound = payload.is_outbound === false || status === 'received' || payload.direction === 'inbound';

    let lead = null;
    if (fromNumber) {
      [lead] = await sql`
        select * from leads
        where team_id = ${teamId} and regexp_replace(coalesce(phone,''), '[^+0-9]', '', 'g') = ${fromNumber}
        order by created_at desc
        limit 1
      `;
    }

    if (isInbound) {
      if (!lead) {
        [lead] = await sql`
          insert into leads (team_id, phone, source, stage, status, sms_consent_status, last_inbound_at, next_follow_up_at, notes)
          values (${teamId}, ${fromNumber || null}, 'sendblue_inbound', 'new', 'active', 'opted_in', now(), now(), ${content || null})
          returning *
        `;
        await audit({ teamId, action: 'lead.created_from_sms', entityType: 'lead', entityId: lead.id, summary: 'Inbound SMS created new lead', payload });
      }

      const [message] = await sql`
        insert into messages (team_id, lead_id, channel, direction, provider, provider_message_id, body, status, metadata)
        values (${teamId}, ${lead.id}, 'sms', 'inbound', 'sendblue', ${providerMessageId}, ${content}, 'received', ${JSON.stringify(payload)}::jsonb)
        returning *
      `;

      await sql`update leads set last_inbound_at = now(), next_follow_up_at = now() where id = ${lead.id}`;
      await addLeadEvent({ teamId, leadId: lead.id, eventType: 'message.inbound_sms', summary: content, payload });

      if (detectStopIntent(content)) {
        await sql`
          update leads set sms_consent_status = 'opted_out', status = 'do_not_contact', automation_enabled = false where id = ${lead.id}
        `;
        await sql`
          insert into consent_events (team_id, lead_id, channel, status, source, raw_payload)
          values (${teamId}, ${lead.id}, 'sms', 'opted_out', 'sendblue_webhook', ${JSON.stringify(payload)}::jsonb)
        `;
        await audit({ teamId, action: 'consent.sms_opted_out', entityType: 'lead', entityId: lead.id, summary: 'Lead opted out via SMS', payload });
      } else if (/tour|show|appointment|call me|available|interested/i.test(content)) {
        await sql`
          insert into tasks (team_id, lead_id, type, status, title, description, priority, metadata)
          values (${teamId}, ${lead.id}, 'hot_reply', 'open', 'Hot lead reply', ${content}, 'high', ${JSON.stringify({ message_id: message.id })}::jsonb)
        `;
      }
    } else if (providerMessageId) {
      await sql`
        update messages
        set status = case when ${status} in ('delivered','sent','queued','failed','error') then ${status} else status end,
            delivered_at = case when ${status} = 'delivered' then now() else delivered_at end,
            metadata = metadata || ${JSON.stringify({ sendblue_event: payload })}::jsonb
        where team_id = ${teamId} and provider_message_id = ${providerMessageId}
      `;
    }

    await audit({ teamId, action: 'provider.sendblue_webhook', entityType: lead ? 'lead' : null, entityId: lead?.id || null, summary: status || 'sendblue webhook received', payload });
    return json(200, { ok: true });
  } catch (error) {
    return handleError(error);
  }
};
