const Purchase = require("../models/purchaseModel");
const Vendor = require("../models/vendorModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const {
  buildVendorPaymentMessage,
  generateWhatsAppUrl,
  sendMetaWhatsAppCloudApi,
  getStoreContact,
} = require("../utils/whatsappHelper");


// Recalculate item totals
function calcItem(item, gstType, taxIncluded) {
  const grossAmount = item.qty * item.rate;
  const discountAmount = item.discountPercent
    ? (grossAmount * item.discountPercent) / 100
    : item.discountAmount || 0;

  let taxableAmount = grossAmount - discountAmount;
  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0, taxAmount = 0;

  if (gstType === "CGST_SGST") {
    if (taxIncluded) {
      const rate = 1 + (item.cgstPercent + item.sgstPercent) / 100;
      taxableAmount = taxableAmount / rate;
    }
    cgstAmount = (taxableAmount * (item.cgstPercent || 0)) / 100;
    sgstAmount = (taxableAmount * (item.sgstPercent || 0)) / 100;
    taxAmount = cgstAmount + sgstAmount;
  } else if (gstType === "IGST") {
    if (taxIncluded) {
      const rate = 1 + (item.igstPercent) / 100;
      taxableAmount = taxableAmount / rate;
    }
    igstAmount = (taxableAmount * (item.igstPercent || 0)) / 100;
    taxAmount = igstAmount;
  }

  const total = taxableAmount + taxAmount;

  return {
    ...item,
    discountAmount: +discountAmount.toFixed(2),
    taxableAmount: +taxableAmount.toFixed(2),
    cgstAmount: +cgstAmount.toFixed(2),
    sgstAmount: +sgstAmount.toFixed(2),
    igstAmount: +igstAmount.toFixed(2),
    taxAmount: +taxAmount.toFixed(2),
    total: +total.toFixed(2),
  };
}

// Recalculate purchase settlement totals directly from payment records
const recalcPurchaseTotals = (purchase) => {
  const sumPaid = +(purchase.payments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0).toFixed(2);
  const sumDisc = +(purchase.payments || []).reduce((a, p) => a + (Number(p.discountAmount) || 0), 0).toFixed(2);
  const sumGr = +(purchase.payments || []).reduce((a, p) => a + (Number(p.grAmount) || 0), 0).toFixed(2);

  purchase.paidAmount = sumPaid;
  purchase.settlementDiscount = sumDisc;
  purchase.grAmount = sumGr;

  const totalSettled = +(sumPaid + sumDisc + sumGr).toFixed(2);
  purchase.balanceDue = Math.max(0, +(purchase.totalAmount - totalSettled).toFixed(2));
  if (totalSettled >= purchase.totalAmount) purchase.status = "PAID";
  else if (totalSettled > 0) purchase.status = "PARTIAL";
  else purchase.status = "PENDING";
};

// Auto-heal purchase balanceDue, settlement totals, and payment discount fields if out of sync
const autoHealPurchases = async () => {
  try {
    const purchases = await Purchase.find({});
    for (const p of purchases) {
      let needsSave = false;

      // Fix any payment that had discountValue > 0 but discountAmount was 0 or missing
      (p.payments || []).forEach(pay => {
        if ((!pay.discountAmount || pay.discountAmount === 0) && pay.discountValue > 0) {
          if (pay.discountType === "PERCENTAGE") {
            pay.discountAmount = +((p.totalAmount * pay.discountValue) / 100).toFixed(2);
          } else {
            pay.discountAmount = pay.discountValue;
            if (pay.discountType === "NONE") pay.discountType = "FLAT";
          }
          needsSave = true;
        }
      });

      const oldPaid = p.paidAmount || 0;
      const oldDisc = p.settlementDiscount || 0;
      const oldGr = p.grAmount || 0;
      const oldBal = p.balanceDue || 0;
      const oldStatus = p.status;

      recalcPurchaseTotals(p);

      if (
        needsSave ||
        oldPaid !== p.paidAmount ||
        oldDisc !== p.settlementDiscount ||
        oldGr !== p.grAmount ||
        oldBal !== p.balanceDue ||
        oldStatus !== p.status
      ) {
        await p.save();
      }
    }
  } catch (err) {
    console.error("Auto-heal purchases error:", err);
  }
};

const createPurchase = asyncHandler(async (req, res) => {
  const { vendor, items = [], gstType = "NONE", taxIncluded = false, ...rest } = req.body;

  validateMongoDbId(vendor);
  const vendorDoc = await Vendor.findById(vendor);
  if (!vendorDoc) return res.status(404).json({ message: "Vendor not found" });

  const calcItems = items.map(it => calcItem(it, gstType, taxIncluded));

  const subtotal = calcItems.reduce((a, i) => a + i.qty * i.rate - (i.discountAmount || 0), 0);
  const taxableAmount = calcItems.reduce((a, i) => a + i.taxableAmount, 0);
  const totalCGST = calcItems.reduce((a, i) => a + i.cgstAmount, 0);
  const totalSGST = calcItems.reduce((a, i) => a + i.sgstAmount, 0);
  const totalIGST = calcItems.reduce((a, i) => a + i.igstAmount, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const rawTotal = taxableAmount + totalTax;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = Math.round(rawTotal);

  // Initial payment if provided
  const payments = [];
  const initialPaid = parseFloat(rest.initialPaidAmount) || 0;
  let initialDiscType = rest.initialDiscountType || "NONE";
  const initialDiscVal = parseFloat(rest.initialDiscountValue) || 0;
  let initialDiscAmt = parseFloat(rest.initialDiscountAmount) || 0;

  if (!initialDiscAmt && initialDiscVal > 0) {
    if (initialDiscType === "PERCENTAGE") {
      initialDiscAmt = (totalAmount * initialDiscVal) / 100;
    } else {
      initialDiscType = "FLAT";
      initialDiscAmt = initialDiscVal;
    }
  } else if (initialDiscAmt > 0 && !initialDiscVal) {
    initialDiscVal = initialDiscAmt;
    if (initialDiscType === "NONE") initialDiscType = "FLAT";
  }
  const initialGrAmt = parseFloat(rest.initialGrAmount) || 0;
  const initialGrNote = rest.initialGrNote || "";

  if (initialPaid > 0 || initialDiscAmt > 0 || initialGrAmt > 0) {
    payments.push({
      amount: initialPaid,
      discountType: initialDiscType,
      discountValue: initialDiscVal,
      discountAmount: +initialDiscAmt.toFixed(2),
      grAmount: +initialGrAmt.toFixed(2),
      grNote: initialGrNote,
      date: rest.billDate || new Date(),
      mode: rest.initialPaymentMode || (initialPaid > 0 ? "Cash" : initialGrAmt > 0 ? "GR" : "Discount"),
      referenceNo: rest.initialPaymentRef || "",
      note: rest.initialPaymentNote || "",
    });
  }
  const paidAmount = payments.reduce((a, p) => a + (p.amount || 0), 0);
  const settlementDiscount = payments.reduce((a, p) => a + (p.discountAmount || 0), 0);
  const grAmount = payments.reduce((a, p) => a + (p.grAmount || 0), 0);

  const purchase = await Purchase.create({
    vendor,
    items: calcItems,
    gstType,
    taxIncluded,
    subtotal: +subtotal.toFixed(2),
    taxableAmount: +taxableAmount.toFixed(2),
    discountAmount: rest.discountAmount || 0,
    totalCGST: +totalCGST.toFixed(2),
    totalSGST: +totalSGST.toFixed(2),
    totalIGST: +totalIGST.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    roundOff: +roundOff.toFixed(2),
    totalAmount,
    paidAmount,
    settlementDiscount,
    grAmount,
    payments,
    billNo: rest.billNo || "",
    billDate: rest.billDate || new Date(),
    note: rest.note || "",
  });

  await purchase.populate("vendor", "name firmName phone gstin city state");
  res.json(purchase);
});

const getAllPurchases = asyncHandler(async (req, res) => {
  await autoHealPurchases();

  const { vendor, status, startDate, endDate, search, page = 1, limit = 50, onlyGST } = req.query;
  const filter = {};

  if (vendor) filter.vendor = vendor;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.billDate.$lte = end;
    }
  }
  if (search) filter.billNo = { $regex: search, $options: "i" };
  // Default view: only GST bills. Pass onlyGST=false to show all (Non-GST included)
  if (onlyGST !== "false") filter.gstType = { $in: ["CGST_SGST", "IGST"] };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .populate("vendor", "name firmName phone city")
      .sort({ billDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Purchase.countDocuments(filter),
  ]);

  const aggResult = await Purchase.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$balanceDue" },
      },
    },
  ]);
  const totals = aggResult[0] || { totalAmount: 0, totalPaid: 0, totalDue: 0 };

  res.json({ purchases, total, page: parseInt(page), totals });
});

const getPurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const purchase = await Purchase.findById(id).populate("vendor");
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });
  res.json(purchase);
});

const updatePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const { items = [], gstType = "NONE", taxIncluded = false, ...rest } = req.body;

  const purchase = await Purchase.findById(id);
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });

  const calcItems = items.map(it => calcItem(it, gstType, taxIncluded));
  const subtotal = calcItems.reduce((a, i) => a + i.qty * i.rate - (i.discountAmount || 0), 0);
  const taxableAmount = calcItems.reduce((a, i) => a + i.taxableAmount, 0);
  const totalCGST = calcItems.reduce((a, i) => a + i.cgstAmount, 0);
  const totalSGST = calcItems.reduce((a, i) => a + i.sgstAmount, 0);
  const totalIGST = calcItems.reduce((a, i) => a + i.igstAmount, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const rawTotal = taxableAmount + totalTax;
  const roundOff = Math.round(rawTotal) - rawTotal;
  const totalAmount = Math.round(rawTotal);

  Object.assign(purchase, rest, {
    items: calcItems,
    gstType,
    taxIncluded,
    subtotal: +subtotal.toFixed(2),
    taxableAmount: +taxableAmount.toFixed(2),
    totalCGST: +totalCGST.toFixed(2),
    totalSGST: +totalSGST.toFixed(2),
    totalIGST: +totalIGST.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    roundOff: +roundOff.toFixed(2),
    totalAmount,
  });

  await purchase.save();
  await purchase.populate("vendor", "name firmName phone gstin city state");

  res.json(purchase);
});

const deletePurchase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const purchase = await Purchase.findByIdAndDelete(id);
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });
  res.json({ message: "Deleted successfully" });
});

const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const {
    amount,
    discountType = "NONE",
    discountValue = 0,
    discountAmount = 0,
    grAmount = 0,
    grNote = "",
    mode = "Cash",
    referenceNo = "",
    note = "",
    date,
  } = req.body;

  const paidAmt = parseFloat(amount) || 0;
  let discVal = parseFloat(discountValue) || 0;
  let discAmt = parseFloat(discountAmount) || 0;
  const grAmt = parseFloat(grAmount) || 0;

  const purchase = await Purchase.findById(id);
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });

  let effDiscType = discountType;
  if (!discAmt && discVal > 0) {
    if (effDiscType === "PERCENTAGE") {
      discAmt = (purchase.totalAmount * discVal) / 100;
    } else {
      effDiscType = "FLAT";
      discAmt = discVal;
    }
  } else if (discAmt > 0 && !discVal) {
    discVal = discAmt;
    if (effDiscType === "NONE") effDiscType = "FLAT";
  }

  if (paidAmt <= 0 && discAmt <= 0 && grAmt <= 0) {
    return res.status(400).json({ message: "Enter a valid paid, discount, or GR amount" });
  }

  const newPayment = {
    amount: paidAmt,
    discountType: effDiscType,
    discountValue: discVal,
    discountAmount: +discAmt.toFixed(2),
    grAmount: +grAmt.toFixed(2),
    grNote,
    mode: mode || (paidAmt > 0 ? "Cash" : grAmt > 0 ? "GR" : "Discount"),
    referenceNo,
    note,
    date: date || new Date(),
  };

  purchase.payments.push(newPayment);
  recalcPurchaseTotals(purchase);

  await purchase.save();
  await purchase.populate("vendor", "name firmName phone city openingBalance");

  // Calculate overall vendor balance
  let overallVendorBalance = undefined;
  if (purchase.vendor) {
    const allVendorPurchases = await Purchase.find({ vendor: purchase.vendor._id });
    const vendorBillsDue = allVendorPurchases.reduce((acc, p) => acc + (p.balanceDue || 0), 0);
    overallVendorBalance = (purchase.vendor.openingBalance || 0) + vendorBillsDue;
  }

  // Get Store Contact Details
  const { storeName, storePhone } = await getStoreContact();

  const totalSettlement = paidAmt + +discAmt.toFixed(2) + +grAmt.toFixed(2);

  const whatsappMessage = buildVendorPaymentMessage({
    vendorName: purchase.vendor?.name,
    firmName: purchase.vendor?.firmName,
    billNo: purchase.billNo,
    billDate: purchase.billDate,
    paymentDate: date || new Date(),
    amountPaid: paidAmt,
    paymentMode: newPayment.mode,
    referenceNo,
    discountAmount: +discAmt.toFixed(2),
    grAmount: +grAmt.toFixed(2),
    grNote,
    totalSettlement,
    billTotal: purchase.totalAmount,
    billBalanceDue: purchase.balanceDue,
    billStatus: purchase.status,
    overallVendorBalance,
    storeName,
    storePhone,
  });

  const vendorPhone = purchase.vendor?.phone;
  const whatsappUrl = generateWhatsAppUrl({ phone: vendorPhone, messageText: whatsappMessage });

  let whatsappSent = false;
  if (vendorPhone) {
    const apiResult = await sendMetaWhatsAppCloudApi({ phone: vendorPhone, messageText: whatsappMessage });
    whatsappSent = apiResult.success;
  }

  const resData = purchase.toObject();
  resData.whatsappMessage = whatsappMessage;
  resData.whatsappUrl = whatsappUrl;
  resData.whatsappSent = whatsappSent;
  resData.vendorPhone = vendorPhone || "";

  res.json(resData);
});

// Update an existing payment entry in purchase
const updatePayment = asyncHandler(async (req, res) => {
  const { id, paymentId } = req.params;
  validateMongoDbId(id);
  validateMongoDbId(paymentId);

  const purchase = await Purchase.findById(id);
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });

  const payment = purchase.payments.id(paymentId);
  if (!payment) return res.status(404).json({ message: "Payment entry not found" });

  const {
    amount,
    discountType = "NONE",
    discountValue = 0,
    discountAmount = 0,
    grAmount = 0,
    grNote = "",
    mode = "Cash",
    referenceNo = "",
    note = "",
    date,
  } = req.body;

  const paidAmt = parseFloat(amount) || 0;
  let discVal = parseFloat(discountValue) || 0;
  let discAmt = parseFloat(discountAmount) || 0;
  const grAmt = parseFloat(grAmount) || 0;

  let effDiscType = discountType;
  if (!discAmt && discVal > 0) {
    if (effDiscType === "PERCENTAGE") {
      discAmt = (purchase.totalAmount * discVal) / 100;
    } else {
      effDiscType = "FLAT";
      discAmt = discVal;
    }
  } else if (discAmt > 0 && !discVal) {
    discVal = discAmt;
    if (effDiscType === "NONE") effDiscType = "FLAT";
  }

  if (paidAmt <= 0 && discAmt <= 0 && grAmt <= 0) {
    return res.status(400).json({ message: "Enter a valid paid, discount, or GR amount" });
  }

  payment.amount = paidAmt;
  payment.discountType = effDiscType;
  payment.discountValue = discVal;
  payment.discountAmount = +discAmt.toFixed(2);
  payment.grAmount = +grAmt.toFixed(2);
  payment.grNote = grNote || "";
  payment.mode = mode || (paidAmt > 0 ? "Cash" : grAmt > 0 ? "GR" : "Discount");
  payment.referenceNo = referenceNo || "";
  payment.note = note || "";
  if (date) payment.date = new Date(date);

  recalcPurchaseTotals(purchase);

  await purchase.save();
  await purchase.populate("vendor", "name firmName phone city openingBalance");

  res.json({ success: true, message: "Payment entry updated successfully", purchase });
});

// Delete an existing payment entry from purchase
const deletePayment = asyncHandler(async (req, res) => {
  const { id, paymentId } = req.params;
  validateMongoDbId(id);
  validateMongoDbId(paymentId);

  const purchase = await Purchase.findById(id);
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });

  const paymentIndex = purchase.payments.findIndex(p => p._id.toString() === paymentId);
  if (paymentIndex === -1) return res.status(404).json({ message: "Payment entry not found" });

  purchase.payments.splice(paymentIndex, 1);
  recalcPurchaseTotals(purchase);

  await purchase.save();
  await purchase.populate("vendor", "name firmName phone city openingBalance");

  res.json({ success: true, message: "Payment entry deleted successfully", purchase });
});

const getPurchaseSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const m = parseInt(month) || new Date().getMonth() + 1;
  const y = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59, 999);

  const [byVendor, totals, monthly] = await Promise.all([
    Purchase.aggregate([
      { $match: { billDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$vendor",
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
      {
        $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
      { $sort: { totalAmount: -1 } },
    ]),
    Purchase.aggregate([
      { $match: { billDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          totalTax: { $sum: "$totalTax" },
          totalTaxable: { $sum: "$taxableAmount" },
          billCount: { $sum: 1 },
        },
      },
    ]),
    Purchase.aggregate([
      {
        $group: {
          _id: { year: { $year: "$billDate" }, month: { $month: "$billDate" } },
          totalAmount: { $sum: "$totalAmount" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({
    period: { month: m, year: y },
    totals: totals[0] || { totalAmount: 0, totalPaid: 0, totalDue: 0, totalTax: 0, billCount: 0 },
    byVendor,
    monthly,
  });
});

module.exports = {
  autoHealPurchases,
  createPurchase,
  getAllPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  recordPayment,
  updatePayment,
  deletePayment,
  getPurchaseSummary,
};
