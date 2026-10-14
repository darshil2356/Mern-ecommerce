import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Badge,
  Card,
  Progress,
  Tooltip,
  message,
  Popconfirm,
  Tabs,
  Avatar,
  Switch,
  Modal,
} from "antd";
import {
  FiPlus,
  FiSearch,
  FiPrinter,
  FiDownload,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiTrendingDown,
  FiDollarSign,
  FiPackage,
  FiBarChart2,
  FiRefreshCw,
  FiArrowLeft,
  FiEdit3,
  FiTrash2,
  FiLayers,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import stockAuditService from "../features/stockAudit/stockAuditService";
import productService from "../features/product/productService";
import CreateAuditModal from "../components/CreateAuditModal";
import ReconcileAuditModal from "../components/ReconcileAuditModal";
import PrintAuditModal from "../components/PrintAuditModal";

const { TextArea } = Input;

// Web Audio API beep for hands-free barcode scanning
const playBeep = (isSuccess = true) => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = isSuccess ? 920 : 320;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {}
};

const SUSPICION_OPTIONS = [
  { value: "NONE", label: "Normal / Not Flagged" },
  { value: "SUSPECTED_UNBILLED_CASH_SALE", label: "🚨 Suspected Unbilled Cash Sale (Staff Pocketed Cash)" },
  { value: "STAFF_THEFT_PILFERAGE", label: "🕵️ Staff Theft / Shoplifting Pilferage" },
  { value: "DAMAGED_EXPIRED_NOT_LOGGED", label: "📦 Damaged / Broken Goods Not Logged" },
  { value: "SUPPLIER_MISCOUNT", label: "🚚 Vendor Delivery Shortage" },
  { value: "BARCODE_SWAP", label: "🏷️ Tag Swapped with Another Product" },
  { value: "SYSTEM_ENTRY_ERROR", label: "💻 Previous Computer Entry Error" },
  { value: "VERIFIED_GENUINE", label: "✅ Verified Normal Variance" },
];

const StockCalculation = () => {
  // Navigation & Sessions
  const [audits, setAudits] = useState([]);
  const [cycleStatus, setCycleStatus] = useState(null);
  const [lifetimeStats, setLifetimeStats] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState(null);
  const [activeAudit, setActiveAudit] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Categories & Brands for filtering
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Workbench Search & Filter States
  const [workbenchSearch, setWorkbenchSearch] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [autoIncrementOnScan, setAutoIncrementOnScan] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [lastScannedItemId, setLastScannedItemId] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedVariantItem, setSelectedVariantItem] = useState(null);

  const barcodeInputRef = useRef(null);

  // Fetch Audits List
  const fetchAudits = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await stockAuditService.getAllAudits({ limit: 50 });
      setAudits(data.audits || []);
      setCycleStatus(data.cycleStatus || null);
      setLifetimeStats(data.lifetimeStats || null);
    } catch (err) {
      console.error("Failed to load audits", err);
      message.error("Failed to load stock audits list.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Fetch Single Audit Details
  const fetchActiveAudit = useCallback(async (id) => {
    if (!id) return;
    setLoadingAudit(true);
    try {
      const res = await stockAuditService.getAuditById(id);
      setActiveAudit(res.audit);
    } catch (err) {
      console.error("Failed to load audit workbench", err);
      message.error("Failed to load audit session details.");
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchAudits();
    // Load categories
    productService.getProducts().then((data) => {
      if (Array.isArray(data)) {
        const cats = [...new Set(data.map((p) => p.category).filter(Boolean))];
        const brs = [...new Set(data.map((p) => p.brand).filter(Boolean))];
        setCategories(cats.map((c) => ({ title: c })));
        setBrands(brs.map((b) => ({ title: b })));
      }
    }).catch(() => {});
  }, [fetchAudits]);

  // When selectedAuditId changes, load it
  useEffect(() => {
    if (selectedAuditId) {
      fetchActiveAudit(selectedAuditId);
    } else {
      setActiveAudit(null);
    }
  }, [selectedAuditId, fetchActiveAudit]);

  // Focus barcode input when workbench opens
  useEffect(() => {
    if (activeAudit && barcodeInputRef.current) {
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
    }
  }, [activeAudit]);

  // Handle Barcode Scan
  const handleBarcodeScan = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim() || !activeAudit) return;

    const code = barcodeInput.trim();
    setBarcodeInput("");

    try {
      const res = await stockAuditService.updateItemCount(activeAudit._id, {
        barcode: code,
        incrementByOne: autoIncrementOnScan,
        countedStock: autoIncrementOnScan ? undefined : 1,
      });

      playBeep(true);
      message.success(res.message);
      setLastScannedItemId(res.updatedItem?._id);

      // Update in activeAudit in-memory for instant UI reactivity
      setActiveAudit((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((i) =>
          i._id === res.updatedItem._id ? res.updatedItem : i
        );
        return {
          ...prev,
          items: newItems,
          ...res.auditSummary,
        };
      });

      // Clear highlight after 3 seconds
      setTimeout(() => setLastScannedItemId(null), 3000);
    } catch (err) {
      playBeep(false);
      message.error(err?.response?.data?.message || `Barcode "${code}" not found in this audit.`);
    } finally {
      setTimeout(() => barcodeInputRef.current?.focus(), 50);
    }
  };

  // Quick Inline Count Change (+, -, or direct input)
  const handleInlineCountChange = async (item, newCount) => {
    if (!activeAudit || activeAudit.status === "RECONCILED") return;
    const sanitized = Math.max(0, Number(newCount) || 0);

    try {
      const res = await stockAuditService.updateItemCount(activeAudit._id, {
        itemId: item._id,
        countedStock: sanitized,
      });

      setActiveAudit((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((i) =>
          i._id === item._id ? res.updatedItem : i
        );
        return {
          ...prev,
          items: newItems,
          ...res.auditSummary,
        };
      });
    } catch (err) {
      message.error("Failed to update count.");
    }
  };

  // Quick Classification Change (Unbilled Cash Sale, Shoplifting, Damaged, etc.)
  const handleSuspicionChange = async (itemId, reason) => {
    if (!activeAudit || activeAudit.status === "RECONCILED") return;
    try {
      await stockAuditService.updateItemInvestigation(activeAudit._id, itemId, {
        suspicionReason: reason,
      });
      setActiveAudit((prev) => {
        if (!prev) return prev;
        const newItems = prev.items.map((i) =>
          i._id === itemId ? { ...i, suspicionReason: reason } : i
        );
        return { ...prev, items: newItems };
      });
      message.success("Classification saved.");
    } catch (err) {
      message.error("Failed to update classification.");
    }
  };

  // Delete Audit Session
  const handleDeleteAudit = async (auditId) => {
    try {
      await stockAuditService.deleteAudit(auditId);
      message.success("Audit session deleted.");
      fetchAudits();
      if (selectedAuditId === auditId) {
        setSelectedAuditId(null);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to delete audit.");
    }
  };

  // Export to Excel for Owner
  const handleExportExcel = () => {
    if (!activeAudit) return;
    const data = (activeAudit.items || []).map((i) => ({
      "Product Name": i.productTitle,
      "Barcode": i.barcode || i.sku || "",
      "Category": i.category || "",
      "Cost Price (₹)": i.costPrice || 0,
      "Selling Price (₹)": i.sellingPrice || 0,
      "Expected System Stock": i.systemStock,
      "Physical Counted Stock": i.isCounted ? i.countedStock : "Not Counted",
      "Discrepancy (Count - System)": i.isCounted ? i.discrepancy : 0,
      "Status": i.status,
      "Capital Cost Loss (₹)": i.costLoss || 0,
      "Unbilled Retail Value (₹)": i.retailLoss || 0,
      "Theft / Fraud Reason": i.suspicionReason || "",
      "Notes": i.investigationNotes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Audit");
    XLSX.writeFile(wb, `${activeAudit.auditNumber}_Stock_Calculation.xlsx`);
  };

  // Filter items in active audit
  const filteredItems = (activeAudit?.items || []).filter((item) => {
    if (workbenchSearch.trim()) {
      const q = workbenchSearch.trim().toLowerCase();
      const match =
        (item.productTitle && item.productTitle.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (categoryFilter && item.category !== categoryFilter) {
      return false;
    }

    if (filterTab === "SHORTAGE") return item.isCounted && item.discrepancy < 0;
    if (filterTab === "SURPLUS") return item.isCounted && item.discrepancy > 0;
    if (filterTab === "MATCHED") return item.isCounted && item.discrepancy === 0;
    if (filterTab === "PENDING") return !item.isCounted;

    return true;
  });

  // Items count badges
  const shortageCount = (activeAudit?.items || []).filter((i) => i.isCounted && i.discrepancy < 0).length;
  const surplusCount = (activeAudit?.items || []).filter((i) => i.isCounted && i.discrepancy > 0).length;
  const matchedCount = (activeAudit?.items || []).filter((i) => i.isCounted && i.discrepancy === 0).length;
  const pendingCount = (activeAudit?.items || []).filter((i) => !i.isCounted).length;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: VIEW 1 - ALL AUDITS DASHBOARD & 6-MONTH CYCLE REMINDER
  // ─────────────────────────────────────────────────────────────────────────────
  if (!selectedAuditId || !activeAudit) {
    const isDue = cycleStatus?.isAuditDue;
    const monthsElapsed = cycleStatus?.monthsSinceLastAudit;

    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl text-xl">🧮</span>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Store Stock Calculation & 6-Month Physical Audit
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Calculate physical store stock, detect unbilled cash sales, stop staff theft, and reconcile inventory.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/stock-alerts"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-700 font-semibold rounded-xl hover:bg-rose-100 border border-rose-200 transition text-sm"
            >
              <FiShield className="text-base" /> Stock Fraud Alerts
            </Link>
            <Button
              type="primary"
              size="large"
              icon={<FiPlus className="text-lg" />}
              onClick={() => setCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl shadow-md shadow-indigo-100"
            >
              Start New Stock Calculation
            </Button>
          </div>
        </div>

        {/* 6-Month Audit Cycle Status Banner */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDue
              ? "bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border-red-200"
              : "bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-emerald-200"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-xl text-2xl flex-shrink-0 ${
                  isDue ? "bg-red-500 text-white shadow-lg shadow-red-200" : "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                }`}
              >
                {isDue ? <FiAlertTriangle /> : <FiCheckCircle />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">
                    6-Month Half-Yearly Store Audit Schedule
                  </h3>
                  <Tag color={isDue ? "error" : "success"} className="font-bold uppercase tracking-wider text-xs">
                    {isDue ? "⚠️ Stock Audit DUE" : "✅ Stock Verified"}
                  </Tag>
                </div>
                <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                  {cycleStatus?.recommendation ||
                    "Store audits must be conducted every 6 months to detect unrecorded cash sales and staff shrinkage."}
                </p>
                {cycleStatus?.lastAudit && (
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                    <span>
                      Last Reconciled: <strong>{new Date(cycleStatus.lastAudit.createdAt).toLocaleDateString()}</strong> ({cycleStatus.lastAudit.title})
                    </span>
                    <span>
                      Missing Pieces Caught: <strong className="text-red-600">{cycleStatus.lastAudit.totalShortageUnits || 0} pcs</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              onClick={() => setCreateModalOpen(true)}
              className={isDue ? "bg-red-600 hover:bg-red-700 font-bold" : "bg-emerald-600 hover:bg-emerald-700 font-bold"}
            >
              {isDue ? "Run Due Stock Calculation Now 🚨" : "Start New Audit Session"}
            </Button>
          </div>
        </div>

        {/* Lifetime Anti-Theft & Shrinkage KPI Cards */}
        {lifetimeStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Audits Completed
              </div>
              <div className="text-2xl font-black text-gray-900 mt-1">
                {lifetimeStats.totalAuditsCompleted || 0}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">Half-Yearly & Annual</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
                <FiAlertTriangle /> Missing Items Caught
              </div>
              <div className="text-2xl font-black text-red-600 mt-1">
                {lifetimeStats.lifetimeMissingUnits || 0} pcs
              </div>
              <div className="text-xs text-red-700/80 mt-0.5">Unbilled sales & theft</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <FiDollarSign /> Unbilled Cash Stolen
              </div>
              <div className="text-2xl font-black text-rose-700 mt-1">
                ₹{(lifetimeStats.lifetimeRetailLoss || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-rose-600/80 mt-0.5">Retail cash pocketed</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Avg Accuracy Rate
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {lifetimeStats.avgAccuracyRate ? Math.round(lifetimeStats.avgAccuracyRate * 10) / 10 : 100}%
              </div>
              <div className="text-xs text-emerald-600 mt-0.5">Store physical match</div>
            </div>
          </div>
        )}

        {/* Audit Sessions History Table */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h2 className="font-bold text-gray-900 text-base">Store Stock Calculation Sessions</h2>
              <p className="text-xs text-gray-500">Every 6-month half-yearly verification and reconciliation history</p>
            </div>
            <Button icon={<FiRefreshCw />} onClick={fetchAudits} loading={loadingList}>
              Refresh
            </Button>
          </div>

          <Table
            dataSource={audits}
            rowKey="_id"
            loading={loadingList}
            pagination={{ pageSize: 10 }}
            className="rounded-b-2xl overflow-hidden"
            columns={[
              {
                title: "Session & Title",
                key: "title",
                render: (_, record) => (
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{record.title}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">
                      {record.auditNumber} • {record.fiscalYear}
                    </div>
                  </div>
                ),
              },
              {
                title: "Cycle",
                dataIndex: "periodType",
                key: "periodType",
                render: (val) => {
                  const labelMap = {
                    HALF_YEARLY_H1: "🗓️ H1 (Apr-Sep)",
                    HALF_YEARLY_H2: "🗓️ H2 (Oct-Mar)",
                    ANNUAL: "🏆 Annual",
                    QUARTERLY: "📊 Quarterly",
                    SURPRISE_AUDIT: "🚨 Surprise",
                  };
                  return <Tag className="font-medium">{labelMap[val] || val}</Tag>;
                },
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (st) => {
                  if (st === "RECONCILED") {
                    return <Tag color="success" className="font-bold">✅ RECONCILED</Tag>;
                  }
                  if (st === "IN_PROGRESS") {
                    return <Tag color="processing" className="font-bold">⏳ IN PROGRESS</Tag>;
                  }
                  return <Tag>{st}</Tag>;
                },
              },
              {
                title: "Physical Count",
                key: "counts",
                render: (_, r) => (
                  <div className="text-xs">
                    <div>
                      Counted: <strong>{r.totalPhysicalUnits || 0}</strong> / {r.totalSystemUnits || 0} pcs
                    </div>
                    <div className="text-gray-400">
                      ({r.totalCountedProducts || 0} of {r.totalProducts || 0} items)
                    </div>
                  </div>
                ),
              },
              {
                title: "Missing / Theft",
                key: "shortage",
                render: (_, r) => (
                  <div>
                    {r.totalShortageUnits > 0 ? (
                      <div>
                        <div className="font-bold text-red-600 text-xs">
                          -{r.totalShortageUnits} pcs missing
                        </div>
                        <div className="text-[11px] text-rose-600 font-medium">
                          ₹{(r.totalRetailLoss || 0).toLocaleString("en-IN")} unbilled
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold">0 missing</span>
                    )}
                  </div>
                ),
              },
              {
                title: "Accuracy",
                dataIndex: "accuracyRate",
                key: "accuracyRate",
                render: (rate) => (
                  <div className="w-24">
                    <div className="text-xs font-bold">{rate || 100}%</div>
                    <Progress
                      percent={rate || 100}
                      size="small"
                      showInfo={false}
                      status={rate < 90 ? "exception" : "normal"}
                      strokeColor={rate >= 95 ? "#10b981" : rate >= 85 ? "#f59e0b" : "#ef4444"}
                    />
                  </div>
                ),
              },
              {
                title: "Audit Date",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (d) => <span className="text-xs text-gray-600">{new Date(d).toLocaleDateString()}</span>,
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record) => (
                  <div className="flex items-center gap-2">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => setSelectedAuditId(record._id)}
                      className={record.status === "RECONCILED" ? "bg-gray-800" : "bg-indigo-600"}
                    >
                      {record.status === "RECONCILED" ? "View Audit Report 📄" : "Open Workbench 🧮"}
                    </Button>
                    {record.status !== "RECONCILED" && (
                      <Popconfirm
                        title="Delete draft audit?"
                        description="Are you sure you want to delete this unfinished audit?"
                        onConfirm={() => handleDeleteAudit(record._id)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<FiTrash2 />} />
                      </Popconfirm>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Modal: Create New Audit */}
        <CreateAuditModal
          open={createModalOpen}
          onCancel={() => setCreateModalOpen(false)}
          onSuccess={(newAudit) => {
            fetchAudits();
            if (newAudit?._id) setSelectedAuditId(newAudit._id);
          }}
          categories={categories}
          brands={brands}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: VIEW 2 - LIVE STOCK COUNTING & CALCULATION WORKBENCH (ACTIVE AUDIT)
  // ─────────────────────────────────────────────────────────────────────────────
  const isReconciled = activeAudit.status === "RECONCILED";

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            icon={<FiArrowLeft />}
            onClick={() => {
              setSelectedAuditId(null);
              fetchAudits();
            }}
            className="rounded-xl font-medium"
          >
            All Audits
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{activeAudit.title}</h1>
              {isReconciled ? (
                <Tag color="success" className="font-bold">✅ RECONCILED & LOCKED</Tag>
              ) : (
                <Tag color="processing" className="font-bold">⏳ COUNTING IN PROGRESS</Tag>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">
              Session: <strong>{activeAudit.auditNumber}</strong> • Cycle: <strong>{activeAudit.periodType}</strong>
              {activeAudit.supervisorStaff && (
                <span className="ml-2 font-sans font-medium text-indigo-600">
                  • Staff in Store: {activeAudit.supervisorStaff}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<FiPrinter />} onClick={() => setPrintModalOpen(true)}>
            Print Sheets
          </Button>
          <Button icon={<FiDownload />} onClick={handleExportExcel}>
            Excel Export
          </Button>
          {!isReconciled && (
            <Button
              type="primary"
              size="large"
              icon={<FiCheckCircle />}
              onClick={() => setReconcileModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl shadow-md shadow-emerald-100"
            >
              Reconcile & Update Shop Stock ⚖️
            </Button>
          )}
        </div>
      </div>

      {/* CLARITY METRICS BAR (Real-Time Physical vs System Stock) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* 1. Expected */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-200">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            System Expected
          </div>
          <div className="text-xl font-black text-gray-900 mt-1">
            {activeAudit.totalSystemUnits || 0} pcs
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            ₹{(activeAudit.totalExpectedValue || 0).toLocaleString("en-IN")} cost
          </div>
        </div>

        {/* 2. Counted */}
        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Physical Counted
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">
            {activeAudit.totalPhysicalUnits || 0} pcs
          </div>
          <div className="text-[11px] text-blue-500 mt-0.5">
            {activeAudit.totalCountedProducts || 0} of {activeAudit.totalProducts || 0} counted
          </div>
        </div>

        {/* 3. Shortage Units (Theft / Unbilled) */}
        <div className="bg-white p-3.5 rounded-xl border border-red-200 bg-red-50/30">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 flex items-center gap-1">
            <FiAlertTriangle /> Missing (Theft)
          </div>
          <div className="text-xl font-black text-red-600 mt-1">
            -{activeAudit.totalShortageUnits || 0} pcs
          </div>
          <div className="text-[11px] text-red-500 mt-0.5">
            {shortageCount} product lines
          </div>
        </div>

        {/* 4. Capital Cost Loss */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-300">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
            Capital Cost Loss
          </div>
          <div className="text-xl font-black text-gray-900 mt-1">
            ₹{(activeAudit.totalCostLoss || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">At purchase rate</div>
        </div>

        {/* 5. Unbilled Cash Pocketed */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-300 bg-rose-50/40">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
            <FiDollarSign /> Unbilled Cash Value
          </div>
          <div className="text-xl font-black text-rose-700 mt-1">
            ₹{(activeAudit.totalRetailLoss || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-rose-600 mt-0.5">Staff cash leakage</div>
        </div>

        {/* 6. Accuracy Rate */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/20">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Store Accuracy %
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {activeAudit.accuracyRate || 100}%
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            Shrinkage: {activeAudit.shrinkageRate || 0}%
          </div>
        </div>
      </div>

      {/* FAST HANDS-FREE BARCODE SCANNER BAR */}
      {!isReconciled && (
        <div className="bg-indigo-900 text-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2.5 bg-indigo-800 rounded-xl text-2xl flex-shrink-0">
              ⚡
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">
                Hands-Free Fast Barcode Scanner Mode
              </div>
              <div className="text-xs text-indigo-200">
                Point any laser / USB barcode scanner or type barcode and press Enter.
              </div>
            </div>
          </div>

          <form onSubmit={handleBarcodeScan} className="flex items-center gap-3 w-full md:w-1/2">
            <Input
              ref={barcodeInputRef}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan or type barcode here..."
              size="large"
              className="rounded-xl font-mono text-base font-bold text-gray-900 bg-white"
            />
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              className="bg-indigo-500 hover:bg-indigo-400 font-bold rounded-xl flex-shrink-0"
            >
              Scan Count
            </Button>
          </form>

          <div className="flex items-center gap-2 flex-shrink-0 text-xs font-medium">
            <span>Auto +1 per scan:</span>
            <Switch
              checked={autoIncrementOnScan}
              onChange={(val) => setAutoIncrementOnScan(val)}
            />
          </div>
        </div>
      )}

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterTab("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTab === "ALL"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Items ({activeAudit.items?.length || 0})
            </button>
            <button
              onClick={() => setFilterTab("SHORTAGE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                filterTab === "SHORTAGE"
                  ? "bg-red-600 text-white shadow-md shadow-red-200"
                  : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              }`}
            >
              🚨 Missing / Theft ({shortageCount})
            </button>
            <button
              onClick={() => setFilterTab("SURPLUS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTab === "SURPLUS"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
              }`}
            >
              ➕ Excess ({surplusCount})
            </button>
            <button
              onClick={() => setFilterTab("MATCHED")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTab === "MATCHED"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200"
              }`}
            >
              ✅ Matched 100% ({matchedCount})
            </button>
            <button
              onClick={() => setFilterTab("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterTab === "PENDING"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              ⏳ Pending Count ({pendingCount})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2">
            <Input
              prefix={<FiSearch className="text-gray-400" />}
              value={workbenchSearch}
              onChange={(e) => setWorkbenchSearch(e.target.value)}
              placeholder="Search product, barcode, SKU..."
              className="rounded-xl w-64"
              allowClear
            />
            <Select
              placeholder="Category"
              value={categoryFilter || undefined}
              onChange={(val) => setCategoryFilter(val || "")}
              className="w-36"
              allowClear
              options={[
                { value: "", label: "All Categories" },
                ...categories.map((c) => ({ value: c.title, label: c.title })),
              ]}
            />
          </div>
        </div>

        {/* INTERACTIVE COUNTING & CALCULATION TABLE */}
        <Table
          dataSource={filteredItems}
          rowKey="_id"
          rowClassName={(record) =>
            record._id === lastScannedItemId
              ? "bg-emerald-100 transition-colors duration-500"
              : record.isCounted && record.discrepancy < 0
              ? "bg-red-50/30"
              : ""
          }
          pagination={{ pageSize: 15 }}
          columns={[
            {
              title: "Product & Code",
              key: "product",
              render: (_, item) => (
                <div className="flex items-center gap-3">
                  <Avatar
                    shape="square"
                    size={42}
                    src={item.productImage}
                    icon={<FiPackage />}
                    className="bg-gray-100 rounded-lg flex-shrink-0"
                  />
                  <div>
                    <div className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1">
                      {item.productTitle}
                    </div>
                    <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono bg-gray-100 px-1 rounded">
                        {item.barcode || item.sku || "No Barcode"}
                      </span>
                      <span>{item.category || "General"}</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              title: "Rates",
              key: "rates",
              render: (_, item) => (
                <div className="text-xs">
                  <div className="text-gray-500">
                    Cost: <strong>₹{item.costPrice}</strong>
                  </div>
                  <div className="text-gray-900 font-medium">
                    MRP: <strong>₹{item.sellingPrice}</strong>
                  </div>
                </div>
              ),
            },
            {
              title: "Expected System",
              dataIndex: "systemStock",
              key: "systemStock",
              align: "center",
              render: (stock) => (
                <span className="font-mono font-bold text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded">
                  {stock} pcs
                </span>
              ),
            },
            {
              title: "Physical Counted",
              key: "physicalCount",
              align: "center",
              render: (_, item) => (
                <div className="flex items-center justify-center gap-1">
                  {!isReconciled ? (
                    <>
                      <Button
                        size="small"
                        onClick={() =>
                          handleInlineCountChange(item, (item.isCounted ? item.countedStock : 0) - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center p-0 text-gray-600 rounded"
                        disabled={!item.isCounted || item.countedStock <= 0}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={item.isCounted ? item.countedStock : ""}
                        placeholder="0"
                        onChange={(e) => handleInlineCountChange(item, e.target.value)}
                        className="w-16 text-center font-bold font-mono text-sm rounded"
                      />
                      <Button
                        size="small"
                        onClick={() =>
                          handleInlineCountChange(item, (item.isCounted ? item.countedStock : 0) + 1)
                        }
                        className="w-7 h-7 flex items-center justify-center p-0 text-indigo-600 rounded bg-indigo-50 font-bold"
                      >
                        +
                      </Button>
                    </>
                  ) : (
                    <span className="font-bold text-sm font-mono text-blue-700">
                      {item.countedStock} pcs
                    </span>
                  )}
                </div>
              ),
            },
            {
              title: "Discrepancy / Variance",
              key: "variance",
              render: (_, item) => {
                if (!item.isCounted) {
                  return <Tag className="text-gray-400">⏳ Uncounted</Tag>;
                }
                const diff = item.discrepancy;
                if (diff < 0) {
                  return (
                    <div>
                      <Tag color="error" className="font-bold text-xs">
                        {diff} pcs (Missing / Theft)
                      </Tag>
                      <div className="text-[11px] text-red-600 font-semibold mt-0.5">
                        ₹{item.costLoss?.toLocaleString("en-IN")} Cost Loss | ₹{item.retailLoss?.toLocaleString("en-IN")} Unbilled Cash
                      </div>
                    </div>
                  );
                }
                if (diff > 0) {
                  return (
                    <div>
                      <Tag color="blue" className="font-bold text-xs">
                        +{diff} pcs (Excess)
                      </Tag>
                      <div className="text-[11px] text-blue-600 mt-0.5">
                        +₹{item.surplusCost?.toLocaleString("en-IN")} Extra Value
                      </div>
                    </div>
                  );
                }
                return (
                  <Tag color="success" className="font-bold text-xs">
                    ✅ 100% Match (0)
                  </Tag>
                );
              },
            },
            {
              title: "Theft / Discrepancy Classification",
              key: "suspicion",
              render: (_, item) => {
                if (!item.isCounted || item.discrepancy >= 0) {
                  return <span className="text-xs text-gray-400">-</span>;
                }
                return (
                  <Select
                    value={item.suspicionReason || "SUSPECTED_UNBILLED_CASH_SALE"}
                    onChange={(val) => handleSuspicionChange(item._id, val)}
                    disabled={isReconciled}
                    className="w-56 text-xs"
                    options={SUSPICION_OPTIONS}
                  />
                );
              },
            },
            {
              title: "Notes",
              key: "notes",
              render: (_, item) => (
                <div className="text-xs text-gray-500 max-w-[150px] truncate" title={item.investigationNotes}>
                  {item.investigationNotes || <span className="text-gray-300 italic">No notes</span>}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modals */}
      <ReconcileAuditModal
        open={reconcileModalOpen}
        audit={activeAudit}
        onCancel={() => setReconcileModalOpen(false)}
        onSuccess={(updated) => {
          setActiveAudit(updated);
          fetchAudits();
        }}
      />

      <PrintAuditModal
        open={printModalOpen}
        audit={activeAudit}
        onCancel={() => setPrintModalOpen(false)}
      />
    </div>
  );
};

export default StockCalculation;
