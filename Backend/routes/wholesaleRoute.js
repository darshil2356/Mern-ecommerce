const express = require("express");
const router = express.Router();
const {
  getAllCustomers, createCustomer, updateCustomer, deleteCustomer,
  getAllBills, getBill, createBill, updateBill, deleteBill,
  addPayment, deletePayment, getCustomerLedger, getDashboard, getDueAlerts, getMonthlyReport,
  getBillWhatsApp, getCustomerStatementWhatsApp,
} = require("../controller/wholesaleCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

// Customers
router.get("/customers", authMiddleware, isAdmin, getAllCustomers);
router.post("/customers", authMiddleware, isAdmin, createCustomer);
router.put("/customers/:id", authMiddleware, isAdmin, updateCustomer);
router.delete("/customers/:id", authMiddleware, isAdmin, deleteCustomer);
router.get("/customers/:id/ledger", authMiddleware, isAdmin, getCustomerLedger);
router.get("/customers/:id/statement-whatsapp", authMiddleware, isAdmin, getCustomerStatementWhatsApp);

// Dashboard & Alerts
router.get("/dashboard", authMiddleware, isAdmin, getDashboard);
router.get("/alerts", authMiddleware, isAdmin, getDueAlerts);
router.get("/monthly-report", authMiddleware, isAdmin, getMonthlyReport);

// Bills
router.get("/bills", authMiddleware, isAdmin, getAllBills);
router.get("/bills/:id/whatsapp", authMiddleware, isAdmin, getBillWhatsApp);
router.get("/bills/:id", authMiddleware, isAdmin, getBill);
router.post("/bills", authMiddleware, isAdmin, createBill);
router.put("/bills/:id", authMiddleware, isAdmin, updateBill);
router.delete("/bills/:id", authMiddleware, isAdmin, deleteBill);
router.post("/bills/:id/payment", authMiddleware, isAdmin, addPayment);
router.delete("/bills/:billId/payment/:paymentId", authMiddleware, isAdmin, deletePayment);

module.exports = router;
