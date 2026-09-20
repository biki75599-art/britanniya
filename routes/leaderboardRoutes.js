"use strict";

const express = require("express");

const router = express.Router();

const leaderboardController =
    require("../controllers/leaderboardController");


// =====================================================
// GET LEADERBOARD
// =====================================================
//
// Frontend:
// /api/leaderboard?period=today
//
// /api/leaderboard?period=yesterday
// /api/leaderboard?period=thisweek
// /api/leaderboard?period=lastweek
// /api/leaderboard?period=month
//
// =====================================================

router.get(
    "/",
    leaderboardController.getLeaderboard
);


module.exports = router;