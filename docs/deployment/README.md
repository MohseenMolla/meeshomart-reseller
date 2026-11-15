# Deployment guide

## Topology
Browser -> **Next.js (Vercel)** -> `/api/*` rewrite -> **Express API** (Node host) -> **MongoDB Atlas** (+ **Redis**).
The web app proxies `/api` server-side so the session cookie stays first-party on your domain.

## 1. MongoDB Atlas
- Use a **replica set cluster (M10+ or the free M0/Flex tier with replica set)**; transactions need one.
- Create a DB user, allow-list only the API host's IPs, enable continuous/cloud backups.
- `MONGO_URI=mongodb+srv://USER:PASS@cluster/reseller?retryWrites=true&w=majority`

## 2. API host (Render / Railway / Fly / VPS)
Build: `npm install && npm -w api run build`; start: `node apps/api/dist/server.js` (or use `apps/api/Dockerfile`).
Required env: `MONGO_URI`, `JWT_SECRET` (>=32 random chars; the API refuses to start in production otherwise), `CLIENT_ORIGIN` (https URL of the web app),
`API_PUBLIC_URL` (public https URL of the API, used for gateway callbacks), `SSLCZ_STORE_ID`, `SSLCZ_STORE_PASS`, `SSLCZ_SANDBOX=false` for live,
`NODE_ENV=production`, `TRUST_PROXY=1` (behind one proxy), `REDIS_URL` (enables BullMQ; without it jobs run in-process, so run exactly ONE instance).
Health check path: `/health` (returns 503 until the DB is connected). The API shuts down gracefully on SIGTERM.

## 3. Web (Vercel)
Root directory `apps/web`; set `API_INTERNAL_URL=https://api.yourdomain.com`. Add your custom domain; HTTPS is automatic.
Set the API's `CLIENT_ORIGIN` to that exact origin: the CSRF origin check compares against it.

## 4. SSLCommerz
1. Create sandbox credentials first; test with `SSLCZ_SANDBOX=true`.
2. In the SSLCommerz panel set the IPN URL to `https://<API_PUBLIC_URL>/api/v1/payments/ssl/ipn`.
3. Success/fail/cancel callbacks are set per transaction by the API (`/api/v1/payments/ssl/callback`).
4. Go live: swap to live store credentials and `SSLCZ_SANDBOX=false`. Do a real small-value payment end to end before launch.
The API never trusts the callback body: it calls the gateway's validation API and checks transaction id, amount and currency.

## 5. First admin and plans
`ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='long-password' npm -w apps/api run seed:admin`, log in at `/login`, then create plans and products at `/admin/plans` and `/admin/products`.

## 6. Backups and recovery
Atlas backups (point-in-time) are the primary mechanism. `infrastructure/deployment/backup.sh` makes extra `mongodump` archives; **test a restore into an empty database** at least once per quarter.
If a payment is confirmed but activation failed, the reconciliation job retries it every 10 minutes (status `needs_reconcile`).

## 7. Pre-launch checklist
- [ ] `npm test` green; run the full flow once in sandbox (register -> pay -> activate -> order -> deliver -> withdraw).
- [ ] Rotate any credential that was ever pasted into chat/logs; secrets only in host env vars.
- [ ] Atlas IP allow-list + backups verified; Redis password/TLS on.
- [ ] Only one API instance unless `REDIS_URL` is set.
- [ ] Legal pages (terms, privacy, refund policy) written; bKash/Nagad merchant approval obtained before enabling those methods.
