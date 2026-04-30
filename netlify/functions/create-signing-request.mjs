import { db, audit } from './_shared/db.mjs';
import { createDocusignEnvelope } from './_shared/docusign.mjs';
import { sendAgentText } from './_shared/sendblue.mjs';
import { assertAdmin, getTeamId, handleError, json, parseJsonBody } from './_shared/http.mjs';

function missingFields(lead) {
  const missing = [];
  if (!lead.name) missing.push('lead.name');
  if (!lead.email) missing.push('lead.email');
  return missing;
}

export const handler = async (event) => {
  try {
    assertAdmin(event);
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
    const body = parseJsonBody(event);
    if (!body.lead_id) return json(400, { error: 'lead_id is required' });

    const teamId = getTeamId();
    const sql = db();
    const [lead] = await sql`select * from leads where team_id = ${teamId} and id = ${body.lead_id}`;
    if (!lead) return json(404, { error: 'Lead not found' });

    const documentType = body.document_type || 'buyer_agreement';
    const missing = missingFields(lead);
    const subject = body.subject || `${process.env.BROKERAGE_NAME || 'Your agent'}: ${documentType.replaceAll('_', ' ')} ready for review`;
    const message = body.message || `Please review and sign this ${documentType.replaceAll('_', ' ')}.`;
    const requiresReview = missing.length > 0 || body.require_review !== false;

    const [request] = await sql`
      insert into signing_requests (team_id, lead_id, provider, document_type, status, subject, message, missing_fields, ai_summary, requires_human_review, payload)
      values (${teamId}, ${lead.id}, 'docusign', ${documentType}, ${missing.length ? 'missing_fields' : 'needs_review'}, ${subject}, ${message}, ${JSON.stringify(missing)}::jsonb, ${`Prepared ${documentType} for ${lead.name || lead.email || 'lead'}. Missing fields: ${missing.join(', ') || 'none'}.`}, ${requiresReview}, ${JSON.stringify(body)}::jsonb)
      returning *
    `;

    await sql`
      insert into signing_recipients (signing_request_id, role, name, email, phone)
      values (${request.id}, 'Signer', ${lead.name || 'Client'}, ${lead.email || null}, ${lead.phone || null})
    `;

    let envelope = null;
    if (body.send_now && missing.length === 0 && !requiresReview) {
      envelope = await createDocusignEnvelope({
        lead,
        documentType,
        subject,
        message,
        templateId: body.template_id || process.env.DOCUSIGN_TEMPLATE_ID || null,
      });
      await sql`
        update signing_requests
        set status = ${envelope.status || 'sent'}, provider_request_id = ${envelope.providerRequestId}, signing_url = ${envelope.signingUrl}, sent_at = now(), payload = payload || ${JSON.stringify({ envelope: envelope.raw })}::jsonb
        where id = ${request.id}
      `;
    } else {
      await sql`
        insert into tasks (team_id, lead_id, type, status, title, description, priority, metadata)
        values (${teamId}, ${lead.id}, 'document_review', 'open', 'Review signing request', ${missing.length ? `Missing fields: ${missing.join(', ')}` : 'Document requires agent approval before sending.'}, ${missing.length ? 'high' : 'normal'}, ${JSON.stringify({ signing_request_id: request.id })}::jsonb)
      `;
    }

    await audit({ teamId, action: 'signing_request.created', entityType: 'signing_request', entityId: request.id, summary: `Signing request created for ${lead.name || lead.email}`, payload: { request, envelope } });
    if (missing.length) await sendAgentText(`Signing packet needs review: ${lead.name || lead.email || 'lead'} is missing ${missing.join(', ')}.`).catch(() => {});

    const [updated] = await sql`select * from signing_requests where id = ${request.id}`;
    return json(201, { signingRequest: updated, envelope });
  } catch (error) {
    return handleError(error);
  }
};
