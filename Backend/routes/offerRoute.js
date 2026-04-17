const express = require("express");
const {
  createOffer,
  getAllOffers,
  getOffer,
  updateOffer,
  deleteOffer,
  applyOffers,
  getOffersForProduct,
} = require("../controller/offerCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public / customer routes
router.post("/apply", applyOffers);
router.get("/product/:productId", getOffersForProduct);

// Admin routes
router.post("/", authMiddleware, isAdmin, createOffer);
router.get("/", authMiddleware, isAdmin, getAllOffers);
router.get("/:id", authMiddleware, isAdmin, getOffer);
router.put("/:id", authMiddleware, isAdmin, updateOffer);
router.delete("/:id", authMiddleware, isAdmin, deleteOffer);

module.exports = router;
