const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  hsnCode: { type: String, default: "", uppercase: true },
  qty: { type: Number, required: true, min: 0 },
  unit: { type: String, default: "Pcs" },
  rate: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  cgstPercent: { type: Number, default: 0 },
  sgstPercent: { type: Number, default: 0 },
  igstPercent: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  mode: { type: String, enum: ["Cash", "Online-Current", "Online-Saving", "Cheque", "Credit"], default: "Cash" },
  referenceNo: { type: String, default: "" },
  note: { type: String, default: "" },
});

const purchaseSchema = new mongoose.Schema(
  {
    billNo: { type: String, default: "", trim: true },
    billDate: { type: Date, required: true, default: Date.now },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },

    items: { type: [purchaseItemSchema], default: [] },

    gstType: {
      type: String,
      enum: ["CGST_SGST", "IGST", "NONE"],
      default: "NONE",
    },
    taxIncluded: { type: Boolean, default: false },

    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    totalCGST: { type: Number, default: 0 },
    totalSGST: { type: Number, default: 0 },
    totalIGST: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paidAmount: { type: Number, default: 0 },
    payments: { type: [paymentSchema], default: [] },
    balanceDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["PAID", "PARTIAL", "PENDING"],
      default: "PENDING",
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

purchaseSchema.pre("save", function (next) {
  this.balanceDue = Math.max(0, this.totalAmount - this.paidAmount);
  if (this.paidAmount >= this.totalAmount) this.status = "PAID";
  else if (this.paidAmount > 0) this.status = "PARTIAL";
  else this.status = "PENDING";
  next();
});

purchaseSchema.index({ vendor: 1, billDate: -1 });
purchaseSchema.index({ billDate: -1 });
purchaseSchema.index({ status: 1 });

module.exports = mongoose.model("Purchase", purchaseSchema);
