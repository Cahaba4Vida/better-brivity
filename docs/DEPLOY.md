# Deploy Guide

## Netlify path

1. Create a Neon database and copy the pooled connection string.
2. Create a new GitHub repository and push this project.
3. In Netlify, choose **Add new project → Import an existing project**.
4. Select the repository.
5. Netlify should auto-read:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
6. Add environment variables from `.env.example`.
7. Deploy.
8. Open the deployed URL.
9. Paste your dashboard `ADMIN_API_KEY` and `SETUP_SECRET`.
10. Click **Run DB Setup**.

## Local dev

```bash
npm install
cp .env.example .env
npm run dev
```

Open the local URL shown by Netlify Dev.

## Mock mode

Keep `ALLOW_MOCK_PROVIDERS=true` until you are ready to send real SMS, emails, and envelopes.

When you switch to real providers, set:

```txt
ALLOW_MOCK_PROVIDERS=false
AUTO_SEND_LOW_RISK=false
```

Then send a single test message from the review queue before enabling any automation.
