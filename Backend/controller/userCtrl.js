const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const { createPasswordResetToken } = require("../models/userModel");




const createOfflineOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, customer, discount, total } = req.body;
  const adminId = req.user._id;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  // Find the actual customer by mobile if provided
  let customerId = adminId; // Default to admin (for walk-in customers)
  if (customer && customer.contact) {
    const actualCustomer = await User.findOne({ mobile: customer.contact, role: "user" });
    if (actualCustomer) {
      customerId = actualCustomer._id;
      
      // Update customer's total orders and last order date
      actualCustomer.totalOrders = (actualCustomer.totalOrders || 0) + 1;
      actualCustomer.lastOrderDate = new Date();
      await actualCustomer.save();
    }
  }

  let orderItems = [];
  let totalPrice = 0;

  for (const item of items) {
    const product = await Product.findOne({ barcode: item.barcode });

    if (!product) {
      res.status(404);
      throw new Error(`Product not found for barcode ${item.barcode}`);
    }

    if (product.quantity < item.quantity) {
      res.status(400);
      throw new Error(
        `Insufficient stock for ${product.title}`
      );
    }

    // Deduct stock
    product.quantity -= item.quantity;
    product.sold += item.quantity;
    await product.save();

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      color: product.color?.[0] || null, // safe default
    });

    totalPrice += product.price * item.quantity;
  }

  // Calculate discount amount
  const discountAmount = discount || 0;
  const totalPriceAfterDiscount = totalPrice - discountAmount;

  const order = await Order.create({
    user: customerId,
    orderItems,
    totalPrice,
    totalPriceAfterDiscount,
    discountAmount: discountAmount, // Store discount amount for reference
    paymentInfo: {
      razorpayOrderId: paymentMethod || "OFFLINE",
      razorpayPaymentId: "OFFLINE",
    },
    orderStatus: "Delivered",
    mode: "OFFLINE",
  });

  res.json({
    success: true,
    order,
  });
});


const registerUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });

  // Case 1: New online user
  if (!existingUser) {
    const newUser = await User.create(req.body);
    return res.json(newUser);
  }

  // Case 2: Offline user activating account
  if (existingUser && !existingUser.password) {
    existingUser.password = password;
    await existingUser.save();

    return res.json({
      message: "Account activated successfully",
    });
  }

  // Case 3: Already activated
  throw new Error("User Already Exists");
});



// Create a User ----------------------------------------------

// const createUser = asyncHandler(async (req, res) => {
//   /**
//    * TODO:Get the email from req.body
//    */
//   const email = req.body.email;
//   /**
//    * TODO:With the help of email find the user exists or not
//    */
//   const findUser = await User.findOne({ email: email });

//   if (!findUser) {
//     /**
//      * TODO:if user not found user create a new user
//      */
//     const newUser = await User.create(req.body);
//     res.json(newUser);
//   } else {
//     /**
//      * TODO:if user found then thow an error: User already exists
//      */
//     throw new Error("User Already Exists");
//   }
// });
const createUser = asyncHandler(async (req, res) => {
  const { email, firstname, lastname, mobile } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const newUser = await User.create({
    firstname,
    lastname,
    email,
    mobile,
    password: null,   // IMPORTANT
    role: "user",
  });

  res.json(newUser);
});



// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  // if (findUser && (await findUser.isPasswordMatched(password))) {
  if (!findUser || !findUser.password) {
  throw new Error("Invalid Credentials");
}

if (await findUser.isPasswordMatched(password)) {

    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// admin login

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// logout functionality

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Update a user

const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();

    await user.save();
    console.log(token);
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:3000/reset-password/${token}'>Click Here</>`;

    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const userCart = asyncHandler(async (req, res) => {
  const { productId, color, quantity, price } = req.body;

  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let newCart = await new Cart({
      userId: _id,
      productId,
      color,
      price,
      quantity,
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.find({ userId: _id })
      .populate("productId")
      .populate("color");
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId } = req.params;
  validateMongoDbId(_id);
  try {
    const deleteProductFromcart = await Cart.deleteOne({
      userId: _id,
      _id: cartItemId,
    });

    res.json(deleteProductFromcart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const deleteCart = await Cart.deleteMany({
      userId: _id,
    });

    res.json(deleteCart);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId, newQuantity } = req.params;
  validateMongoDbId(_id);
  try {
    const cartItem = await Cart.findOne({
      userId: _id,
      _id: cartItemId,
    });
    cartItem.quantity = newQuantity;
    cartItem.save();
    res.json(cartItem);
  } catch (error) {
    throw new Error(error);
  }
});

const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingInfo,
    orderItems,
    totalPrice,
    totalPriceAfterDiscount,
    paymentInfo,
  } = req.body;
  const { _id } = req.user;
  try {
    const order = await Order.create({
      shippingInfo,
      orderItems,
      totalPrice,
      totalPriceAfterDiscount,
      paymentInfo,
      user: _id,
    });
    res.json({
      order,
      success: true,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find({ user: _id })
      .populate("user")
      .populate("orderItems.product")
      .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find()
      .populate("user")
      .select("+discountAmount") // Include discountAmount field
      .sort({ createdAt: -1 }); // Sort by newest first
    // .populate("orderItems.product")
    // .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getsingleOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findOne({ _id: id })
      .select("+discountAmount") // Include discountAmount field
      .populate({
        path: "orderItems.product",
        select: "title brand price images barcode"
      })
      .populate("orderItems.color")
      .populate("user", "firstname lastname email mobile");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findById(id);
    orders.orderStatus = req.body.status;
    await orders.save();
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get monthly order income (fixed aggregation)
const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
  let monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);
  
  // Format response with month names
  const formattedData = data.map(item => ({
    _id: item._id.month,
    month: monthNames[item._id.month - 1] + " " + item._id.year,
    amount: item.amount,
    count: item.count
  }));
  
  res.json(formattedData);
});

// Get daily sales for a date range
const getDailySales = asyncHandler(async (req, res) => {
  const { startDate, endDate, mode } = req.query;
  
  let matchCondition = {};
  
  // Parse dates
  const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0));
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);
  
  matchCondition.createdAt = { $gte: start, $lte: end };
  
  // Filter by mode if provided
  if (mode && (mode === 'ONLINE' || mode === 'OFFLINE')) {
    matchCondition.mode = mode;
  }
  
  const data = await Order.aggregate([
    {
      $match: matchCondition,
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        date: { $first: "$createdAt" },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
        discount: { $sum: "$discountAmount" }
      },
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  res.json(data);
});

// Get dashboard stats with various filters
const getDashboardStats = asyncHandler(async (req, res) => {
  const { filter, mode } = req.query; // filter: 'today', '7days', 'month', 'year', 'custom'
  const { startDate, endDate } = req.query;
  
  let start = new Date();
  let end = new Date();
  
  switch (filter) {
    case 'today':
      start = new Date(new Date().setHours(0, 0, 0, 0));
      end = new Date();
      break;
    case '7days':
      start.setDate(start.getDate() - 7);
      start = new Date(start.setHours(0, 0, 0, 0));
      break;
    case 'month':
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      break;
    case 'year':
      start = new Date(start.getFullYear(), 0, 1);
      break;
    case 'custom':
      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start.setDate(start.getDate() - 30);
      start = new Date(start.setHours(0, 0, 0, 0));
  }
  
  let matchCondition = {
    createdAt: { $gte: start, $lte: end }
  };
  
  // Filter by mode if provided
  if (mode && (mode === 'ONLINE' || mode === 'OFFLINE')) {
    matchCondition.mode = mode;
  }
  
  // Get basic stats
  const stats = await Order.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPriceAfterDiscount" },
        totalOrders: { $sum: 1 },
        totalDiscount: { $sum: "$discountAmount" },
        totalSubtotal: { $sum: "$totalPrice" }
      }
    }
  ]);
  
  // Get orders by status
  const ordersByStatus = await Order.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get orders by mode (payment type)
  const ordersByMode = await Order.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$mode",
        count: { $sum: 1 },
        revenue: { $sum: "$totalPriceAfterDiscount" }
      }
    }
  ]);
  
  // Get top selling products
  const topProducts = await Order.aggregate([
    { $match: matchCondition },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: "$orderItems.product",
        totalQuantity: { $sum: "$orderItems.quantity" },
        totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: "$product._id",
        title: "$product.title",
        totalQuantity: 1,
        totalRevenue: 1
      }
    }
  ]);
  
  // Get top customers
  const topCustomers = await Order.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: "$user",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalPriceAfterDiscount" }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "customer"
      }
    },
    { $unwind: "$customer" },
    {
      $project: {
        _id: "$customer._id",
        firstname: "$customer.firstname",
        lastname: "$customer.lastname",
        mobile: "$customer.mobile",
        totalOrders: 1,
        totalSpent: 1
      }
    }
  ]);
  
  // Get hourly distribution (for today analysis)
  let hourlyData = [];
  if (filter === 'today' || filter === '7days') {
    hourlyData = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $hour: "$createdAt" },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPriceAfterDiscount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
  
  res.json({
    stats: stats[0] || { totalRevenue: 0, totalOrders: 0, totalDiscount: 0, totalSubtotal: 0 },
    ordersByStatus,
    ordersByMode,
    topProducts,
    topCustomers,
    hourlyData,
    dateRange: { start, end }
  });
});

const getYearlyTotalOrder = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        amount: { $sum: 1 },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(data);
});


const getProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  const product = await Product.findOne({ barcode });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    _id: product._id,
    title: product.title,
    price: product.price,
    quantity: product.quantity,
    barcode: product.barcode,
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.json([]);
  }

  const users = await User.find({
    role: "user",
    $or: [
      { firstname: { $regex: query, $options: "i" } },
      { lastname: { $regex: query, $options: "i" } },
      { mobile: { $regex: query } }
    ]
  })
    .limit(10)
    .select("firstname lastname mobile address offerDiscount offerType totalOrders lastOrderDate");

  res.json(users);
});

// Get customer offer details
const getCustomerOffer = asyncHandler(async (req, res) => {
  const { mobile } = req.query;

  if (!mobile) {
    res.status(400);
    throw new Error("Mobile number is required");
  }

  const customer = await User.findOne({ mobile, role: "user" });

  if (!customer) {
    return res.json({
      hasOffer: false,
      offerDiscount: 0,
      offerType: "",
      totalOrders: 0
    });
  }

  res.json({
    hasOffer: customer.offerType !== "",
    offerDiscount: customer.offerDiscount || 0,
    offerType: customer.offerType || "",
    totalOrders: customer.totalOrders || 0,
    lastOrderDate: customer.lastOrderDate
  });
});

// Update customer offer (for spin wheel)
const updateCustomerOffer = asyncHandler(async (req, res) => {
  const { mobile, offerDiscount, offerType } = req.body;

  if (!mobile) {
    res.status(400);
    throw new Error("Mobile number is required");
  }

  const customer = await User.findOne({ mobile, role: "user" });

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  customer.offerDiscount = offerDiscount || 0;
  customer.offerType = offerType || "";
  await customer.save();

  res.json({
    success: true,
    offerDiscount: customer.offerDiscount,
    offerType: customer.offerType
  });
});

// Get GSTIN for logged in user
const getGstin = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const user = await User.findById(_id).select("gstin");
    res.json({ gstin: user.gstin || "" });
  } catch (error) {
    throw new Error(error);
  }
});

// Update GSTIN for logged in user
const updateGstin = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const { gstin } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { gstin: gstin || "" },
      { new: true }
    ).select("gstin");
    
    res.json({ gstin: updatedUser.gstin });
  } catch (error) {
    throw new Error(error);
  }
});

// Get customer details with order history
const getCustomerDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    // Get customer user
    const customer = await User.findById(id);
    
    if (!customer) {
      res.status(404);
      throw new Error("Customer not found");
    }

    // Get all orders for this customer with product details
    const orders = await Order.find({ user: id })
      .populate({
        path: "orderItems.product",
        select: "title brand price images barcode"
      })
      .populate("orderItems.color")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalPurchaseAmount = orders.reduce((sum, order) => sum + (order.totalPriceAfterDiscount || 0), 0);
    const lastOrder = orders.length > 0 ? orders[0] : null;

    // Calculate total savings offered
    const totalSavings = orders.reduce((sum, order) => {
      return sum + ((order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0));
    }, 0);

    res.json({
      customer: {
        _id: customer._id,
        firstname: customer.firstname,
        lastname: customer.lastname,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address,
        gstin: customer.gstin,
        createdAt: customer.createdAt,
        offerDiscount: customer.offerDiscount,
        offerType: customer.offerType,
      },
      statistics: {
        totalOrders,
        totalPurchaseAmount,
        totalSavings,
        lastOrderDate: lastOrder ? lastOrder.createdAt : null,
      },
      orders: orders.map(order => ({
        _id: order._id,
        orderItems: order.orderItems.map(item => ({
          product: item.product ? {
            _id: item.product._id,
            title: item.product.title,
            brand: item.product.brand,
            price: item.product.price,
            images: item.product.images,
            barcode: item.product.barcode
          } : null,
          quantity: item.quantity,
          price: item.price,
          color: item.color
        })),
        totalPrice: order.totalPrice,
        totalPriceAfterDiscount: order.totalPriceAfterDiscount,
        discountAmount: order.discountAmount || 0,
        orderStatus: order.orderStatus,
        mode: order.mode,
        paymentInfo: order.paymentInfo,
        shippingInfo: order.shippingInfo,
        createdAt: order.createdAt,
      }))
    });
  } catch (error) {
    throw new Error(error);
  }
});



module.exports = {
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
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getDailySales,
  getDashboardStats,
  getAllOrders,
  getsingleOrder,
  updateOrder,
  getYearlyTotalOrder,

  removeProductFromCart,
  updateProductQuantityFromCart,
  createOfflineOrder,
  getProductByBarcode,
  registerUser,
  searchUsers,
  getGstin,
  updateGstin,
  getCustomerOffer,
  updateCustomerOffer,
  getCustomerDetails,

};
