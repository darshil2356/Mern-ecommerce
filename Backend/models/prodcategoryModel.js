const mongoose = require("mongoose");

const prodcategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "PCategory", default: null },
    image: {
      public_id: { type: String },
      url: { type: String },
    },
    order: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// Virtual: level (depth in tree)
prodcategorySchema.virtual("level").get(function () {
  return this.parent ? 2 : 1;
});

module.exports = mongoose.model("PCategory", prodcategorySchema);
