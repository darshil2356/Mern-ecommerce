const Udhar = require("../models/udharModel");
const asyncHandler = require("express-async-handler");
const {
  buildUdharPurchaseMessage,
  buildUdharPaymentMessage,
  buildConsolidatedUdharMessage,
  sendMetaWhatsAppCloudApi,
  generateWhatsAppUrl,
  getStoreName,
} = require("../utils/whatsappHelper");

// POST /udhar/add
const addUdhar = asyncHandler(async (req, res) => {
  const { type, personName, personPhone, orderId, productDetails, totalAmount, paidAmount, dueDate, note, paymentMode } = req.body;

  if (!type || !personName || totalAmount === undefined || totalAmount === null) {
    res.status(400);
    throw new Error("type, personName, and totalAmount are required");
  }

  const initialPaid = Number(paidAmount || 0);
  const total = Number(totalAmount);

  let udhar = null;
  if (orderId) {
    udhar = await Udhar.findOne({ orderId });
  }

  if (udhar) {
    udhar.personName = personName;
    if (personPhone) udhar.personPhone = personPhone;
    udhar.totalAmount = total;
    udhar.paidAmount = initialPaid;
    if (dueDate) udhar.dueDate = dueDate;
    if (note) udhar.note = note;
    if (initialPaid > 0 && udhar.payments.length === 0) {
      udhar.payments.push({ amount: initialPaid, date: new Date(), note: note || "Initial Payment", isInitialPayment: true });
    }
    await udhar.save();
  } else {
    udhar = await Udhar.create({
      type,
      personName,
      personPhone,
      orderId: orderId || null,
      productDetails: productDetails || "",
      totalAmount: total,
      paidAmount: initialPaid,
      payments: initialPaid > 0 ? [{ amount: initialPaid, date: new Date(), note: note || "Initial Payment", isInitialPayment: true }] : [],
      dueDate: dueDate || null,
      note: note || "",
    });
  }

  // Update corresponding Order if linked
  if (orderId) {
    const Order = require("../models/orderModel");
    const existingOrder = await Order.findById(orderId);
    if (existingOrder) {
      existingOrder.amountPaid = initialPaid;
      if (paymentMode) {
        existingOrder.paymentDestination = paymentMode === "CASH" ? "CASH" : "CURRENT_ACCOUNT";
        existingOrder.mode = paymentMode === "CASH" ? "OFFLINE" : "ONLINE";
      }
      await existingOrder.save();
    }
  }

  // Generate WhatsApp notification message
  const storeName = await getStoreName();
  const remaining = Math.max(0, udhar.totalAmount - udhar.paidAmount);
  const whatsappMessage = buildUdharPurchaseMessage({
    personName: udhar.personName,
    totalAmount: udhar.totalAmount,
    paidAmount: udhar.paidAmount,
    remainingAmount: remaining,
    dueDate: udhar.dueDate,
    storeName,
  });

  const whatsappUrl = generateWhatsAppUrl({ phone: udhar.personPhone, messageText: whatsappMessage });

  let whatsappSent = false;
  if (udhar.personPhone) {
    const apiResult = await sendMetaWhatsAppCloudApi({ phone: udhar.personPhone, messageText: whatsappMessage });
    whatsappSent = apiResult.success;
  }

  res.status(201).json({
    success: true,
    data: udhar,
    whatsappMessage,
    whatsappUrl,
    whatsappSent,
  });
});

// POST /udhar/:id/pay  — record a partial or full payment
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;

  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error("Valid payment amount is required");
  }

  const udhar = await Udhar.findById(req.params.id);
  if (!udhar) { res.status(404); throw new Error("Udhar entry not found"); }

  if (udhar.status === "CLEARED") {
    res.status(400);
    throw new Error("This udhar is already cleared");
  }

  const paying = Number(amount);
  const remainingBefore = udhar.totalAmount - udhar.paidAmount;

  if (paying > remainingBefore) {
    res.status(400);
    throw new Error(`Cannot pay more than remaining amount ₹${remainingBefore}`);
  }

  udhar.paidAmount += paying;
  udhar.payments.push({ amount: paying, note: note || "" });
  await udhar.save();

  const remainingAfter = Math.max(0, udhar.totalAmount - udhar.paidAmount);

  // Generate WhatsApp confirmation message
  const storeName = await getStoreName();
  const whatsappMessage = buildUdharPaymentMessage({
    personName: udhar.personName,
    amountPaid: paying,
    totalPaid: udhar.paidAmount,
    remainingAmount: remainingAfter,
    status: udhar.status,
    storeName,
  });

  const whatsappUrl = generateWhatsAppUrl({ phone: udhar.personPhone, messageText: whatsappMessage });

  let whatsappSent = false;
  if (udhar.personPhone) {
    const apiResult = await sendMetaWhatsAppCloudApi({ phone: udhar.personPhone, messageText: whatsappMessage });
    whatsappSent = apiResult.success;
  }

  res.json({
    success: true,
    data: udhar,
    whatsappMessage,
    whatsappUrl,
    whatsappSent,
  });
});

// GET /udhar?type=&status=&search=&startDate=&endDate=
const getAll = asyncHandler(async (req, res) => {
  const { type, status, search, startDate, endDate } = req.query;
  const filter = {};

  if (type) filter.type = type;

  if (search) {
    filter.$or = [
      { personName: { $regex: search, $options: "i" } },
      { personPhone: { $regex: search, $options: "i" } },
      { productDetails: { $regex: search, $options: "i" } },
    ];
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = e;
    }
  }

  let records = await Udhar.find(filter).sort({ createdAt: -1 });

  // Auto-heal DB status if paidAmount >= totalAmount
  for (let r of records) {
    const paid = Number(r.paidAmount || 0);
    const total = Number(r.totalAmount || 0);
    if (total > 0 && paid >= total && r.status !== "CLEARED") {
      r.status = "CLEARED";
      await Udhar.updateOne({ _id: r._id }, { $set: { status: "CLEARED" } });
    }
  }

  // Filter by isHidden state: HIDDEN tab shows hidden entries, all other tabs show active entries
  if (status === "HIDDEN") {
    records = records.filter(r => r.isHidden === true);
  } else {
    records = records.filter(r => r.isHidden !== true);
    if (status === "PENDING_PARTIAL") {
      records = records.filter(r => {
        const paid = Number(r.paidAmount || 0);
        const total = Number(r.totalAmount || 0);
        const remaining = Math.max(0, total - paid);
        return r.status !== "CLEARED" && remaining > 0.01;
      });
    } else if (status === "PENDING") {
      records = records.filter(r => {
        const paid = Number(r.paidAmount || 0);
        const total = Number(r.totalAmount || 0);
        const remaining = Math.max(0, total - paid);
        return (r.status === "PENDING" || paid === 0) && remaining > 0.01;
      });
    } else if (status === "PARTIAL") {
      records = records.filter(r => {
        const paid = Number(r.paidAmount || 0);
        const total = Number(r.totalAmount || 0);
        const remaining = Math.max(0, total - paid);
        return (r.status === "PARTIAL" || (paid > 0 && paid < total)) && remaining > 0.01;
      });
    } else if (status === "CLEARED") {
      records = records.filter(r => {
        const paid = Number(r.paidAmount || 0);
        const total = Number(r.totalAmount || 0);
        const remaining = Math.max(0, total - paid);
        return r.status === "CLEARED" || remaining <= 0.01 || (total > 0 && paid >= total);
      });
    }
  }

  // Compute overall total pending balance across all active, non-hidden records
  const allRecords = await Udhar.find();
  const totalPending = allRecords
    .filter(r => r.isHidden !== true && r.status !== "CLEARED" && (Number(r.totalAmount || 0) - Number(r.paidAmount || 0)) > 0.01)
    .reduce((s, r) => s + Math.max(0, Number(r.totalAmount || 0) - Number(r.paidAmount || 0)), 0);

  res.json({ success: true, data: records, totalPending });
});

// PUT /udhar/:id/toggle-hide — Toggle hide/unhide state for ALL bills of a customer
const toggleHideUdhar = asyncHandler(async (req, res) => {
  const udhar = await Udhar.findById(req.params.id);
  if (!udhar) {
    res.status(404);
    throw new Error("Udhar entry not found");
  }

  const newHiddenState = !udhar.isHidden;
  const searchConditions = [];

  if (udhar.personName && udhar.personName.trim()) {
    // Escape special regex characters in name
    const escapedName = udhar.personName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    searchConditions.push({ personName: { $regex: `^${escapedName}$`, $options: "i" } });
  }

  if (udhar.personPhone && udhar.personPhone.trim()) {
    searchConditions.push({ personPhone: udhar.personPhone.trim() });
  }

  if (searchConditions.length > 0) {
    await Udhar.updateMany(
      { $or: searchConditions },
      { $set: { isHidden: newHiddenState } }
    );
  } else {
    udhar.isHidden = newHiddenState;
    await udhar.save();
  }

  res.json({
    success: true,
    data: udhar,
    newHiddenState,
    personName: udhar.personName,
    message: newHiddenState
      ? `All Udhar entries for customer "${udhar.personName}" are now hidden.`
      : `All Udhar entries for customer "${udhar.personName}" are restored to active list.`,
  });
});

// POST /udhar/send-customer-reminder — Send single consolidated Udhar reminder (all bills grouped) for a customer
const sendCustomerReminder = asyncHandler(async (req, res) => {
  const { personPhone, personName } = req.body;

  if (!personPhone && !personName) {
    res.status(400);
    throw new Error("Customer phone or name is required");
  }

  const searchConditions = [];
  if (personPhone && personPhone.trim()) {
    const cleanDigits = personPhone.trim().replace(/\D/g, "");
    if (cleanDigits) {
      searchConditions.push({ personPhone: { $regex: cleanDigits } });
    }
  }
  if (personName && personName.trim()) {
    const escapedName = personName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    searchConditions.push({ personName: { $regex: `^${escapedName}$`, $options: "i" } });
  }

  if (searchConditions.length === 0) {
    res.status(400);
    throw new Error("Invalid customer identifier");
  }

  // 1. Check if customer is HIDDEN — STRICT PROTECTION: Do NOT send reminder to hidden customers!
  const isCustomerHidden = await Udhar.exists({
    $or: searchConditions,
    isHidden: true,
  });

  if (isCustomerHidden) {
    res.status(400);
    throw new Error("Cannot send reminder: Customer is hidden or archived. Unhide customer first to send messages.");
  }

  // 2. Fetch all non-hidden, non-cleared bills for this customer
  const bills = await Udhar.find({
    $or: searchConditions,
    isHidden: { $ne: true },
    status: { $ne: "CLEARED" },
  }).sort({ createdAt: 1 });

  const activeBills = bills.filter(b => {
    const remaining = Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0));
    return remaining > 0.01;
  });

  if (activeBills.length === 0) {
    res.status(400);
    throw new Error("No active pending bills found for this customer.");
  }

  // Get Store Info
  const User = require("../models/userModel");
  const adminUser = await User.findOne({ role: "admin" }).select("storeName storePhone");
  const storeName = adminUser?.storeName || "Yashoda Fashion";
  const storePhone = adminUser?.storePhone || "";

  const targetName = activeBills[0]?.personName || personName || "Customer";
  const targetPhone = activeBills[0]?.personPhone || personPhone || "";

  // 3. Build ONE consolidated message for ALL bills
  const whatsappMessage = buildConsolidatedUdharMessage({
    personName: targetName,
    bills: activeBills,
    storeName,
    storePhone,
  });

  const whatsappUrl = generateWhatsAppUrl({ phone: targetPhone, messageText: whatsappMessage });

  let whatsappSent = false;
  if (targetPhone) {
    const apiResult = await sendMetaWhatsAppCloudApi({ phone: targetPhone, messageText: whatsappMessage });
    whatsappSent = apiResult.success;
  }

  const totalRemaining = activeBills.reduce((s, b) => s + Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0)), 0);

  res.json({
    success: true,
    personName: targetName,
    personPhone: targetPhone,
    billCount: activeBills.length,
    totalRemaining,
    whatsappMessage,
    whatsappUrl,
    whatsappSent,
  });
});

// POST /udhar/send-all-reminders — Consolidated reminders for ALL active non-hidden customers
const sendAllCustomerReminders = asyncHandler(async (req, res) => {
  // Fetch all active non-hidden, non-cleared records
  const allRecords = await Udhar.find({
    isHidden: { $ne: true },
    status: { $ne: "CLEARED" },
  }).sort({ createdAt: 1 });

  // Group by customer key (phone or lowercased name)
  const customerMap = new Map();
  allRecords.forEach(r => {
    const remaining = Math.max(0, Number(r.totalAmount || 0) - Number(r.paidAmount || 0));
    if (remaining <= 0.01) return;

    const phoneKey = r.personPhone ? r.personPhone.trim().replace(/\D/g, "") : "";
    const nameKey = r.personName ? r.personName.trim().toLowerCase() : "";
    const key = phoneKey || nameKey;

    if (!key) return;

    if (!customerMap.has(key)) {
      customerMap.set(key, {
        personName: r.personName,
        personPhone: r.personPhone,
        bills: [],
      });
    }
    customerMap.get(key).bills.push(r);
  });

  const User = require("../models/userModel");
  const adminUser = await User.findOne({ role: "admin" }).select("storeName storePhone");
  const storeName = adminUser?.storeName || "Yashoda Fashion";
  const storePhone = adminUser?.storePhone || "";

  const results = [];
  for (const [key, cust] of customerMap.entries()) {
    const whatsappMessage = buildConsolidatedUdharMessage({
      personName: cust.personName,
      bills: cust.bills,
      storeName,
      storePhone,
    });
    const whatsappUrl = generateWhatsAppUrl({ phone: cust.personPhone, messageText: whatsappMessage });

    let whatsappSent = false;
    if (cust.personPhone) {
      const apiRes = await sendMetaWhatsAppCloudApi({ phone: cust.personPhone, messageText: whatsappMessage });
      whatsappSent = apiRes.success;
    }

    const totalRemaining = cust.bills.reduce((s, b) => s + Math.max(0, Number(b.totalAmount || 0) - Number(b.paidAmount || 0)), 0);

    results.push({
      personName: cust.personName,
      personPhone: cust.personPhone,
      billCount: cust.bills.length,
      totalRemaining,
      whatsappMessage,
      whatsappUrl,
      whatsappSent,
    });
  }

  res.json({
    success: true,
    totalCustomers: results.length,
    data: results,
  });
});

// GET /udhar/:id
const getOne = asyncHandler(async (req, res) => {
  const udhar = await Udhar.findById(req.params.id);
  if (!udhar) { res.status(404); throw new Error("Not found"); }
  res.json({ success: true, data: udhar });
});

// DELETE /udhar/:id
const deleteUdhar = asyncHandler(async (req, res) => {
  const udhar = await Udhar.findByIdAndDelete(req.params.id);
  if (!udhar) { res.status(404); throw new Error("Not found"); }
  res.json({ success: true, message: "Deleted" });
});

module.exports = {
  addUdhar,
  recordPayment,
  getAll,
  getOne,
  deleteUdhar,
  toggleHideUdhar,
  sendCustomerReminder,
  sendAllCustomerReminders,
};

