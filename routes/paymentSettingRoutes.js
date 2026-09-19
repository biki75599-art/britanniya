const express = require("express");

const router = express.Router();

const upload = require("../models/upload");

const adminAuth = require("../middleware/adminAuth");

const {

    getPaymentSetting,

    createPaymentSetting,

    getAllPaymentSettings,

    updatePaymentSetting,

    deletePaymentSetting

} = require("../controllers/paymentSettingController");

// ================= USER =================

router.get("/", getPaymentSetting);

// ================= ADMIN =================

router.post(

    "/",

    adminAuth,

    upload.single("qrImage"),

    createPaymentSetting

);

router.get(

    "/all",

    adminAuth,

    getAllPaymentSettings

);

router.put(

    "/:id",

    adminAuth,

    upload.single("qrImage"),

    updatePaymentSetting

);

router.delete(

    "/:id",

    adminAuth,

    deletePaymentSetting

);

module.exports = router;