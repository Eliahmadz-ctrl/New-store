# Eliah & Co.

A Vite/React storefront and owner dashboard using Upstash Redis through Vercel serverless functions.

## Production setup

1. Secure any existing Redis database first. If a token was shared, rotate/revoke it (or replace the database) and do not reuse it. Do not paste credentials in chat or commit them.
2. Deploy this version of the app **before** connecting storage. Earlier versions expose shared data and writes without authentication.
3. In the Vercel project **Settings → Environment Variables**, add the following for Production. Obtain the first two values securely from Upstash or connect an Upstash Redis integration. Use the plain REST URL, not Markdown or the `rediss://` URL.
   - `KV_REST_API_URL` — Upstash REST URL.
   - `KV_REST_API_TOKEN` — newly rotated Upstash REST token; mark sensitive.
   - `OWNER_PASSWORD` — a unique, randomly generated password of at least 32 characters; mark sensitive.
   - `OWNER_SESSION_SECRET` — a separate, randomly generated secret of at least 32 characters; mark sensitive.
4. Redeploy the protected version so it receives the variables. Never expose the token or owner secrets as `VITE_` variables. Rotating `OWNER_SESSION_SECRET` invalidates existing sessions.
5. Tap the storefront logo five times and sign in with the owner password. Verify on separate browsers that a customer can submit an order and only the signed-in owner can read or edit it.

The dashboard uses an eight-hour Secure, HttpOnly, SameSite cookie and rate-limits sign-in attempts using Redis. Public reads exclude orders, sales and stored purchase costs. Owner writes require a session and same-origin requests. Customer orders are stored using an atomic Redis operation and checked against server-side prices, delivery options and stock. This is a single-owner password system, not multi-user identity management; protect the Vercel and Upstash accounts, keep secrets private, and review security before handling real customer data. Orders do not reserve or automatically decrement stock. Review orders before fulfilling them. Only one owner should edit the same data at a time (catalog/settings/sales use whole-document saves).

## Development

```sh
npm ci
npm run dev
npm test
npm run build
npx tsc --noEmit
```

Plain Vite does not run the serverless API. The storefront shows defaults, owner login is unavailable and orders cannot be submitted. For API development use `vercel dev` with a separate test Redis database and the variables above. Customer and sales data are not persisted to browser localStorage.

The store defaults in `src/data.ts` are bundled into the public client; do not put private data in that file. Owner changes and customer orders require Redis. API tests use a mock Redis service; a full end-to-end test requires a configured test database.

## Delivery destinations and order notifications

Each listed delivery destination can be selected independently. When an older stored group is read, its destinations are expanded using that group's existing fee; the owner can then change each destination's fee separately under **Settings → Delivery Prices**. The expansion preserves unrelated custom destinations and does not rewrite stored data until the owner saves a change.

Email and SMS notifications require provider accounts; they are **not active just because the website is deployed**. Set these Production environment variables directly in Vercel, then redeploy. Never put tokens in source code, screenshots or chat.

- Email via Resend: `RESEND_API_KEY` (sensitive), `ORDER_EMAIL_FROM` (a Resend-verified sender), `ORDER_EMAIL_TO` (the owner's recipient address).
- SMS via Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (sensitive), `TWILIO_FROM_NUMBER` (an approved SMS-capable sender), `ORDER_SMS_TO` (the owner's mobile in E.164 format, such as `+260...`). Check Twilio's Zambia coverage, sender eligibility, trial restrictions and pricing before enabling SMS.

Once an order is saved, the server immediately attempts both configured channels in parallel. Notifications contain the order number and total, not customer contact details. The owner dashboard shows **accepted** (the provider accepted the request, not guaranteed delivery), **failed** (provider rejected it), **unknown** (network failure or timeout; delivery is uncertain), **pending**, or **unconfigured**. Orders remain saved if an alert fails; there is no automatic retry, so monitor the dashboard. To verify, place a test order, check email and SMS, and then delete the test order in the dashboard. Provider availability, account verification, rate limits and charges are outside the app's control.

## Product photos and videos

Customers can open a product's details to see its description, additional information and photo/video gallery. In the owner dashboard, use **Products → Edit** (or **Phones → Edit** for iPhones) to add the description, optional product information, and gallery items. Paste HTTPS image links or direct video file links (for example MP4). Small image files up to 250 KB can also be uploaded; videos must be hosted elsewhere and linked directly, not as YouTube page URLs. Gallery media shares the existing Redis-backed product storage, so using hosted image URLs is recommended to avoid large data payloads. The first image follows the selected colour as before.
