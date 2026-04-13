const mongoose = require("mongoose");

const trackingConfigSchema = new mongoose.Schema({
  isEnabled: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("TrackingConfig", trackingConfigSchema);
