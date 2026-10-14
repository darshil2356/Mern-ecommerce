const StockAudit = require("../models/stockAuditModel");
const Product = require("../models/productModel");
const StockLog = require("../models/stockLogModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

// Helper to recalculate aggregate statistics for an audit session
const recalculateAuditMetrics = (audit) => {
  let totalSystemUnits = 0;
  let totalPhysicalUnits = 0;
  let totalShortageUnits = 0;
  let totalSurplusUnits = 0;
  let totalCostLoss = 0;
  let totalRetailLoss = 0;
  let totalSurplusCost = 0;
  let totalExpectedValue = 0;
  let totalCountedValue = 0;
  let countedItemsCount = 0;
  let shortageCount = 0;
  let surplusCount = 0;
  let matchedCount = 0;

  audit.items.forEach((item) => {
    totalSystemUnits += item.systemStock || 0;
    const itemCost = item.costPrice || 0;
    const itemRetail = item.sellingPrice || 0;
    totalExpectedValue += (item.systemStock || 0) * itemCost;

    if (item.isCounted) {
      countedItemsCount++;
      totalPhysicalUnits += item.countedStock || 0;
      totalCountedValue += (item.countedStock || 0) * itemCost;

      const diff = (item.countedStock || 0) - (item.systemStock || 0);
      item.discrepancy = diff;

      if (diff < 0) {
        const missing = Math.abs(diff);
        item.status = "SHORTAGE";
        item.costLoss = missing * itemCost;
        item.retailLoss = missing * itemRetail;
        item.surplusCost = 0;

        totalShortageUnits += missing;
        totalCostLoss += item.costLoss;
        totalRetailLoss += item.retailLoss;
        shortageCount++;

        // Default suspicion if not already set
        if (!item.suspicionReason || item.suspicionReason === "NONE") {
          item.suspicionReason = "SUSPECTED_UNBILLED_CASH_SALE";
        }
      } else if (diff > 0) {
        item.status = "SURPLUS";
        item.costLoss = 0;
        item.retailLoss = 0;
        item.surplusCost = diff * itemCost;

        totalSurplusUnits += diff;
        totalSurplusCost += item.surplusCost;
        surplusCount++;
      } else {
        item.status = "MATCHED";
        item.costLoss = 0;
        item.retailLoss = 0;
        item.surplusCost = 0;
        matchedCount++;
      }
    } else {
      item.status = "PENDING";
    }
  });

  audit.totalProducts = audit.items.length;
  audit.totalCountedProducts = countedItemsCount;
  audit.totalSystemUnits = totalSystemUnits;
  audit.totalPhysicalUnits = totalPhysicalUnits;
  audit.totalShortageUnits = totalShortageUnits;
  audit.totalSurplusUnits = totalSurplusUnits;
  audit.netDiscrepancyUnits = totalPhysicalUnits - totalSystemUnits;
  audit.totalCostLoss = Math.round(totalCostLoss * 100) / 100;
  audit.totalRetailLoss = Math.round(totalRetailLoss * 100) / 100;
  audit.totalSurplusCost = Math.round(totalSurplusCost * 100) / 100;
  audit.totalExpectedValue = Math.round(totalExpectedValue * 100) / 100;
  audit.totalCountedValue = Math.round(totalCountedValue * 100) / 100;

  audit.shortageItemsCount = shortageCount;
  audit.surplusItemsCount = surplusCount;
  audit.matchedItemsCount = matchedCount;

  // Accuracy Rate Calculation
  if (totalSystemUnits > 0 && countedItemsCount > 0) {
    const errorUnits = totalShortageUnits + totalSurplusUnits;
    const accuracy = Math.max(0, 100 - (errorUnits / totalSystemUnits) * 100);
    audit.accuracyRate = Math.round(accuracy * 10) / 10;
    audit.shrinkageRate = Math.round((totalShortageUnits / totalSystemUnits) * 1000) / 10;
  } else {
    audit.accuracyRate = 100;
    audit.shrinkageRate = 0;
  }
};

// ─── 1. CREATE STOCK AUDIT SESSION ───────────────────────────────────────────
const createStockAudit = asyncHandler(async (req, res) => {
  const {
    title,
    periodType = "HALF_YEARLY_H1",
    fiscalYear,
    scope = "ALL_PRODUCTS",
    scopeTarget,
    supervisorStaff,
    ownerSummaryNotes,
  } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error("Audit title is required (e.g. H1 2026 Half-Yearly Store Stock Audit)");
  }

  // Generate unique audit number: e.g. SA-2026-H1-1024
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const auditNumber = `SA-${dateStr}-${randomSuffix}`;

  // Query products based on scope
  const filter = {};
  if (scope === "CATEGORY" && scopeTarget) {
    filter.category = scopeTarget;
  } else if (scope === "BRAND" && scopeTarget) {
    filter.brand = scopeTarget;
  }

  const products = await Product.find(filter)
    .select("title images price purchasePrice quantity barcode sku category brand sizeStock variants")
    .lean();

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error("No products found matching the selected scope.");
  }

  // Map products into audit items snapshot
  const items = products.map((prod) => {
    const cost =
      prod.purchasePrice !== null && prod.purchasePrice !== undefined && prod.purchasePrice > 0
        ? prod.purchasePrice
        : Math.round((prod.price || 0) * 0.65); // reasonable estimate if purchasePrice wasn't logged

    const variants = [];
    if (prod.variants && Array.isArray(prod.variants)) {
      prod.variants.forEach((v) => {
        (v.sizeStock || []).forEach((s) => {
          variants.push({
            color: v.color?.title || v.color?.name || "Standard",
            size: s.size || "Standard",
            barcode: s.barcode || "",
            systemStock: Number(s.quantity) || 0,
            countedStock: 0,
            discrepancy: 0,
          });
        });
      });
    } else if (prod.sizeStock && Array.isArray(prod.sizeStock)) {
      prod.sizeStock.forEach((s) => {
        variants.push({
          color: "Standard",
          size: s.size || "Standard",
          barcode: s.barcode || "",
          systemStock: Number(s.quantity) || 0,
          countedStock: 0,
          discrepancy: 0,
        });
      });
    }

    const currentQty = typeof prod.quantity === "number" ? Math.max(0, prod.quantity) : 0;

    return {
      productId: prod._id,
      productTitle: prod.title || "Untitled Product",
      productImage: prod.images?.[0]?.url || "",
      barcode: prod.barcode || "",
      sku: prod.sku || "",
      category: prod.category || "General",
      brand: prod.brand || "General",
      costPrice: cost,
      sellingPrice: prod.price || 0,
      systemStock: currentQty,
      countedStock: 0,
      isCounted: false,
      discrepancy: 0,
      costLoss: 0,
      retailLoss: 0,
      surplusCost: 0,
      status: "PENDING",
      suspicionReason: "NONE",
      investigationNotes: "",
      variants,
    };
  });

  const creator = req.user
    ? {
        userId: req.user._id,
        name: `${req.user.firstname} ${req.user.lastname || ""}`.trim(),
        email: req.user.email || "",
        role: req.user.role || "",
      }
    : undefined;

  const audit = new StockAudit({
    auditNumber,
    title: title.trim(),
    periodType,
    fiscalYear: fiscalYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    scope,
    scopeTarget: scopeTarget || "All Store Products",
    supervisorStaff: supervisorStaff || "",
    ownerSummaryNotes: ownerSummaryNotes || "",
    startedBy: creator,
    items,
  });

  recalculateAuditMetrics(audit);
  await audit.save();

  res.status(201).json({
    success: true,
    message: "Stock calculation and audit session started successfully.",
    audit,
  });
});

// ─── 2. GET ALL STOCK AUDITS (WITH 6-MONTH CYCLE REMINDER) ───────────────────
const getAllStockAudits = asyncHandler(async (req, res) => {
  const { status, periodType, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (periodType) filter.periodType = periodType;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { auditNumber: { $regex: search, $options: "i" } },
      { supervisorStaff: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Return audits without heavy items array for listing
  const [audits, total] = await Promise.all([
    StockAudit.find(filter)
      .select("-items")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    StockAudit.countDocuments(filter),
  ]);

  // Find last completed/reconciled audit to calculate cycle status
  const lastReconciled = await StockAudit.findOne({ status: "RECONCILED" })
    .sort({ createdAt: -1 })
    .select("createdAt reconciledBy auditNumber title totalShortageUnits totalCostLoss")
    .lean();

  let daysSinceLastAudit = null;
  let monthsSinceLastAudit = null;
  let isAuditDue = false;

  if (lastReconciled && lastReconciled.createdAt) {
    const diffMs = Date.now() - new Date(lastReconciled.createdAt).getTime();
    daysSinceLastAudit = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    monthsSinceLastAudit = Math.round((daysSinceLastAudit / 30.4) * 10) / 10;
    // 6 months is approx 180 days
    if (daysSinceLastAudit >= 180) {
      isAuditDue = true;
    }
  } else {
    // No prior audit found -> highly recommend running first audit
    isAuditDue = true;
  }

  // Calculate cumulative lifetime shrinkage / unbilled sales detected
  const lifetimeStats = await StockAudit.aggregate([
    { $match: { status: "RECONCILED" } },
    {
      $group: {
        _id: null,
        totalAuditsCompleted: { $sum: 1 },
        lifetimeMissingUnits: { $sum: "$totalShortageUnits" },
        lifetimeCostLoss: { $sum: "$totalCostLoss" },
        lifetimeRetailLoss: { $sum: "$totalRetailLoss" },
        avgAccuracyRate: { $avg: "$accuracyRate" },
      },
    },
  ]);

  res.json({
    success: true,
    audits,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    cycleStatus: {
      lastAudit: lastReconciled,
      daysSinceLastAudit,
      monthsSinceLastAudit,
      isAuditDue,
      recommendation: isAuditDue
        ? "⚠️ 6-Month Stock Audit is DUE! It has been over 6 months since your last store audit. Run an audit now to catch unbilled sales and staff shrinkage."
        : `✅ Stock audit is up-to-date (${monthsSinceLastAudit || 0} months since last audit). Next scheduled in ${Math.max(0, Math.round(6 - (monthsSinceLastAudit || 0)))} months.`,
    },
    lifetimeStats: lifetimeStats[0] || {
      totalAuditsCompleted: 0,
      lifetimeMissingUnits: 0,
      lifetimeCostLoss: 0,
      lifetimeRetailLoss: 0,
      avgAccuracyRate: 100,
    },
  });
});

// ─── 3. GET SINGLE STOCK AUDIT BY ID (FULL WORKBENCH DETAILS) ────────────────
const getStockAuditById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const audit = await StockAudit.findById(id);
  if (!audit) {
    res.status(404);
    throw new Error("Stock audit session not found");
  }

  // Category-wise loss breakdown for owner clarity
  const categoryLossMap = {};
  const highDiscrepancyItems = [];
  const suspicionCounts = {
    SUSPECTED_UNBILLED_CASH_SALE: 0,
    STAFF_THEFT_PILFERAGE: 0,
    DAMAGED_EXPIRED_NOT_LOGGED: 0,
    SUPPLIER_MISCOUNT: 0,
    BARCODE_SWAP: 0,
    SYSTEM_ENTRY_ERROR: 0,
    OTHER: 0,
  };

  audit.items.forEach((item) => {
    const cat = item.category || "Uncategorized";
    if (!categoryLossMap[cat]) {
      categoryLossMap[cat] = {
        category: cat,
        systemUnits: 0,
        countedUnits: 0,
        missingUnits: 0,
        excessUnits: 0,
        costLoss: 0,
        retailLoss: 0,
      };
    }

    categoryLossMap[cat].systemUnits += item.systemStock || 0;
    if (item.isCounted) {
      categoryLossMap[cat].countedUnits += item.countedStock || 0;
      if (item.discrepancy < 0) {
        const missing = Math.abs(item.discrepancy);
        categoryLossMap[cat].missingUnits += missing;
        categoryLossMap[cat].costLoss += item.costLoss || 0;
        categoryLossMap[cat].retailLoss += item.retailLoss || 0;

        if (item.suspicionReason && suspicionCounts[item.suspicionReason] !== undefined) {
          suspicionCounts[item.suspicionReason]++;
        }

        // Flag if missing >= 2 or retailLoss >= 1000
        if (missing >= 2 || (item.retailLoss || 0) >= 1000) {
          highDiscrepancyItems.push({
            productId: item.productId,
            title: item.productTitle,
            barcode: item.barcode,
            category: item.category,
            systemStock: item.systemStock,
            countedStock: item.countedStock,
            missingUnits: missing,
            costLoss: item.costLoss,
            retailLoss: item.retailLoss,
            suspicionReason: item.suspicionReason,
            investigationNotes: item.investigationNotes,
          });
        }
      } else if (item.discrepancy > 0) {
        categoryLossMap[cat].excessUnits += item.discrepancy;
      }
    }
  });

  // Sort high discrepancy items by retailLoss descending
  highDiscrepancyItems.sort((a, b) => (b.retailLoss || 0) - (a.retailLoss || 0));

  res.json({
    success: true,
    audit,
    analytics: {
      categoryBreakdown: Object.values(categoryLossMap),
      highDiscrepancyItems: highDiscrepancyItems.slice(0, 15),
      suspicionCounts,
    },
  });
});

// ─── 4. UPDATE SINGLE ITEM PHYSICAL COUNT (BARCODE SCAN OR INPUT) ────────────
const updateItemCount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const {
    itemId,
    barcode,
    countedStock,
    incrementByOne,
    suspicionReason,
    investigationNotes,
    variants,
  } = req.body;

  const audit = await StockAudit.findById(id);
  if (!audit) {
    res.status(404);
    throw new Error("Stock audit session not found");
  }

  if (audit.status === "RECONCILED") {
    res.status(400);
    throw new Error("This audit session is already RECONCILED and cannot be modified.");
  }

  // Find item by itemId or by barcode
  let itemIndex = -1;
  if (itemId) {
    itemIndex = audit.items.findIndex((i) => i._id.toString() === itemId);
  } else if (barcode && barcode.trim()) {
    const cleanBarcode = barcode.trim().toUpperCase();
    itemIndex = audit.items.findIndex(
      (i) =>
        (i.barcode && i.barcode.trim().toUpperCase() === cleanBarcode) ||
        (i.sku && i.sku.trim().toUpperCase() === cleanBarcode) ||
        (i.variants && i.variants.some((v) => v.barcode && v.barcode.trim().toUpperCase() === cleanBarcode))
    );
  }

  if (itemIndex === -1) {
    res.status(404);
    throw new Error(`Product not found in this audit session for barcode/ID: ${barcode || itemId}`);
  }

  const item = audit.items[itemIndex];

  if (incrementByOne) {
    // Barcode scanner quick mode: adds +1 to current count
    item.countedStock = (item.isCounted ? item.countedStock : 0) + 1;
  } else if (typeof countedStock === "number") {
    item.countedStock = Math.max(0, countedStock);
  }

  if (variants && Array.isArray(variants)) {
    item.variants = variants;
    // Update main countedStock as sum of variants if supplied
    item.countedStock = variants.reduce((sum, v) => sum + (Number(v.countedStock) || 0), 0);
  }

  item.isCounted = true;
  item.lastScannedAt = new Date();

  if (suspicionReason) {
    item.suspicionReason = suspicionReason;
  }
  if (investigationNotes !== undefined) {
    item.investigationNotes = investigationNotes.trim();
  }

  // Recalculate audit statistics
  recalculateAuditMetrics(audit);
  await audit.save();

  res.json({
    success: true,
    message: `Physical count updated for "${item.productTitle}": ${item.countedStock} pcs (System: ${item.systemStock})`,
    updatedItem: item,
    auditSummary: {
      totalCountedProducts: audit.totalCountedProducts,
      totalPhysicalUnits: audit.totalPhysicalUnits,
      totalShortageUnits: audit.totalShortageUnits,
      totalSurplusUnits: audit.totalSurplusUnits,
      totalCostLoss: audit.totalCostLoss,
      totalRetailLoss: audit.totalRetailLoss,
      accuracyRate: audit.accuracyRate,
    },
  });
});

// ─── 5. BATCH UPDATE ITEM COUNTS (SAVE PAGE / SECTION COUNTS) ─────────────────
const batchUpdateItemCounts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const { counts } = req.body; // Array of { itemId, countedStock, suspicionReason, notes }

  if (!Array.isArray(counts) || counts.length === 0) {
    res.status(400);
    throw new Error("counts array is required for batch update.");
  }

  const audit = await StockAudit.findById(id);
  if (!audit) {
    res.status(404);
    throw new Error("Stock audit session not found");
  }

  if (audit.status === "RECONCILED") {
    res.status(400);
    throw new Error("This audit session is already RECONCILED and cannot be modified.");
  }

  const countMap = new Map();
  counts.forEach((c) => {
    if (c.itemId) {
      countMap.set(c.itemId.toString(), c);
    }
  });

  audit.items.forEach((item) => {
    const incoming = countMap.get(item._id.toString());
    if (incoming) {
      if (typeof incoming.countedStock === "number") {
        item.countedStock = Math.max(0, incoming.countedStock);
        item.isCounted = true;
        item.lastScannedAt = new Date();
      }
      if (incoming.suspicionReason) {
        item.suspicionReason = incoming.suspicionReason;
      }
      if (incoming.investigationNotes !== undefined) {
        item.investigationNotes = incoming.investigationNotes;
      }
    }
  });

  recalculateAuditMetrics(audit);
  await audit.save();

  res.json({
    success: true,
    message: `Successfully saved physical counts for ${counts.length} products.`,
    audit,
  });
});

// ─── 6. UPDATE ITEM FRAUD INVESTIGATION NOTES & SUSPICION REASON ─────────────
const updateItemInvestigation = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  validateMongoDbId(id);
  validateMongoDbId(itemId);

  const { suspicionReason, investigationNotes } = req.body;

  const audit = await StockAudit.findById(id);
  if (!audit) {
    res.status(404);
    throw new Error("Stock audit session not found");
  }

  const item = audit.items.id(itemId);
  if (!item) {
    res.status(404);
    throw new Error("Item not found in this audit session");
  }

  if (suspicionReason) item.suspicionReason = suspicionReason;
  if (investigationNotes !== undefined) item.investigationNotes = investigationNotes.trim();

  await audit.save();

  res.json({
    success: true,
    message: "Investigation details updated successfully.",
    item,
  });
});

// ─── 7. RECONCILE STOCK AUDIT (UPDATE SYSTEM INVENTORY + CREATE AUDIT LOGS) ──
const reconcileStockAudit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const { ownerSummaryNotes, forceReconcileUncounted = false } = req.body;

  const audit = await StockAudit.findById(id);
  if (!audit) {
    res.status(404);
    throw new Error("Stock audit session not found");
  }

  if (audit.status === "RECONCILED") {
    res.status(400);
    throw new Error("This audit session has already been reconciled.");
  }

  // Ensure items have been calculated
  recalculateAuditMetrics(audit);

  const reconciler = req.user
    ? {
        userId: req.user._id,
        name: `${req.user.firstname} ${req.user.lastname || ""}`.trim(),
        email: req.user.email || "",
        date: new Date(),
      }
    : {
        name: "Shop Owner",
        date: new Date(),
      };

  let totalUpdatedProducts = 0;
  let totalLogsCreated = 0;

  // Process adjustments for all counted items with a discrepancy
  for (const item of audit.items) {
    if (!item.isCounted && !forceReconcileUncounted) {
      // Skip items that were never counted physically
      continue;
    }

    const diff = (item.countedStock || 0) - (item.systemStock || 0);

    // If there is any discrepancy, update Product live inventory and log in StockLog
    if (diff !== 0) {
      const product = await Product.findById(item.productId);
      if (product) {
        const prevQty = product.quantity !== undefined ? product.quantity : item.systemStock;
        const newQty = Math.max(0, item.countedStock || 0);

        product.quantity = newQty;
        await product.save();
        totalUpdatedProducts++;

        // Detailed Fraud Reason Mapping
        let cleanReason = "Half-Yearly Physical Stock Audit Discrepancy";
        if (item.suspicionReason === "SUSPECTED_UNBILLED_CASH_SALE") {
          cleanReason = "AUDIT FRAUD: Suspected Unbilled Cash Sale (Staff Sold Off-Books)";
        } else if (item.suspicionReason === "STAFF_THEFT_PILFERAGE") {
          cleanReason = "AUDIT THEFT: Staff Shoplifting / Pilferage";
        } else if (item.suspicionReason === "DAMAGED_EXPIRED_NOT_LOGGED") {
          cleanReason = "AUDIT DAMAGE: Unreported Damaged / Broken Goods";
        } else if (item.suspicionReason === "SUPPLIER_MISCOUNT") {
          cleanReason = "AUDIT SUPPLIER: Vendor Inward Shortage";
        }

        const logEntry = await StockLog.create({
          productId: product._id,
          productTitle: product.title,
          productImage: product.images?.[0]?.url || item.productImage || "",
          barcode: product.barcode || item.barcode || "",
          sku: product.sku || item.sku || "",
          category: product.category || item.category || "",
          brand: product.brand || item.brand || "",
          changeType: "AUDIT_ADJUSTMENT",
          previousStock: prevQty,
          newStock: newQty,
          diffQuantity: diff,
          unitPrice: item.sellingPrice || product.price || 0,
          unitPurchasePrice: item.costPrice || product.purchasePrice || 0,
          potentialLossAmount: diff < 0 ? Math.abs(diff) * (item.sellingPrice || product.price || 0) : 0,
          reason: cleanReason,
          notes: `[Audit #${audit.auditNumber}] Counted: ${item.countedStock} vs System: ${item.systemStock}. Diff: ${diff}. Notes: ${item.investigationNotes || "None"}`,
          staffName: audit.supervisorStaff || "Store Staff",
          performedBy: reconciler,
          auditStatus: diff < 0 ? "SUSPECTED_FRAUD" : "VERIFIED_GENUINE",
        });

        totalLogsCreated++;
      }
    }
  }

  audit.status = "RECONCILED";
  audit.auditEndDate = new Date();
  audit.reconciledBy = reconciler;
  if (ownerSummaryNotes) {
    audit.ownerSummaryNotes = ownerSummaryNotes.trim();
  }

  await audit.save();

  res.json({
    success: true,
    message: `Stock Audit #${audit.auditNumber} successfully reconciled! System inventory updated for ${totalUpdatedProducts} products, and ${totalLogsCreated} audit trail entries recorded.`,
    audit,
    reconciliationSummary: {
      totalUpdatedProducts,
      totalLogsCreated,
      totalShortageUnits: audit.totalShortageUnits,
      totalCostLoss: audit.totalCostLoss,
      totalRetailLoss: audit.totalRetailLoss,
      accuracyRate: audit.accuracyRate,
    },
  });
});

// ─── 8. DELETE OR CANCEL STOCK AUDIT ──────────────────────────────────────────
const deleteStockAudit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const audit = await StockAudit.findById(id);
  if (!audit) {
    res.status(404);
    throw new Error("Stock audit session not found");
  }

  if (audit.status === "RECONCILED") {
    res.status(400);
    throw new Error("Cannot delete a RECONCILED stock audit because it holds permanent financial audit history.");
  }

  await StockAudit.findByIdAndDelete(id);

  res.json({
    success: true,
    message: `Audit session #${audit.auditNumber} deleted successfully.`,
  });
});

module.exports = {
  createStockAudit,
  getAllStockAudits,
  getStockAuditById,
  updateItemCount,
  batchUpdateItemCounts,
  updateItemInvestigation,
  reconcileStockAudit,
  deleteStockAudit,
};
