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
 * Build Udhar Maff / Waive Off WhatsApp message text
 */
const buildUdharMaffMessage = ({
  personName,
  totalAmount,
  paidAmount,
  maffAmount,
  maffReason,
  remainingAmount,
  storeName = "Yashoda Fashion",
}) => {
  const remStr =
    remainingAmount <= 0.01
      ? "🎉 *બાકી રકમ (Remaining Due):* ₹0 (સંપૂર્ણ હિસાબ પૂર્ણ - Cleared)"
      : `⚠️ *નવી બાકી રકમ (Remaining Due):* ₹${Number(remainingAmount || 0).toFixed(2)}`;

  return `🛍️ *${storeName}* 🛍️
*ઉધાર બાકી રકમ માફી પહોંચ / Udhar Waived (Maaf)* 🙏

નમસ્તે *${personName || "ગ્રાહક મિત્ર"}*,
આપના ઉધાર ખાતામાં બાકી રકમ માફ (Waived Off) કરવામાં આવેલ છે:

💵 *કુલ બિલ (Total Bill):* ₹${Number(totalAmount || 0).toFixed(2)}
✅ *જમા થયેલ (Paid):* ₹${Number(paidAmount || 0).toFixed(2)}
🎁 *માફ કરેલ રકમ (Maaf Amount):* ₹${Number(maffAmount || 0).toFixed(2)}
📝 *માફીનું કારણ (Reason):* ${maffReason || "દુકાનદાર તરફથી કસર / માફી"}
${remStr}

અમારી દુકાને ખરીદી કરવા બદલ આપનો ખૂબ ખૂબ આભાર! 🙏❤️`;
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
 * Build Vendor Payment Receipt WhatsApp message text
 */
const buildVendorPaymentMessage = ({
  vendorName,
  firmName,
  billNo,
  billDate,
  paymentDate,
  amountPaid,
  paymentMode,
  referenceNo,
  discountAmount = 0,
  grAmount = 0,
  grNote = "",
  totalSettlement,
  billTotal,
  billBalanceDue,
  billStatus,
  overallVendorBalance,
  storeName = "Yashoda Fashion",
  storePhone = "",
}) => {
  const nameStr = firmName ? `${firmName} (${vendorName || "Vendor"})` : (vendorName || "Vendor");
  const dateFormatted = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const purchaseDateFormatted = billDate
    ? new Date(billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const isCleared = billStatus === "PAID" || Number(billBalanceDue || 0) <= 0.01;
  const statusStr = isCleared ? "Fully Cleared & Settled 🎉" : "Partially Cleared ⏳";

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Vendor Payment Receipt / Voucher*`,
    ``,
    `Hello *${nameStr}*,`,
    `We have processed payment towards your purchase bill. Here are the payment settlement details:`,
    ``,
    `📋 *Bill Details:*`,
    `• *Bill No:* ${billNo ? `#${billNo}` : "Purchase Bill"}`,
  ];

  if (purchaseDateFormatted) {
    lines.push(`• *Purchase / Bill Date:* ${purchaseDateFormatted}`);
  }

  if (billTotal !== undefined && billTotal !== null && Number(billTotal) > 0) {
    lines.push(`• *Bill Total:* ₹${Number(billTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  lines.push(`• *Bill Status:* ${statusStr}`);
  lines.push(``);
  lines.push(`💵 *Payment & Settlement Details:*`);
  lines.push(`• *Payment Date:* ${dateFormatted}`);
  lines.push(`• *Payment Mode:* ${paymentMode || "Cash"}`);

  if (referenceNo) {
    lines.push(`• *Ref / UTR / Cheque No:* ${referenceNo}`);
  }

  lines.push(`• *Amount Paid:* ₹${Number(amountPaid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  if (Number(discountAmount) > 0) {
    lines.push(`• *Discount / Kasur:* ₹${Number(discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  if (Number(grAmount) > 0) {
    lines.push(`• *Goods Return (GR):* ₹${Number(grAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${grNote ? ` (${grNote})` : ""}`);
  }

  if (Number(totalSettlement) > Number(amountPaid)) {
    lines.push(`• *Total Settlement Deduction:* ₹${Number(totalSettlement).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  lines.push(``);

  if (isCleared) {
    lines.push(`✅ *Purchase Bill #${billNo || ""}${purchaseDateFormatted ? ` (Dated: ${purchaseDateFormatted})` : ""} is now Fully Cleared & Settled!*`);
  } else {
    lines.push(`⚠️ *Remaining Due for this Bill:* ₹${Number(billBalanceDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  if (overallVendorBalance !== undefined && overallVendorBalance !== null) {
    lines.push(`📊 *Total Ledger Balance Due:* ₹${Number(overallVendorBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  lines.push(``);
  lines.push(`Thank you for your business and partnership! 🙏`);
  if (storePhone) {
    lines.push(`📞 Contact: ${storePhone}`);
  }

  return lines.join("\n");
};

/**
 * Build Consolidated Vendor Ledger Statement WhatsApp message text
 */
const buildVendorStatementMessage = ({
  vendorName,
  firmName,
  summary,
  storeName = "Yashoda Fashion",
  storePhone = "",
}) => {
  const nameStr = firmName ? `${firmName} (${vendorName || "Vendor"})` : (vendorName || "Vendor");
  const totPurchases = Number(summary?.totalPurchases || 0);
  const totPaid = Number(summary?.totalPaid || 0);
  const balDue = Number(summary?.balanceDue || 0);

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Vendor Ledger Account Statement*`,
    ``,
    `Hello *${nameStr}*,`,
    `Here is the current account statement of your ledger with us:`,
    ``,
    `📊 *Ledger Summary:*`,
    `• *Total Purchases:* ₹${totPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• *Total Paid / Settled:* ₹${totPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• *Current Balance Due:* ₹${balDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balDue > 0 ? "⚠️ (Due)" : "✅ (Fully Clear)"}`,
    ``,
    `Thank you for your continued business and partnership! 🙏`,
  ];

  if (storePhone) {
    lines.push(`📞 Contact: ${storePhone}`);
  }

  return lines.join("\n");
};

/**
 * Build Wholesale Sale Bill / Invoice WhatsApp message text
 */
const buildWholesaleBillCreatedMessage = ({
  customerName,
  firmName,
  billNo,
  billDate,
  description = "",
  billTotal,
  initialPaid = 0,
  initialMode = "",
  initialGr = 0,
  initialDiscount = 0,
  billBalanceDue,
  overallCustomerBalance,
  storeName = "Yashoda Fashion",
  storePhone = "",
}) => {
  const nameStr = firmName ? `${firmName} (${customerName || "Customer"})` : (customerName || "Wholesale Customer");
  const dateFormatted = billDate
    ? new Date(billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const isCleared = Number(billBalanceDue || 0) <= 0.01;
  const statusStr = isCleared ? "Fully Paid 🎉" : Number(initialPaid) > 0 ? "Partially Paid ⏳" : "Unpaid (Baki) ⚠️";

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Wholesale Sale Bill / Invoice*`,
    ``,
    `Hello *${nameStr}*,`,
    `Thank you for your business! A new wholesale bill has been created for your account:`,
    ``,
    `📋 *Bill Details:*`,
    `• *Bill No:* ${billNo ? `#${billNo}` : "Wholesale Bill"}`,
    `• *Bill Date:* ${dateFormatted}`,
  ];

  if (description) {
    lines.push(`• *Items / Description:* ${description}`);
  }

  lines.push(`• *Bill Total Amount:* ₹${Number(billTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push(`• *Bill Status:* ${statusStr}`);

  if (Number(initialPaid) > 0 || Number(initialGr) > 0 || Number(initialDiscount) > 0) {
    lines.push(``);
    lines.push(`💵 *Initial Settlement:*`);
    if (Number(initialPaid) > 0) {
      lines.push(`• *Amount Paid:* ₹${Number(initialPaid).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${initialMode ? ` (${initialMode})` : ""}`);
    }
    if (Number(initialGr) > 0) {
      lines.push(`• *Goods Return (GR):* ₹${Number(initialGr).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    if (Number(initialDiscount) > 0) {
      lines.push(`• *Discount / Kasar:* ₹${Number(initialDiscount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
  }

  lines.push(``);
  if (isCleared) {
    lines.push(`✅ *Bill #${billNo || ""} is Fully Settled!*`);
  } else {
    lines.push(`⚠️ *Remaining Due for this Bill (#${billNo || ""}):* ₹${Number(billBalanceDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  if (overallCustomerBalance !== undefined && overallCustomerBalance !== null) {
    lines.push(``);
    lines.push(`----------------------------------`);
    if (Number(overallCustomerBalance) <= 0.01) {
      lines.push(`✅ *Account Status: Fully Cleared!* (No pending balance) 🎉`);
    } else {
      lines.push(`📊 *Total Overall Account Balance Due:* ₹${Number(overallCustomerBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      lines.push(`(Including all pending bills & previous dues)`);
    }
    lines.push(`----------------------------------`);
  }

  lines.push(``);
  lines.push(`Thank you for your valuable partnership! 🙏`);
  if (storePhone) {
    lines.push(`📞 Contact: ${storePhone}`);
  }

  return lines.join("\n");
};

/**
 * Build Wholesale Payment Receipt WhatsApp message text
 */
const buildWholesalePaymentMessage = ({
  customerName,
  firmName,
  billNo,
  billDate,
  paymentDate,
  amountPaid,
  cashAmount = 0,
  onlineAmount = 0,
  onlineMode = "",
  onlineRef = "",
  discountAmount = 0,
  discountNote = "",
  grAmount = 0,
  grNote = "",
  totalSettlement,
  billTotal,
  billBalanceDue,
  billStatus,
  overallCustomerBalance,
  pendingBillsCount,
  storeName = "Yashoda Fashion",
  storePhone = "",
}) => {
  const nameStr = firmName ? `${firmName} (${customerName || "Customer"})` : (customerName || "Wholesale Customer");
  const dateFormatted = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const billDateFormatted = billDate
    ? new Date(billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const isBillCleared = billStatus === "PAID" || Number(billBalanceDue || 0) <= 0.01;
  const billStatusStr = isBillCleared ? "Fully Cleared & Settled 🎉" : "Partially Cleared ⏳";

  const isAccountFullyCleared = overallCustomerBalance !== undefined && overallCustomerBalance !== null && Number(overallCustomerBalance) <= 0.01;

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Wholesale Payment Receipt*`,
    ``,
    `Hello *${nameStr}*,`,
    `We have received your payment. Here are the payment settlement details:`,
    ``,
    `📋 *Bill Details Being Paid:*`,
    `• *Bill No:* ${billNo ? `#${billNo}` : "Wholesale Bill"}`,
  ];

  if (billDateFormatted) {
    lines.push(`• *Bill Date:* ${billDateFormatted}`);
  }

  if (billTotal !== undefined && billTotal !== null && Number(billTotal) > 0) {
    lines.push(`• *Bill Total:* ₹${Number(billTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  lines.push(`• *Bill Status:* ${billStatusStr}`);
  lines.push(``);
  lines.push(`💵 *Payment & Settlement Details:*`);
  lines.push(`• *Payment Date:* ${dateFormatted}`);

  // Payment Breakdown
  const payParts = [];
  if (Number(cashAmount) > 0) payParts.push(`Cash: ₹${Number(cashAmount).toLocaleString("en-IN")}`);
  if (Number(onlineAmount) > 0) {
    payParts.push(`Online${onlineMode ? ` (${onlineMode})` : ""}: ₹${Number(onlineAmount).toLocaleString("en-IN")}${onlineRef ? ` (Ref: ${onlineRef})` : ""}`);
  }
  if (payParts.length > 0) {
    lines.push(`• *Payment Mode:* ${payParts.join(" | ")}`);
  }

  const effectivePaid = Number(amountPaid || 0) || (Number(cashAmount || 0) + Number(onlineAmount || 0));
  lines.push(`• *Amount Paid:* ₹${effectivePaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  if (Number(discountAmount) > 0) {
    lines.push(`• *Discount / Kasar / Maff:* ₹${Number(discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${discountNote ? ` (${discountNote})` : ""}`);
  }

  if (Number(grAmount) > 0) {
    lines.push(`• *Goods Return (GR):* ₹${Number(grAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${grNote ? ` (${grNote})` : ""}`);
  }

  const effectiveSettlement = Number(totalSettlement || 0) || (effectivePaid + Number(discountAmount || 0) + Number(grAmount || 0));
  if (effectiveSettlement > effectivePaid) {
    lines.push(`• *Total Settlement for this Bill:* ₹${effectiveSettlement.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  lines.push(``);

  // Bill-level status
  if (isBillCleared) {
    lines.push(`✅ *Bill #${billNo || ""}${billDateFormatted ? ` (Dated: ${billDateFormatted})` : ""} is now Fully Cleared & Settled!*`);
  } else {
    lines.push(`⚠️ *Remaining Balance for this Bill (#${billNo || ""}):* ₹${Number(billBalanceDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  // Overall Customer Account Status across ALL bills
  if (overallCustomerBalance !== undefined && overallCustomerBalance !== null) {
    lines.push(``);
    lines.push(`----------------------------------`);
    lines.push(`📊 *Customer Overall Account Status:*`);
    if (isAccountFullyCleared) {
      lines.push(`🎉 *CONGRATULATIONS! Your entire wholesale account is FULLY CLEARED with us!*`);
      lines.push(`✅ *All bills are settled. Remaining Balance: ₹0.00*`);
    } else {
      lines.push(`💰 *Total Remaining Account Balance Due:* ₹${Number(overallCustomerBalance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      if (pendingBillsCount && pendingBillsCount > 0) {
        lines.push(`⚠️ *You have ${pendingBillsCount} other unpaid/pending bill(s) in your account.*`);
      }
    }
    lines.push(`----------------------------------`);
  }

  lines.push(``);
  lines.push(`Thank you for your prompt payment and continued partnership! 🙏`);
  if (storePhone) {
    lines.push(`📞 Contact: ${storePhone}`);
  }

  return lines.join("\n");
};

/**
 * Build Wholesale Customer Account Statement WhatsApp message text
 */
const buildWholesaleStatementMessage = ({
  customerName,
  firmName,
  summary,
  storeName = "Yashoda Fashion",
  storePhone = "",
}) => {
  const nameStr = firmName ? `${firmName} (${customerName || "Customer"})` : (customerName || "Wholesale Customer");
  const totSales = Number(summary?.totalSales || 0);
  const totPaid = Number(summary?.totalPaid || 0);
  const totGR = Number(summary?.totalGR || 0);
  const totDiscount = Number(summary?.totalDiscount || 0);
  const balDue = Number(summary?.totalDue || 0);

  const lines = [
    `🛍️ *${storeName}* 🛍️`,
    `*Wholesale Customer Account Statement*`,
    ``,
    `Hello *${nameStr}*,`,
    `Here is the latest financial ledger summary of your wholesale account with us:`,
    ``,
    `📊 *Account Summary:*`,
    `• *Total Purchases / Bills:* ₹${totSales.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• *Total Paid:* ₹${totPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ];

  if (totGR > 0) {
    lines.push(`• *Total Goods Return (GR):* ₹${totGR.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }
  if (totDiscount > 0) {
    lines.push(`• *Total Kasar / Round Off / Maff:* ₹${totDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  lines.push(`• *Current Outstanding Balance Due:* ₹${balDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${balDue <= 0.01 ? "✅ (Fully Clear 🎉)" : "⚠️ (Due)"}`);
  lines.push(``);
  if (balDue <= 0.01) {
    lines.push(`✅ *Your Entire Wholesale Account is Fully Cleared & Settled!*`);
  }
  lines.push(`Thank you for your valuable business and partnership! 🙏`);
  if (storePhone) {
    lines.push(`📞 Contact: ${storePhone}`);
  }

  return lines.join("\n");
};

/**
 * Helper to fetch store contact details from admin user
 */
const getStoreContact = async () => {
  try {
    const adminUser = await User.findOne({ role: "admin" }).select("storeName storePhone storeWhatsapp");
    return {
      storeName: adminUser?.storeName || "Yashoda Fashion",
      storePhone: adminUser?.storeWhatsapp || adminUser?.storePhone || "",
    };
  } catch (e) {
    return { storeName: "Yashoda Fashion", storePhone: "" };
  }
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
  buildUdharMaffMessage,
  buildConsolidatedUdharMessage,
  buildVendorPaymentMessage,
  buildVendorStatementMessage,
  buildWholesaleBillCreatedMessage,
  buildWholesalePaymentMessage,
  buildWholesaleStatementMessage,
  sendMetaWhatsAppCloudApi,
  generateWhatsAppUrl,
  getStoreName,
  getStoreContact,
};


