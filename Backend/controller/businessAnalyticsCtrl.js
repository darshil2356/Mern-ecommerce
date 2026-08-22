const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Helper to parse date filters
const parseDateRange = (filter, startDate, endDate) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "7days":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "30days":
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 12, 0, 23, 59, 59, 999);
      break;
    case "custom":
      if (startDate && endDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      break;
    default:
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }
  return { start, end };
};

// Main controller function for deep business analytics
const getBusinessAnalytics = asyncHandler(async (req, res) => {
  const {
    filter = "30days",
    startDate,
    endDate,
    category,
    subcategory,
    product,
    brand,
    size,
    customer,
    salesChannel,
    paymentType,
    search
  } = req.query;

  // 1. Resolve date range
  const { start, end } = parseDateRange(filter, startDate, endDate);
  const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  // 2. Build match filter for orders
  const matchStage = {
    orderStatus: { $ne: "Cancelled" },
    createdAt: { $gte: start, $lte: end }
  };

  if (salesChannel) {
    matchStage.mode = salesChannel;
  }

  if (paymentType) {
    matchStage.paymentDestination = paymentType;
  }

  if (customer) {
    try {
      matchStage.user = new mongoose.Types.ObjectId(customer);
    } catch (e) {
      // ignore invalid objectId
    }
  }

  // 3. Build aggregation pipeline
  const pipeline = [
    { $match: matchStage },
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } }
  ];

  // 4. Match sub-fields based on filters
  const subMatch = {};
  if (category) {
    subMatch["productInfo.category"] = category;
  }
  if (subcategory) {
    subMatch["productInfo.subcategory"] = subcategory;
  }
  if (brand) {
    subMatch["productInfo.brand"] = brand;
  }
  if (product) {
    try {
      subMatch["productInfo._id"] = new mongoose.Types.ObjectId(product);
    } catch (e) {}
  }
  if (size) {
    subMatch["orderItems.size"] = size;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    subMatch.$or = [
      { "productInfo.title": searchRegex },
      { "productInfo.category": searchRegex },
      { "shippingInfo.firstname": searchRegex },
      { "shippingInfo.lastname": searchRegex },
      { "shippingInfo.phone": searchRegex }
    ];
  }

  if (Object.keys(subMatch).length > 0) {
    pipeline.push({ $match: subMatch });
  }

  // Project necessary fields to minimize memory overhead
  pipeline.push({
    $project: {
      _id: 1,
      user: 1,
      createdAt: 1,
      totalPrice: 1,
      totalPriceAfterDiscount: 1,
      mode: 1,
      paymentDestination: 1,
      shippingInfo: 1,
      quantity: "$orderItems.quantity",
      price: "$orderItems.price",
      product: {
        _id: "$productInfo._id",
        title: "$productInfo.title",
        category: "$productInfo.category",
        subcategory: "$productInfo.subcategory",
        brand: "$productInfo.brand",
        purchasePrice: "$productInfo.purchasePrice",
        quantity: "$productInfo.quantity",
        min_stock_alert: "$productInfo.min_stock_alert"
      },
      size: "$orderItems.size",
      color: "$orderItems.color"
    }
  });

  // Run the aggregation query
  const items = await Order.aggregate(pipeline);

  // Helper to extract customer identifier from item row
  const getCustomerId = (row) => {
    if (row.user) return row.user.toString();
    if (row.shippingInfo && row.shippingInfo.phone) return row.shippingInfo.phone;
    if (row.shippingInfo && row.shippingInfo.firstname) {
      return `${row.shippingInfo.firstname}_${row.shippingInfo.lastname || ""}`;
    }
    return `guest_${row._id.toString()}`;
  };

  // 5. Compute Calculations in memory (super fast and flexible)
  let totalSales = 0;
  let totalPurchaseCost = 0;
  let totalUnitsSold = 0;
  const uniqueOrderIds = new Set();
  const customerOrdersMap = {}; // customerId -> Set of orderIds
  const customerDatesMap = {}; // customerId -> Array of Dates
  const customerSpendingMap = {}; // customerId -> net revenue
  const customerProfitMap = {}; // customerId -> profit

  // Category maps
  const categoriesMap = {}; // name -> { orders: Set, units: 0, revenue: 0, cost: 0, customers: Set, repeatCustomers: Set, customerPurchases: { custId: Array of dates } }
  
  // Product maps
  const productsMap = {}; // id -> { title, category, units: 0, orders: Set, revenue: 0, cost: 0, stock, min_stock_alert, customers: Set, customerPurchases: { custId: Array of dates } }

  // Trend maps
  const dailyTrends = {}; // YYYY-MM-DD -> { orders: Set, units: 0, revenue: 0, profit: 0 }
  const monthlyTrends = {}; // YYYY-MM -> { orders: Set, units: 0, revenue: 0, profit: 0 }

  items.forEach(item => {
    const qty = Number(item.quantity || 0);
    const sellingPrice = Number(item.price || 0);
    
    // Distribute discount proportionally
    const orderTotal = Number(item.totalPrice || 1);
    const discountRatio = Number(item.totalPriceAfterDiscount || item.totalPrice || 0) / orderTotal;
    
    const itemRevenue = sellingPrice * qty * discountRatio;
    const itemCost = Number(item.product?.purchasePrice || 0) * qty;
    const itemProfit = itemRevenue - itemCost;

    totalSales += itemRevenue;
    totalPurchaseCost += itemCost;
    totalUnitsSold += qty;
    
    uniqueOrderIds.add(item._id.toString());
    
    const custId = getCustomerId(item);
    if (!customerOrdersMap[custId]) {
      customerOrdersMap[custId] = new Set();
      customerDatesMap[custId] = [];
      customerSpendingMap[custId] = 0;
      customerProfitMap[custId] = 0;
    }
    customerOrdersMap[custId].add(item._id.toString());
    customerDatesMap[custId].push(new Date(item.createdAt));
    customerSpendingMap[custId] += itemRevenue;
    customerProfitMap[custId] += itemProfit;

    // Daily & Monthly Trends
    const dateObj = new Date(item.createdAt);
    const dayKey = dateObj.toISOString().split("T")[0];
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

    if (!dailyTrends[dayKey]) dailyTrends[dayKey] = { orders: new Set(), units: 0, revenue: 0, profit: 0 };
    dailyTrends[dayKey].orders.add(item._id.toString());
    dailyTrends[dayKey].units += qty;
    dailyTrends[dayKey].revenue += itemRevenue;
    dailyTrends[dayKey].profit += itemProfit;

    if (!monthlyTrends[monthKey]) monthlyTrends[monthKey] = { orders: new Set(), units: 0, revenue: 0, profit: 0 };
    monthlyTrends[monthKey].orders.add(item._id.toString());
    monthlyTrends[monthKey].units += qty;
    monthlyTrends[monthKey].revenue += itemRevenue;
    monthlyTrends[monthKey].profit += itemProfit;

    // Category processing
    const catName = item.product?.category || "Uncategorized";
    if (!categoriesMap[catName]) {
      categoriesMap[catName] = {
        name: catName,
        orders: new Set(),
        units: 0,
        revenue: 0,
        cost: 0,
        customersMap: {} // custId -> Array of dates
      };
    }
    categoriesMap[catName].orders.add(item._id.toString());
    categoriesMap[catName].units += qty;
    categoriesMap[catName].revenue += itemRevenue;
    categoriesMap[catName].cost += itemCost;
    if (!categoriesMap[catName].customersMap[custId]) {
      categoriesMap[catName].customersMap[custId] = [];
    }
    categoriesMap[catName].customersMap[custId].push(new Date(item.createdAt));

    // Product processing
    if (item.product && item.product._id) {
      const prodId = item.product._id.toString();
      if (!productsMap[prodId]) {
        productsMap[prodId] = {
          productId: prodId,
          title: item.product.title,
          category: catName,
          units: 0,
          orders: new Set(),
          revenue: 0,
          cost: 0,
          stock: item.product.quantity || 0,
          min_stock_alert: item.product.min_stock_alert || 5,
          customersMap: {} // custId -> Array of dates
        };
      }
      productsMap[prodId].orders.add(item._id.toString());
      productsMap[prodId].units += qty;
      productsMap[prodId].revenue += itemRevenue;
      productsMap[prodId].cost += itemCost;
      if (!productsMap[prodId].customersMap[custId]) {
        productsMap[prodId].customersMap[custId] = [];
      }
      productsMap[prodId].customersMap[custId].push(new Date(item.createdAt));
    }
  });

  const totalOrders = uniqueOrderIds.size;
  const grossProfit = totalSales - totalPurchaseCost;
  const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
  const aov = totalOrders > 0 ? totalSales / totalOrders : 0;
  const avgProfitPerOrder = totalOrders > 0 ? grossProfit / totalOrders : 0;

  // Calculate repeat customers (customers with >1 order in this period)
  let repeatCustomersCount = 0;
  let totalCustomersCount = 0;
  let revenueFromRepeatCustomers = 0;
  let profitFromRepeatCustomers = 0;

  for (const custId in customerOrdersMap) {
    totalCustomersCount++;
    if (customerOrdersMap[custId].size > 1) {
      repeatCustomersCount++;
      revenueFromRepeatCustomers += customerSpendingMap[custId];
      profitFromRepeatCustomers += customerProfitMap[custId];
    }
  }

  // Helper for computing days between dates
  const computeAvgDays = (datesArrayMap) => {
    let totalDays = 0;
    let gapCount = 0;
    for (const custId in datesArrayMap) {
      const dates = datesArrayMap[custId].sort((a, b) => a - b);
      if (dates.length > 1) {
        for (let i = 1; i < dates.length; i++) {
          totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
          gapCount++;
        }
      }
    }
    return gapCount > 0 ? Number((totalDays / gapCount).toFixed(1)) : 0;
  };

  // Form Category Analytics
  const categoryAnalytics = Object.values(categoriesMap).map(cat => {
    const revenue = cat.revenue;
    const cost = cat.cost;
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    
    // Repeat purchases in category
    let uniqueCusts = 0;
    let repeatCusts = 0;
    let repeatRev = 0;
    let repeatProf = 0;
    for (const cid in cat.customersMap) {
      uniqueCusts++;
      if (cat.customersMap[cid].length > 1) {
        repeatCusts++;
        // Sum of purchases in category for repeat customer
        // We can approximate or count transactions. Let's just track repeat purchases rate.
      }
    }
    
    const repeatRate = uniqueCusts > 0 ? (repeatCusts / uniqueCusts) * 100 : 0;
    const avgDays = computeAvgDays(cat.customersMap);

    return {
      category: cat.name,
      orders: cat.orders.size,
      unitsSold: cat.units,
      revenue: Number(revenue.toFixed(2)),
      purchaseCost: Number(cost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      profitMargin: Number(margin.toFixed(1)),
      repeatPurchaseRate: Number(repeatRate.toFixed(1)),
      uniqueCustomers: uniqueCusts,
      repeatCustomers: repeatCusts,
      avgDaysBetweenPurchases: avgDays,
      shareOfTotalSales: totalSales > 0 ? Number(((revenue / totalSales) * 100).toFixed(1)) : 0
    };
  });

  // Category Rankings
  const topCategoriesBySales = [...categoryAnalytics].sort((a, b) => b.revenue - a.revenue);
  const mostProfitableCategories = [...categoryAnalytics].sort((a, b) => b.profit - a.profit);
  const repeatPurchaseCategories = [...categoryAnalytics].sort((a, b) => b.repeatPurchaseRate - a.repeatPurchaseRate);

  // Form Product Analytics
  const productAnalytics = Object.values(productsMap).map(prod => {
    const revenue = prod.revenue;
    const cost = prod.cost;
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const profitPerUnit = prod.units > 0 ? profit / prod.units : 0;

    let uniqueBuyers = 0;
    let repeatBuyers = 0;
    let repeatRevenue = 0;
    let repeatProfit = 0;
    for (const cid in prod.customersMap) {
      uniqueBuyers++;
      if (prod.customersMap[cid].length > 1) {
        repeatBuyers++;
        // Compute revenue/profit from repeat buyers of this product
        const buyerQty = prod.customersMap[cid].length;
        const buyerRev = (revenue / prod.units) * buyerQty; // estimate
        const buyerCost = (cost / prod.units) * buyerQty;
        repeatRevenue += buyerRev;
        repeatProfit += (buyerRev - buyerCost);
      }
    }

    const repeatRate = uniqueBuyers > 0 ? (repeatBuyers / uniqueBuyers) * 100 : 0;

    return {
      productId: prod.productId,
      title: prod.title,
      category: prod.category,
      unitsSold: prod.units,
      orders: prod.orders.size,
      revenue: Number(revenue.toFixed(2)),
      purchaseCost: Number(cost.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      profitPerUnit: Number(profitPerUnit.toFixed(2)),
      profitMargin: Number(margin.toFixed(1)),
      repeatPurchases: repeatBuyers,
      repeatPurchaseRate: Number(repeatRate.toFixed(1)),
      uniqueBuyers,
      repeatRevenue: Number(repeatRevenue.toFixed(2)),
      repeatProfit: Number(repeatProfit.toFixed(2)),
      stock: prod.stock,
      min_stock_alert: prod.min_stock_alert
    };
  });

  // Product Rankings
  const mostDemandedProducts = [...productAnalytics].sort((a, b) => b.unitsSold - a.unitsSold);
  const bestEarningProducts = [...productAnalytics].sort((a, b) => b.profit - a.profit);
  const bestProfitMarginProducts = [...productAnalytics].sort((a, b) => b.profitMargin - a.profitMargin);
  const repeatPurchaseProducts = [...productAnalytics].sort((a, b) => b.repeatPurchaseRate - a.repeatPurchaseRate);

  // High Sales vs High Profit Matrix (2x2 Matrix)
  // Define thresholds using averages of the filtered set
  const avgUnitsSold = productAnalytics.length > 0
    ? productAnalytics.reduce((sum, p) => sum + p.unitsSold, 0) / productAnalytics.length
    : 0;
  const avgProfit = productAnalytics.length > 0
    ? productAnalytics.reduce((sum, p) => sum + p.profit, 0) / productAnalytics.length
    : 0;

  const businessMatrix = {
    bestProducts: [],       // High Sales + High Profit
    needPricingReview: [],  // High Sales + Low Profit
    needMarketing: [],      // Low Sales + High Profit
    stopRestocking: []      // Low Sales + Low Profit
  };

  productAnalytics.forEach(p => {
    const isHighSales = p.unitsSold >= avgUnitsSold;
    const isHighProfit = p.profit >= avgProfit;

    const summary = {
      productId: p.productId,
      title: p.title,
      unitsSold: p.unitsSold,
      profit: p.profit,
      profitMargin: p.profitMargin,
      stock: p.stock
    };

    if (isHighSales && isHighProfit) {
      businessMatrix.bestProducts.push(summary);
    } else if (isHighSales && !isHighProfit) {
      businessMatrix.needPricingReview.push(summary);
    } else if (!isHighSales && isHighProfit) {
      businessMatrix.needMarketing.push(summary);
    } else {
      businessMatrix.stopRestocking.push(summary);
    }
  });

  // Customer Retention Summary
  const customerRetention = {
    totalCustomers: totalCustomersCount,
    newCustomers: totalCustomersCount - repeatCustomersCount,
    returningCustomers: repeatCustomersCount,
    repeatCustomerPercentage: totalCustomersCount > 0 ? Number(((repeatCustomersCount / totalCustomersCount) * 100).toFixed(1)) : 0,
    averageOrdersPerCustomer: totalCustomersCount > 0 ? Number((totalOrders / totalCustomersCount).toFixed(1)) : 0,
    averageCustomerSpending: totalCustomersCount > 0 ? Number((totalSales / totalCustomersCount).toFixed(2)) : 0,
    revenueFromRepeatCustomers: Number(revenueFromRepeatCustomers.toFixed(2)),
    profitFromRepeatCustomers: Number(profitFromRepeatCustomers.toFixed(2))
  };

  // Inventory & Profit connection
  const inventoryProfitConnection = productAnalytics.map(p => {
    const avgDaily = Number((p.unitsSold / diffDays).toFixed(2));
    const estDays = avgDaily > 0 ? Math.ceil(p.stock / avgDaily) : 999;
    const restockRecommended = p.stock <= p.min_stock_alert && avgDaily > 0;

    return {
      productId: p.productId,
      title: p.title,
      stock: p.stock,
      unitsSold: p.unitsSold,
      avgDailySales: avgDaily,
      estimatedDaysRemaining: estDays === 999 ? "∞" : estDays,
      restockRecommended
    };
  });

  // Actionable Business Recommendations
  const recommendations = {
    increaseStock: [],
    increaseMarketing: [],
    reviewPrice: [],
    reduceStopStock: [],
    promote: []
  };

  productAnalytics.forEach(p => {
    // Increase Stock: High demand (unitsSold >= avgUnitsSold), low stock (stock <= min_stock_alert)
    if (p.unitsSold >= avgUnitsSold && p.stock <= p.min_stock_alert) {
      recommendations.increaseStock.push({ productId: p.productId, title: p.title, stock: p.stock, unitsSold: p.unitsSold });
    }
    // Increase Marketing: High profit margin (>= 40%), low sales (< avgUnitsSold)
    if (p.profitMargin >= 40 && p.unitsSold < avgUnitsSold && p.unitsSold > 0) {
      recommendations.increaseMarketing.push({ productId: p.productId, title: p.title, margin: p.profitMargin, unitsSold: p.unitsSold });
    }
    // Review Price: High sales (>= avgUnitsSold), low profit margin (< 15%)
    if (p.unitsSold >= avgUnitsSold && p.profitMargin < 15) {
      recommendations.reviewPrice.push({ productId: p.productId, title: p.title, unitsSold: p.unitsSold, margin: p.profitMargin });
    }
    // Reduce / Stop Stock: Low sales (< avgUnitsSold), low profit (< avgProfit), low repeat purchase rate (< 10%)
    if (p.unitsSold < avgUnitsSold && p.profit < avgProfit && p.repeatPurchaseRate < 10) {
      recommendations.reduceStopStock.push({ productId: p.productId, title: p.title, stock: p.stock, unitsSold: p.unitsSold });
    }
    // Promote: High profit (>= avgProfit), high repeat purchase rate (>= 20%)
    if (p.profit >= avgProfit && p.repeatPurchaseRate >= 20) {
      recommendations.promote.push({ productId: p.productId, title: p.title, profit: p.profit, repeatRate: p.repeatPurchaseRate });
    }
  });

  // Sales Trends (Daily & Monthly)
  const salesTrends = {
    daily: Object.entries(dailyTrends).map(([date, data]) => ({
      date,
      orders: data.orders.size,
      units: data.units,
      revenue: Number(data.revenue.toFixed(2)),
      profit: Number(data.profit.toFixed(2))
    })).sort((a, b) => a.date.localeCompare(b.date)),
    monthly: Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      orders: data.orders.size,
      units: data.units,
      revenue: Number(data.revenue.toFixed(2)),
      profit: Number(data.profit.toFixed(2))
    })).sort((a, b) => a.month.localeCompare(b.month))
  };

  // Automatically generated AI-Like Summary
  const generateBusinessSummary = () => {
    let summaryText = "";
    if (topCategoriesBySales.length > 0) {
      const topCat = topCategoriesBySales[0];
      summaryText += `${topCat.category} is your highest-selling category with ₹${topCat.revenue.toLocaleString("en-IN")} revenue and ₹${topCat.profit.toLocaleString("en-IN")} profit. `;
    }
    if (bestProfitMarginProducts.length > 0) {
      const topProdMargin = bestProfitMarginProducts[0];
      summaryText += `${topProdMargin.title} has the highest profit margin at ${topProdMargin.profitMargin}%. `;
    }
    if (customerRetention.repeatCustomerPercentage > 0) {
      summaryText += `${customerRetention.repeatCustomerPercentage}% of customers purchased more than once. `;
    }
    if (mostDemandedProducts.length > 0) {
      const demandProd = mostDemandedProducts[0];
      summaryText += `${demandProd.title} is the most demanded product with ${demandProd.unitsSold} units sold. `;
    }
    if (bestEarningProducts.length > 0) {
      const earnProd = bestEarningProducts[0];
      summaryText += `${earnProd.title} generates the highest total profit of ₹${earnProd.profit.toLocaleString("en-IN")}. `;
    }
    if (businessMatrix.needPricingReview.length > 0) {
      const prodName = businessMatrix.needPricingReview[0].title;
      summaryText += `${prodName} has high sales volume but comparatively low profit margin, so its pricing should be reviewed. `;
    }
    return summaryText.trim() || "No transaction data available for the selected filter period to generate a summary.";
  };

  res.json({
    success: true,
    filter,
    period: { start, end, diffDays },
    kpi: {
      totalSales: Number(totalSales.toFixed(2)),
      totalOrders,
      totalUnitsSold,
      totalPurchaseCost: Number(totalPurchaseCost.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
      aov: Number(aov.toFixed(2)),
      avgProfitPerOrder: Number(avgProfitPerOrder.toFixed(2)),
      repeatCustomersCount
    },
    categoryAnalytics,
    topCategoriesBySales: topCategoriesBySales.slice(0, 10),
    mostProfitableCategories: mostProfitableCategories.slice(0, 10),
    repeatPurchaseCategories,
    productAnalytics,
    mostDemandedProducts: mostDemandedProducts.slice(0, 20),
    bestEarningProducts: bestEarningProducts.slice(0, 20),
    bestProfitMarginProducts: bestProfitMarginProducts.slice(0, 20),
    repeatPurchaseProducts: repeatPurchaseProducts.slice(0, 20),
    businessMatrix,
    customerRetention,
    inventoryProfitConnection,
    recommendations,
    salesTrends,
    businessSummary: generateBusinessSummary()
  });
});

module.exports = {
  getBusinessAnalytics
};
