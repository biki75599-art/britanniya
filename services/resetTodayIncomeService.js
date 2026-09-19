const User = require("../models/User");

async function resetTodayIncome() {
    try {
        await User.updateMany(
            {},
            {
                $set: {
                    todayIncome: 0,
                    todayReferralIncome: 0
                }
            }
        );

        console.log("✅ Today Income Reset Successfully");
    } catch (err) {
        console.error("❌ Today Income Reset Error:", err?.stack || err);
        throw err;
    }
}

module.exports = {
    resetTodayIncome
};
