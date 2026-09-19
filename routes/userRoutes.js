const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {

    profile,
    saveBankDetails,
    getBankDetails,
    setWithdrawPin,
    verifyWithdrawPin

} = require("../controllers/userController");

router.get("/profile", authMiddleware, profile);

// Bank
router.post("/bank", authMiddleware, saveBankDetails);
router.get("/bank", authMiddleware, getBankDetails);

// Withdraw PIN
router.post("/set-withdraw-pin", authMiddleware, setWithdrawPin);
router.post("/verify-withdraw-pin", authMiddleware, verifyWithdrawPin);

module.exports = router;