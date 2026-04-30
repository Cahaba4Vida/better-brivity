const STOP_WORDS = ['stop', 'unsubscribe', 'cancel', 'end', 'quit'];
const FAIR_HOUSING_PATTERNS = [
  /school district/i,
  /safe neighborhood/i,
  /crime rate/i,
  /family friendly/i,
  /good for families/i,
  /church/i,
  /temple/i,
  /mosque/i,
  /ethnic/i,
  /race/i,
  /religion/i,
  /children/i,
  /disabled/i,
  /handicap/i,
];
const LEGAL_PATTERNS = [
  /legal advice/i,
  /contract/i,
  /commission/i,
  /compensation/i,
  /binding/i,
  /lawsuit/i,
  /disclosure/i,
  /addendum/i,
  /amendment/i,
];

export function detectStopIntent(text = '') {
  const normalized = text.trim().toLowerCase();
  return STOP_WORDS.includes(normalized) || /^stop\b/.test(normalized);
}

export function riskFlagsForText(text = '') {
  const flags = [];
  if (!text || text.length < 2) flags.push('empty_message');
  if (text.length > 1200) flags.push('message_too_long');
  if (FAIR_HOUSING_PATTERNS.some((pattern) => pattern.test(text))) flags.push('fair_housing_review');
  if (LEGAL_PATTERNS.some((pattern) => pattern.test(text))) flags.push('legal_or_contract_review');
  if (/guarantee/i.test(text)) flags.push('guarantee_claim_review');
  return [...new Set(flags)];
}

export function validateDecision(lead, decision, options = {}) {
  const flags = new Set(Array.isArray(decision.risk_flags) ? decision.risk_flags : []);
  const action = decision.recommended_action || 'create_task';
  const message = decision.message || '';

  for (const flag of riskFlagsForText(message)) flags.add(flag);

  if (action === 'send_sms') {
    if (!lead.phone) flags.add('missing_phone');
    if (lead.sms_consent_status !== 'opted_in') flags.add('sms_consent_missing');
  }

  if (action === 'send_email') {
    if (!lead.email) flags.add('missing_email');
    if (!['opted_in', 'unknown'].includes(lead.email_consent_status)) flags.add('email_opted_out');
  }

  if (lead.status === 'do_not_contact' || lead.sms_consent_status === 'do_not_contact' || lead.email_consent_status === 'do_not_contact') {
    flags.add('do_not_contact');
  }

  const confidence = Number(decision.confidence || 0);
  if (confidence < Number(options.minimumConfidence || 0.75)) flags.add('low_confidence');

  const requiresHumanReview = Boolean(decision.requires_human_review) || flags.size > 0;
  return {
    allowedToAutoSend: !requiresHumanReview && ['send_sms', 'send_email'].includes(action),
    requiresHumanReview,
    riskFlags: [...flags],
  };
}

export function nextFollowUpTimestamp(hours = 24) {
  const date = new Date();
  date.setHours(date.getHours() + Number(hours || 24));
  return date.toISOString();
}
