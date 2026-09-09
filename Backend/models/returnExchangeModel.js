const mongoose = require("mongoose");

const returnExchangeSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Array of returned items
    returnedItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        barcode: { type: String, default: "" },
        title: { type: String, default: "" },
        color: { type: mongoose.Schema.Types.Mixed, default: null },
        size: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        agreedValue: { type: Number, required: true }, // unit price
        qcStatus: {
          type: String,
          enum: ["RESELLABLE", "DAMAGED"],
          default: "RESELLABLE",
        },
      },
    ],
    // Single item fallback for backward compatibility
    returnedItem: {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
      barcode: { type: String, default: "" },
      title: { type: String, default: "" },
      color: { type: mongoose.Schema.Types.Mixed, default: null },
      size: { type: String, default: "" },
      quantity: { type: Number, default: 1 },
      agreedValue: { type: Number, default: 0 },
      qcStatus: { type: String, enum: ["RESELLABLE", "DAMAGED"], default: "RESELLABLE" },
    },
    // Array of exchange items
    exchangeItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          default: null,
        },
        barcode: { type: String, default: "" },
        title: { type: String, default: "" },
        color: { type: mongoose.Schema.Types.Mixed, default: null },
        size: { type: String, default: "" },
        quantity: { type: Number, default: 1 },
        itemValue: { type: Number, default: 0 }, // unit price
      },
    ],
    // Single item fallback for backward compatibility
    exchangeItem: {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
      barcode: { type: String, default: "" },
      title: { type: String, default: "" },
      color: { type: mongoose.Schema.Types.Mixed, default: null },
      size: { type: String, default: "" },
      quantity: { type: Number, default: 1 },
      itemValue: { type: Number, default: 0 },
    },
    // Financial calculations
    returnedTotal: { type: Number, required: true }, // sum of returned items
    exchangeTotal: { type: Number, required: true }, // sum of exchange items
    differentialAmount: { type: Number, required: true }, // exchangeTotal - returnedTotal (+200, -200, 0)
    
    // Settlement distribution
    settlementType: {
      type: String,
      enum: ["COIN_CREDIT", "EXTRA_PAYMENT", "EVEN"],
      required: true,
    },
    coinsCredited: { type: Number, default: 0 },
    coinsDebited: { type: Number, default: 0 },
    extraAmountPaid: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["CASH", "ONLINE", "COINS", "UDHAR", "NONE"],
      default: "NONE",
    },
    paymentDestination: {
      type: String,
      enum: ["CURRENT_ACCOUNT", "OTHER_ACCOUNT", "CASH"],
      default: "CASH",
    },
    whatsappSent: { type: Boolean, default: false },
    whatsappText: { type: String, default: "" },
    rojmelEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rojmel",
      default: null,
    },
    udharEntry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Udhar",
      default: null,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnExchange", returnExchangeSchema);
