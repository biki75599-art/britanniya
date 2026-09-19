const crypto = require("crypto");
const Payment = require("../models/Payment");
const Recharge = require("../models/Recharge");

function requireConfig(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

const WATCHPAY_PAY_PATH = process.env.WATCHPAY_PAY_PATH || "/pay/web";
const WATCHPAY_SIGN_TYPE = process.env.WATCHPAY_SIGN_TYPE || "MD5";
const WATCHPAY_PAY_TYPE = process.env.WATCHPAY_PAY_TYPE || "101";

function publicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
}

function buildNotifyUrl() {
  const explicit = String(process.env.WATCHPAY_NOTIFY_URL || "").trim();
  if (explicit) return explicit;
  const base = publicBaseUrl();
  if (!base) throw new Error("PUBLIC_BASE_URL or WATCHPAY_NOTIFY_URL is required");
  return `${base}/api/payment-gateway/webhook`;
}

function buildReturnUrl() {
  const explicit = String(process.env.WATCHPAY_RETURN_URL || "").trim();
  if (explicit) return explicit;
  const base = publicBaseUrl();
  return base ? `${base}/payment-success.html` : "";
}

// WatchPay signing rules from the supplied API documentation:
// 1) Sort parameter names in ascending ASCII order.
// 2) Exclude sign, sign_type/signType and empty/null values.
// 3) Join as key=value&key=value and append &key=SECRET.
// 4) Return lowercase MD5.
function makeSign(params, key) {
  const entries = Object.entries(params)
    .filter(([name, value]) => {
      const lowerName = String(name).toLowerCase();
      return (
        lowerName !== "sign" &&
        lowerName !== "sign_type" &&
        lowerName !== "signtype" &&
        value !== undefined &&
        value !== null &&
        String(value) !== ""
      );
    })
    // localeCompare() can use locale-specific collation; WatchPay requires ASCII order.
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  const signSource = entries
    .map(([name, value]) => `${name}=${String(value)}`)
    .join("&");

  const sourceWithKey = `${signSource}&key=${key}`;
  return crypto.createHash("md5").update(sourceWithKey, "utf8").digest("hex");
}

function buildPaymentParams({ orderId, amount }) {
  const mchId = requireConfig("WATCHPAY_MCH_ID");
  const key = requireConfig("WATCHPAY_KEY");
  const notifyUrl = buildNotifyUrl();
  const returnUrl = buildReturnUrl();

  const params = {
    mch_id: mchId,
    mch_order_no: orderId,
    notify_url: notifyUrl,
    order_date: formatOrderDate(new Date()),
    pay_type: WATCHPAY_PAY_TYPE,
    // WatchPay examples use plain yuan values (e.g. 100), so do not force
    // trailing .00 for integer amounts. The exact submitted string is signed.
    trade_amount: Number.isInteger(amount) ? String(amount) : String(amount.toFixed(2)),
    goods_name: process.env.WATCHPAY_GOODS_NAME || "MyGame Recharge",
  };

  // These are optional in the WatchPay sample and are only signed/submitted when non-empty.
  // page_url is optional. Only send it when explicitly configured because every
  // non-empty field participates in the MD5 signature.
  const pageUrl = String(process.env.WATCHPAY_PAGE_URL || "").trim();
  const returnMsg = String(process.env.WATCHPAY_RETURN_MSG || "").trim();
  if (pageUrl) params.page_url = pageUrl;
  if (returnMsg) params.mch_return_msg = returnMsg;

  // The WatchPay documentation says to set version=1.0 when JSON is required.
  // Always request JSON so the payment link can be read from payInfo.
  params.version = "1.0";

  // sign_type is submitted but, per the supplied Java sample, is NOT included in the signature.
  params.sign_type = WATCHPAY_SIGN_TYPE;

  // Do not automatically turn WATCHPAY_RETURN_URL into page_url. The docs mark
  // page_url optional, and adding an extra signed field can cause a signature
  // mismatch if the merchant backend is configured differently.
  // WATCHPAY_PAGE_URL remains the explicit opt-in for this field.
  void returnUrl;
  // page_url/version are assigned before the signature is calculated.
  params.sign = makeSign(params, key);
  return params;
}

function formatOrderDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function findUrl(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/https?:\/\/[^\s"'<>]+/i);
  return match ? match[0].replace(/[),.;]+$/g, "") : null;
}

function extractPaymentUrl(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return findUrl(trimmed);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = extractPaymentUrl(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === "object") {
    // WatchPay documentation names the synchronous payment-link field payInfo.
    // Accept common casing/nesting variations without assuming a single response shape.
    const preferredKeys = ["payInfo", "payUrl", "pay_url", "payment_url", "paymentUrl", "url", "redirectUrl", "redirect_url"];
    for (const key of preferredKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const found = extractPaymentUrl(value[key]);
        if (found) return found;
      }
    }

    for (const [key, child] of Object.entries(value)) {
      if (preferredKeys.includes(key)) continue;
      const found = extractPaymentUrl(child);
      if (found) return found;
    }
  }

  return null;
}

function injectBaseIntoHtml(html, baseUrl) {
  if (!baseUrl || !/<html[\s>]/i.test(html)) return html;
  if (/<base[\s>]/i.test(html)) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1><base href="${baseUrl.replace(/"/g, "&quot;")}/">`);
}

async function createPaymentOrder({ userId, amount }) {
  if (!userId) throw new Error("User ID is required");

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 520) {
    throw new Error("Minimum recharge amount is ₹520");
  }

  const roundedAmount = Math.round(numericAmount * 100) / 100;
  const orderId = `MG${Date.now()}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

  const payment = await Payment.create({
    userId,
    amount: roundedAmount,
    orderId,
    status: "PENDING",
    method: "ONLINE",
    gateway: "WATCHPAY",
  });

  try {
    const baseUrl = requireConfig("WATCHPAY_BASE_URL").replace(/\/$/, "");
    const apiUrl = `${baseUrl}${WATCHPAY_PAY_PATH.startsWith("/") ? WATCHPAY_PAY_PATH : `/${WATCHPAY_PAY_PATH}`}`;
    const params = buildPaymentParams({ orderId, amount: roundedAmount });

    const body = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) body.set(key, String(value));

    console.log("[WATCHPAY] creating order", {
      orderId,
      amount: roundedAmount,
      apiUrl,
      mchId: process.env.WATCHPAY_MCH_ID,
      payType: WATCHPAY_PAY_TYPE,
      version: params.version,
      notifyUrl: params.notify_url,
      pageUrl: params.page_url || null,
      signedFields: Object.keys(params).filter((k) => k !== "sign"),
    });

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "text/html,application/json,text/plain,*/*",
      },
      body: body.toString(),
      redirect: "follow",
    });

    const text = await response.text();
    const contentType = String(response.headers.get("content-type") || "").toLowerCase();

    if (!response.ok) {
      throw new Error(`WatchPay returned HTTP ${response.status}: ${text.slice(0, 300)}`);
    }

    let payUrl = findUrl(text);
    let paymentHtml = null;
    let providerData = null;

    // Parse JSON even if the gateway forgets to set application/json.
    // This is important because WatchPay's JSON mode is enabled by version=1.0.
    try {
      const parsed = JSON.parse(text.replace(/^\uFEFF/, ""));
      providerData = parsed;
      payUrl = extractPaymentUrl(parsed);
    } catch (_) {
      // Fall through to text/HTML handling.
    }

    if (!payUrl && /<html|<!doctype/i.test(text)) {
      paymentHtml = injectBaseIntoHtml(text, baseUrl);
    }

    if (!payUrl && response.url && response.url !== apiUrl && /^https?:\/\//i.test(response.url)) {
      // WatchPay may redirect the POST directly to its payment page.
      payUrl = response.url;
    }

    if (!payUrl && !paymentHtml) {
      // Some gateways return a plain URL or a small redirect document.
      payUrl = extractPaymentUrl(text.trim());
    }

    if (!payUrl && !paymentHtml) {
      throw new Error(`WatchPay response did not contain a payment URL/page: ${text.slice(0, 500)}`);
    }

    payment.payUrl = typeof payUrl === "string" ? payUrl : null;
    const platformOrderId = providerData?.data?.platform_order_id
      || providerData?.data?.platformOrderId
      || providerData?.platform_order_id
      || providerData?.platformOrderId
      || null;
    payment.platformOrderId = platformOrderId ? String(platformOrderId) : null;
    payment.webhookData = {
      providerResponse: providerData || (paymentHtml ? "HTML_PAYMENT_PAGE" : text.slice(0, 2000)),
      createdAt: new Date(),
    };
    await payment.save();

    await Recharge.updateOne(
      { orderNo: orderId },
      {
        $setOnInsert: {
          user: userId,
          amount: roundedAmount,
          paymentMethod: "WATCHPAY",
          orderNo: orderId,
          status: "Pending",
        },
      },
      { upsert: true }
    );

    return {
      orderId,
      paymentRecordId: payment._id,
      amount: roundedAmount,
      payUrl: typeof payUrl === "string" ? payUrl : null,
      paymentHtml,
      gateway: "WATCHPAY",
    };
  } catch (error) {
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        status: "FAILED",
        webhookData: { error: error.message, failedAt: new Date() },
      },
    }).catch(() => {});
    throw error;
  }
}

module.exports = {
  createPaymentOrder,
  makeSign,
};
