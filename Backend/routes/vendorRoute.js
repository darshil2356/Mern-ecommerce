const express = require("express");
const {
  createVendor,
  updateVendor,
  deleteVendor,
  getVendor,
  getAllVendors,
  getVendorLedger,
} = require("../controller/vendorCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createVendor);
router.get("/", authMiddleware, isAdmin, getAllVendors);
router.get("/:id/ledger", authMiddleware, isAdmin, getVendorLedger);
router.get("/:id", authMiddleware, isAdmin, getVendor);
router.put("/:id", authMiddleware, isAdmin, updateVendor);
router.delete("/:id", authMiddleware, isAdmin, deleteVendor);

module.exports = router;
