const mongoose = require("mongoose");

const stockLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    productTitle: {
      type: String,
      required: true,
      trim: true,
    },
    productImage: {
      type: String,
      default: "",
    },
    barcode: {
      type: String,
      trim: true,
      default: "",
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      default: "",
    },

    // Change Details
    changeType: {
      type: String,
      enum: ["MANUAL_REDUCE", "MANUAL_ADD", "POS_SALE", "ONLINE_SALE", "AUDIT_ADJUSTMENT"],
      default: "MANUAL_REDUCE",
      index: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    diffQuantity: {
      type: Number, // e.g. -2 for reduction, +5 for addition
      required: true,
    },
    variantDetails: {
      color: { type: String, default: "" },
      size: { type: String, default: "" },
      barcode: { type: String, default: "" },
    },
    itemsBreakdown: [
      {
        color: { type: String, default: "" },
        size: { type: String, default: "" },
        oldStock: Number,
        newStock: Number,
        reducedUnits: Number,
      },
    ],

    // Pricing & Value at Risk (to prevent cash theft)
    unitPrice: {
      type: Number,
      default: 0,
    },
    unitPurchasePrice: {
      type: Number,
      default: 0,
    },
    potentialLossAmount: {
      type: Number, // abs(diffQuantity) * unitPrice (cash value of unrecorded stock)
      default: 0,
    },

    // Fraud Prevention & Reasons
    reason: {
      type: String,
      required: true, // MANDATORY FOR MANUAL REDUCTION
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },

    // Staff & User Info
    staffName: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    performedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      mobile: { type: String, default: "" },
      role: { type: String, default: "" },
    },

    // Audit & Investigation Status
    auditStatus: {
      type: String,
      enum: ["PENDING_REVIEW", "VERIFIED_GENUINE", "SUSPECTED_FRAUD"],
      default: "PENDING_REVIEW",
      index: true,
    },
    investigationNotes: {
      type: String,
      default: "",
    },
    reviewedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

stockLogSchema.index({ createdAt: -1 });
stockLogSchema.index({ auditStatus: 1, createdAt: -1 });
stockLogSchema.index({ changeType: 1, createdAt: -1 });
stockLogSchema.index({ staffName: 1 });

module.exports = mongoose.model("StockLog", stockLogSchema);
