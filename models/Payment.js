const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // Tumhare system ka unique order ID
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    // WatchPay platform order ID
    platformOrderId: {
      type: String,
      default: null,
    },

    // WatchPay payment page/link
    payUrl: {
      type: String,
      default: null,
    },

    // Provider payment/transfer ID, when supplied
    paymentId: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    method: {
      type: String,
      default: "ONLINE",
    },

    gateway: {
      type: String,
      default: "WATCHPAY",
    },

    // Webhook se related data
    webhookData: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);