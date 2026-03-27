const asyncHandler = require("express-async-handler");
const SpinConfig = require("../models/spinConfigModel");
const SpinService = require("../services/SpinService");
const User = require("../models/userModel");

// GET /spin/config  (public - frontend reads this to render wheel)
const getSpinConfig = asyncHandler(async (req, res) => {
  const config = await SpinService.getConfig();
  res.json(config);
});

// PUT /spin/config  (admin only)
const updateSpinConfig = asyncHandler(async (req, res) => {
  const { isEnabled, spinsPerDay, minPurchaseAmount, expiryDate, firstTimeBonusSpin } = req.body;
  let config = await SpinConfig.findOne();
  if (!config) config = new SpinConfig();

  if (isEnabled !== undefined) config.isEnabled = Boolean(isEnabled);
  if (spinsPerDay !== undefined) config.spinsPerDay = Number(spinsPerDay);
  if (minPurchaseAmount !== undefined) config.minPurchaseAmount = Number(minPurchaseAmount);
  if (expiryDate !== undefined) config.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (firstTimeBonusSpin !== undefined) config.firstTimeBonusSpin = Boolean(firstTimeBonusSpin);

  await config.save();
  res.json({ success: true, config });
});

// POST /spin/segment  (admin - add segment)
const addSegment = asyncHandler(async (req, res) => {
  const config = await SpinService.getConfig();
  config.segments.push(req.body);
  await config.save();
  res.json({ success: true, segments: config.segments });
});

// PUT /spin/segment/:segmentId  (admin - edit segment)
const updateSegment = asyncHandler(async (req, res) => {
  const config = await SpinService.getConfig();
  const seg = config.segments.id(req.params.segmentId);
  if (!seg) { res.status(404); throw new Error("Segment not found"); }
  Object.assign(seg, req.body);
  await config.save();
  res.json({ success: true, segment: seg });
});

// DELETE /spin/segment/:segmentId  (admin)
const deleteSegment = asyncHandler(async (req, res) => {
  const config = await SpinService.getConfig();
  config.segments = config.segments.filter(
    (s) => s._id.toString() !== req.params.segmentId
  );
  await config.save();
  res.json({ success: true });
});

// POST /spin/play  (authenticated user - online frontend)
const playSpin = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.body;
  const result = await SpinService.play(userId, orderId);
  res.json({ success: true, ...result });
});

// POST /spin/play-pos  (admin auth - POS billing, spin on behalf of customer by mobile)
const playSpinPOS = asyncHandler(async (req, res) => {
  const { customerMobile, orderId } = req.body;

  if (!customerMobile) {
    res.status(400);
    throw new Error("customerMobile is required");
  }

  // Find the customer by mobile
  const customer = await User.findOne({ mobile: customerMobile, role: "user" });
  if (!customer) {
    // No registered customer — return config only so wheel still spins visually
    // but no reward is saved
    const spinConfig = await SpinService.getConfig();
    if (!spinConfig.isEnabled) {
      res.status(400);
      throw new Error("Spin wheel is currently disabled");
    }
    const { pickSegmentPublic } = require("../services/SpinService");
    // Just pick a visual segment, no DB save
    const active = spinConfig.segments.filter((s) => s.isActive);
    if (!active.length) { res.status(400); throw new Error("No active segments"); }
    const totalWeight = active.reduce((sum, s) => sum + (s.probability || 1), 0);
    let rand = Math.random() * totalWeight;
    let picked = active[active.length - 1];
    let pickedIndex = active.length - 1;
    for (let i = 0; i < active.length; i++) {
      rand -= active[i].probability || 1;
      if (rand <= 0) { picked = active[i]; pickedIndex = i; break; }
    }
    return res.json({
      success: true,
      segment: { label: picked.label, rewardType: picked.rewardType, rewardValue: picked.rewardValue, color: picked.color },
      segmentIndex: pickedIndex,
      spinsRemaining: 0,
      guestSpin: true,
    });
  }

  const result = await SpinService.play(customer._id, orderId || null);
  res.json({ success: true, ...result });
});

// GET /spin/history  (authenticated user)
const getSpinHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const history = await SpinService.getHistory(userId);
  const spinsToday = await SpinService.getSpinsUsedToday(userId);
  const config = await SpinService.getConfig();
  res.json({
    history,
    spinsToday,
    spinsAllowed: config.spinsPerDay,
    canSpin: config.isEnabled && spinsToday < config.spinsPerDay,
  });
});

module.exports = {
  getSpinConfig,
  updateSpinConfig,
  addSegment,
  updateSegment,
  deleteSegment,
  playSpin,
  playSpinPOS,
  getSpinHistory,
};
