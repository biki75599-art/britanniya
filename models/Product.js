const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    dailyIncome: {
        type: Number,
        required: true
    },

    totalDays: {
        type: Number,
        default: 100
    },

    vipLevel: {
        type: Number,
        default: 1
    },

    status: {
        type: String,
        default: "active"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);