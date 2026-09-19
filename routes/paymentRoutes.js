const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createPayment,
  paymentWebhook,
  getPaymentStatus,
} = require("../controllers/paymentController");

// User creates a WatchPay payment.
router.post("/create", authMiddleware, createPayment);

// WatchPay calls this directly. Do NOT put authMiddleware here.
router.post("/webhook", paymentWebhook);

// User checks the status of their own payment.
router.get("/status/:orderId", authMiddleware, getPaymentStatus);

// Browser/GET diagnostic only. It never credits a payment.
router.get("/webhook", (req, res) => {
  const base = String(process.env.PUBLIC_BASE_URL || "").trim().replace(/\/$/, "");
  const configured = String(process.env.WATCHPAY_NOTIFY_URL || "").trim();
  res.status(200).json({
    success: true,
    method: "POST",
    webhookPath: "/api/payment-gateway/webhook",
    configuredNotifyUrl: configured || (base ? `${base}/api/payment-gateway/webhook` : null),
    merchantId: String(process.env.WATCHPAY_MCH_ID || "").trim() || null,
    message: "WatchPay webhook endpoint is reachable. Provider must send a POST callback.",
  });
});

module.exports = router;
