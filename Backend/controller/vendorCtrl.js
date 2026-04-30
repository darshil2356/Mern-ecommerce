const Vendor = require("../models/vendorModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
  res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findByIdAndDelete(id);
  res.json(vendor);
});

const getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findById(id);
  res.json(vendor);
});

const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find();
  res.json(vendors);
});

module.exports = { createVendor, updateVendor, deleteVendor, getVendor, getAllVendors };
