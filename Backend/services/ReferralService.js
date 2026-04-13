const { ReferralConfig, CoinConfig } = require("../models/rewardConfigModel");
const User = require("../models/userModel");

const getReferralConfig = async () => {
  let config = await ReferralConfig.findOne();
  if (!config) config = await ReferralConfig.create({});
  return config;
};

const getCoinConfig = async () => {
  let config = await CoinConfig.findOne();
  if (!config) config = await CoinConfig.create({});
  return config;
};

const appendCoinTx = (user, tx) => {
  if (!Array.isArray(user.coinTransactions)) user.coinTransactions = [];
  user.coinTransactions.push({ ...tx, createdAt: new Date() });
};

// ─── Helper: apply monthly cap ────────────────────────────────────────────────
const getMonthlyEarned = (user, source) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return (user.coinTransactions || [])
    .filter((tx) => tx.source === source && new Date(tx.createdAt) >= startOfMonth)
    .reduce((sum, tx) => sum + (tx.coins || 0), 0);
};

// ─── Award coins to a single user with optional monthly cap ──────────────────
const awardCoins = async (userId, coins, tx, monthlyCapSource = null, monthlyCapLimit = 0) => {
  if (coins <= 0) return 0;
  const user = await User.findById(userId);
  if (!user) return 0;

  let finalCoins = coins;
  if (monthlyCapLimit > 0 && monthlyCapSource) {
    const earned = getMonthlyEarned(user, monthlyCapSource);
    const remaining = monthlyCapLimit - earned;
    if (remaining <= 0) return 0;
    finalCoins = Math.min(coins, remaining);
  }

  user.coins = (user.coins || 0) + finalCoins;
  if (tx.source === "referral_purchase") {
    user.referralEarnings = (user.referralEarnings || 0) + finalCoins;
  }
  appendCoinTx(user, { ...tx, coins: finalCoins });
  await user.save();
  return finalCoins;
};

// ─── Referral reward: called after every order ────────────────────────────────
/**
 * @param {ObjectId} buyerUserId
 * @param {number}   orderAmount  - totalPriceAfterDiscount
 * @param {boolean}  isFirstPurchase
 */
const processReferralReward = async (buyerUserId, orderAmount, isFirstPurchase = false, orderId = null) => {
  const [refConfig, coinConfig] = await Promise.all([getReferralConfig(), getCoinConfig()]);

  if (!refConfig.isEnabled || !coinConfig.isEnabled) return;

  const buyer = await User.findById(buyerUserId);
  if (!buyer) return;

  const trigger = refConfig.rewardTrigger;

  // ── REFERRER reward ────────────────────────────────────────────────────────
  if (coinConfig.referralRewardEnabled && coinConfig.referrerPurchaseRewardEnabled && buyer.referredBy) {
    if (trigger === "ON_SIGNUP") {
      // handled at signup only
    } else if (
      (trigger === "ON_FIRST_PURCHASE" && isFirstPurchase && refConfig.enableFirstPurchaseReward) ||
      (trigger === "ON_EVERY_PURCHASE" && refConfig.enableEveryPurchaseReward)
    ) {
      if (orderAmount >= refConfig.minPurchaseAmount) {
        let coinsForReferrer = 0;
        if (refConfig.rewardType === "FIXED_COINS") {
          coinsForReferrer = refConfig.fixedCoins;
        } else {
          coinsForReferrer = Math.floor((orderAmount * refConfig.percentage) / 100);
        }

        if (coinsForReferrer > 0) {
          await awardCoins(
            buyer.referredBy,
            coinsForReferrer,
            {
              type: "credit",
              reason: "referral_purchase",
              source: "referral_purchase",
              description: `Referral reward: referred user purchased ₹${orderAmount}`,
              metadata: { referredUserId: buyerUserId, orderAmount, orderId },
            },
            "referral_purchase",
            refConfig.maxRewardPerUserPerMonth
          );
        }
      }
    }
  }

  // ── BUYER reward ───────────────────────────────────────────────────────────
  if (coinConfig.purchaseRewardEnabled && coinConfig.buyerPurchaseRewardEnabled) {
    await processPurchaseReward(buyerUserId, orderAmount, coinConfig, orderId);
  }
};

// ─── Purchase coin reward (buyer earns on own purchase) ──────────────────────
const processPurchaseReward = async (userId, orderAmount, coinConfigOverride = null, orderId = null) => {
  const coinConfig = coinConfigOverride || (await getCoinConfig());
  if (!coinConfig.isEnabled || !coinConfig.purchaseRewardEnabled) return;
  if (!coinConfig.buyerPurchaseRewardEnabled) return;
  if (orderAmount < coinConfig.purchaseMinOrderAmount) return;

  let coins = 0;
  if (coinConfig.purchaseRewardType === "FIXED") {
    coins = coinConfig.purchaseFixedCoins;
  } else {
    coins = Math.floor((orderAmount * coinConfig.purchasePercentage) / 100);
  }

  if (coinConfig.purchaseMaxCoinsPerOrder > 0) {
    coins = Math.min(coins, coinConfig.purchaseMaxCoinsPerOrder);
  }

  if (coins <= 0) return;

  await awardCoins(userId, coins, {
    type: "credit",
    reason: "purchase_reward",
    source: "purchase",
    description: `Purchase reward for order of ₹${orderAmount}`,
    metadata: { orderAmount, orderId },
  });
};

// ─── Signup referral reward ───────────────────────────────────────────────────
const processSignupReferralReward = async (referrerId) => {
  const [refConfig, coinConfig] = await Promise.all([getReferralConfig(), getCoinConfig()]);
  if (!refConfig.isEnabled || !coinConfig.isEnabled || !coinConfig.referralRewardEnabled) return;
  if (refConfig.rewardTrigger !== "ON_SIGNUP") return;
  if (refConfig.rewardType !== "FIXED_COINS" || refConfig.fixedCoins <= 0) return;

  await awardCoins(
    referrerId,
    refConfig.fixedCoins,
    {
      type: "credit",
      reason: "referral_signup",
      source: "referral_purchase",
      description: "Referral reward for new user signup",
      metadata: {},
    },
    "referral_purchase",
    refConfig.maxRewardPerUserPerMonth
  );
};

// ─── Reverse coins awarded on an order (called on cancellation) ──────────────
/**
 * Reverses:
 *  1. Purchase reward coins given to the buyer
 *  2. Referral reward coins given to the referrer
 * Uses coinTransactions metadata to find exact coins to reverse.
 */
const reverseCancelCoins = async (buyerUserId, orderId) => {
  try {
    const buyer = await User.findById(buyerUserId);
    if (!buyer) return { buyerCoinsReversed: 0, referrerCoinsReversed: 0 };

    const orderIdStr = String(orderId);
    let buyerCoinsReversed = 0;
    let referrerCoinsReversed = 0;

    // ── Reverse buyer purchase reward coins ──────────────────────────────────
    const buyerPurchaseTxns = (buyer.coinTransactions || []).filter(
      (tx) =>
        tx.source === "purchase" &&
        tx.type === "credit" &&
        String(tx.metadata?.orderId) === orderIdStr
    );

    for (const tx of buyerPurchaseTxns) {
      const coinsToReverse = tx.coins || 0;
      if (coinsToReverse > 0 && buyer.coins >= coinsToReverse) {
        buyer.coins -= coinsToReverse;
        buyerCoinsReversed += coinsToReverse;
        appendCoinTx(buyer, {
          type: "debit",
          coins: coinsToReverse,
          reason: "cancel_reversal",
          source: "purchase",
          description: "Purchase reward reversed due to order cancellation",
          metadata: { orderId, reversedTxId: tx._id },
        });
      }
    }
    await buyer.save();

    // ── Reverse referrer coins earned from this buyer's order ────────────────
    if (buyer.referredBy) {
      const referrer = await User.findById(buyer.referredBy);
      if (referrer) {
        const referrerTxns = (referrer.coinTransactions || []).filter(
          (tx) =>
            tx.source === "referral_purchase" &&
            tx.type === "credit" &&
            String(tx.metadata?.referredUserId) === String(buyerUserId)
        );

        // Find txns that match this order by checking orderId in metadata OR
        // by matching the most recent referral_purchase txn for this buyer
        // (since older orders may not have orderId in metadata)
        const orderTxns = referrerTxns.filter(
          (tx) => String(tx.metadata?.orderId) === orderIdStr
        );
        const txnsToReverse = orderTxns.length > 0 ? orderTxns : [];

        for (const tx of txnsToReverse) {
          const coinsToReverse = tx.coins || 0;
          if (coinsToReverse > 0 && referrer.coins >= coinsToReverse) {
            referrer.coins -= coinsToReverse;
            if (referrer.referralEarnings >= coinsToReverse) {
              referrer.referralEarnings -= coinsToReverse;
            }
            referrerCoinsReversed += coinsToReverse;
            appendCoinTx(referrer, {
              type: "debit",
              coins: coinsToReverse,
              reason: "cancel_reversal",
              source: "referral_purchase",
              description: "Referral reward reversed: referred user cancelled order",
              metadata: { referredUserId: buyerUserId, orderId, reversedTxId: tx._id },
            });
          }
        }
        await referrer.save();
      }
    }

    return { buyerCoinsReversed, referrerCoinsReversed };
  } catch (err) {
    console.error("reverseCancelCoins error:", err.message);
    return { buyerCoinsReversed: 0, referrerCoinsReversed: 0 };
  }
};

module.exports = {
  getReferralConfig,
  getCoinConfig,
  processReferralReward,
  processPurchaseReward,
  processSignupReferralReward,
  reverseCancelCoins,
};
