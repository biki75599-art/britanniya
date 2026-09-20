const Recharge = require("../models/Recharge");
const User = require("../models/User");
const {
  approveRechargeInternal
} = require("../services/rechargeService");


// ==========================
// Create Recharge
// ==========================
const createRecharge = async (req, res) => {

    try {

        const { amount, utr, paymentMethod } = req.body;
if (!/^\d{12}$/.test(utr)) {

    return res.status(400).json({

        success: false,
        message: "UTR Number must be exactly 12 digits."

    });

}

// Amount Validation
        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount < 520) {
            return res.status(400).json({
                success: false,
                message: "Minimum recharge amount is ₹520"
            });
        }

        // UTR Validation
        if (!utr || utr.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "UTR Number Required"
            });
        }

        // User Check
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        // Duplicate UTR Check
        const already = await Recharge.findOne({ utr });

        if (already) {
            return res.status(400).json({
                success: false,
                message: "UTR Already Submitted"
            });
        }
        // Check pending recharge
const pendingRecharge = await Recharge.findOne({
    user: req.user.id,
    status: "Pending"
});

if (pendingRecharge) {
    return res.status(400).json({
        success: false,
        message: "Your previous recharge is still pending."
    });
}

const orderNo =
"RC" +
Date.now() +
Math.floor(Math.random() * 1000);

        // Create Recharge
       const recharge = await Recharge.create({

    user: req.user.id,

    orderNo,

    amount: numericAmount,

    utr,

    paymentMethod,

    status: "Pending"

});

        res.status(201).json({

            success: true,

            message: "Recharge Request Submitted Successfully",

            recharge

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};

// ==========================
// User Recharge History
// ==========================
const getRechargeHistory = async (req, res) => {

    try {

        const history = await Recharge.find({

            user: req.user.id

        }).sort({

            createdAt: -1

        });

        res.json({

            success: true,

            history

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};

// ==========================
// Admin Pending Recharge
// ==========================
const getPendingRecharge = async (req, res) => {

    try {

        const recharges = await Recharge.find({

            status: "Pending"

        })

        .populate("user", "name mobile")

        .sort({

            createdAt: -1

        });

        res.json({

            success: true,

            recharges

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

};

// ==========================
// Admin Approve Recharge
// ==========================
// ==========================
// Admin Approve Recharge
// ==========================
const approveRecharge = async (req, res) => {
  try {

    const recharge = await Recharge.findById(req.params.id);

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge Not Found"
      });
    }

    // ==========================================
    // SAME APPROVAL LOGIC
    // Admin approval ke time
    // ==========================================
    const result = await approveRechargeInternal(
  recharge,
  req.admin.id
);

    if (result.alreadyApproved) {
      return res.status(400).json({
        success: false,
        message: "Recharge Already Approved"
      });
    }

    return res.json({
      success: true,
      message: "Recharge Approved Successfully"
    });

  } catch (err) {

    console.error(
      "Approve Recharge Error:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message || "Server Error"
    });
  }
};
module.exports = {

    createRecharge,

    getRechargeHistory,

    getPendingRecharge,

    approveRecharge

};