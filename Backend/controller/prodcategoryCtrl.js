const Category = require("../models/prodcategoryModel.js");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateSlug = async (title, excludeId = null) => {
  let base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = base;
  let i = 1;
  while (await Category.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

// Returns flat array of all descendant IDs (BFS)
const getDescendantIds = async (categoryId) => {
  const result = [];
  const queue = [String(categoryId)];
  while (queue.length) {
    const current = queue.shift();
    const children = await Category.find({ parent: current }, "_id").lean();
    children.forEach((c) => {
      result.push(c._id);
      queue.push(String(c._id));
    });
  }
  return result;
};

// ── CRUD ─────────────────────────────────────────────────────────────────────

const createCategory = asyncHandler(async (req, res) => {
  const { title, parent, image, order } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: "Title is required" });

  // Check duplicate title under same parent
  const existing = await Category.findOne({
    title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
    parent: parent || null,
  });
  if (existing) return res.status(400).json({ message: "Category already exists under this parent" });

  const slug = await generateSlug(title.trim());
  const cat = await Category.create({
    title: title.trim(),
    slug,
    parent: parent || null,
    image: image || {},
    order: order || 0,
  });
  res.json(cat);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const { title, parent, image, order } = req.body;
  const updates = {};
  if (title !== undefined) {
    updates.title = title.trim();
    updates.slug = await generateSlug(title.trim(), id);
  }
  if (parent !== undefined) updates.parent = parent || null;
  if (image !== undefined) updates.image = image;
  if (order !== undefined) updates.order = order;
  const updated = await Category.findByIdAndUpdate(id, updates, { new: true }).populate("parent", "title slug");
  res.json(updated);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const childCount = await Category.countDocuments({ parent: id });
  if (childCount > 0) {
    return res.status(400).json({ message: `Cannot delete: has ${childCount} subcategory(ies). Remove them first.` });
  }
  const deleted = await Category.findByIdAndDelete(id);
  res.json(deleted);
});

const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const cat = await Category.findById(id).populate("parent", "title slug");
  res.json(cat);
});

const getallCategory = asyncHandler(async (req, res) => {
  const cats = await Category.find().sort({ order: 1, title: 1 }).populate("parent", "title slug _id").lean();
  res.json(cats);
});

// ── Tree endpoint ─────────────────────────────────────────────────────────────

const getCategoryTree = asyncHandler(async (req, res) => {
  const all = await Category.find().sort({ order: 1, title: 1 }).lean();

  const buildTree = (parentId) =>
    all
      .filter((c) => String(c.parent || "") === String(parentId || ""))
      .map((c) => ({ ...c, children: buildTree(c._id) }));

  res.json(buildTree(null));
});

// ── Descendants endpoint (used by product filter) ─────────────────────────────

const getCategoryDescendants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const descendants = await getDescendantIds(id);
  res.json([id, ...descendants]);
});

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  getallCategory,
  getCategoryTree,
  getCategoryDescendants,
  getDescendantIds,
};
