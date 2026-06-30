const asyncHandler = require("express-async-handler");
const WholesaleCustomer = require("../models/wholesaleCustomerModel");
const WholesaleBill = require("../models/wholesaleBillModel");

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

// GET /api/wholesale/customers
const getAllCustomers = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { firmName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const customers = await WholesaleCustomer.find(filter).sort({ name: 1 });

  // Attach total sales, paid, due per customer
  const enriched = await Promise.all(
    customers.map(async (c) => {
      const bills = await WholesaleBill.find({ customer: c._id });
      const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
      const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);
      const totalDue = bills.reduce((s, b) => s + b.balanceDue, 0) + (c.openingBalance || 0);
      return { ...c.toObject(), totalSales, totalPaid, totalDue, billCount: bills.length };
    })
  );

  res.json({ success: true, data: enriched });
});

// POST /api/wholesale/customers
const createCustomer = asyncHandler(async (req, res) => {
  const { name, firmName, phone, altPhone, city, gstin, openingBalance, note } = req.body;
  if (!name || !phone) {
    res.status(400);
    throw new Error("name and phone are required");
  }
  const customer = await WholesaleCustomer.create({
    name, firmName, phone, altPhone, city, gstin,
    openingBalance: openingBalance || 0,
    note,
  });
  res.status(201).json({ success: true, data: customer });
});

// PUT /api/wholesale/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await WholesaleCustomer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!customer) { res.status(404); throw new Error("Customer not found"); }
  res.json({ success: true, data: customer });
});

// DELETE /api/wholesale/customers/:id
const deleteCustomer = asyncHandler(async (req, res) => {
  const bills = await WholesaleBill.countDocuments({ customer: req.params.id });
  if (bills > 0) {
    res.status(400);
    throw new Error(`Cannot delete: ${bills} bill(s) exist for this customer`);
  }
  await WholesaleCustomer.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Customer deleted" });
});

// ─── BILLS ────────────────────────────────────────────────────────────────────

// GET /api/wholesale/bills
const getAllBills = asyncHandler(async (req, res) => {
  const { customer, status, startDate, endDate, search, page = 1, limit = 50 } = req.query;
  const filter = {};

  if (customer) filter.customer = customer;
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) { const s = new Date(startDate); s.setHours(0, 0, 0, 0); filter.billDate.$gte = s; }
    if (endDate) { const e = new Date(endDate); e.setHours(23, 59, 59, 999); filter.billDate.$lte = e; }
  }
  if (search) {
    filter.$or = [
      { billNo: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [bills, total] = await Promise.all([
    WholesaleBill.find(filter)
      .populate("customer", "name firmName phone city")
      .sort({ billDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    WholesaleBill.countDocuments(filter),
  ]);

  const totalSales = await WholesaleBill.aggregate([
    { $match: filter },
    { $group: { _id: null, totalAmount: { $sum: "$totalAmount" }, totalPaid: { $sum: "$paidAmount" }, totalDue: { $sum: "$balanceDue" } } },
  ]);
  const agg = totalSales[0] || { totalAmount: 0, totalPaid: 0, totalDue: 0 };

  res.json({
    success: true,
    data: bills,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    summary: { totalAmount: agg.totalAmount, totalPaid: agg.totalPaid, totalDue: agg.totalDue },
  });
});

// GET /api/wholesale/bills/:id
const getBill = asyncHandler(async (req, res) => {
  const bill = await WholesaleBill.findById(req.params.id).populate("customer");
  if (!bill) { res.status(404); throw new Error("Bill not found"); }
  res.json({ success: true, data: bill });
});

// POST /api/wholesale/bills
const createBill = asyncHandler(async (req, res) => {
  const { billNo, billDate, customer, description, totalAmount, note, initialPayment } = req.body;

  if (!billNo || !customer || !totalAmount) {
    res.status(400);
    throw new Error("billNo, customer, and totalAmount are required");
  }

  const payments = [];
  if (initialPayment && (initialPayment.cashAmount > 0 || initialPayment.onlineAmount > 0)) {
    const total = (Number(initialPayment.cashAmount) || 0) + (Number(initialPayment.onlineAmount) || 0);
    payments.push({
      date: initialPayment.date || new Date(),
      cashAmount: Number(initialPayment.cashAmount) || 0,
      onlineAmount: Number(initialPayment.onlineAmount) || 0,
      totalAmount: total,
      onlineMode: initialPayment.onlineMode || "",
      onlineRef: initialPayment.onlineRef || "",
      note: initialPayment.note || "",
    });
  }

  const bill = await WholesaleBill.create({
    billNo,
    billDate: billDate || new Date(),
    customer,
    description: description || "",
    totalAmount: Number(totalAmount),
    payments,
    note: note || "",
  });

  const populated = await WholesaleBill.findById(bill._id).populate("customer", "name firmName phone city");
  res.status(201).json({ success: true, data: populated });
});

// PUT /api/wholesale/bills/:id
const updateBill = asyncHandler(async (req, res) => {
  const bill = await WholesaleBill.findById(req.params.id);
  if (!bill) { res.status(404); throw new Error("Bill not found"); }

  const { billNo, billDate, description, totalAmount, note } = req.body;

  if (totalAmount !== undefined && Number(totalAmount) < bill.paidAmount) {
    res.status(400);
    throw new Error(`Cannot set total ₹${totalAmount} below already paid ₹${bill.paidAmount}`);
  }

  if (billNo !== undefined) bill.billNo = billNo;
  if (billDate !== undefined) bill.billDate = billDate;
  if (description !== undefined) bill.description = description;
  if (totalAmount !== undefined) bill.totalAmount = Number(totalAmount);
  if (note !== undefined) bill.note = note;

  await bill.save();
  await bill.populate("customer", "name firmName phone city");
  res.json({ success: true, data: bill });
});

// DELETE /api/wholesale/bills/:id
const deleteBill = asyncHandler(async (req, res) => {
  const bill = await WholesaleBill.findByIdAndDelete(req.params.id);
  if (!bill) { res.status(404); throw new Error("Bill not found"); }
  res.json({ success: true, message: "Bill deleted" });
});

// POST /api/wholesale/bills/:id/payment
const addPayment = asyncHandler(async (req, res) => {
  const { cashAmount, onlineAmount, onlineMode, onlineRef, date, note } = req.body;

  const cash = Number(cashAmount) || 0;
  const online = Number(onlineAmount) || 0;
  const total = cash + online;

  if (total <= 0) {
    res.status(400);
    throw new Error("Payment amount must be greater than 0");
  }

  const bill = await WholesaleBill.findById(req.params.id);
  if (!bill) { res.status(404); throw new Error("Bill not found"); }

  if (bill.status === "PAID") {
    res.status(400);
    throw new Error("Bill is already fully paid");
  }

  if (total > bill.balanceDue) {
    res.status(400);
    throw new Error(`Payment ₹${total} exceeds balance due ₹${bill.balanceDue}`);
  }

  bill.payments.push({
    date: date || new Date(),
    cashAmount: cash,
    onlineAmount: online,
    totalAmount: total,
    onlineMode: onlineMode || "",
    onlineRef: onlineRef || "",
    note: note || "",
  });

  await bill.save();
  await bill.populate("customer", "name firmName phone city");
  res.json({ success: true, data: bill });
});

// DELETE /api/wholesale/bills/:billId/payment/:paymentId
const deletePayment = asyncHandler(async (req, res) => {
  const bill = await WholesaleBill.findById(req.params.billId);
  if (!bill) { res.status(404); throw new Error("Bill not found"); }

  const idx = bill.payments.findIndex((p) => p._id.toString() === req.params.paymentId);
  if (idx === -1) { res.status(404); throw new Error("Payment not found"); }

  bill.payments.splice(idx, 1);
  await bill.save();
  res.json({ success: true, data: bill });
});

// GET /api/wholesale/customers/:id/ledger
const getCustomerLedger = asyncHandler(async (req, res) => {
  const customer = await WholesaleCustomer.findById(req.params.id);
  if (!customer) { res.status(404); throw new Error("Customer not found"); }

  const bills = await WholesaleBill.find({ customer: req.params.id }).sort({ billDate: 1 });

  const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalDue = bills.reduce((s, b) => s + b.balanceDue, 0) + (customer.openingBalance || 0);

  // Build flat ledger entries (bill + each payment)
  const entries = [];
  if (customer.openingBalance > 0) {
    entries.push({
      type: "OPENING",
      date: customer.createdAt,
      description: "Opening Balance (Previous Due)",
      debit: customer.openingBalance,
      credit: 0,
    });
  }

  for (const bill of bills) {
    entries.push({
      type: "BILL",
      date: bill.billDate,
      billNo: bill.billNo,
      description: bill.description || "Wholesale Sale",
      debit: bill.totalAmount,
      credit: 0,
      billId: bill._id,
      status: bill.status,
    });
    for (const p of bill.payments) {
      entries.push({
        type: "PAYMENT",
        date: p.date,
        billNo: bill.billNo,
        description: `Payment (Cash: ₹${p.cashAmount}, Online: ₹${p.onlineAmount})${p.onlineRef ? " Ref: " + p.onlineRef : ""}`,
        debit: 0,
        credit: p.totalAmount,
        cashAmount: p.cashAmount,
        onlineAmount: p.onlineAmount,
        onlineMode: p.onlineMode,
        onlineRef: p.onlineRef,
        paymentId: p._id,
        billId: bill._id,
      });
    }
  }

  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Running balance
  let balance = 0;
  entries.forEach((e) => { balance += e.debit - e.credit; e.runningBalance = balance; });

  res.json({
    success: true,
    customer,
    bills,
    entries,
    summary: { totalSales, totalPaid, totalDue, openingBalance: customer.openingBalance || 0 },
  });
});

// GET /api/wholesale/alerts
const getDueAlerts = asyncHandler(async (req, res) => {
  const now = new Date();
  const days15Ago = new Date(now - 15 * 24 * 60 * 60 * 1000);
  const days30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [overdue30Bills, overdue15Bills] = await Promise.all([
    // 30+ days overdue — most urgent
    WholesaleBill.find({
      status: { $in: ["PENDING", "PARTIAL"] },
      billDate: { $lte: days30Ago },
    })
      .populate("customer", "name firmName phone city")
      .sort({ billDate: 1 }),

    // 15–30 days overdue — warning
    WholesaleBill.find({
      status: { $in: ["PENDING", "PARTIAL"] },
      billDate: { $gt: days30Ago, $lte: days15Ago },
    })
      .populate("customer", "name firmName phone city")
      .sort({ billDate: 1 }),
  ]);

  const sum = (arr) => arr.reduce((s, b) => s + b.balanceDue, 0);

  res.json({
    success: true,
    overdue30: { bills: overdue30Bills, totalDue: sum(overdue30Bills), count: overdue30Bills.length },
    overdue15: { bills: overdue15Bills, totalDue: sum(overdue15Bills), count: overdue15Bills.length },
    totalAlerts: overdue30Bills.length + overdue15Bills.length,
    totalDue: sum(overdue30Bills) + sum(overdue15Bills),
  });
});

// GET /api/wholesale/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const [totalBills, activeCustomers] = await Promise.all([
    WholesaleBill.countDocuments(),
    WholesaleCustomer.countDocuments({ status: "ACTIVE" }),
  ]);

  const agg = await WholesaleBill.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, totalPaid: { $sum: "$paidAmount" }, totalDue: { $sum: "$balanceDue" } } },
  ]);
  const totals = agg[0] || { totalSales: 0, totalPaid: 0, totalDue: 0 };

  // Status breakdown
  const statusAgg = await WholesaleBill.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$totalAmount" }, due: { $sum: "$balanceDue" } } },
  ]);

  // Monthly trend last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAgg = await WholesaleBill.aggregate([
    { $match: { billDate: { $gte: sixMonthsAgo } } },
    { $group: {
      _id: { year: { $year: "$billDate" }, month: { $month: "$billDate" } },
      sales: { $sum: "$totalAmount" },
      paid: { $sum: "$paidAmount" },
      due: { $sum: "$balanceDue" },
      count: { $sum: 1 },
    }},
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Top 5 customers by due
  const topCustomers = await WholesaleBill.aggregate([
    { $group: { _id: "$customer", totalDue: { $sum: "$balanceDue" }, totalSales: { $sum: "$totalAmount" }, totalPaid: { $sum: "$paidAmount" }, billCount: { $sum: 1 } } },
    { $sort: { totalDue: -1 } },
    { $limit: 5 },
    { $lookup: { from: "wholesalecustomers", localField: "_id", foreignField: "_id", as: "customer" } },
    { $unwind: "$customer" },
  ]);

  // Payment mode breakdown
  const payModeAgg = await WholesaleBill.aggregate([
    { $unwind: "$payments" },
    { $group: { _id: null, totalCash: { $sum: "$payments.cashAmount" }, totalOnline: { $sum: "$payments.onlineAmount" } } },
  ]);
  const payModes = payModeAgg[0] || { totalCash: 0, totalOnline: 0 };

  // Online mode breakdown (UPI vs Bank etc)
  const onlineModeAgg = await WholesaleBill.aggregate([
    { $unwind: "$payments" },
    { $match: { "payments.onlineAmount": { $gt: 0 } } },
    { $group: { _id: "$payments.onlineMode", amount: { $sum: "$payments.onlineAmount" }, count: { $sum: 1 } } },
  ]);

  // Recent 5 bills
  const recentBills = await WholesaleBill.find()
    .populate("customer", "name firmName")
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    stats: { totalBills, activeCustomers, ...totals },
    statusBreakdown: statusAgg,
    monthly: monthlyAgg,
    topCustomers,
    paymentModes: payModes,
    onlineModes: onlineModeAgg,
    recentBills,
  });
});

module.exports = {
  getAllCustomers, createCustomer, updateCustomer, deleteCustomer,
  getAllBills, getBill, createBill, updateBill, deleteBill,
  addPayment, deletePayment, getCustomerLedger, getDashboard, getDueAlerts,
};
