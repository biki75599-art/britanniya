const ProductIncome = require("../models/ProductIncome");

exports.getProductIncomeHistory = async (req, res) => {

    try {

        const history = await ProductIncome.find({

            user: req.user.id

        })

        .sort({ createdAt: -1 });

        res.json({

            success: true,

            history

        });

    } catch (err) {

    console.log(err);

    res.status(500).json({
        success: false,
        message: err.message,
        stack: err.stack
    });

}

};