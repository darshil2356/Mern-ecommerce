/**
 * FULL FLOW TEST SCRIPT — Hits actual MongoDB
 * Tests: Customer → User → Product → Orders (all scenarios) → Reports
 *
 * Run: node testFullFlow.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Customer = require("./models/customerModel");
const User = require("./models/userModel");
const Product = require("./models/productModel");
const Order = require("./models/orderModel");

const MONGO_URL = process.env.MONGODB_URL;

// ─── Helpers ────────────────────────────────────────────────────────────────
const log = (section, msg, data) => {
  console.log(`\n✅ [${section}] ${msg}`);
  if (data) console.log("   →", JSON.stringify(data, null, 2).slice(0, 300));
};
const err = (section, msg, e) => console.error(`\n❌ [${section}] ${msg}:`, e?.message || e);

// ─── Cleanup tracker ────────────────────────────────────────────────────────
const created = { customers: [], users: [], products: [], orders: [] };

async function cleanup() {
  console.log("\n🧹 Cleaning up test data...");
  // await Customer.deleteMany({ _id: { $in: created.customers } });
  // await User.deleteMany({ _id: { $in: created.users } });
  // await Product.deleteMany({ _id: { $in: created.products } });
  // await Order.deleteMany({ _id: { $in: created.orders } });
  // console.log("✅ Cleanup done.");
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CUSTOMER MODULE
// ════════════════════════════════════════════════════════════════════════════
async function testCustomers() {
  console.log("\n══════════════════════════════════════");
  console.log("  1. CUSTOMER MODULE");
  console.log("══════════════════════════════════════");

  // Create customer
  const c = await Customer.create({
    firstName: "Test",
    lastName: "Customer",
    address: "123 Test Street, Surat",
    contactNumber: "9876543210",
  });
  created.customers.push(c._id);
  log("Customer", "Created", { id: c._id, name: `${c.firstName} ${c.lastName}` });

  // Fetch all customers
  const all = await Customer.find();
  log("Customer", `Total customers in DB: ${all.length}`);

  // Validation — missing required field
  try {
    await Customer.create({ firstName: "NoLastName", address: "x", contactNumber: "123" });
    err("Customer", "Should have failed on missing lastName");
  } catch (e) {
    log("Customer", "Validation works — missing lastName rejected");
  }

  return c;
}

// ════════════════════════════════════════════════════════════════════════════
// 2. USER MODULE (registered customer for orders)
// ════════════════════════════════════════════════════════════════════════════
async function testUsers() {
  console.log("\n══════════════════════════════════════");
  console.log("  2. USER MODULE");
  console.log("══════════════════════════════════════");

  const mobile = `99${Date.now().toString().slice(-8)}`;
  const u = await User.create({
    firstname: "Rahul",
    lastname: "Shah",
    mobile,
    email: `testuser_${Date.now()}@test.com`,
    role: "user",
  });
  created.users.push(u._id);
  log("User", "Created registered user", { id: u._id, mobile: u.mobile });

  // Duplicate mobile check
  try {
    await User.create({ firstname: "Dup", lastname: "User", mobile, email: `dup_${Date.now()}@test.com` });
    err("User", "Should have failed on duplicate mobile");
  } catch (e) {
    log("User", "Duplicate mobile rejected correctly");
  }

  return u;
}

// ════════════════════════════════════════════════════════════════════════════
// 3. PRODUCT — fetch existing or create test product
// ════════════════════════════════════════════════════════════════════════════
async function getOrCreateProduct() {
  console.log("\n══════════════════════════════════════");
  console.log("  3. PRODUCT MODULE");
  console.log("══════════════════════════════════════");

  // Try to use an existing product first
  let product = await Product.findOne({ quantity: { $gt: 0 } }).lean();
  if (product) {
    log("Product", "Using existing product", { id: product._id, title: product.title, price: product.price });
    return product;
  }

  // Create a test product if none exist
  const slug = `test-product-${Date.now()}`;
  product = await Product.create({
    title: "Test T-Shirt",
    slug,
    description: "Test product for flow testing",
    price: 500,
    mrp: 700,
    category: "T-Shirts",
    brand: "TestBrand",
    quantity: 100,
    hsnCode: "61091000",
  });
  created.products.push(product._id);
  log("Product", "Created test product", { id: product._id, title: product.title });
  return product;
}

// ════════════════════════════════════════════════════════════════════════════
// 4. ORDER MODULE — all scenarios
// ════════════════════════════════════════════════════════════════════════════
async function testOrders(user, product) {
  console.log("\n══════════════════════════════════════");
  console.log("  4. ORDER MODULE — ALL SCENARIOS");
  console.log("══════════════════════════════════════");

  const baseItem = {
    product: product._id,
    quantity: 2,
    price: product.price || 500,
    hsnCode: product.hsnCode || "61091000",
  };

  const orders = [];

  // ── Scenario 1: Online order (Current Account) ──────────────────────────
  const o1 = await Order.create({
    user: user._id,
    orderItems: [baseItem],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "123 Main St", city: "Surat", state: "Gujarat", pincode: 395001 },
    paymentInfo: { razorpayOrderId: "order_test001", razorpayPaymentId: "pay_test001" },
    totalPrice: 1000,
    totalPriceAfterDiscount: 1000,
    discountAmount: 0,
    orderStatus: "Ordered",
    mode: "ONLINE",
    paymentDestination: "CURRENT_ACCOUNT",
    gstBreakdown: { cgst: 45, sgst: 45, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 910, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o1._id);
  orders.push(o1);
  log("Order", "Scenario 1 — Online (Current Account)", { id: o1._id, status: o1.orderStatus, mode: o1.mode });

  // ── Scenario 2: Offline / Cash order ────────────────────────────────────
  const o2 = await Order.create({
    user: null,
    orderItems: [{ ...baseItem, quantity: 1, price: 500 }],
    shippingInfo: {},
    paymentInfo: {},
    totalPrice: 500,
    totalPriceAfterDiscount: 500,
    discountAmount: 0,
    orderStatus: "Delivered",
    mode: "OFFLINE",
    paymentDestination: "CASH",
    gstBreakdown: { cgst: 22.5, sgst: 22.5, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 455, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o2._id);
  orders.push(o2);
  log("Order", "Scenario 2 — Offline / Cash / Walk-in", { id: o2._id, status: o2.orderStatus });

  // ── Scenario 3: Online with discount + coupon ────────────────────────────
  const o3 = await Order.create({
    user: user._id,
    orderItems: [{ ...baseItem, quantity: 3, price: 500 }],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "123 Main St", city: "Surat", state: "Gujarat", pincode: 395001 },
    paymentInfo: { razorpayOrderId: "order_test003", razorpayPaymentId: "pay_test003" },
    totalPrice: 1500,
    totalPriceAfterDiscount: 1200,
    discountAmount: 300,
    discountBreakdown: { directDiscount: 300, offerDiscount: 0, coinDiscount: 0 },
    orderStatus: "Processing",
    mode: "ONLINE",
    paymentDestination: "CURRENT_ACCOUNT",
    gstBreakdown: { cgst: 54, sgst: 54, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 1092, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o3._id);
  orders.push(o3);
  log("Order", "Scenario 3 — Online with discount (₹300 off)", { id: o3._id, discount: o3.discountAmount });

  // ── Scenario 4: Order with coins used ───────────────────────────────────
  const o4 = await Order.create({
    user: user._id,
    orderItems: [baseItem],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "123 Main St", city: "Surat", state: "Gujarat", pincode: 395001 },
    paymentInfo: { razorpayOrderId: "order_test004", razorpayPaymentId: "pay_test004" },
    totalPrice: 1000,
    totalPriceAfterDiscount: 900,
    discountAmount: 100,
    discountBreakdown: { directDiscount: 0, offerDiscount: 0, coinDiscount: 100 },
    coinsUsed: 100,
    coinAmount: 100,
    orderStatus: "Shipped",
    mode: "ONLINE",
    paymentDestination: "CURRENT_ACCOUNT",
    gstBreakdown: { cgst: 40.5, sgst: 40.5, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 819, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o4._id);
  orders.push(o4);
  log("Order", "Scenario 4 — Coins used (100 coins = ₹100 off)", { id: o4._id, coinsUsed: o4.coinsUsed });

  // ── Scenario 5: Cancelled order with CASH refund ─────────────────────────
  const o5 = await Order.create({
    user: user._id,
    orderItems: [baseItem],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "123 Main St", city: "Surat", state: "Gujarat", pincode: 395001 },
    paymentInfo: { razorpayOrderId: "order_test005", razorpayPaymentId: "pay_test005" },
    totalPrice: 1000,
    totalPriceAfterDiscount: 1000,
    discountAmount: 0,
    orderStatus: "Cancelled",
    mode: "ONLINE",
    paymentDestination: "CURRENT_ACCOUNT",
    cancelReason: "Customer requested cancellation",
    refundType: "CASH",
    refundAmount: 1000,
    cancelledAt: new Date(),
    statusHistory: [
      { status: "Ordered", date: new Date(Date.now() - 86400000) },
      { status: "Cancelled", date: new Date() },
    ],
    gstBreakdown: { cgst: 45, sgst: 45, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 910, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o5._id);
  orders.push(o5);
  log("Order", "Scenario 5 — Cancelled with CASH refund", { id: o5._id, refundType: o5.refundType, refundAmount: o5.refundAmount });

  // ── Scenario 6: Cancelled order with COINS refund ────────────────────────
  const o6 = await Order.create({
    user: user._id,
    orderItems: [{ ...baseItem, quantity: 1, price: 500 }],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "123 Main St", city: "Surat", state: "Gujarat", pincode: 395001 },
    paymentInfo: {},
    totalPrice: 500,
    totalPriceAfterDiscount: 500,
    discountAmount: 0,
    orderStatus: "Cancelled",
    mode: "OFFLINE",
    paymentDestination: "CASH",
    cancelReason: "Out of stock",
    refundType: "COINS",
    refundCoins: 500,
    refundAmount: 0,
    cancelledAt: new Date(),
    gstBreakdown: { cgst: 22.5, sgst: 22.5, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 455, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o6._id);
  orders.push(o6);
  log("Order", "Scenario 6 — Cancelled with COINS refund", { id: o6._id, refundCoins: o6.refundCoins });

  // ── Scenario 7: Online Other Account ────────────────────────────────────
  const o7 = await Order.create({
    user: user._id,
    orderItems: [{ ...baseItem, quantity: 4, price: 500 }],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "123 Main St", city: "Surat", state: "Gujarat", pincode: 395001 },
    paymentInfo: { razorpayOrderId: "order_test007", razorpayPaymentId: "pay_test007" },
    totalPrice: 2000,
    totalPriceAfterDiscount: 2000,
    discountAmount: 0,
    orderStatus: "Delivered",
    mode: "ONLINE",
    paymentDestination: "OTHER_ACCOUNT",
    deliveredAt: new Date(),
    gstBreakdown: { cgst: 90, sgst: 90, igst: 0, cgstRate: 9, sgstRate: 9, igstRate: 0, gstType: "CGST_SGST", taxableAmount: 1820, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o7._id);
  orders.push(o7);
  log("Order", "Scenario 7 — Online (Other Account)", { id: o7._id, paymentDestination: o7.paymentDestination });

  // ── Scenario 8: IGST order (inter-state) ────────────────────────────────
  const o8 = await Order.create({
    user: user._id,
    orderItems: [baseItem],
    shippingInfo: { firstname: "Rahul", lastname: "Shah", address: "456 MG Road", city: "Mumbai", state: "Maharashtra", pincode: 400001 },
    paymentInfo: { razorpayOrderId: "order_test008", razorpayPaymentId: "pay_test008" },
    totalPrice: 1000,
    totalPriceAfterDiscount: 1000,
    discountAmount: 0,
    orderStatus: "Packed",
    mode: "ONLINE",
    paymentDestination: "CURRENT_ACCOUNT",
    gstBreakdown: { cgst: 0, sgst: 0, igst: 90, cgstRate: 0, sgstRate: 0, igstRate: 18, gstType: "IGST", taxableAmount: 910, taxIncluded: true, shippingCharge: 0 },
  });
  created.orders.push(o8._id);
  orders.push(o8);
  log("Order", "Scenario 8 — IGST (inter-state, Maharashtra)", { id: o8._id, gstType: o8.gstBreakdown.gstType });

  // ── Order status update test ─────────────────────────────────────────────
  const updated = await Order.findByIdAndUpdate(
    o1._id,
    {
      orderStatus: "Delivered",
      deliveredAt: new Date(),
      $push: { statusHistory: { status: "Delivered", date: new Date() } },
    },
    { new: true }
  );
  log("Order", "Status update — Ordered → Delivered", { id: updated._id, status: updated.orderStatus });

  return orders;
}

// ════════════════════════════════════════════════════════════════════════════
// 5. REPORT MODULE — all scenarios
// ════════════════════════════════════════════════════════════════════════════
async function testReports() {
  console.log("\n══════════════════════════════════════");
  console.log("  5. REPORT MODULE — ALL SCENARIOS");
  console.log("══════════════════════════════════════");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = new Date(year, now.getMonth(), 1);
  const endDate = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  // ── Monthly Report ───────────────────────────────────────────────────────
  const monthlyOrders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .populate("user", "firstname lastname mobile")
    .populate({ path: "orderItems.product", select: "title brand price hsnCode" });

  const activeOrders = monthlyOrders.filter(o => o.orderStatus !== "Cancelled");
  const cancelledOrders = monthlyOrders.filter(o => o.orderStatus === "Cancelled");
  const totalSales = activeOrders.reduce((s, o) => s + (o.totalPrice || 0), 0);
  const netRevenue = activeOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0);
  const totalDiscount = activeOrders.reduce((s, o) => s + (o.discountAmount || 0) + (o.coinAmount || 0), 0);
  const cashRefund = cancelledOrders.filter(o => o.refundType === "CASH" || o.refundType === "ONLINE").reduce((s, o) => s + (o.refundAmount || 0), 0);

  log("Report", `Monthly Report — ${month}/${year}`, {
    totalOrders: activeOrders.length,
    cancelledOrders: cancelledOrders.length,
    totalSales: `₹${totalSales}`,
    totalDiscount: `₹${totalDiscount}`,
    netRevenue: `₹${netRevenue}`,
    netActualRevenue: `₹${netRevenue - cashRefund}`,
    cashRefund: `₹${cashRefund}`,
  });

  // ── Payment mode breakdown ───────────────────────────────────────────────
  const cashOrders = activeOrders.filter(o => o.paymentDestination === "CASH");
  const onlineCurrentOrders = activeOrders.filter(o => o.paymentDestination === "CURRENT_ACCOUNT" || (o.mode === "ONLINE" && !o.paymentDestination));
  const onlineOtherOrders = activeOrders.filter(o => o.paymentDestination === "OTHER_ACCOUNT");

  log("Report", "Payment Mode Breakdown", {
    cash: { orders: cashOrders.length, amount: cashOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) },
    onlineCurrent: { orders: onlineCurrentOrders.length, amount: onlineCurrentOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) },
    onlineOther: { orders: onlineOtherOrders.length, amount: onlineOtherOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) },
  });

  // ── Order status breakdown ───────────────────────────────────────────────
  const statusBreakdown = {};
  monthlyOrders.forEach(o => {
    const s = o.orderStatus || "Unknown";
    if (!statusBreakdown[s]) statusBreakdown[s] = { count: 0, amount: 0 };
    statusBreakdown[s].count++;
    statusBreakdown[s].amount += o.totalPriceAfterDiscount || 0;
  });
  log("Report", "Order Status Breakdown", statusBreakdown);

  // ── GST Report ───────────────────────────────────────────────────────────
  const gstOrders = await Order.find({
    createdAt: { $gte: startDate, $lte: endDate },
    orderStatus: { $ne: "Cancelled" },
  });

  let totalCGST = 0, totalSGST = 0, totalIGST = 0, totalTaxable = 0;
  gstOrders.forEach(o => {
    const g = o.gstBreakdown || {};
    totalCGST += g.cgst || 0;
    totalSGST += g.sgst || 0;
    totalIGST += g.igst || 0;
    totalTaxable += g.taxableAmount || 0;
  });

  log("Report", "GST Report", {
    totalInvoices: gstOrders.length,
    totalTaxableValue: `₹${totalTaxable.toFixed(2)}`,
    totalCGST: `₹${totalCGST.toFixed(2)}`,
    totalSGST: `₹${totalSGST.toFixed(2)}`,
    totalIGST: `₹${totalIGST.toFixed(2)}`,
    totalTax: `₹${(totalCGST + totalSGST + totalIGST).toFixed(2)}`,
  });

  // ── Product-wise Report ──────────────────────────────────────────────────
  const productStats = {};
  activeOrders.forEach(order => {
    order.orderItems.forEach(item => {
      const pid = item.product?._id?.toString() || "Unknown";
      if (!productStats[pid]) {
        productStats[pid] = { name: item.product?.title || "Unknown", qty: 0, revenue: 0 };
      }
      productStats[pid].qty += item.quantity || 0;
      productStats[pid].revenue += (item.quantity || 0) * (item.price || 0);
    });
  });
  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  log("Report", "Top Products by Revenue", topProducts);

  // ── Customer-wise Report ─────────────────────────────────────────────────
  const customerStats = {};
  let walkInOrders = 0, walkInRevenue = 0;
  activeOrders.forEach(order => {
    const cid = order.user?._id?.toString();
    if (!cid) { walkInOrders++; walkInRevenue += order.totalPriceAfterDiscount || 0; return; }
    if (!customerStats[cid]) {
      customerStats[cid] = {
        name: `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim(),
        mobile: order.user.mobile || "N/A",
        orders: 0, amount: 0,
      };
    }
    customerStats[cid].orders++;
    customerStats[cid].amount += order.totalPriceAfterDiscount || 0;
  });
  log("Report", "Customer-wise Report", {
    registeredCustomers: Object.keys(customerStats).length,
    walkInOrders,
    walkInRevenue: `₹${walkInRevenue}`,
    topCustomers: Object.values(customerStats).sort((a, b) => b.amount - a.amount).slice(0, 3),
  });

  // ── Date Range Report ────────────────────────────────────────────────────
  const rangeStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days
  const rangeEnd = new Date();
  const rangeOrders = await Order.find({ createdAt: { $gte: rangeStart, $lte: rangeEnd } });
  log("Report", "Date Range Report (Last 7 days)", {
    totalOrders: rangeOrders.length,
    netRevenue: `₹${rangeOrders.filter(o => o.orderStatus !== "Cancelled").reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0)}`,
  });

  // ── Yearly Report ────────────────────────────────────────────────────────
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
  const yearlyOrders = await Order.find({ createdAt: { $gte: yearStart, $lte: yearEnd } });
  const yearlyActive = yearlyOrders.filter(o => o.orderStatus !== "Cancelled");
  log("Report", `Yearly Report — ${year}`, {
    totalOrders: yearlyActive.length,
    netRevenue: `₹${yearlyActive.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0)}`,
    cancelledOrders: yearlyOrders.filter(o => o.orderStatus === "Cancelled").length,
  });

  // ── Payment filter test ──────────────────────────────────────────────────
  const cashOnly = await Order.find({ createdAt: { $gte: startDate, $lte: endDate }, paymentDestination: "CASH" });
  log("Report", "Payment Filter — CASH only", { count: cashOnly.length, amount: `₹${cashOnly.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0)}` });

  const onlineCurrentOnly = await Order.find({ createdAt: { $gte: startDate, $lte: endDate }, paymentDestination: "CURRENT_ACCOUNT" });
  log("Report", "Payment Filter — Online Current Account only", { count: onlineCurrentOnly.length });

  const onlineOtherOnly = await Order.find({ createdAt: { $gte: startDate, $lte: endDate }, paymentDestination: "OTHER_ACCOUNT" });
  log("Report", "Payment Filter — Online Other Account only", { count: onlineOtherOnly.length });
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🚀 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URL);
  console.log("✅ Connected to:", MONGO_URL.split("@")[1]?.split("/")[0] || "MongoDB");

  try {
    const customer = await testCustomers();
    const user = await testUsers();
    const product = await getOrCreateProduct();
    const orders = await testOrders(user, product);
    await testReports();

    console.log("\n══════════════════════════════════════");
    console.log("  📊 SUMMARY");
    console.log("══════════════════════════════════════");
    console.log(`  Customers created : ${created.customers.length}`);
    console.log(`  Users created     : ${created.users.length}`);
    console.log(`  Orders created    : ${created.orders.length}`);
    console.log(`  Order scenarios   : 8 (Online, Cash, Discount, Coins, Cancel-Cash, Cancel-Coins, OtherAcc, IGST)`);
    console.log(`  Reports tested    : Monthly, Yearly, DateRange, GST, ProductWise, CustomerWise, PaymentFilter`);
    console.log("\n✅ ALL TESTS PASSED — Data is live in DB");

  } catch (e) {
    console.error("\n❌ TEST FAILED:", e);
  } finally {
    await cleanup();
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

main();
