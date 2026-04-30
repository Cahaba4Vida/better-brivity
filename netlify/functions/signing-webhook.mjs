import { db, audit } from './_shared/db.mjs';
import { parseDocusignWebhook } from './_shared/docusign.mjs';
import { sendAgentText } from './_shared/sendblue.mjs';
import { getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    const payload = parseJsonBody(event);
    const parsed = parseDocusignWebhook(payload);
    const teamId = getTeamId();
    const sql = db();

    let request = null;
    if (parsed.envelopeId) {
      [request] = await sql`
        update signing_requests
        set status = ${String(parsed.status || parsed.event).toLowerCase()},
            completed_at = case when lower(${parsed.status || ''}) in ('completed','signed') then now() else completed_at end,
            payload = payload || ${JSON.stringify({ webhook: payload })}::jsonb
        where team_id = ${teamId} and provider_request_id = ${parsed.envelopeId}
        returning *
      `;
    }

    await sql`
      insert into signing_events (signing_request_id, provider, provider_event_id, event_type, payload)
      values (${request?.id || null}, 'docusign', ${parsed.envelopeId || null}, ${parsed.event}, ${JSON.stringify(payload)}::jsonb)
    `;
    await audit({ teamId, actorType: 'provider', action: 'provider.docusign_webhook', entityType: request ? 'signing_request' : null, entityId: request?.id || null, summary: `${parsed.event}: ${parsed.status}`, payload });

    if (request && /completed|signed/i.test(parsed.status || parsed.event)) {
      await sendAgentText(`Document signed: ${request.document_type} for signing request ${request.id}.`).catch(() => {});
    }

    return json(200, { ok: true });
  } catch (error) {
    return handleError(error);
  }
};
