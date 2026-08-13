const express = require("express");
const router = express.Router();
const {
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
} = require("../controller/staffCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Attendance routes (MUST be placed before /:id parameter routes)
router.get("/attendance/day", authMiddleware, isAdmin, getDailyAttendance);
router.get("/attendance/monthly-summary", authMiddleware, isAdmin, getMonthlyAttendanceSummary);
router.post("/attendance/save", authMiddleware, isAdmin, saveDailyAttendance);

router.post("/", authMiddleware, isAdmin, createStaff);
router.get("/", authMiddleware, isAdmin, getAllStaff);
router.get("/:id", authMiddleware, isAdmin, getStaffById);
router.put("/:id", authMiddleware, isAdmin, updateStaff);
router.delete("/:id", authMiddleware, isAdmin, deleteStaff);

// Salary payouts, Advance tracking & staff specific attendance
router.post("/:id/salary", authMiddleware, isAdmin, addSalaryPayment);
router.post("/:id/advance", authMiddleware, isAdmin, addAdvanceTransaction);
router.get("/:id/attendance", authMiddleware, isAdmin, getStaffAttendanceHistory);
router.delete("/:id/salary/:salaryId", authMiddleware, isAdmin, deleteSalaryPayment);
router.delete("/:id/advance/:advanceId", authMiddleware, isAdmin, deleteAdvanceTransaction);

module.exports = router;
