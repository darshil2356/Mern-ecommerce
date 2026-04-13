const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
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
    issueType: {
      type: String,
      required: true,
      enum: [
        "stuck_checkout",
        "payment_failure",
        "rage_click",
        "app_error",
        "slow_page_load",
        "abandoned_cart",
        "multiple_errors",
        "inactive_user",
        "high_value_drop",
      ],
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who resolved it
    },
    autoResolved: {
      type: Boolean,
      default: false,
    },
    followUpActions: [{
      action: {
        type: String,
        enum: ["email", "push", "whatsapp", "coupon", "reminder"],
      },
      status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      scheduledAt: Date,
      executedAt: Date,
      metadata: mongoose.Schema.Types.Mixed,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
issueSchema.index({ resolved: 1, severity: -1, createdAt: -1 });
issueSchema.index({ userId: 1, resolved: 1 });
issueSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Issue", issueSchema);