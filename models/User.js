const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
  

    mobile: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    inviteCode: {
        type: String,
        unique: true
    },

    referredBy: {
        type: String,
        default: ""
    },
    parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
},

children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}],

level1Count: {
    type: Number,
    default: 0
},

level2Count: {
    type: Number,
    default: 0
},


level3Count: {
    type: Number,
    default: 0
},

referralIncome: {
    type: Number,
    default: 0
},

directIncome: {
    type: Number,
    default: 0
},

teamIncome: {
    type: Number,
    default: 0
},
productIncome: {
    type: Number,
    default: 0
},

productStatus: {
    type: String,
    default: "Inactive"
},

productPrice: {
    type: Number,
    default: 0
},

productDailyIncome: {
    type: Number,
    default: 0
},

productPurchaseDate: {
    type: Date,
    default: null
},

    balance: {
        type: Number,
        default: 0
    },

    rechargeBalance: {
    type: Number,
    default: 0
},

    totalIncome: {
        type: Number,
        default: 0
    },

    ttodayIncome: {
    type: Number,
    default: 0
},

todayReferralIncome: {
    type: Number,
    default: 0
},

referralIncomeResetDate: {
    type: Date,
    default: null
},

totalReferralIncome: {
    type: Number,
    default: 0
},
    
vipLevel: {
        type: Number,
        default: 0
    },

    totalTeam: {
        type: Number,
        default: 0
    },

    totalRecharge: {
        type: Number,
        default: 0
    },

    totalWithdraw: {
        type: Number,
        default: 0
    },

    activeProduct: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        default: "active"
    },
    bankName: {
    type: String,
    default: ""
},

accountNumber: {
    type: String,
    default: ""
},

ifsc: {
    type: String,
    default: ""
},

holderName: {
    type: String,
    default: ""
},
withdrawPin: {
    type: String,
    default: ""
},

withdrawPinCreated: {
    type: Boolean,
    default: false
},
isBlocked: {
    type: Boolean,
    default: false
}

},
{
    timestamps: true
});
userSchema.set("toJSON", {
    transform: function (doc, ret) {

        delete ret.password;
        delete ret.withdrawPin;

        return ret;

    }
});


module.exports = mongoose.models.User || mongoose.model("User", userSchema, "users");