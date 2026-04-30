function canMock() {
  return String(process.env.ALLOW_MOCK_PROVIDERS || 'false').toLowerCase() === 'true';
}

export async function sendEmail({ to, subject, html, text, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    if (canMock()) {
      return {
        provider: 'resend_mock',
        providerMessageId: `mock_email_${Date.now()}`,
        status: 'sent',
        raw: { mocked: true, to, subject, html, text, idempotencyKey }
      };
    }
    throw new Error('Resend credentials are missing. Set RESEND_API_KEY and RESEND_FROM_EMAIL.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Resend send failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return {
    provider: 'resend',
    providerMessageId: data.id || null,
    status: 'sent',
    raw: data,
  };
}
