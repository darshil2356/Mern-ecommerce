/**
 * Data Cleanup Script
 * 
 * This script cleans all data EXCEPT:
 * - Products (productModel)
 * - Admin users (userModel with role='admin')
 * - Customers (userModel with role='user')
 * 
 * Usage: node cleanupData.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Import all models
const Order = require("./models/orderModel");
const Cart = require("./models/cartModel");
const Coupon = require("./models/couponModel");
const Enquiry = require("./models/enqModel");
const Rojmel = require("./models/rojmelModel");
const Blog = require("./models/blogModel");
const BlogCategory = require("./models/blogCatModel");
const Brand = require("./models/brandModel");
const Bundle = require("./models/bundleModel");
const Color = require("./models/colorModel");
const ProductCategory = require("./models/prodcategoryModel");
const Size = require("./models/sizeModel");
const Offer = require("./models/offerModel");
const ProductInquiry = require("./models/productInquiryModel");
const Notification = require("./models/notificationModel");
const SpinHistory = require("./models/spinHistoryModel");
const Session = require("./models/sessionModel");
const Event = require("./models/eventModel");
const Issue = require("./models/issueModel");
const MarketIntel = require("./models/marketIntelModel");
const GrowthReport = require("./models/growthReportModel");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

// Cleanup function
const cleanupData = async () => {
  try {
    console.log("\n🧹 Starting Data Cleanup...\n");
    console.log("⚠️  This will delete ALL data except Products, Admin users, and Customers\n");

    // Wait 3 seconds to allow cancellation
    console.log("⏳ Starting in 3 seconds... Press Ctrl+C to cancel\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    let totalDeleted = 0;

    // Delete Orders
    const ordersDeleted = await Order.deleteMany({});
    console.log(`🗑️  Orders deleted: ${ordersDeleted.deletedCount}`);
    totalDeleted += ordersDeleted.deletedCount;

    // Delete Carts
    const cartsDeleted = await Cart.deleteMany({});
    console.log(`🗑️  Carts deleted: ${cartsDeleted.deletedCount}`);
    totalDeleted += cartsDeleted.deletedCount;

    // Delete Coupons
    const couponsDeleted = await Coupon.deleteMany({});
    console.log(`🗑️  Coupons deleted: ${couponsDeleted.deletedCount}`);
    totalDeleted += couponsDeleted.deletedCount;

    // Delete Enquiries
    const enquiriesDeleted = await Enquiry.deleteMany({});
    console.log(`🗑️  Enquiries deleted: ${enquiriesDeleted.deletedCount}`);
    totalDeleted += enquiriesDeleted.deletedCount;

    // Delete Rojmel (Accounting entries)
    const rojmelDeleted = await Rojmel.deleteMany({});
    console.log(`🗑️  Rojmel entries deleted: ${rojmelDeleted.deletedCount}`);
    totalDeleted += rojmelDeleted.deletedCount;

    // Delete Blogs
    const blogsDeleted = await Blog.deleteMany({});
    console.log(`🗑️  Blogs deleted: ${blogsDeleted.deletedCount}`);
    totalDeleted += blogsDeleted.deletedCount;

    // Delete Blog Categories
    const blogCatsDeleted = await BlogCategory.deleteMany({});
    console.log(`🗑️  Blog Categories deleted: ${blogCatsDeleted.deletedCount}`);
    totalDeleted += blogCatsDeleted.deletedCount;

    // Delete Brands
    const brandsDeleted = await Brand.deleteMany({});
    console.log(`🗑️  Brands deleted: ${brandsDeleted.deletedCount}`);
    totalDeleted += brandsDeleted.deletedCount;

    // Delete Bundles
    const bundlesDeleted = await Bundle.deleteMany({});
    console.log(`🗑️  Bundles deleted: ${bundlesDeleted.deletedCount}`);
    totalDeleted += bundlesDeleted.deletedCount;

    // Delete Colors
    const colorsDeleted = await Color.deleteMany({});
    console.log(`🗑️  Colors deleted: ${colorsDeleted.deletedCount}`);
    totalDeleted += colorsDeleted.deletedCount;

    // Delete Product Categories
    const categoriesDeleted = await ProductCategory.deleteMany({});
    console.log(`🗑️  Product Categories deleted: ${categoriesDeleted.deletedCount}`);
    totalDeleted += categoriesDeleted.deletedCount;

    // Delete Sizes
    const sizesDeleted = await Size.deleteMany({});
    console.log(`🗑️  Sizes deleted: ${sizesDeleted.deletedCount}`);
    totalDeleted += sizesDeleted.deletedCount;

    // Delete Offers
    const offersDeleted = await Offer.deleteMany({});
    console.log(`🗑️  Offers deleted: ${offersDeleted.deletedCount}`);
    totalDeleted += offersDeleted.deletedCount;

    // Delete Product Inquiries
    const inquiriesDeleted = await ProductInquiry.deleteMany({});
    console.log(`🗑️  Product Inquiries deleted: ${inquiriesDeleted.deletedCount}`);
    totalDeleted += inquiriesDeleted.deletedCount;

    // Delete Notifications
    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`🗑️  Notifications deleted: ${notificationsDeleted.deletedCount}`);
    totalDeleted += notificationsDeleted.deletedCount;

    // Delete Spin History
    const spinHistoryDeleted = await SpinHistory.deleteMany({});
    console.log(`🗑️  Spin History deleted: ${spinHistoryDeleted.deletedCount}`);
    totalDeleted += spinHistoryDeleted.deletedCount;

    // Delete Sessions
    const sessionsDeleted = await Session.deleteMany({});
    console.log(`🗑️  Sessions deleted: ${sessionsDeleted.deletedCount}`);
    totalDeleted += sessionsDeleted.deletedCount;

    // Delete Events
    const eventsDeleted = await Event.deleteMany({});
    console.log(`🗑️  Events deleted: ${eventsDeleted.deletedCount}`);
    totalDeleted += eventsDeleted.deletedCount;

    // Delete Issues
    const issuesDeleted = await Issue.deleteMany({});
    console.log(`🗑️  Issues deleted: ${issuesDeleted.deletedCount}`);
    totalDeleted += issuesDeleted.deletedCount;

    // Delete Market Intelligence
    const marketIntelDeleted = await MarketIntel.deleteMany({});
    console.log(`🗑️  Market Intelligence deleted: ${marketIntelDeleted.deletedCount}`);
    totalDeleted += marketIntelDeleted.deletedCount;

    // Delete Growth Reports
    const growthReportsDeleted = await GrowthReport.deleteMany({});
    console.log(`🗑️  Growth Reports deleted: ${growthReportsDeleted.deletedCount}`);
    totalDeleted += growthReportsDeleted.deletedCount;

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Cleanup Complete!`);
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log("=".repeat(60));
    console.log("\n✅ Preserved:");
    console.log("   - Products");
    console.log("   - Admin users");
    console.log("   - Customers (users)");
    console.log("\n");

  } catch (error) {
    console.error("\n❌ Error during cleanup:", error.message);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await cleanupData();
  await mongoose.connection.close();
  console.log("🔌 Database connection closed");
  process.exit(0);
};

main();
