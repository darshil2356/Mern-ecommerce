const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, default: "" },
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
    payments: [paymentSchema],

    dueDate: { type: Date, default: null },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "CLEARED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

// Auto-update status based on paidAmount
udharSchema.pre("save", function (next) {
  if (this.paidAmount >= this.totalAmount) this.status = "CLEARED";
  else if (this.paidAmount > 0) this.status = "PARTIAL";
  else this.status = "PENDING";
  next();
});

module.exports = mongoose.model("Udhar", udharSchema);
