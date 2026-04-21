const mongoose = require("mongoose");

const productInquirySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    color: { type: String, default: "" },
    colorHex: { type: String, default: "" },
    size: { type: String, default: "" },
    quantity: { type: Number, default: 1, min: 1 },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Notified", "Fulfilled"],
      default: "Pending",
    },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductInquiry", productInquirySchema);
