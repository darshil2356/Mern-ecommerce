const Vendor = require("../models/vendorModel");
const Purchase = require("../models/purchaseModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
  res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findByIdAndDelete(id);
  res.json(vendor);
});

const getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json(vendor);
});

const getAllVendors = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { firmName: { $regex: search, $options: "i" } },
    { phone: { $regex: search, $options: "i" } },
  ];

  const vendors = await Vendor.find(filter).sort({ name: 1 });

  // Attach purchase totals
  const vendorIds = vendors.map(v => v._id);
  const stats = await Purchase.aggregate([
    { $match: { vendor: { $in: vendorIds } } },
    {
      $group: {
        _id: "$vendor",
        totalPurchases: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$balanceDue" },
        billCount: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  stats.forEach(s => { statsMap[s._id.toString()] = s; });

  const result = vendors.map(v => {
    const s = statsMap[v._id.toString()] || {};
    return {
      ...v.toObject(),
      totalPurchases: s.totalPurchases || 0,
      totalPaid: s.totalPaid || 0,
      totalDue: s.totalDue || 0,
      billCount: s.billCount || 0,
    };
  });

  const grandTotal = {
    totalPurchases: result.reduce((a, v) => a + v.totalPurchases, 0),
    totalPaid: result.reduce((a, v) => a + v.totalPaid, 0),
    totalDue: result.reduce((a, v) => a + v.totalDue, 0),
  };

  res.json({ vendors: result, grandTotal });
});

const getVendorLedger = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const { startDate, endDate } = req.query;
  const filter = { vendor: id };
  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.billDate.$lte = end;
    }
  }

  const purchases = await Purchase.find(filter).sort({ billDate: 1, createdAt: 1 });

  // Build ledger entries: each bill + each payment
  const entries = [];
  let balance = vendor.openingBalance || 0;

  if (vendor.openingBalance) {
    entries.push({
      date: vendor.createdAt,
      type: "OPENING",
      description: "Opening Balance",
      debit: vendor.openingBalance,
      credit: 0,
      balance,
      billNo: "",
    });
  }

  purchases.forEach(p => {
    // Bill entry (we owe vendor this amount)
    balance += p.totalAmount;
    entries.push({
      date: p.billDate,
      type: "BILL",
      description: `Purchase Bill${p.billNo ? " #" + p.billNo : ""}`,
      debit: p.totalAmount,
      credit: 0,
      balance,
      billNo: p.billNo,
      purchaseId: p._id,
      status: p.status,
    });

    // Payment entries (we paid vendor)
    (p.payments || []).forEach(pay => {
      balance -= pay.amount;
      entries.push({
        date: pay.date,
        type: "PAYMENT",
        description: `Payment (${pay.mode})${pay.referenceNo ? " Ref: " + pay.referenceNo : ""}`,
        debit: 0,
        credit: pay.amount,
        balance,
        billNo: p.billNo,
        purchaseId: p._id,
        paymentMode: pay.mode,
      });
    });
  });

  const totalDebit = entries.filter(e => e.type === "BILL").reduce((a, e) => a + e.debit, 0);
  const totalCredit = entries.filter(e => e.type === "PAYMENT").reduce((a, e) => a + e.credit, 0);

  res.json({
    vendor,
    entries,
    summary: {
      totalPurchases: totalDebit,
      totalPaid: totalCredit,
      balanceDue: balance,
    },
  });
});

const getVendorDashboardStats = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    vendorCounts,
    purchaseTotals,
    overdueBills,
    topVendorsByDue,
    topVendorsByPurchase,
    gstBreakdown,
    monthlyTrends
  ] = await Promise.all([
    // 1. Vendor counts
    Vendor.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    // 2. Purchase Grand Totals & Bill Statuses
    Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          totalTax: { $sum: "$totalTax" },
          totalTaxable: { $sum: "$taxableAmount" },
          totalBills: { $sum: 1 },
          paidBills: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
          partialBills: { $sum: { $cond: [{ $eq: ["$status", "PARTIAL"] }, 1, 0] } },
          pendingBills: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
        },
      },
    ]),

    // 3. Overdue (30+ Days) Bills with balanceDue > 0
    Purchase.find({
      balanceDue: { $gt: 0 },
      billDate: { $lte: thirtyDaysAgo },
    })
      .populate("vendor", "name firmName phone city gstin")
      .sort({ billDate: 1 }),

    // 4. Top Vendors by Balance Due
    Purchase.aggregate([
      { $match: { balanceDue: { $gt: 0 } } },
      {
        $group: {
          _id: "$vendor",
          totalDue: { $sum: "$balanceDue" },
          totalPurchases: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { totalDue: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    ]),

    // 5. Top Vendors by Total Purchases
    Purchase.aggregate([
      {
        $group: {
          _id: "$vendor",
          totalPurchases: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    ]),

    // 6. GST vs Non-GST Breakdown
    Purchase.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $in: ["$gstType", ["CGST_SGST", "IGST"]] },
              "GST",
              "NON_GST",
            ],
          },
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
    ]),

    // 7. Monthly Trends (Last 6 Months)
    Purchase.aggregate([
      {
        $group: {
          _id: { year: { $year: "$billDate" }, month: { $month: "$billDate" } },
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
          balanceDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]),
  ]);

  // Process Vendor counts
  const totalVendors = vendorCounts.reduce((acc, v) => acc + v.count, 0);
  const activeVendors = (vendorCounts.find(v => v._id === "ACTIVE") || {}).count || 0;

  // Process Overdue Vendors
  const now = Date.now();
  const overdueVendorMap = {};

  overdueBills.forEach(b => {
    if (!b.vendor) return;
    const vId = b.vendor._id.toString();
    const daysOverdue = Math.floor((now - new Date(b.billDate).getTime()) / (1000 * 60 * 60 * 24));

    if (!overdueVendorMap[vId]) {
      overdueVendorMap[vId] = {
        vendor: b.vendor,
        overdueAmount: 0,
        overdueBillCount: 0,
        oldestBillDate: b.billDate,
        maxDaysOverdue: daysOverdue,
        bills: [],
      };
    }

    overdueVendorMap[vId].overdueAmount += b.balanceDue;
    overdueVendorMap[vId].overdueBillCount += 1;
    if (daysOverdue > overdueVendorMap[vId].maxDaysOverdue) {
      overdueVendorMap[vId].maxDaysOverdue = daysOverdue;
      overdueVendorMap[vId].oldestBillDate = b.billDate;
    }
    overdueVendorMap[vId].bills.push({
      _id: b._id,
      billNo: b.billNo,
      billDate: b.billDate,
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
      balanceDue: b.balanceDue,
      daysOverdue,
    });
  });

  const overdue30DaysVendors = Object.values(overdueVendorMap).sort(
    (a, b) => b.maxDaysOverdue - a.maxDaysOverdue
  );

  const totalOverdueAmount = overdue30DaysVendors.reduce((acc, v) => acc + v.overdueAmount, 0);

  res.json({
    summary: {
      totalVendors,
      activeVendors,
      ...(purchaseTotals[0] || {
        totalPurchases: 0,
        totalPaid: 0,
        totalDue: 0,
        totalTax: 0,
        totalTaxable: 0,
        totalBills: 0,
        paidBills: 0,
        partialBills: 0,
        pendingBills: 0,
      }),
      overdue30DaysBillCount: overdueBills.length,
      overdue30DaysVendorCount: overdue30DaysVendors.length,
      totalOverdueAmount,
    },
    overdue30DaysVendors,
    topVendorsByDue,
    topVendorsByPurchase,
    gstBreakdown,
    monthlyTrends,
  });
});

module.exports = {
  createVendor,
  updateVendor,
  deleteVendor,
  getVendor,
  getAllVendors,
  getVendorLedger,
  getVendorDashboardStats,
};

