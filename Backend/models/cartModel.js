const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
    },
    size: {
      type: String,
      default: null,
    },
    // Bundle fields
    isBundle: {
      type: Boolean,
      default: false,
    },
    bundleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bundle",
    },
    bundleTitle: {
      type: String,
    },
    bundleProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        title: String,
        quantity: Number,
        price: Number,
        image: String,
        selectedColor: { type: mongoose.Schema.Types.ObjectId, ref: "Color", default: null },
        selectedColorLabel: { type: String, default: null },
        selectedSize: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Cart", cartSchema);
