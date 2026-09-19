const mongoose = require("mongoose");

const rechargeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // Manual UTR recharge ke liye
    // RS Pay auto-payment mein optional
    utr: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    screenshot: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // Manual aur RS Pay dono recharge ke liye unique order
    orderNo: {
      type: String,
      required: true,
      unique: true,
    },

    paymentMethod: {
      type: String,
      default: "UPI",
    },

    rejectReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Recharge", rechargeSchema);