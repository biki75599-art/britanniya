const crypto = require("crypto");
const Payment = require("../models/Payment");
const Recharge = require("../models/Recharge");
const { createPaymentOrder, makeSign } = require("../services/paymentService");
const { approveRechargeInternal } = require("../services/rechargeService");

const createPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const rechargeAmount = Number(req.body.amount);

    if (!Number.isFinite(rechargeAmount) || rechargeAmount < 520) {
      return res.status(400).json({
        success: false,
        message: "Minimum recharge amount is ₹520",
      });
    }

    const result = await createPaymentOrder({ userId, amount: rechargeAmount });

    return res.status(201).json({
      success: true,
      message: "WatchPay payment created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create WatchPay Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Payment creation failed",
    });
  }
};

function isSuccessfulTradeResult(value) {
  const configured = String(process.env.WATCHPAY_SUCCESS_RESULTS || "1,success,SUCCESS,SUCCESSFUL")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return configured.includes(String(value || "").trim().toLowerCase());
}

// WatchPay callback: application/x-www-form-urlencoded.
// Signature fields are the exact callback fields from the supplied WatchPay JSP sample.
const paymentWebhook = async (req, res) => {
  // WatchPay documents this callback as POST form data. Express also accepts JSON
  // because some provider environments send JSON despite the documentation.
  try {
    let body = req.body;

    // WatchPay documents application/x-www-form-urlencoded callbacks, but some
    // gateways/proxies send the same payload as text/plain. Normalize both.
    if (typeof body === "string") {
      const parsed = new URLSearchParams(body);
      body = Object.fromEntries(parsed.entries());
    } else if (!body || typeof body !== "object" || Array.isArray(body)) {
      body = {};
    }

    const tradeResult = String(body.tradeResult || "").trim();
    const mchId = String(body.mchId || body.mch_id || "").trim();
    const mchOrderNo = String(body.mchOrderNo || body.mch_order_no || "").trim();
    const sign = String(body.sign || "").trim();
    const signType = String(body.signType || body.sign_type || "").trim();

    const expectedMchId = String(process.env.WATCHPAY_MCH_ID || "").trim();
    const key = String(process.env.WATCHPAY_KEY || "").trim();

    console.log("[WATCHPAY WEBHOOK] received", {
      contentType: req.headers["content-type"] || "",
      tradeResult,
      mchId,
      mchOrderNo,
      signType,
      fields: Object.keys(body),
    });

    if (!expectedMchId || !key) return res.status(500).send("CONFIG_ERROR");
    if (!mchOrderNo || !sign || !mchId || !signType) return res.status(400).send("INVALID_REQUEST");
    if (mchId !== expectedMchId) return res.status(403).send("INVALID_MERCHANT");
    if (signType.toUpperCase() !== "MD5") return res.status(400).send("INVALID_SIGN_TYPE");

    // WatchPay's documented callback signature uses the callback parameter names,
    // ASCII-sorted, excluding sign/signType. merRetMsg is only signed when it was
    // supplied during order creation. Try both documented variants so callbacks
    // remain compatible with provider implementations that include merRetMsg.
    const signatureCandidates = [];
    signatureCandidates.push(makeSign(body, key));
    if (Object.prototype.hasOwnProperty.call(body, "merRetMsg")) {
      const withoutMerRetMsg = { ...body };
      delete withoutMerRetMsg.merRetMsg;
      signatureCandidates.push(makeSign(withoutMerRetMsg, key));
    }

    const signatureValid = signatureCandidates.some((candidate) => {
      const left = Buffer.from(candidate.toLowerCase(), "utf8");
      const right = Buffer.from(sign.toLowerCase(), "utf8");
      return left.length === right.length && crypto.timingSafeEqual(left, right);
    });

    if (!signatureValid) {
      console.warn("[WATCHPAY WEBHOOK] signature mismatch", {
        mchOrderNo,
        tradeResult,
        amount: body.amount ?? null,
        oriAmount: body.oriAmount ?? body.originalAmount ?? null,
        fieldNames: Object.keys(body),
      });
      return res.status(400).send("Signature Error");
    }

    if (!isSuccessfulTradeResult(tradeResult)) {
      console.log("[WATCHPAY WEBHOOK] non-success callback", { mchOrderNo, tradeResult });
      // The provider can retry abnormal notifications; acknowledge the callback
      // after signature verification so it does not get stuck in a retry loop.
      return res.status(200).send("success");
    }

    const payment = await Payment.findOne({ orderId: mchOrderNo });
    if (!payment) return res.status(404).send("PAYMENT_NOT_FOUND");

    // Verify BOTH original and actual transaction amount when the provider sends them.
    // Never credit a different amount from the amount stored for this order.
    const originalAmountRaw = String(
      body.oriAmount ?? body.originalAmount ?? ""
    ).trim();
    const actualAmountRaw = String(body.amount ?? "").trim();
    const originalAmount = originalAmountRaw === "" ? null : Number(originalAmountRaw);
    const actualAmount = actualAmountRaw === "" ? null : Number(actualAmountRaw);

    if (
      (originalAmount !== null && !Number.isFinite(originalAmount)) ||
      (actualAmount !== null && !Number.isFinite(actualAmount))
    ) {
      return res.status(400).send("INVALID_AMOUNT");
    }

    const callbackAmount = actualAmount ?? originalAmount;
    if (!Number.isFinite(callbackAmount) || callbackAmount <= 0) {
      return res.status(400).send("INVALID_AMOUNT");
    }

    if (Number(payment.amount) !== callbackAmount) {
      console.warn("[WATCHPAY WEBHOOK] actual amount mismatch", {
        mchOrderNo,
        expected: payment.amount,
        received: callbackAmount,
      });
      return res.status(400).send("INVALID_AMOUNT");
    }

    if (originalAmount !== null && Number(payment.amount) !== originalAmount) {
      console.warn("[WATCHPAY WEBHOOK] original amount mismatch", {
        mchOrderNo,
        expected: payment.amount,
        received: originalAmount,
      });
      return res.status(400).send("INVALID_AMOUNT");
    }

    if (payment.status === "SUCCESS") return res.status(200).send("success");

    let recharge = await Recharge.findOneAndUpdate(
      { orderNo: mchOrderNo },
      {
        $setOnInsert: {
          user: payment.userId,
          amount: payment.amount,
          paymentMethod: "WATCHPAY",
          orderNo: mchOrderNo,
          status: "Pending",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    if (recharge.status === "Pending") {
      await approveRechargeInternal(recharge);
    }

    recharge = await Recharge.findById(recharge._id);
    if (!recharge || recharge.status !== "Approved") {
      throw new Error("Recharge was not approved");
    }

    await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: "SUCCESS" } },
      {
        $set: {
          status: "SUCCESS",
          paymentId: String(body.orderNo || "").trim() || null,
          webhookData: {
            ...body,
            receivedAt: new Date(),
          },
        },
      }
    );

    console.log("[WATCHPAY WEBHOOK] payment credited successfully", {
      mchOrderNo,
      amount: payment.amount,
      platformOrderNo: String(body.orderNo || "").trim() || null,
    });
    return res.status(200).send("success");
  } catch (error) {
    console.error("[WATCHPAY WEBHOOK] processing error:", error);
    return res.status(500).send("SERVER_ERROR");
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId, userId: req.user.id });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    return res.json({ success: true, data: payment });
  } catch (error) {
    console.error("Payment Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get payment status" });
  }
};

module.exports = { createPayment, paymentWebhook, getPaymentStatus };
