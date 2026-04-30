import { db, audit } from './db.mjs';
import { sendSms } from './sendblue.mjs';
import { sendEmail } from './resend.mjs';

export async function deliverMessage(teamId, messageId) {
  const sql = db();
  const [message] = await sql`
    select m.*, l.name as lead_name, l.phone as lead_phone, l.email as lead_email,
           l.sms_consent_status, l.email_consent_status
    from messages m
    left join leads l on l.id = m.lead_id
    where m.team_id = ${teamId} and m.id = ${messageId}
  `;

  if (!message) throw new Error('Message not found');
  if (message.direction !== 'outbound') throw new Error('Only outbound messages can be sent');
  if (['sent', 'delivered'].includes(message.status)) return { alreadySent: true, message };

  const idempotencyKey = message.idempotency_key || `${message.channel}_${message.id}`;

  try {
    let result;
    if (message.channel === 'sms') {
      if (message.sms_consent_status !== 'opted_in') throw new Error('SMS consent missing or not opted in');
      if (!message.lead_phone) throw new Error('Lead phone missing');
      result = await sendSms({ to: message.lead_phone, body: message.body, idempotencyKey });
    } else if (message.channel === 'email') {
      if (message.email_consent_status === 'opted_out' || message.email_consent_status === 'do_not_contact') throw new Error('Email consent opted out');
      if (!message.lead_email) throw new Error('Lead email missing');
      result = await sendEmail({
        to: message.lead_email,
        subject: message.subject || 'Quick follow-up',
        html: `<p>${escapeHtml(message.body).replace(/\n/g, '<br />')}</p>`,
        text: message.body,
        idempotencyKey,
      });
    } else {
      throw new Error(`Unsupported message channel: ${message.channel}`);
    }

    const [updated] = await sql`
      update messages
      set status = 'sent', provider = ${result.provider}, provider_message_id = ${result.providerMessageId}, sent_at = now(),
          failure_reason = null, approved_at = coalesce(approved_at, now()), metadata = metadata || ${JSON.stringify({ delivery: result.raw })}::jsonb
      where id = ${messageId}
      returning *
    `;

    if (message.lead_id) {
      await sql`
        update leads
        set last_contacted_at = now(), stage = case when stage = 'new' then 'contacted' else stage end
        where id = ${message.lead_id}
      `;
    }

    await audit({ teamId, action: 'message.sent', entityType: 'message', entityId: messageId, summary: `Sent ${message.channel} message`, payload: result.raw });
    return { sent: true, message: updated, result };
  } catch (error) {
    const [failed] = await sql`
      update messages
      set status = 'failed', failure_reason = ${error.message}
      where id = ${messageId}
      returning *
    `;
    await audit({ teamId, action: 'message.failed', entityType: 'message', entityId: messageId, summary: error.message, payload: { error: error.message } });
    throw Object.assign(error, { messageRecord: failed });
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
