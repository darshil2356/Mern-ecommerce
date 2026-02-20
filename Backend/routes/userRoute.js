const express = require("express");
const {
  getallUser,
  createUser,
  searchUsers,
  getGstin,
  updateGstin
} = require("../controller/userCtrl");
const { authMiddleware } = require("../middlewares/authMiddleware");




const router = express.Router();
router.get("/", searchUsers);


// Get all users (for admin panel)
router.get("/all-users", getallUser);

// Create customer (admin)
router.post("/create-customer", createUser);

// GSTIN routes - protected by auth middleware
router.get("/gstin", authMiddleware, getGstin);
router.put("/gstin", authMiddleware, updateGstin);

module.exports = router;

