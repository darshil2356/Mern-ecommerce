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
} = require("../controller/productCtrl");
const { isAdmin, authMiddleware } = require("../middlewares/authMiddleware");
const { getProductByBarcode } = require("../controller/userCtrl");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createProduct);

router.get("/:id", getaProduct);
router.put("/wishlist", authMiddleware, addToWishlist);
router.put("/rating", authMiddleware, rating);

// New review management routes
router.get("/reviews/all", authMiddleware, isAdmin, getAllReviews);
router.put("/reviews/helpful", markReviewHelpful);
router.delete("/reviews/:prodId/:reviewId", authMiddleware, deleteReview);

router.put("/:id", authMiddleware, isAdmin, updateProduct);
router.delete("/:id", authMiddleware, isAdmin, deleteProduct);

router.get("/", getAllProduct);
router.get("/barcode/:barcode", getProductByBarcode);


module.exports = router;
