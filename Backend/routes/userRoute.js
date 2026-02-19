const express = require("express");
const {
  getallUser,
  createUser,
  searchUsers
} = require("../controller/userCtrl");




const router = express.Router();
router.get("/", searchUsers);


// Get all users (for admin panel)
router.get("/all-users", getallUser);

// Create customer (admin)
router.post("/create-customer", createUser);

module.exports = router;