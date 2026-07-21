const Staff = require("../models/staffModel");
const asyncHandler = require("express-async-handler");

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private/Admin
const createStaff = asyncHandler(async (req, res) => {
  const {
    name,
    phone,
    email,
    address,
    emergencyContact,
    aadharNumber,
    designation,
    joiningDate,
    status,
    salaryType,
    baseSalary,
    bankDetails,
    notes,
  } = req.body;

  if (!name || !phone || !designation) {
    res.status(400);
    throw new Error("Name, phone, and designation are required");
  }

  const staff = await Staff.create({
    name,
    phone,
    email: email || "",
    address: address || "",
    emergencyContact: emergencyContact || {},
    aadharNumber: aadharNumber || "",
    designation,
    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    status: status || "ACTIVE",
    salaryType: salaryType || "MONTHLY",
    baseSalary: Number(baseSalary) || 0,
    bankDetails: bankDetails || {},
    notes: notes || "",
  });

  res.status(201).json({ success: true, message: "Staff member created successfully", data: staff });
});

// @desc    Get all staff members with filters & overview statistics
// @route   GET /api/staff
// @access  Private/Admin
const getAllStaff = asyncHandler(async (req, res) => {
  const { search, status, designation } = req.query;

  const query = {};
  if (status) query.status = status;
  if (designation) query.designation = designation;

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
    ];
  }

  const staffList = await Staff.find(query).sort({ createdAt: -1 });

  // Calculate overview metrics across all staff (or active staff)
  let totalStaff = staffList.length;
  let activeStaff = 0;
  let totalMonthlyPayroll = 0;
  let totalAdvancePending = 0;

  staffList.forEach((st) => {
    if (st.status === "ACTIVE") {
      activeStaff++;
      if (st.salaryType === "MONTHLY") {
        totalMonthlyPayroll += Number(st.baseSalary) || 0;
      }
    }

    // Calculate advance balance (GIVEN - DEDUCTED - REPAID)
    let advanceBal = 0;
    if (st.advanceHistory && Array.isArray(st.advanceHistory)) {
      st.advanceHistory.forEach((adv) => {
        if (adv.type === "GIVEN") advanceBal += Number(adv.amount) || 0;
        else if (adv.type === "DEDUCTED" || adv.type === "REPAID") advanceBal -= Number(adv.amount) || 0;
      });
    }
    totalAdvancePending += advanceBal;
  });

  res.status(200).json({
    success: true,
    count: totalStaff,
    stats: {
      totalStaff,
      activeStaff,
      totalMonthlyPayroll,
      totalAdvancePending,
    },
    data: staffList,
  });
});

// @desc    Get staff by ID
// @route   GET /api/staff/:id
// @access  Private/Admin
const getStaffById = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  // Calculate staff specific financials
  let totalSalaryPaid = 0;
  if (staff.salaryHistory) {
    staff.salaryHistory.forEach((s) => {
      if (s.status === "PAID") totalSalaryPaid += Number(s.netPaid) || 0;
    });
  }

  let advanceBalance = 0;
  if (staff.advanceHistory) {
    staff.advanceHistory.forEach((a) => {
      if (a.type === "GIVEN") advanceBalance += Number(a.amount) || 0;
      else if (a.type === "DEDUCTED" || a.type === "REPAID") advanceBalance -= Number(a.amount) || 0;
    });
  }

  res.status(200).json({
    success: true,
    data: staff,
    summary: {
      totalSalaryPaid,
      advanceBalance,
    },
  });
});

// @desc    Update staff details
// @route   PUT /api/staff/:id
// @access  Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, message: "Staff details updated", data: updatedStaff });
});

// @desc    Delete staff record
// @route   DELETE /api/staff/:id
// @access  Private/Admin
const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  await Staff.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Staff record removed" });
});

// @desc    Add Salary Payment Record
// @route   POST /api/staff/:id/salary
// @access  Private/Admin
const addSalaryPayment = asyncHandler(async (req, res) => {
  const { monthYear, baseAmount, bonus, deduction, advanceDeducted, paymentMode, remarks, paymentDate } = req.body;

  if (!monthYear) {
    res.status(400);
    throw new Error("Month & Year designation (e.g. 2026-07) is required");
  }

  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  const base = Number(baseAmount) || Number(staff.baseSalary) || 0;
  const bon = Number(bonus) || 0;
  const ded = Number(deduction) || 0;
  const advDed = Number(advanceDeducted) || 0;
  const netPaid = base + bon - ded - advDed;

  const paymentObj = {
    monthYear,
    baseAmount: base,
    bonus: bon,
    deduction: ded,
    advanceDeducted: advDed,
    netPaid: Math.max(0, netPaid),
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMode: paymentMode || "CASH",
    status: "PAID",
    remarks: remarks || "",
  };

  staff.salaryHistory.unshift(paymentObj);

  // If advance was deducted, record in advanceHistory as well
  if (advDed > 0) {
    staff.advanceHistory.unshift({
      date: paymentDate ? new Date(paymentDate) : new Date(),
      amount: advDed,
      type: "DEDUCTED",
      mode: paymentMode || "CASH",
      remarks: `Auto deducted from ${monthYear} salary payout`,
    });
  }

  await staff.save();
  res.status(200).json({ success: true, message: "Salary payment recorded", data: staff });
});

// @desc    Add Advance Transaction (Given / Repaid)
// @route   POST /api/staff/:id/advance
// @access  Private/Admin
const addAdvanceTransaction = asyncHandler(async (req, res) => {
  const { amount, type, mode, remarks, date } = req.body;

  if (!amount || Number(amount) <= 0 || !type) {
    res.status(400);
    throw new Error("Valid amount and advance type (GIVEN / REPAID / DEDUCTED) are required");
  }

  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  staff.advanceHistory.unshift({
    date: date ? new Date(date) : new Date(),
    amount: Number(amount),
    type,
    mode: mode || "CASH",
    remarks: remarks || "",
  });

  await staff.save();
  res.status(200).json({ success: true, message: `Advance ${type.toLowerCase()} recorded`, data: staff });
});

// @desc    Delete Salary Entry
// @route   DELETE /api/staff/:id/salary/:salaryId
// @access  Private/Admin
const deleteSalaryPayment = asyncHandler(async (req, res) => {
  const { id, salaryId } = req.params;
  const staff = await Staff.findById(id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  staff.salaryHistory = staff.salaryHistory.filter((s) => s._id.toString() !== salaryId);
  await staff.save();

  res.status(200).json({ success: true, message: "Salary entry deleted", data: staff });
});

// @desc    Delete Advance Entry
// @route   DELETE /api/staff/:id/advance/:advanceId
// @access  Private/Admin
const deleteAdvanceTransaction = asyncHandler(async (req, res) => {
  const { id, advanceId } = req.params;
  const staff = await Staff.findById(id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  staff.advanceHistory = staff.advanceHistory.filter((a) => a._id.toString() !== advanceId);
  await staff.save();

  res.status(200).json({ success: true, message: "Advance transaction deleted", data: staff });
});

module.exports = {
  createStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  addSalaryPayment,
  addAdvanceTransaction,
  deleteSalaryPayment,
  deleteAdvanceTransaction,
};
