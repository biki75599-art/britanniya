const User = require("../models/User");
const UserProduct = require("../models/UserProduct");
const ProductIncome = require("../models/ProductIncome");

async function creditProductIncome() {

    try {

        const now = new Date();

        const products = await UserProduct.find({
            status: "Running"
        });

        for (const item of products) {

            // ======================================
            // PRODUCT COMPLETED
            // ======================================

            if (item.earnedDays >= item.totalDays) {

                item.status = "Completed";

                await item.save();

                continue;
            }


            // ======================================
            // OLD DATA FIX
            // ======================================

            if (!item.nextIncomeAt) {

                const nextIncome = new Date(
                    item.purchaseDate || now
                );

                nextIncome.setHours(0, 0, 0, 0);

                if (nextIncome <= now) {

                    nextIncome.setDate(
                        nextIncome.getDate() + 1
                    );

                }

                item.nextIncomeAt = nextIncome;

                await item.save();

                continue;
            }


            // ======================================
            // NOT YET TIME
            // ======================================

            if (now < item.nextIncomeAt) {

                continue;

            }


            // ======================================
            // FIND USER
            // ======================================

            const user = await User.findById(
                item.user
            );

            if (!user) {

                console.log(
                    "❌ User not found:",
                    item.user
                );

                continue;

            }


            // ======================================
            // PREVENT DUPLICATE INCOME
            // ======================================

            const nextDay =
                item.earnedDays + 1;

            const alreadyCredited =
                await ProductIncome.findOne({

                    userProduct: item._id,

                    day: nextDay

                });

            if (alreadyCredited) {

                console.log(
                    "⚠️ Income already credited:",
                    item._id.toString(),
                    "Day:",
                    nextDay
                );

                continue;

            }


            // ======================================
            // CALCULATE INCOME
            // ======================================

            const incomeAmount =
                Number(
                    item.dailyIncome || 0
                );

            if (incomeAmount <= 0) {

                console.log(
                    "❌ Invalid daily income:",
                    item._id.toString()
                );

                continue;

            }


            // ======================================
            // UPDATE USER BALANCE
            // ======================================

           // ======================================
// UPDATE USER BALANCE
// ======================================

user.balance =
    Number(user.balance || 0)
    + incomeAmount;

user.totalIncome =
    Number(user.totalIncome || 0)
    + incomeAmount;

user.productIncome =
    Number(user.productIncome || 0)
    + incomeAmount;

user.todayIncome =
    Number(user.todayIncome || 0)
    + incomeAmount;

await user.save();


            // ======================================
            // UPDATE USER PRODUCT
            // ======================================

            item.earnedDays =
                Number(item.earnedDays || 0) + 1;

            item.totalEarned =
                Number(item.totalEarned || 0)
                + incomeAmount;

            item.lastIncomeAt = now;


            // ======================================
            // NEXT INCOME TOMORROW 12 PM
            // ======================================

            const nextIncome =
                new Date(now);

            nextIncome.setDate(
                nextIncome.getDate() + 1
            );

          nextIncome.setHours(
    0,
    0,
    0,
    0
);

            item.nextIncomeAt =
                nextIncome;


            // ======================================
            // PRODUCT COMPLETED
            // ======================================

            if (
                item.earnedDays >=
                item.totalDays
            ) {

                item.status = "Completed";

                item.nextIncomeAt = null;

            }


            await item.save();


            // ======================================
            // CREATE PRODUCT INCOME HISTORY
            // ======================================

            await ProductIncome.create({

                user: user._id,

                userProduct: item._id,

                product:
                    item.productName || "",

                amount:
                    incomeAmount,

                day:
                    item.earnedDays

            });


            console.log(
                "✅ Product Income Credited:",
                user.name,
                "| Amount:",
                incomeAmount,
                "| Day:",
                item.earnedDays
            );

        }

    } catch (err) {

        console.error(
            "❌ PRODUCT INCOME SERVICE ERROR:",
            err
        );

    }

}
 


module.exports = {
    creditProductIncome
};
