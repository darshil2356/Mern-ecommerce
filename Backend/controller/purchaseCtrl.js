const Purchase = require("../models/purchaseModel");
const Vendor = require("../models/vendorModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

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
  if (initialPaid > 0) {
    payments.push({
      amount: initialPaid,
      date: rest.billDate || new Date(),
      mode: rest.initialPaymentMode || "Cash",
      referenceNo: rest.initialPaymentRef || "",
      note: rest.initialPaymentNote || "",
    });
  }
  const paidAmount = payments.reduce((a, p) => a + p.amount, 0);

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
    payments,
    billNo: rest.billNo || "",
    billDate: rest.billDate || new Date(),
    note: rest.note || "",
  });

  await purchase.populate("vendor", "name firmName phone gstin city state");
  res.json(purchase);
});

const getAllPurchases = asyncHandler(async (req, res) => {
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

  const purchase = await Purchase.findByIdAndUpdate(
    id,
    {
      ...rest,
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
    },
    { new: true, runValidators: true }
  ).populate("vendor", "name firmName phone gstin city state");

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
  const { amount, mode = "Cash", referenceNo = "", note = "", date } = req.body;

  if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid payment amount" });

  const purchase = await Purchase.findById(id);
  if (!purchase) return res.status(404).json({ message: "Purchase not found" });

  purchase.payments.push({ amount: parseFloat(amount), mode, referenceNo, note, date: date || new Date() });
  purchase.paidAmount = purchase.payments.reduce((a, p) => a + p.amount, 0);
  await purchase.save();

  await purchase.populate("vendor", "name firmName phone city");
  res.json(purchase);
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
  createPurchase,
  getAllPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  recordPayment,
  getPurchaseSummary,
};
