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

## Setup (do this once)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/zack-ai-portal.git
cd zack-ai-portal
npm install
```

### 2. Create a Neon database

1. Go to [neon.tech](https://neon.tech) → New project
2. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb`)

### 3. Set up environment variables

```bash
cp .env.example .env
# Edit .env and fill in your real keys
```

### 4. Run database migrations

```bash
npm run db:migrate
```

This creates all tables and seeds built-in skills and starter templates.

### 5. Install and start Ollama

```bash
# Mac/Linux
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.1
ollama serve
```

Ollama runs on `http://localhost:11434` by default.

> **Production tip**: Run Ollama on a VPS so it's always reachable.
> ```bash
> # On your VPS (Ubuntu)
> curl -fsSL https://ollama.ai/install.sh | sh
> ollama pull llama3.1
> OLLAMA_HOST=0.0.0.0 ollama serve
> ```
> Then set `OLLAMA_BASE_URL=http://YOUR_VPS_IP:11434` in Netlify env vars.

### 6. Run locally

```bash
npm install -g netlify-cli
netlify dev
```

Visit `http://localhost:8888`

---

## Deploy to Netlify

### Option A: Netlify UI (easiest)

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → New site → Import from GitHub
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add all environment variables from `.env.example` in **Site Settings → Environment Variables**
6. Deploy!

### Option B: CLI

```bash
netlify login
netlify init
netlify deploy --prod
```

---

## Connect Bluesend webhook

Once deployed, go to your Bluesend dashboard and set the webhook URL to:
```
https://YOUR-SITE.netlify.app/.netlify/functions/inbound-message
```

---

## Project structure

```
zack-ai-portal/
├── netlify/functions/          # Serverless API functions
│   ├── lib/
│   │   ├── db.js               # Neon database helpers
│   │   ├── ai.js               # Ollama + Groq AI brain
│   │   └── messaging.js        # Bluesend + Twilio + Resend
│   ├── inbound-message.js      # ← Bluesend webhook (main intake)
│   ├── run-workflow.js         # Workflow execution engine
│   ├── dashboard.js            # Dashboard API
│   └── clients.js              # Client CRUD API
├── src/
│   ├── pages/                  # React pages
│   ├── components/             # Shared components
│   └── styles/
├── sql/
│   ├── 001_schema.sql          # All database tables
│   └── 002_seed.sql            # Built-in skills + templates
├── .env.example                # All environment variables documented
├── netlify.toml                # Netlify config
└── README.md
```

---

## Phase 2 (coming next)

- [ ] Workflow builder UI (drag-and-drop steps canvas)
- [ ] Browser skill recorder (Chrome extension)
- [ ] Templates editor with `{{variable}}` preview
- [ ] Skills library management page
- [ ] DocuSign envelope creation from templates
- [ ] Navica MLS browser skill

---

## Troubleshooting

**AI not responding**: Check that Ollama is running (`ollama serve`) and `OLLAMA_BASE_URL` is correct. Set `GROQ_API_KEY` as a fallback.

**Messages not coming in**: Verify the Bluesend webhook URL points to your live Netlify function URL (not localhost).

**Database errors**: Make sure `DATABASE_URL` is set and you've run `npm run db:migrate`.
