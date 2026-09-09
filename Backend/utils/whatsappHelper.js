const axios = require("axios");
const User = require("../models/userModel");

/**
 * Format clean WhatsApp phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const clean = String(phone).replace(/\D/g, "");
  if (!clean) return "";
  return clean.length === 10 ? `91${clean}` : clean;
};

/**
 * Build Udhar Purchase WhatsApp message text
 */
const buildUdharPurchaseMessage = ({ personName, totalAmount, paidAmount, remainingAmount, dueDate, storeName = "Yashoda Fashion" }) => {
  const dueStr = dueDate ? `\n📅 *Due Date:* ${new Date(dueDate).toLocaleDateString("en-IN")}` : "";
  return `🛍️ *${storeName}* 🛍️
*Udhar / Credit Purchase Bill*

Hello *${personName || "Customer"}*,
Thank you for your purchase! Here is your bill summary:

💵 *Total Bill:* ₹${Number(totalAmount || 0).toFixed(2)}
✅ *Paid Today:* ₹${Number(paidAmount || 0).toFixed(2)}
⚠️ *Baki (Udhar Balance):* ₹${Number(remainingAmount || 0).toFixed(2)}${dueStr}

Please keep this message for your records.
Thank you!`;
};

/**
 * Build Udhar Payment Confirmation WhatsApp message text
 */
const buildUdharPaymentMessage = ({ personName, amountPaid, totalPaid, remainingAmount, status, storeName = "Yashoda Fashion" }) => {
  const statusStr = status === "CLEARED" ? "CLEARED 🎉" : "PARTIAL ⏳";
  return `🛍️ *${storeName}* 🛍️
*Udhar Payment Receipt*

Hello *${personName || "Customer"}*,
We have successfully received your payment!

💳 *Payment Received Today:* ₹${Number(amountPaid || 0).toFixed(2)}
✅ *Total Paid So Far:* ₹${Number(totalPaid || 0).toFixed(2)}
⚠️ *Remaining Baki (Udhar Balance):* ₹${Number(remainingAmount || 0).toFixed(2)}
📌 *Status:* ${statusStr}

Thank you for your prompt payment!`;
};

/**
 * Send WhatsApp message via Meta Cloud API if configured
 */
const sendMetaWhatsAppCloudApi = async ({ phone, messageText }) => {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const targetPhone = formatPhoneNumber(phone);

  if (!token || !phoneNumberId || !targetPhone) {
    return { success: false, reason: "Meta API credentials or valid phone missing" };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: targetPhone,
        type: "text",
        text: { body: messageText },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data };
  } catch (err) {
    console.error("Meta WhatsApp Cloud API Error:", err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};

/**
 * Generate 1-click WhatsApp Web / API URL
 */
const generateWhatsAppUrl = ({ phone, messageText }) => {
  const targetPhone = formatPhoneNumber(phone);
  if (!targetPhone) return "";
  const encodedText = encodeURIComponent(messageText);
  return `https://web.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`;
};

/**
 * Helper to fetch store name from admin user
 */
const getStoreName = async () => {
  try {
    const adminUser = await User.findOne({ role: "admin" }).select("storeName");
    return adminUser?.storeName || "Yashoda Fashion";
  } catch (e) {
    return "Yashoda Fashion";
  }
};

module.exports = {
  formatPhoneNumber,
  buildUdharPurchaseMessage,
  buildUdharPaymentMessage,
  sendMetaWhatsAppCloudApi,
  generateWhatsAppUrl,
  getStoreName,
};
