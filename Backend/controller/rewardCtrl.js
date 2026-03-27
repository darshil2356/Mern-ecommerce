const asyncHandler = require("express-async-handler");
const ReferralService = require("../services/ReferralService");
const { ReferralConfig, CoinConfig } = require("../models/rewardConfigModel");

// ─── Referral Config ──────────────────────────────────────────────────────────

// GET /referral/config
const getReferralConfig = asyncHandler(async (req, res) => {
  const config = await ReferralService.getReferralConfig();
  res.json(config);
});

// PUT /referral/config  (admin)
const updateReferralConfig = asyncHandler(async (req, res) => {
  let config = await ReferralConfig.findOne();
  if (!config) config = new ReferralConfig();
  Object.assign(config, req.body);
  await config.save();
  res.json({ success: true, config });
});

// ─── Coin Config ──────────────────────────────────────────────────────────────

// GET /coins/config
const getCoinConfig = asyncHandler(async (req, res) => {
  const config = await ReferralService.getCoinConfig();
  res.json(config);
});

// PUT /coins/config  (admin)
const updateCoinConfig = asyncHandler(async (req, res) => {
  let config = await CoinConfig.findOne();
  if (!config) config = new CoinConfig();
  Object.assign(config, req.body);
  await config.save();
  res.json({ success: true, config });
});

// ─── Referral Earnings ────────────────────────────────────────────────────────

// GET /referral/earnings  (authenticated user)
const getReferralEarnings = asyncHandler(async (req, res) => {
  const User = require("../models/userModel");
  const user = await User.findById(req.user._id).select(
    "coins referralEarnings coinTransactions referralCode referralCount"
  );
  const earnings = (user.coinTransactions || []).filter(
    (tx) => tx.source === "referral_purchase"
  );
  res.json({
    totalCoins: user.coins || 0,
    totalReferralEarnings: user.referralEarnings || 0,
    referralCode: user.referralCode,
    referralCount: user.referralCount || 0,
    earnings,
  });
});

module.exports = {
  getReferralConfig,
  updateReferralConfig,
  getCoinConfig,
  updateCoinConfig,
  getReferralEarnings,
};
