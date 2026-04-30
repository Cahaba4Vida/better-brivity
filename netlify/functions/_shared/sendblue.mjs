function canMock() {
  return String(process.env.ALLOW_MOCK_PROVIDERS || 'false').toLowerCase() === 'true';
}

export async function sendSms({ to, body, idempotencyKey }) {
  const keyId = process.env.SENDBLUE_API_KEY_ID;
  const secret = process.env.SENDBLUE_API_SECRET_KEY;
  const fromNumber = process.env.SENDBLUE_FROM_NUMBER;

  if (!keyId || !secret || !fromNumber) {
    if (canMock()) {
      return {
        provider: 'sendblue_mock',
        providerMessageId: `mock_sms_${Date.now()}`,
        status: 'sent',
        raw: { mocked: true, to, body, idempotencyKey }
      };
    }
    throw new Error('Sendblue credentials are missing. Set SENDBLUE_API_KEY_ID, SENDBLUE_API_SECRET_KEY, and SENDBLUE_FROM_NUMBER.');
  }

  const response = await fetch('https://api.sendblue.co/api/send-message', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'sb-api-key-id': keyId,
      'sb-api-secret-key': secret,
    },
    body: JSON.stringify({
      content: body,
      from_number: fromNumber,
      number: to,
      status_callback: process.env.SENDBLUE_STATUS_CALLBACK_URL || `${process.env.PUBLIC_SITE_URL || ''}/api/sendblue-webhook`,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Sendblue send failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return {
    provider: 'sendblue',
    providerMessageId: data.message_handle || data.id || null,
    status: String(data.status || 'sent').toLowerCase(),
    raw: data,
  };
}

export async function sendAgentText(text) {
  const to = process.env.AGENT_PHONE;
  if (!to) return { skipped: true, reason: 'AGENT_PHONE missing' };
  return sendSms({ to, body: text, idempotencyKey: `agent_${Date.now()}` });
}
