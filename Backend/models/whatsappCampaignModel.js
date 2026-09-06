const mongoose = require("mongoose");

const whatsappCampaignSchema = new mongoose.Schema(
  {
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    offerTitle: {
      type: String,
      required: true,
      trim: true,
    },
    messageTemplate: {
      type: String,
      required: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    couponCode: {
      type: String,
      default: "",
    },
    audienceType: {
      type: String,
      enum: ["ALL_USERS", "CUSTOMERS", "UDHAR_CLIENTS", "WHOLESALE", "CSV_UPLOAD"],
      default: "ALL_USERS",
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["DRAFT", "QUEUED", "SENDING", "COMPLETED", "FAILED"],
      default: "DRAFT",
    },
    sendingMethod: {
      type: String,
      enum: ["META_CLOUD_API", "WEB_DISPATCHER", "THIRD_PARTY_GATEWAY"],
      default: "WEB_DISPATCHER",
    },
    recipientLogs: [
      {
        name: { type: String, default: "Customer" },
        phoneNumber: { type: String, required: true },
        status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
        sentAt: { type: Date },
        error: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhatsAppCampaign", whatsappCampaignSchema);
