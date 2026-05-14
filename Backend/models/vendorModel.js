const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firmName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    altPhone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "Gujarat" },
    pincode: { type: String, default: "" },

    gstin: { type: String, default: "", uppercase: true, trim: true },
    isGSTVendor: { type: Boolean, default: false },

    bankName: { type: String, default: "" },
    accountNo: { type: String, default: "" },
    ifsc: { type: String, default: "" },
    upiId: { type: String, default: "" },

    openingBalance: { type: Number, default: 0 },
    note: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

vendorSchema.index({ name: 1 });
vendorSchema.index({ phone: 1 });

module.exports = mongoose.model("Vendor", vendorSchema);
