const express = require("express");
const {
  createStockAudit,
  getAllStockAudits,
  getStockAuditById,
  updateItemCount,
  batchUpdateItemCounts,
  updateItemInvestigation,
  reconcileStockAudit,
  deleteStockAudit,
} = require("../controller/stockAuditCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Owner / Admin only routes
router.post("/create", authMiddleware, isAdmin, createStockAudit);
router.get("/", authMiddleware, isAdmin, getAllStockAudits);
router.get("/:id", authMiddleware, isAdmin, getStockAuditById);

// Physical counting updates
router.put("/:id/count", authMiddleware, isAdmin, updateItemCount);
router.put("/:id/batch-counts", authMiddleware, isAdmin, batchUpdateItemCounts);
router.put("/:id/items/:itemId/investigation", authMiddleware, isAdmin, updateItemInvestigation);

// Reconcile and finalize
router.post("/:id/reconcile", authMiddleware, isAdmin, reconcileStockAudit);
router.delete("/:id", authMiddleware, isAdmin, deleteStockAudit);

module.exports = router;
