const Udhar = require("../models/udharModel");
const asyncHandler = require("express-async-handler");

// POST /udhar/add
const addUdhar = asyncHandler(async (req, res) => {
  const { type, personName, personPhone, orderId, productDetails, totalAmount, dueDate, note } = req.body;

  if (!type || !personName || !totalAmount) {
    res.status(400);
    throw new Error("type, personName, and totalAmount are required");
  }

  const udhar = await Udhar.create({
    type,
    personName,
    personPhone,
    orderId: orderId || null,
    productDetails,
    totalAmount: Number(totalAmount),
    dueDate: dueDate || null,
    note,
  });

  res.status(201).json({ success: true, data: udhar });
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
  const remaining = udhar.totalAmount - udhar.paidAmount;

  if (paying > remaining) {
    res.status(400);
    throw new Error(`Cannot pay more than remaining amount ₹${remaining}`);
  }

  udhar.paidAmount += paying;
  udhar.payments.push({ amount: paying, note: note || "" });
  await udhar.save();

  res.json({ success: true, data: udhar });
});

// GET /udhar?type=&status=&search=
const getAll = asyncHandler(async (req, res) => {
  const { type, status, search } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (search) filter.$or = [
    { personName: { $regex: search, $options: "i" } },
    { personPhone: { $regex: search, $options: "i" } },
    { productDetails: { $regex: search, $options: "i" } },
  ];

  const records = await Udhar.find(filter).sort({ createdAt: -1 });

  const totalPending = records
    .filter(r => r.status !== "CLEARED")
    .reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);

  res.json({ success: true, data: records, totalPending });
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

module.exports = { addUdhar, recordPayment, getAll, getOne, deleteUdhar };
