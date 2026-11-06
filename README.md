# Eliah & Co.

A responsive retail storefront + owner dashboard with shared, persistent state
powered by **Vercel KV** (Upstash Redis). Deployable on **GitHub + Vercel**.

> **Security warning:** This supplied application does not authenticate the owner
> dashboard or its API. The five-tap logo gesture is not access control: anyone
> can access the dashboard, read customer orders and business data, and overwrite
> shared data if Redis is connected. Do not use it for real customer information
> or connect shared storage on a public deployment until proper authentication,
> authorization, and protected order handling have been implemented.

---

## 1 · Local development

```bash
npm install
npm run dev          # http://localhost:5173 — uses localStorage only
```

To run the API routes locally (so the site talks to a real KV during dev), install
the Vercel CLI and use `vercel dev`:

```bash
npm i -g vercel
vercel dev           # runs Vite + the /api/* serverless functions
```

Without env vars, `vercel dev` and `npm run dev` both fall back to the browser's
`localStorage`, and an amber banner appears at the top of the site.

---

## 2 · Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Eliah & Co."
git branch -M main
git remote add origin https://github.com/<your-username>/eliah-and-co.git
git push -u origin main
```

Create the empty repository on GitHub first (don't tick "Add README"), then push.

---

## 3 · Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Click **Import** next to the `eliah-and-co` repository you just pushed.
3. Vercel auto-detects the **Vite** framework preset — leave everything as-is.
4. Click **Deploy**. First deploy takes ~30 s.

You'll get a live URL like `https://eliah-and-co.vercel.app`. Every subsequent
push to `main` triggers a new deploy automatically.

---

## 4 · Enable shared persistence (Vercel KV)

Without this step, each visitor's edits stay on their own device. With it, every
edit from any owner session is visible to every visitor within ~1 second.

1. In your Vercel project, go to **Storage → Create Database → Upstash (Redis)**
   (or open the Vercel Marketplace → search *redis*).
2. Click **Connect**. Vercel auto-injects these env vars into your project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`
   - `KV_URL`
3. Go to **Deployments → Redeploy** (or just push any commit) so the functions
   pick up the new env vars.
4. Open the live site. The amber banner disappears, and the black
   *"Loading shared data…"* banner shows briefly on every page load.

From now on, edits made on any device are written to Redis via
`/api/save-data` and read back by every visitor via `/api/load-data`.

---

## 5 · Project structure

```
eliah-and-co/
├─ api/
│  ├─ load-data.ts        # GET /api/load-data  — reads all keys from KV
│  └─ save-data.ts        # POST /api/save-data — writes one key to KV
├─ src/
│  ├─ App.tsx             # mounts store / dashboard, loads + saves to KV
│  ├─ data.ts             # types + defaults (products, iPhones, settings…)
│  ├─ lib/blobsClient.ts  # fetch wrapper + debounced save
│  └─ pages/
│     ├─ StoreFront.tsx       # customer storefront + cart + checkout
│     └─ OwnerDashboard.tsx   # owner control center (edit everything)
├─ index.html
├─ vite.config.ts
├─ package.json
└─ README.md
```

The owner dashboard is hidden on the storefront — tap the **ELIAH&CO** logo
**5 times** to enter.

---

## 6 · Notes

- The site uses `vite-plugin-singlefile`, so `npm run build` produces a single
  `dist/index.html` with all JS/CSS inlined. Vercel still deploys `api/*` as
  separate serverless functions alongside the static bundle.
- API functions only respond to known keys (`products`, `iphones`, `settings`,
  `sales`, `orders`, `deliveryLocations`) — arbitrary writes are rejected.
- If KV isn't configured, `/api/load-data` returns `503` and the site keeps
  working with `localStorage` so local development never breaks.
