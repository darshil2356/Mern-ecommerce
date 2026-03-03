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

  
  const { items, paymentMethod, customer, discount, coinsUsed, coinAmount } = req.body;
  const adminId = req.user._id;


   console.log("Incoming body:", req.body);
  console.log("Incoming customer:", customer);

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  let customerId = adminId;
  let actualCustomer = null;
  let purchaseCustomer = null;
  let newCustomer = null;
  let isNewCustomer = false;
  
  // Extract referralContact from customer object
  const referralContact = customer?.referralContact || null;

  // Step 1: Check if customer already exists
  if (customer && customer.contact) {
    actualCustomer = await User.findOne({
      mobile: customer.contact,
      role: "user",
    });

    if (actualCustomer) {
      customerId = actualCustomer._id;
      purchaseCustomer = actualCustomer;
    }
  }
  
  // =====================================================
  // REFERRAL PROCESSING SECTION
  // =====================================================
  let referrer = null;
  let referralApplied = false;
  
  // If referralContact is provided, try to find the referrer
  if (referralContact && referralContact.length >= 10) {
    // Find user by mobile number (referrer)
    referrer = await User.findOne({ 
      mobile: referralContact, 
      role: "user" 
    });
    
    if (referrer) {
      console.log("Referrer found:", referrer.firstname, referrer.lastname, referrer.referralCode);
    }
  }

  // Prevent self-referral in offline billing.
  if (
    referrer &&
    actualCustomer &&
    referrer._id.toString() === actualCustomer._id.toString()
  ) {
    referrer = null;
  }
  // =====================================================

  let orderItems = [];
  let totalPrice = 0;

  // Step 2: Validate & deduct stock
  for (const item of items) {
    // First try to find by main barcode
    let product = await Product.findOne({ barcode: item.barcode });

    // If not found, search in sizeStock array
    if (!product) {
      product = await Product.findOne({ "sizeStock.barcode": item.barcode });
    }

    if (!product) {
      res.status(404);
      throw new Error(`Product not found for barcode ${item.barcode}`);
    }

    // Check if barcode is from sizeStock
    let sizeInfo = null;
    let sizeIndex = -1;
    
    if (product.sizeStock && product.sizeStock.length > 0) {
      const sizeEntryIndex = product.sizeStock.findIndex(s => s.barcode === item.barcode);
      if (sizeEntryIndex !== -1) {
        sizeInfo = product.sizeStock[sizeEntryIndex];
        sizeIndex = sizeEntryIndex;
      }
    }

    let availableStock = 0;
    
    // Determine available stock based on whether it's size-specific
    if (sizeInfo) {
      availableStock = sizeInfo.quantity;
    } else {
      availableStock = product.quantity;
    }

    if (availableStock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}${sizeInfo ? ` (Size: ${sizeInfo.size})` : ''}`);
    }

    // Deduct stock
    if (sizeInfo && sizeIndex !== -1) {
      // Deduct from sizeStock
      product.sizeStock[sizeIndex].quantity -= item.quantity;
    } else {
      // Deduct from main quantity
      product.quantity -= item.quantity;
    }
    
    product.sold += item.quantity;
    await product.save();

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      color: product.color?.[0] || null,
      size: sizeInfo ? sizeInfo.size : null, // Store size info in order
      barcode: item.barcode // Store barcode for reference
    });

    totalPrice += product.price * item.quantity;
  }

  const discountAmount = discount || 0;
  const coinDiscountAmount = coinAmount || 0;
  const totalPriceAfterDiscount = totalPrice - discountAmount - coinDiscountAmount;

  // Step 3: Create order FIRST
  const order = await Order.create({
    user: customerId,
    orderItems,
    totalPrice,
    totalPriceAfterDiscount,
    discountAmount,
    coinsUsed: coinsUsed || 0,
    coinAmount: coinAmount || 0,
    paymentInfo: {
      razorpayOrderId: paymentMethod || "OFFLINE",
      razorpayPaymentId: "OFFLINE",
    },
    orderStatus: "Delivered",
    mode: "OFFLINE",
  });

  // Step 4: If customer does NOT exist → create AFTER order success
  if (customer && customer.contact && !actualCustomer) {
    // const nameParts = (customer.name || "Customer").split(" ");


    const fullName = (customer.name || "").trim();
// alert("Customer name is ",customer.name);
let firstname = "Customer";
let lastname = "NA"; // fallback to avoid validation error

if (fullName.length > 0) {
  const nameParts = fullName.split(" ");

  firstname = nameParts[0];

  if (nameParts.length > 1) {
    lastname = nameParts.slice(1).join(" ");
  }
}

// Build customer data object
const customerData = {
  firstname,
  lastname,
  mobile: customer.contact,
  // email: `${customer.contact}@temp.com`,
  email: customer.email || undefined,
  address: customer.address || "",
  password: null,
  role: "user",
  totalOrders: 1,
  lastOrderDate: new Date(),
};

// Generate a unique referral code for the new customer
const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

let newReferralCode = generateReferralCode();
// Ensure the code is unique
let existingCodeUser = await User.findOne({ referralCode: newReferralCode });
while (existingCodeUser) {
  newReferralCode = generateReferralCode();
  existingCodeUser = await User.findOne({ referralCode: newReferralCode });
}
customerData.referralCode = newReferralCode;

// =====================================================
// LINK REFERRAL FOR NEW CUSTOMER
// =====================================================
if (referrer) {
  customerData.referredBy = referrer._id;
  referralApplied = true;
  console.log("New customer will be linked to referrer:", referrer._id);
}
// =====================================================

    newCustomer = await User.create(customerData);

    order.user = newCustomer._id;
    await order.save();
    purchaseCustomer = newCustomer;

    isNewCustomer = true;
  }

  // Step 5: If existing customer → update stats
  if (actualCustomer) {
    actualCustomer.totalOrders =
      (actualCustomer.totalOrders || 0) + 1;
    actualCustomer.lastOrderDate = new Date();
    
    // =====================================================
    // DEDUCT COINS IF USED FOR PAYMENT
    // =====================================================
    if (coinsUsed && coinsUsed > 0 && actualCustomer) {
      const currentCoins = actualCustomer.coins || 0;
      const coinsToDeduct = Math.min(coinsUsed, currentCoins); // Can't deduct more than available
      
      if (coinsToDeduct > 0) {
        actualCustomer.coins = currentCoins - coinsToDeduct;
        console.log(`Deducted ${coinsToDeduct} coins from customer ${actualCustomer._id}`);
      }
    }
    // =====================================================

    // =====================================================
    // LINK REFERRAL FOR EXISTING CUSTOMER (if not already referred)
    // =====================================================
    if (referrer && !actualCustomer.referredBy) {
      actualCustomer.referredBy = referrer._id;
      referralApplied = true;
      console.log("Existing customer linked to referrer:", referrer._id);
    }
    // =====================================================
    
    await actualCustomer.save();
  }

  // Increment referral count only when a first-time referral link is created.
  if (referralApplied && referrer) {
    try {
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      await referrer.save();
    } catch (err) {
      console.error("Error incrementing referral count:", err);
    }
  }

  // Award lifetime referral coins on every order once customer is linked.
  if (totalPriceAfterDiscount > 0) {
    const purchasingUserId = purchaseCustomer?._id || order.user;
    await awardCoinsOnOrder(purchasingUserId, totalPriceAfterDiscount, 10);
  }

  res.json({
    success: true,
    order,
    newCustomer: isNewCustomer,
    referralApplied: referralApplied,
    referrerName: referralApplied ? `${referrer?.firstname} ${referrer?.lastname}` : null,
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, referralCode } = req.body;

  const existingUser = await User.findOne({ email });

  // Generate a unique referral code function
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  let newReferralCode = generateCode();
  
  // Ensure the code is unique
  let existingCodeUser = await User.findOne({ referralCode: newReferralCode });
  while (existingCodeUser) {
    newReferralCode = generateCode();
    existingCodeUser = await User.findOne({ referralCode: newReferralCode });
  }

  // Case 1: New online user
  if (!existingUser) {
    let referredByUser = null;
    
    // If referral code provided, find the referrer
    if (referralCode) {
      referredByUser = await User.findOne({ referralCode });
      if (!referredByUser) {
        // Invalid referral code, just continue without it
        console.log("Invalid referral code provided");
      }
    }

    const newUserData = {
      ...req.body,
      referralCode: newReferralCode, // Always generate a referral code for new users
    };
    
    // Add referredBy if valid referral code provided
    if (referredByUser) {
      newUserData.referredBy = referredByUser._id;
    }

    const newUser = await User.create(newUserData);
    if (referredByUser) {
      referredByUser.referralCount = (referredByUser.referralCount || 0) + 1;
      await referredByUser.save();
    }
    return res.json(newUser);
  }

  // Case 2: Offline user activating account
  if (existingUser && !existingUser.password) {
    existingUser.password = password;
    // Generate referral code if doesn't exist
    if (!existingUser.referralCode) {
      existingUser.referralCode = newReferralCode;
    }
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

  // Generate a unique referral code for the new user
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  let referralCode = generateReferralCode();
  // Ensure the code is unique
  let existingCodeUser = await User.findOne({ referralCode });
  while (existingCodeUser) {
    referralCode = generateReferralCode();
    existingCodeUser = await User.findOne({ referralCode });
  }

  const newUser = await User.create({
    firstname,
    lastname,
    email,
    mobile,
    password: null,   // IMPORTANT
    role: "user",
    referralCode: referralCode, // Generate referral code for new user
  });

  res.json(newUser);
});



// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password, mobile } = req.body;
  
  // Find user by email OR mobile
  let findUser = null;
  
  if (email) {
    findUser = await User.findOne({ email });
  } else if (mobile) {
    findUser = await User.findOne({ mobile });
  }
  
  // Check if user exists
  if (!findUser) {
    res.status(401);
    throw new Error("Invalid Credentials");
  }
  
  // Check if password exists
  if (!findUser.password) {
    res.status(401);
    throw new Error("No password set. Please activate your account first.");
  }
  
  // Verify password
  const isPasswordValid = await findUser.isPasswordMatched(password);
  
  if (!isPasswordValid) {
    res.status(401);
    throw new Error("Invalid Credentials");
  }

  // Generate refresh token
  const refreshToken = await generateRefreshToken(findUser._id);
  await User.findByIdAndUpdate(
    findUser.id,
    { refreshToken: refreshToken },
    { new: true }
  );

  // Generate referral code if user doesn't have one
  if (!findUser.referralCode) {
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let referralCode = generateCode();
    
    // Ensure the code is unique
    let existingUser = await User.findOne({ referralCode });
    while (existingUser) {
      referralCode = generateCode();
      existingUser = await User.findOne({ referralCode });
    }

    findUser.referralCode = referralCode;
    await findUser.save();
  }

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000,
  });
  
  res.json({
    _id: findUser._id,
    firstname: findUser.firstname,
    lastname: findUser.lastname,
    email: findUser.email,
    mobile: findUser.mobile,
    referralCode: findUser.referralCode || "",
    coins: findUser.coins || 0,
    token: generateToken(findUser._id),
  });
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
    // Decrease stock for each ordered item
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      if (product) {
        // If product has sizeStock, decrease from the first available size
        if (product.sizeStock && product.sizeStock.length > 0) {
          let remainingQty = item.quantity;
          
          for (let i = 0; i < product.sizeStock.length && remainingQty > 0; i++) {
            if (product.sizeStock[i].quantity > 0) {
              const deductQty = Math.min(product.sizeStock[i].quantity, remainingQty);
              product.sizeStock[i].quantity -= deductQty;
              remainingQty -= deductQty;
            }
          }
        } else {
          // Decrease from main quantity
          product.quantity = Math.max(0, product.quantity - item.quantity);
        }
        
        product.sold = (product.sold || 0) + item.quantity;
        await product.save();
      }
    }

    const order = await Order.create({
      shippingInfo,
      orderItems,
      totalPrice,
      totalPriceAfterDiscount,
      paymentInfo,
      user: _id,
    });

    // Award coins for referral if the user was referred
    if (totalPriceAfterDiscount > 0) {
      await awardCoinsOnOrder(_id, totalPriceAfterDiscount, 10);
    }

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
  const { startDate, endDate, mode, filter } = req.query;
  
  let matchCondition = {};
  
  let start, end;
  
  // Calculate date range based on filter or explicit dates
  if (startDate && endDate) {
    // Use explicit dates
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (filter) {
    // Calculate based on filter
    start = new Date();
    end = new Date();
    
    switch (filter) {
      case 'today':
        start = new Date(new Date().setHours(0, 0, 0, 0));
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
      default:
        start.setDate(start.getDate() - 30);
        start = new Date(start.setHours(0, 0, 0, 0));
    }
  } else {
    // Default: today
    start = new Date(new Date().setHours(0, 0, 0, 0));
    end = new Date();
  }
  
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

  // First try to find by main barcode
  let product = await Product.findOne({ barcode });

  // If not found, search in sizeStock array
  if (!product) {
    product = await Product.findOne({ "sizeStock.barcode": barcode });
  }

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if barcode is from sizeStock
  let sizeInfo = null;
  if (product.sizeStock && product.sizeStock.length > 0) {
    const sizeEntry = product.sizeStock.find(s => s.barcode === barcode);
    if (sizeEntry) {
      sizeInfo = {
        size: sizeEntry.size,
        quantity: sizeEntry.quantity,
        barcode: sizeEntry.barcode
      };
    }
  }

  res.json({
    _id: product._id,
    title: product.title,
    price: product.price,
    // If size-specific, return size quantity; otherwise return main quantity
    quantity: sizeInfo ? sizeInfo.quantity : product.quantity,
    barcode: barcode,
    size: sizeInfo ? sizeInfo.size : null,
    isSizeSpecific: sizeInfo !== null
  });
});

// Check stock availability for a product by barcode
const checkStock = asyncHandler(async (req, res) => {
  const { barcode, quantity } = req.body;

  if (!barcode) {
    res.status(400);
    throw new Error("Barcode is required");
  }

  // First try to find by main barcode
  let product = await Product.findOne({ barcode: barcode });

  // If not found, search in sizeStock array
  if (!product) {
    product = await Product.findOne({ "sizeStock.barcode": barcode });
  }

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if barcode is from sizeStock
  let availableStock = 0;
  let sizeInfo = null;
  
  if (product.sizeStock && product.sizeStock.length > 0) {
    const sizeEntry = product.sizeStock.find(s => s.barcode === barcode);
    if (sizeEntry) {
      availableStock = sizeEntry.quantity;
      sizeInfo = {
        size: sizeEntry.size,
        quantity: sizeEntry.quantity
      };
    }
  }

  // If not found in sizeStock, use main quantity
  if (availableStock === 0 && !sizeInfo) {
    availableStock = product.quantity;
  }

  const requestedQty = parseInt(quantity) || 1;

  res.json({
    barcode: barcode,
    title: product.title,
    availableStock: availableStock,
    requestedQuantity: requestedQty,
    isAvailable: availableStock >= requestedQty,
    canAdd: availableStock > 0,
    size: sizeInfo ? sizeInfo.size : null,
    isSizeSpecific: sizeInfo !== null
  });
});

const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim() === "") {
    return res.json([]);
  }

  const cleanQuery = query.replace(/\D/g, ''); // Remove non-digits for mobile search

  const users = await User.find({
    role: "user",
    $or: [
      { firstname: { $regex: query, $options: "i" } },
      { lastname: { $regex: query, $options: "i" } },
      { mobile: { $regex: cleanQuery } }, // Clean mobile search
      { mobile: { $regex: query } } // Original mobile search
    ]
  })
    .limit(10)
    .select("firstname lastname mobile  address coins referralCode offerDiscount offerType totalOrders lastOrderDate ");

  // Ensure coins field is always present (default to 0 if undefined)
  const usersWithCoins = users.map(user => ({
    ...user.toObject(),
    coins: user.coins || 0
  }));

  res.json(usersWithCoins);
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

// Get all admin settings/configurations
const getSettings = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const user = await User.findById(_id).select(
      "gstin email showSpinner showReferralOffer referralCoinPercent storeName storeTagline storeAddress storePhone cgst sgst"
    );
    res.json({
      gstin: user.gstin || "",
      email: user.email || "",
      // showSpinner: user.showSpinner !== false,
      showSpinner: user.showSpinner === true,
      showReferralOffer: user.showReferralOffer === true,
      referralCoinPercent: user.referralCoinPercent || 10,
      storeName: user.storeName || "Cart Corner",
      storeTagline: user.storeTagline || "Your One-Stop Shopping Destination",
      storeAddress: user.storeAddress || "",
      storePhone: user.storePhone || "",
      cgst: user.cgst || 0,
      sgst: user.sgst || 0
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Update admin settings/configurations
const updateSettings = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  console.log("Admin updating:", _id);
  console.log("Incoming body:", req.body);

  const { showSpinner, showReferralOffer, referralCoinPercent, cgst, sgst } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      showSpinner: Boolean(showSpinner),
      showReferralOffer: Boolean(showReferralOffer),
      referralCoinPercent: Number(referralCoinPercent) || 10,
      cgst: Number(cgst) || 0,
      sgst: Number(sgst) || 0
    },
    { new: true }
  );

  console.log("Updated value in DB:", updatedUser.showSpinner, updatedUser.showReferralOffer, updatedUser.referralCoinPercent, updatedUser.cgst, updatedUser.sgst);

  res.json({
    success: true,
    showSpinner: updatedUser.showSpinner,
    showReferralOffer: updatedUser.showReferralOffer,
    referralCoinPercent: updatedUser.referralCoinPercent,
    cgst: updatedUser.cgst,
    sgst: updatedUser.sgst
  });
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

// Generate or get referral code for the current user
const generateReferralCode = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    let user = await User.findById(_id);
    
    // If user already has a referral code, return it
    if (user.referralCode) {
      return res.json({
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralEarnings: user.referralEarnings,
      });
    }

    // Generate a unique referral code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let referralCode = generateCode();
    
    // Ensure the code is unique
    let existingUser = await User.findOne({ referralCode });
    while (existingUser) {
      referralCode = generateCode();
      existingUser = await User.findOne({ referralCode });
    }

    user.referralCode = referralCode;
    await user.save();

    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralEarnings: user.referralEarnings,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get list of users referred by the current user with detailed status
const getMyReferrals = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  console.log("getMyReferrals called for user:", _id);

  try {
    // Get all users referred by this user
    const referrals = await User.find({ referredBy: _id })
      .select("firstname lastname mobile createdAt coins")
      .sort({ createdAt: -1 });

    console.log("Found referrals:", referrals.length, referrals);

    // For each referral, check if they have orders
    const detailedReferrals = await Promise.all(
      referrals.map(async (ref) => {
        // Check if user has any orders
        const orderCount = await Order.countDocuments({ user: ref._id });
        
        return {
          _id: ref._id,
          firstname: ref.firstname,
          lastname: ref.lastname,
          mobile: ref.mobile,
          createdAt: ref.createdAt,
          coins: ref.coins || 0,
          // Status: not_signed_in (not applicable for referred users), signed_in, ordered
          status: orderCount > 0 ? "ordered" : "signed_in"
        };
      })
    );

    // Calculate counts
    const signedInCount = detailedReferrals.filter(r => r.status === "signed_in").length;
    const orderedCount = detailedReferrals.filter(r => r.status === "ordered").length;
    const totalCoins = detailedReferrals.reduce((sum, r) => sum + (r.coins || 0), 0);

    let user = await User.findById(_id);

    // Ensure user has a referral code
    if (!user.referralCode) {
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let referralCode = generateCode();
      let existingUser = await User.findOne({ referralCode });
      while (existingUser) {
        referralCode = generateCode();
        existingUser = await User.findOne({ referralCode });
      }
      user.referralCode = referralCode;
      await user.save();
    }
    
    console.log("Sending response:", {
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      coins: user.coins || 0,
      signedInCount,
      orderedCount,
      referrals: detailedReferrals,
    });

    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      coins: user.coins || 0,
      signedInCount,
      orderedCount,
      referrals: detailedReferrals,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Apply a referral code
const applyReferral = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { referralCode } = req.body;
  validateMongoDbId(_id);

  if (!referralCode) {
    res.status(400);
    throw new Error("Referral code is required");
  }

  try {
    // Find the user who owns this referral code
    const referrer = await User.findOne({ referralCode });

    if (!referrer) {
      res.status(404);
      throw new Error("Invalid referral code");
    }

    // Check if the referrer is the same as the current user
    if (referrer._id.toString() === _id.toString()) {
      res.status(400);
      throw new Error("You cannot use your own referral code");
    }

    // Check if current user already used a referral
    const currentUser = await User.findById(_id);
    if (currentUser.referredBy) {
      res.status(400);
      throw new Error("You have already used a referral code");
    }

    // Apply the referral
    currentUser.referredBy = referrer._id;
    await currentUser.save();
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    await referrer.save();

    res.json({
      success: true,
      message: "Referral code applied successfully!",
      referredBy: {
        firstname: referrer.firstname,
        lastname: referrer.lastname,
      },
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Award coins to referrer for lifetime purchases of a referred user.
// coinPercent defaults to 10% (1 coin == 1 INR).
const awardCoinsOnOrder = async (referredUserId, orderAmount, coinPercent = 10) => {
  if (!referredUserId || !orderAmount || orderAmount <= 0) {
    return;
  }

  const referredUser = await User.findById(referredUserId);
  
  if (!referredUser || !referredUser.referredBy) {
    return;
  }

  // Calculate coins based on order amount and percentage
  // e.g., 10% of ₹100 = ₹10 = 10 coins (assuming 1 coin per ₹1)
  const coinsToAward = Math.floor((orderAmount * coinPercent) / 100);

  if (coinsToAward > 0) {
    // Award coins to referrer
    const referrer = await User.findById(referredUser.referredBy);
    if (referrer) {
      referrer.coins = (referrer.coins || 0) + coinsToAward;
      referrer.referralEarnings = (referrer.referralEarnings || 0) + coinsToAward;
      await referrer.save();
    }
  }
};



// Get all users' referral details (for admin)
const getAllReferrals = asyncHandler(async (req, res) => {
  try {
    // Get all users with referral-related fields populated
    const users = await User.find({ role: "user" })
      .select("firstname lastname mobile email createdAt referralCode referredBy referralCount coins referralEarnings")
      .populate("referredBy", "firstname lastname mobile referralCode")
      .sort({ createdAt: -1 });

    // Get count of users referred by each user
    const referralCounts = {};
    users.forEach(user => {
      if (user.referredBy) {
        const referrerId = user.referredBy._id.toString();
        referralCounts[referrerId] = (referralCounts[referrerId] || 0) + 1;
      }
    });

    // Calculate statistics
    const totalUsers = users.length;
    const usersWithReferralCode = users.filter(u => u.referralCode).length;
    const usersReferred = users.filter(u => u.referredBy).length;
    const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
    const totalEarnings = users.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);

    // Transform data for response
    const referralData = users.map(user => {
      const referredUsers = users.filter(u => 
        u.referredBy && u.referredBy._id.toString() === user._id.toString()
      );

      return {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        mobile: user.mobile,
        email: user.email,
        createdAt: user.createdAt,
        referralCode: user.referralCode || "N/A",
        referredBy: user.referredBy ? {
          _id: user.referredBy._id,
          firstname: user.referredBy.firstname,
          lastname: user.referredBy.lastname,
          mobile: user.referredBy.mobile,
          referralCode: user.referredBy.referralCode
        } : null,
        referralCount: user.referralCount || 0,
        referredUsersCount: referredUsers.length,
        coins: user.coins || 0,
        referralEarnings: user.referralEarnings || 0,
        referredUsers: referredUsers.map(ref => ({
          _id: ref._id,
          firstname: ref.firstname,
          lastname: ref.lastname,
          mobile: ref.mobile,
          createdAt: ref.createdAt
        }))
      };
    });

    res.json({
      statistics: {
        totalUsers,
        usersWithReferralCode,
        usersReferred,
        totalCoins,
        totalEarnings
      },
      referrals: referralData
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
  getSettings,
  updateSettings,
  getCustomerOffer,
  updateCustomerOffer,
  getCustomerDetails,
  checkStock,
  generateReferralCode,
  getMyReferrals,
  applyReferral,
  awardCoinsOnOrder,
  getAllReferrals,
};
