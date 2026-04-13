const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema(
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
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    inventory: {
      offline: {
        type: Boolean,
        default: true, // always true
        immutable: true, // cannot be changed after creation
      },
      online: {
        type: Boolean,
        default: false, // admin can enable
      },
    },

    // ✅ NEW FIELD
    barcode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },

    hsnCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
    // images: [
    //   {
    //     public_id: String,
    //     url: String,
    //   },
    // ],

    images: [
      {
        public_id: String,
        url: String,
      },
    ],

    videos: [
      {
        public_id: String,
        url: String,
      },
    ],

    // color: [{ type: mongoose.Schema.Types.ObjectId, ref: "Color" }],
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: false,
      default: null,
    },

    // New variant schema supports multiple colors each with its own size/qty breakdown
    variants: [
      {
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Color",
          required: true,
        },
        sizeStock: [
          {
            size: {
              type: String,
              enum: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
            },
            quantity: {
              type: Number,
              default: 0,
            },
            barcode: {
              type: String,
              unique: true,
              sparse: true,
            },
          },
        ],
      },
    ],

//     size: {
//   type: [String],
//   enum: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
//   default: [],
// },


sizeStock: [
  {
    size: {
      type: String,
      enum: ["XS","S","M","L","XL","2XL","3XL"],
    },
    quantity: {
      type: Number,
      default: 0,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
],

    tags: String,
    ratings: [
      {
        star: Number,
        comment: String,
        postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        // NEW: Enhanced review fields
        images: [{
          public_id: String,
          url: String,
        }],
        isVerifiedPurchase: { type: Boolean, default: false },
        helpful: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    totalrating: {
      type: Number,
      default: 0,
    },
    reelLikes: {
      type: Number,
      default: 0,
      index: true,
    },
    reelLikedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Review statistics
    ratingStats: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);


//Export the model
module.exports = mongoose.model("Product", productSchema);  