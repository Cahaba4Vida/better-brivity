import { db, audit } from './_shared/db.mjs';
import { getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    const payload = parseJsonBody(event);
    const teamId = getTeamId();
    const sql = db();

    const eventType = payload.type || payload.event || 'resend.event';
    const emailId = payload.data?.id || payload.email_id || payload.id || null;
    const status = String(eventType).split('.').pop();

    if (emailId) {
      await sql`
        update messages
        set status = case
            when ${status} in ('delivered','bounced','complained','opened','clicked') then ${status}
            else status
          end,
          metadata = metadata || ${JSON.stringify({ resend_event: payload })}::jsonb
        where team_id = ${teamId} and provider_message_id = ${emailId}
      `;
    }

    await audit({ teamId, actorType: 'provider', action: 'provider.resend_webhook', summary: eventType, payload });
    return json(200, { ok: true });
  } catch (error) {
    return handleError(error);
  }
};
