# MyGame + WatchPay integration

This build replaces the old RSPayment create/webhook flow with the WatchPay flow described by the WatchPay Java samples supplied for this project.

## Important
- `WATCHPAY_BASE_URL` must be the current **API host** supplied by WatchPay for `/pay/web`. Do not use `merchant.watch-glb.com` as the API host unless WatchPay explicitly says that domain exposes the API.
- The previously supplied sample host `https://api.watch-glb.com` is kept only as an example in `.env.example`; if it is unreachable/DNS-fails, ask WatchPay for the current API host.
- Keep `WATCHPAY_KEY` private; put it in Render Environment Variables, never in frontend code or GitHub.
- WatchPay must enable API access for merchant `100666907` and, if required, whitelist the server's outbound IP.
- Callback URL: `https://<your-mygame-domain>/api/payment-gateway/webhook`

## Flow
1. User opens MyGame recharge page.
2. MyGame creates a WatchPay order using `POST /pay/web` and the WatchPay MD5 signature.
3. The returned WatchPay payment page/URL is shown to the user.
4. WatchPay POSTs the signed callback to `/api/payment-gateway/webhook`.
5. The callback is signature-checked, merchant/amount/order matched, and the existing MyGame recharge approval logic credits the user's recharge balance once.

## Run
```bash
cd server
npm install
npm start
```
