const mongoose = require("mongoose");

const referralIncomeSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    fromUser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    level:{
        type:Number,
        required:true
    },

    amount:{
        type:Number,
        required:true
    },

    type:{
        type:String,
        default:"Referral"
    }

},{
    timestamps:true
});

module.exports = mongoose.model(
    "ReferralIncome",
    referralIncomeSchema
);