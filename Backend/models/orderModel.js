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
      required: true,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: false, // ✅ optional
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
    // Breakdown of how the discount was applied
    discountBreakdown: {
      directDiscount: { type: Number, default: 0 },   // % discount applied by admin at billing
      offerDiscount:  { type: Number, default: 0 },   // spin-wheel / user offer discount
      coinDiscount:   { type: Number, default: 0 },   // coins redeemed as cash
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

  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
