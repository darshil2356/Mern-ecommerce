const mongoose = require("mongoose");

const rojmelSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, default: Date.now },
    particulars: { type: String, required: true },
    voucherNo: { type: String, default: "" },
    referenceId: { type: mongoose.Schema.Types.ObjectId, refPath: "referenceModel", default: null },
    referenceModel: { type: String, enum: ["Order", null], default: null },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ["Cash", "Online", "COD"], default: "Online" },
    category: { type: String, default: "General" },
    entrySource: { type: String, enum: ["AUTO", "MANUAL"], default: "MANUAL" },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

rojmelSchema.index({ date: -1 });

module.exports = mongoose.model("Rojmel", rojmelSchema);
