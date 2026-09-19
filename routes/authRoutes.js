const express = require("express");

const router = express.Router();

const {
    register,
    login,
    resetLoginPassword,
    resetWithdrawPassword
} = require("../controllers/authController");


router.post(
    "/register",
    register
);

router.post(
    "/login",
    login
);

router.post(
    "/reset-login-password",
    resetLoginPassword
);

router.post(
    "/reset-withdraw-password",
    resetWithdrawPassword
);


module.exports = router;