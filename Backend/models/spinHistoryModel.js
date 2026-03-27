const mongoose = require("mongoose");

const spinHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    segmentId: { type: mongoose.Schema.Types.ObjectId },
    rewardType: {
      type: String,
      enum: ["COINS", "DISCOUNT", "FREE_PRODUCT", "NONE"],
    },
    rewardValue: { type: Number, default: 0 },
    label: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

// Index for fast per-user daily lookup
spinHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SpinHistory", spinHistorySchema);
