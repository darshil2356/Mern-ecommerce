const mongoose = require("mongoose");

const wholesaleCustomerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firmName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, required: true },
    altPhone: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
    openingBalance: { type: Number, default: 0 }, // previous dues before system
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

wholesaleCustomerSchema.index({ name: 1 });
wholesaleCustomerSchema.index({ phone: 1 });

module.exports = mongoose.model("WholesaleCustomer", wholesaleCustomerSchema);
