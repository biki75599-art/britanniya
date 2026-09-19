const bcrypt = require("bcryptjs");
const User = require("../models/User");

console.log("✅ userController Loaded");

// =========================
// User Profile
// =========================
const profile = async (req, res) => {

    try {

       const user = await User.findById(req.user.id)
    .select("-password -withdrawPin");

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });

        }

        res.json({
            success: true,
            user
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

// =========================
// Save Bank Details
// =========================
const saveBankDetails = async (req, res) => {

    try {

        const {
            bankName,
            accountNumber,
            ifsc,
            holderName
        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });

        }

        user.bankName = bankName;
        user.accountNumber = accountNumber;
        user.ifsc = ifsc;
        user.holderName = holderName;

        await user.save();

        res.json({
            success: true,
            message: "Bank Details Saved Successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};

// =========================
// Get Bank Details
// =========================
const getBankDetails = async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });

        }

        res.json({

            success: true,

            bank: {

                bankName: user.bankName,

                accountNumber: user.accountNumber,

                ifsc: user.ifsc,

                holderName: user.holderName

            }

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};
const setWithdrawPin = async (req, res) => {

    try {

        const { pin } = req.body;

        if (!pin) {
            return res.status(400).json({
                success: false,
                message: "PIN Required"
            });
        }
if (!/^\d{6,8}$/.test(String(pin).trim())) {
    return res.status(400).json({
        success: false,
        message: "Withdraw PIN must be 6 to 8 digits."
    });}
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const hash = bcrypt.hashSync(String(pin).trim(), 10);

        user.withdrawPin = hash;
        user.withdrawPinCreated = true;

        await user.save();

        res.json({

            success: true,
            message: "Withdraw PIN Created Successfully"

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};
const verifyWithdrawPin = async (req, res) => {

    try {

        const { pin } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User Not Found"

            });

        }

        if (!user.withdrawPinCreated) {

            return res.status(400).json({

                success: false,
                message: "Please Create Withdraw PIN First"

            });

        }

        const match = bcrypt.compareSync(String(pin), String(user.withdrawPin));

        if (!match) {

            return res.status(401).json({

                success: false,
                message: "Invalid Withdraw PIN"

            });

        }

        res.json({

            success: true,
            message: "PIN Verified"

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};

module.exports = {

    profile,

    saveBankDetails,

    getBankDetails,

    setWithdrawPin,

    verifyWithdrawPin

};