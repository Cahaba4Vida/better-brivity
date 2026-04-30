# Architecture

```txt
React Dashboard on Netlify CDN
  ↓ /api/* redirect
Netlify Functions
  ├─ lead CRUD
  ├─ autopilot run
  ├─ message approval/send
  ├─ provider webhooks
  ├─ signing requests
  └─ scheduled daily summary
  ↓
Neon Postgres
  ├─ leads
  ├─ messages
  ├─ tasks
  ├─ ai_decisions
  ├─ signing_requests
  └─ audit_log
  ↓
External providers
  ├─ Ollama worker for structured AI decisions
  ├─ Sendblue for text/iMessage/RCS
  ├─ Resend for email
  └─ DocuSign for signing
```

The AI is not allowed to directly mutate the world. It returns a structured recommendation. Backend policy checks decide whether the recommendation becomes a message, task, blocked action, or signing review item.

## One-button workflow

1. User clicks **Run Today’s Follow-Up**.
2. Backend finds due leads.
3. Backend gathers recent lead context.
4. Ollama/fallback returns structured decision JSON.
5. Backend validates consent and risk flags.
6. Backend creates message or task.
7. Optional: backend sends safe messages if auto-send is enabled.
8. Agent gets summary text if enabled.

## Document signing workflow

1. User chooses a lead and document type.
2. Backend checks missing fields.
3. Backend creates `signing_requests` and `signing_recipients` rows.
4. If review is required, a task is created.
5. If approved and provider credentials exist, DocuSign envelope is created.
6. DocuSign webhook updates signing status.
