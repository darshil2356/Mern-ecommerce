const mongoose = require("mongoose");

const growthReportSchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.Mixed, required: true },
    context: { type: mongoose.Schema.Types.Mixed },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GrowthReport", growthReportSchema);
