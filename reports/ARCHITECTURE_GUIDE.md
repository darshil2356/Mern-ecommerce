# Architecture & Code Structure Guide

## Project Overview

This is a full-stack MERN (MongoDB, Express, React, Node.js) e-commerce platform with Admin and Customer panels.

```
Mern-ecommerce/
├── Backend/          # Node.js + Express API server
├── Frontend/         # React customer-facing application
├── Admin/            # React admin dashboard
└── Root configs      # Project-wide configuration files
```

---

## Backend Architecture

### Directory Structure

```
Backend/
├── index.js                  # Main server entry point
├── package.json
├── config/                   # Configuration files
│   ├── dbConnect.js         # MongoDB connection
│   ├── jwtToken.js          # JWT token generation
│   └── refreshtoken.js      # Refresh token logic
├── middlewares/             # Express middlewares
│   ├── authMiddleware.js    # JWT authentication
│   ├── errorHandler.js      # Error handling
│   ├── uploadMiddleware.js  # File upload
│   └── uploadImage.js       # Image processing
├── models/                  # Mongoose schemas
│   ├── userModel.js         # User schema with roles
│   ├── productModel.js      # Product with variants
│   ├── orderModel.js        # Order schema
│   ├── cartModel.js         # Cart management
│   ├── couponModel.js       # Discount coupons
│   ├── blogModel.js         # Blog posts
│   ├── bundleModel.js       # Product bundles
│   └── ...otherModels
├── controller/              # Business logic
│   ├── userCtrl.js         # User & order operations
│   ├── productCtrl.js      # Product management
│   ├── paymentCtrl.js      # Razorpay integration
│   ├── reportCtrl.js       # Analytics & reports
│   └── ...otherControllers
├── routes/                  # API endpoints
│   ├── authRoute.js        # Auth & user endpoints
│   ├── productRoute.js     # Product endpoints
│   ├── orderRoute.js       # Order endpoints
│   └── ...otherRoutes
├── services/               # Business logic services
│   ├── ReferralService.js  # Referral system
│   └── SpinService.js      # Spin wheel logic
├── utils/                  # Helper functions
│   ├── validateMongodbId.js
│   ├── colorDisplay.js
│   └── cloudinary.js       # Image hosting
└── public/                 # Uploaded files storage
    ├── images/
    └── videos/
```

### Key Models

#### User Model
- Standard auth fields: email, password, mobile
- Role-based: "user" or "admin"
- Loyalty system: coins, wishlist, referral tracking
- Customization: store settings, tax configuration
- History: orders, cart, transactions

#### Product Model
- Basic: title, description, price, category
- Inventory: quantity, sizeStock array, variants
- Organization: barcode, slug, brand, color
- Media: images, videos (Cloudinary)
- Relationships: category, brand, color references

#### Order Model
- User reference with shipping info
- Items: product, color, quantity, price
- Pricing: totalPrice, discounts, taxes
- Status tracking: orderStatus, paymentInfo
- Mode: ONLINE or OFFLINE

#### Cart Model
- User-specific items
- Product references with selected options
- Quantity tracking
- Price calculations

### API Structure

#### Authentication Routes
```
POST   /api/user/register           - Register new user
POST   /api/user/login              - User login
POST   /api/user/admin-login        - Admin login
POST   /api/user/forgot-password-token
PUT    /api/user/reset-password/:token
PUT    /api/user/password           - Change password
GET    /api/user/refresh-token      - Refresh JWT
POST   /api/user/logout             - Logout
```

#### Product Routes
```
GET    /api/product                 - List all products (with filters)
GET    /api/product/:id             - Get single product
POST   /api/product                 - Create product (Admin)
PUT    /api/product/:id             - Update product (Admin)
DELETE /api/product/:id             - Delete product (Admin)
POST   /api/product/check-stock     - Verify stock availability
```

#### Order Routes
```
POST   /api/user/cart               - Add to cart
GET    /api/user/cart               - Get user cart
PUT    /api/user/cart/:itemId       - Update cart item
DELETE /api/user/cart/:itemId       - Remove from cart
POST   /api/user/order/checkout     - Create Razorpay order
POST   /api/user/order/paymentVerification - Verify payment
GET    /api/user/my-orders          - Get user orders
GET    /api/user/orders/:orderId    - Get order details
PUT    /api/user/order/:orderId     - Update order status (Admin)
POST   /api/user/offline-order      - Create offline order (Admin)
```

#### Loyalty Routes
```
GET    /api/user/referral-code      - Get user referral code
POST   /api/user/apply-referral     - Apply referral code
GET    /api/user/my-referrals       - Get referral details
POST   /api/rewards/claim           - Claim loyalty rewards
```

---

## Frontend Architecture

### Directory Structure

```
Frontend/
├── src/
│   ├── index.js                    # Entry point
│   ├── App.js                      # Main App component
│   ├── app/                        # Redux store configuration
│   │   └── store.js               # Redux store setup
│   ├── components/                 # Reusable components
│   │   ├── Header.js              # Navigation header
│   │   ├── Footer.js              # Footer
│   │   ├── Layout.js              # Main layout wrapper
│   │   ├── Product/               # Product components
│   │   ├── Cart/                  # Cart components
│   │   └── ...otherComponents
│   ├── pages/                      # Page components
│   │   ├── Home.js                # Homepage
│   │   ├── Product.js             # Product listing
│   │   ├── SingleProduct.js       # Product details
│   │   ├── Cart.js                # Shopping cart
│   │   ├── Checkout.js            # Payment & checkout
│   │   ├── Orders.js              # Order history
│   │   ├── Profile.js             # User profile
│   │   ├── Login.js               # Authentication
│   │   ├── Signup.js              # User registration
│   │   ├── Reels.js               # Social-style shopping
│   │   ├── Bundles.js             # Bundle products
│   │   └── ...otherPages
│   ├── features/                   # Redux slices
│   │   ├── user/
│   │   │   ├── userSlice.js       # User state
│   │   │   └── userService.js     # User API calls
│   │   ├── products/
│   │   │   ├── productSlice.js    # Product state
│   │   │   └── productService.js  # Product API calls
│   │   ├── cart/                   # Cart state
│   │   ├── orders/                 # Order state
│   │   └── ...otherSlices
│   ├── routing/                    # Route protection
│   │   ├── PrivateRoutes.js       # Protected routes
│   │   └── OpenRoutes.js          # Public routes
│   ├── utils/                      # Helper functions
│   │   ├── axiosSetup.js          # Axios interceptors
│   │   └── constants.js           # Constants
│   └── images/                     # Static assets
├── public/
│   ├── index.html
│   └── manifest.json
└── package.json
```

### Redux Store Structure

```
store/
├── user
│   ├── authStatus: "idle" | "loading" | "success" | "failed"
│   ├── user: { id, name, email, role, coins }
│   ├── authToken: string
│   └── isAdmin: boolean
├── products
│   ├── products: Product[]
│   ├── filteredProducts: Product[]
│   ├── selectedProduct: Product | null
│   ├── filters: { category, price, brand }
│   └── loading: boolean
├── cart
│   ├── items: CartItem[]
│   ├── totalPrice: number
│   ├── totalItems: number
│   └── discounts: { coupon, referral, coins }
└── orders
    ├── orders: Order[]
    ├── selectedOrder: Order | null
    └── status: "idle" | "loading" | "success" | "failed"
```

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Search
│   │   ├── Navigation
│   │   └── User Menu
│   ├── Routes (pages)
│   │   ├── Home
│   │   ├── Product List
│   │   ├── Product Detail
│   │   ├── Cart
│   │   └── Checkout
│   └── Footer
```

### Authentication Flow

```
1. User enters email + password in Login.js
2. POST /api/user/login sent via userService.js
3. Backend returns { token, refreshToken, user }
4. Redux stores token + user in state
5. Token saved to localStorage
6. API interceptor adds token to headers
7. Protected routes check token before rendering
```

---

## Admin Dashboard Architecture

### Directory Structure

```
Admin/
├── src/
│   ├── index.js
│   ├── App.js
│   ├── app/
│   │   └── store.js              # Redux for admin state
│   ├── components/
│   │   ├── MainLayout.js         # Sidebar + header layout
│   │   ├── Sidebar.js            # Navigation menu
│   │   └── ...otherComponents
│   ├── pages/
│   │   ├── Dashboard.js          # Analytics overview
│   │   ├── Orders.js             # Order management
│   │   ├── ViewOrder.js          # Order details
│   │   ├── Customers.js          # Customer list
│   │   ├── Productlist.js        # Product list
│   │   ├── Addproduct.js         # Product form
│   │   ├── LiveBilling.js        # POS system
│   │   ├── Reports.js            # Sales reports
│   │   ├── Settings.js           # Configuration
│   │   ├── ReferralSettings.js   # Referral config
│   │   ├── CoinSettings.js       # Loyalty config
│   │   └── ...otherPages
│   ├── features/                 # Redux admin slices
│   └── utils/
│       └── axiosSetup.js
└── package.json
```

### Key Admin Features

1. **Dashboard** - Sales metrics, top products, customer stats
2. **Product Management** - CRUD for products, variants, bundles
3. **Order Management** - View, update status, print invoices
4. **Customer Management** - View profiles, referral tracking
5. **Live Billing** - POS system for offline sales
6. **Reports** - Sales by date, payment mode, customer analysis
7. **Loyalty System** - Spin wheel, referral, coins configuration
8. **Settings** - Store info, tax settings, loyalty parameters

---

## Data Flow

### Order Creation Flow

```
Frontend (Checkout.js)
    ↓
1. User fills shipping form
2. Validates cart items
3. Calls POST /api/user/order/checkout (for Razorpay order)
    ↓
Backend (paymentCtrl.js)
    ↓
4. Razorpay creates order
5. Returns order_id & amount
    ↓
Frontend
    ↓
6. Opens Razorpay payment modal
7. User enters payment details
8. Payment processed by Razorpay
    ↓
9. Success callback → POST /api/user/order/paymentVerification
    ↓
Backend (userCtrl.js - createOrder)
    ↓
10. Verifies payment (BUG: currently doesn't verify!)
11. Deducts stock from products
12. Awards referral coins if applicable
13. Creates Order document in database
14. Returns order confirmation
    ↓
Frontend
    ↓
15. Clears cart
16. Displays confirmation
17. Redirects to orders page
```

### Stock Management Flow

```
Product
├── quantity (simple int)
├── sizeStock []
│   ├── size: "S", "M", "L"
│   ├── quantity: number
│   └── barcode: string
└── variants []
    ├── color: reference
    └── sizeStock []
        ├── size: string
        ├── quantity: number
        └── barcode: string

When order created:
1. Check inventory structure (simple or variants)
2. Match by color/size if provided
3. Deduct from appropriate level
4. Save barcode for tracking
5. Verify minimum stock not breached
```

---

## Key Integrations

### Payment Gateway (Razorpay)
- Create order on backend
- Show payment modal on frontend
- Verify signature on backend
- Update order status after payment

### Image Hosting (Cloudinary)
- Upload product images via uploadCtrl.js
- Store URLs in product documents
- Used in product display & admin

### Email Service (Nodemailer)
- Order confirmations
- Password reset links
- Referral notifications

---

## Environment & Configuration

### Backend Environment Variables
```env
MONGODB_URL=          # Database connection
JWT_SECRET=           # Token signing key
RAZORPAY_KEY_ID=      # Payment gateway
RAZORPAY_KEY_SECRET=  # Payment gateway secret
CLOUDINARY_NAME=      # Image hosting
CLOUDINARY_KEY=       # Image hosting key
CLOUDINARY_SECRET=    # Image hosting secret
SMTP_USER=            # Email service
SMTP_PASS=            # Email service password
PORT=8000
NODE_ENV=production
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=    # Backend API base URL
REACT_APP_RAZORPAY_KEY= # Public Razorpay key
```

---

## Performance Considerations

### Database Optimization
- Add indexes on frequently queried fields
- Use pagination for list endpoints
- Implement caching for static data
- Use lean() queries when full documents not needed

### API Optimization
- Compress responses with gzip
- Implement request/response caching
- Batch database operations
- Use connection pooling

### Frontend Optimization
- Code splitting by route
- Lazy load images
- Memoize expensive computations
- Minimize Redux state updates

---

## Security Architecture

### Authentication
- JWT tokens with 24h expiry
- Refresh token for renewal
- Password hashing with bcrypt
- Secure HTTP-only cookies

### Authorization
- Role-based access control (user, admin)
- Middleware checks on protected routes
- Endpoint-level permission verification

### Data Protection
- HTTPS in production
- CORS configuration
- Request validation & sanitization
- Rate limiting on sensitive endpoints

---

## Error Handling

### Backend
- Express error handler middleware
- Async wrapper for route handlers
- MongoDB validation errors
- JWT verification errors

### Frontend
- Redux error state
- Component error boundaries
- Axios interceptor for 401/403
- User-friendly error messages

---

## Testing Strategy

### Unit Tests
- Redux reducers
- Service functions
- Utility functions
- Model schemas

### Integration Tests
- Auth flow (register, login, logout)
- Cart operations (add, update, remove)
- Order creation & payment

### E2E Tests
- Complete purchase flow
- Admin product creation
- Referral system
- Report generation

---

## Deployment Architecture

### Backend Deployment
- Node.js server (Render/Heroku)
- MongoDB Atlas (cloud database)
- Cloudinary (image CDN)
- Environment variables in platform

### Frontend Deployment
- React build optimization
- Static hosting (Netlify/Vercel)
- CDN for assets
- Build size monitoring

### Admin Deployment
- Similar to frontend
- Separate deployment for admin panel

---

## Future Scalability

### Horizontal Scaling
- Separate database replicas
- Load balancing for API servers
- CDN for static assets
- Message queue (RabbitMQ) for async tasks

### Caching Strategy
- Redis for session storage
- Product catalog caching
- API response caching
- Client-side caching with Service Workers

### Monitoring & Analytics
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Analytics (Google Analytics)
- Log aggregation (ELK stack)

