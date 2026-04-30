# Compliance Guardrails

This is not legal advice. Treat this as a technical safety checklist.

## SMS

- Store consent status per lead.
- Do not auto-send SMS unless `sms_consent_status = opted_in`.
- Process STOP/UNSUBSCRIBE/CANCEL/END/QUIT as opt-out.
- Log consent events.
- Keep message audit records.

## Email

- Respect opt-out status.
- Use accurate sender identity and subject lines.
- Include required business/footer language in real production templates.
- Process bounces and complaints from Resend webhooks.

## Fair housing

The policy layer forces review for language about protected classes, steering, schools, safety/crime, religion, children/families, disability, race, and similar topics.

## Legal/contracts

- Do not let AI draft legal terms without review.
- Do not auto-send binding documents by default.
- Use broker-approved templates.
- Log signing events.
- Store signed PDFs and certificates in object storage, not directly in Postgres.

## Recommended before launch

- Real auth.
- Team-level RBAC.
- Provider webhook signature verification.
- Rate limits.
- Separate production/staging databases.
- Broker/admin copy approval.
