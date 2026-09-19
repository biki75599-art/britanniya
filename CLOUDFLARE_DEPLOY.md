# Cloudflare Workers deployment

This build keeps the original Express routes/controllers/models and adapts the runtime for Cloudflare Workers.

## Included
- Existing `public/` frontend is served by Workers Static Assets.
- Existing `/api/*` Express routes are preserved.
- MongoDB/Mongoose connects lazily from each Worker isolate.
- Existing local QR file is included under `public/uploads/qr/`.
- New admin QR uploads are stored as data URLs in the existing MongoDB `PaymentSetting.qrImage` field, so R2 is not required.
- Product income runs every minute via a Worker Cron Trigger.
- Daily income reset runs at 00:00 IST (`30 18 * * *` UTC).
- Frontend hard-coded Render API URLs were changed to same-origin relative `/api/...` URLs.

## Required Cloudflare variables
Set the variables/secrets listed in `.dev.vars.example` in the Worker dashboard.

## Important
- `.env` is intentionally excluded. Never commit production secrets.
- `PUBLIC_BASE_URL` must be the final Worker URL.
- `WATCHPAY_NOTIFY_URL` should be `https://YOUR-WORKER-DOMAIN/api/payment-gateway/webhook`.
