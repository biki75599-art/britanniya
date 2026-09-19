const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");

const {
  createWithdraw,
  getWithdrawHistory,
  getPendingWithdraw,
  approveWithdraw,
  rejectWithdraw,
} = require("../controllers/withdrawController");

// ==========================================
// USER
// ==========================================

router.post(
  "/create",
  authMiddleware,
  createWithdraw
);

router.get(
  "/history",
  authMiddleware,
  getWithdrawHistory
);


// ==========================================
// ADMIN
// ==========================================

router.get(
  "/pending",
  adminAuth,
  getPendingWithdraw
);

router.put(
  "/approve/:id",
  adminAuth,
  approveWithdraw
);

router.put(
  "/reject/:id",
  adminAuth,
  rejectWithdraw
);

module.exports = router;