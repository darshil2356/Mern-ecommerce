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
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { getProductByBarcode } = require("../controller/userCtrl");
const { aiGenerateProduct } = require("../controller/aiProductCtrl");
const router = express.Router();

router.post("/ai-generate", authMiddleware, isAdmin, aiGenerateProduct);
router.post("/", authMiddleware, isAdmin, createProduct);
router.get("/", getAllProduct);

// Static/specific routes before parameterized ones
router.get("/reels", getReels);
router.put("/reels/:id/like", authMiddleware, toggleReelLike);
router.get("/reviews/all", authMiddleware, isAdmin, getAllReviews);
router.put("/reviews/helpful", markReviewHelpful);
router.delete("/reviews/:prodId/:reviewId", authMiddleware, deleteReview);
router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);
router.get("/barcode/:barcode", getProductByBarcode);

// Parameterized routes last
router.get("/:id", getaProduct);
router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

module.exports = router;
