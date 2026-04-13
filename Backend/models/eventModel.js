const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestId: {
      type: String,
      required: false,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "page_view",
        "product_view",
        "add_to_cart",
        "remove_from_cart",
        "checkout_started",
        "checkout_completed",
        "payment_success",
        "payment_failed",
        "search",
        "filter_applied",
        "wishlist_add",
        "wishlist_remove",
        "error",
        "rage_click",
        "abandoned_cart",
        "login",
        "logout",
        "signup",
      ],
    },
    page: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Flexible object for event-specific data
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: String,
    userAgent: String,
    device: {
      type: String,
      enum: ["mobile", "desktop", "tablet"],
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
eventSchema.index({ sessionId: 1, timestamp: -1 });
eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ timestamp: -1 });

module.exports = mongoose.model("Event", eventSchema);