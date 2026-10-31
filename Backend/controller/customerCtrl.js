const Customer = require("../models/customerModel");

// Create Customer
const createCustomer = async (req, res) => {
  try {
    const cleanContact = String(req.body.contactNumber || "").replace(/\D/g, "").slice(-10);
    if (!cleanContact || cleanContact.length !== 10) {
      return res.status(400).json({ message: "Valid 10-digit contact number is required" });
    }
    const existing = await Customer.findOne({ contactNumber: cleanContact });
    if (existing) {
      return res.status(400).json({
        message: `Contact number ${cleanContact} is already registered to "${existing.firstName} ${existing.lastName}". One mobile number cannot have two different names.`,
      });
    }
    const newCustomer = await Customer.create({ ...req.body, contactNumber: cleanContact });
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
};
