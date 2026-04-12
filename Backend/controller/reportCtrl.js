const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const buildPaymentFilter = (query) => {
  const paymentFilter = (query.paymentFilter || "all").toString().toLowerCase();
  switch (paymentFilter) {
    case "cash":
      return { paymentDestination: "CASH" };
    case "online_current":
      return {
        $and: [
          { mode: "ONLINE" },
          {
            $or: [
              { paymentDestination: "CURRENT_ACCOUNT" },
              { paymentDestination: { $exists: false } }
            ]
          }
        ]
      };
    case "online_other":
      return { mode: "ONLINE", paymentDestination: "OTHER_ACCOUNT" };
    default:
      return {};
  }
};

// Get comprehensive monthly report for CA
const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .where(buildPaymentFilter(req.query))
    .populate("user", "firstname lastname mobile email")
    .populate({ path: "orderItems.product", select: "title brand price barcode hsnCode" });

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const netRevenue = orders.reduce((sum, o) => sum + (o.totalPriceAfterDiscount || 0), 0);

  const onlineOrders = orders.filter(o => o.mode === "ONLINE");
  const offlineOrders = orders.filter(o => o.mode === "OFFLINE");

  const statusBreakdown = {};
  orders.forEach(order => {
    const status = order.orderStatus || "Unknown";
    if (!statusBreakdown[status]) statusBreakdown[status] = { count: 0, amount: 0 };
    statusBreakdown[status].count += 1;
    statusBreakdown[status].amount += order.totalPriceAfterDiscount || 0;
  });

  const productStats = {};
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const productId = item.product?._id?.toString() || "Unknown";
      if (!productStats[productId]) {
        productStats[productId] = { name: item.product?.title || "Unknown Product", brand: item.product?.brand || "", hsnCode: item.product?.hsnCode || item.hsnCode || "", quantity: 0, revenue: 0 };
      }
      productStats[productId].quantity += item.quantity || 0;
      productStats[productId].revenue += (item.quantity || 0) * (item.price || 0);
    });
  });
  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const customerStats = {};
  orders.forEach(order => {
    const customerId = order.user?._id?.toString() || "Walk-in";
    const customerName = order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer";
    if (!customerStats[customerId]) {
      customerStats[customerId] = { name: customerName, mobile: order.user?.mobile || "N/A", orders: 0, amount: 0 };
    }
    customerStats[customerId].orders += 1;
    customerStats[customerId].amount += order.totalPriceAfterDiscount || 0;
  });
  const topCustomers = Object.values(customerStats).sort((a, b) => b.amount - a.amount).slice(0, 10);

  const dailyBreakdown = {};
  orders.forEach(order => {
    const day = new Date(order.createdAt).getDate();
    if (!dailyBreakdown[day]) dailyBreakdown[day] = { orders: 0, amount: 0 };
    dailyBreakdown[day].orders += 1;
    dailyBreakdown[day].amount += order.totalPriceAfterDiscount || 0;
  });
  const dailyData = Object.entries(dailyBreakdown).map(([day, data]) => ({ day: parseInt(day), ...data })).sort((a, b) => a.day - b.day);

  res.json({
    success: true,
    reportPeriod: { month: monthNames[targetMonth], year: targetYear, startDate, endDate },
    summary: { totalOrders, totalSales, totalDiscount, netRevenue, averageOrderValue: totalOrders > 0 ? netRevenue / totalOrders : 0 },
    modeBreakdown: {
      online: { orders: onlineOrders.length, amount: onlineOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) },
      offline: { orders: offlineOrders.length, amount: offlineOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) }
    },
    statusBreakdown, topProducts, topCustomers, dailyData,
    orders: orders.map(order => ({
      _id: order._id,
      orderId: order._id.toString().slice(-8).toUpperCase(),
      user: order.user,
      orderItems: order.orderItems,
      customer: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer",
      customerMobile: order.user?.mobile || "N/A",
      items: order.orderItems.length,
      totalAmount: order.totalPrice,
      discount: order.discountAmount || 0,
      netAmount: order.totalPriceAfterDiscount,
      gstBreakdown: order.gstBreakdown || null,
      mode: order.mode,
      status: order.orderStatus,
      createdAt: order.createdAt
    }))
  });
});

// Get yearly report
const getYearlyReport = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const currentDate = new Date();
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();
  const startDate = new Date(targetYear, 0, 1);
  const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999);

  const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .where(buildPaymentFilter(req.query))
    .populate("user", "firstname lastname mobile email")
    .populate({ path: "orderItems.product", select: "title brand price barcode hsnCode" });

  const monthlyData = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate }, ...buildPaymentFilter(req.query) } },
    { $group: { _id: { $month: "$createdAt" }, totalOrders: { $sum: 1 }, totalSales: { $sum: "$totalPrice" }, totalDiscount: { $sum: "$discountAmount" }, netRevenue: { $sum: "$totalPriceAfterDiscount" } } },
    { $sort: { _id: 1 } }
  ]);

  const monthlyBreakdown = monthNames.map((name, index) => {
    const monthData = monthlyData.find(m => m._id === index + 1);
    return { month: name, orders: monthData?.totalOrders || 0, sales: monthData?.totalSales || 0, discount: monthData?.totalDiscount || 0, revenue: monthData?.netRevenue || 0 };
  });

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const netRevenue = orders.reduce((sum, o) => sum + (o.totalPriceAfterDiscount || 0), 0);
  const onlineOrders = orders.filter(o => o.mode === "ONLINE");
  const offlineOrders = orders.filter(o => o.mode === "OFFLINE");

  const statusBreakdown = {};
  orders.forEach(order => {
    const status = order.orderStatus || "Unknown";
    if (!statusBreakdown[status]) statusBreakdown[status] = { count: 0, amount: 0 };
    statusBreakdown[status].count += 1;
    statusBreakdown[status].amount += order.totalPriceAfterDiscount || 0;
  });

  res.json({
    success: true,
    reportPeriod: { year: targetYear, startDate, endDate },
    summary: { totalOrders, totalSales, totalDiscount, netRevenue, averageOrderValue: totalOrders > 0 ? netRevenue / totalOrders : 0 },
    monthlyBreakdown,
    modeBreakdown: {
      online: { orders: onlineOrders.length, amount: onlineOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) },
      offline: { orders: offlineOrders.length, amount: offlineOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) }
    },
    statusBreakdown,
    orders: orders.map(order => ({
      _id: order._id,
      orderId: order._id.toString().slice(-8).toUpperCase(),
      user: order.user,
      orderItems: order.orderItems,
      paymentInfo: order.paymentInfo,
      customer: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer",
      customerMobile: order.user?.mobile || "N/A",
      items: order.orderItems.length,
      totalAmount: order.totalPrice,
      discount: order.discountAmount || 0,
      netAmount: order.totalPriceAfterDiscount,
      gstBreakdown: order.gstBreakdown || null,
      mode: order.mode,
      status: order.orderStatus,
      createdAt: order.createdAt
    }))
  });
});

// Get date range report
const getDateRangeReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) { res.status(400); throw new Error("Start date and end date are required"); }

  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(23, 59, 59, 999);

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .where(buildPaymentFilter(req.query))
    .populate("user", "firstname lastname mobile email")
    .populate({ path: "orderItems.product", select: "title brand price barcode hsnCode" });

  const totalOrders = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const netRevenue = orders.reduce((sum, o) => sum + (o.totalPriceAfterDiscount || 0), 0);
  const onlineOrders = orders.filter(o => o.mode === "ONLINE");
  const offlineOrders = orders.filter(o => o.mode === "OFFLINE");

  res.json({
    success: true,
    reportPeriod: { startDate: start, endDate: end },
    summary: { totalOrders, totalSales, totalDiscount, netRevenue, averageOrderValue: totalOrders > 0 ? netRevenue / totalOrders : 0 },
    modeBreakdown: {
      online: { orders: onlineOrders.length, amount: onlineOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) },
      offline: { orders: offlineOrders.length, amount: offlineOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0) }
    },
    orders: orders.map(order => ({
      _id: order._id,
      orderId: order._id.toString().slice(-8).toUpperCase(),
      user: order.user,
      orderItems: order.orderItems,
      paymentInfo: order.paymentInfo,
      customer: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer",
      customerMobile: order.user?.mobile || "N/A",
      items: order.orderItems.length,
      totalAmount: order.totalPrice,
      discount: order.discountAmount || 0,
      netAmount: order.totalPriceAfterDiscount,
      gstBreakdown: order.gstBreakdown || null,
      mode: order.mode,
      status: order.orderStatus,
      createdAt: order.createdAt
    }))
  });
});

// Get GST report — uses real gstBreakdown stored on each order
const getGSTReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) - 1 : currentDate.getMonth();
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const orders = await Order.find({ createdAt: { $gte: startDate, $lte: endDate } })
    .where(buildPaymentFilter(req.query))
    .populate("user", "firstname lastname gstin");

  let totalTaxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let totalInvoiceValue = 0;
  let cgstSgstOrders = 0;
  let igstOrders = 0;

  const invoiceData = orders.map(order => {
    const gst = order.gstBreakdown || {};
    const taxableValue = gst.taxableAmount || order.totalPrice || 0;
    const cgst = gst.cgst || 0;
    const sgst = gst.sgst || 0;
    const igst = gst.igst || 0;
    const totalTax = cgst + sgst + igst;
    const invoiceValue = taxableValue + totalTax - (order.discountAmount || 0);

    totalTaxableValue += taxableValue;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;
    totalInvoiceValue += order.totalPriceAfterDiscount || 0;

    if (gst.gstType === "CGST_SGST") cgstSgstOrders++;
    else if (gst.gstType === "IGST") igstOrders++;

    return {
      invoiceNumber: order._id.toString().slice(-8).toUpperCase(),
      invoiceDate: order.createdAt,
      customerName: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer",
      gstin: order.user?.gstin || "N/A",
      gstType: gst.gstType || "NONE",
      taxableValue: taxableValue.toFixed(2),
      cgstRate: gst.cgstRate || 0,
      cgst: cgst.toFixed(2),
      sgstRate: gst.sgstRate || 0,
      sgst: sgst.toFixed(2),
      igstRate: gst.igstRate || 0,
      igst: igst.toFixed(2),
      totalTax: totalTax.toFixed(2),
      invoiceValue: (order.totalPriceAfterDiscount || 0).toFixed(2)
    };
  });

  res.json({
    success: true,
    reportPeriod: { month: monthNames[targetMonth], year: targetYear, startDate, endDate },
    summary: {
      totalInvoices: orders.length,
      cgstSgstOrders,
      igstOrders,
      totalTaxableValue: totalTaxableValue.toFixed(2),
      totalCGST: totalCGST.toFixed(2),
      totalSGST: totalSGST.toFixed(2),
      totalIGST: totalIGST.toFixed(2),
      totalTax: (totalCGST + totalSGST + totalIGST).toFixed(2),
      totalInvoiceValue: totalInvoiceValue.toFixed(2)
    },
    invoices: invoiceData
  });
});

// Get product-wise sales report
const getProductWiseReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate); end = new Date(endDate); end.setHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .where(buildPaymentFilter(req.query))
    .populate({ path: "orderItems.product", select: "title brand price barcode category hsnCode" });

  const productStats = {};
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      const productId = item.product?._id?.toString() || "Unknown";
      if (!productStats[productId]) {
        productStats[productId] = { productId, name: item.product?.title || "Unknown", brand: item.product?.brand || "", hsnCode: item.product?.hsnCode || item.hsnCode || "", category: item.product?.category || "", barcode: item.product?.barcode || "", quantitySold: 0, totalRevenue: 0 };
      }
      const qty = item.quantity || 0;
      productStats[productId].quantitySold += qty;
      productStats[productId].totalRevenue += qty * (item.price || 0);
    });
  });

  const sortedProducts = Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  sortedProducts.forEach(p => { p.avgPrice = p.quantitySold > 0 ? p.totalRevenue / p.quantitySold : 0; });

  res.json({
    success: true,
    reportPeriod: { startDate: start, endDate: end },
    totalProducts: sortedProducts.length,
    products: sortedProducts.map(p => ({ ...p, totalRevenue: p.totalRevenue.toFixed(2), avgPrice: p.avgPrice.toFixed(2) }))
  });
});

// Get customer-wise sales report
const getCustomerWiseReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  let start, end;
  if (startDate && endDate) {
    start = new Date(startDate); end = new Date(endDate); end.setHours(23, 59, 59, 999);
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
    .where(buildPaymentFilter(req.query))
    .populate("user", "firstname lastname mobile email createdAt");

  const customerStats = {};
  let walkInOrders = 0, walkInRevenue = 0;

  orders.forEach(order => {
    const customerId = order.user?._id?.toString();
    if (!customerId) { walkInOrders++; walkInRevenue += order.totalPriceAfterDiscount || 0; return; }
    if (!customerStats[customerId]) {
      customerStats[customerId] = {
        customerId,
        name: `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim(),
        mobile: order.user.mobile || "",
        email: order.user.email || "",
        totalOrders: 0, totalPurchase: 0, avgOrderValue: 0,
        firstPurchase: order.user.createdAt, lastPurchase: order.createdAt
      };
    }
    customerStats[customerId].totalOrders++;
    customerStats[customerId].totalPurchase += order.totalPriceAfterDiscount || 0;
    if (new Date(order.createdAt) > new Date(customerStats[customerId].lastPurchase)) {
      customerStats[customerId].lastPurchase = order.createdAt;
    }
  });

  const sortedCustomers = Object.values(customerStats).sort((a, b) => b.totalPurchase - a.totalPurchase);
  sortedCustomers.forEach(c => { c.avgOrderValue = c.totalOrders > 0 ? c.totalPurchase / c.totalOrders : 0; });

  res.json({
    success: true,
    reportPeriod: { startDate: start, endDate: end },
    summary: {
      totalCustomers: sortedCustomers.length,
      walkInOrders, walkInRevenue: walkInRevenue.toFixed(2),
      totalRevenue: (sortedCustomers.reduce((sum, c) => sum + c.totalPurchase, 0) + walkInRevenue).toFixed(2)
    },
    customers: sortedCustomers.map(c => ({ ...c, totalPurchase: c.totalPurchase.toFixed(2), avgOrderValue: c.avgOrderValue.toFixed(2) }))
  });
});

module.exports = { getMonthlyReport, getYearlyReport, getDateRangeReport, getGSTReport, getProductWiseReport, getCustomerWiseReport };
