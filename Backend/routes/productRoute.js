const express = require("express");
const {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  getAllReviews,
  markReviewHelpful,
  deleteReview,
  getReels,
  toggleReelLike,
  adjustProductStock,
  getAllStockLogs,
  getStockLogsSummary,
  getProductStockLogs,
  updateStockLogAudit,
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { getProductByBarcode } = require("../controller/userCtrl");
const { aiGenerateProduct } = require("../controller/aiProductCtrl");
const router = express.Router();

router.post("/ai-generate", authMiddleware, isAdmin, aiGenerateProduct);
router.post("/", authMiddleware, isAdmin, createProduct);
router.get("/", getAllProduct);

// Stock adjustment & fraud prevention audit logs (must be before /:id)
router.get("/stock-logs/summary", authMiddleware, isAdmin, getStockLogsSummary);
router.get("/stock-logs", authMiddleware, isAdmin, getAllStockLogs);
router.put("/stock-logs/:logId/audit", authMiddleware, isAdmin, updateStockLogAudit);
router.post("/adjust-stock/:id", authMiddleware, isAdmin, adjustProductStock);

// Static/specific routes before parameterized ones
router.get("/reels", getReels);
router.put("/reels/:id/like", authMiddleware, toggleReelLike);
router.get("/reviews/all", authMiddleware, isAdmin, getAllReviews);
router.put("/reviews/helpful", markReviewHelpful);
router.delete("/reviews/:prodId/:reviewId", authMiddleware, deleteReview);
router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);
router.get("/barcode/:barcode", getProductByBarcode);

// Specific product sub-routes
router.get("/:id/stock-logs", authMiddleware, isAdmin, getProductStockLogs);

// Parameterized routes last
router.get("/:id", getaProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

module.exports = router;
