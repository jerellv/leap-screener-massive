# LEAP Screener — Massive (Polygon.io) Edition

This is a **separate, standalone copy** of the LEAP screener that uses
Massive.com (formerly Polygon.io) for market data instead of Tradier.
Your original Tradier-based project is untouched — this lives on its own
GitHub repo and its own Vercel project.

Screens LEAP call contracts against a 5-gate framework: stock pullback,
contract % off all-time high, delta, IV, expiry window.

---

## Why a separate project

Tradier soft-blocks requests from cloud/server origins (the 302-to-docs
redirect we spent a long time chasing). Massive is a pure market-data API
(no brokerage account, no funding requirement), so it doesn't have that
problem. Architecturally it's also simpler — what took Tradier 3 calls
(quote → expirations → chains) is 2 calls here (price history → full
option chain with greeks/IV in one shot).

**Heads up:** Massive's free tier doesn't include live quotes/Greeks on
every endpoint — that may require a paid plan ($29/mo Starter or above).
The code degrades gracefully if a field is missing (same pattern your
original app already used for after-hours Greeks), so test it and we'll
see exactly what comes back.

---

## Deploy to Vercel (new project, ~10 minutes)

### Step 1 — GitHub
1. Go to https://github.com → **New repository** → name it e.g.
   `leap-screener-massive` → **Private** → Create
2. Upload every file in this zip (drag into the GitHub web UI, or use
   GitHub Desktop) — keep the folder structure (`api/`, `public/`) intact

### Step 2 — Vercel
1. Go to https://vercel.com → **Add New → Project**
2. Select your `leap-screener-massive` repo → **Import**
3. Leave build settings as default → **Deploy**

### Step 3 — Add your Massive API key
1. In Vercel: project → **Settings → Environment Variables**
2. Add:
   - **Name:** `MASSIVE_API_KEY`
   - **Value:** your Massive API key (from your Massive dashboard)
   - **Environment:** Production
3. **Save** → **Deployments → Redeploy**

### Step 4 — Open your app
Vercel gives you a URL like `https://leap-screener-massive-abc123.vercel.app`

---

## Local development (Mac)

```bash
# Confirm Node is installed
node -v

# In this folder, add your key
cp .env.example .env
nano .env   # paste your real MASSIVE_API_KEY value, save (Ctrl+O, Enter, Ctrl+X)

# Run
node server.js
# Opens at http://localhost:3000
```

---

## Testing the connection directly (bypass the UI)

Open the app in a browser, open DevTools Console, and run:

```javascript
fetch('/api/massive/v2/aggs/ticker/MSFT/range/1/day/2025-06-01/2026-06-24')
  .then(r => { console.log('STATUS:', r.status); return r.text(); })
  .then(t => console.log(t))
```

Status 200 with real bar data confirms the key and proxy are working
before you try a full scan.

---

## Project structure

```
leap-screener-massive/
├── api/
│   ├── massive.js     ← Serverless proxy for Massive API (keeps key secret)
│   └── status.js      ← Health check endpoint
├── public/
│   └── index.html      ← Full frontend (single file)
├── server.js            ← Local dev server (no dependencies)
├── vercel.json          ← Routing config
├── package.json
├── .env.example         ← Template — copy to .env for local dev
└── .gitignore           ← Prevents .env from being committed
```
