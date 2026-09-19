const Admin = require("../models/Admin");
const User = require("../models/User");
const Recharge = require("../models/Recharge");
const Withdraw = require("../models/Withdraw");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// ADMIN LOGIN
// ==========================================
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and Password Required",
      });
    }

    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const match = bcrypt.compareSync(password, admin.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      success: true,
      message: "Login Successful",
      token,
    });
  } catch (err) {
    console.error("Admin Login Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// ADMIN DASHBOARD
// ==========================================
exports.dashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const pendingRecharge = await Recharge.countDocuments({
      status: "Pending",
    });

    const pendingWithdraw = await Withdraw.countDocuments({
      status: "Pending",
    });

    const rechargeData = await Recharge.find({
      status: "Approved",
    }).select("amount");

    const withdrawData = await Withdraw.find({
      status: "Approved",
    }).select("amount");

    const totalRecharge = rechargeData.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

    const totalWithdraw = withdrawData.reduce(
      (total, item) => total + Number(item.amount || 0),
      0
    );

    return res.json({
      success: true,
      totalUsers,
      pendingRecharge,
      pendingWithdraw,
      totalRecharge,
      totalWithdraw,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// PENDING RECHARGE
// ==========================================
exports.getPendingRecharge = async (req, res) => {
  try {
    const recharges = await Recharge.find({
      status: "Pending",
    })
      .populate("user", "name mobile")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      recharges,
    });
  } catch (err) {
    console.error("Pending Recharge Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// REJECT RECHARGE
// ==========================================
exports.rejectRecharge = async (req, res) => {
  try {
    const recharge = await Recharge.findById(req.params.id);

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge Not Found",
      });
    }

    if (recharge.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Already Processed",
      });
    }

    recharge.status = "Rejected";

    recharge.rejectReason =
      req.body.reason || "Rejected by Admin";

    recharge.approvedAt = new Date();

    await recharge.save();

    return res.json({
      success: true,
      message: "Recharge Rejected",
    });
  } catch (err) {
    console.error("Reject Recharge Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// GET ALL USERS
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({
        createdAt: -1,
      })
      .select("-password -withdrawPin");

    return res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error("Get All Users Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// GET USER DETAILS
// ==========================================
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password -withdrawPin");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Get User Details Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// ADD BALANCE
// ==========================================
exports.addBalance = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Amount",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    user.balance =
      Number(user.balance || 0) + amount;

    await user.save();

    return res.json({
      success: true,
      message: "Balance Added Successfully",
    });
  } catch (err) {
    console.error("Add Balance Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// DEDUCT BALANCE
// ==========================================
exports.deductBalance = async (req, res) => {
  try {
    const amount = Number(req.body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Amount",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    if (Number(user.balance || 0) < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Balance",
      });
    }

    user.balance =
      Number(user.balance || 0) - amount;

    await user.save();

    return res.json({
      success: true,
      message: "Balance Deducted Successfully",
    });
  } catch (err) {
    console.error("Deduct Balance Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// CHANGE VIP
// ==========================================
exports.changeVIP = async (req, res) => {
  try {
    const vipLevel = Number(req.body.vipLevel);

    if (
      !Number.isInteger(vipLevel) ||
      vipLevel < 0 ||
      vipLevel > 6
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid VIP Level",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    user.vipLevel = vipLevel;

    await user.save();

    return res.json({
      success: true,
      message: "VIP Updated Successfully",
    });
  } catch (err) {
    console.error("Change VIP Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// BLOCK USER
// ==========================================
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    user.isBlocked = true;

    await user.save();

    return res.json({
      success: true,
      message: "User Blocked",
    });
  } catch (err) {
    console.error("Block User Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// UNBLOCK USER
// ==========================================
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    user.isBlocked = false;

    await user.save();

    return res.json({
      success: true,
      message: "User Unblocked",
    });
  } catch (err) {
    console.error("Unblock User Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// RECHARGE REPORT
// ==========================================
exports.rechargeReport = async (req, res) => {
  try {
    const report = await Recharge.find()
      .populate("user", "name mobile")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error("Recharge Report Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ==========================================
// WITHDRAW REPORT
// ==========================================
exports.withdrawReport = async (req, res) => {
  try {
    const report = await Withdraw.find()
      .populate("user", "name mobile")
      .sort({
        createdAt: -1,
      });

    return res.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error("Withdraw Report Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// ==========================================
// APPROVE RECHARGE
// ==========================================
exports.approveRecharge = async (req, res) => {
  try {
    const recharge = await Recharge.findById(req.params.id);

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge Not Found",
      });
    }

    if (recharge.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Recharge Already Processed",
      });
    }

    const user = await User.findById(recharge.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Add recharge amount to user balance
   const amount = Number(recharge.amount || 0);

// Wallet Balance
user.balance = Number(user.balance || 0) + amount;

// Total Income
user.totalIncome = Number(user.totalIncome || 0) + amount;

// Recharge Balance
user.rechargeBalance = Number(user.rechargeBalance || 0) + amount;

// Total Recharge
user.totalRecharge = Number(user.totalRecharge || 0) + amount;

await user.save();

    // Update recharge status
    recharge.status = "Approved";
    recharge.approvedBy = req.user?.id || null;
    recharge.approvedAt = new Date();

    await recharge.save();

    return res.json({
      success: true,
      message: "Recharge Approved Successfully",
    });

  } catch (err) {
    console.error("Approve Recharge Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error",
    });
  }
};
