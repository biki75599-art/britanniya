const mongoose = require("mongoose");

const paymentSettingSchema = new mongoose.Schema({

    accountName:{
        type:String,
        required:true
    },

    upiId:{
        type:String,
        required:true
    },

    qrImage:{
        type:String,
        required:true
    },

    minAmount:{
        type:Number,
        required:true
    },

    maxAmount:{
        type:Number,
        required:true
    },

    active:{
        type:Boolean,
        default:true
    }

},{
    timestamps:true
});

module.exports=mongoose.model(
    "PaymentSetting",
    paymentSettingSchema
);