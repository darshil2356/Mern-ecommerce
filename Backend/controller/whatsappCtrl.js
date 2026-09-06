const asyncHandler = require("express-async-handler");
const axios = require("axios");
const User = require("../models/userModel");
const Customer = require("../models/customerModel");
const WholesaleCustomer = require("../models/wholesaleCustomerModel");
const Udhar = require("../models/udharModel");
const WhatsAppCampaign = require("../models/whatsappCampaignModel");

// Helper function to clean and validate phone number (Indian 10-digit format with default country code)
const cleanPhoneNumber = (phone) => {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.length === 10) {
    return `91${digits}`;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  } else if (digits.length > 10) {
    return digits;
  }
  return digits;
};

/**
 * @desc Get recipient numbers based on selected target audience
 * @route GET /api/whatsapp/recipients
 * @access Private (Admin)
 */
const getRecipients = asyncHandler(async (req, res) => {
  const { audience } = req.query;
  let recipients = [];
  const map = new Map();

  if (audience === "ALL_USERS" || !audience) {
    const users = await User.find({ mobile: { $exists: true, $ne: "" } }).select("firstname lastname mobile");
    users.forEach((u) => {
      const cleanPhone = cleanPhoneNumber(u.mobile);
      if (cleanPhone && cleanPhone.length >= 10 && !map.has(cleanPhone)) {
        const name = `${u.firstname || ""} ${u.lastname || ""}`.trim() || "Customer";
        map.set(cleanPhone, { name, mobile: cleanPhone, rawMobile: u.mobile });
      }
    });
  }

  if (audience === "CUSTOMERS" || audience === "ALL_USERS") {
    const customers = await Customer.find({ contactNumber: { $exists: true, $ne: "" } });
    customers.forEach((c) => {
      const cleanPhone = cleanPhoneNumber(c.contactNumber);
      if (cleanPhone && cleanPhone.length >= 10 && !map.has(cleanPhone)) {
        const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Customer";
        map.set(cleanPhone, { name, mobile: cleanPhone, rawMobile: c.contactNumber });
      }
    });
  }

  if (audience === "UDHAR_CLIENTS" || audience === "ALL_USERS") {
    const udharList = await Udhar.find({ personPhone: { $exists: true, $ne: "" } });
    udharList.forEach((u) => {
      const cleanPhone = cleanPhoneNumber(u.personPhone);
      if (cleanPhone && cleanPhone.length >= 10 && !map.has(cleanPhone)) {
        const name = u.personName || "Customer";
        map.set(cleanPhone, { name, mobile: cleanPhone, rawMobile: u.personPhone });
      }
    });
  }

  if (audience === "WHOLESALE" || audience === "ALL_USERS") {
    const wholesaleList = await WholesaleCustomer.find({ phone: { $exists: true, $ne: "" } });
    wholesaleList.forEach((w) => {
      const cleanPhone = cleanPhoneNumber(w.phone);
      if (cleanPhone && cleanPhone.length >= 10 && !map.has(cleanPhone)) {
        const name = w.name || w.firmName || "Wholesale Partner";
        map.set(cleanPhone, { name, mobile: cleanPhone, rawMobile: w.phone });
      }
    });
  }

  recipients = Array.from(map.values());
  res.json({
    success: true,
    total: recipients.length,
    recipients,
  });
});

/**
 * @desc Create a new WhatsApp Campaign
 * @route POST /api/whatsapp/campaign
 * @access Private (Admin)
 */
const createCampaign = asyncHandler(async (req, res) => {
  const {
    campaignName,
    offerTitle,
    messageTemplate,
    mediaUrl,
    couponCode,
    audienceType,
    recipients, // Array of { name, mobile }
    sendingMethod,
  } = req.body;

  if (!campaignName || !offerTitle || !messageTemplate) {
    res.status(400);
    throw new Error("Campaign Name, Offer Title, and Message Template are required");
  }

  const formattedLogs = (recipients || []).map((r) => ({
    name: r.name || "Customer",
    phoneNumber: cleanPhoneNumber(r.mobile || r.phoneNumber),
    status: "pending",
  }));

  const campaign = await WhatsAppCampaign.create({
    campaignName,
    offerTitle,
    messageTemplate,
    mediaUrl: mediaUrl || "",
    couponCode: couponCode || "",
    audienceType: audienceType || "ALL_USERS",
    sendingMethod: sendingMethod || "WEB_DISPATCHER",
    totalRecipients: formattedLogs.length,
    recipientLogs: formattedLogs,
    status: "DRAFT",
  });

  res.status(201).json({
    success: true,
    message: "Campaign created successfully",
    campaign,
  });
});

/**
 * @desc Execute bulk sending via Meta WhatsApp Cloud API or API Gateway
 * @route POST /api/whatsapp/send-bulk
 * @access Private (Admin)
 */
const sendBulkWhatsApp = asyncHandler(async (req, res) => {
  const { campaignId } = req.body;
  const campaign = await WhatsAppCampaign.findById(campaignId);

  if (!campaign) {
    res.status(404);
    throw new Error("Campaign not found");
  }

  const storeSettings = await User.findOne({ role: "admin" }).select(
    "storeName storeWhatsapp storePhone"
  );

  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return res.json({
      success: false,
      message: "Meta Cloud API credentials not configured in environment (.env). Use Web Dispatcher or setup Meta Cloud API keys.",
      requiresWebDispatcher: true,
      campaign,
    });
  }

  campaign.status = "SENDING";
  await campaign.save();

  // Async process sending in background
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < campaign.recipientLogs.length; i++) {
    const recipient = campaign.recipientLogs[i];
    if (recipient.status === "sent") {
      sentCount++;
      continue;
    }

    try {
      // Personalize message
      let textMessage = campaign.messageTemplate
        .replace(/{name}/g, recipient.name || "Customer")
        .replace(/{offer}/g, campaign.offerTitle)
        .replace(/{coupon}/g, campaign.couponCode || "SPECIAL")
        .replace(/{storeName}/g, storeSettings?.storeName || "Yashoda Fashion");

      const messageData = campaign.mediaUrl
        ? {
            messaging_product: "whatsapp",
            to: recipient.phoneNumber,
            type: "image",
            image: {
              link: campaign.mediaUrl,
              caption: textMessage,
            },
          }
        : {
            messaging_product: "whatsapp",
            to: recipient.phoneNumber,
            type: "text",
            text: { body: textMessage },
          };

      // Call Meta Graph API
      await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        messageData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      recipient.status = "sent";
      recipient.sentAt = new Date();
      sentCount++;
    } catch (err) {
      recipient.status = "failed";
      recipient.error = err.response?.data?.error?.message || err.message;
      failedCount++;
    }
  }

  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  campaign.status = failedCount === campaign.recipientLogs.length ? "FAILED" : "COMPLETED";
  await campaign.save();

  res.json({
    success: true,
    message: "Bulk dispatch process completed",
    campaign,
  });
});

/**
 * @desc Update single recipient log progress from Web Queue Dispatcher
 * @route PUT /api/whatsapp/campaign-progress
 * @access Private (Admin)
 */
const updateCampaignProgress = asyncHandler(async (req, res) => {
  const { campaignId, recipientPhone, status, error } = req.body;
  const campaign = await WhatsAppCampaign.findById(campaignId);

  if (!campaign) {
    res.status(404);
    throw new Error("Campaign not found");
  }

  const logItem = campaign.recipientLogs.find(
    (r) => cleanPhoneNumber(r.phoneNumber) === cleanPhoneNumber(recipientPhone)
  );

  if (logItem) {
    logItem.status = status || "sent";
    logItem.sentAt = new Date();
    if (error) logItem.error = error;
  }

  const sent = campaign.recipientLogs.filter((r) => r.status === "sent").length;
  const failed = campaign.recipientLogs.filter((r) => r.status === "failed").length;

  campaign.sentCount = sent;
  campaign.failedCount = failed;

  if (sent + failed >= campaign.totalRecipients) {
    campaign.status = "COMPLETED";
  } else {
    campaign.status = "SENDING";
  }

  await campaign.save();

  res.json({
    success: true,
    campaign,
  });
});

/**
 * @desc Get all campaigns list
 * @route GET /api/whatsapp/campaigns
 * @access Private (Admin)
 */
const getCampaigns = asyncHandler(async (req, res) => {
  const campaigns = await WhatsAppCampaign.find().sort({ createdAt: -1 });
  res.json({
    success: true,
    campaigns,
  });
});

/**
 * @desc Get single campaign details by ID
 * @route GET /api/whatsapp/campaign/:id
 * @access Private (Admin)
 */
const getCampaignDetails = asyncHandler(async (req, res) => {
  const campaign = await WhatsAppCampaign.findById(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error("Campaign not found");
  }
  res.json({
    success: true,
    campaign,
  });
});

/**
 * @desc Delete campaign
 * @route DELETE /api/whatsapp/campaign/:id
 * @access Private (Admin)
 */
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await WhatsAppCampaign.findByIdAndDelete(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error("Campaign not found");
  }
  res.json({
    success: true,
    message: "Campaign deleted successfully",
  });
});

module.exports = {
  getRecipients,
  createCampaign,
  sendBulkWhatsApp,
  updateCampaignProgress,
  getCampaigns,
  getCampaignDetails,
  deleteCampaign,
};
