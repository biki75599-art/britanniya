const PaymentSetting = require("../models/PaymentSetting");

// ===============================
// USER API
// ===============================

exports.getPaymentSetting = async (req, res) => {

    try {

        const amount = Number(req.query.amount);

        const payment = await PaymentSetting.findOne({

            active: true,

            minAmount: { $lte: amount },

            maxAmount: { $gte: amount }

        });

        if (!payment) {

            return res.status(404).json({

                success: false,

                message: "No Payment Gateway Found"

            });

        }

        res.json({

            success: true,

            payment: {

                _id: payment._id,

                accountName: payment.accountName,

                upiId: payment.upiId,

                qrImage: payment.qrImage,

                minAmount: payment.minAmount,

                maxAmount: payment.maxAmount

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

// ===============================
// ADMIN CREATE
// ===============================

exports.createPaymentSetting = async (req, res) => {

    try {

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: "QR image is required."
            });
        }

        const qrImage =
            `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

        const payment = await PaymentSetting.create({

            accountName: req.body.accountName,

            upiId: req.body.upiId,

            qrImage,

            minAmount: req.body.minAmount,

            maxAmount: req.body.maxAmount,

            active: true

        });

        res.json({

            success: true,

            message: "Payment Added",

            payment

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};

// ===============================
// ADMIN LIST
// ===============================

exports.getAllPaymentSettings = async (req, res) => {

    const list = await PaymentSetting.find().sort({

        createdAt: -1

    });

    res.json({

        success: true,

        list

    });

};

// ===============================
// UPDATE
// ===============================

exports.updatePaymentSetting = async (req, res) => {

    const payment = await PaymentSetting.findById(req.params.id);

    if (!payment) {

        return res.json({

            success: false,

            message: "Not Found"

        });

    }

    payment.accountName = req.body.accountName;
    payment.upiId = req.body.upiId;
    payment.minAmount = req.body.minAmount;
    payment.maxAmount = req.body.maxAmount;
    payment.active = req.body.active;

    if (req.file && req.file.buffer) {

        payment.qrImage =
            `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    }

    await payment.save();

    res.json({

        success: true,

        message: "Updated"

    });

};

// ===============================
// DELETE
// ===============================

exports.deletePaymentSetting = async (req, res) => {

    await PaymentSetting.findByIdAndDelete(req.params.id);

    res.json({

        success: true,

        message: "Deleted"

    });

};