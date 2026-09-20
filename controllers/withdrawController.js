const bcrypt = require("bcryptjs");
const Withdraw = require("../models/Withdraw");
const User = require("../models/User");

// ==========================================
// CREATE WITHDRAW REQUEST
// ==========================================
const createWithdraw = async (req, res) => {
  try {
    const { amount, withdrawPin } = req.body;

    const withdrawAmount = Number(amount);

    // ==========================================
    // USER CHECK
    // ==========================================
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    // ==========================================
    // WITHDRAW PIN CHECK
    // ==========================================
    if (!withdrawPin) {
      return res.status(400).json({
        success: false,
        message: "Withdraw PIN Required",
      });
    }

    if (!user.withdrawPin) {
      return res.status(400).json({
        success: false,
        message: "Withdraw PIN Not Set",
      });
    }

    const isPinCorrect = bcrypt.compareSync(
      String(withdrawPin),
      String(user.withdrawPin)
    );

    if (!isPinCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid Withdraw PIN",
      });
    }

    // ==========================================
    // AMOUNT CHECK
    // ==========================================
    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Amount",
      });
    }
    // ==========================================
// MINIMUM WITHDRAW CHECK
// ==========================================
if (withdrawAmount < 200) {
  return res.status(400).json({
    success: false,
    message: "Minimum withdrawal amount is ₹200",
  });
}

    // ==========================================
    // BALANCE CHECK
    // ==========================================
    if (Number(user.balance || 0) < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Balance",
      });
    }

    // ==========================================
    // BANK DETAILS CHECK
    // ==========================================
    if (
      !user.bankName ||
      !user.accountNumber ||
      !user.ifsc ||
      !user.holderName
    ) {
      return res.status(400).json({
        success: false,
        message: "Please Add Bank Details First",
      });
    }

    // ==========================================
    // GENERATE UNIQUE WITHDRAW ORDER
    // ==========================================
    const orderNo =
      "WD" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    // ==========================================
    // RESERVE / DEDUCT BALANCE IMMEDIATELY
    // ==========================================
    user.balance =
      Number(user.balance || 0) - withdrawAmount;

    await user.save();

    // ==========================================
    // CREATE PENDING WITHDRAW
    // ==========================================
    const withdraw = await Withdraw.create({
      user: req.user.id,
      amount: withdrawAmount,
      orderNo,
      bankName: user.bankName,
      accountNumber: user.accountNumber,
      ifsc: user.ifsc,
      holderName: user.holderName,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Withdraw Request Submitted",
      withdraw,
    });

  } catch (err) {
    console.error("Create Withdraw Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// ==========================================
// USER WITHDRAW HISTORY
// ==========================================
const getWithdrawHistory = async (req, res) => {
  try {
    const history = await Withdraw.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      history,
    });

  } catch (err) {
    console.error("Withdraw History Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// ==========================================
// ADMIN PENDING WITHDRAW
// ==========================================
const getPendingWithdraw = async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      status: "Pending",
    })
      .populate("user", "name mobile")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      withdraws,
    });

  } catch (err) {
    console.error("Pending Withdraw Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// ==========================================
// ADMIN APPROVE WITHDRAW
// Balance already deducted at request time
// ==========================================
const approveWithdraw = async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw Not Found",
      });
    }

    // Already processed check
    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Already Processed",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================
    const user = await User.findById(withdraw.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    // ==========================================
    // UPDATE TOTAL WITHDRAW
    // Balance was already deducted when request
    // was created, so DO NOT deduct balance again.
    // ==========================================
    user.totalWithdraw =
      Number(user.totalWithdraw || 0) +
      Number(withdraw.amount);

    await user.save();

    // ==========================================
    // APPROVE WITHDRAW
    // ==========================================
    withdraw.status = "Approved";
    withdraw.approvedAt = new Date();

    await withdraw.save();

    return res.json({
      success: true,
      message: "Withdraw Approved Successfully",
    });

  } catch (err) {
    console.error("Approve Withdraw Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// ADMIN REJECT WITHDRAW
// Refund reserved balance
// ==========================================
const rejectWithdraw = async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw Not Found",
      });
    }

    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Already Processed",
      });
    }

    const user = await User.findById(withdraw.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Refund reserved balance
    user.balance =
      Number(user.balance || 0) +
      Number(withdraw.amount);

    await user.save();

    withdraw.status = "Rejected";
    withdraw.rejectReason =
      req.body.reason || "Rejected by Admin";
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    return res.json({
      success: true,
      message: "Withdraw Rejected and Balance Refunded",
    });

  } catch (err) {
    console.error("Reject Withdraw Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


module.exports = {
  createWithdraw,
  getWithdrawHistory,
  getPendingWithdraw,
  approveWithdraw,
  rejectWithdraw,
};