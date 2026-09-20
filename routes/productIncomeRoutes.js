const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
    getProductIncomeHistory
} = require("../controllers/productIncomeController");

router.get(
    "/history",
    auth,
    getProductIncomeHistory
);

module.exports = router;