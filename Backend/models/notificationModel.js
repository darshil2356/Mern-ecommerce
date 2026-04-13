const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    guestId: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
      enum: ["email", "push", "whatsapp", "sms", "in_app"],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "read"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    scheduledAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    // For email/WhatsApp specific fields
    recipient: {
      email: String,
      phone: String,
      token: String, // push notification token
    },
    // Template and personalization
    template: {
      type: String,
    },
    variables: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Related entities
    relatedTo: {
      type: {
        type: String,
        enum: ["order", "product", "cart", "issue", "promotion"],
      },
      id: mongoose.Schema.Types.ObjectId,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who created it
    },
    isAutomated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ scheduledAt: 1, status: 1 });
notificationSchema.index({ sentAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);