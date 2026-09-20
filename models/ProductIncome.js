const mongoose = require("mongoose");

const productIncomeSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        userProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserProduct",
            required: true
        },

        product: {
            type: String,
            default: ""
        },

        amount: {
            type: Number,
            default: 0
        },

        day: {
            type: Number,
            default: 1
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ProductIncome", productIncomeSchema);