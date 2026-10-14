const mongoose = require("mongoose");

const stockAuditItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productTitle: {
    type: String,
    required: true,
    trim: true,
  },
  productImage: {
    type: String,
    default: "",
  },
  barcode: {
    type: String,
    trim: true,
    default: "",
  },
  sku: {
    type: String,
    trim: true,
    default: "",
  },
  category: {
    type: String,
    default: "",
  },
  brand: {
    type: String,
    default: "",
  },
  costPrice: {
    type: Number,
    default: 0,
  },
  sellingPrice: {
    type: Number,
    default: 0,
  },
  // Snapshot of system stock when audit started
  systemStock: {
    type: Number,
    required: true,
    default: 0,
  },
  // What owner/staff counted physically in store
  countedStock: {
    type: Number,
    default: 0,
  },
  isCounted: {
    type: Boolean,
    default: false,
  },
  // discrepancy = countedStock - systemStock (<0: shortage/theft, >0: surplus)
  discrepancy: {
    type: Number,
    default: 0,
  },
  // Financial loss at purchase price (cost loss)
  costLoss: {
    type: Number,
    default: 0,
  },
  // Potential cash pocketed by staff if sold without billing at selling price
  retailLoss: {
    type: Number,
    default: 0,
  },
  // Extra value if surplus
  surplusCost: {
    type: Number,
    default: 0,
  },
  // Status of item
  status: {
    type: String,
    enum: ["PENDING", "MATCHED", "SHORTAGE", "SURPLUS"],
    default: "PENDING",
  },
  // Fraud / Theft Suspicion Classification
  suspicionReason: {
    type: String,
    enum: [
      "NONE",
      "SUSPECTED_UNBILLED_CASH_SALE", // Staff sold for cash and pocketed money without billing
      "STAFF_THEFT_PILFERAGE",        // Product stolen from shelf or warehouse
      "DAMAGED_EXPIRED_NOT_LOGGED",   // Broken/spoiled but staff did not report
      "SUPPLIER_MISCOUNT",           // Supplier delivered fewer pieces than billed
      "BARCODE_SWAP",                // Barcode or tag swapped with another item
      "SYSTEM_ENTRY_ERROR",          // Wrong bill or purchase entry previously
      "VERIFIED_GENUINE",            // Verified normal variation
      "OTHER",
    ],
    default: "NONE",
  },
  investigationNotes: {
    type: String,
    default: "",
    trim: true,
  },
  lastScannedAt: {
    type: Date,
  },
  // Variant breakdowns if multi-color / multi-size
  variants: [
    {
      color: { type: String, default: "" },
      size: { type: String, default: "" },
      barcode: { type: String, default: "" },
      systemStock: { type: Number, default: 0 },
      countedStock: { type: Number, default: 0 },
      discrepancy: { type: Number, default: 0 },
    },
  ],
});

const stockAuditSchema = new mongoose.Schema(
  {
    auditNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // Every 6 months or annual cycle
    periodType: {
      type: String,
      enum: [
        "HALF_YEARLY_H1", // e.g. April to September
        "HALF_YEARLY_H2", // e.g. October to March
        "ANNUAL",         // Full Year Stock Audit
        "QUARTERLY",      // Every 3 months
        "MONTHLY",        // Monthly spot check
        "SURPRISE_AUDIT", // Surprise theft check
        "CUSTOM",
      ],
      default: "HALF_YEARLY_H1",
      index: true,
    },
    fiscalYear: {
      type: String,
      default: () => {
        const y = new Date().getFullYear();
        return `${y}-${y + 1}`;
      },
    },
    auditStartDate: {
      type: Date,
      default: Date.now,
    },
    auditEndDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "REVIEW_REQUIRED", "RECONCILED", "CANCELLED"],
      default: "IN_PROGRESS",
      index: true,
    },
    scope: {
      type: String,
      enum: ["ALL_PRODUCTS", "CATEGORY", "BRAND"],
      default: "ALL_PRODUCTS",
    },
    scopeTarget: {
      type: String,
      default: "All Store Products",
    },
    supervisorStaff: {
      type: String,
      default: "",
      trim: true,
    },
    startedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    reconciledBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      date: { type: Date },
    },
    ownerSummaryNotes: {
      type: String,
      default: "",
      trim: true,
    },
    // Audit Items
    items: [stockAuditItemSchema],

    // Aggregated Metrics for Owner Clarity
    totalProducts: { type: Number, default: 0 },
    totalCountedProducts: { type: Number, default: 0 },
    totalSystemUnits: { type: Number, default: 0 },
    totalPhysicalUnits: { type: Number, default: 0 },
    totalShortageUnits: { type: Number, default: 0 }, // Missing / stolen / unbilled pieces
    totalSurplusUnits: { type: Number, default: 0 },  // Excess pieces
    netDiscrepancyUnits: { type: Number, default: 0 },

    // Financial Clarity
    totalCostLoss: { type: Number, default: 0 },    // Real cash lost at purchase price
    totalRetailLoss: { type: Number, default: 0 },  // Unbilled cash pocketed by staff at retail price
    totalSurplusCost: { type: Number, default: 0 },
    totalExpectedValue: { type: Number, default: 0 },
    totalCountedValue: { type: Number, default: 0 },

    // Performance & Shrinkage Percentages
    accuracyRate: { type: Number, default: 100 }, // e.g. 96.5%
    shrinkageRate: { type: Number, default: 0 },   // e.g. 3.5%
    shortageItemsCount: { type: Number, default: 0 },
    surplusItemsCount: { type: Number, default: 0 },
    matchedItemsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

stockAuditSchema.index({ createdAt: -1 });
stockAuditSchema.index({ status: 1, createdAt: -1 });
stockAuditSchema.index({ periodType: 1 });

module.exports = mongoose.model("StockAudit", stockAuditSchema);
