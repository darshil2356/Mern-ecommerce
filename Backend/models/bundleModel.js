const mongoose = require("mongoose");

// Declare the Schema of the Mongo model
var bundleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    bundlePrice: {
      type: Number,
      required: true,
    },
    // Products included in the bundle
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    // Calculate total original price from products
    originalPrice: {
      type: Number,
      default: 0,
    },
    // Discount percentage
    discountPercent: {
      type: Number,
      default: 0,
    },
    // Bundle image
    image: {
      public_id: String,
      url: String,
    },
    // Category for bundle
    category: {
      type: String,
    },
    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Show on product page
    showOnProductPage: {
      type: Boolean,
      default: false,
    },
    // Bundle stock
    stock: {
      type: Number,
      default: 0,
    },
    // Minimum stock warning
    minStockWarning: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate original price and discount before saving
bundleSchema.pre("save", async function (next) {
  let totalOriginal = 0;
  
  for (const item of this.products) {
    const product = await mongoose.model("Product").findById(item.product);
    if (product) {
      totalOriginal += product.price * item.quantity;
      item.price = product.price;
    }
  }
  
  this.originalPrice = totalOriginal;
  
  if (this.bundlePrice && totalOriginal > 0) {
    this.discountPercent = Math.round(((totalOriginal - this.bundlePrice) / totalOriginal) * 100);
  }
  
  next();
});

// Index for better queries
bundleSchema.index({ isActive: 1 });
bundleSchema.index({ category: 1 });
bundleSchema.index({ showOnProductPage: 1 });

//Export the model
module.exports = mongoose.model("Bundle", bundleSchema);

