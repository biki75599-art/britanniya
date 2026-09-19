const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema({

    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Product",
        default:null
    },

    amount:{
        type:Number,
        required:true
    },

    type:{
        type:String,
        default:"Product Income"
    },

    remark:{
        type:String,
        default:""
    }

},{
    timestamps:true
});

module.exports=mongoose.model("Income",incomeSchema);