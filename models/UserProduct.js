const mongoose = require("mongoose");

const userProductSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        productName: {
            type: String,
            default: ""
        },

        amount: {
            type: Number,
            default: 0
        },

        dailyIncome: {
            type: Number,
            default: 0
        },

        totalDays: {
            type: Number,
            default: 100
        },

        earnedDays: {
            type: Number,
            default: 0
        },

        purchaseDate: {
            type: Date,
            default: Date.now
        },

        lastIncomeAt: {
            type: Date,
            default: null
        },

        nextIncomeAt: {
            type: Date,
            default: null
        },

        totalEarned: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            enum: ["Running", "Completed"],
            default: "Running"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("UserProduct", userProductSchema);