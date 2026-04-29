const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const Color = require("../models/colorModel");
const uniqid = require("uniqid");
const { notifyUser } = require("./notificationCtrl");
const { createAutoEntry } = require("./rojmelCtrl");
const { ORDER_STATUS_EVENT_MAP } = require("../config/notificationConfig");

const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const validateAddress = require("../utils/validateAddress");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const { createPasswordResetToken } = require("../models/userModel");
const { getReadableColorName } = require("../utils/colorDisplay");

const appendCoinTransaction = (userDoc, transaction) => {
  if (!userDoc) return;

  if (!Array.isArray(userDoc.coinTransactions)) {
    userDoc.coinTransactions = [];
  }

  userDoc.coinTransactions.push({
    type: transaction.type,
    coins: transaction.coins,
    reason: transaction.reason || "",
    source: transaction.source || "other",
    description: transaction.description || "",
    metadata: transaction.metadata || {},
    createdAt: transaction.createdAt || new Date(),
  });
};

const findProductByBarcode = async (barcode) => {
  if (!barcode) return null;
  const product = await Product.findOne({ barcode }).populate("color").populate("variants.color");
  if (product) return product;
  const product2 = await Product.findOne({ "sizeStock.barcode": barcode }).populate("color").populate("variants.color");
  if (product2) return product2;
  return await Product.findOne({ "variants.sizeStock.barcode": barcode }).populate("color").populate("variants.color");
};

const normalizeProductQuantity = (product) => {
  if (!product) return 0;
  const p = product.toObject ? product.toObject() : product;
  if (p.variants && p.variants.length > 0) {
    return p.variants.reduce((sum, variant) => {
      const variantQty = (variant.sizeStock || []).reduce((s, item) => s + Number(item.quantity || 0), 0);
      return sum + variantQty;
    }, 0);
  }
  if (p.sizeStock && p.sizeStock.length > 0) {
    return p.sizeStock.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }
  return Number(p.quantity || 0);
};

const resolveColorLabel = (colorInfo, product) => {
  if (colorInfo) {
    return getReadableColorName(colorInfo);
  }
  if (!product) return null;
  return getReadableColorName(product.color);
};

const resolveColorId = async (colorInfo, product) => {
  if (!colorInfo) {
    return product?.color || null;
  }

  // If colorInfo is an object with _id, return the _id
  if (typeof colorInfo === 'object' && colorInfo._id) {
    return colorInfo._id;
  }

  // If colorInfo is already an ObjectId string, return it
  if (typeof colorInfo === 'string' && colorInfo.match(/^[0-9a-fA-F]{24}$/)) {
    return colorInfo;
  }

  // If colorInfo is a string (color name), try to find the Color document
  if (typeof colorInfo === 'string') {
    try {
      const colorDoc = await Color.findOne({
        $or: [
          { name: new RegExp(colorInfo, 'i') },
          { title: new RegExp(colorInfo, 'i') },
          { hex: colorInfo.toLowerCase() }
        ]
      });
      if (colorDoc) {
        return colorDoc._id;
      }
    } catch (error) {
      console.error('Error finding color:', error);
    }
    // Fallback to product color
    return product?.color || null;
  }

  return product?.color || null;
};

const deductStockFromProduct = async (product, item) => {
  let barcode = item.barcode || null;
  let deducted = false;

  // If provided precise barcode, use it
  if (item.barcode) {
    // Try to deduct from exact barcode path
    if (product.sizeStock && product.sizeStock.length > 0) {
      const sizeEntry = product.sizeStock.find((s) => s.barcode === item.barcode);
      if (sizeEntry && sizeEntry.quantity >= item.quantity) {
        sizeEntry.quantity -= item.quantity;
        barcode = sizeEntry.barcode;
        deducted = true;
      }
    }
    if (!deducted && product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        const sizeEntry = (variant.sizeStock || []).find((s) => s.barcode === item.barcode);
        if (sizeEntry && sizeEntry.quantity >= item.quantity) {
          sizeEntry.quantity -= item.quantity;
          barcode = sizeEntry.barcode;
          deducted = true;
          break;
        }
      }
    }
    if (deducted) return { deducted, barcode };
  }

  // Match by color and size if available
  if (item.color && product.variants && product.variants.length > 0) {
    const variant = product.variants.find((v) => {
      const variantColorId = v.color?._id ? v.color._id.toString() : (v.color || "").toString();
      const itemColorId = item.color?._id ? item.color._id.toString() : (item.color || "").toString();
      return variantColorId === itemColorId;
    });
    if (variant) {
      if (item.size) {
        // Exact size match
        const sizeEntry = (variant.sizeStock || []).find((s) => s.size === item.size);
        if (sizeEntry && sizeEntry.quantity >= item.quantity) {
          sizeEntry.quantity -= item.quantity;
          barcode = sizeEntry.barcode || barcode;
          deducted = true;
        }
      } else {
        // No size specified — deduct from first available size in this variant
        let remainingQty = item.quantity;
        for (const sizeEntry of (variant.sizeStock || [])) {
          if (sizeEntry.quantity > 0 && remainingQty > 0) {
            const decrement = Math.min(sizeEntry.quantity, remainingQty);
            sizeEntry.quantity -= decrement;
            remainingQty -= decrement;
            if (!barcode) barcode = sizeEntry.barcode;
          }
        }
        if (remainingQty === 0) deducted = true;
      }
    }
    if (deducted) return { deducted, barcode };
  }

  // Top-level sizeStock path
  if (product.sizeStock && product.sizeStock.length > 0) {
    if (item.size) {
      const sizeEntry = product.sizeStock.find((s) => s.size === item.size);
      if (sizeEntry && sizeEntry.quantity >= item.quantity) {
        sizeEntry.quantity -= item.quantity;
        barcode = sizeEntry.barcode || barcode;
        deducted = true;
      }
    } else {
      let remainingQty = item.quantity;
      for (const sizeEntry of product.sizeStock) {
        if (sizeEntry.quantity > 0 && remainingQty > 0) {
          const decrement = Math.min(sizeEntry.quantity, remainingQty);
          sizeEntry.quantity -= decrement;
          remainingQty -= decrement;
          if (!barcode) barcode = sizeEntry.barcode;
        }
      }
      if (remainingQty === 0) {
        deducted = true;
      }
    }
    if (deducted) return { deducted, barcode };
  }

  // Fallback: no color specified but product only has variants — deduct from any available slot
  if (!deducted && product.variants && product.variants.length > 0) {
    let remainingQty = item.quantity;
    outer: for (const variant of product.variants) {
      for (const sizeEntry of (variant.sizeStock || [])) {
        if (sizeEntry.quantity > 0 && remainingQty > 0) {
          const decrement = Math.min(sizeEntry.quantity, remainingQty);
          sizeEntry.quantity -= decrement;
          remainingQty -= decrement;
          if (!barcode) barcode = sizeEntry.barcode;
        }
        if (remainingQty === 0) break outer;
      }
    }
    if (remainingQty === 0) {
      deducted = true;
      return { deducted, barcode };
    }
  }

  // Fallback to main quantity
  if (product.quantity >= item.quantity) {
    product.quantity = Math.max(0, product.quantity - item.quantity);
    barcode = barcode || product.barcode;
    deducted = true;
    return { deducted, barcode };
  }

  return { deducted: false, barcode };
};



const createOfflineOrder = asyncHandler(async (req, res) => {

  
  const { items, paymentMethod, paymentDestination: reqPaymentDestination, customer, discount, offerDiscount: offerDiscountAmt, coinsUsed, coinAmount, gstBreakdown } = req.body;
  const adminId = req.user._id;


   console.log("Incoming body:", req.body);
  console.log("Incoming customer:", customer);

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error("No items provided");
  }

  let customerId = null;
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
  // Stage 1: validate all stock WITHOUT saving — collect deductions in memory
  const stockDeductions = [];
  for (const item of items) {
    const product = await findProductByBarcode(item.barcode);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found for barcode ${item.barcode}`);
    }
    const { deducted, barcode: deductedBarcode } = await deductStockFromProduct(product, item);
    if (!deducted) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}${item.size ? ` (Size: ${item.size})` : ''}`);
    }
    stockDeductions.push({ product, item, deductedBarcode });
    totalPrice += product.price * item.quantity;
  }

  // Stage 2: all items validated — persist atomically using optimistic concurrency (__v check)
  // This prevents two concurrent POS sessions from both deducting the last unit.
  for (const { product, item, deductedBarcode } of stockDeductions) {
    item.barcode = deductedBarcode || item.barcode;
    product.sold = (product.sold || 0) + item.quantity;
    product.quantity = normalizeProductQuantity(product);

    // Atomic save: only succeeds if no other session modified this product since we read it
    const saved = await Product.findOneAndUpdate(
      { _id: product._id, __v: product.__v },
      { $set: { sizeStock: product.sizeStock, variants: product.variants, quantity: product.quantity, sold: product.sold }, $inc: { __v: 1 } },
      { new: true }
    );
    if (!saved) {
      res.status(409);
      throw new Error(`Stock conflict for ${product.title} — please retry the sale`);
    }

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.price,
      hsnCode: product.hsnCode || null,
      color: await resolveColorId(item.color || product.color || (product.variants?.[0]?.color ?? null), product),
      size: item.size || null,
      barcode: item.barcode,
    });
  }

  const discountAmount = discount || 0;
  const offerDiscountAmount = offerDiscountAmt || 0;
  const directDiscountAmount = Math.max(0, discountAmount - offerDiscountAmount);
  const coinDiscountAmount = coinAmount || 0;

  // Add GST on top ONLY when tax is excluded (tax-included mode: price already contains GST)
  const gstTotal = (!gstBreakdown?.taxIncluded && gstBreakdown)
    ? (gstBreakdown.cgst || 0) + (gstBreakdown.sgst || 0) + (gstBreakdown.igst || 0)
    : 0;
  const totalPriceAfterDiscount = totalPrice + gstTotal - discountAmount - coinDiscountAmount;

  // Step 3: Create order FIRST
  const order = await Order.create({
    user: customerId || undefined,
    orderItems,
    totalPrice,
    totalPriceAfterDiscount,
    discountAmount,
    discountBreakdown: {
      directDiscount: directDiscountAmount,
      offerDiscount: offerDiscountAmount,
      coinDiscount: coinDiscountAmount,
    },
    gstBreakdown: gstBreakdown || {
      cgst: 0, sgst: 0, igst: 0,
      cgstRate: 0, sgstRate: 0, igstRate: 0,
      gstType: "NONE", taxableAmount: totalPrice,
    },
    coinsUsed: coinsUsed || 0,
    coinAmount: coinAmount || 0,
    paymentInfo: {
      razorpayOrderId: paymentMethod === "CASH" ? "OFFLINE" : "OFFLINE_ONLINE",
      razorpayPaymentId: "OFFLINE",
    },
    orderStatus: "Delivered",
    mode: "OFFLINE",
    paymentDestination: paymentMethod === "CASH" ? "CASH" : (reqPaymentDestination || "CURRENT_ACCOUNT"),
    statusHistory: [{ status: "Delivered", date: new Date() }],
    // Snapshot the spin-wheel offer that was consumed so it can be restored on cancellation
    offerApplied: offerDiscountAmount > 0 && actualCustomer
      ? { offerDiscount: actualCustomer.offerDiscount || 0, offerType: actualCustomer.offerType || "" }
      : { offerDiscount: 0, offerType: "" },
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
        appendCoinTransaction(actualCustomer, {
          type: "debit",
          coins: coinsToDeduct,
          reason: "purchase",
          source: "purchase",
          description: "Coins used during billing",
          metadata: {
            orderId: order?._id,
            mode: "OFFLINE",
          },
        });
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
    await awardCoinsOnOrder(purchasingUserId, totalPriceAfterDiscount, 10, order._id);
  }

  // Write POS sale to Rojmel ledger
  setImmediate(() =>
    createAutoEntry({
      particulars: `POS Sale – ${purchaseCustomer ? (purchaseCustomer.firstname + " " + purchaseCustomer.lastname).trim() : "Walk-in"}`,
      type: "INCOME",
      amount: totalPriceAfterDiscount,
      paymentMethod: paymentMethod === "CASH" ? "Cash" : "Online",
      referenceId: order._id,
      category: "POS Sales",
    }).catch((err) => console.error("Rojmel auto-entry failed:", err))
  );

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
      // Process signup referral reward if configured
      try {
        const ReferralService = require("../services/ReferralService");
        await ReferralService.processSignupReferralReward(referredByUser._id);
      } catch (e) { console.error("Signup referral reward error:", e.message); }
    }
    // Return user with token so frontend can auto-login
    // Push notification: welcome
    setImmediate(() =>
      notifyUser(newUser._id, "WELCOME", {
        storeName: "Yashoda Fashion",
        name: newUser.firstname,
      }).catch(() => {})
    );

    return res.json({
      _id: newUser._id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      mobile: newUser.mobile,
      referralCode: newUser.referralCode || "",
      coins: newUser.coins || 0,
      token: generateToken(newUser._id),
    });
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
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
  const findAdmin = await User.findOne({ email });
  if (!findAdmin) {
    res.status(401);
    throw new Error("Invalid Credentials");
  }
  if (findAdmin.role !== "admin") {
    res.status(403);
    throw new Error("Not Authorised");
  }
  if (await findAdmin.isPasswordMatched(password)) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    await User.findByIdAndUpdate(
      findAdmin.id,
      { refreshToken: refreshToken },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
    res.status(401);
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error("No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      res.status(401);
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
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.sendStatus(204);
  }
  await User.findByIdAndUpdate(user._id, { refreshToken: "" });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.sendStatus(204);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;
  const { _id: userId } = req.user;

  const order = await Order.findOne({ _id: id, user: userId }).populate("orderItems.product");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const nonCancellableStatuses = ["Shipped", "Out for Delivery", "Delivered", "Cancelled"];
  if (nonCancellableStatuses.includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Order cannot be cancelled. Current status: ${order.orderStatus}`);
  }

  await _performCancelOrder(order, cancelReason || "Cancelled by customer", userId);

  res.json({ success: true, message: "Order cancelled successfully", order });
});

const adminCancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancelReason } = req.body;

  if (!cancelReason || !cancelReason.trim()) {
    res.status(400);
    throw new Error("Cancel reason is required");
  }

  const order = await Order.findById(id).populate("orderItems.product");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.orderStatus === "Cancelled") {
    res.status(400);
    throw new Error("Order is already cancelled");
  }

  await _performCancelOrder(order, cancelReason.trim(), order.user);

  res.json({ success: true, message: "Order cancelled by admin", order });
});

// Shared cancel logic used by both user and admin cancel
// Precise stock restore — mirrors deductStockFromProduct in reverse
// Priority: barcode → color+size → size-only → color-only → main quantity
const _restoreStock = async (product, item) => {
  const qty = item.quantity || 1;
  const colorId = item.color ? String(item.color._id || item.color) : null;

  // 1. Barcode match — most precise, always use when available
  if (item.barcode) {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        const se = (variant.sizeStock || []).find(s => s.barcode === item.barcode);
        if (se) { se.quantity += qty; return; }
      }
    }
    if (product.sizeStock && product.sizeStock.length > 0) {
      const se = product.sizeStock.find(s => s.barcode === item.barcode);
      if (se) { se.quantity += qty; return; }
    }
  }

  // 2. Color + size match in variants (exact slot — no drift)
  if (colorId && item.size && product.variants && product.variants.length > 0) {
    const variant = product.variants.find(v => String(v.color?._id || v.color) === colorId);
    if (variant) {
      const se = (variant.sizeStock || []).find(s => s.size === item.size);
      if (se) { se.quantity += qty; return; }
    }
  }

  // 3. Size match in top-level sizeStock (exact slot)
  if (item.size && product.sizeStock && product.sizeStock.length > 0) {
    const se = product.sizeStock.find(s => s.size === item.size);
    if (se) { se.quantity += qty; return; }
  }

  // 4. Color-only match — restore to the matched variant's first slot
  if (colorId && product.variants && product.variants.length > 0) {
    const variant = product.variants.find(v => String(v.color?._id || v.color) === colorId);
    if (variant && variant.sizeStock && variant.sizeStock.length > 0) {
      variant.sizeStock[0].quantity += qty;
      return;
    }
  }

  // 5. Fallback: main quantity
  product.quantity = (product.quantity || 0) + qty;
};

const _performCancelOrder = async (order, cancelReason, userId) => {
  // 1. Restore stock for every item
  for (const item of order.orderItems) {

    // ── BUNDLE items ──────────────────────────────────────────────────────────────────
    if (item.isBundle && Array.isArray(item.bundleProducts)) {
      for (const bp of item.bundleProducts) {
        if (!bp.productId) continue;
        const product = await Product.findById(bp.productId);
        if (!product) continue;
        const qty = bp.quantity || 1;
        await _restoreStock(product, { color: bp.selectedColor, size: bp.selectedSize, barcode: bp.barcode, quantity: qty });
        product.sold = Math.max(0, (product.sold || 0) - qty);
        product.quantity = normalizeProductQuantity(product);
        await product.save();
      }
      continue;
    }

    // ── REGULAR items ───────────────────────────────────────────────────────────────────
    if (!item.product) continue;
    const product = await Product.findById(item.product._id || item.product);
    if (!product) continue;
    const qty = item.quantity || 1;
    await _restoreStock(product, { color: item.color, size: item.size, barcode: item.barcode, quantity: qty });
    product.sold = Math.max(0, (product.sold || 0) - qty);
    product.quantity = normalizeProductQuantity(product);
    await product.save();
  }

  // 2. Load customer ONCE — do all coin ops on same object, save once
  const customer = await User.findById(userId);

  // 2a. Refund coins that were USED as payment (coinsUsed)
  if (order.coinsUsed && order.coinsUsed > 0 && customer) {
    customer.coins = (customer.coins || 0) + order.coinsUsed;
    appendCoinTransaction(customer, {
      type: "credit",
      coins: order.coinsUsed,
      reason: "coins_used_refund",
      source: "admin_adjustment",
      description: `${order.coinsUsed} coins refunded (were used as payment)`,
      metadata: { orderId: order._id },
    });
  }

  // 2b. Reverse purchase-reward coins earned on this order (buyer side only)
  if (customer) {
    const orderIdStr = String(order._id);
    const purchaseTxns = (customer.coinTransactions || []).filter(
      (tx) => tx.source === "purchase" && tx.type === "credit" && String(tx.metadata?.orderId) === orderIdStr
    );
    for (const tx of purchaseTxns) {
      const toReverse = tx.coins || 0;
      if (toReverse > 0 && customer.coins >= toReverse) {
        customer.coins -= toReverse;
        appendCoinTransaction(customer, {
          type: "debit",
          coins: toReverse,
          reason: "cancel_reversal",
          source: "purchase",
          description: "Purchase reward reversed due to order cancellation",
          metadata: { orderId: order._id, reversedTxId: tx._id },
        });
      }
    }
  }

  // 2c. Add full purchase amount as coins (no money-back policy)
  const purchaseAmount = order.totalPriceAfterDiscount || 0;
  if (purchaseAmount > 0 && customer) {
    customer.coins = (customer.coins || 0) + purchaseAmount;
    appendCoinTransaction(customer, {
      type: "credit",
      coins: purchaseAmount,
      reason: "cancel_refund",
      source: "admin_adjustment",
      description: `₹${purchaseAmount} refunded as coins (no money-back policy)`,
      metadata: { orderId: order._id, purchaseAmount },
    });
  }

  // Save customer once
  if (customer) await customer.save();

  // 2d. Restore spin-wheel offer that was consumed on this order
  if (customer && order.offerApplied?.offerType && order.offerApplied.offerType !== "") {
    customer.offerDiscount = order.offerApplied.offerDiscount;
    customer.offerType = order.offerApplied.offerType;
    await customer.save();
  }

  // 3. Reverse referrer coins earned from this order (separate user — safe to load independently)
  if (customer?.referredBy) {
    const referrer = await User.findById(customer.referredBy);
    if (referrer) {
      const orderIdStr = String(order._id);
      const referrerTxns = (referrer.coinTransactions || []).filter(
        (tx) =>
          tx.source === "referral_purchase" &&
          tx.type === "credit" &&
          String(tx.metadata?.referredUserId) === String(userId) &&
          String(tx.metadata?.orderId) === orderIdStr
      );
      for (const tx of referrerTxns) {
        const toReverse = tx.coins || 0;
        if (toReverse > 0 && referrer.coins >= toReverse) {
          referrer.coins -= toReverse;
          if (referrer.referralEarnings >= toReverse) referrer.referralEarnings -= toReverse;
          appendCoinTransaction(referrer, {
            type: "debit",
            coins: toReverse,
            reason: "cancel_reversal",
            source: "referral_purchase",
            description: "Referral reward reversed: referred user cancelled order",
            metadata: { referredUserId: userId, orderId: order._id, reversedTxId: tx._id },
          });
        }
      }
      await referrer.save();
    }
  }

  // 5. Update order status
  order.orderStatus = "Cancelled";
  order.cancelledAt = new Date();
  order.cancelReason = cancelReason;
  order.refundType = purchaseAmount > 0 ? "COINS" : "NONE";
  order.refundAmount = purchaseAmount;
  order.refundCoins = purchaseAmount;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status: "Cancelled", date: new Date() });
  await order.save();

  // 6. Push notification
  setImmediate(() =>
    notifyUser(userId, "ORDER_CANCELLED", {
      orderId: order._id.toString().slice(-6).toUpperCase(),
      amount: purchaseAmount,
    }).catch(() => {})
  );
};

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

// Validate cart items stock before payment
const validateCartStock = asyncHandler(async (req, res) => {
  const { orderItems } = req.body;
  if (!orderItems?.length) {
    res.status(400);
    throw new Error("No items to validate");
  }

  const errors = [];

  for (const item of orderItems) {
    if (item.isBundle) continue;
    if (!item.product) continue;

    const product = await Product.findById(item.product).populate("variants.color");
    if (!product) {
      errors.push(`Product not found`);
      continue;
    }

    const colorId = item.color ? String(item.color) : null;
    const size = item.size || null;
    const qty = item.quantity || 1;
    let available = 0;

    if (product.variants?.length > 0 && colorId) {
      const variant = product.variants.find(
        v => String(v.color?._id || v.color) === colorId
      );
      if (variant && size) {
        available = variant.sizeStock?.find(s => s.size === size)?.quantity ?? 0;
      } else if (variant) {
        available = variant.sizeStock?.reduce((s, e) => s + (e.quantity || 0), 0) ?? 0;
      }
    } else if (product.sizeStock?.length > 0 && size) {
      available = product.sizeStock.find(s => s.size === size)?.quantity ?? 0;
    } else {
      available = product.quantity ?? 0;
    }

    if (available < qty) {
      errors.push(
        `"${product.title}"${size ? ` (Size: ${size})` : ''} — only ${available} left in stock`
      );
    }
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join("\n"));
  }

  res.json({ success: true });
});

// Get all saved addresses
const getAddresses = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select("addresses");
  res.json(user.addresses || []);
});

// Add a new address
const addAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { label, firstname, lastname, address, city, state, country, pincode, other, isDefault } = req.body;
  const user = await User.findById(_id);

  const newAddr = {
    _id: require("crypto").randomBytes(8).toString("hex"),
    label: label || "Home",
    firstname, lastname, address, city, state, country,
    pincode: String(pincode),
    other: other || "",
    isDefault: isDefault || user.addresses.length === 0,
  };

  if (newAddr.isDefault) {
    user.addresses.forEach(a => { a.isDefault = false; });
  }
  user.addresses.push(newAddr);
  await user.save();
  res.json(user.addresses);
});

// Update an address
const updateAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { addrId } = req.params;
  const { label, firstname, lastname, address, city, state, country, pincode, other, isDefault } = req.body;
  const user = await User.findById(_id);

  const idx = user.addresses.findIndex(a => a._id === addrId);
  if (idx === -1) { res.status(404); throw new Error("Address not found"); }

  if (isDefault) user.addresses.forEach(a => { a.isDefault = false; });

  Object.assign(user.addresses[idx], {
    label: label || user.addresses[idx].label,
    firstname, lastname, address, city, state, country,
    pincode: String(pincode),
    other: other || "",
    isDefault: isDefault || user.addresses[idx].isDefault,
  });
  await user.save();
  res.json(user.addresses);
});

// Delete an address
const deleteAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { addrId } = req.params;
  const user = await User.findById(_id);

  const wasDefault = user.addresses.find(a => a._id === addrId)?.isDefault;
  user.addresses = user.addresses.filter(a => a._id !== addrId);
  if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
  await user.save();
  res.json(user.addresses);
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
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='${process.env.CLIENT_URL || "http://localhost:3001"}/reset-password/${token}'>Click Here</a>`;
    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    res.json({ message: "Password reset email sent" });
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
  const { productId, color, quantity, price, size } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const Offer = require("../models/offerModel");
    const Product = require("../models/productModel");
    const now = new Date();
    const product = await Product.findById(productId).select("category");

    // Find all active offers for this product/category (correct AND scoping)
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { applicableProducts: productId },
        {
          $and: [
            { applicableProducts: { $size: 0 } },
            {
              $or: [
                { applicableCategories: product?.category },
                { applicableCategories: { $size: 0 } },
              ],
            },
          ],
        },
      ],
    });

    // Compute effective price and best non-free offer
    let effectivePrice = price;
    let appliedOfferLabel = null;
    let appliedOfferId = null;
    let bestDiscount = 0;

    for (const offer of activeOffers) {
      let discountedPrice = price;

      if (offer.offerType === "BUY_X_FOR_PRICE" && quantity >= offer.buyQty) {
        const sets = Math.floor(quantity / offer.buyQty);
        const remainder = quantity % offer.buyQty;
        const totalCost = sets * offer.fixedPrice + remainder * price;
        discountedPrice = Math.round((totalCost / quantity) * 100) / 100;
      } else if (offer.offerType === "FLAT_OFF") {
        discountedPrice = Math.max(0, price - offer.discountAmount);
      } else if (offer.offerType === "PERCENT_OFF") {
        discountedPrice = Math.round(price * (1 - offer.discountPercent / 100) * 100) / 100;
      } else if (offer.offerType === "MIN_QTY_DISCOUNT" && quantity >= offer.minQty) {
        discountedPrice = Math.round(price * (1 - offer.discountPercent / 100) * 100) / 100;
      } else {
        continue; // BUY_X_GET_Y_FREE handled separately below
      }

      const discount = (price - discountedPrice) * quantity;
      if (discount > bestDiscount) {
        bestDiscount = discount;
        effectivePrice = discountedPrice;
        appliedOfferLabel = offer.title;
        appliedOfferId = offer._id;
      }
    }

    // Save main cart item — update if same product+color+size exists, else create new
    let newCart = await Cart.findOneAndUpdate(
      { userId: _id, productId, color: color || null, size: size || null, isFreeItem: { $ne: true } },
      {
        $set: {
          price: effectivePrice,
          quantity,
          offerLabel: appliedOfferLabel,
          freeFromOfferId: appliedOfferId,
          originalPrice: price,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // BUY_X_GET_Y_FREE — auto-inject free items
    for (const offer of activeOffers) {
      if (offer.offerType === "BUY_X_GET_Y_FREE" && quantity >= offer.buyQty) {
        const sets = Math.floor(quantity / offer.buyQty);
        const freeQty = sets * offer.getFreeQty;
        await Cart.deleteMany({ userId: _id, productId, isFreeItem: true, freeFromOfferId: offer._id });
        await new Cart({
          userId: _id,
          productId,
          color,
          size,
          price: 0,
          quantity: freeQty,
          isFreeItem: true,
          freeFromOfferId: offer._id,
          freeFromCartItemId: newCart._id,
          offerLabel: offer.title,
          originalPrice: price, // store original so frontend can show savings
        }).save();
        break;
      }
    }

    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

const addBundleToCart = asyncHandler(async (req, res) => {
  const { bundleId, selectedSizes, selectedColors, selectedOptions } = req.body;
  // Backward compatible payload support:
  // selectedOptions: { [productId]: { color: colorId|null, size: "M"|null } }
  const { _id } = req.user;
  validateMongoDbId(_id);

  const Bundle = require("../models/bundleModel");
  const bundle = await Bundle.findById(bundleId).populate({
    path: "products.product",
    populate: [
      { path: "color" },
      { path: "variants.color" },
    ],
  });
  if (!bundle) {
    res.status(404);
    throw new Error("Bundle not found");
  }

  const resolvedSelections = {};

  // Validate selected variant/top-level selections
  for (const item of bundle.products || []) {
    const product = item.product;
    if (!product) continue;

    const productId = product._id.toString();
    const requiredQty = item.quantity || 1;
    const normalizedSelection = selectedOptions?.[productId] || {
      color: selectedColors?.[productId] || null,
      size: selectedSizes?.[productId] || null,
    };

    const chosenColor = normalizedSelection?.color || null;
    const chosenSize = normalizedSelection?.size || null;
    const hasVariantStock = Array.isArray(product.variants) && product.variants.some(
      (variant) => (variant.sizeStock || []).some((sizeEntry) => sizeEntry.quantity > 0)
    );
    const hasTopLevelSizes = Array.isArray(product.sizeStock) && product.sizeStock.some(
      (sizeEntry) => sizeEntry.quantity > 0
    );

    if (hasVariantStock) {
      if (!chosenColor) {
        res.status(400);
        throw new Error(`Please select a color for ${product.title}`);
      }

      const variant = product.variants.find((v) => {
        const variantColorId = v.color?._id ? v.color._id.toString() : v.color?.toString?.();
        return variantColorId === chosenColor.toString();
      });

      if (!variant) {
        res.status(400);
        throw new Error(`Selected color is not available for ${product.title}`);
      }

      if (!chosenSize) {
        res.status(400);
        throw new Error(`Please select a size for ${product.title}`);
      }

      const sizeEntry = (variant.sizeStock || []).find((s) => s.size === chosenSize);
      if (!sizeEntry || sizeEntry.quantity < requiredQty) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.title} (Size: ${chosenSize}). Available: ${sizeEntry?.quantity || 0}, Required: ${requiredQty}`);
      }

      resolvedSelections[productId] = {
        color: chosenColor,
        colorLabel: resolveColorLabel(variant.color, product),
        size: chosenSize,
      };
      continue;
    }

    if (hasTopLevelSizes) {
      if (!chosenSize) {
        res.status(400);
        throw new Error(`Please select a size for ${product.title}`);
      }

      const sizeEntry = product.sizeStock.find((s) => s.size === chosenSize);
      if (!sizeEntry || sizeEntry.quantity < requiredQty) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.title} (Size: ${chosenSize}). Available: ${sizeEntry?.quantity || 0}, Required: ${requiredQty}`);
      }
    }

    resolvedSelections[productId] = {
      color: chosenColor || product.color || null,
      colorLabel: resolveColorLabel(chosenColor || product.color || null, product),
      size: chosenSize || null,
    };
  }

  // Ensure bundle items with no size selection still preserve color info
  for (const item of bundle.products || []) {
    const product = item.product;
    if (!product) continue;
    const productId = product._id.toString();
    if (!resolvedSelections[productId]) {
      resolvedSelections[productId] = {
        color: selectedColors?.[productId] || product.color || null,
        colorLabel: resolveColorLabel(selectedColors?.[productId] || product.color || null, product),
        size: selectedSizes?.[productId] || null,
      };
    }
  }

  // Remove any existing bundle cart entry for this bundle
  await Cart.deleteOne({ userId: _id, bundleId: bundle._id });

  // Build snapshot of bundle products for display
  const bundleProducts = (bundle.products || []).map((item) => ({
    productId: item.product?._id || null,
    title: item.product?.title || "",
    quantity: item.quantity || 1,
    price: item.price || item.product?.price || 0,
    image: item.product?.images?.[0]?.url || "",
    selectedColor: resolvedSelections[item.product?._id?.toString()]?.color || null,
    selectedColorLabel: resolvedSelections[item.product?._id?.toString()]?.colorLabel || null,
    selectedSize: resolvedSelections[item.product?._id?.toString()]?.size || null,
  }));

  const firstProduct = bundle.products?.[0]?.product;

  const cartEntry = await new Cart({
    userId: _id,
    productId: firstProduct?._id || null,
    quantity: 1,
    price: bundle.bundlePrice,
    color: null,
    isBundle: true,
    bundleId: bundle._id,
    bundleTitle: bundle.title,
    bundleProducts,
  }).save();

  res.json(cartEntry);
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
    // Also remove any free items that were triggered by this cart item
    await Cart.deleteMany({ userId: _id, freeFromCartItemId: cartItemId });

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
    const cartItem = await Cart.findOne({ userId: _id, _id: cartItemId });
    if (!cartItem) throw new Error("Cart item not found");
    if (cartItem.isFreeItem) return res.json(cartItem); // never update free items directly

    const qty = parseInt(newQuantity);

    // ── Stock validation ──────────────────────────────────────────────────────
    const productForStock = await Product.findById(cartItem.productId).populate("variants.color");
    if (productForStock) {
      const colorId = cartItem.color?.toString();
      const size = cartItem.size;
      let availableStock = 0;

      if (productForStock.variants?.length > 0 && colorId) {
        const variant = productForStock.variants.find(
          v => (v.color?._id || v.color)?.toString() === colorId
        );
        if (variant && size) {
          availableStock = variant.sizeStock?.find(s => s.size === size)?.quantity ?? 0;
        } else if (variant) {
          availableStock = variant.sizeStock?.reduce((s, e) => s + (e.quantity || 0), 0) ?? 0;
        }
      } else if (productForStock.sizeStock?.length > 0 && size) {
        availableStock = productForStock.sizeStock.find(s => s.size === size)?.quantity ?? 0;
      } else {
        availableStock = productForStock.quantity ?? 0;
      }

      if (qty > availableStock) {
        res.status(400);
        throw new Error(`Only ${availableStock} in stock`);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    const Offer = require("../models/offerModel");
    const now = new Date();
    const product = await Product.findById(cartItem.productId).select("category");
    const originalPrice = cartItem.originalPrice || cartItem.price;

    // Re-fetch active offers with correct AND scoping
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { applicableProducts: cartItem.productId },
        {
          $and: [
            { applicableProducts: { $size: 0 } },
            {
              $or: [
                { applicableCategories: product?.category },
                { applicableCategories: { $size: 0 } },
              ],
            },
          ],
        },
      ],
    });

    let effectivePrice = originalPrice;
    let appliedOfferLabel = null;
    let appliedOfferId = null;
    let bestDiscount = 0;

    for (const offer of activeOffers) {
      let discountedPrice = originalPrice;
      if (offer.offerType === "BUY_X_FOR_PRICE" && qty >= offer.buyQty) {
        const sets = Math.floor(qty / offer.buyQty);
        const remainder = qty % offer.buyQty;
        const totalCost = sets * offer.fixedPrice + remainder * originalPrice;
        discountedPrice = Math.round((totalCost / qty) * 100) / 100;
      } else if (offer.offerType === "FLAT_OFF") {
        discountedPrice = Math.max(0, originalPrice - offer.discountAmount);
      } else if (offer.offerType === "PERCENT_OFF") {
        discountedPrice = Math.round(originalPrice * (1 - offer.discountPercent / 100) * 100) / 100;
      } else if (offer.offerType === "MIN_QTY_DISCOUNT" && qty >= offer.minQty) {
        discountedPrice = Math.round(originalPrice * (1 - offer.discountPercent / 100) * 100) / 100;
      } else {
        continue;
      }
      const discount = (originalPrice - discountedPrice) * qty;
      if (discount > bestDiscount) {
        bestDiscount = discount;
        effectivePrice = discountedPrice;
        appliedOfferLabel = offer.title;
        appliedOfferId = offer._id;
      }
    }

    cartItem.quantity = qty;
    cartItem.price = effectivePrice;
    cartItem.originalPrice = originalPrice;
    cartItem.offerLabel = appliedOfferLabel;
    cartItem.freeFromOfferId = appliedOfferId;
    await cartItem.save();

    // Re-sync BUY_X_GET_Y_FREE free items
    await Cart.deleteMany({ userId: _id, freeFromCartItemId: cartItemId, isFreeItem: true });
    for (const offer of activeOffers) {
      if (offer.offerType === "BUY_X_GET_Y_FREE" && qty >= offer.buyQty) {
        const sets = Math.floor(qty / offer.buyQty);
        const freeQty = sets * offer.getFreeQty;
        await new Cart({
          userId: _id,
          productId: cartItem.productId,
          color: cartItem.color,
          size: cartItem.size,
          price: 0,
          quantity: freeQty,
          isFreeItem: true,
          freeFromOfferId: offer._id,
          freeFromCartItemId: cartItem._id,
          offerLabel: offer.title,
          originalPrice,
        }).save();
        break;
      }
    }

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
    coinsUsed,
    coinAmount,
    discountBreakdown,
    gstBreakdown,
  } = req.body;
  const { _id } = req.user;
  const adminConfig = await User.findOne({ role: "admin" }).select("onlinePaymentDestination");
  const onlinePaymentDestination = adminConfig?.onlinePaymentDestination || "CURRENT_ACCOUNT";
  try {
    // Decrease stock for each ordered item (skip bundle items - stock handled separately)
    for (const item of orderItems) {
      console.log(`Processing order item:`, {
        product: item.product,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        isBundle: item.isBundle
      });

      if (item.isBundle && Array.isArray(item.bundleProducts)) {
        // Deduct stock for each product in the bundle
        for (const bundleItem of item.bundleProducts) {
          if (!bundleItem.productId) continue;
          const product = await Product.findById(bundleItem.productId).populate("variants.color");
          if (!product) continue;

          const deductItem = {
            quantity: bundleItem.quantity || 1,
            color: bundleItem.selectedColor || bundleItem.color || null,
            size: bundleItem.selectedSize || null,
            barcode: bundleItem.barcode || null,
          };

          let deductionResult = await deductStockFromProduct(product, deductItem);

          // Fallback: if color+size match failed, try size-only across all variants/sizeStock
          if (!deductionResult.deducted && deductItem.size) {
            deductionResult = await deductStockFromProduct(product, { ...deductItem, color: null });
          }

          if (!deductionResult.deducted) {
            throw new Error(
              `Insufficient stock for bundle product: ${product.title}` +
              `${bundleItem.selectedSize ? ` (Size: ${bundleItem.selectedSize})` : ''}`
            );
          }
          product.sold = (product.sold || 0) + (bundleItem.quantity || 1);
          product.quantity = normalizeProductQuantity(product);
          await product.save();
          bundleItem.hsnCode = bundleItem.hsnCode || product.hsnCode || product.hsn;
          bundleItem.barcode = deductionResult.barcode || bundleItem.barcode;
        }
        continue;
      }

      if (!item.product) continue;
      const product = await Product.findById(item.product);

      if (product) {
        console.log(`Found product: ${product.title}, current stock structure:`, {
          mainQuantity: product.quantity,
          sizeStock: product.sizeStock?.map(s => ({ size: s.size, quantity: s.quantity, barcode: s.barcode })),
          variants: product.variants?.map(v => ({
            color: v.color,
            sizeStock: v.sizeStock?.map(s => ({ size: s.size, quantity: s.quantity, barcode: s.barcode }))
          }))
        });

        const result = await deductStockFromProduct(product, item);
        const { deducted, barcode } = result;

        if (deducted) {
          product.sold = (product.sold || 0) + item.quantity;
          item.barcode = barcode || item.barcode;
          item.hsnCode = item.hsnCode || product.hsnCode || product.hsn;
          product.quantity = normalizeProductQuantity(product);
          await product.save();
          console.log(`Stock deducted successfully for ${product.title}. New stock:`, {
            mainQuantity: product.quantity,
            sizeStock: product.sizeStock?.map(s => ({ size: s.size, quantity: s.quantity })),
            variants: product.variants?.map(v => ({
              color: v.color,
              sizeStock: v.sizeStock?.map(s => ({ size: s.size, quantity: s.quantity }))
            }))
          });
        } else {
          console.error(`Failed to deduct stock for ${product.title} - insufficient stock`);
          throw new Error(`Insufficient stock for ${product.title}`);
        }
      }
    }

    const db = discountBreakdown || {
        directDiscount: 0,
        offerDiscount: (totalPrice - totalPriceAfterDiscount - (coinAmount || 0)) > 0
          ? (totalPrice - totalPriceAfterDiscount - (coinAmount || 0))
          : 0,
        coinDiscount: coinAmount || 0,
      };
    const computedDiscountAmount = (db.directDiscount || 0) + (db.offerDiscount || 0) + (db.coinDiscount || 0);

    const order = await Order.create({
      shippingInfo,
      orderItems,
      totalPrice,
      totalPriceAfterDiscount,
      discountAmount: computedDiscountAmount,
      discountBreakdown: db,
      gstBreakdown: gstBreakdown || {
        cgst: 0, sgst: 0, igst: 0,
        cgstRate: 0, sgstRate: 0, igstRate: 0,
        gstType: "NONE", taxableAmount: totalPrice,
      },
      coinsUsed: coinsUsed || 0,
      coinAmount: coinAmount || 0,
      paymentInfo,
      mode: paymentInfo?.razorpayPaymentId ? "ONLINE" : "OFFLINE",
      paymentDestination: paymentInfo?.razorpayPaymentId ? onlinePaymentDestination : "CASH",
      user: _id,
    });

    if (coinsUsed && coinsUsed > 0) {
      const currentUser = await User.findById(_id);
      if (currentUser) {
        const currentCoins = currentUser.coins || 0;
        const coinsToDeduct = Math.min(coinsUsed, currentCoins);

        if (coinsToDeduct > 0) {
          currentUser.coins = currentCoins - coinsToDeduct;
          appendCoinTransaction(currentUser, {
            type: "debit",
            coins: coinsToDeduct,
            reason: "purchase",
            source: "purchase",
            description: "Coins used during checkout",
            metadata: {
              orderId: order?._id,
              mode: "ONLINE",
            },
          });
          await currentUser.save();
        }
      }
    }

    // Award coins for referral if the user was referred
    if (totalPriceAfterDiscount > 0) {
      await awardCoinsOnOrder(_id, totalPriceAfterDiscount, 10, order._id);
    }

    // Push notification: order placed
    setImmediate(() =>
      notifyUser(_id, "ORDER_PLACED", {
        orderId: order._id.toString().slice(-6).toUpperCase(),
        amount: totalPriceAfterDiscount,
      }).catch(() => {})
    );

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
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;
  try {
    const total  = await Order.countDocuments({ user: _id });
    const orders = await Order.find({ user: _id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user")
      .populate({ path: "orderItems.product", select: "title brand price images barcode hsnCode" })
      .populate("orderItems.color");
    res.json({
      orders,
      page,
      limit,
      total,
      hasMore: skip + orders.length < total,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { paymentFilter } = req.query;
  try {
    let query = {};
    if (!paymentFilter || paymentFilter === 'online_current') {
      query.$or = [
        { paymentDestination: 'CURRENT_ACCOUNT' },
        { mode: 'ONLINE', paymentDestination: { $exists: false } },
        { mode: 'ONLINE', paymentDestination: null },
      ];
    } else if (paymentFilter === 'cash') {
      query.$or = [
        { paymentDestination: 'CASH' },
        { mode: 'OFFLINE', paymentDestination: { $exists: false } },
        { mode: 'OFFLINE', paymentDestination: null },
      ];
    } else if (paymentFilter === 'online_other') {
      query.paymentDestination = 'OTHER_ACCOUNT';
    }
    // paymentFilter === 'all' → no filter
    const orders = await Order.find(query)
      .populate("user")
      .select("+discountAmount")
      .sort({ createdAt: -1 });
    res.json({ orders });
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
        select: "title brand price images barcode hsnCode"
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

const getMySingleOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;
  try {
    const order = await Order.findOne({ _id: id, user: userId })
      .select("+discountAmount") // Include discountAmount field
      .populate({
        path: "orderItems.product",
        select: "title brand price images barcode hsnCode"
      })
      .populate("orderItems.color")
      .populate("user", "firstname lastname email mobile");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({
      orders: order,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findById(id).populate("user").populate("orderItems.product");
    const newStatus = req.body.status;

    // OFFLINE/POS orders are always Delivered — only allow Cancelled
    if (orders.mode === "OFFLINE" && newStatus !== "Cancelled") {
      return res.status(400).json({ message: "POS orders can only be cancelled, not re-staged" });
    }

    // Block manual status change after Packed (Shiprocket takes over)
    const lockedStatuses = ["Shipped", "Out for Delivery", "Delivered"];
    if (lockedStatuses.includes(orders.orderStatus) && lockedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Status is managed by Shiprocket after Packed" });
    }

    orders.orderStatus = newStatus;
    orders.statusHistory = orders.statusHistory || [];
    orders.statusHistory.push({ status: newStatus, date: new Date() });
    await orders.save();

    // Push notification: only send to real (non-walk-in) customers with an account
    const eventKey = ORDER_STATUS_EVENT_MAP[newStatus];
    if (eventKey && orders.user?._id && orders.mode !== "OFFLINE") {
      setImmediate(() =>
        notifyUser(orders.user._id, eventKey, {
          orderId: orders._id.toString().slice(-6).toUpperCase(),
          amount: orders.totalPriceAfterDiscount,
          courierName: orders.courierName || "courier",
          trackingUrl: orders.trackingUrl || "",
        }).catch(() => {})
      );
    }

    // Auto-trigger Shiprocket when status becomes Packed
    if (newStatus === "Packed" && !orders.shipmentId) {
      setImmediate(async () => {
        try {
          const shiprocket = require("../services/shiprocket.service");
          // Re-fetch with full population so shippingInfo, gstBreakdown and user are all present
          const freshOrder = await Order.findById(id)
            .populate("user", "firstname lastname email mobile")
            .populate("orderItems.product", "title hsnCode");
          if (!freshOrder) throw new Error(`Order ${id} not found on re-fetch`);
          const result = await shiprocket.createShipment(freshOrder, freshOrder.user);

          await Order.findByIdAndUpdate(id, {
            shippingProvider: "Shiprocket",
            shipmentId: result.shipmentId,
            trackingId: result.trackingId,
            trackingUrl: result.trackingUrl,
            courierName: result.courierName,
            shipmentError: null,
            orderStatus: "Shipped",
            shippedAt: new Date(),
            $push: { statusHistory: { status: "Shipped", date: new Date() } },
          });
          console.log(`[Shiprocket] Auto-shipment created for order ${id}`);
        } catch (err) {
          console.error(`[Shiprocket] Auto-shipment FAILED for order ${id}:`, err.message);
          // Save the error so admin can see it in the dashboard — order stays "Packed"
          await Order.findByIdAndUpdate(id, { shipmentError: err.message });
        }
      });
    }

    res.json({ orders });
  } catch (error) {
    throw new Error(error);
  }
});

// Get monthly order income (fixed aggregation)
const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
  const { mode } = req.query;
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

  const matchStage = {
    createdAt: { $lte: new Date(), $gte: new Date(endDate) },
    orderStatus: { $ne: "Cancelled" },
  };
  if (mode === "ONLINE" || mode === "OFFLINE") matchStage.mode = mode;
  
  const data = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);
  
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
  const { filter, mode, paymentFilter } = req.query;
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

  // Payment filter — exact same logic as reportCtrl.js buildPaymentFilter
  if (!paymentFilter || paymentFilter === 'online_current') {
    matchCondition.$or = [
      { paymentDestination: 'CURRENT_ACCOUNT' },
      { mode: 'ONLINE', paymentDestination: { $exists: false } },
      { mode: 'ONLINE', paymentDestination: null },
    ];
  } else if (paymentFilter === 'cash') {
    matchCondition.$or = [
      { paymentDestination: 'CASH' },
      { mode: 'OFFLINE', paymentDestination: { $exists: false } },
      { mode: 'OFFLINE', paymentDestination: null },
    ];
  } else if (paymentFilter === 'online_other') {
    matchCondition.paymentDestination = 'OTHER_ACCOUNT';
  }
  // paymentFilter === 'all' → no extra condition
  
  // Get basic stats
  const stats = await Order.aggregate([
    { $match: { ...matchCondition, orderStatus: { $ne: "Cancelled" } } },
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
    { $match: matchCondition }, // intentionally includes all statuses for breakdown
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Get orders by mode (payment type)
  const ordersByMode = await Order.aggregate([
    { $match: { ...matchCondition, orderStatus: { $ne: "Cancelled" } } },
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
    { $match: { ...matchCondition, orderStatus: { $ne: "Cancelled" } } },
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
    { $match: { ...matchCondition, orderStatus: { $ne: "Cancelled" }, user: { $ne: null } } },
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
    { $match: { "customer.role": { $ne: "admin" } } },
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
  const { mode } = req.query;
  let monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  const matchStage = {
    createdAt: { $lte: new Date(), $gte: new Date(endDate) },
    orderStatus: { $ne: "Cancelled" },
  };
  if (mode === "ONLINE" || mode === "OFFLINE") matchStage.mode = mode;
  const data = await Order.aggregate([
    { $match: matchStage },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$totalPriceAfterDiscount" } } },
  ]);
  res.json(data);
});


const getProductByBarcode = asyncHandler(async (req, res) => {
  const { barcode } = req.params;

  let product = await findProductByBarcode(barcode);


  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if barcode is from variants.sizeStock
  let sizeInfo = null;
  let colorInfo = null;
  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const sizeEntry = variant.sizeStock.find(s => s.barcode === barcode);
      if (sizeEntry) {
        sizeInfo = {
          size: sizeEntry.size,
          quantity: sizeEntry.quantity,
          barcode: sizeEntry.barcode
        };
        colorInfo = variant.color;
        break;
      }
    }
  } else if (product.sizeStock && product.sizeStock.length > 0) {
    // Legacy support
    const sizeEntry = product.sizeStock.find(s => s.barcode === barcode);
    if (sizeEntry) {
      sizeInfo = {
        size: sizeEntry.size,
        quantity: sizeEntry.quantity,
        barcode: sizeEntry.barcode
      };
    }
  }

  let colorLabel = null;
  if (colorInfo) {
    colorLabel = typeof colorInfo === "string" ? colorInfo : colorInfo?.title || colorInfo?.name || null;
  } else if (product.color) {
    colorLabel = typeof product.color === "string" ? product.color : product.color?.title || product.color?.name || null;
  }

  res.json({
    _id: product._id,
    title: product.title,
    price: product.price,
    // If size-specific, return size quantity; otherwise return main quantity
    quantity: sizeInfo ? sizeInfo.quantity : product.quantity,
    barcode: barcode,
    size: sizeInfo ? sizeInfo.size : null,
    color: colorLabel,
    isSizeSpecific: sizeInfo !== null,
    pkey: product.pkey || null,
  });
});

// Check stock availability for a product by barcode
const checkStock = asyncHandler(async (req, res) => {
  const { barcode, quantity } = req.body;

  if (!barcode) {
    res.status(400);
    throw new Error("Barcode is required");
  }

  let product = await findProductByBarcode(barcode);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check if barcode is from variants.sizeStock
  let availableStock = 0;
  let sizeInfo = null;
  let colorInfo = null;

  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      const sizeEntry = variant.sizeStock.find(s => s.barcode === barcode);
      if (sizeEntry) {
        availableStock = sizeEntry.quantity;
        sizeInfo = {
          size: sizeEntry.size,
          quantity: sizeEntry.quantity
        };
        colorInfo = variant.color;
        break;
      }
    }
  } else if (product.sizeStock && product.sizeStock.length > 0) {
    // Legacy support
    const sizeEntry = product.sizeStock.find(s => s.barcode === barcode);
    if (sizeEntry) {
      availableStock = sizeEntry.quantity;
      sizeInfo = {
        size: sizeEntry.size,
        quantity: sizeEntry.quantity
      };
    }
  }

  // If not found in sizeStock or variants, use main quantity
  if (!sizeInfo && (availableStock === 0 || !product.sizeStock?.length && !product.variants?.length)) {
    availableStock = product.quantity;
  }

  const requestedQty = parseInt(quantity) || 1;

  let colorLabel = null;
  if (colorInfo) {
    colorLabel = typeof colorInfo === "string" ? colorInfo : colorInfo?.title || colorInfo?.name || null;
  } else if (product.color) {
    colorLabel = typeof product.color === "string" ? product.color : product.color?.title || product.color?.name || null;
  }

  res.json({
    barcode: barcode,
    title: product.title,
    availableStock: availableStock,
    requestedQuantity: requestedQty,
    isAvailable: availableStock >= requestedQty,
    canAdd: availableStock > 0,
    size: sizeInfo ? sizeInfo.size : null,
    color: colorLabel,
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
      { mobile: { $regex: cleanQuery } },
      { mobile: { $regex: query } },
      { referralCode: { $regex: query, $options: "i" } }
    ]
  })
    .limit(10)
    .select("firstname lastname mobile address coins referralCode referredBy offerDiscount offerType totalOrders lastOrderDate")
    .populate("referredBy", "firstname lastname mobile referralCode");

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
      "gstin email storeName storeTagline storeAddress storePhone cgst sgst igst storeState taxIncluded onlinePaymentDestination shippingCharge upiIdA upiIdB"
    );
    res.json({
      gstin: user.gstin || "",
      email: user.email || "",
      storeName: user.storeName || "Cart Corner",
      storeTagline: user.storeTagline || "Your One-Stop Shopping Destination",
      storeAddress: user.storeAddress || "",
      storePhone: user.storePhone || "",
      cgst: user.cgst || 0,
      sgst: user.sgst || 0,
      igst: user.igst || 0,
      storeState: user.storeState || "Gujarat",
      taxIncluded: user.taxIncluded === true,
      onlinePaymentDestination: user.onlinePaymentDestination || "CURRENT_ACCOUNT",
      shippingCharge: user.shippingCharge ?? 100,
      upiIdA: user.upiIdA || "",
      upiIdB: user.upiIdB || "",
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Update admin settings/configurations
const updateSettings = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const {
    cgst, sgst, igst, storeState, taxIncluded,
    storeName, storeTagline, storeAddress, storePhone,
    onlinePaymentDestination, shippingCharge, upiIdA, upiIdB,
  } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      cgst: parseFloat(cgst) >= 0 ? parseFloat(cgst) : 0,
      sgst: parseFloat(sgst) >= 0 ? parseFloat(sgst) : 0,
      igst: parseFloat(igst) >= 0 ? parseFloat(igst) : 0,
      storeState: storeState || "Gujarat",
      taxIncluded: Boolean(taxIncluded),
      ...(storeName    !== undefined && { storeName }),
      ...(storeTagline !== undefined && { storeTagline }),
      ...(storeAddress !== undefined && { storeAddress }),
      ...(storePhone   !== undefined && { storePhone }),
      ...(onlinePaymentDestination !== undefined && { onlinePaymentDestination }),
      ...(shippingCharge !== undefined && { shippingCharge: parseFloat(shippingCharge) >= 0 ? parseFloat(shippingCharge) : 0 }),
      ...(upiIdA !== undefined && { upiIdA: upiIdA || "" }),
      ...(upiIdB !== undefined && { upiIdB: upiIdB || "" }),
    },
    { new: true }
  );

  res.json({
    success: true,
    cgst: updatedUser.cgst,
    sgst: updatedUser.sgst,
    igst: updatedUser.igst,
    storeState: updatedUser.storeState,
    taxIncluded: updatedUser.taxIncluded,
    storeName: updatedUser.storeName,
    storeTagline: updatedUser.storeTagline,
    storeAddress: updatedUser.storeAddress,
    storePhone: updatedUser.storePhone,
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
        select: "title brand price images barcode hsnCode"
      })
      .populate("orderItems.color")
      .sort({ createdAt: -1 });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalPurchaseAmount = orders.reduce((sum, order) => sum + (order.totalPriceAfterDiscount || 0), 0);
    const lastOrder = orders.length > 0 ? orders[0] : null;

    // Calculate total savings offered (discounts only, excluding GST)
    const totalSavings = orders.reduce((sum, order) => {
      const discount = order.discountAmount || 0;
      const coinDiscount = order.coinAmount || 0;
      return sum + discount + coinDiscount;
    }, 0);

    // Populate referredBy info
    const referredByUser = customer.referredBy
      ? await User.findById(customer.referredBy).select("firstname lastname mobile referralCode")
      : null;

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
        coins: customer.coins || 0,
        referralCode: customer.referralCode || null,
        referralCount: customer.referralCount || 0,
        referralEarnings: customer.referralEarnings || 0,
        referredBy: customer.referredBy || null,
      },
      coinTransactions: (customer.coinTransactions || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      referralInfo: {
        referredBy: referredByUser
          ? {
              _id: referredByUser._id,
              firstname: referredByUser.firstname,
              lastname: referredByUser.lastname,
              mobile: referredByUser.mobile,
              referralCode: referredByUser.referralCode,
            }
          : null,
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

    const referralIds = referrals.map((ref) => ref._id);
    let referralOrderStatsMap = new Map();

    if (referralIds.length > 0) {
      const referralOrderStats = await Order.aggregate([
        {
          $match: {
            user: { $in: referralIds },
          },
        },
        {
          $project: {
            user: 1,
            earnedCoins: {
              $floor: {
                $multiply: [{ $ifNull: ["$totalPriceAfterDiscount", 0] }, 0.1],
              },
            },
          },
        },
        {
          $group: {
            _id: "$user",
            orderCount: { $sum: 1 },
            referrerEarnedCoins: { $sum: "$earnedCoins" },
          },
        },
      ]);

      referralOrderStatsMap = new Map(
        referralOrderStats.map((stat) => [stat._id.toString(), stat])
      );
    }

    const detailedReferrals = referrals.map((ref) => {
      const stat = referralOrderStatsMap.get(ref._id.toString());
      const orderCount = stat?.orderCount || 0;
      const referrerEarnedCoins = stat?.referrerEarnedCoins || 0;

      return {
        _id: ref._id,
        firstname: ref.firstname,
        lastname: ref.lastname,
        mobile: ref.mobile,
        createdAt: ref.createdAt,
        coins: ref.coins || 0,
        referrerEarnedCoins,
        // Status: not_signed_in (not applicable for referred users), signed_in, ordered
        status: orderCount > 0 ? "ordered" : "signed_in",
      };
    });

    // Calculate counts
    const signedInCount = detailedReferrals.filter(r => r.status === "signed_in").length;
    const orderedCount = detailedReferrals.filter(r => r.status === "ordered").length;
    let user = await User.findById(_id).select(
      "referralCode referralCount coins coinTransactions createdAt updatedAt"
    );

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
    
    const txnPage = parseInt(req.query.txnPage, 10) || 1;
    const txnLimit = parseInt(req.query.txnLimit, 10) || 10;

    const coinTransactionsFromDb = (user.coinTransactions || []).map((txn) => ({
      _id: txn._id,
      type: txn.type,
      coins: txn.coins,
      reason: txn.reason || "",
      source: txn.source || "other",
      description: txn.description || "",
      metadata: txn.metadata || {},
      createdAt: txn.createdAt || user.updatedAt || user.createdAt,
    }));

    // Backward compatibility for older orders before coinTransactions existed.
    const legacyDebitOrders = await Order.find({
      user: _id,
      coinAmount: { $gt: 0 },
    })
      .select("_id coinAmount coinsUsed createdAt mode")
      .sort({ createdAt: -1 });

    const legacyDebitEntries = legacyDebitOrders.map((order) => ({
      _id: `legacy-order-${order._id}`,
      type: "debit",
      coins: order.coinsUsed || order.coinAmount || 0,
      reason: "purchase",
      source: "purchase",
      description: "Coins used during purchase",
      metadata: {
        orderId: order._id,
        mode: order.mode || "ONLINE",
      },
      createdAt: order.createdAt,
    }));

    const seenLegacyOrderIds = new Set(
      coinTransactionsFromDb
        .filter((txn) => txn?.metadata?.orderId)
        .map((txn) => String(txn.metadata.orderId))
    );

    const mergedCoinTransactions = [
      ...coinTransactionsFromDb,
      ...legacyDebitEntries.filter(
        (txn) => !seenLegacyOrderIds.has(String(txn.metadata.orderId))
      ),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Enrich transactions with related user contact + order summary
    const relatedUserIds = Array.from(
      new Set(
        mergedCoinTransactions
          .map((txn) => txn?.metadata?.referredUserId)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );

    const relatedOrderIds = Array.from(
      new Set(
        mergedCoinTransactions
          .map((txn) => txn?.metadata?.orderId)
          .filter(Boolean)
          .map((id) => String(id))
      )
    );

    const relatedUsers = relatedUserIds.length
      ? await User.find({ _id: { $in: relatedUserIds } }).select(
          "firstname lastname mobile"
        )
      : [];

    const relatedOrders = relatedOrderIds.length
      ? await Order.find({ _id: { $in: relatedOrderIds } })
          .select("_id orderItems createdAt")
          .populate({
            path: "orderItems.product",
            select: "title",
          })
      : [];

    const relatedUserMap = new Map(
      relatedUsers.map((u) => [
        String(u._id),
        {
          name: `${u.firstname || ""} ${u.lastname || ""}`.trim() || "N/A",
          mobile: u.mobile || "",
        },
      ])
    );

    const relatedOrderMap = new Map(
      relatedOrders.map((o) => {
        const firstItem = o.orderItems?.[0];
        const firstProductTitle = firstItem?.product?.title || "Order";
        return [
          String(o._id),
          {
            orderId: o._id,
            orderTitle:
              o.orderItems?.length > 1
                ? `${firstProductTitle} +${o.orderItems.length - 1} more`
                : firstProductTitle,
          },
        ];
      })
    );

    const enrichedCoinTransactions = mergedCoinTransactions.map((txn) => {
      const relatedUser = txn?.metadata?.referredUserId
        ? relatedUserMap.get(String(txn.metadata.referredUserId))
        : null;
      const orderInfo = txn?.metadata?.orderId
        ? relatedOrderMap.get(String(txn.metadata.orderId))
        : null;

      return {
        ...txn,
        relatedUser: relatedUser || null,
        orderInfo: orderInfo || null,
      };
    });

    const totalCoinTransactions = enrichedCoinTransactions.length;
    const startIndex = (txnPage - 1) * txnLimit;
    const endIndex = startIndex + txnLimit;
    const paginatedCoinTransactions = enrichedCoinTransactions.slice(startIndex, endIndex);
    const hasMoreTransactions = endIndex < totalCoinTransactions;

    console.log("Sending response:", {
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      coins: user.coins || 0,
      signedInCount,
      orderedCount,
      referrals: detailedReferrals,
      coinTransactions: paginatedCoinTransactions,
      coinTransactionsPage: txnPage,
      coinTransactionsLimit: txnLimit,
      coinTransactionsTotal: totalCoinTransactions,
      coinTransactionsHasMore: hasMoreTransactions,
    });

    res.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      coins: user.coins || 0,
      signedInCount,
      orderedCount,
      referrals: detailedReferrals,
      coinTransactions: paginatedCoinTransactions,
      coinTransactionsPage: txnPage,
      coinTransactionsLimit: txnLimit,
      coinTransactionsTotal: totalCoinTransactions,
      coinTransactionsHasMore: hasMoreTransactions,
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

// Award coins on order - delegates to ReferralService for config-driven logic
// orderAmount = totalPriceAfterDiscount (after ALL discounts including coin discount)
const awardCoinsOnOrder = async (referredUserId, orderAmount, _coinPercent = 10, orderId = null) => {
  try {
    const ReferralService = require("../services/ReferralService");
    const orderCount = await Order.countDocuments({ user: referredUserId });
    const isFirstPurchase = orderCount <= 1;
    await ReferralService.processReferralReward(referredUserId, orderAmount, isFirstPurchase, orderId);
  } catch (err) {
    console.error("awardCoinsOnOrder error:", err.message);
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

// Request return/exchange (customer)
const requestReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type, reason } = req.body;
  const { _id: userId } = req.user;

  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (order.orderStatus !== "Delivered") { res.status(400); throw new Error("Return/Exchange only allowed after delivery"); }
  if (order.returnRequest?.status && order.returnRequest.status !== "NONE") {
    res.status(400); throw new Error("Return/Exchange request already submitted");
  }
  if (!type || !["RETURN", "EXCHANGE"].includes(type)) { res.status(400); throw new Error("Type must be RETURN or EXCHANGE"); }

  order.returnRequest = { status: "PENDING", type, reason: reason || "", requestedAt: new Date() };
  await order.save();
  res.json({ success: true, returnRequest: order.returnRequest });
});

// Admin: update return request status
const updateReturnRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;
  const validStatuses = ["APPROVED", "REJECTED", "COMPLETED"];
  if (!validStatuses.includes(status)) { res.status(400); throw new Error("Invalid status"); }

  const order = await Order.findById(id);
  if (!order) { res.status(404); throw new Error("Order not found"); }
  if (!order.returnRequest || order.returnRequest.status === "NONE") {
    res.status(400); throw new Error("No return request found");
  }

  order.returnRequest.status = status;
  order.returnRequest.adminNote = adminNote || "";
  order.returnRequest.resolvedAt = new Date();
  await order.save();
  res.json({ success: true, returnRequest: order.returnRequest });
});

// Update customer (admin)
const updateCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const { firstname, lastname, email, mobile, address } = req.body;
  const updated = await User.findByIdAndUpdate(
    id,
    { firstname, lastname, email, mobile, address },
    { new: true }
  );
  if (!updated) { res.status(404); throw new Error("Customer not found"); }
  res.json(updated);
});

// Delete customer (admin)
const deleteCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) { res.status(404); throw new Error("Customer not found"); }
  res.json(deleted);
});

// Validate shipping address — called at checkout to warn customer before placing order
const validateShippingAddress = asyncHandler(async (req, res) => {
  const { firstname, address, city, state, pincode, phone } = req.body;
  const result = validateAddress({ firstname, address, city, state, pincode, phone });
  res.json(result);
});

module.exports = {
  createUser,
  validateShippingAddress,
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
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getDailySales,
  getDashboardStats,
  getAllOrders,
  getsingleOrder,
  getMySingleOrder,
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
  validateCartStock,
  updateCustomerById,
  deleteCustomerById,
  addBundleToCart,
  cancelOrder,
  adminCancelOrder,
};
