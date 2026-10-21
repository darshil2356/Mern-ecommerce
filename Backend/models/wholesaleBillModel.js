const mongoose = require("mongoose");

// Supports mixed payments: part cash + part online + GR + Discount/Kasar (Round Off / Maff)
const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  cashAmount: { type: Number, default: 0 },
  onlineAmount: { type: Number, default: 0 },
  grAmount: { type: Number, default: 0 },
  grNote: { type: String, default: "" },
  discountAmount: { type: Number, default: 0 }, // Kasar / Round Off / Maff
  discountNote: { type: String, default: "" },
  totalAmount: { type: Number, required: true }, // cashAmount + onlineAmount + grAmount + discountAmount
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
    grAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 }, // Kasar / Round Off / Maff
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
  this.paidAmount = this.payments.reduce((sum, p) => {
    const cashOnline = (p.cashAmount || 0) + (p.onlineAmount || 0);
    return sum + (cashOnline > 0 ? cashOnline : (p.totalAmount && !p.grAmount && !p.discountAmount ? p.totalAmount : 0));
  }, 0);
  this.grAmount = this.payments.reduce((sum, p) => sum + (p.grAmount || 0), 0);
  this.discountAmount = this.payments.reduce((sum, p) => sum + (p.discountAmount || 0), 0);
  const totalSettled = this.paidAmount + this.grAmount + this.discountAmount;
  this.balanceDue = Math.max(0, this.totalAmount - totalSettled);
  if (totalSettled >= this.totalAmount) this.status = "PAID";
  else if (totalSettled > 0) this.status = "PARTIAL";
  else this.status = "PENDING";
  next();
});

wholesaleBillSchema.index({ customer: 1, billDate: -1 });
wholesaleBillSchema.index({ billDate: -1 });
wholesaleBillSchema.index({ status: 1 });

module.exports = mongoose.model("WholesaleBill", wholesaleBillSchema);
