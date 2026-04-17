const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // shippingInfo: {
    //   firstname: {
    //     type: String,
    //     required: true,
    //   },
    //   lastname: {
    //     type: String,
    //     required: true,
    //   },
    //   address: {
    //     type: String,
    //     required: true,
    //   },
    //   city: {
    //     type: String,
    //     required: true,
    //   },
    //   state: {
    //     type: String,
    //     required: true,
    //   },
    //   other: {
    //     type: String,
    //   },
    //   pincode: {
    //     type: Number,
    //     required: true,
    //   },
    // },
    // paymentInfo: {
    //   razorpayOrderId: {
    //     type: String,
    //     required: true,
    //   },
    //   razorpayPaymentId: {
    //     type: String,
    //     required: true,
    //   },
    // },
    
    
    shippingInfo: {
  firstname: { type: String },
  lastname: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  other: { type: String },
  pincode: { type: Number },
},

paymentInfo: {
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
},



    // orderItems: [
    //   {
    //     product: {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Product",
    //       required: true,
    //     },
    //     // color: {
    //     //   type: mongoose.Schema.Types.ObjectId,
    //     //   ref: "Color",
    //     //   required: true,
    //     // },
    //     color: product.color?.[0] || null,

    //     quantity: {
    //       type: Number,
    //       required: true,
    //     },
    //     price: {
    //       type: Number,
    //       required: true,
    //     },
    //   },
    // ],
    
    orderItems: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      default: null,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: false,
      default: null,
    },
    size: {
      type: String,
      default: null,
    },
    barcode: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    hsnCode: {
      type: String,
      default: null,
    },
    // Bundle fields
    isBundle: { type: Boolean, default: false },
    bundleId: { type: mongoose.Schema.Types.ObjectId, ref: "Bundle", default: null },
    bundleTitle: { type: String, default: null },
    bundleProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
        title: String,
        quantity: Number,
        price: Number,
        image: String,
        selectedColor: { type: mongoose.Schema.Types.ObjectId, ref: "Color", default: null },
        selectedColorLabel: { type: String, default: null },
        selectedSize: { type: String, default: null },
        hsnCode: { type: String, default: null },
      },
    ],
    // Offer fields
    isFreeItem: { type: Boolean, default: false },
    offerLabel: { type: String, default: null },
    originalPrice: { type: Number, default: null },
  },
],

    
    paidAt: {
      type: Date,
      default: Date.now(),
    },
    month: {
      type: Number,
      default: new Date().getMonth(),
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalPriceAfterDiscount: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    // GST breakdown stored on each order
    gstBreakdown: {
      cgst:     { type: Number, default: 0 },
      sgst:     { type: Number, default: 0 },
      igst:     { type: Number, default: 0 },
      cgstRate: { type: Number, default: 0 },
      sgstRate: { type: Number, default: 0 },
      igstRate: { type: Number, default: 0 },
      gstType:  { type: String, enum: ["CGST_SGST", "IGST", "NONE"], default: "NONE" },
      taxableAmount: { type: Number, default: 0 },
    },
    // Breakdown of how the discount was applied
    discountBreakdown: {
      directDiscount: { type: Number, default: 0 },
      offerDiscount:  { type: Number, default: 0 },
      coinDiscount:   { type: Number, default: 0 },
    },
    coinsUsed: {
      type: Number,
      default: 0,
    },
    coinAmount: {
      type: Number,
      default: 0,
    },
    orderStatus: {
      type: String,
      default: "Ordered",
    },
    mode: {
      type: String,
      enum: ["ONLINE", "OFFLINE"],
      default: "ONLINE",
    },
    paymentDestination: {
      type: String,
      enum: ["CURRENT_ACCOUNT", "OTHER_ACCOUNT", "CASH"],
      default: "CURRENT_ACCOUNT",
    },

    // ── Shiprocket shipping fields ──────────────────────────────────────
    shippingProvider: { type: String, default: null },
    shipmentId:       { type: String, default: null },
    trackingId:       { type: String, default: null },
    trackingUrl:      { type: String, default: null },
    courierName:      { type: String, default: null },
    shippedAt:        { type: Date,   default: null },
    deliveredAt:      { type: Date,   default: null },
    cancelledAt:      { type: Date,   default: null },
    cancelReason:     { type: String, default: null },
    refundType:       { type: String, enum: ["COINS", "CASH", "ONLINE", "NONE"], default: "NONE" },
    refundAmount:     { type: Number, default: 0 },
    refundCoins:      { type: Number, default: 0 },
    statusHistory: [
      {
        status: { type: String },
        date:   { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
