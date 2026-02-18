const express = require("express");
const router = express.Router();
const {
  createCustomer,
  getAllCustomers,
} = require("../controller/customerCtrl");

router.post("/", createCustomer);
router.get("/", getAllCustomers);

module.exports = router;
