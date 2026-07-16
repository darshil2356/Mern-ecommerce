const Rojmel = require("../models/rojmelModel");
const asyncHandler = require("express-async-handler");

// Recalculate running balance from a given date onwards
const recalculateBalances = async (fromDate) => {
  const entries = await Rojmel.find({ date: { $gte: fromDate } }).sort({ date: 1, createdAt: 1 });
  
  // Get balance just before fromDate
  const prevEntry = await Rojmel.findOne({ date: { $lt: fromDate } }).sort({ date: -1, createdAt: -1 });
  let runningBalance = prevEntry ? prevEntry.balance : 0;

  for (const entry of entries) {
    runningBalance = entry.type === "INCOME"
      ? runningBalance + entry.amount
      : runningBalance - entry.amount;
    entry.balance = runningBalance;
    await entry.save();
  }
};

// POST /rojmel/add
const addEntry = asyncHandler(async (req, res) => {
  const { date, particulars, voucherNo, type, amount, paymentMethod, category, referenceId, referenceModel, entrySource } = req.body;

  if (!particulars || !type || !amount) {
    res.status(400);
    throw new Error("particulars, type, and amount are required");
  }

  const entryDate = date ? new Date(date) : new Date();

  // Get last balance before this entry's date
  const prevEntry = await Rojmel.findOne({ date: { $lte: entryDate } }).sort({ date: -1, createdAt: -1 });
  const prevBalance = prevEntry ? prevEntry.balance : 0;
  const newBalance = type === "INCOME" ? prevBalance + Number(amount) : prevBalance - Number(amount);

  const entry = await Rojmel.create({
    date: entryDate,
    particulars,
    voucherNo: voucherNo || `VCH-${Date.now()}`,
    type,
    amount: Number(amount),
    paymentMethod: paymentMethod || "Online",
    category: category || "General",
    referenceId: referenceId || null,
    referenceModel: referenceModel || null,
    entrySource: entrySource || "MANUAL",
    balance: newBalance,
  });

  // Recalculate all entries after this date
  await recalculateBalances(entryDate);

  res.status(201).json({ success: true, data: entry });
});

// GET /rojmel/today
const getTodayEntries = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const entries = await Rojmel.find({ date: { $gte: start, $lte: end } }).sort({ date: 1, createdAt: 1 });

  const totalIncome = entries.filter(e => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);

  const prevEntry = await Rojmel.findOne({ date: { $lt: start } }).sort({ date: -1, createdAt: -1 });
  const openingBalance = prevEntry ? prevEntry.balance : 0;

  res.json({
    success: true,
    data: entries,
    summary: {
      openingBalance,
      totalIncome,
      totalExpense,
      closingBalance: openingBalance + totalIncome - totalExpense,
    },
  });
});

// GET /rojmel/by-date?startDate=&endDate=&paymentMethod=&search=&page=&limit=
const getByDate = asyncHandler(async (req, res) => {
  const { startDate, endDate, paymentMethod, search, page = 1, limit = 50 } = req.query;

  const filter = {};

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      filter.date.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      filter.date.$lte = e;
    }
  }

  if (paymentMethod) filter.paymentMethod = paymentMethod;
  if (search) filter.$or = [
    { particulars: { $regex: search, $options: "i" } },
    { voucherNo: { $regex: search, $options: "i" } },
    { category: { $regex: search, $options: "i" } },
  ];

  const skip = (Number(page) - 1) * Number(limit);
  const [entries, total] = await Promise.all([
    Rojmel.find(filter).sort({ date: 1, createdAt: 1 }).skip(skip).limit(Number(limit)),
    Rojmel.countDocuments(filter),
  ]);

  // Opening balance = balance just before the first entry in range
  let openingBalance = 0;
  if (entries.length > 0) {
    const prev = await Rojmel.findOne({ date: { $lt: entries[0].date } }).sort({ date: -1, createdAt: -1 });
    openingBalance = prev ? prev.balance : 0;
  }

  const totalIncome = entries.filter(e => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);

  res.json({
    success: true,
    data: entries,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    summary: {
      openingBalance,
      totalIncome,
      totalExpense,
      closingBalance: entries.length > 0 ? entries[entries.length - 1].balance : openingBalance,
    },
  });
});

// GET /rojmel/summary?month=&year=
const getSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month ?? now.getMonth() + 1);
  const year = Number(req.query.year ?? now.getFullYear());

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const entries = await Rojmel.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 });

  // Daily breakdown
  const dailyMap = {};
  entries.forEach(e => {
    const day = e.date.toISOString().split("T")[0];
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 };
    if (e.type === "INCOME") dailyMap[day].income += e.amount;
    else dailyMap[day].expense += e.amount;
  });

  const totalIncome = entries.filter(e => e.type === "INCOME").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter(e => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);

  // Opening balance = balance just before the month start
  const prev = await Rojmel.findOne({ date: { $lt: start } }).sort({ date: -1, createdAt: -1 });
  const openingBalance = prev ? prev.balance : 0;

  // Closing balance = last entry's balance in the month, otherwise same as opening
  const closingBalance = entries.length > 0 ? entries[entries.length - 1].balance : openingBalance;

  res.json({
    success: true,
    month,
    year,
    summary: { totalIncome, totalExpense, netBalance: totalIncome - totalExpense, openingBalance, closingBalance },
    daily: dailyMap,
  });
});

// DELETE /rojmel/:id
const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await Rojmel.findByIdAndDelete(req.params.id);
  if (!entry) { res.status(404); throw new Error("Entry not found"); }
  await recalculateBalances(entry.date);
  res.json({ success: true, message: "Entry deleted" });
});

// Utility: called from order hooks
const createAutoEntry = async ({ particulars, type, amount, paymentMethod, referenceId, category }) => {
  const prevEntry = await Rojmel.findOne().sort({ date: -1, createdAt: -1 });
  const prevBalance = prevEntry ? prevEntry.balance : 0;
  const newBalance = type === "INCOME" ? prevBalance + amount : prevBalance - amount;

  return Rojmel.create({
    date: new Date(),
    particulars,
    voucherNo: `AUTO-${Date.now()}`,
    type,
    amount,
    paymentMethod: paymentMethod || "Online",
    category: category || "Orders",
    referenceId: referenceId || null,
    referenceModel: referenceId ? "Order" : null,
    entrySource: "AUTO",
    balance: newBalance,
  });
};

module.exports = { addEntry, getTodayEntries, getByDate, getSummary, deleteEntry, createAutoEntry };
