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

    color: [{ type: mongoose.Schema.Types.ObjectId, ref: "Color" }],
    tags: String,
    ratings: [
      {
        star: Number,
        comment: String,
        postedby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    totalrating: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);


//Export the model
module.exports = mongoose.model("Product", productSchema);  