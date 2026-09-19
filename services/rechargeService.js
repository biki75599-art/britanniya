const User = require("../models/User");
const ReferralIncome = require("../models/ReferralIncome");
const Recharge = require("../models/Recharge");
const UserProduct = require("../models/UserProduct");
const Product = require("../models/Product");

const approveRechargeInternal = async (
  recharge,
  approvedBy = null
) => {
  // ==========================================
  // BASIC VALIDATION
  // ==========================================
  if (!recharge || !recharge._id) {
    throw new Error("Recharge Not Found");
  }

  const amount = Number(recharge.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid recharge amount");
  }

  // ==========================================
  // ATOMIC APPROVAL
  // IMPORTANT:
  // Only ONE request can change Pending -> Approved
  // ==========================================
  const approvalData = {
    status: "Approved",
    approvedAt: new Date(),
  };

  if (approvedBy) {
    approvalData.approvedBy = approvedBy;
  }

  const approvedRecharge =
    await Recharge.findOneAndUpdate(
      {
        _id: recharge._id,
        status: "Pending",
      },
      {
        $set: approvalData,
      },
      {
        new: true,
      }
    );

  // ==========================================
  // ALREADY APPROVED / PROCESSED
  // ==========================================
  if (!approvedRecharge) {
    const currentRecharge =
      await Recharge.findById(recharge._id);

    if (
      currentRecharge &&
      currentRecharge.status === "Approved"
    ) {
      return {
        alreadyApproved: true,
        recharge: currentRecharge,
      };
    }

    throw new Error(
      "Recharge could not be approved"
    );
  }

  // ==========================================
  // USER FIND
  // ==========================================
  const user = await User.findById(
    approvedRecharge.user
  );

  if (!user) {
    // IMPORTANT:
    // Approval already happened here.
    // Do not silently process again.
    throw new Error("User Not Found");
  }

  // ==========================================
  // PRODUCT INCOME 2%
  // ==========================================
 

// Product Income
// Recharge Wallet
user.rechargeBalance =
    (user.rechargeBalance || 0) + amount;

// Total Recharge
user.totalRecharge =
    (user.totalRecharge || 0) + amount;

// Product activate hoga
user.productPrice = amount;
user.productStatus = "Active";
user.productPurchaseDate = new Date();
  // ==========================================
  // VIP LEVEL
  // ==========================================
  if (user.totalRecharge >= 30000) {
    user.vipLevel = 6;
  } else if (user.totalRecharge >= 20000) {
    user.vipLevel = 5;
  } else if (user.totalRecharge >= 12000) {
    user.vipLevel = 4;
  } else if (user.totalRecharge >= 8000) {
    user.vipLevel = 3;
  } else if (user.totalRecharge >= 5000) {
    user.vipLevel = 2;
  } else if (user.totalRecharge >= 3000) {
    user.vipLevel = 1;
  } else {
    user.vipLevel = 0;
  }

  await user.save();
  const product = await Product.findOne({
    price: amount
});

if (product) {

    await UserProduct.create({

        user: user._id,

        product: product._id,

        productName: product.name,

        amount: product.price,

        dailyIncome: product.dailyIncome,

        totalDays: product.totalDays,

        purchaseDate: new Date(),

        status: "Running"

    });

}

  // ==========================================
  // LEVEL 1 REFERRAL - 10%
  // ==========================================
  if (user.parent) {
    const level1 = await User.findById(
      user.parent
    );

    if (level1) {
      const income = amount * 0.10;

     level1.balance =
    Number(level1.balance || 0) + income;

level1.totalIncome =
    Number(level1.totalIncome || 0) + income;

level1.referralIncome =
    Number(level1.referralIncome || 0) + income;

level1.todayReferralIncome =
    Number(level1.todayReferralIncome || 0) + income;

level1.totalReferralIncome =
    Number(level1.totalReferralIncome || 0) + income;

level1.todayIncome =
    Number(level1.todayIncome || 0) + income;

await level1.save();
      await ReferralIncome.create({
        user: level1._id,
        fromUser: user._id,
        level: 1,
        amount: income,
        type: "Referral",
      });
    }
  }

  // ==========================================
  // LEVEL 2 REFERRAL - 5%
  // ==========================================
  if (user.parent) {
    const level1 = await User.findById(
      user.parent
    );

    if (level1 && level1.parent) {
      const level2 = await User.findById(
        level1.parent
      );

      if (level2) {
        const income = amount * 0.05;

       level2.balance =
    Number(level2.balance || 0) + income;

level2.totalIncome =
    Number(level2.totalIncome || 0) + income;

level2.referralIncome =
    Number(level2.referralIncome || 0) + income;

level2.todayReferralIncome =
    Number(level2.todayReferralIncome || 0) + income;

level2.totalReferralIncome =
    Number(level2.totalReferralIncome || 0) + income;

level2.todayIncome =
    Number(level2.todayIncome || 0) + income;

await level2.save();

        await ReferralIncome.create({
          user: level2._id,
          fromUser: user._id,
          level: 2,
          amount: income,
          type: "Referral",
        });
      }
    }
  }

  // ==========================================
  // LEVEL 3 REFERRAL - 3%
  // ==========================================
  if (user.parent) {
    const level1 = await User.findById(
      user.parent
    );

    if (level1 && level1.parent) {
      const level2 = await User.findById(
        level1.parent
      );

      if (level2 && level2.parent) {
        const level3 = await User.findById(
          level2.parent
        );

        if (level3) {
          const income = amount * 0.03;

        level3.balance =
    Number(level3.balance || 0) + income;

level3.totalIncome =
    Number(level3.totalIncome || 0) + income;

level3.referralIncome =
    Number(level3.referralIncome || 0) + income;

level3.todayReferralIncome =
    Number(level3.todayReferralIncome || 0) + income;

level3.totalReferralIncome =
    Number(level3.totalReferralIncome || 0) + income;

level3.todayIncome =
    Number(level3.todayIncome || 0) + income;

await level3.save();

          await ReferralIncome.create({
            user: level3._id,
            fromUser: user._id,
            level: 3,
            amount: income,
            type: "Referral",
          });
        }
      }
    }
  }

  // ==========================================
  // SUCCESS
  // ==========================================
  return {
    alreadyApproved: false,
    recharge: approvedRecharge,
  };
};

module.exports = {
  approveRechargeInternal,
};