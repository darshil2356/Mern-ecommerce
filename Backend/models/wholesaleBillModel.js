const mongoose = require("mongoose");

// Supports mixed payments: part cash + part online in one payment entry
const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  cashAmount: { type: Number, default: 0 },
  onlineAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // cashAmount + onlineAmount
  onlineMode: {
    type: String,
    enum: ["UPI", "Bank Transfer", "NEFT/RTGS", "Cheque", ""],
    default: "",
  },
  onlineRef: { type: String, default: "" }, // UPI txn ID / cheque number
  note: { type: String, default: "" },
});

const wholesaleBillSchema = new mongoose.Schema(
  {
    billNo: { type: String, required: true, trim: true },
    billDate: { type: Date, required: true, default: Date.now },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WholesaleCustomer",
      required: true,
    },
    description: { type: String, default: "" }, // items / goods description
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    payments: { type: [paymentSchema], default: [] },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID"],
      default: "PENDING",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

wholesaleBillSchema.pre("save", function (next) {
  this.paidAmount = this.payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  this.balanceDue = Math.max(0, this.totalAmount - this.paidAmount);
  if (this.paidAmount >= this.totalAmount) this.status = "PAID";
  else if (this.paidAmount > 0) this.status = "PARTIAL";
  else this.status = "PENDING";
  next();
});

wholesaleBillSchema.index({ customer: 1, billDate: -1 });
wholesaleBillSchema.index({ billDate: -1 });
wholesaleBillSchema.index({ status: 1 });

module.exports = mongoose.model("WholesaleBill", wholesaleBillSchema);
