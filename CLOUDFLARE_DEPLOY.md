# Cloudflare Workers deployment

This package is prepared for Cloudflare Workers with Express + Workers Static Assets.

## Important compatibility note

Cloudflare officially documents Express on Workers using `app.listen()` and `httpServerHandler()` with Node.js compatibility. This project uses that integration.

The app still uses Mongoose/MongoDB. Cloudflare Workers has Node.js compatibility, but you should test the database connection locally with `wrangler dev` before production deployment. If a specific Mongoose dependency is incompatible in Workers, the database layer will need to be migrated to the official MongoDB Node driver or another HTTP-based database API.

## 1. Install

From this `server` directory:

```bash
npm install
npx wrangler login
```

## 2. Local environment

Create `.dev.vars` from `.dev.vars.example` and fill in your real values.

Do NOT put production secrets into `wrangler.jsonc` or commit `.dev.vars`.

## 3. Test locally

```bash
npm run cf:dev
```

Then test:

```text
http://localhost:8787/health
http://localhost:8787/income/pages/login/reset/?inviteCode=65662e97
```

## 4. Deploy

```bash
npm run deploy
```

Wrangler will show the Worker URL after deployment, normally:

```text
https://<worker-name>.<your-subdomain>.workers.dev
```

## 5. Production secrets

Set secrets from the `server` directory. Example:

```bash
npx wrangler secret put MONGODB_URI
npx wrangler secret put JWT_SECRET
npx wrangler secret put WATCHPAY_KEY
npx wrangler secret put WATCHPAY_MCH_ID
```

Repeat for the other WATCHPAY_* variables actually used by your application.

## 6. Production URL

After you know the Worker URL, set `PUBLIC_BASE_URL` to it as a secret/variable and set the payment webhook URL to:

```text
https://<worker-url>/api/payment-gateway/webhook
```

## 7. Custom subdomain

If you own a domain on Cloudflare, attach a custom domain/subdomain to this Worker from the Cloudflare dashboard. Then your deep URL can be:

```text
https://rv.example.com/income/pages/login/reset/?inviteCode=65662e97
```

The `/income/pages/login/reset/` route is already handled by the project.
