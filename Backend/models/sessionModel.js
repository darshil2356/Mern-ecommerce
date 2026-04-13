const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // null for guests
    },
    guestId: {
      type: String,
      required: false,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      enum: ["mobile", "desktop", "tablet"],
      default: "desktop",
    },
    location: {
      country: String,
      city: String,
      region: String,
    },
    currentPage: {
      type: String,
      default: "/",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pageViews: [{
      page: String,
      timestamp: Date,
      duration: Number, // time spent on page
    }],
    events: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
sessionSchema.index({ isActive: 1, lastActivity: -1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Session", sessionSchema);