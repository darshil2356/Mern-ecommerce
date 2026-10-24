const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, default: "" },
  isReturnAdjustment: { type: Boolean, default: false },
  isInitialPayment: { type: Boolean, default: false },
  isMaff: { type: Boolean, default: false },
  maffReason: { type: String, default: "" },
});

const udharSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["PRODUCT_SALE", "PERSONAL_LOAN"],
      required: true,
    },
    personName: { type: String, required: true },
    personPhone: { type: String, default: "" },

    // For PRODUCT_SALE
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    productDetails: { type: String, default: "" },

    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    maffAmount: { type: Number, default: 0 },
    maffReason: { type: String, default: "" },
    isMaff: { type: Boolean, default: false },
    payments: [paymentSchema],

    dueDate: { type: Date, default: null },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "CLEARED"],
      default: "PENDING",
    },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-update status based on paidAmount + maffAmount
udharSchema.pre("save", function (next) {
  const settled = Number(this.paidAmount || 0) + Number(this.maffAmount || 0);
  if (settled >= Number(this.totalAmount || 0)) this.status = "CLEARED";
  else if (settled > 0) this.status = "PARTIAL";
  else this.status = "PENDING";
  next();
});

module.exports = mongoose.model("Udhar", udharSchema);
