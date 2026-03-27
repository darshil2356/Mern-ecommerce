const express = require("express");
const router = express.Router();
const {
  getReferralConfig,
  updateReferralConfig,
  getCoinConfig,
  updateCoinConfig,
  getReferralEarnings,
} = require("../controller/rewardCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Referral config
router.get("/referral/config", getReferralConfig);
router.put("/referral/config", authMiddleware, isAdmin, updateReferralConfig);
router.get("/referral/earnings", authMiddleware, getReferralEarnings);

// Coin config
router.get("/coins/config", getCoinConfig);
router.put("/coins/config", authMiddleware, isAdmin, updateCoinConfig);

module.exports = router;
