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
 * Build Consolidated Udhar Reminder WhatsApp message text in Gujarati (ગુજરાતી)
 */
const buildConsolidatedUdharMessage = ({
  personName,
  bills = [],
  storeName = "Yashoda Fashion",
  storePhone = "",
}) => {
  const nameStr = personName || "ગ્રાહક મિત્ર";

  // Filter out any 0 balance items
  const pendingBills = bills.filter(
    (b) => Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0)) > 0.01
  );

  if (pendingBills.length === 0) {
    return `🛍️ *${storeName}* 🛍️

નમસ્તે *${nameStr}* જી 🙏,
તમારો તમામ ઉધાર બાકી હિસાબ પૂર્ણ ચૂકવાઈ ગયો છે! 🎉
અમારી દુકાનેથી ખરીદી કરવા બદલ આપનો ખૂબ ખૂબ આભાર! ❤️`;
  }

  // Helper to format date in Gujarati/Indian format
  const formatDateStr = (d) => {
    if (!d) return "N/A";
    const dateObj = new Date(d);
    return isNaN(dateObj.getTime())
      ? "N/A"
      : dateObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  let totalCombinedPending = 0;

  // Build itemized list of all bills with Date and Amount in Gujarati
  const billLines = pendingBills
    .map((b, index) => {
      const billDate = formatDateStr(b.createdAt || b.date || b.dueDate);
      const tot = Number(b.totalAmount || 0);
      const paid = Number(b.paidAmount || 0);
      const rem = Math.max(0, tot - paid);
      totalCombinedPending += rem;

      const desc = b.productDetails
        ? ` (${b.productDetails})`
        : b.type === "PERSONAL_LOAN"
          ? " (પર્સનલ લોન)"
          : "";
      const paidText = paid > 0 ? ` [જમા: ₹${paid.toFixed(0)}]` : "";

      return `${index + 1}. 📅 *તારીખ:* ${billDate}\n   📦 *બિલ રકમ:* ₹${tot.toFixed(0)}${desc}${paidText}\n   ⚠️ *બાકી રકમ:* ₹${rem.toFixed(0)}`;
    })
    .join("\n\n");

  const billCountHeader =
    pendingBills.length > 1 ? ` (કુલ ${pendingBills.length} બિલ)` : "";

  return `🛍️ *${storeName}* 🛍️
*ઉધાર બાકી હિસાબ વિગતો*
કૃપા કરીને બાકી રકમ વહેલી તકે GPay / PhonePe અથવા કેશ (રોકડ) દ્વારા જમા કરાવવા વિનંતી.

નમસ્તે *${nameStr}* જી 🙏,
તમારી કુલ ઉધાર બાકી હિસાબની વિગતો નીચે મુજબ છે${billCountHeader}:

----------------------------------
${billLines}
----------------------------------

💰 *કુલ ચૂકવવાની બાકી રકમ: ₹${totalCombinedPending.toFixed(0)}*

અમારા પર વિશ્વાસ રાખવા બદલ આપનો ખૂબ ખૂબ આભાર! ❤️
${storePhone ? `\n📞 સંપર્ક: ${storePhone}` : "9909895645"}`;
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
  buildConsolidatedUdharMessage,
  sendMetaWhatsAppCloudApi,
  generateWhatsAppUrl,
  getStoreName,
};

