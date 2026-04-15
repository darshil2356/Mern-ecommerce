const mongoose = require("mongoose");

const marketIntelSchema = new mongoose.Schema(
  {
    segment: { type: String, default: "all" }, // e.g. "women", "men", "kids"
    report: { type: mongoose.Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One document per segment
marketIntelSchema.index({ segment: 1 }, { unique: true });

module.exports = mongoose.model("MarketIntel", marketIntelSchema);
