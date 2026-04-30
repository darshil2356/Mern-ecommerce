const express = require("express");
const { createVendor, updateVendor, deleteVendor, getVendor, getAllVendors } = require("../controller/vendorCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/", authMiddleware, isAdmin, createVendor);
router.put("/:id", authMiddleware, isAdmin, updateVendor);
router.delete("/:id", authMiddleware, isAdmin, deleteVendor);
router.get("/:id", getVendor);
router.get("/", getAllVendors);

module.exports = router;
