const express = require("express");
const router = express.Router();
const {
  createBundle,
  getAllBundles,
  getBundle,
  updateBundle,
  deleteBundle,
  getBundlesForProduct,
  getActiveBundles,
  getBundleStats,
} = require("../controller/bundleCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");

// Public routes
router.get("/active", getActiveBundles);
router.get("/product/:productId", getBundlesForProduct);
router.get("/stats", getBundleStats);
router.get("/:id", getBundle);

// Protected routes (Admin only)
router.post("/", authMiddleware, isAdmin, createBundle);
router.put("/:id", authMiddleware, isAdmin, updateBundle);
router.delete("/:id", authMiddleware, isAdmin, deleteBundle);

// Get all bundles (with pagination and filters)
router.get("/", getAllBundles);

module.exports = router;

