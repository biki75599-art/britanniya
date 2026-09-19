const mongoose = require("mongoose");

const leaderboardSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    mobile: {
        type: String,
        required: true
    },

    totalRecharge: {
        type: Number,
        default: 0
    },

    reward: {
        type: Number,
        default: 0
    },

    rank: {
        type: Number,
        default: 0
    },

    period: {
        type: String,
        enum: [
            "today",
            "yesterday",
            "thisweek",
            "lastweek",
            "month"
        ],
        default: "today"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Leaderboard", leaderboardSchema);