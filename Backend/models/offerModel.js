const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    offerType: {
      type: String,
      required: true,
      enum: [
        "BUY_X_FOR_PRICE",    // Buy 2 for ₹1800
        "BUY_X_GET_Y_FREE",   // Buy 2 get 1 free
        "FLAT_OFF",           // ₹100 off
        "PERCENT_OFF",        // 10% off
        "MIN_QTY_DISCOUNT",   // Buy 3+, get 15% off
      ],
    },

    // Which products this offer applies to (empty = all products)
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Which categories this offer applies to (empty = all categories)
    applicableCategories: [{ type: String }],

    // Offer config based on type
    buyQty: { type: Number, default: 1 },       // X in "Buy X"
    getFreeQty: { type: Number, default: 0 },   // Y in "Get Y Free"
    fixedPrice: { type: Number, default: 0 },   // For BUY_X_FOR_PRICE
    discountAmount: { type: Number, default: 0 },// For FLAT_OFF
    discountPercent: { type: Number, default: 0 },// For PERCENT_OFF / MIN_QTY_DISCOUNT
    minQty: { type: Number, default: 1 },        // For MIN_QTY_DISCOUNT

    // Validity
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
