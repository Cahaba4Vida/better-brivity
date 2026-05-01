# Real Estate Agent Portal

A full-featured AI-powered command center for solo real estate agents — functioning as Executive Assistant, Transaction Manager, and Listing Coordinator.

## Features (Phase 1 + 2)

- **Dashboard** — Active deals, urgent tasks, upcoming deadlines, and quick AI actions at a glance
- **Deals Manager** — Full CRUD for listings, transactions, and buyer leads with task management
- **AI Assistant** — Three modes (Executive, Transaction, Listing) each with custom system prompts and full deal context injected
- **Transactions** — Contingency tracking and timeline view
- **Listings** — Listing card grid
- **Contacts** — Client and vendor contact directory
- **Settings** — Agent profile and API key management
- **Persistent storage** — All data saved to localStorage

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

The app opens at `http://localhost:3000`

### 3. Configure your API Key

Go to **Settings** in the sidebar and paste your Anthropic API key (`sk-ant-...`).  
Get one at [console.anthropic.com](https://console.anthropic.com).

Your API key is stored **only in your browser's localStorage** — never sent anywhere except directly to Anthropic.

## Deployment (GitHub Pages)

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:
```json
"homepage": "https://yourusername.github.io/realestate-portal",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

Then:
```bash
npm run deploy
```

## Deployment (Netlify / Vercel)

Just connect your GitHub repo. Both platforms auto-detect Create React App and build correctly.

- Build command: `npm run build`
- Publish directory: `build`

## Project Structure

```
src/
├── lib/
│   ├── AppContext.js     # Global state + persistence
│   └── storage.js        # localStorage wrapper + seed data
├── components/
│   └── Sidebar.js        # Navigation sidebar
├── pages/
│   ├── Dashboard.js      # Main command center view
│   ├── Deals.js          # Deal management + detail panel
│   ├── AIChat.js         # AI assistant with mode switching
│   ├── Transactions.js   # Transaction tracker (Phase 3 expansion)
│   ├── Listings.js       # Listing coordinator (Phase 4 expansion)
│   ├── Contacts.js       # Contact directory
│   └── Settings.js       # Profile + API key
├── App.js
├── index.js
└── index.css             # Design system CSS variables
```

## Roadmap

- **Phase 3** — Full transaction tracker with editable contingency timeline, checklist generation, addenda drafting
- **Phase 4** — Listing launch checklist wizard, showing feedback tracker, social campaign builder
- **Phase 5** — Templates library (emails, scripts, checklists) with AI auto-population
