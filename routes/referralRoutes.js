const express = require("express");

const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
    getMyTeam,
    getReferralHistory,
    teamStats,
    getIncomeHistory,
    dashboard
} = require("../controllers/referralController");
router.get(

    "/team",

    auth,

    getMyTeam

);
router.get(

    "/history",

    auth,

    getReferralHistory

);

router.get(

    "/stats",

    auth,

    teamStats

);

router.get(
    "/income",
    auth,
    getIncomeHistory
);
router.get("/dashboard", auth, dashboard);

module.exports = router;