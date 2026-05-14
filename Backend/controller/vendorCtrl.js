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

module.exports = {
  createVendor,
  updateVendor,
  deleteVendor,
  getVendor,
  getAllVendors,
  getVendorLedger,
};
