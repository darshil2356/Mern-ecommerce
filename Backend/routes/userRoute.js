const express = require("express");
const {
  getallUser,
  createUser,
} = require("../controller/userCtrl");

const router = express.Router();

// Get all users (for admin panel)
router.get("/all-users", getallUser);

// Create customer (admin)
router.post("/create-customer", createUser);

module.exports = router;