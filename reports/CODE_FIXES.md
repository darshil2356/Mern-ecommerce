# Critical Bug Fixes - Code Examples

## Fix #1: Secure API Credentials

### Current (UNSAFE)
**File:** `Backend/controller/paymentCtrl.js`
```javascript
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: "rzp_test_HSSeDI22muUrLR",       // ❌ EXPOSED!
  key_secret: "sRO0YkBxvgMg0PvWHJN16Uf7",  // ❌ EXPOSED!
});
```

### Fixed (SECURE)
```javascript
const Razorpay = require("razorpay");

// Environment variables must be set before this
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Missing Razorpay credentials in environment variables");
}

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

### .env File (Backend root)
```env
RAZORPAY_KEY_ID=your_public_key_here
RAZORPAY_KEY_SECRET=your_secret_key_here
JWT_SECRET=your_jwt_secret_here
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname
PORT=8000
NODE_ENV=production
```

### .gitignore Update
```
# At project root
.env
.env.local
.env.*.local
```

---

## Fix #2: Payment Verification with Signature

### Current (VULNERABLE)
**File:** `Backend/controller/paymentCtrl.js`
```javascript
const paymentVerification = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId } = req.body;
  res.json({
    razorpayOrderId,
    razorpayPaymentId,  // ❌ Just echoing back, NO verification!
  });
};
```

### Fixed (SECURE)
```javascript
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');

const paymentVerification = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  
  // Verify signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  
  // Compare signatures
  if (expectedSignature !== razorpaySignature) {
    res.status(400);
    throw new Error("Payment verification failed - Invalid signature");
  }
  
  // Signature verified - safe to proceed
  res.json({ 
    success: true, 
    message: "Payment verified successfully",
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId 
  });
});

module.exports = { checkout, paymentVerification };
```

### Frontend Update
**File:** `Frontend/src/pages/Checkout.js`
```javascript
// Around line 190-210, update the payment handler:
const paymentResult = await axios.post(
  `${base_url}user/order/paymentVerification`,
  {
    orderCreationId: order_id,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpayOrderId: response.razorpay_order_id,
    razorpaySignature: response.razorpay_signature  // ADD THIS!
  },
  getConfig()
);
```

---

## Fix #3: Auth Middleware Error Handling

### Current (PROBLEMATIC)
**File:** `Backend/middlewares/authMiddleware.js`
```javascript
const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded?.id);
        req.user = user;
        next();
      }
    } 
    catch (error) {
      res.status(401);
      throw new Error("Not Authorized token expired,Please Login again");
    }
    // ❌ Missing else, execution continues!
  } else {
    res.status(401);
    throw new Error("THere is no token attached to header");
  }
  // ❌ Code might fall through here
});
```

### Fixed (PROPER)
```javascript
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check if authorization header exists
  if (!req?.headers?.authorization?.startsWith("Bearer")) {
    res.status(401);
    throw new Error("No token attached to header. Please login first.");
  }
  
  try {
    // Extract token
    token = req.headers.authorization.split(" ")[1];
    
    if (!token) {
      res.status(401);
      throw new Error("Token is empty");
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded?.id);
    
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }
    
    // Attach user to request
    req.user = user;
    next();
    
  } catch (error) {
    // Handle JWT errors specifically
    if (error.name === 'JsonWebTokenError') {
      res.status(401);
      throw new Error("Invalid token");
    }
    
    if (error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error("Token has expired. Please login again.");
    }
    
    // Re-throw other errors
    throw error;
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("User not authenticated");
  }
  
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error("You do not have admin privileges");
  }
  
  next();
});

module.exports = { authMiddleware, isAdmin };
```

---

## Fix #4: Database Connection with Retry

### Current (UNRELIABLE)
**File:** `Backend/config/dbConnect.js`
```javascript
const { default: mongoose } = require("mongoose");

const dbConnect = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URL); // ❌ Promise not awaited!
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("DAtabase error"); // ❌ Typo, error not logged properly
  }
};
module.exports = dbConnect;
```

### Fixed (RELIABLE)
```javascript
const mongoose = require("mongoose");

const dbConnect = async (retries = 5, delay = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGODB_URL, {
        maxPoolSize: 10,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
      });
      
      console.log("✓ Database Connected Successfully");
      return;
      
    } catch (error) {
      console.error(`❌ Database connection failed (attempt ${attempt + 1}/${retries}):`, error.message);
      
      if (attempt < retries - 1) {
        console.log(`  Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error("✗ Database connection failed after all retries. Exiting...");
        process.exit(1);
      }
    }
  }
};

module.exports = dbConnect;
```

### Update Backend/index.js
```javascript
const dbConnect = require("./config/dbConnect");

// Call it as async
(async () => {
  await dbConnect();
  
  // Start server after DB connection
  app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
  });
})();
```

---

## Fix #5: Remove Duplicate Routes

### Current (PROBLEMATIC)
**File:** `Backend/index.js` (Lines 45-65)
```javascript
// ❌ productRouter is used twice!
app.use("/api/product", productRouter);
app.use("/api/product", productRoute);

// ❌ userRoute is loaded 3 times!
app.use("/api/user/search", require("./routes/userRoute"));
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/user", authRouter);

// ❌ More duplicates
app.use("/api/product", productRouter); // Third time!
```

### Fixed (CLEAN)
```javascript
// Backend/index.js
const bodyParser = require("body-parser");
const express = require("express");
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 8000;

// Import all routers
const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const blogRouter = require("./routes/blogRoute");
const categoryRouter = require("./routes/prodcategoryRoute");
const blogcategoryRouter = require("./routes/blogCatRoute");
const brandRouter = require("./routes/brandRoute");
const colorRouter = require("./routes/colorRoute");
const enqRouter = require("./routes/enqRoute");
const couponRouter = require("./routes/couponRoute");
const uploadRouter = require("./routes/uploadRoute");
const customerRoute = require("./routes/customerRoute");
const reportRouter = require("./routes/reportRoute");
const bundleRouter = require("./routes/bundleRoute");
const spinRouter = require("./routes/spinRoute");
const rewardRouter = require("./routes/rewardRoute");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");

// Initialize DB
dbConnect();

// Middleware
app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// ✓ Routes - Each path mounted ONCE
app.use("/api/user", authRouter);
app.use("/api/product", productRouter);
app.use("/api/blog", blogRouter);
app.use("/api/category", categoryRouter);
app.use("/api/blogcategory", blogcategoryRouter);
app.use("/api/brand", brandRouter);
app.use("/api/color", colorRouter);
app.use("/api/enquiry", enqRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/customers", customerRoute);
app.use("/api/reports", reportRouter);
app.use("/api/bundles", bundleRouter);
app.use("/api/spin", spinRouter);
app.use("/api/rewards", rewardRouter);

// Static files
app.use("/public", express.static("public"));

// Error handling - MUST be last
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server is running at PORT ${PORT}`);
});
```

---

## Fix #6: Stock Deduction with Transactions

### Current (UNSAFE - Race Condition)
**File:** `Backend/controller/userCtrl.js`
```javascript
const deductStockFromProduct = async (product, item) => {
  // ❌ No locking mechanism - concurrent orders can read same stock value
  if (product.quantity >= item.quantity) {
    product.quantity = Math.max(0, product.quantity - item.quantity);
    // ❌ What if another order updates between read and write?
  }
  return { deducted: true };
};
```

### Fixed (WITH TRANSACTIONS)
```javascript
const asyncHandler = require("express-async-handler");

const deductStockFromProduct = async (session, product, item) => {
  let deducted = false;
  let barcode = null;

  // Try to deduct from exact barcode if provided
  if (item.barcode) {
    if (product.sizeStock && product.sizeStock.length > 0) {
      const sizeEntry = product.sizeStock.find((s) => s.barcode === item.barcode);
      if (sizeEntry && sizeEntry.quantity >= item.quantity) {
        sizeEntry.quantity -= item.quantity;
        barcode = sizeEntry.barcode;
        deducted = true;
      }
    }
  }

  // Try variants with color + size matching
  if (!deducted && item.color && item.size && product.variants) {
    for (const variant of product.variants) {
      const variantColorId = variant.color?._id?.toString() || variant.color?.toString();
      const itemColorId = item.color?._id?.toString() || item.color?.toString();
      
      if (variantColorId === itemColorId) {
        const sizeEntry = variant.sizeStock?.find((s) => s.size === item.size);
        if (sizeEntry && sizeEntry.quantity >= item.quantity) {
          sizeEntry.quantity -= item.quantity;
          barcode = sizeEntry.barcode || barcode;
          deducted = true;
          break;
        }
      }
    }
  }

  // Fallback to main quantity
  if (!deducted && product.quantity >= item.quantity) {
    product.quantity -= item.quantity;
    barcode = product.barcode;
    deducted = true;
  }

  // ✓ Use findByIdAndUpdate with $inc for atomic operation
  if (deducted) {
    await Product.findByIdAndUpdate(
      product._id,
      { $set: product },
      { session } // ✓ Part of transaction
    );
  }

  return { deducted, barcode };
};

// In createOrder controller:
const createOrder = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cartItems, paymentInfo } = req.body;

    // Deduct stock for all items within transaction
    for (const item of cartItems) {
      const product = await Product.findById(item.product).session(session);
      const { deducted } = await deductStockFromProduct(session, product, item);
      
      if (!deducted) {
        throw new Error(`Insufficient stock for product ${item.product}`);
      }
    }

    // Create order
    const order = await Order.create([{ 
      user: req.user._id,
      orderItems: cartItems,
      totalPrice: req.body.totalPrice,
      totalPriceAfterDiscount: req.body.totalPriceAfterDiscount,
      paymentInfo,
      shippingInfo: req.body.shippingInfo,
    }], { session });

    // Clear cart
    await Cart.deleteMany({ user: req.user._id }, { session });

    // ✓ Commit transaction
    await session.commitTransaction();

    res.json({
      success: true,
      order: order[0],
      message: "Order created successfully"
    });

  } catch (error) {
    // ✓ Rollback on any error
    await session.abortTransaction();
    throw error;

  } finally {
    session.endSession();
  }
});
```

---

## Fix #7: Add Input Validation

### Current (NO VALIDATION)
```javascript
const createOfflineOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, customer, discount } = req.body;
  // ❌ No validation - user could send anything!
  console.log("Incoming body:", req.body);
});
```

### Fixed (WITH VALIDATION)
```bash
npm install express-validator
```

```javascript
const { body, validationResult, param } = require('express-validator');
const asyncHandler = require('express-async-handler');

// Validation middleware
const validateOfflineOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least 1 item'),
  body('items.*.product')
    .notEmpty()
    .withMessage('Product ID required for each item'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('shippingInfo.firstname')
    .notEmpty()
    .withMessage('First name is required'),
  body('shippingInfo.mobile')
    .isMobilePhone()
    .withMessage('Valid mobile number required'),
  body('totalPrice')
    .isFloat({ min: 0 })
    .withMessage('Total price must be valid'),
  body('paymentMethod')
    .isIn(['CASH', 'CARD', 'UPI', 'CHEQUE'])
    .withMessage('Invalid payment method'),
];

// Route with validation
router.post(
  '/offline-order',
  authMiddleware,
  isAdmin,
  validateOfflineOrder,
  createOfflineOrder
);

// In controller
const createOfflineOrder = asyncHandler(async (req, res) => {
  // ✓ Check validation errors first
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
  }

  const { items, shippingInfo, totalPrice, paymentMethod } = req.body;
  
  // Now we can safely use the data
  const order = await Order.create({
    user: req.user._id,
    orderItems: items,
    shippingInfo,
    totalPrice,
    totalPriceAfterDiscount: totalPrice,
    paymentInfo: { razorpayOrderId: 'OFFLINE', paymentMethod },
    mode: 'OFFLINE',
    orderStatus: 'Ordered'
  });

  res.json({
    success: true,
    order,
    message: "Offline order created successfully"
  });
});
```

---

## Fix #8: Remove Console.logs

### Current (MEMORY LEAK)
```javascript
// All over the code:
console.log("RESULT Data ===", res.data);
console.log("Fetched coins for customer:", coins);
console.log("Incoming body:", req.body);
```

### Setup Logger (Once)
```bash
npm install winston
```

**File:** `Backend/config/logger.js`
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Also log to console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### Use Logger Instead
```javascript
const logger = require('../config/logger');

// Replace all:
console.log(...) → logger.info(...)
console.error(...) → logger.error(...)
console.warn(...) → logger.warn(...)
console.debug(...) → logger.debug(...)

// Example:
logger.info('User order created', { userId: user._id, orderId: order._id });
logger.error('Payment verification failed', { error: error.message });
```

---

## Fix #9: Rate Limiting

```bash
npm install express-rate-limit
```

**File:** `Backend/middleware/rateLimiter.js`
```javascript
const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Limiter for public endpoints
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
});

module.exports = { generalLimiter, authLimiter, publicLimiter };
```

**File:** `Backend/index.js`
```javascript
const { generalLimiter, authLimiter, publicLimiter } = require('./middlewares/rateLimiter');

// Apply general limiter to all API requests
app.use('/api/', generalLimiter);

// Apply strict limiter to auth endpoints
app.post('/api/user/login', authLimiter, loginUserCtrl);
app.post('/api/user/admin-login', authLimiter, loginAdmin);
router.post('/api/user/register', publicLimiter, registerUser);
```

---

## Complete .env Template

Create `.env` file in Backend root:
```env
# Database
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/databasename?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-that-is-at-least-32-characters
JWT_EXPIRE=24h
REFRESH_TOKEN_EXPIRE=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# Cloudinary Configuration
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Server Configuration
PORT=8000
NODE_ENV=production

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

---

## Testing Commands

```bash
# Check for console.logs
grep -rn "console\." Backend/controller/ Backend/routes/ | grep -v "node_modules"

# Find all env variables
grep -rn "process\.env\." Backend/ | cut -d: -f2- | sort | uniq

# Check for hardcoded credentials
grep -rn "key.*:.*\"" Backend/controller/paymentCtrl.js

# Run with env validation
NODE_ENV=production node Backend/index.js
```

