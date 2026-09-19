# WatchPay setup

## Required Render environment variables
- `MONGODB_URI`
- `JWT_SECRET`
- `WATCHPAY_BASE_URL=https://api.watch-glb.com` (confirm the API host with WatchPay if they provide a different one)
- `WATCHPAY_PAY_PATH=/pay/web`
- `WATCHPAY_MCH_ID` = your WatchPay merchant ID
- `WATCHPAY_KEY` = your WatchPay payment key (keep secret)
- `WATCHPAY_SIGN_TYPE=MD5`
- `WATCHPAY_PAY_TYPE=101` (use the channel code configured for your merchant)
- `WATCHPAY_NOTIFY_URL=https://YOUR-DOMAIN/api/payment-gateway/webhook`
- `WATCHPAY_RETURN_URL=https://YOUR-DOMAIN/payment-success.html`

## WatchPay signing
The app sorts non-empty parameters in ASCII ascending order, excludes `sign`, `sign_type` and `signType`, appends `&key=YOUR_PAYMENT_KEY`, then calculates lowercase MD5.

## Payment request
`POST /pay/web` with `application/x-www-form-urlencoded`.

## Callback
WatchPay callback is accepted without user authentication at `POST /api/payment-gateway/webhook`. JSON, URL-encoded form, and text/plain form-style callbacks are normalized. The callback signature is verified before a recharge is approved, and both `oriAmount` and the provider example's `originalAmount` are accepted.

## Important
WatchPay may require the backend server IP to be bound/whitelisted before API payment requests work. Do not put the payment key in frontend code or commit it to Git.
