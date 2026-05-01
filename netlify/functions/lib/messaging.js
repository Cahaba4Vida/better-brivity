// ================================================================
// Messaging — Bluesend iMessage + Twilio SMS fallback
// ================================================================

const BLUESEND_KEY = process.env.BLUESEND_API_KEY
const BLUESEND_FROM = process.env.BLUESEND_PHONE_NUMBER
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER

// ── Main send function ───────────────────────────────────────

export async function sendMessage(to, body, preferChannel = 'imessage') {
  if (preferChannel === 'imessage' && BLUESEND_KEY) {
    try {
      return await sendBluesend(to, body)
    } catch (err) {
      console.warn('[MSG] Bluesend failed, falling back to Twilio:', err.message)
    }
  }
  if (TWILIO_SID) {
    return await sendTwilio(to, body)
  }
  throw new Error('No messaging provider configured')
}

// ── Bluesend (iMessage) ──────────────────────────────────────

async function sendBluesend(to, body) {
  const res = await fetch('https://api.bluesend.io/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BLUESEND_KEY}`
    },
    body: JSON.stringify({
      from: BLUESEND_FROM,
      to,
      body,
      service: 'imessage'
    })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Bluesend error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return { provider: 'bluesend', id: data.id, status: 'sent' }
}

// ── Twilio (SMS) ─────────────────────────────────────────────

async function sendTwilio(to, body) {
  const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body })
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Twilio error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return { provider: 'twilio', id: data.sid, status: data.status }
}

// ── Resend (email) ───────────────────────────────────────────

export async function sendEmail({ to, subject, html, text }) {
  const RESEND_KEY = process.env.RESEND_API_KEY
  const FROM = `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({ from: FROM, to, subject, html: html || `<p>${text}</p>`, text })
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error ${res.status}: ${err}`)
  }
  const data = await res.json()
  return { provider: 'resend', id: data.id, status: 'sent' }
}
