const Bundle = require("../models/bundleModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");

const bundleProductPopulate = {
  path: "products.product",
  populate: [
    { path: "color" },
    { path: "variants.color" },
  ],
};

// Create a new bundle
const createBundle = asyncHandler(async (req, res) => {
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    const newBundle = await Bundle.create(req.body);
    res.json(newBundle);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all bundles
const getAllBundles = asyncHandler(async (req, res) => {
  try {
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Bundle.find(JSON.parse(queryStr)).populate(bundleProductPopulate);

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      query = query.select(fields);
    }

    const page = req.query.page;
    const limit = req.query.limit;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const bundleCount = await Bundle.countDocuments();
      if (skip >= bundleCount) throw new Error("This Page does not exists");
    }

    const bundles = await query;
    res.json(bundles);
  } catch (error) {
    throw new Error(error);
  }
});

// Get single bundle
const getBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const bundle = await Bundle.findById(id).populate(bundleProductPopulate);
    res.json(bundle);
  } catch (error) {
    throw new Error(error);
  }
});

// Update bundle
const updateBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    const updatedBundle = await Bundle.findByIdAndUpdate(id, req.body, {
      new: true,
    }).populate(bundleProductPopulate);

    res.json(updatedBundle);
  } catch (error) {
    throw new Error(error);
  }
});

// Delete bundle
const deleteBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedBundle = await Bundle.findByIdAndDelete(id);
    res.json(deletedBundle);
  } catch (error) {
    throw new Error(error);
  }
});

// Get bundles for product page (frequently bought together)
const getBundlesForProduct = asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Find bundles that contain this product and are active
    const bundles = await Bundle.find({
      "products.product": productId,
      isActive: true,
      showOnProductPage: true,
    }).populate(bundleProductPopulate);

    res.json(bundles);
  } catch (error) {
    throw new Error(error);
  }
});

// Get active bundles for storefront
const getActiveBundles = asyncHandler(async (req, res) => {
  try {
    const bundles = await Bundle.find({ isActive: true })
      .populate(bundleProductPopulate)
      .sort("-createdAt");
    res.json(bundles);
  } catch (error) {
    throw new Error(error);
  }
});

// Get bundle stats for dashboard
const getBundleStats = asyncHandler(async (req, res) => {
  try {
    const totalBundles = await Bundle.countDocuments();
    const activeBundles = await Bundle.countDocuments({ isActive: true });
    const lowStockBundles = await Bundle.find({
      $expr: { $lte: ["$stock", "$minStockWarning"] },
      isActive: true,
    });

    res.json({
      totalBundles,
      activeBundles,
      lowStockBundles: lowStockBundles.length,
    });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  createBundle,
  getAllBundles,
  getBundle,
  updateBundle,
  deleteBundle,
  getBundlesForProduct,
  getActiveBundles,
  getBundleStats,
};
