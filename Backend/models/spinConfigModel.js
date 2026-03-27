const mongoose = require("mongoose");

const segmentSchema = new mongoose.Schema({
  label: { type: String, required: true },
  color: { type: String, default: "#FF6B6B" },
  rewardType: {
    type: String,
    enum: ["COINS", "DISCOUNT", "FREE_PRODUCT", "NONE"],
    default: "NONE",
  },
  rewardValue: { type: Number, default: 0 },
  probability: { type: Number, default: 1, min: 0 }, // weight
  isActive: { type: Boolean, default: true },
});

const spinConfigSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: false },
    spinsPerDay: { type: Number, default: 1 },
    minPurchaseAmount: { type: Number, default: 0 },
    expiryDate: { type: Date, default: null },
    firstTimeBonusSpin: { type: Boolean, default: false },
    segments: [segmentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SpinConfig", spinConfigSchema);
