const SpinConfig = require("../models/spinConfigModel");
const SpinHistory = require("../models/spinHistoryModel");
const User = require("../models/userModel");

const pickSegment = (segments) => {
  const active = segments.filter((s) => s.isActive);
  if (!active.length) return { segment: null, activeIndex: -1 };
  const totalWeight = active.reduce((sum, s) => sum + (s.probability || 1), 0);
  let rand = Math.random() * totalWeight;
  for (let i = 0; i < active.length; i++) {
    rand -= active[i].probability || 1;
    if (rand <= 0) return { segment: active[i], activeIndex: i };
  }
  return { segment: active[active.length - 1], activeIndex: active.length - 1 };
};

const getConfig = async () => {
  let config = await SpinConfig.findOne();
  if (!config) {
    config = await SpinConfig.create({
      isEnabled: false,
      segments: [
        { label: "50 Coins",     rewardType: "COINS",        rewardValue: 50,  probability: 2, color: "#FF6B6B" },
        { label: "10% OFF",      rewardType: "DISCOUNT",     rewardValue: 10,  probability: 3, color: "#4ECDC4" },
        { label: "No Luck",      rewardType: "NONE",         rewardValue: 0,   probability: 5, color: "#95A5A6" },
        { label: "100 Coins",    rewardType: "COINS",        rewardValue: 100, probability: 1, color: "#FFEAA7" },
        { label: "5% OFF",       rewardType: "DISCOUNT",     rewardValue: 5,   probability: 4, color: "#96CEB4" },
        { label: "Free Product", rewardType: "FREE_PRODUCT", rewardValue: 0,   probability: 1, color: "#DDA0DD" },
      ],
    });
  }
  return config;
};

const getSpinsUsedToday = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return SpinHistory.countDocuments({ userId, createdAt: { $gte: startOfDay } });
};

const play = async (userId, orderId = null) => {
  const config = await getConfig();

  if (!config.isEnabled) throw new Error("Spin wheel is currently disabled");

  if (config.expiryDate && new Date() > new Date(config.expiryDate)) {
    throw new Error("Spin wheel offer has expired");
  }

  const spinsToday = await getSpinsUsedToday(userId);
  const totalHistory = await SpinHistory.countDocuments({ userId });
  const allowedSpins =
    config.firstTimeBonusSpin && totalHistory === 0
      ? config.spinsPerDay + 1
      : config.spinsPerDay;

  if (spinsToday >= allowedSpins) {
    throw new Error(`Daily spin limit reached (${config.spinsPerDay} per day)`);
  }

  const { segment, activeIndex } = pickSegment(config.segments);
  if (!segment) throw new Error("No active spin segments configured");

  const history = await SpinHistory.create({
    userId,
    segmentId: segment._id,
    rewardType: segment.rewardType,
    rewardValue: segment.rewardValue,
    label: segment.label,
    orderId,
  });

  // Apply reward to user account
  const user = await User.findById(userId);
  if (user) {
    if (segment.rewardType === "COINS" && segment.rewardValue > 0) {
      user.coins = (user.coins || 0) + segment.rewardValue;
      if (!Array.isArray(user.coinTransactions)) user.coinTransactions = [];
      user.coinTransactions.push({
        type: "credit",
        coins: segment.rewardValue,
        reason: "spin_wheel",
        source: "other",
        description: `Spin wheel reward: ${segment.label}`,
        metadata: { spinHistoryId: history._id },
        createdAt: new Date(),
      });
      await user.save();
    }

    if (segment.rewardType === "DISCOUNT" && segment.rewardValue > 0) {
      // Save discount offer to user — will be shown as "Available Offer" on next billing
      user.offerDiscount = segment.rewardValue;
      user.offerType = "percentage";
      await user.save();
    }

    if (segment.rewardType === "FREE_PRODUCT") {
      // Save as a special offer flag — admin handles fulfillment manually
      // Store as a flat ₹0 offer with a note, or use a dedicated flag
      // We mark it as a special offer type so LiveBilling can show it
      user.offerDiscount = 0;
      user.offerType = "free_product";
      await user.save();
    }
  }

  return {
    segment: {
      label: segment.label,
      rewardType: segment.rewardType,
      rewardValue: segment.rewardValue,
      color: segment.color,
    },
    segmentIndex: activeIndex,
    spinsRemaining: allowedSpins - spinsToday - 1,
    historyId: history._id,
  };
};

const getHistory = async (userId, limit = 20) => {
  return SpinHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
};

module.exports = { getConfig, play, getHistory, getSpinsUsedToday };
