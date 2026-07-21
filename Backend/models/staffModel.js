const mongoose = require("mongoose");

const salaryHistorySchema = new mongoose.Schema(
  {
    monthYear: { type: String, required: true }, // e.g. "2026-07" or "July 2026"
    baseAmount: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deduction: { type: Number, default: 0 },
    advanceDeducted: { type: Number, default: 0 },
    netPaid: { type: Number, default: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMode: { type: String, enum: ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"], default: "CASH" },
    status: { type: String, enum: ["PAID", "PENDING", "PARTIAL"], default: "PAID" },
    remarks: { type: String, default: "" },
  },
  { _id: true, timestamps: true }
);

const advanceHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["GIVEN", "DEDUCTED", "REPAID"], required: true },
    mode: { type: String, enum: ["CASH", "BANK_TRANSFER", "UPI"], default: "CASH" },
    remarks: { type: String, default: "" },
  },
  { _id: true, timestamps: true }
);

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    address: { type: String, default: "" },
    emergencyContact: {
      name: { type: String, default: "" },
      relation: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    aadharNumber: { type: String, trim: true, default: "" },

    designation: { type: String, required: true, trim: true }, // Sales Staff, Manager, Accountant, Tailor, Billing, etc.
    joiningDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"],
      default: "ACTIVE",
    },

    salaryType: {
      type: String,
      enum: ["MONTHLY", "DAILY", "HOURLY"],
      default: "MONTHLY",
    },
    baseSalary: { type: Number, required: true, default: 0 },

    bankDetails: {
      accountNo: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
      bankName: { type: String, default: "" },
      upiId: { type: String, default: "" },
      holderName: { type: String, default: "" },
    },

    salaryHistory: [salaryHistorySchema],
    advanceHistory: [advanceHistorySchema],

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

staffSchema.index({ name: 1 });
staffSchema.index({ phone: 1 });
staffSchema.index({ designation: 1 });
staffSchema.index({ status: 1 });

module.exports = mongoose.model("Staff", staffSchema);
