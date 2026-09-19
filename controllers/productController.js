const User = require("../models/User");
const Product = require("../models/Product");
const UserProduct = require("../models/UserProduct");
const Income = require("../models/Income");

console.log("===== PRODUCT CONTROLLER LOADED =====");

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
        const purchasedCount = await UserProduct.countDocuments({
            user: user._id,
            product: product._id
        });

        if (purchasedCount >= 5) {
            return res.status(400).json({
                success: false,
                message: `${product.name} purchase limit reached (5/5)`
            });
        }

        // Check recharge balance
        if ((user.rechargeBalance || 0) < product.price) {
            return res.status(400).json({
                success: false,
                message: "Insufficient Recharge Balance"
            });
        }

        // Deduct product price
        user.rechargeBalance -= product.price;

        // Update user product information
        user.activeProduct = product.name;
        user.productStatus = "Active";
        user.productPrice = product.price;
        user.productDailyIncome = product.dailyIncome;
        user.productPurchaseDate = new Date();

        if ((user.vipLevel || 0) < product.vipLevel) {
            user.vipLevel = product.vipLevel;
        }

        await user.save();

        // ======================================
        // NEXT INCOME = NEXT DAY 12:00 PM
        // ======================================

        const purchaseDate = new Date();

        const nextIncome = new Date(purchaseDate);

        nextIncome.setHours(0, 0, 0, 0);

        // If current time is already 12 PM or later,
        // income will be available tomorrow at 12 PM
        if (nextIncome <= purchaseDate) {
            nextIncome.setDate(nextIncome.getDate() + 1);
        }

        // ======================================
        // CREATE USER PRODUCT
        // ======================================

        const savedProduct = await UserProduct.create({

            user: user._id,

            product: product._id,

            productName: product.name,

            amount: product.price,

            dailyIncome: product.dailyIncome,

            totalDays: product.totalDays,

            earnedDays: 0,

            purchaseDate: purchaseDate,

            lastIncomeAt: null,

            nextIncomeAt: nextIncome,

            totalEarned: 0,

            status: "Running"

        });

        console.log(
            "Product Purchased:",
            savedProduct._id.toString()
        );

        return res.status(201).json({

            success: true,

            message: "Product Purchased Successfully",

            product: savedProduct

        });

    } catch (err) {

        console.error("BUY PRODUCT ERROR:", err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};


// ======================================
// GET MY PRODUCTS / DEVICES
// ======================================

exports.getMyDevices = async (req, res) => {

    try {

        const devices = await UserProduct.find({
            user: req.user.id
        })
        .populate("product", "name price dailyIncome totalDays vipLevel")
        .sort({ createdAt: -1 })
        .lean();

        return res.json({

            success: true,

            devices

        });

    } catch (err) {

        console.error("GET DEVICES ERROR:", err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};


// ======================================
// PRODUCT INCOME HISTORY
// ======================================

exports.getIncomeHistory = async (req, res) => {

    try {

        const history = await Income.find({
            user: req.user.id,
            type: "Product Income"
        })
        .populate("product", "name")
        .sort({
            createdAt: -1
        });

        return res.json({

            success: true,

            history

        });

    } catch (err) {

        console.error("INCOME HISTORY ERROR:", err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
// ======================================
// CLAIM DAILY INCOME
// ======================================

exports.claimDailyIncome = async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const products = await UserProduct.find({
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

            if (item.earnedDays >= item.totalDays) {

                item.status = "Completed";

                await item.save();

                continue;
            }

            // Check if income is available
            if (
                item.nextIncomeAt &&
                now < item.nextIncomeAt
            ) {
                continue;
            }

            const incomeAmount =
                Number(item.dailyIncome || 0);

            if (incomeAmount <= 0) {
                continue;
            }

            // Add income
            totalIncome += incomeAmount;

            item.earnedDays =
                Number(item.earnedDays || 0) + 1;

            item.totalEarned =
                Number(item.totalEarned || 0)
                + incomeAmount;

            item.lastIncomeAt = now;

            // Next income tomorrow 12 PM
            const nextIncome = new Date(now);

            nextIncome.setDate(
                nextIncome.getDate() + 1
            );

           nextIncome.setHours(
    0,
    0,
    0,
    0
);

            item.nextIncomeAt = nextIncome;

            if (
                item.earnedDays >=
                item.totalDays
            ) {
                item.status = "Completed";
                item.nextIncomeAt = null;
            }

            await item.save();

            // Income history
            await Income.create({

                user: user._id,

                product: item.product,

                amount: incomeAmount,

                type: "Product Income",

                remark: "Daily Product Income"

            });

        }

        if (totalIncome <= 0) {

            return res.status(400).json({
                success: false,
                message: "Today's income is not available yet."
            });

        }

        // Update user balance
        user.balance =
            Number(user.balance || 0)
            + totalIncome;

        user.totalIncome =
            Number(user.totalIncome || 0)
            + totalIncome;

        user.productIncome =
            Number(user.productIncome || 0)
            + totalIncome;

        await user.save();

        return res.json({

            success: true,

            amount: totalIncome,

            message: "Daily Income Credited Successfully"

        });

    } catch (err) {

        console.error(
            "CLAIM DAILY INCOME ERROR:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};


// ======================================
// PRODUCT PURCHASE COUNT
// ======================================

exports.getPurchaseCount = async (req, res) => {

    try {

        const counts = await UserProduct.aggregate([

            {
                $match: {
                    user: req.user._id
                }
            },

            {
                $group: {

                    _id: "$product",

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

        console.error("PURCHASE COUNT ERROR:", err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};