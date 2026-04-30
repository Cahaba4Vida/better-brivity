function cleanJsonText(text) {
  if (!text) return '{}';
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}

function fallbackDecision(context) {
  const { lead, messages = [] } = context;
  const recentInbound = messages.find((m) => m.direction === 'inbound');
  const name = lead.name?.split(' ')[0] || 'there';
  const location = lead.location || 'your target area';
  const wantsBuyer = ['buyer', 'both', 'unknown'].includes(lead.buyer_or_seller);
  const wantsSeller = ['seller', 'both'].includes(lead.buyer_or_seller);

  if (recentInbound && /show|tour|see|view|appointment|available|time/i.test(recentInbound.body || '')) {
    return {
      recommended_action: 'create_task',
      confidence: 0.9,
      requires_human_review: true,
      risk_flags: ['appointment_request'],
      message: null,
      task_title: `Schedule showing for ${lead.name || 'lead'}`,
      task_description: `Lead appears to be asking for an appointment/showing: ${recentInbound.body}`,
      next_status: 'hot',
      follow_up_in_hours: 2,
      reason: 'Inbound reply appears appointment-related and should be handled by the agent.'
    };
  }

  if (wantsSeller) {
    return {
      recommended_action: lead.phone ? 'send_sms' : 'send_email',
      confidence: 0.82,
      requires_human_review: false,
      risk_flags: [],
      message: `Hey ${name}, are you still thinking about selling in ${location}? I can put together a quick pricing snapshot if helpful.`,
      task_title: null,
      task_description: null,
      next_status: 'contacted',
      follow_up_in_hours: 48,
      reason: 'Seller lead is due for a light follow-up.'
    };
  }

  if (wantsBuyer) {
    return {
      recommended_action: lead.phone ? 'send_sms' : 'send_email',
      confidence: 0.84,
      requires_human_review: false,
      risk_flags: [],
      message: `Hey ${name}, are you still looking at homes around ${location}? I can send a few fresh options if you want.`,
      task_title: null,
      task_description: null,
      next_status: 'contacted',
      follow_up_in_hours: 48,
      reason: 'Buyer lead is due for a simple intent check.'
    };
  }

  return {
    recommended_action: 'create_task',
    confidence: 0.68,
    requires_human_review: true,
    risk_flags: ['unclear_intent'],
    message: null,
    task_title: `Review lead: ${lead.name || lead.email || lead.phone || 'unknown'}`,
    task_description: 'AI could not confidently determine whether this is a buyer or seller lead.',
    next_status: 'needs_review',
    follow_up_in_hours: 24,
    reason: 'Lead intent is unclear.'
  };
}

export async function decideFollowUp(context) {
  const endpoint = process.env.OLLAMA_API_URL;
  if (!endpoint) return fallbackDecision(context);

  const prompt = `You are an AI operations assistant for a real estate agent. Return ONLY valid JSON matching this schema:
{
  "recommended_action": "send_sms" | "send_email" | "create_task" | "do_nothing",
  "confidence": number between 0 and 1,
  "requires_human_review": boolean,
  "risk_flags": string[],
  "message": string | null,
  "task_title": string | null,
  "task_description": string | null,
  "next_status": string,
  "follow_up_in_hours": number,
  "reason": string
}
Rules:
- Keep outbound messages short, helpful, and natural.
- Never mention protected classes, safety/crime, school quality, religion, race, disability, families/children, or steering.
- Do not give legal, mortgage, tax, or contract advice.
- If consent is missing for SMS, choose create_task.
- If a lead asks to stop, choose do_nothing with risk flag opted_out.
- Prefer human review for legal/document/commission questions.

Lead context:
${JSON.stringify(context, null, 2)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.OLLAMA_API_KEY ? { authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt,
        format: 'json',
        stream: false,
        options: { temperature: 0.2 }
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Ollama worker error: ${response.status}`);
    const data = await response.json();
    const raw = data.response || data.message || data.output || data.text || JSON.stringify(data);
    const parsed = JSON.parse(cleanJsonText(raw));
    return { ...fallbackDecision(context), ...parsed };
  } catch (error) {
    console.error('AI worker failed, using fallback decision:', error);
    return { ...fallbackDecision(context), risk_flags: ['ollama_fallback'], reason: `Fallback used because AI worker failed: ${error.message}` };
  } finally {
    clearTimeout(timeout);
  }
}
