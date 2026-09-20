const crypto = require("crypto");

const Payment = require("../models/Payment");
const Recharge = require("../models/Recharge");

function requireConfig(name) {
  const value = String(process.env[name] || "").trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

const WATCHPAY_PAY_PATH =
  process.env.WATCHPAY_PAY_PATH || "/pay/web";

const WATCHPAY_SIGN_TYPE =
  process.env.WATCHPAY_SIGN_TYPE || "MD5";

const WATCHPAY_PAY_TYPE =
  process.env.WATCHPAY_PAY_TYPE || "101";

function publicBaseUrl() {
  return String(process.env.PUBLIC_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");
}

function buildNotifyUrl() {
  const explicit =
    String(process.env.WATCHPAY_NOTIFY_URL || "").trim();

  if (explicit) return explicit;

  const base = publicBaseUrl();

  if (!base) {
    throw new Error(
      "PUBLIC_BASE_URL or WATCHPAY_NOTIFY_URL is required"
    );
  }

  return `${base}/api/payment-gateway/webhook`;
}

function buildReturnUrl() {
  const explicit =
    String(process.env.WATCHPAY_RETURN_URL || "").trim();

  if (explicit) return explicit;

  const base = publicBaseUrl();

  return base
    ? `${base}/payment-success.html`
    : "";
}


// ========================================
// WATCHPAY SIGN
// ========================================

function makeSign(params, key) {
  const entries = Object.entries(params)
    .filter(([name, value]) => {
      const lowerName =
        String(name).toLowerCase();

      return (
        lowerName !== "sign" &&
        lowerName !== "sign_type" &&
        lowerName !== "signtype" &&
        value !== undefined &&
        value !== null &&
        String(value) !== ""
      );
    })
    .sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0
    );

  const signSource = entries
    .map(
      ([name, value]) =>
        `${name}=${String(value)}`
    )
    .join("&");

  const sourceWithKey =
    `${signSource}&key=${key}`;

  return crypto
    .createHash("md5")
    .update(sourceWithKey, "utf8")
    .digest("hex");
}


// ========================================
// PAYMENT PARAMETERS
// ========================================

function buildPaymentParams({
  orderId,
  amount,
}) {
  const mchId =
    requireConfig("WATCHPAY_MCH_ID");

  const key =
    requireConfig("WATCHPAY_KEY");

  const notifyUrl =
    buildNotifyUrl();

  const returnUrl =
    buildReturnUrl();

  const params = {
    mch_id: mchId,

    mch_order_no: orderId,

    notify_url: notifyUrl,

    order_date:
      formatOrderDate(new Date()),

    pay_type:
      WATCHPAY_PAY_TYPE,

    trade_amount:
      Number.isInteger(amount)
        ? String(amount)
        : String(amount.toFixed(2)),

    goods_name:
      process.env.WATCHPAY_GOODS_NAME ||
      "MyGame Recharge",
  };

  const pageUrl =
    String(
      process.env.WATCHPAY_PAGE_URL || ""
    ).trim();

  const returnMsg =
    String(
      process.env.WATCHPAY_RETURN_MSG || ""
    ).trim();

  if (pageUrl) {
    params.page_url = pageUrl;
  }

  if (returnMsg) {
    params.mch_return_msg = returnMsg;
  }

  params.version = "1.0";

  params.sign_type =
    WATCHPAY_SIGN_TYPE;

  void returnUrl;

  params.sign =
    makeSign(params, key);

  return params;
}


// ========================================
// DATE
// ========================================

function formatOrderDate(date) {
  const pad = (n) =>
    String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-` +
    `${pad(date.getMonth() + 1)}-` +
    `${pad(date.getDate())} ` +
    `${pad(date.getHours())}:` +
    `${pad(date.getMinutes())}:` +
    `${pad(date.getSeconds())}`
  );
}


// ========================================
// FIND URL
// ========================================

function findUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const matches =
    value.match(
      /https?:\/\/[^\s"'<>]+/gi
    ) || [];

  for (const raw of matches) {
    const url =
      raw.replace(/[),.;]+$/g, "");

    // Ignore HTML/W3.org doctype/reference URL
    if (
      /^https?:\/\/www\.w3\.org\//i.test(
        url
      )
    ) {
      continue;
    }

    return url;
  }

  return null;
}


// ========================================
// EXTRACT PAYMENT URL
// ========================================

function extractPaymentUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed =
      value.trim();

    if (
      /^https?:\/\//i.test(
        trimmed
      )
    ) {
      if (
        /^https?:\/\/www\.w3\.org\//i.test(
          trimmed
        )
      ) {
        return null;
      }

      return trimmed;
    }

    return findUrl(trimmed);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found =
        extractPaymentUrl(item);

      if (found) {
        return found;
      }
    }

    return null;
  }

  if (typeof value === "object") {
    const preferredKeys = [
      "payInfo",
      "payUrl",
      "pay_url",
      "payment_url",
      "paymentUrl",
      "url",
      "redirectUrl",
      "redirect_url",
    ];

    for (const key of preferredKeys) {
      if (
        Object.prototype.hasOwnProperty.call(
          value,
          key
        )
      ) {
        const found =
          extractPaymentUrl(
            value[key]
          );

        if (found) {
          return found;
        }
      }
    }

    for (
      const [key, child]
      of Object.entries(value)
    ) {
      if (
        preferredKeys.includes(key)
      ) {
        continue;
      }

      const found =
        extractPaymentUrl(child);

      if (found) {
        return found;
      }
    }
  }

  return null;
}


// ========================================
// INJECT BASE URL INTO HTML
// ========================================

function injectBaseIntoHtml(
  html,
  baseUrl
) {
  if (
    !baseUrl ||
    !/<html[\s>]/i.test(html)
  ) {
    return html;
  }

  if (
    /<base[\s>]/i.test(html)
  ) {
    return html;
  }

  return html.replace(
    /<head([^>]*)>/i,
    `<head$1><base href="${baseUrl.replace(
      /"/g,
      "&quot;"
    )}/">`
  );
}


// ========================================
// CREATE PAYMENT ORDER
// ========================================

async function createPaymentOrder({
  userId,
  amount,
}) {
  if (!userId) {
    throw new Error(
      "User ID is required"
    );
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount < 520
  ) {
    throw new Error(
      "Minimum recharge amount is ₹520"
    );
  }

  const roundedAmount =
    Math.round(
      numericAmount * 100
    ) / 100;

  const orderId =
    `MG${Date.now()}${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

  const payment =
    await Payment.create({
      userId,
      amount: roundedAmount,
      orderId,
      status: "PENDING",
      method: "ONLINE",
      gateway: "WATCHPAY",
    });

  try {
    const baseUrl =
      requireConfig(
        "WATCHPAY_BASE_URL"
      ).replace(/\/$/, "");

    const apiUrl =
      `${baseUrl}${
        WATCHPAY_PAY_PATH.startsWith("/")
          ? WATCHPAY_PAY_PATH
          : `/${WATCHPAY_PAY_PATH}`
      }`;

    const params =
      buildPaymentParams({
        orderId,
        amount: roundedAmount,
      });

    const body =
      new URLSearchParams();

    for (
      const [key, value]
      of Object.entries(params)
    ) {
      body.set(
        key,
        String(value)
      );
    }

    console.log(
      "[WATCHPAY] creating order",
      {
        orderId,
        amount: roundedAmount,
        apiUrl,
        mchId:
          process.env.WATCHPAY_MCH_ID,
        payType:
          WATCHPAY_PAY_TYPE,
        version:
          params.version,
        notifyUrl:
          params.notify_url,
        pageUrl:
          params.page_url || null,
        signedFields:
          Object.keys(params)
            .filter(
              (k) => k !== "sign"
            ),
      }
    );

    const response =
      await fetch(apiUrl, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Accept:
            "text/html,application/json,text/plain,*/*",
        },

        body:
          body.toString(),

        redirect: "follow",
      });

    const text =
      await response.text();

    if (!response.ok) {
      throw new Error(
        `WatchPay returned HTTP ${response.status}: ${text.slice(
          0,
          300
        )}`
      );
    }


    // ====================================
    // IMPORTANT:
    // Don't detect W3.org URL from HTML first.
    // ====================================

    let payUrl = null;

    let paymentHtml = null;

    let providerData = null;


    // ====================================
    // TRY JSON RESPONSE
    // ====================================

    try {
      const parsed =
        JSON.parse(
          text.replace(
            /^\uFEFF/,
            ""
          )
        );

      providerData =
        parsed;

      payUrl =
        extractPaymentUrl(
          parsed
        );
    } catch (_) {
      // Not JSON.
    }


    // ====================================
    // HTML PAYMENT PAGE
    // ====================================

    if (
      !payUrl &&
      /<html|<!doctype/i.test(
        text
      )
    ) {
      paymentHtml =
        injectBaseIntoHtml(
          text,
          baseUrl
        );
    }


    // ====================================
    // REDIRECT URL
    // ====================================

    if (
      !payUrl &&
      response.url &&
      response.url !== apiUrl &&
      /^https?:\/\//i.test(
        response.url
      ) &&
      !/^https?:\/\/www\.w3\.org\//i.test(
        response.url
      )
    ) {
      payUrl =
        response.url;
    }


    // ====================================
    // PLAIN URL / TEXT RESPONSE
    // ====================================

    if (
      !payUrl &&
      !paymentHtml
    ) {
      payUrl =
        extractPaymentUrl(
          text.trim()
        );
    }


    // ====================================
    // NOTHING FOUND
    // ====================================

    if (
      !payUrl &&
      !paymentHtml
    ) {
      throw new Error(
        `WatchPay response did not contain a payment URL/page: ${text.slice(
          0,
          500
        )}`
      );
    }


    // ====================================
    // SAVE PAYMENT
    // ====================================

    payment.payUrl =
      typeof payUrl === "string"
        ? payUrl
        : null;

    const platformOrderId =
      providerData?.data
        ?.platform_order_id ||
      providerData?.data
        ?.platformOrderId ||
      providerData
        ?.platform_order_id ||
      providerData
        ?.platformOrderId ||
      null;

    payment.platformOrderId =
      platformOrderId
        ? String(
            platformOrderId
          )
        : null;

    payment.webhookData = {
      providerResponse:
        providerData ||
        (
          paymentHtml
            ? "HTML_PAYMENT_PAGE"
            : text.slice(
                0,
                2000
              )
        ),

      createdAt:
        new Date(),
    };

    await payment.save();


    // ====================================
    // CREATE RECHARGE
    // ====================================

    await Recharge.updateOne(
      {
        orderNo: orderId,
      },
      {
        $setOnInsert: {
          user: userId,
          amount:
            roundedAmount,
          paymentMethod:
            "WATCHPAY",
          orderNo:
            orderId,
          status:
            "Pending",
        },
      },
      {
        upsert: true,
      }
    );


    // ====================================
    // RETURN
    // ====================================

    return {
      orderId,

      paymentRecordId:
        payment._id,

      amount:
        roundedAmount,

      payUrl:
        typeof payUrl === "string"
          ? payUrl
          : null,

      paymentHtml,

      gateway:
        "WATCHPAY",
    };

  } catch (error) {

    await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          status: "FAILED",

          webhookData: {
            error:
              error.message,

            failedAt:
              new Date(),
          },
        },
      }
    ).catch(() => {});

    throw error;
  }
}


module.exports = {
  createPaymentOrder,
  makeSign,
};