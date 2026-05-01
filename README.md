# Zack AI Portal

AI-powered real estate command center. Clients text in → AI qualifies them → assembly-line automations fire automatically.

## Stack
- **Frontend**: React + Vite + Tailwind, deployed on Netlify
- **Backend**: Netlify Serverless Functions (Node 20)
- **Database**: Neon (Postgres) — source of truth for all clients
- **AI**: Ollama (local) with Groq cloud fallback
- **Messaging**: Bluesend (iMessage) + Twilio (SMS fallback)
- **Email**: Resend
- **E-signature**: DocuSign
- **CI/CD**: GitHub → Netlify auto-deploy

---

## What's built

### Phase 1 ✅
- Dashboard with live stats, client pipeline, recent messages, active deals, urgent tasks
- Client list with search and stage/intent badges
- Client detail with full conversation history, deals, and workflow run history
- AI intake agent (Ollama + Groq fallback) — qualifies clients via text, extracts fields, triggers workflows
- Inbound message webhook (Bluesend) with TCPA opt-out handling
- Workflow execution engine with parallel step support
- Full Neon schema: clients, conversations, captured_fields, skills, templates, workflows, workflow_runs, deals, tasks, skill_jobs

### Phase 2 ✅
- **Workflow builder** — visual canvas, add steps by skill type, configure prompts/messages, toggle parallel, reorder
- **Skills manager** — view all built-in skills, record new browser skills, delete custom skills
- **Templates editor** — write email/SMS/document templates with {{variable}} slots, live preview panel
- Backend APIs: workflows, skills, templates (GET/POST/DELETE)

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/zack-ai-portal.git
cd zack-ai-portal
npm install
```

### 2. Create a Neon database
Go to neon.tech → New project → copy the Connection string.

### 3. Set environment variables
```bash
cp .env.example .env
# Fill in your real keys
```

### 4. Run database migrations
```bash
npm run db:migrate
```

### 5. Start Ollama
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.1
ollama serve
```

Production tip — run on a VPS so it's always reachable:
```bash
OLLAMA_HOST=0.0.0.0 ollama serve
```
Then set OLLAMA_BASE_URL=http://YOUR_VPS_IP:11434 in Netlify env vars.

### 6. Run locally
```bash
npm install -g netlify-cli
netlify dev
# http://localhost:8888
```

---

## Deploy to Netlify
1. Push to GitHub
2. netlify.com → New site → Import from GitHub
3. Build: `npm run build` · Publish: `dist`
4. Add all env vars from .env.example
5. Deploy — auto-deploys on every push

Connect Bluesend webhook to:
https://YOUR-SITE.netlify.app/.netlify/functions/inbound-message

---

## Project structure

```
zack-ai-portal/
├── netlify/functions/
│   ├── lib/
│   │   ├── db.js               # Neon helpers
│   │   ├── ai.js               # Ollama + Groq
│   │   └── messaging.js        # Bluesend + Twilio + Resend
│   ├── inbound-message.js      # Bluesend webhook / client intake
│   ├── run-workflow.js         # Workflow engine (parallel steps)
│   ├── dashboard.js            # Dashboard API
│   ├── clients.js              # Client CRUD API
│   ├── workflows.js            # Workflow CRUD API      [Phase 2]
│   ├── skills.js               # Skills CRUD API        [Phase 2]
│   └── templates.js            # Templates CRUD API     [Phase 2]
├── src/
│   ├── components/Layout.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Clients.jsx
│       ├── ClientDetail.jsx
│       ├── Workflows.jsx       [Phase 2]
│       ├── Skills.jsx          [Phase 2]
│       └── Templates.jsx       [Phase 2]
├── sql/
│   ├── 001_schema.sql
│   └── 002_seed.sql
├── .env.example
├── netlify.toml
└── README.md
```

---

## API reference

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard | Dashboard stats |
| GET | /api/clients | All clients |
| GET | /api/clients?id= | Client + history |
| POST | /api/inbound-message | Bluesend webhook |
| POST | /api/run-workflow | Execute workflow |
| GET/POST | /api/workflows | Workflow CRUD |
| GET/POST/DELETE | /api/skills | Skills CRUD |
| GET/POST/DELETE | /api/templates | Templates CRUD |

---

## Phase 3 (next)
- [ ] Chrome extension for real Playwright browser recording
- [ ] DocuSign envelope creation from document templates
- [ ] Navica MLS pre-recorded browser skill
- [ ] Deal management UI
- [ ] Task manager with deadlines
- [ ] Live workflow run monitoring

---

## Troubleshooting

**AI not responding** — Check `ollama serve` is running and OLLAMA_BASE_URL is correct. Set GROQ_API_KEY as fallback.

**Messages not arriving** — Verify Bluesend webhook points to your live Netlify function URL.

**Database errors** — Check DATABASE_URL is set and `npm run db:migrate` has been run.

**Build fails** — Ensure NODE_VERSION=20 is set in Netlify environment variables.
