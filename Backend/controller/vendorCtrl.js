const Vendor = require("../models/vendorModel");
const Purchase = require("../models/purchaseModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const { autoHealPurchases } = require("./purchaseCtrl");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

const createVendor = asyncHandler(async (req, res) => {
  const vendor = await Vendor.create(req.body);
  res.json(vendor);
});

const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findByIdAndUpdate(id, req.body, { new: true });
  res.json(vendor);
});

const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findByIdAndDelete(id);
  res.json(vendor);
});

const getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });
  res.json(vendor);
});

const getAllVendors = asyncHandler(async (req, res) => {
  await autoHealPurchases();

  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.$or = [
    { name: { $regex: search, $options: "i" } },
    { firmName: { $regex: search, $options: "i" } },
    { phone: { $regex: search, $options: "i" } },
  ];

  const vendors = await Vendor.find(filter).sort({ name: 1 });

  // Attach purchase totals
  const vendorIds = vendors.map(v => v._id);
  const stats = await Purchase.aggregate([
    { $match: { vendor: { $in: vendorIds } } },
    {
      $group: {
        _id: "$vendor",
        totalPurchases: { $sum: "$totalAmount" },
        totalPaid: { $sum: "$paidAmount" },
        totalDue: { $sum: "$balanceDue" },
        billCount: { $sum: 1 },
      },
    },
  ]);

  const statsMap = {};
  stats.forEach(s => { statsMap[s._id.toString()] = s; });

  const result = vendors.map(v => {
    const s = statsMap[v._id.toString()] || {};
    return {
      ...v.toObject(),
      totalPurchases: s.totalPurchases || 0,
      totalPaid: s.totalPaid || 0,
      totalDue: s.totalDue || 0,
      billCount: s.billCount || 0,
    };
  });

  const grandTotal = {
    totalPurchases: result.reduce((a, v) => a + v.totalPurchases, 0),
    totalPaid: result.reduce((a, v) => a + v.totalPaid, 0),
    totalDue: result.reduce((a, v) => a + v.totalDue, 0),
  };

  res.json({ vendors: result, grandTotal });
});

const getVendorLedger = asyncHandler(async (req, res) => {
  await autoHealPurchases();

  const { id } = req.params;
  validateMongoDbId(id);

  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  const { startDate, endDate } = req.query;
  const filter = { vendor: id };
  if (startDate || endDate) {
    filter.billDate = {};
    if (startDate) filter.billDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.billDate.$lte = end;
    }
  }

  const purchases = await Purchase.find(filter).sort({ billDate: 1, createdAt: 1 });

  // Build ledger entries: each bill + each payment
  const entries = [];
  let balance = vendor.openingBalance || 0;

  if (vendor.openingBalance) {
    entries.push({
      date: vendor.createdAt,
      type: "OPENING",
      description: "Opening Balance",
      debit: vendor.openingBalance,
      credit: 0,
      balance,
      billNo: "",
    });
  }

  purchases.forEach(p => {
    // Bill entry (we owe vendor this amount)
    balance += p.totalAmount;
    entries.push({
      date: p.billDate,
      type: "BILL",
      description: `Purchase Bill${p.billNo ? " #" + p.billNo : ""}`,
      debit: p.totalAmount,
      credit: 0,
      balance,
      billNo: p.billNo,
      purchaseId: p._id,
      status: p.status,
    });

    // Payment / Settlement entries
    (p.payments || []).forEach(pay => {
      if (pay.amount > 0) {
        balance -= pay.amount;
        entries.push({
          date: pay.date,
          type: "PAYMENT",
          description: `Payment (${pay.mode})${pay.referenceNo ? " Ref: " + pay.referenceNo : ""}`,
          debit: 0,
          credit: pay.amount,
          balance,
          billNo: p.billNo,
          purchaseId: p._id,
          paymentMode: pay.mode,
        });
      }

      if (pay.discountAmount > 0) {
        balance -= pay.discountAmount;
        const discLabel = pay.discountType === "PERCENTAGE" ? `${pay.discountValue}% Discount` : `Flat ₹${pay.discountAmount} Discount`;
        entries.push({
          date: pay.date,
          type: "DISCOUNT",
          description: `Vendor Discount / Kasar (${discLabel})`,
          debit: 0,
          credit: pay.discountAmount,
          balance,
          billNo: p.billNo,
          purchaseId: p._id,
        });
      }

      if (pay.grAmount > 0) {
        balance -= pay.grAmount;
        entries.push({
          date: pay.date,
          type: "GR",
          description: `Goods Return (GR)${pay.grNote ? " - " + pay.grNote : ""}`,
          debit: 0,
          credit: pay.grAmount,
          balance,
          billNo: p.billNo,
          purchaseId: p._id,
        });
      }
    });
  });

  const totalDebit = entries.filter(e => e.type === "BILL").reduce((a, e) => a + e.debit, 0);
  const totalCredit = entries.filter(e => e.type === "PAYMENT" || e.type === "DISCOUNT" || e.type === "GR").reduce((a, e) => a + e.credit, 0);

  res.json({
    vendor,
    entries,
    summary: {
      totalPurchases: totalDebit,
      totalPaid: totalCredit,
      balanceDue: balance,
    },
  });
});

const getVendorDashboardStats = asyncHandler(async (req, res) => {
  await autoHealPurchases();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    vendorCounts,
    purchaseTotals,
    overdueBills,
    topVendorsByDue,
    topVendorsByPurchase,
    gstBreakdown,
    monthlyTrends
  ] = await Promise.all([
    // 1. Vendor counts
    Vendor.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    // 2. Purchase Grand Totals & Bill Statuses
    Purchase.aggregate([
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          totalTax: { $sum: "$totalTax" },
          totalTaxable: { $sum: "$taxableAmount" },
          totalBills: { $sum: 1 },
          paidBills: { $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] } },
          partialBills: { $sum: { $cond: [{ $eq: ["$status", "PARTIAL"] }, 1, 0] } },
          pendingBills: { $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] } },
        },
      },
    ]),

    // 3. Overdue (30+ Days) Bills with balanceDue > 0
    Purchase.find({
      balanceDue: { $gt: 0 },
      billDate: { $lte: thirtyDaysAgo },
    })
      .populate("vendor", "name firmName phone city gstin")
      .sort({ billDate: 1 }),

    // 4. Top Vendors by Balance Due
    Purchase.aggregate([
      { $match: { balanceDue: { $gt: 0 } } },
      {
        $group: {
          _id: "$vendor",
          totalDue: { $sum: "$balanceDue" },
          totalPurchases: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { totalDue: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    ]),

    // 5. Top Vendors by Total Purchases
    Purchase.aggregate([
      {
        $group: {
          _id: "$vendor",
          totalPurchases: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: 5 },
      {
        $lookup: { from: "vendors", localField: "_id", foreignField: "_id", as: "vendor" },
      },
      { $unwind: { path: "$vendor", preserveNullAndEmptyArrays: true } },
    ]),

    // 6. GST vs Non-GST Breakdown
    Purchase.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $in: ["$gstType", ["CGST_SGST", "IGST"]] },
              "GST",
              "NON_GST",
            ],
          },
          totalAmount: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
    ]),

    // 7. Monthly Trends (Last 6 Months)
    Purchase.aggregate([
      {
        $group: {
          _id: { year: { $year: "$billDate" }, month: { $month: "$billDate" } },
          totalAmount: { $sum: "$totalAmount" },
          paidAmount: { $sum: "$paidAmount" },
          balanceDue: { $sum: "$balanceDue" },
          billCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]),
  ]);

  // Process Vendor counts
  const totalVendors = vendorCounts.reduce((acc, v) => acc + v.count, 0);
  const activeVendors = (vendorCounts.find(v => v._id === "ACTIVE") || {}).count || 0;

  // Process Overdue Vendors
  const now = Date.now();
  const overdueVendorMap = {};

  overdueBills.forEach(b => {
    if (!b.vendor) return;
    const vId = b.vendor._id.toString();
    const daysOverdue = Math.floor((now - new Date(b.billDate).getTime()) / (1000 * 60 * 60 * 24));

    if (!overdueVendorMap[vId]) {
      overdueVendorMap[vId] = {
        vendor: b.vendor,
        overdueAmount: 0,
        overdueBillCount: 0,
        oldestBillDate: b.billDate,
        maxDaysOverdue: daysOverdue,
        bills: [],
      };
    }

    overdueVendorMap[vId].overdueAmount += b.balanceDue;
    overdueVendorMap[vId].overdueBillCount += 1;
    if (daysOverdue > overdueVendorMap[vId].maxDaysOverdue) {
      overdueVendorMap[vId].maxDaysOverdue = daysOverdue;
      overdueVendorMap[vId].oldestBillDate = b.billDate;
    }
    overdueVendorMap[vId].bills.push({
      _id: b._id,
      billNo: b.billNo,
      billDate: b.billDate,
      totalAmount: b.totalAmount,
      paidAmount: b.paidAmount,
      balanceDue: b.balanceDue,
      daysOverdue,
    });
  });

  const overdue30DaysVendors = Object.values(overdueVendorMap).sort(
    (a, b) => b.maxDaysOverdue - a.maxDaysOverdue
  );

  const totalOverdueAmount = overdue30DaysVendors.reduce((acc, v) => acc + v.overdueAmount, 0);

  res.json({
    summary: {
      totalVendors,
      activeVendors,
      ...(purchaseTotals[0] || {
        totalPurchases: 0,
        totalPaid: 0,
        totalDue: 0,
        totalTax: 0,
        totalTaxable: 0,
        totalBills: 0,
        paidBills: 0,
        partialBills: 0,
        pendingBills: 0,
      }),
      overdue30DaysBillCount: overdueBills.length,
      overdue30DaysVendorCount: overdue30DaysVendors.length,
      totalOverdueAmount,
    },
    overdue30DaysVendors,
    topVendorsByDue,
    topVendorsByPurchase,
    gstBreakdown,
    monthlyTrends,
  });
});

const getVendorAnalysis = asyncHandler(async (req, res) => {
  await autoHealPurchases();

  const { id } = req.params;
  validateMongoDbId(id);

  const vendor = await Vendor.findById(id);
  if (!vendor) return res.status(404).json({ message: "Vendor not found" });

  // 1. Vendor name search criteria
  const searchNames = [];
  if (vendor.name && vendor.name.trim()) searchNames.push(vendor.name.trim());
  if (vendor.firmName && vendor.firmName.trim()) searchNames.push(vendor.firmName.trim());

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexConditions = searchNames.map((n) => ({
    vendorName: { $regex: new RegExp("^" + escapeRegex(n) + "$", "i") },
  }));

  const productFilter = {
    $or: [
      { vendorName: { $in: [...searchNames, vendor._id.toString()] } },
      ...regexConditions,
    ],
  };

  // 2. Query products for this vendor
  const products = await Product.find(productFilter)
    .populate("categoryId", "title")
    .select("title slug price purchasePrice mrp quantity sold images category categoryId subcategory brand sku sizeStock variants vendorName createdAt");

  const productIds = products.map((p) => p._id);

  // 3. Aggregate non-cancelled sales orders for these products
  const orderSales = await Order.aggregate([
    { $match: { orderStatus: { $ne: "Cancelled" } } },
    { $unwind: "$orderItems" },
    { $match: { "orderItems.product": { $in: productIds } } },
    {
      $group: {
        _id: "$orderItems.product",
        totalQtySold: { $sum: "$orderItems.quantity" },
        totalRevenue: { $sum: { $multiply: ["$orderItems.quantity", "$orderItems.price"] } },
      },
    },
  ]);

  const salesMap = {};
  orderSales.forEach((s) => {
    if (s._id) salesMap[s._id.toString()] = s;
  });

  // 4. Calculate stock and sale stats
  let totalStockQty = 0;
  let totalStockCostValue = 0;
  let totalStockRetailValue = 0;

  let totalSoldQty = 0;
  let totalRealizedRevenue = 0;
  let totalSoldCostValue = 0;

  const productAnalysisList = products.map((p) => {
    let stockQty = Number(p.quantity || 0);
    if (p.variants && p.variants.length > 0) {
      const variantQty = p.variants.reduce(
        (sum, v) => sum + (v.sizeStock || []).reduce((q, s) => q + Number(s.quantity || 0), 0),
        0
      );
      if (variantQty > 0) stockQty = variantQty;
    } else if (p.sizeStock && p.sizeStock.length > 0) {
      const sizeQty = p.sizeStock.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
      if (sizeQty > 0) stockQty = sizeQty;
    }

    const sellingPrice = Number(p.price || 0);
    const costPrice = Number(p.purchasePrice !== null && p.purchasePrice !== undefined ? p.purchasePrice : sellingPrice);

    const stockCost = stockQty * costPrice;
    const stockRetail = stockQty * sellingPrice;
    const stockProfit = stockRetail - stockCost;

    const orderStat = salesMap[p._id.toString()] || {};
    const orderQtySold = orderStat.totalQtySold || 0;
    const orderRevenue = orderStat.totalRevenue || 0;

    const soldUnits = Math.max(Number(p.sold || 0), orderQtySold);
    const realizedRev = orderRevenue > 0 ? orderRevenue : soldUnits * sellingPrice;
    const soldCost = soldUnits * costPrice;
    const realizedProf = realizedRev - soldCost;

    totalStockQty += stockQty;
    totalStockCostValue += stockCost;
    totalStockRetailValue += stockRetail;

    totalSoldQty += soldUnits;
    totalRealizedRevenue += realizedRev;
    totalSoldCostValue += soldCost;

    const catName = p.categoryId?.title || p.category || p.subcategory || "-";

    return {
      _id: p._id,
      title: p.title,
      slug: p.slug,
      sku: p.sku || "-",
      category: catName,
      image: p.images?.[0]?.url || "",
      stockQty,
      soldQty: soldUnits,
      costPrice,
      sellingPrice,
      stockCostValue: Math.round(stockCost),
      stockRetailValue: Math.round(stockRetail),
      potentialProfit: Math.round(stockProfit),
      realizedRevenue: Math.round(realizedRev),
      realizedProfit: Math.round(realizedProf),
    };
  });

  const potentialProfitInHand = totalStockRetailValue - totalStockCostValue;
  const potentialMarginPercent =
    totalStockRetailValue > 0 ? (potentialProfitInHand / totalStockRetailValue) * 100 : 0;

  const realizedProfit = totalRealizedRevenue - totalSoldCostValue;
  const realizedMarginPercent =
    totalRealizedRevenue > 0 ? (realizedProfit / totalRealizedRevenue) * 100 : 0;

  // 5. Vendor purchases history & balance
  const purchases = await Purchase.find({ vendor: id }).sort({ billDate: -1 });

  const totalPurchasesFromVendor = purchases.reduce((a, p) => a + (p.totalAmount || 0), 0);
  const totalPaidToVendor = purchases.reduce((a, p) => a + (p.paidAmount || 0) + (p.settlementDiscount || 0) + (p.grAmount || 0), 0);
  const totalDueToVendor = purchases.reduce((a, p) => a + (p.balanceDue || 0), 0);

  // 6. Recent sales orders
  const recentOrders = await Order.find({
    orderStatus: { $ne: "Cancelled" },
    "orderItems.product": { $in: productIds },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("createdAt orderStatus totalPrice paymentInfo shippingInfo orderItems mode");

  res.json({
    vendor,
    summary: {
      totalProductsCount: products.length,
      // In-Stock Metrics
      totalStockQty,
      totalStockCostValue: Math.round(totalStockCostValue),
      totalStockRetailValue: Math.round(totalStockRetailValue),
      potentialProfitInHand: Math.round(potentialProfitInHand),
      potentialMarginPercent: +potentialMarginPercent.toFixed(1),

      // Realized Sales Metrics
      totalSoldQty,
      totalRealizedRevenue: Math.round(totalRealizedRevenue),
      totalSoldCostValue: Math.round(totalSoldCostValue),
      realizedProfit: Math.round(realizedProfit),
      realizedMarginPercent: +realizedMarginPercent.toFixed(1),

      // Purchase & Payables
      totalPurchasesFromVendor,
      totalPaidToVendor,
      totalDueToVendor,
      billCount: purchases.length,

      // Total Potential Turnover
      grandTurnoverPotential: Math.round(totalRealizedRevenue + totalStockRetailValue),
      grandProfitPotential: Math.round(realizedProfit + potentialProfitInHand),
    },
    products: productAnalysisList,
    purchases: purchases.map((p) => ({
      _id: p._id,
      billNo: p.billNo,
      billDate: p.billDate,
      totalAmount: p.totalAmount,
      paidAmount: p.paidAmount,
      balanceDue: p.balanceDue,
      status: p.status,
      itemCount: p.items?.length || 0,
    })),
    recentOrders: recentOrders.map((o) => ({
      _id: o._id,
      date: o.createdAt,
      status: o.orderStatus,
      customerName: o.shippingInfo ? `${o.shippingInfo.firstname || ""} ${o.shippingInfo.lastname || ""}`.trim() : "Customer",
      totalPrice: o.totalPrice,
      mode: o.mode,
      vendorItemsCount: o.orderItems.filter((it) => productIds.some((id) => id.toString() === it.product?.toString())).length,
    })),
  });
});

const getVendorStockWiseAnalytics = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find().sort({ name: 1 });

  const products = await Product.find()
    .populate("categoryId", "title")
    .select(
      "title slug price purchasePrice mrp quantity sold images category categoryId subcategory brand sku barcode sizeStock variants vendorName createdAt"
    );

  const vendorStatsMap = {};

  vendors.forEach((v) => {
    const vId = v._id.toString();
    vendorStatsMap[vId] = {
      vendor: {
        _id: v._id,
        name: v.name,
        firmName: v.firmName || "",
        phone: v.phone || "",
        city: v.city || "",
        gstin: v.gstin || "",
        status: v.status || "ACTIVE",
      },
      totalProducts: 0,
      totalStockQty: 0,
      totalStockCostValue: 0,
      totalStockRetailValue: 0,
      totalSoldQty: 0,
      items: [],
    };
  });

  const unassignedId = "unassigned";
  vendorStatsMap[unassignedId] = {
    vendor: {
      _id: null,
      name: "Unassigned / General Store",
      firmName: "Direct Shop Stock",
      phone: "-",
      city: "-",
      status: "ACTIVE",
    },
    totalProducts: 0,
    totalStockQty: 0,
    totalStockCostValue: 0,
    totalStockRetailValue: 0,
    totalSoldQty: 0,
    items: [],
  };

  const normalizeStr = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const findVendorIdForProduct = (vName) => {
    if (!vName) return unassignedId;
    const rawVName = String(vName).trim();
    if (!rawVName) return unassignedId;

    // 1. Direct ID match
    if (vendorStatsMap[rawVName]) return rawVName;

    const normVName = normalizeStr(rawVName);
    if (!normVName) return unassignedId;

    // 2. Normalized exact match (ignoring dots, spaces, hyphens, case)
    for (const v of vendors) {
      const vId = v._id.toString();
      const normName = normalizeStr(v.name);
      const normFirm = normalizeStr(v.firmName);

      if (
        normVName === normalizeStr(vId) ||
        (normName && normVName === normName) ||
        (normFirm && normVName === normFirm)
      ) {
        return vId;
      }
    }

    // 3. Substring / Partial match (e.g. "J.B fashion" vs "J.B. Fashion")
    if (normVName.length >= 2) {
      for (const v of vendors) {
        const vId = v._id.toString();
        const normName = normalizeStr(v.name);
        const normFirm = normalizeStr(v.firmName);

        if (
          (normName && (normVName.includes(normName) || normName.includes(normVName))) ||
          (normFirm && (normVName.includes(normFirm) || normFirm.includes(normVName)))
        ) {
          return vId;
        }
      }
    }

    // 4. Fallback for vendor names entered on products that are not yet in Vendor collection
    const dynamicKey = `vendor_name_${normVName}`;
    if (!vendorStatsMap[dynamicKey]) {
      vendorStatsMap[dynamicKey] = {
        vendor: {
          _id: null,
          name: rawVName,
          firmName: "Store Product Vendor",
          phone: "-",
          city: "-",
          status: "ACTIVE",
        },
        totalProducts: 0,
        totalStockQty: 0,
        totalStockCostValue: 0,
        totalStockRetailValue: 0,
        totalSoldQty: 0,
        items: [],
      };
    }
    return dynamicKey;
  };

  let grandTotalStockQty = 0;
  let grandTotalStockCostValue = 0;
  let grandTotalStockRetailValue = 0;
  let grandTotalSoldQty = 0;

  products.forEach((p) => {
    let stockQty = Number(p.quantity || 0);
    if (p.variants && p.variants.length > 0) {
      const variantQty = p.variants.reduce(
        (sum, v) => sum + (v.sizeStock || []).reduce((q, s) => q + Number(s.quantity || 0), 0),
        0
      );
      if (variantQty > 0) stockQty = variantQty;
    } else if (p.sizeStock && p.sizeStock.length > 0) {
      const sizeQty = p.sizeStock.reduce((sum, s) => sum + Number(s.quantity || 0), 0);
      if (sizeQty > 0) stockQty = sizeQty;
    }

    const sellingPrice = Number(p.price || 0);
    const costPrice = Number(
      p.purchasePrice !== null && p.purchasePrice !== undefined && p.purchasePrice !== 0
        ? p.purchasePrice
        : sellingPrice
    );

    const stockCost = stockQty * costPrice;
    const stockRetail = stockQty * sellingPrice;
    const soldUnits = Number(p.sold || 0);

    const targetVendorId = findVendorIdForProduct(p.vendorName);
    const targetBucket = vendorStatsMap[targetVendorId];

    const categoryTitle = p.categoryId?.title || p.category || p.subcategory || "General";
    const itemData = {
      _id: p._id,
      title: p.title,
      slug: p.slug,
      sku: p.sku || "-",
      barcode: p.barcode || "-",
      category: categoryTitle,
      brand: p.brand || "-",
      image: p.images?.[0]?.url || "",
      stockQty,
      soldQty: soldUnits,
      costPrice,
      sellingPrice,
      stockCostValue: Math.round(stockCost),
      stockRetailValue: Math.round(stockRetail),
      potentialProfit: Math.round(stockRetail - stockCost),
      vendorName: p.vendorName || "",
    };

    targetBucket.totalProducts += 1;
    targetBucket.totalStockQty += stockQty;
    targetBucket.totalStockCostValue += stockCost;
    targetBucket.totalStockRetailValue += stockRetail;
    targetBucket.totalSoldQty += soldUnits;
    targetBucket.items.push(itemData);

    grandTotalStockQty += stockQty;
    grandTotalStockCostValue += stockCost;
    grandTotalStockRetailValue += stockRetail;
    grandTotalSoldQty += soldUnits;
  });

  const vendorWiseList = Object.values(vendorStatsMap)
    .filter((v) => v.vendor._id !== null || v.totalProducts > 0)
    .map((vStats) => {
      const potentialProfit = vStats.totalStockRetailValue - vStats.totalStockCostValue;
      const sharePercent =
        grandTotalStockCostValue > 0
          ? ((vStats.totalStockCostValue / grandTotalStockCostValue) * 100).toFixed(1)
          : "0.0";

      return {
        ...vStats,
        totalStockCostValue: Math.round(vStats.totalStockCostValue),
        totalStockRetailValue: Math.round(vStats.totalStockRetailValue),
        potentialProfit: Math.round(potentialProfit),
        stockSharePercent: Number(sharePercent),
      };
    })
    .sort((a, b) => b.totalStockCostValue - a.totalStockCostValue);

  res.json({
    summary: {
      grandTotalStockQty,
      grandTotalStockCostValue: Math.round(grandTotalStockCostValue),
      grandTotalStockRetailValue: Math.round(grandTotalStockRetailValue),
      grandTotalPotentialProfit: Math.round(grandTotalStockRetailValue - grandTotalStockCostValue),
      grandTotalSoldQty,
      totalVendorsCount: vendors.length,
      vendorsWithStockCount: vendorWiseList.filter((v) => v.totalStockQty > 0 && v.vendor._id !== null).length,
    },
    vendorWiseStock: vendorWiseList,
  });
});

module.exports = {
  createVendor,
  updateVendor,
  deleteVendor,
  getVendor,
  getAllVendors,
  getVendorLedger,
  getVendorDashboardStats,
  getVendorAnalysis,
  getVendorStockWiseAnalytics,
};


