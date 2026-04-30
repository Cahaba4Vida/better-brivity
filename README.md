# Real Estate AI Autopilot — Netlify + Neon + Ollama

This is a deployable MVP starter for the simple Brivity-style AI operations layer:

- Netlify-hosted React dashboard
- Netlify Functions API
- Neon Postgres database
- Ollama AI worker integration
- Sendblue SMS/iMessage/RCS sending and inbound webhook
- Resend email sending and webhook
- DocuSign signing request scaffolding
- Consent checks, review queue, audit log, task queue, and one-button follow-up

## What works immediately

With `ALLOW_MOCK_PROVIDERS=true`, the app can run end-to-end without live Sendblue, Resend, DocuSign, or Ollama keys:

1. Add leads.
2. Run Today’s Follow-Up.
3. Generate AI/fallback recommendations.
4. Create review messages and tasks.
5. Approve messages.
6. Create signing request records.
7. See audit activity.

When real provider keys are added, the same flows call Sendblue, Resend, DocuSign, and your Ollama worker.

## Important Netlify deploy note

Do not rely on raw drag-and-drop for the production backend. Netlify manual deploys without continuous deployment do not run a build command, and Functions are normally bundled through Git, CLI, or API workflows.

Recommended deployment:

1. Unzip this folder.
2. Push it to a GitHub repository.
3. In Netlify, create a new project from that repo.
4. Netlify will read `netlify.toml`, run `npm run build`, publish `dist`, and deploy `netlify/functions`.

Alternative:

```bash
npm install
npm run build
npx netlify deploy --build --prod
```

## Environment variables

Copy `.env.example` into Netlify environment variables.

Minimum required for first deploy:

```txt
DATABASE_URL=your Neon connection string
ADMIN_API_KEY=long random dashboard key
SETUP_SECRET=long random one-time setup key
ALLOW_MOCK_PROVIDERS=true
DEFAULT_TEAM_ID=00000000-0000-0000-0000-000000000001
PUBLIC_SITE_URL=https://your-site.netlify.app
```

After deploy:

1. Open the app.
2. Paste `ADMIN_API_KEY` and `SETUP_SECRET` into the setup card.
3. Click **Run DB Setup**.
4. Click **Refresh**.
5. Run the sample autopilot flow.

## Real provider setup

### Ollama

Netlify cannot run Ollama directly. Host the `ollama-worker` folder on a VPS, Railway, Fly, Render, or any machine that can reach your Ollama process. Then set:

```txt
OLLAMA_API_URL=https://your-worker.example.com/generate
OLLAMA_API_KEY=your-worker-secret
OLLAMA_MODEL=llama3.1:8b
```

### Sendblue

Set:

```txt
SENDBLUE_API_KEY_ID=
SENDBLUE_API_SECRET_KEY=
SENDBLUE_FROM_NUMBER=+15555555555
SENDBLUE_STATUS_CALLBACK_URL=https://your-site.netlify.app/api/sendblue-webhook
```

### Resend

Set:

```txt
RESEND_API_KEY=
RESEND_FROM_EMAIL="Your Brokerage <noreply@yourdomain.com>"
```

### DocuSign

For production, use broker-approved templates. The included DocuSign wrapper can create an envelope from `DOCUSIGN_TEMPLATE_ID`, or it can create a placeholder HTML document in mock/demo mode.

Set:

```txt
DOCUSIGN_BASE_URL=https://demo.docusign.net
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_ACCESS_TOKEN=
DOCUSIGN_TEMPLATE_ID=
```

## API routes

All `/api/*` calls redirect to Netlify Functions.

- `GET /api/health`
- `POST /api/setup-db`
- `GET|POST /api/leads`
- `GET /api/dashboard`
- `POST /api/run-autopilot`
- `GET|POST /api/messages`
- `POST /api/send-message`
- `GET|PATCH|POST /api/tasks`
- `POST /api/sendblue-webhook`
- `POST /api/resend-webhook`
- `GET /api/signing-requests`
- `POST /api/create-signing-request`
- `POST /api/signing-webhook`
- `daily-summary` scheduled function

## Safety defaults

- SMS auto-send requires `sms_consent_status = opted_in`.
- Email send is blocked if lead opted out.
- Legal/contract/fair-housing-sensitive language forces review.
- AI decisions are stored in `ai_decisions`.
- Every important action writes to `audit_log`.
- Document signing requests require review by default.

## Next production hardening

Before selling this to agents/brokerages:

1. Replace browser-stored admin key with real auth.
2. Finish DocuSign OAuth/JWT token refresh instead of static access tokens.
3. Add signed webhook verification for each provider.
4. Add object storage for completed PDFs.
5. Add per-team multi-tenant auth and permissions.
6. Add provider rate limits, retries, and queueing.
7. Have brokerage counsel review templates, copy, and compliance rules.
