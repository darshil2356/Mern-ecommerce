const mongoose = require("mongoose");

var blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: { type: String },
    readTime: { type: String },
    isAI: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    blogType: { type: String, enum: ["retail", "wholesale", "business", "manual"], default: "manual" },
    featuredProducts: [{ type: String }],
    numViews: { type: Number, default: 0 },
    isLiked: { type: Boolean, default: false },
    isDisliked: { type: Boolean, default: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    author: { type: String, default: "Admin" },
    images: [],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Blog", blogSchema);
