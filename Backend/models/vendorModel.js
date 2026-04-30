const mongoose = require("mongoose");

var vendorSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", vendorSchema);
