const mongoose = require("mongoose");

const referralConfigSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: false },

    rewardType: {
      type: String,
      enum: ["FIXED_COINS", "PERCENTAGE"],
      default: "FIXED_COINS",
    },
    fixedCoins: { type: Number, default: 50 },
    percentage: { type: Number, default: 5 }, // % of purchase amount

    rewardTrigger: {
      type: String,
      enum: ["ON_SIGNUP", "ON_FIRST_PURCHASE", "ON_EVERY_PURCHASE"],
      default: "ON_EVERY_PURCHASE",
    },

    maxRewardPerUserPerMonth: { type: Number, default: 500 }, // 0 = unlimited
    minPurchaseAmount: { type: Number, default: 0 },

    enableEveryPurchaseReward: { type: Boolean, default: true },
    enableFirstPurchaseReward: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Coin system global config
const coinConfigSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: true },

    spinRewardEnabled: { type: Boolean, default: true },
    referralRewardEnabled: { type: Boolean, default: true },
    purchaseRewardEnabled: { type: Boolean, default: false },

    // "Both sides" coin config:
    // buyerPurchaseRewardEnabled  → buyer earns coins on their own purchase
    // referrerPurchaseRewardEnabled → referrer earns coins when referred buyer purchases
    buyerPurchaseRewardEnabled: { type: Boolean, default: false },
    referrerPurchaseRewardEnabled: { type: Boolean, default: true },

    purchaseRewardType: {
      type: String,
      enum: ["FIXED", "PERCENTAGE"],
      default: "PERCENTAGE",
    },
    purchaseFixedCoins: { type: Number, default: 10 },
    purchasePercentage: { type: Number, default: 2 },
    purchaseMinOrderAmount: { type: Number, default: 0 },
    purchaseMaxCoinsPerOrder: { type: Number, default: 500 }, // 0 = unlimited
  },
  { timestamps: true }
);

module.exports = {
  ReferralConfig: mongoose.model("ReferralConfig", referralConfigSchema),
  CoinConfig: mongoose.model("CoinConfig", coinConfigSchema),
};
