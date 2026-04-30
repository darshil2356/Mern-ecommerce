const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { checkout, paymentVerification } = require("../controller/paymentCtrl");
const { getProductByBarcode } = require("../controller/userCtrl");
const { sendPhoneOTP, verifyPhoneOTP, requirePhoneVerified } = require("../controller/otpCtrl");
const {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  userCart,
  getUserCart,
  createOrder,
  registerUser,
  removeProductFromCart,
  updateProductQuantityFromCart,
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getYearlyTotalOrder,
  getAllOrders,
  getsingleOrder,
  getMySingleOrder,
  updateOrder,
  createOfflineOrder,
  getCustomerOffer,
  updateCustomerOffer,
  getDailySales,
  getDashboardStats,
  checkStock,
  generateReferralCode,
  getMyReferrals,
  applyReferral,
  getAllReferrals,
  addBundleToCart,
  cancelOrder,
  adminCancelOrder,
  searchUsers,
  validateCartStock,
  validateShippingAddress,
} = require("../controller/userCtrl");







const router = express.Router();
router.post(
  "/offline-order",
  authMiddleware,
  isAdmin,
  createOfflineOrder
);

// Stock check route
router.post("/check-stock", authMiddleware, isAdmin, checkStock);


router.get("/my-referrals", authMiddleware, getMyReferrals);
router.get("/search", authMiddleware, isAdmin, searchUsers);

// Customer offer routes
router.get("/customer-offer", authMiddleware, isAdmin, getCustomerOffer);
router.put("/customer-offer", authMiddleware, isAdmin, updateCustomerOffer);
// OTP routes for phone verification
router.post("/send-otp", sendPhoneOTP);
router.post("/verify-otp", verifyPhoneOTP);

// Register — OTP required only if admin has enabled it
router.post("/register", async (req, res, next) => {
  try {
    const User = require("../models/userModel");
    const admin = await User.findOne({ role: "admin" }).select("requireOtpForSignup");
    if (admin?.requireOtpForSignup) {
      return requirePhoneVerified(req, res, next);
    }
    next();
  } catch {
    next();
  }
}, registerUser);

router.post("/forgot-password-token", forgotPasswordToken);
// router.get("/barcode/:barcode", getProductByBarcode);

router.put("/reset-password/:token", resetPassword);

router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/cart/bundle", authMiddleware, addBundleToCart);
router.post("/order/checkout", authMiddleware, checkout);
router.post("/order/paymentVerification", authMiddleware, paymentVerification);

router.post("/cart/create-order", authMiddleware, createOrder);
router.post("/cart/validate", authMiddleware, validateCartStock);
router.post("/validate-address", authMiddleware, validateShippingAddress);
router.get("/all-users", authMiddleware, isAdmin, getallUser);
router.get("/getmyorders", authMiddleware, getMyOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.get("/getaOrder/:id", authMiddleware, isAdmin, getsingleOrder);
router.get("/getmyorder/:id", authMiddleware, getMySingleOrder);
router.put("/updateOrder/:id", authMiddleware, isAdmin, updateOrder);
router.put("/cancel-order/:id", authMiddleware, cancelOrder);
router.put("/admin-cancel-order/:id", authMiddleware, isAdmin, adminCancelOrder);

router.get("/getMonthWiseOrderIncome", authMiddleware, isAdmin, getMonthWiseOrderIncome);
router.get("/getDailySales", authMiddleware, isAdmin, getDailySales);
router.get("/getDashboardStats", authMiddleware, isAdmin, getDashboardStats);
router.get("/getyearlyorders", authMiddleware, getYearlyTotalOrder);

router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);



router.delete(
  "/delete-product-cart/:cartItemId",
  authMiddleware,
  removeProductFromCart
);
router.delete(
  "/update-product-cart/:cartItemId/:newQuantity",
  authMiddleware,
  updateProductQuantityFromCart
);

router.delete("/empty-cart", authMiddleware, emptyCart);

router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
// Address book routes
router.get("/addresses", authMiddleware, getAddresses);
router.post("/addresses", authMiddleware, addAddress);
router.put("/addresses/:addrId", authMiddleware, updateAddress);
router.delete("/addresses/:addrId", authMiddleware, deleteAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

// Public GST settings — no auth needed
router.get("/public-settings", async (req, res) => {
  try {
    const User = require("../models/userModel");
    const admin = await User.findOne({ role: "admin" }).select("cgst sgst igst storeState taxIncluded shippingCharge requireOtpForSignup storeName storeTagline storeAddress storePhone storeEmail");
    res.json({
      cgst: admin?.cgst || 0,
      sgst: admin?.sgst || 0,
      igst: admin?.igst || 0,
      storeState: admin?.storeState || "Gujarat",
      taxIncluded: admin?.taxIncluded === true,
      shippingCharge: admin?.shippingCharge ?? 100,
      requireOtpForSignup: admin?.requireOtpForSignup === true,
      storeName: admin?.storeName || "Yashoda Fashion",
      storeTagline: admin?.storeTagline || "",
      storeAddress: admin?.storeAddress || "",
      storePhone: admin?.storePhone || "",
      storeEmail: admin?.storeEmail || "",
    });
  } catch {
    res.json({ cgst: 0, sgst: 0, igst: 0, storeState: "Gujarat", taxIncluded: false, shippingCharge: 100, requireOtpForSignup: false, storeName: "Yashoda Fashion", storeTagline: "", storeAddress: "", storePhone: "", storeEmail: "" });
  }
});

// Referral routes
router.get("/referral-code", authMiddleware, generateReferralCode);
router.post("/apply-referral", authMiddleware, applyReferral);
router.get("/all-referrals", authMiddleware, isAdmin, getAllReferrals);

// Wildcard routes — must be last
router.delete("/:id", authMiddleware, isAdmin, deleteaUser);
router.get("/:id", authMiddleware, isAdmin, getaUser);

module.exports = router;
