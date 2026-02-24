const express = require("express");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { checkout, paymentVerification } = require("../controller/paymentCtrl");
const { getProductByBarcode } = require("../controller/userCtrl"); 
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
  userCart,
  getUserCart,

  createOrder,
  registerUser,
   

  removeProductFromCart,
  updateProductQuantityFromCart,
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getMonthWiseOrderCount,
  getYearlyTotalOrder,
  getAllOrders,
  getsingleOrder,
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

// Customer offer routes
router.get("/customer-offer", authMiddleware, isAdmin, getCustomerOffer);
router.put("/customer-offer", authMiddleware, isAdmin, updateCustomerOffer);
// router.post("/register", createUser);
router.post("/register", registerUser);

router.post("/forgot-password-token", forgotPasswordToken);
// router.get("/barcode/:barcode", getProductByBarcode);

router.put("/reset-password/:token", resetPassword);

router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/order/checkout", authMiddleware, checkout);
router.post("/order/paymentVerification", authMiddleware, paymentVerification);

router.post("/cart/create-order", authMiddleware, createOrder);
router.get("/all-users", getallUser);
router.get("/getmyorders", authMiddleware, getMyOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.get("/getaOrder/:id", authMiddleware, isAdmin, getsingleOrder);
router.put("/updateOrder/:id", authMiddleware, isAdmin, updateOrder);

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

router.delete("/:id", deleteaUser);

router.put("/edit-user", authMiddleware, updatedUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);
router.get("/:id", authMiddleware, isAdmin, getaUser);

// Referral routes
router.get("/referral-code", authMiddleware, generateReferralCode);

router.post("/apply-referral", authMiddleware, applyReferral);

// Admin: Get all referrals
router.get("/all-referrals", authMiddleware, isAdmin, getAllReferrals);

module.exports = router;
