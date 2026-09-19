const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {

    buyProduct,

    claimDailyIncome,

    getMyDevices,

    getIncomeHistory,

    getPurchaseCount

} = require("../controllers/productController");

router.post("/buy", authMiddleware, buyProduct);

router.post("/claim-income", authMiddleware, claimDailyIncome);
router.get("/device", authMiddleware, getMyDevices);

router.get("/income-history", authMiddleware, getIncomeHistory);
router.get("/purchase-count", authMiddleware, getPurchaseCount);

module.exports = router;