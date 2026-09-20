const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminAuth = require("../middleware/adminAuth");

const {
    createRecharge,
    approveRecharge,
    getRechargeHistory,
    getPendingRecharge
} = require("../controllers/rechargeController");

// ==============================
// User Routes
// ==============================

// Create Recharge Request
router.post("/create", authMiddleware, createRecharge);

// Recharge History
router.get("/history", authMiddleware, getRechargeHistory);

// ==============================
// Admin Routes
// ==============================

// Pending Recharge List
router.get("/pending", adminAuth, getPendingRecharge);

// Approve Recharge
router.put("/approve/:id", adminAuth, approveRecharge);

module.exports = router;