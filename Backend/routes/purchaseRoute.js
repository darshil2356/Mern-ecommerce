const express = require("express");
const {
  createPurchase,
  getAllPurchases,
  getPurchase,
  updatePurchase,
  deletePurchase,
  recordPayment,
  getPurchaseSummary,
} = require("../controller/purchaseCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createPurchase);
router.get("/", authMiddleware, isAdmin, getAllPurchases);
router.get("/summary", authMiddleware, isAdmin, getPurchaseSummary);
router.get("/:id", authMiddleware, isAdmin, getPurchase);
router.put("/:id", authMiddleware, isAdmin, updatePurchase);
router.delete("/:id", authMiddleware, isAdmin, deletePurchase);
router.post("/:id/pay", authMiddleware, isAdmin, recordPayment);

module.exports = router;
