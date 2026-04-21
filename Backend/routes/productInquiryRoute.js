const express = require("express");
const router = express.Router();
const {
  createProductInquiry,
  getAllInquiries,
  getInquiriesByProduct,
  updateInquiryStatus,
  deleteInquiry,
  notifyRestockedInquirers,
} = require("../controller/productInquiryCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Optional auth — attaches req.user if token present, but doesn't block if missing
const optionalAuth = async (req, res, next) => {
  try {
    const header = req?.headers?.authorization;
    if (header?.startsWith("Bearer ")) {
      const token = header.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        if (user && !user.isBlocked) req.user = user;
      }
    }
  } catch (_) {}
  next();
};

// Public / user routes (optional login)
router.post("/", optionalAuth, createProductInquiry);

// Admin routes
router.get("/", authMiddleware, isAdmin, getAllInquiries);
router.get("/product/:productId", authMiddleware, isAdmin, getInquiriesByProduct);
router.post("/notify/:productId", authMiddleware, isAdmin, notifyRestockedInquirers);
router.put("/:id", authMiddleware, isAdmin, updateInquiryStatus);
router.delete("/:id", authMiddleware, isAdmin, deleteInquiry);

module.exports = router;
