const asyncHandler = require("express-async-handler");
const ProductInquiry = require("../models/productInquiryModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const validateMongoDbId = require("../utils/validateMongodbId");
const { sendPushNotification } = require("./notificationCtrl");

// POST /api/product-inquiry  — user submits inquiry for OOS product
const createProductInquiry = asyncHandler(async (req, res) => {
  const { productId, name, mobile, email, color, colorHex, size, quantity, note } = req.body;

  if (!productId || !name || !mobile) {
    res.status(400);
    throw new Error("productId, name and mobile are required");
  }

  const product = await Product.findById(productId).select("title");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const userId = req.user?._id || null;

  const inquiry = await ProductInquiry.create({
    product: productId,
    user: userId,
    name,
    mobile,
    email: email || "",
    color: color || "",
    colorHex: colorHex || "",
    size: size || "",
    quantity: quantity || 1,
    note: note || "",
  });

  // Notify all admin users about the new inquiry
  try {
    const admins = await User.find({ role: "admin", fcmTokens: { $exists: true, $not: { $size: 0 } } }).select("fcmTokens");
    const adminTokens = admins.flatMap((a) => a.fcmTokens || []);
    if (adminTokens.length > 0) {
      await sendPushNotification(adminTokens, "NEW_STOCK_INQUIRY", {
        productName: product.title,
        customerName: name,
        productId: productId.toString(),
      });
    }
  } catch (_) {}

  res.status(201).json({ success: true, message: "Inquiry submitted successfully", inquiry });
});

// GET /api/product-inquiry  — admin: get all inquiries
const getAllInquiries = asyncHandler(async (req, res) => {
  const inquiries = await ProductInquiry.find()
    .populate("product", "title images slug")
    .populate("user", "firstname lastname mobile")
    .sort({ createdAt: -1 });
  res.json(inquiries);
});

// GET /api/product-inquiry/product/:productId  — admin: inquiries for a specific product
const getInquiriesByProduct = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.productId);
  const inquiries = await ProductInquiry.find({ product: req.params.productId })
    .populate("user", "firstname lastname mobile fcmTokens")
    .sort({ createdAt: -1 });
  res.json(inquiries);
});

// PUT /api/product-inquiry/:id  — admin: update status
const updateInquiryStatus = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const updated = await ProductInquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  )
    .populate("product", "title images slug")
    .populate("user", "firstname lastname mobile");
  res.json(updated);
});

// DELETE /api/product-inquiry/:id  — admin: delete
const deleteInquiry = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await ProductInquiry.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Inquiry deleted" });
});

// POST /api/product-inquiry/notify/:productId  — admin: notify all inquirers when product is restocked
const notifyRestockedInquirers = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.productId);

  const product = await Product.findById(req.params.productId).select("title images");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Get all pending inquiries for this product that have a user with FCM tokens
  const inquiries = await ProductInquiry.find({
    product: req.params.productId,
    status: "Pending",
  }).populate("user", "fcmTokens firstname");

  if (inquiries.length === 0) {
    return res.json({ success: true, message: "No pending inquiries to notify", notified: 0 });
  }

  // Collect all FCM tokens from inquirers who are registered users
  const tokens = [];
  inquiries.forEach((inq) => {
    if (inq.user?.fcmTokens?.length) {
      tokens.push(...inq.user.fcmTokens);
    }
  });

  let pushSent = 0;
  if (tokens.length > 0) {
    await sendPushNotification(tokens, "PRODUCT_RESTOCKED", {
      productName: product.title,
      productId: product._id.toString(),
    });
    pushSent = tokens.length;
  }

  // Only mark as Notified if at least one push was sent
  if (pushSent > 0) {
    await ProductInquiry.updateMany(
      { product: req.params.productId, status: "Pending" },
      { status: "Notified", notifiedAt: new Date() }
    );
  }

  res.json({
    success: true,
    message: pushSent > 0
      ? `Notified ${inquiries.length} inquirer(s) via ${pushSent} device(s)`
      : `Found ${inquiries.length} pending inquirer(s) but none have push notifications enabled`,
    notified: pushSent > 0 ? inquiries.length : 0,
    pushSent,
  });
});

module.exports = {
  createProductInquiry,
  getAllInquiries,
  getInquiriesByProduct,
  updateInquiryStatus,
  deleteInquiry,
  notifyRestockedInquirers,
};
