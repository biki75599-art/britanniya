const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const rechargeController = require("../controllers/rechargeController");
const withdrawController = require("../controllers/withdrawController");

const adminAuth = require("../middleware/adminAuth");

// ==========================================
// ADMIN LOGIN
// ==========================================
router.post(
  "/login",
  adminController.loginAdmin
);

// ==========================================
// DASHBOARD
// ==========================================
router.get(
  "/dashboard",
  adminAuth,
  adminController.dashboard
);

// ==========================================
// RECHARGE
// ==========================================

// Pending Recharge
router.get(
  "/pending-recharge",
  adminAuth,
  adminController.getPendingRecharge
);

// Approve Recharge
// IMPORTANT: rechargeController use karo
// taaki rechargeService ka same logic chale
router.post(
  "/recharge/approve/:id",
  adminAuth,
  rechargeController.approveRecharge
);

// Reject Recharge
router.post(
  "/recharge/reject/:id",
  adminAuth,
  adminController.rejectRecharge
);

// ==========================================
// WITHDRAW
// ==========================================

// Pending Withdraw
router.get(
  "/pending-withdraw",
  adminAuth,
  withdrawController.getPendingWithdraw
);

// Approve Withdraw
// Balance already request time par deduct ho chuka hai
router.post(
  "/withdraw/approve/:id",
  adminAuth,
  withdrawController.approveWithdraw
);

// Reject Withdraw
// Pending request ka balance refund hoga
router.post(
  "/withdraw/reject/:id",
  adminAuth,
  withdrawController.rejectWithdraw
);

// ==========================================
// USERS
// ==========================================

router.get(
  "/users",
  adminAuth,
  adminController.getAllUsers
);

router.get(
  "/user/:id",
  adminAuth,
  adminController.getUserDetails
);

router.put(
  "/user/add-balance/:id",
  adminAuth,
  adminController.addBalance
);

router.put(
  "/user/deduct-balance/:id",
  adminAuth,
  adminController.deductBalance
);

router.put(
  "/user/change-vip/:id",
  adminAuth,
  adminController.changeVIP
);

router.put(
  "/user/block/:id",
  adminAuth,
  adminController.blockUser
);

router.put(
  "/user/unblock/:id",
  adminAuth,
  adminController.unblockUser
);

// ==========================================
// REPORTS
// ==========================================

router.get(
  "/reports/recharge",
  adminAuth,
  adminController.rechargeReport
);

router.get(
  "/reports/withdraw",
  adminAuth,
  adminController.withdrawReport
);

module.exports = router;