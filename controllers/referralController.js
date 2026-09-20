const ReferralIncome = require("../models/ReferralIncome");
const User = require("../models/User");

// ===============================
// My Team
// ===============================

exports.getMyTeam = async (req, res) => {

    try{

        const user = await User.findById(req.user.id);

        const level1 = await User.find({
            parent:user._id
        }).select("-password");

        const ids = level1.map(i=>i._id);

        const level2 = await User.find({
            parent:{
                $in:ids
            }
        }).select("-password");

        const ids2 = level2.map(i=>i._id);

        const level3 = await User.find({
            parent:{
                $in:ids2
            }
        }).select("-password");
        const allTeam=[

...level1,

...level2,

...level3

];

let totalRecharge=0;

let totalIncome=0;

let todayJoin=0;

let todayRecharge=0;

let todayCommission=0;

const today=new Date();

today.setHours(0,0,0,0);

allTeam.forEach(user=>{

totalRecharge+=user.totalRecharge||0;

totalIncome+=user.totalIncome||0;

if(user.createdAt>=today){

todayJoin++;

}

todayRecharge+=user.totalRecharge||0;

todayCommission+=user.totalIncome||0;

});
res.json({

    success: true,

    level1,

    level2,

    level3,

    totalTeam: allTeam.length,

    totalRecharge,

    totalIncome,

    todayJoin,

    todayRecharge,

    todayCommission

});

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Server Error"

        });

    }

};
exports.getReferralHistory = async(req,res)=>{

    try{

        const history = await ReferralIncome.find({

            user:req.user.id

        })

        .populate("fromUser","name mobile")

        .sort({createdAt:-1});

        res.json({

            success:true,

            history

        });

    }

    catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Server Error"

        });

    }

};
// ===============================
// Team Stats
// ===============================

exports.teamStats = async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        // Level 1
        const level1 = await User.find({
            parent: user._id
        }).select("-password -withdrawPin");

        // Level 2
        const level1Ids = level1.map(u => u._id);

        const level2 = await User.find({
            parent: {
                $in: level1Ids
            }
        }).select("-password -withdrawPin");

        // Level 3
        const level2Ids = level2.map(u => u._id);

        const level3 = await User.find({
            parent: {
                $in: level2Ids
            }
        }).select("-password -withdrawPin");

        // All Team
        const allTeam = [
            ...level1,
            ...level2,
            ...level3
        ];

        // ===============================
        // Team Statistics
        // ===============================

        let totalRecharge = 0;
        let totalIncome = 0;
        let todayJoin = 0;
        let todayRecharge = 0;
        let todayCommission = 0;

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        allTeam.forEach(member => {

            const recharge =
                Number(member.totalRecharge || 0);

            const income =
                Number(member.totalIncome || 0);

            totalRecharge += recharge;

            totalIncome += income;

            if (member.createdAt >= today) {
                todayJoin++;
            }

            // NOTE:
            // Current User model data ke according
            // todayRecharge/todayCommission exact daily
            // calculation nahi hai.
            // Ye current total values ko add karta hai.

            todayRecharge += recharge;

            todayCommission += income;

        });

        return res.json({

            success: true,

            level1,

            level2,

            level3,

            totalTeam: allTeam.length,

            totalRecharge,

            totalIncome,

            todayJoin,

            todayRecharge,

            todayCommission

        });

    } catch (err) {

        console.error(
            "Team Stats Error:",
            err
        );

        return res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
// ===============================
// Income History
// ===============================

exports.getIncomeHistory = async (req, res) => {

    try {

        const history = await ReferralIncome.find({

            user: req.user.id

        })

        .populate("fromUser", "name mobile totalRecharge")

        .sort({ createdAt: -1 });

        res.json({

            success: true,

            history

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
exports.dashboard = async (req, res) => {
    try {

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        // Daily auto reset
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastReset = user.referralIncomeResetDate
            ? new Date(user.referralIncomeResetDate)
            : null;

        if (!lastReset || lastReset < today) {
            user.todayReferralIncome = 0;
            user.referralIncomeResetDate = new Date();
            await user.save();
        }

        const publicBaseUrl =
            (process.env.PUBLIC_BASE_URL ||
                "https://mygame-backend.de.deplexo.com")
            .replace(/\/$/, "");

        res.json({
            success: true,

            inviteCode: user.inviteCode,

            referralLink:
                `${publicBaseUrl}/income/pages/login/reset/?inviteCode=${user.inviteCode}`,

            todayIncome: Number(user.todayReferralIncome || 0),

            totalIncome: Number(user.totalReferralIncome || 0)
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }
};