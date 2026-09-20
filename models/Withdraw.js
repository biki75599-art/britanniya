const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================
    // WITHDRAW AMOUNT
    // ==========================================
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    // ==========================================
    // UNIQUE WITHDRAW ORDER
    // ==========================================
    orderNo: {
      type: String,
      required: true,
      unique: true,
    },

    // ==========================================
    // BANK DETAILS SNAPSHOT
    // ==========================================
    bankName: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    ifsc: {
      type: String,
      required: true,
    },

    holderName: {
      type: String,
      required: true,
    },

    // ==========================================
    // WITHDRAW STATUS
    // ==========================================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // ==========================================
    // ADMIN APPROVAL
    // ==========================================
    approvedAt: {
      type: Date,
      default: null,
    },

    // ==========================================
    // ADMIN REJECTION
    // ==========================================
    rejectReason: {
      type: String,
      default: "",
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Withdraw", withdrawSchema);