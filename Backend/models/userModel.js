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
      required: false,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      default: undefined,
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
    storeEmail: {
      type: String,
      default: "",
    },
    storeWhatsapp: {
      type: String,
      default: "",
    },
    storeOpeningHours: {
      type: String,
      default: "10:00 AM - 08:30 PM",
    },
    googleMapsUrl: {
      type: String,
      default: "",
    },
    googleBusinessProfileUrl: {
      type: String,
      default: "",
    },
    instagramUrl: {
      type: String,
      default: "",
    },
    facebookUrl: {
      type: String,
      default: "",
    },
    youtubeUrl: {
      type: String,
      default: "",
    },
    storeLogo: {
      type: String,
      default: "",
    },
    storeFavicon: {
      type: String,
      default: "",
    },
    socialShareImage: {
      type: String,
      default: "",
    },
    googleReviewUrl: {
      type: String,
      default: "https://search.google.com/local/writereview?placeid=ChIJP-z0FraHXjkRP-xoeP6FaF0",
    },
    googleReviewRequestMessage: {
      type: String,
      default: "Thank you for shopping with Yashoda Fashion ❤️ If you loved your shopping experience, we'd really appreciate your honest Google review. Your feedback helps our business grow!",
    },
    homepageMetaTitle: {
      type: String,
      default: "Yashoda Fashion | Women's Clothing Store in Bapunagar, Ahmedabad",
    },
    homepageMetaDescription: {
      type: String,
      default: "Shop women's kurtis, sarees, suit sets, western wear, pants, tops and festive wear at Yashoda Fashion, Bapunagar, Ahmedabad. Stylish collections at affordable prices.",
    },
    heroBannerImage: {
      type: String,
      default: "",
    },
    heroBannerTitle: {
      type: String,
      default: "Yashoda Fashion",
    },
    heroBannerSubtext: {
      type: String,
      default: "Women's Fashion for Every Occasion",
    },
    heroBannerCta: {
      type: String,
      default: "SHOP NOW",
    },
    promoBannerImage: {
      type: String,
      default: "",
    },
    promoBannerLink: {
      type: String,
      default: "",
    },
    homepageSectionsOrder: {
      type: String,
      default: "hero,categories,newArrivals,bestsellers,trending,festive,premium,ethnic,western,pants,plusSize,offers,whyChooseUs,testimonials,faq,location",
    },
    homepageHiddenSections: {
      type: String,
      default: "",
    },
    storeFaqsJson: {
      type: String,
      default: "[]",
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
    posLockPassword: {
      type: String,
      default: "",
    },
    posLockEnabled: {
      type: Boolean,
      default: false,
    },
    lockCustomers: { type: Boolean, default: false },
    lockOrders:    { type: Boolean, default: false },
    lockCatalog:   { type: Boolean, default: false },
    lockAnalytics: { type: Boolean, default: false },
    lockRewards:   { type: Boolean, default: false },
    lockMarketing: { type: Boolean, default: false },
    lockPurchase:  { type: Boolean, default: false },
    lockRojmel:    { type: Boolean, default: false },
    lockUdhar:     { type: Boolean, default: false },
    lockReviews:   { type: Boolean, default: false },
    lockEnquiries: { type: Boolean, default: false },
    lockSettings:  { type: Boolean, default: false },
    jwtExpiresIn:  { type: String, default: "1d" },
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

// Ensure uniqueness only for non-null/non-missing emails.
// This prevents duplicate-key errors when many documents have `email: null`.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true, $ne: null } } }
);

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
