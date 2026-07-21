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
} = require("../controller/staffCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.post("/", authMiddleware, isAdmin, createStaff);
router.get("/", authMiddleware, isAdmin, getAllStaff);
router.get("/:id", authMiddleware, isAdmin, getStaffById);
router.put("/:id", authMiddleware, isAdmin, updateStaff);
router.delete("/:id", authMiddleware, isAdmin, deleteStaff);

// Salary payouts & Advance tracking
router.post("/:id/salary", authMiddleware, isAdmin, addSalaryPayment);
router.post("/:id/advance", authMiddleware, isAdmin, addAdvanceTransaction);
router.delete("/:id/salary/:salaryId", authMiddleware, isAdmin, deleteSalaryPayment);
router.delete("/:id/advance/:advanceId", authMiddleware, isAdmin, deleteAdvanceTransaction);

module.exports = router;
