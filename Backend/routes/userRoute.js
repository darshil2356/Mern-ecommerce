const express = require("express");
const {
  getallUser,
  createUser,
  searchUsers,
  getGstin,
  updateGstin,
  getSettings,
  updateSettings,
  getCustomerOffer,
  updateCustomerOffer,
  getCustomerDetails,
  getAllReferrals,
  updateCustomerById,
  deleteCustomerById,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");




const router = express.Router();
router.get("/", searchUsers);


// Get all users (for admin panel)
router.get("/all-users", getallUser);

// Create customer (admin)
router.post("/create-customer", createUser);

// GSTIN routes - protected by auth middleware
router.get("/gstin", authMiddleware, getGstin);
router.put("/gstin", authMiddleware, updateGstin);

// Settings routes - protected by auth middleware
router.get("/settings", authMiddleware, getSettings);
router.put("/settings", authMiddleware, updateSettings);

// Customer offer routes - protected by auth middleware
router.get("/customer-offer", authMiddleware, isAdmin, getCustomerOffer);
router.put("/customer-offer", authMiddleware, isAdmin, updateCustomerOffer);

// Get customer details with order history - protected by auth middleware
router.get("/customer/:id", authMiddleware, isAdmin, getCustomerDetails);

// Update customer (admin)
router.put("/update-customer/:id", authMiddleware, isAdmin, updateCustomerById);

// Delete customer (admin)
router.delete("/delete-customer/:id", authMiddleware, isAdmin, deleteCustomerById);

// Get all referrals (for admin)
router.get("/all-referrals", authMiddleware, isAdmin, getAllReferrals);

module.exports = router;

