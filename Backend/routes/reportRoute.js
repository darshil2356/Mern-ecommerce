const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {
  getMonthlyReport,
  getYearlyReport,
  getDateRangeReport,
  getGSTReport,
  getProductWiseReport,
  getCustomerWiseReport
} = require("../controller/reportCtrl");

const router = express.Router();

// All report routes require authentication and admin access
router.get("/monthly", authMiddleware, isAdmin, getMonthlyReport);
router.get("/yearly", authMiddleware, isAdmin, getYearlyReport);
router.get("/date-range", authMiddleware, isAdmin, getDateRangeReport);
router.get("/gst", authMiddleware, isAdmin, getGSTReport);
router.get("/product-wise", authMiddleware, isAdmin, getProductWiseReport);
router.get("/customer-wise", authMiddleware, isAdmin, getCustomerWiseReport);

module.exports = router;

