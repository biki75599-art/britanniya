const User = require("../models/User");
const Product = require("../models/Product");
const UserProduct = require("../models/UserProduct");
const Income = require("../models/Income");

console.log("===== PRODUCT CONTROLLER LOADED =====");

// Daily income shown on product posters.
// Purchase income uses the same values.
const POSTER_DAILY_INCOME_BY_PRICE = {
    520: 130,
    1200: 310,
    3500: 920,
    7000: 1890,
    15000: 4200
};

// ======================================
// INDIA TIME HELPERS
// ======================================

const IST_TIMEZONE = "Asia/Kolkata";

function getISTDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: IST_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const values = {};

    for (const part of parts) {
        if (part.type !== "literal") {
            values[part.type] = part.value;
        }
    }

    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day)
    };
}

// Returns the NEXT midnight in India time.
// Example:
// 2026-09-20 10:00 IST -> 2026-09-21 00:00 IST
function getNextMidnightIST(date = new Date()) {
    const { year, month, day } = getISTDateParts(date);

    // Next calendar day at 00:00 UTC first.
    const nextDayUtc =
        Date.UTC(
            year,
            month - 1,
            day + 1,
            0,
            0,
            0,
            0
        );

    // IST = UTC + 5:30.
    // Convert India midnight to the actual UTC instant.
    return new Date(
        nextDayUtc - (5.5 * 60 * 60 * 1000)
    );
}


// ======================================
// BUY PRODUCT
// ======================================

exports.buyProduct = async (req, res) => {

    console.log("===== BUY FUNCTION EXECUTED =====");

    try {

        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID Required"
            });
        }

        // Find product
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product Not Found"
            });
        }

        // Find user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        // Maximum 5 purchases of same product
        const purchasedCount =
            await UserProduct.countDocuments({
                user: user._id,
                product: product._id
            });

        if (purchasedCount >= 5) {
            return res.status(400).json({
                success: false,
                message:
                    `${product.name} purchase limit reached (5/5)`
            });
        }

        // Check recharge balance
        if (
            (user.rechargeBalance || 0) <
            product.price
        ) {
            return res.status(400).json({
                success: false,
                message: "Insufficient Recharge Balance"
            });
        }

        // Daily income must match poster income.
        const dailyIncome =
            POSTER_DAILY_INCOME_BY_PRICE[
                Number(product.price)
            ] ??
            Number(product.dailyIncome || 0);

        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid Product Daily Income"
            });
        }

        // Deduct product price
        user.rechargeBalance -= product.price;

        // Update user product information
        user.activeProduct = product.name;
        user.productStatus = "Active";
        user.productPrice = product.price;
        user.productDailyIncome = dailyIncome;
        user.productPurchaseDate = new Date();

        if (
            (user.vipLevel || 0) <
            product.vipLevel
        ) {
            user.vipLevel = product.vipLevel;
        }

        await user.save();


        // ======================================
        // NEXT INCOME = NEXT 12:00 AM IST
        // ======================================

        const purchaseDate = new Date();

        // First income will be available at the
        // next midnight in India.
        const nextIncome =
            getNextMidnightIST(
                purchaseDate
            );


        // ======================================
        // CREATE USER PRODUCT
        // ======================================

        const savedProduct =
            await UserProduct.create({

                user: user._id,

                product: product._id,

                productName:
                    product.name,

                amount:
                    product.price,

                dailyIncome:
                    dailyIncome,

                totalDays:
                    product.totalDays,

                earnedDays: 0,

                purchaseDate:
                    purchaseDate,

                lastIncomeAt: null,

                nextIncomeAt:
                    nextIncome,

                totalEarned: 0,

                status: "Running"

            });


        console.log(
            "Product Purchased:",
            savedProduct._id.toString()
        );

        console.log(
            "First Product Income At:",
            nextIncome.toISOString()
        );


        return res.status(201).json({

            success: true,

            message:
                "Product Purchased Successfully",

            product:
                savedProduct

        });

    } catch (err) {

        console.error(
            "BUY PRODUCT ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }
};


// ======================================
// GET MY PRODUCTS / DEVICES
// ======================================

exports.getMyDevices = async (req, res) => {

    try {

        const devices =
            await UserProduct.find({
                user: req.user.id
            })
            .populate(
                "product",
                "name price dailyIncome totalDays vipLevel"
            )
            .sort({
                createdAt: -1
            })
            .lean();

        return res.json({

            success: true,

            devices

        });

    } catch (err) {

        console.error(
            "GET DEVICES ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }
};


// ======================================
// PRODUCT INCOME HISTORY
// ======================================

exports.getIncomeHistory = async (req, res) => {

    try {

        const history =
            await Income.find({

                user: req.user.id,

                type: "Product Income"

            })
            .populate(
                "product",
                "name"
            )
            .sort({
                createdAt: -1
            });

        return res.json({

            success: true,

            history

        });

    } catch (err) {

        console.error(
            "INCOME HISTORY ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }
};


// ======================================
// CLAIM DAILY INCOME
// ======================================

exports.claimDailyIncome = async (req, res) => {

    try {

        const user =
            await User.findById(
                req.user.id
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const products =
            await UserProduct.find({
                user: user._id,
                status: "Running"
            });

        if (products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No Active Product"
            });
        }

        let totalIncome = 0;

        const now = new Date();

        for (const item of products) {

            // Product already completed
            if (
                Number(item.earnedDays || 0) >=
                Number(item.totalDays || 0)
            ) {

                item.status = "Completed";
                item.nextIncomeAt = null;

                await item.save();

                continue;
            }


            // Old product without nextIncomeAt
            if (!item.nextIncomeAt) {

                item.nextIncomeAt =
                    getNextMidnightIST(
                        item.purchaseDate || now
                    );

                await item.save();

                continue;
            }


            // Income not available yet
            if (
                now <
                item.nextIncomeAt
            ) {
                continue;
            }


            const incomeAmount =
                Number(
                    item.dailyIncome || 0
                );

            if (
                !Number.isFinite(
                    incomeAmount
                ) ||
                incomeAmount <= 0
            ) {
                continue;
            }


            const earnedDays =
                Number(
                    item.earnedDays || 0
                );

            const totalDays =
                Number(
                    item.totalDays || 0
                );

            if (
                totalDays <= 0 ||
                earnedDays >= totalDays
            ) {

                item.status =
                    "Completed";

                item.nextIncomeAt =
                    null;

                await item.save();

                continue;
            }


            // Add today's income
            totalIncome += incomeAmount;

            const newEarnedDays =
                earnedDays + 1;

            item.earnedDays =
                newEarnedDays;

            item.totalEarned =
                Number(
                    item.totalEarned || 0
                ) + incomeAmount;

            item.lastIncomeAt =
                now;


            // Schedule next midnight IST
            if (
                newEarnedDays >=
                totalDays
            ) {

                item.status =
                    "Completed";

                item.nextIncomeAt =
                    null;

            } else {

                item.nextIncomeAt =
                    getNextMidnightIST(
                        now
                    );
            }

            await item.save();


            // Income history
            await Income.create({

                user:
                    user._id,

                product:
                    item.product,

                amount:
                    incomeAmount,

                type:
                    "Product Income",

                remark:
                    `Daily Product Income - Day ${newEarnedDays}`

            });
        }


        if (totalIncome <= 0) {

            return res.status(400).json({

                success: false,

                message:
                    "Today's income is not available yet."

            });
        }


        // Update user balance
        user.balance =
            Number(
                user.balance || 0
            ) + totalIncome;

        user.totalIncome =
            Number(
                user.totalIncome || 0
            ) + totalIncome;

        user.productIncome =
            Number(
                user.productIncome || 0
            ) + totalIncome;

        await user.save();


        return res.json({

            success: true,

            amount:
                totalIncome,

            message:
                "Daily Income Credited Successfully"

        });

    } catch (err) {

        console.error(
            "CLAIM DAILY INCOME ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }
};


// ======================================
// PRODUCT PURCHASE COUNT
// ======================================

exports.getPurchaseCount = async (req, res) => {

    try {

        const counts =
            await UserProduct.aggregate([

                {
                    $match: {
                        user: req.user.id
                    }
                },

                {
                    $group: {

                        _id:
                            "$product",

                        quantity: {
                            $sum: 1
                        }

                    }
                }

            ]);

        return res.json({

            success: true,

            counts

        });

    } catch (err) {

        console.error(
            "PURCHASE COUNT ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }
};