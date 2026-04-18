const Size = require("../models/sizeModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

const createSize = asyncHandler(async (req, res) => {
  const newSize = await Size.create({ title: req.body.title?.trim() });
  res.json(newSize);
});

const updateSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const updated = await Size.findByIdAndUpdate(id, { title: req.body.title?.trim() }, { new: true });
  res.json(updated);
});

const deleteSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const deleted = await Size.findByIdAndDelete(id);
  res.json(deleted);
});

const getSize = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const size = await Size.findById(id);
  res.json(size);
});

const getAllSizes = asyncHandler(async (req, res) => {
  const sizes = await Size.find().sort({ createdAt: 1 });
  res.json(sizes);
});

module.exports = { createSize, updateSize, deleteSize, getSize, getAllSizes };
