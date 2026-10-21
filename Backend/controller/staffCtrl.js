const Staff = require("../models/staffModel");
const Attendance = require("../models/attendanceModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
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
    terminationDate,
    status,
    salaryType,
    baseSalary,
    incentivePercentage,
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
    terminationDate: terminationDate ? new Date(terminationDate) : null,
    status: status || "ACTIVE",
    salaryType: salaryType || "MONTHLY",
    baseSalary: Number(baseSalary) || 0,
    incentivePercentage: Math.max(0, Math.min(100, Number(incentivePercentage) || 0)),
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

// @desc    Get daily attendance record for all active/on-leave staff members
// @route   GET /api/staff/attendance/day
// @access  Private/Admin
const getDailyAttendance = asyncHandler(async (req, res) => {
  let { dateStr } = req.query;
  if (!dateStr) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    dateStr = localToday.toISOString().split("T")[0];
  }

  // Find all active/on-leave staff, or resigned/terminated staff who were still active on the selected date
  const queryDateStart = new Date(`${dateStr}T00:00:00.000Z`);
  const queryDateEnd = new Date(`${dateStr}T23:59:59.999Z`);
  const staffList = await Staff.find({
    joiningDate: { $lte: queryDateEnd },
    $or: [
      { status: { $in: ["ACTIVE", "ON_LEAVE"] } },
      {
        status: { $in: ["RESIGNED", "TERMINATED"] },
        terminationDate: { $gte: queryDateStart },
      },
    ],
  }).sort({ name: 1 });
  
  // Find all attendance records for this date
  const attendanceRecords = await Attendance.find({ dateStr });

  // Map for quick lookups
  const attendanceMap = {};
  attendanceRecords.forEach((rec) => {
    attendanceMap[rec.staff.toString()] = rec;
  });

  const data = staffList.map((staff) => {
    const rec = attendanceMap[staff._id.toString()];
    return {
      staff: {
        _id: staff._id,
        name: staff.name,
        phone: staff.phone,
        designation: staff.designation,
        status: staff.status,
        joiningDate: staff.joiningDate,
        terminationDate: staff.terminationDate,
      },
      attendance: rec ? {
        _id: rec._id,
        status: rec.status,
        checkIn: rec.checkIn,
        checkOut: rec.checkOut,
        remarks: rec.remarks,
      } : null,
    };
  });

  res.status(200).json({ success: true, dateStr, data });
});

// @desc    Save/update daily attendance records for staff (supports bulk saving)
// @route   POST /api/staff/attendance/save
// @access  Private/Admin
const saveDailyAttendance = asyncHandler(async (req, res) => {
  const { dateStr, records } = req.body;
  if (!dateStr || !Array.isArray(records)) {
    res.status(400);
    throw new Error("dateStr and records array are required");
  }

  const parsedDate = new Date(dateStr);

  const promises = records.map(async (rec) => {
    const { staffId, status, checkIn, checkOut, remarks } = rec;
    if (!staffId || !status) return;

    // Verify staff exists
    const staffExists = await Staff.findById(staffId);
    if (!staffExists) return;

    return Attendance.findOneAndUpdate(
      { staff: staffId, dateStr },
      {
        staff: staffId,
        date: parsedDate,
        dateStr,
        status,
        checkIn: checkIn || "",
        checkOut: checkOut || "",
        remarks: remarks || "",
      },
      { upsert: true, new: true }
    );
  });

  await Promise.all(promises);

  res.status(200).json({ success: true, message: "Attendance saved successfully" });
});

// @desc    Get monthly attendance summary matrix for all staff
// @route   GET /api/staff/attendance/monthly-summary
// @access  Private/Admin
const getMonthlyAttendanceSummary = asyncHandler(async (req, res) => {
  let { month } = req.query;
  if (!month) {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, "0");
    month = `${yr}-${mo}`;
  }

  const [yr, mo] = month.split("-").map(Number);
  const firstDayOfMonth = new Date(yr, mo - 1, 1);
  const lastDayOfMonth = new Date(yr, mo, 0);

  // Find all active/on-leave staff, or resigned/terminated staff who were active during this month
  const staffList = await Staff.find({
    joiningDate: { $lte: lastDayOfMonth },
    $or: [
      { status: { $in: ["ACTIVE", "ON_LEAVE"] } },
      {
        status: { $in: ["RESIGNED", "TERMINATED"] },
        terminationDate: { $gte: firstDayOfMonth },
      },
    ],
  }).sort({ name: 1 });
  
  // Find all attendance records matching the month prefix
  const attendanceRecords = await Attendance.find({
    dateStr: { $regex: `^${month}` },
  });

  // Map by staff ID and dateStr
  const staffAttendanceMap = {};
  attendanceRecords.forEach((rec) => {
    const sId = rec.staff.toString();
    if (!staffAttendanceMap[sId]) {
      staffAttendanceMap[sId] = {};
    }
    staffAttendanceMap[sId][rec.dateStr] = {
      _id: rec._id,
      status: rec.status,
      checkIn: rec.checkIn,
      checkOut: rec.checkOut,
      remarks: rec.remarks,
    };
  });

  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - (offset * 60 * 1000));
  const currentTodayStr = localToday.toISOString().split("T")[0];

  const totalDays = lastDayOfMonth.getDate();

  const data = staffList.map((staff) => {
    const sId = staff._id.toString();
    const records = staffAttendanceMap[sId] || {};
    const joiningDateStr = staff.joiningDate ? new Date(staff.joiningDate).toISOString().split("T")[0] : "";
    const terminationDateStr = staff.terminationDate ? new Date(staff.terminationDate).toISOString().split("T")[0] : "";
    
    let present = 0;
    let absent = 0;
    let halfDay = 0;
    let onLeave = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${month}-${String(d).padStart(2, "0")}`;
      
      // Skip future dates relative to today
      if (dateStr > currentTodayStr) {
        continue;
      }
      // Skip dates before the staff member's joining date
      if (joiningDateStr && dateStr < joiningDateStr) {
        continue;
      }
      // Skip dates after the staff member's termination date
      if (terminationDateStr && dateStr > terminationDateStr) {
        continue;
      }

      const r = records[dateStr];
      if (r) {
        if (r.status === "PRESENT") present++;
        else if (r.status === "ABSENT") absent++;
        else if (r.status === "HALF_DAY") halfDay++;
        else if (r.status === "ON_LEAVE") onLeave++;
      } else {
        // Default to PRESENT for unmarked past days
        present++;
      }
    }

    return {
      staff: {
        _id: staff._id,
        name: staff.name,
        phone: staff.phone,
        designation: staff.designation,
        status: staff.status,
        joiningDate: staff.joiningDate,
        terminationDate: staff.terminationDate,
      },
      records,
      summary: {
        present,
        absent,
        halfDay,
        onLeave,
        totalWorked: present + (0.5 * halfDay),
      },
    };
  });

  res.status(200).json({ success: true, month, data });
});

// @desc    Get individual staff member's attendance history
// @route   GET /api/staff/:id/attendance
// @access  Private/Admin
const getStaffAttendanceHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { month } = req.query;

  const staff = await Staff.findById(id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  if (!month) {
    const today = new Date();
    const yr = today.getFullYear();
    const mo = String(today.getMonth() + 1).padStart(2, "0");
    month = `${yr}-${mo}`;
  }

  const query = { staff: id, dateStr: { $regex: `^${month}` } };
  const history = await Attendance.find(query);

  const historyMap = {};
  history.forEach((rec) => {
    historyMap[rec.dateStr] = rec;
  });

  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - (offset * 60 * 1000));
  const currentTodayStr = localToday.toISOString().split("T")[0];

  const [yr, mo] = month.split("-").map(Number);
  const totalDays = new Date(yr, mo, 0).getDate();

  const joiningDateStr = staff.joiningDate ? new Date(staff.joiningDate).toISOString().split("T")[0] : "";
  const terminationDateStr = staff.terminationDate ? new Date(staff.terminationDate).toISOString().split("T")[0] : "";

  const finalHistory = [];
  let present = 0;
  let absent = 0;
  let halfDay = 0;
  let onLeave = 0;

  for (let d = totalDays; d >= 1; d--) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    
    // Skip future days
    if (dateStr > currentTodayStr) {
      continue;
    }
    // Skip days before joining
    if (joiningDateStr && dateStr < joiningDateStr) {
      continue;
    }
    // Skip days after termination
    if (terminationDateStr && dateStr > terminationDateStr) {
      continue;
    }

    const rec = historyMap[dateStr];
    if (rec) {
      finalHistory.push(rec);
      if (rec.status === "PRESENT") present++;
      else if (rec.status === "ABSENT") absent++;
      else if (rec.status === "HALF_DAY") halfDay++;
      else if (rec.status === "ON_LEAVE") onLeave++;
    } else {
      // Default virtual Present record
      const virtualDate = new Date(`${dateStr}T12:00:00.000Z`);
      const virtualRec = {
        _id: `virtual-${dateStr}`,
        staff: id,
        date: virtualDate,
        dateStr,
        status: "PRESENT",
        checkIn: "09:00 AM",
        checkOut: "06:00 PM",
        remarks: "Default (Present)",
        isVirtual: true,
      };
      finalHistory.push(virtualRec);
      present++;
    }
  }

  res.status(200).json({
    success: true,
    data: finalHistory,
    summary: {
      present,
      absent,
      halfDay,
      onLeave,
      totalWorked: present + (0.5 * halfDay),
    },
  });
});

// @desc    Get Staff Incentive Analytics & Detailed Report
// @route   GET /api/staff/incentives/report
// @access  Private/Admin
const getStaffIncentiveReport = asyncHandler(async (req, res) => {
  const {
    staffId,
    billedById,
    startDate,
    endDate,
    monthYear,
    incentiveStatus,
    search,
  } = req.query;

  // Build filter query for orders
  const query = {
    orderStatus: { $ne: "Cancelled" },
    $or: [
      { sellerStaff: { $ne: null } },
      { sellerStaffName: { $exists: true, $ne: "" } },
      { incentiveAmount: { $gt: 0 } },
    ],
  };

  // Date filters
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      query.createdAt.$gte = s;
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query.createdAt.$lte = e;
    }
  } else if (monthYear) {
    const [year, month] = monthYear.split("-").map(Number);
    if (year && month) {
      const s = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const e = new Date(year, month, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: s, $lte: e };
    }
  }

  if (staffId && staffId !== "ALL") {
    query.sellerStaff = staffId;
  }

  if (billedById && billedById !== "ALL") {
    query.billedByStaff = billedById;
  }

  if (incentiveStatus && incentiveStatus !== "ALL") {
    query.incentiveStatus = incentiveStatus;
  }

  // Fetch orders matching query
  let orders = await Order.find(query)
    .populate("user", "firstname lastname mobile email address")
    .populate("sellerStaff", "name phone designation baseSalary incentivePercentage")
    .populate("billedByStaff", "name phone designation")
    .sort({ createdAt: -1 });

  // Optional search filtering (on customer name, mobile, orderId, staff name)
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    orders = orders.filter((o) => {
      const custName = `${o.user?.firstname || ""} ${o.user?.lastname || ""} ${o.shippingInfo?.firstname || ""} ${o.shippingInfo?.lastname || ""}`.toLowerCase();
      const custMobile = `${o.user?.mobile || ""} ${o.shippingInfo?.phone || ""}`.toLowerCase();
      const orderIdStr = String(o._id || "").toLowerCase();
      const sellerStr = `${o.sellerStaff?.name || ""} ${o.sellerStaffName || ""}`.toLowerCase();
      const billedByStr = `${o.billedByStaff?.name || ""} ${o.billedByStaffName || ""}`.toLowerCase();
      return (
        custName.includes(q) ||
        custMobile.includes(q) ||
        orderIdStr.includes(q) ||
        sellerStr.includes(q) ||
        billedByStr.includes(q)
      );
    });
  }

  // Fetch all active staff to compile comprehensive staff performance overview
  const allStaff = await Staff.find({}).sort({ name: 1 });

  // Compile summary stats
  let totalOrdersCount = orders.length;
  let totalSalesVolume = 0;
  let totalIncentiveEarned = 0;
  let totalIncentivePending = 0;
  let totalIncentivePaid = 0;

  // Staff aggregation map
  const staffStatsMap = {};
  allStaff.forEach((st) => {
    staffStatsMap[st._id.toString()] = {
      staffId: st._id,
      name: st.name,
      phone: st.phone,
      designation: st.designation,
      status: st.status,
      baseSalary: st.baseSalary || 0,
      incentivePercentage: st.incentivePercentage || 0,
      ordersCount: 0,
      salesVolume: 0,
      incentiveEarned: 0,
      incentivePending: 0,
      incentivePaid: 0,
    };
  });

  orders.forEach((o) => {
    const saleAmt = o.totalPriceAfterDiscount > 0 ? o.totalPriceAfterDiscount : o.totalPrice;
    const incAmt = o.incentiveAmount || 0;

    totalSalesVolume += saleAmt;
    totalIncentiveEarned += incAmt;

    if (o.incentiveStatus === "PAID") {
      totalIncentivePaid += incAmt;
    } else {
      totalIncentivePending += incAmt;
    }

    const sellerKey = o.sellerStaff?._id?.toString() || (o.sellerStaff ? o.sellerStaff.toString() : null);
    if (sellerKey && staffStatsMap[sellerKey]) {
      staffStatsMap[sellerKey].ordersCount += 1;
      staffStatsMap[sellerKey].salesVolume += saleAmt;
      staffStatsMap[sellerKey].incentiveEarned += incAmt;
      if (o.incentiveStatus === "PAID") {
        staffStatsMap[sellerKey].incentivePaid += incAmt;
      } else {
        staffStatsMap[sellerKey].incentivePending += incAmt;
      }
    } else if (o.sellerStaffName) {
      const pseudoKey = `name_${o.sellerStaffName}`;
      if (!staffStatsMap[pseudoKey]) {
        staffStatsMap[pseudoKey] = {
          staffId: pseudoKey,
          name: o.sellerStaffName,
          phone: "—",
          designation: "Sales Staff",
          status: "ACTIVE",
          baseSalary: 0,
          incentivePercentage: o.incentiveRate || 0,
          ordersCount: 0,
          salesVolume: 0,
          incentiveEarned: 0,
          incentivePending: 0,
          incentivePaid: 0,
        };
      }
      staffStatsMap[pseudoKey].ordersCount += 1;
      staffStatsMap[pseudoKey].salesVolume += saleAmt;
      staffStatsMap[pseudoKey].incentiveEarned += incAmt;
      if (o.incentiveStatus === "PAID") {
        staffStatsMap[pseudoKey].incentivePaid += incAmt;
      } else {
        staffStatsMap[pseudoKey].incentivePending += incAmt;
      }
    }
  });

  const staffSummaryList = Object.values(staffStatsMap)
    .filter((s) => (staffId && staffId !== "ALL" ? s.staffId.toString() === staffId : true))
    .sort((a, b) => b.salesVolume - a.salesVolume);

  res.status(200).json({
    success: true,
    stats: {
      totalOrdersCount,
      totalSalesVolume: Math.round(totalSalesVolume * 100) / 100,
      totalIncentiveEarned: Math.round(totalIncentiveEarned * 100) / 100,
      totalIncentivePending: Math.round(totalIncentivePending * 100) / 100,
      totalIncentivePaid: Math.round(totalIncentivePaid * 100) / 100,
      averageIncentiveRate:
        totalSalesVolume > 0
          ? Math.round((totalIncentiveEarned / totalSalesVolume) * 10000) / 100
          : 0,
    },
    staffSummary: staffSummaryList,
    orders: orders.map((o) => ({
      _id: o._id,
      createdAt: o.createdAt,
      orderStatus: o.orderStatus,
      totalPrice: o.totalPrice,
      totalPriceAfterDiscount: o.totalPriceAfterDiscount,
      discountAmount: o.discountAmount || 0,
      paymentMethod: o.paymentInfo?.razorpayOrderId?.includes("ONLINE") ? "ONLINE" : "CASH",
      customer: {
        name: o.user ? `${o.user.firstname || ""} ${o.user.lastname || ""}`.trim() : (o.shippingInfo ? `${o.shippingInfo.firstname || ""} ${o.shippingInfo.lastname || ""}`.trim() : "Walk-in Customer"),
        phone: o.user?.mobile || o.shippingInfo?.phone || "—",
        address: o.user?.address || o.shippingInfo?.address || "",
      },
      sellerStaff: o.sellerStaff
        ? {
            _id: o.sellerStaff._id,
            name: o.sellerStaff.name,
            phone: o.sellerStaff.phone,
            designation: o.sellerStaff.designation,
          }
        : null,
      sellerStaffName: o.sellerStaffName || o.sellerStaff?.name || "Unassigned",
      billedByStaff: o.billedByStaff
        ? {
            _id: o.billedByStaff._id,
            name: o.billedByStaff.name,
            phone: o.billedByStaff.phone,
            designation: o.billedByStaff.designation,
          }
        : null,
      billedByStaffName: o.billedByStaffName || o.billedByStaff?.name || "Counter Admin",
      incentiveRate: o.incentiveRate || 0,
      incentiveAmount: o.incentiveAmount || 0,
      incentiveStatus: o.incentiveStatus || "PENDING",
      incentivePaidAt: o.incentivePaidAt,
      incentivePaymentNote: o.incentivePaymentNote || "",
      itemsCount: Array.isArray(o.orderItems) ? o.orderItems.length : 0,
    })),
  });
});

// @desc    Mark incentives as Paid for specific orders or staff/month
// @route   POST /api/staff/incentives/payout
// @access  Private/Admin
const markIncentivesPaid = asyncHandler(async (req, res) => {
  const { orderIds, staffId, monthYear, paymentNote } = req.body;

  let query = {};
  if (Array.isArray(orderIds) && orderIds.length > 0) {
    query._id = { $in: orderIds };
  } else if (staffId) {
    query.sellerStaff = staffId;
    query.incentiveStatus = "PENDING";
    if (monthYear) {
      const [year, month] = monthYear.split("-").map(Number);
      if (year && month) {
        const s = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const e = new Date(year, month, 0, 23, 59, 59, 999);
        query.createdAt = { $gte: s, $lte: e };
      }
    }
  } else {
    res.status(400);
    throw new Error("Please specify orderIds or staffId to mark as paid");
  }

  const result = await Order.updateMany(query, {
    $set: {
      incentiveStatus: "PAID",
      incentivePaidAt: new Date(),
      incentivePaymentNote: paymentNote || "Incentive payout settled",
    },
  });

  res.status(200).json({
    success: true,
    message: `Successfully marked ${result.modifiedCount || 0} bill(s) as Paid`,
    modifiedCount: result.modifiedCount,
  });
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
  getDailyAttendance,
  saveDailyAttendance,
  getMonthlyAttendanceSummary,
  getStaffAttendanceHistory,
  getStaffIncentiveReport,
  markIncentivesPaid,
};

