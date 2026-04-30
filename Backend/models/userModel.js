const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // required: true,
      default: null,
    },
    role: {
      type: String,
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Array,
      default: [],
    },
    address: {
      type: String,
    },
    addresses: [
      {
        _id: { type: String },
        label: { type: String, default: "Home" },
        firstname: { type: String },
        lastname: { type: String },
        phone: { type: String },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        pincode: { type: String },
        other: { type: String, default: "" },
        isDefault: { type: Boolean, default: false },
      },
    ],
    gstin: {
      type: String,
      default: "",
    },
    // GST Tax settings
    cgst: {
      type: Number,
      default: 0,
    },
    sgst: {
      type: Number,
      default: 0,
    },
    igst: {
      type: Number,
      default: 0,
    },
    // State where the store is located (for CGST/SGST vs IGST logic)
    storeState: {
      type: String,
      default: "Gujarat",
    },
    // Tax mode: true = prices already include tax (extract), false = add tax on top
    taxIncluded: {
      type: Boolean,
      default: false,
    },
    // Admin configuration settings
    showSpinner: {
      type: Boolean,
      default: false, // Show spin wheel by default
    },
    showReferralOffer: {
      type: Boolean,
      default: false, // Show referral offer in live billing by default
    },
    referralCoinPercent: {
      type: Number,
      default: 10, // Default 10% coins to referrer on referral purchase
    },
    storeName: {
      type: String,
      default: "Yashoda Fashion",
    },
    storeTagline: {
      type: String,
      default: "Your One-Stop Shopping Destination",
    },
    storeAddress: {
      type: String,
      default: "",
    },
    storePhone: {
      type: String,
      default: "",
    },
    onlinePaymentDestination: {
      type: String,
      enum: ["CURRENT_ACCOUNT", "OTHER_ACCOUNT"],
      default: "CURRENT_ACCOUNT",
    },
    // UPI IDs for QR code payment on POS bills
    upiIdA: {
      type: String,
      default: "",
    },
    upiIdB: {
      type: String,
      default: "",
    },
    shippingCharge: {
      type: Number,
      default: 100,
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    refreshToken: {
      type: String,
    },
    // Offer/Loyalty fields
    offerDiscount: {
      type: Number,
      default: 0, // Discount percentage or flat amount
    },
    offerType: {
      type: String,
      enum: ["percentage", "flat", "free_product", ""],
      default: "", // "percentage" for %, "flat" for ₹, "free_product" for free item, "" for no offer
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    lastOrderDate: {
      type: Date,
    },
    // Referral fields
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 0,
    },
    referralEarnings: {
      type: Number,
      default: 0,
    },
    coinTransactions: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        coins: {
          type: Number,
          required: true,
        },
        reason: {
          type: String,
          default: "",
        },
        source: {
          type: String,
          enum: ["referral_purchase", "purchase", "admin_adjustment", "expiry", "other"],
          default: "other",
        },
        description: {
          type: String,
          default: "",
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    // Push notification FCM tokens (one per device)
    fcmTokens: {
      type: [String],
      default: [],
    },
    // OTP verification toggle for signup
    requireOtpForSignup: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSaltSync(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });


// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password") || !this.password) {
//     return next();
//   }

//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});




// Indexes for fast POS customer search (prefix queries on name + mobile)
userSchema.index({ firstname: 1 });
userSchema.index({ lastname: 1 });
userSchema.index({ mobile: 1 }); // mobile already unique but explicit compound helps prefix
userSchema.index({ role: 1, firstname: 1 });
userSchema.index({ role: 1, mobile: 1 });

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.createPasswordResetToken = async function () {
  const resettoken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resettoken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 10 minutes
  return resettoken;
};

//Export the model
module.exports = mongoose.model("User", userSchema);


// pos-plateform
