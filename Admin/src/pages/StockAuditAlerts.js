import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Avatar,
  message,
  Tooltip,
  Popconfirm,
  Popover,
  Tabs,
} from "antd";
import {
  FiShield,
  FiAlertTriangle,
  FiSearch,
  FiDownload,
  FiUser,
  FiPackage,
  FiRefreshCw,
  FiDollarSign,
  FiEye,
  FiCheckCircle,
  FiFilter,
  FiLayers,
  FiCheck,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import productService from "../features/product/productService";
import api from "../utils/axiosconfig";
import { PREDEFINED_REASONS } from "../components/StockReductionReasonModal";

const { TextArea } = Input;

const StockAuditAlerts = () => {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Active Category Tab
  const [activeTab, setActiveTab] = useState("all");

  // Filters
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [changeTypeFilter, setChangeTypeFilter] = useState("");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [auditStatus, setAuditStatus] = useState("VERIFIED_GENUINE");
  const [investigationNotes, setInvestigationNotes] = useState("");
  const [updatingAudit, setUpdatingAudit] = useState(false);

  // Fetch summary & staff
  const fetchSummary = useCallback(async () => {
    try {
      const data = await productService.getStockLogsSummary();
      setSummary(data);
      if (typeof data?.pendingReviewsCount === "number") {
        window.dispatchEvent(
          new CustomEvent("stock_alerts_changed", { detail: data.pendingReviewsCount })
        );
      }
    } catch (err) {
      console.error("Failed to fetch stock logs summary", err);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const res = await api.get("staff/");
      if (Array.isArray(res.data)) {
        setStaffList(res.data);
      }
    } catch (err) {}
  }, []);

  // Fetch logs with filters
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: 500, // Load comprehensive data for returns & damage
      };

      if (changeTypeFilter) {
        params.changeType = changeTypeFilter;
      }
      if (statusFilter) params.auditStatus = statusFilter;
      if (reasonFilter) params.reason = reasonFilter;
      if (staffFilter) params.staffName = staffFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      // Date ranges
      const now = new Date();
      if (dateFilter === "today") {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.startDate = d.toISOString();
      } else if (dateFilter === "yesterday") {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        params.startDate = d.toISOString();
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        params.endDate = end.toISOString();
      } else if (dateFilter === "week") {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.startDate = d.toISOString();
      } else if (dateFilter === "month") {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        params.startDate = d.toISOString();
      }

      const res = await productService.getStockLogs(params);
      setLogs(res.logs || []);
    } catch (err) {
      console.error("Error fetching logs", err);
      message.error("Failed to fetch stock audit alerts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, reasonFilter, staffFilter, debouncedSearch, dateFilter, changeTypeFilter]);

  useEffect(() => {
    fetchSummary();
    fetchStaff();
  }, [fetchSummary, fetchStaff]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle open review modal
  const openReviewModal = (log) => {
    setSelectedLog(log);
    setAuditStatus(log.auditStatus === "PENDING_REVIEW" ? "VERIFIED_GENUINE" : log.auditStatus);
    setInvestigationNotes(log.investigationNotes || "");
    setReviewModalOpen(true);
  };

  // Submit review
  const handleSaveReview = async () => {
    if (!selectedLog) return;
    setUpdatingAudit(true);
    try {
      await productService.updateStockLogAudit({
        logId: selectedLog._id,
        data: {
          auditStatus,
          investigationNotes,
        },
      });
      message.success("Audit status updated successfully!");
      setReviewModalOpen(false);
      fetchLogs();
      fetchSummary();
    } catch (err) {
      message.error("Failed to update audit status");
    } finally {
      setUpdatingAudit(false);
    }
  };

  // Quick verify
  const handleQuickVerify = async (logId) => {
    try {
      await productService.updateStockLogAudit({
        logId,
        data: {
          auditStatus: "VERIFIED_GENUINE",
          investigationNotes: "Quick verified by store owner",
        },
      });
      message.success("Marked as verified genuine");
      fetchLogs();
      fetchSummary();
    } catch (err) {
      message.error("Failed to verify");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setReasonFilter("");
    setStaffFilter("");
    setDateFilter("all");
    setChangeTypeFilter("");
    setActiveTab("all");
  };

  const hasActiveFilters = Boolean(
    searchText || statusFilter || reasonFilter || staffFilter || dateFilter !== "all" || changeTypeFilter || activeTab !== "all"
  );

  // Dynamic counts for quick filter tabs
  const tabCounts = useMemo(() => {
    let damaged = 0;
    let returns = 0;
    let discrepancy = 0;
    let pending = 0;
    let fraud = 0;

    (logs || []).forEach((l) => {
      const rLower = (l.reason || "").toLowerCase();
      if (rLower.includes("damaged") || rLower.includes("defective") || rLower.includes("ખરાબ")) {
        damaged++;
      }
      if (
        rLower.includes("exchange") ||
        rLower.includes("return") ||
        rLower.includes("ગ્રાહક") ||
        l.changeType === "MANUAL_ADD"
      ) {
        returns++;
      }
      if (
        rLower.includes("audit") ||
        rLower.includes("discrepancy") ||
        rLower.includes("correction") ||
        rLower.includes("recount") ||
        l.changeType === "AUDIT_ADJUSTMENT"
      ) {
        discrepancy++;
      }
      if (l.auditStatus === "PENDING_REVIEW") pending++;
      if (l.auditStatus === "SUSPECTED_FRAUD") fraud++;
    });

    return {
      total: logs.length,
      damaged,
      returns,
      discrepancy,
      pending,
      fraud,
    };
  }, [logs]);

  // Filtered logs by active tab
  const filteredLogs = useMemo(() => {
    if (activeTab === "all") return logs;
    if (activeTab === "damaged") {
      return logs.filter((l) => {
        const rLower = (l.reason || "").toLowerCase();
        return rLower.includes("damaged") || rLower.includes("defective") || rLower.includes("ખરાબ");
      });
    }
    if (activeTab === "returns") {
      return logs.filter((l) => {
        const rLower = (l.reason || "").toLowerCase();
        return (
          rLower.includes("exchange") ||
          rLower.includes("return") ||
          rLower.includes("ગ્રાહક") ||
          l.changeType === "MANUAL_ADD"
        );
      });
    }
    if (activeTab === "discrepancy") {
      return logs.filter((l) => {
        const rLower = (l.reason || "").toLowerCase();
        return (
          rLower.includes("audit") ||
          rLower.includes("discrepancy") ||
          rLower.includes("correction") ||
          rLower.includes("recount") ||
          l.changeType === "AUDIT_ADJUSTMENT"
        );
      });
    }
    if (activeTab === "pending") {
      return logs.filter((l) => l.auditStatus === "PENDING_REVIEW");
    }
    if (activeTab === "fraud") {
      return logs.filter((l) => l.auditStatus === "SUSPECTED_FRAUD");
    }
    return logs;
  }, [logs, activeTab]);

  // Export CSV
  const exportCSV = () => {
    if (!filteredLogs.length) {
      message.warning("No records to export");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Product Name",
      "Barcode",
      "SKU",
      "Color & Size Breakdown",
      "Change Type",
      "Previous Stock",
      "New Stock",
      "Quantity Change",
      "Unit Price (INR)",
      "Cash Value at Risk (INR)",
      "Reason",
      "Notes",
      "Staff Name",
      "Handled By Account",
      "Audit Status",
      "Investigation Notes",
    ];

    const rows = filteredLogs.map((l) => {
      const d = new Date(l.createdAt);
      const variantStr =
        l.itemsBreakdown && l.itemsBreakdown.length > 0
          ? l.itemsBreakdown
              .map(
                (it) =>
                  `${it.color ? it.color + " " : ""}${it.size ? "Size: " + it.size + " " : ""}(${
                    it.reducedUnits ? "-" + it.reducedUnits : l.diffQuantity
                  })`
              )
              .join("; ")
          : l.variantDetails?.color || l.variantDetails?.size
          ? `${l.variantDetails.color || ""} ${l.variantDetails.size ? "Size: " + l.variantDetails.size : ""}`
          : "Standard";

      return [
        `"${d.toLocaleDateString("en-IN")}"`,
        `"${d.toLocaleTimeString("en-IN")}"`,
        `"${(l.productTitle || "").replace(/"/g, '""')}"`,
        `"${(l.barcode || "").replace(/"/g, '""')}"`,
        `"${(l.sku || "").replace(/"/g, '""')}"`,
        `"${variantStr.replace(/"/g, '""')}"`,
        `"${l.changeType || "MANUAL_REDUCE"}"`,
        l.previousStock,
        l.newStock,
        l.diffQuantity,
        l.unitPrice || 0,
        l.potentialLossAmount || 0,
        `"${(l.reason || "").replace(/"/g, '""')}"`,
        `"${(l.notes || "").replace(/"/g, '""')}"`,
        `"${(l.staffName || "").replace(/"/g, '""')}"`,
        `"${(l.performedBy?.name || "").replace(/"/g, '""')}"`,
        l.auditStatus,
        `"${(l.investigationNotes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `stock_audit_alerts_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Stylized reason badge
  const renderReasonBadge = (reason) => {
    if (!reason) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          General
        </span>
      );
    }
    const lower = reason.toLowerCase();
    if (lower.includes("damaged") || lower.includes("defective") || lower.includes("ખરાબ")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span>⚠️</span> Damaged / Defective
        </span>
      );
    }
    if (lower.includes("exchange") || lower.includes("return") || lower.includes("ગ્રાહક")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span>🔄</span> Customer Return Scrap
        </span>
      );
    }
    if (lower.includes("audit") || lower.includes("discrepancy") || lower.includes("ઓડિટ")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <span>🔍</span> Audit Discrepancy
        </span>
      );
    }
    if (lower.includes("theft") || lower.includes("missing") || lower.includes("ચોરી")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-300">
          <span>🚨</span> Suspected Theft
        </span>
      );
    }
    if (lower.includes("expired") || lower.includes("discarded") || lower.includes("જૂનો")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
          <span>⏳</span> Expired Stock
        </span>
      );
    }
    if (lower.includes("display") || lower.includes("sample")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <span>🏷️</span> Store Display
        </span>
      );
    }
    if (lower.includes("correction") || lower.includes("recount")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span>✏️</span> Recount Correction
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <span>📝</span> {reason}
      </span>
    );
  };

  // Table Columns with Fixed Pixel Widths to completely prevent breakage
  const columns = [
    {
      title: "Date & Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      render: (date) => {
        const d = new Date(date);
        return (
          <div className="flex flex-col text-xs leading-snug">
            <span className="font-bold text-gray-900">
              {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-gray-400 font-medium">
              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      title: "Product Info",
      key: "product",
      width: 270,
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size={46}
            src={r.productImage}
            icon={<FiPackage />}
            className="rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0 object-cover"
          />
          <div className="min-w-0 flex-1">
            <Tooltip title={r.productTitle} placement="topLeft">
              <Link
                to={`/admin/product/${r.productId}`}
                className="font-bold text-gray-900 text-xs hover:text-indigo-600 block truncate"
              >
                {r.productTitle}
              </Link>
            </Tooltip>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1 flex-wrap">
              {r.barcode && (
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-700 border border-gray-200">
                  #{r.barcode}
                </span>
              )}
              {r.category && <span>• {r.category}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Stock Changed",
      key: "stockDelta",
      width: 150,
      sorter: (a, b) => a.diffQuantity - b.diffQuantity,
      render: (_, r) => {
        const isReduction = r.diffQuantity < 0;
        const isAddition = r.diffQuantity > 0;
        const qty = Math.abs(r.diffQuantity || 0);

        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono">
              <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                {r.previousStock}
              </span>
              <span className="text-gray-400">➔</span>
              <span className="font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded text-[11px] border border-gray-200 shadow-2xs">
                {r.newStock}
              </span>
            </div>
            {isReduction && (
              <span className="inline-flex items-center gap-1 font-bold text-[11px] text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full w-fit">
                🔻 -{qty} {qty === 1 ? "unit" : "units"}
              </span>
            )}
            {isAddition && (
              <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                🟢 +{qty} {qty === 1 ? "unit" : "units"}
              </span>
            )}
            {!isReduction && !isAddition && (
              <span className="text-xs text-gray-400 font-medium">No Change</span>
            )}
          </div>
        );
      },
    },
    {
      title: "Color / Size Variants",
      key: "variants",
      width: 220,
      render: (_, r) => {
        const items = r.itemsBreakdown || [];
        if (items.length > 0) {
          if (items.length === 1) {
            const item = items[0];
            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.color && (
                  <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200">
                    🎨 {item.color}
                  </span>
                )}
                {item.size && (
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                    {item.size}
                  </span>
                )}
                <span className="text-[11px] font-bold text-red-600">
                  (-{item.reducedUnits || Math.abs(r.diffQuantity)})
                </span>
              </div>
            );
          }

          // Multiple variants damaged or returned: Clean Popover Pill
          const totalUnits = items.reduce((sum, it) => sum + (it.reducedUnits || 0), 0);
          return (
            <Popover
              placement="top"
              title={
                <div className="font-bold text-xs text-gray-900 border-b pb-1">
                  Variants Breakdown ({items.length} items)
                </div>
              }
              content={
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs min-w-[220px]">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 bg-gray-50 px-2.5 py-1.5 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-1.5">
                        {it.color && <span className="font-medium text-gray-700">🎨 {it.color}</span>}
                        {it.size && (
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-1 rounded border border-indigo-100">
                            {it.size}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-red-600">
                        -{it.reducedUnits || 1} pcs
                      </span>
                    </div>
                  ))}
                </div>
              }
            >
              <div className="cursor-pointer inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-semibold transition">
                <span>📦 {items.length} Variants</span>
                <span className="text-[10px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.2 rounded-full font-bold">
                  -{totalUnits || Math.abs(r.diffQuantity)} pcs
                </span>
                <FiEye className="text-indigo-500" size={11} />
              </div>
            </Popover>
          );
        }

        if (r.variantDetails?.color || r.variantDetails?.size) {
          return (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {r.variantDetails.color && (
                <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-[11px] border border-gray-200">
                  🎨 {r.variantDetails.color}
                </span>
              )}
              {r.variantDetails.size && (
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                  {r.variantDetails.size}
                </span>
              )}
            </div>
          );
        }

        return <span className="text-gray-400 text-xs italic">Standard Product</span>;
      },
    },
    {
      title: "Value at Risk",
      key: "potentialLoss",
      width: 140,
      sorter: (a, b) => (a.potentialLossAmount || 0) - (b.potentialLossAmount || 0),
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-bold text-red-600 text-sm">
            ₹{(r.potentialLossAmount || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            @ ₹{(r.unitPrice || 0).toLocaleString()} / unit
          </span>
        </div>
      ),
    },
    {
      title: "Reason & Notes",
      key: "reason",
      width: 240,
      render: (_, r) => (
        <div className="flex flex-col gap-1.5 max-w-[220px]">
          <div>{renderReasonBadge(r.reason)}</div>
          {r.notes ? (
            <Tooltip title={r.notes} placement="topLeft">
              <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 truncate block font-medium">
                "{r.notes}"
              </span>
            </Tooltip>
          ) : (
            <span className="text-xs text-gray-400 italic">No notes provided</span>
          )}
        </div>
      ),
    },
    {
      title: "Staff & Account",
      key: "staff",
      width: 160,
      render: (_, r) => (
        <div className="flex flex-col text-xs leading-snug">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <FiUser size={12} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{r.staffName || "Staff"}</span>
          </div>
          {r.performedBy?.name && (
            <span className="text-[11px] text-gray-400 mt-0.5 truncate" title={`Login: ${r.performedBy.name}`}>
              User: {r.performedBy.name}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Audit Status",
      dataIndex: "auditStatus",
      key: "auditStatus",
      width: 150,
      render: (status, r) => {
        if (status === "VERIFIED_GENUINE") {
          return (
            <div className="flex flex-col gap-0.5">
              <Tag color="success" className="font-bold text-xs rounded-full m-0 w-fit px-2.5 py-0.5 border-green-300">
                ✓ Verified Genuine
              </Tag>
              {r.investigationNotes && (
                <span className="text-[10px] text-gray-400 truncate max-w-[130px]" title={r.investigationNotes}>
                  {r.investigationNotes}
                </span>
              )}
            </div>
          );
        }
        if (status === "SUSPECTED_FRAUD") {
          return (
            <div className="flex flex-col gap-0.5">
              <Tag color="error" className="font-bold text-xs rounded-full m-0 w-fit px-2.5 py-0.5 animate-pulse border-red-300">
                🚨 Suspected Fraud
              </Tag>
              {r.investigationNotes && (
                <span className="text-[10px] text-red-600 font-semibold truncate max-w-[130px]" title={r.investigationNotes}>
                  {r.investigationNotes}
                </span>
              )}
            </div>
          );
        }
        return (
          <Tag color="warning" className="font-semibold text-xs rounded-full m-0 w-fit px-2.5 py-0.5 border-amber-300">
            ⏳ Pending Review
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "action",
      fixed: "right",
      width: 160,
      render: (_, r) => (
        <div className="flex items-center gap-1.5">
          {r.auditStatus === "PENDING_REVIEW" && (
            <Popconfirm
              title="Verify as Genuine?"
              description="Confirm this return / damage adjustment is genuine."
              onConfirm={() => handleQuickVerify(r._id)}
              okText="Verify"
              cancelText="Cancel"
            >
              <Button
                size="small"
                type="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2 h-7 rounded-lg font-semibold border-0"
              >
                Verify
              </Button>
            </Popconfirm>
          )}

          <Button
            size="small"
            onClick={() => openReviewModal(r)}
            className="text-xs px-2.5 h-7 rounded-lg border-gray-300 hover:border-indigo-500 font-medium text-gray-700"
          >
            Review
          </Button>

          <Tooltip title="View in Catalog">
            <Link
              to={`/admin/product/${r.productId}`}
              className="text-gray-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-gray-100 transition inline-flex"
            >
              <FiEye size={15} />
            </Link>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {/* Scoped CSS to enforce crisp table layout without breaking */}
      <style>{`
        .stock-audit-table .ant-table {
          font-family: inherit;
        }
        .stock-audit-table .ant-table-thead > tr > th {
          background: #f1f5f9 !important;
          color: #334155 !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          letter-spacing: 0.3px !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding: 12px 14px !important;
        }
        .stock-audit-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 12px 14px !important;
          vertical-align: middle !important;
        }
        .stock-audit-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .stock-audit-table .ant-table-expanded-row > td {
          padding: 0 !important;
          background: #f8fafc !important;
        }
        .stock-audit-table .ant-pagination {
          padding: 14px 20px !important;
          margin: 0 !important;
          background: #fff;
          border-top: 1px solid #f1f5f9;
        }
      `}</style>

      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-400 text-white flex items-center justify-center text-xl shadow-md">
              <FiShield />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                Stock Audit, Returns & Damage Control Center
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitor returns, defective piece write-offs, physical damage, and prevent unrecorded cash transactions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/admin/stock-calculation"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 border border-indigo-200 text-xs transition shadow-2xs"
          >
            <span>🧮</span> 6-Month Stock Calculation
          </Link>
          <Button
            icon={<FiRefreshCw />}
            onClick={() => {
              fetchLogs();
              fetchSummary();
            }}
            loading={loading}
            className="rounded-xl text-xs font-semibold"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FiDownload />}
            onClick={exportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold border-0 shadow-sm"
          >
            Export CSV ({filteredLogs.length})
          </Button>
        </div>
      </div>

      {/* Fraud & Return Safeguard Info Banner */}
      <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-indigo-500/10 border border-amber-300/60 rounded-2xl p-4 mb-6 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 flex-shrink-0 shadow-xs">
            <FiAlertTriangle size={18} />
          </div>
          <div className="text-xs text-gray-700 leading-relaxed">
            <strong className="block text-gray-900 font-bold mb-0.5">
              🛡️ Return & Damaged Stock Integrity System:
            </strong>
            Every customer return, exchange scrap, or manual stock write-off is logged with variant breakdown,
            cash value risk, and authorizing staff member. Use the category tabs below to isolate Damaged Stock or
            Customer Returns and sign off with verified audit notes.
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">
              Total Audit Logs
            </span>
            <span className="text-2xl font-black text-gray-900">
              {summary?.totalReductionsCount || logs.length}
            </span>
            <div className="mt-1 text-[11px] text-gray-500">
              Today: <strong className="text-indigo-600">{summary?.todayReductionsCount || 0} logs</strong>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-xs">
            <FiPackage />
          </div>
        </div>

        {/* Card 2: Units Deducted */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">
              Total Units Altered
            </span>
            <span className="text-2xl font-black text-gray-900">
              {summary?.totalUnitsReduced || 0}
            </span>
            <div className="mt-1 text-[11px] text-gray-500">Physical inventory adjusted</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl shadow-xs">
            <FiAlertTriangle />
          </div>
        </div>

        {/* Card 3: Total Cash Value */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">
              Unaccounted Cash Risk
            </span>
            <span className="text-2xl font-black text-rose-600">
              ₹{(summary?.totalPotentialLoss || 0).toLocaleString()}
            </span>
            <div className="mt-1 text-[11px] text-gray-500">Value of reduced / scrap stock</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shadow-xs">
            <FiDollarSign />
          </div>
        </div>

        {/* Card 4: Pending Review Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 block mb-1 uppercase tracking-wider">
              Pending Verification
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-600">
                {summary?.pendingReviewsCount || tabCounts.pending}
              </span>
              {summary?.suspectedFraudCount > 0 && (
                <Tag color="error" className="m-0 font-bold text-[11px] rounded-full">
                  {summary.suspectedFraudCount} Fraud Flags
                </Tag>
              )}
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">Requires owner verification</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-xs">
            <FiShield />
          </div>
        </div>
      </div>

      {/* Category Quick Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <FiLayers size={13} />
            <span>All Records</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "all" ? "bg-slate-700 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              {tabCounts.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("damaged")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "damaged"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
            }`}
          >
            <span>⚠️</span>
            <span>Damaged & Defective</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "damaged" ? "bg-rose-800 text-white" : "bg-rose-200 text-rose-900"
              }`}
            >
              {tabCounts.damaged}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("returns")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "returns"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
            }`}
          >
            <span>🔄</span>
            <span>Customer Returns & Scrap</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "returns" ? "bg-amber-800 text-white" : "bg-amber-200 text-amber-900"
              }`}
            >
              {tabCounts.returns}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("discrepancy")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "discrepancy"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
            }`}
          >
            <span>🔍</span>
            <span>Audit Discrepancies</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "discrepancy" ? "bg-indigo-800 text-white" : "bg-indigo-200 text-indigo-900"
              }`}
            >
              {tabCounts.discrepancy}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-yellow-600 text-white shadow-xs"
                : "bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200"
            }`}
          >
            <span>⏳</span>
            <span>Pending Review</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "pending" ? "bg-yellow-800 text-white" : "bg-yellow-200 text-yellow-900"
              }`}
            >
              {tabCounts.pending}
            </span>
          </button>

          {tabCounts.fraud > 0 && (
            <button
              onClick={() => setActiveTab("fraud")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "fraud"
                  ? "bg-red-700 text-white shadow-xs"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 animate-pulse"
              }`}
            >
              <span>🚨</span>
              <span>Suspected Fraud</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "fraud" ? "bg-red-900 text-white" : "bg-red-200 text-red-900"
                }`}
              >
                {tabCounts.fraud}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <Input
              placeholder="Search product, barcode, staff, notes..."
              prefix={<FiSearch className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64 rounded-xl text-xs"
              allowClear
            />

            {/* Change Type Filter */}
            <Select
              placeholder="Change Type"
              value={changeTypeFilter || undefined}
              onChange={(v) => setChangeTypeFilter(v || "")}
              className="w-40 text-xs"
              allowClear
              options={[
                { value: "", label: "All Types" },
                { value: "MANUAL_REDUCE", label: "🔻 Reductions (Damage/Lost)" },
                { value: "MANUAL_ADD", label: "🟢 Additions (Return/Restock)" },
                { value: "AUDIT_ADJUSTMENT", label: "⚖️ Audit Adjustments" },
              ]}
            />

            {/* Status Filter */}
            <Select
              placeholder="Audit Status"
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v || "")}
              className="w-36 text-xs"
              allowClear
              options={[
                { value: "", label: "All Statuses" },
                { value: "PENDING_REVIEW", label: "⏳ Pending Review" },
                { value: "VERIFIED_GENUINE", label: "✓ Verified Genuine" },
                { value: "SUSPECTED_FRAUD", label: "🚨 Suspected Fraud" },
              ]}
            />

            {/* Reason Filter */}
            <Select
              placeholder="Filter by Reason"
              value={reasonFilter || undefined}
              onChange={(v) => setReasonFilter(v || "")}
              className="w-44 text-xs"
              allowClear
              options={[
                { value: "", label: "All Reasons" },
                ...PREDEFINED_REASONS.map((r) => ({ value: r.value, label: r.label })),
              ]}
            />

            {/* Staff Filter */}
            {staffList.length > 0 && (
              <Select
                placeholder="Filter by Staff"
                value={staffFilter || undefined}
                onChange={(v) => setStaffFilter(v || "")}
                className="w-36 text-xs"
                allowClear
                options={[
                  { value: "", label: "All Staff" },
                  ...staffList.map((s) => ({ value: s.name, label: s.name })),
                ]}
              />
            )}

            {/* Date Filter */}
            <Select
              value={dateFilter}
              onChange={(v) => setDateFilter(v)}
              className="w-32 text-xs"
              options={[
                { value: "all", label: "All Time" },
                { value: "today", label: "Today" },
                { value: "yesterday", label: "Yesterday" },
                { value: "week", label: "Last 7 Days" },
                { value: "month", label: "This Month" },
              ]}
            />

            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                size="small"
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 rounded-lg font-semibold"
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div>
            <span className="text-xs text-gray-500 font-medium">
              Showing <strong className="text-gray-900">{filteredLogs.length}</strong> of{" "}
              <strong>{logs.length}</strong> logs
            </span>
          </div>
        </div>
      </div>

      {/* Main Table with Fixed Pixel Layout & Expandable Rows */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredLogs.map((l) => ({ ...l, key: l._id }))}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} records`,
          }}
          size="middle"
          className="stock-audit-table"
          tableLayout="fixed"
          scroll={{ x: 1600 }}
          expandable={{
            rowExpandable: (record) =>
              (record.itemsBreakdown && record.itemsBreakdown.length > 0) ||
              Boolean(record.notes) ||
              Boolean(record.investigationNotes),
            expandedRowRender: (record) => (
              <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 m-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">
                      📋 Detailed Audit Breakdown:{" "}
                      <strong className="text-indigo-700">{record.productTitle}</strong>
                    </span>
                    {record.barcode && (
                      <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                        Barcode: #{record.barcode}
                      </span>
                    )}
                    {record.sku && (
                      <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                        SKU: {record.sku}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Staff Handler: <strong className="text-slate-800">{record.staffName || "Staff"}</strong>
                    {record.performedBy?.name && <span> (Account: {record.performedBy.name})</span>}
                  </div>
                </div>

                {record.itemsBreakdown && record.itemsBreakdown.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
                      Color & Size Itemized Units Affected ({record.itemsBreakdown.length} variants):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                      {record.itemsBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            {item.color && (
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                                🎨 {item.color}
                              </span>
                            )}
                            {item.size && (
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">
                                Size: {item.size}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.oldStock ?? "-"} ➔ {item.newStock ?? "-"}
                            </div>
                            <div className="text-xs font-bold text-red-600">
                              -{item.reducedUnits || 1} pcs
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {record.notes && (
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 text-xs text-slate-700">
                    <strong className="text-amber-900 block mb-0.5">Staff Remark / Description:</strong>
                    <span className="italic font-medium">"{record.notes}"</span>
                  </div>
                )}

                {record.investigationNotes && (
                  <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200/60 text-xs text-slate-700">
                    <strong className="text-indigo-900 block mb-0.5">Owner Audit & CCTV Notes:</strong>
                    <span className="font-medium">{record.investigationNotes}</span>
                  </div>
                )}
              </div>
            ),
          }}
          rowClassName={(record) =>
            record.auditStatus === "SUSPECTED_FRAUD"
              ? "bg-red-50/40 hover:bg-red-50/60"
              : record.auditStatus === "PENDING_REVIEW"
              ? "bg-amber-50/20 hover:bg-amber-50/40"
              : ""
          }
        />
      </div>

      {/* Audit Investigation & Review Modal */}
      <Modal
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        centered
        width={560}
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiShield size={16} />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">
              Review Stock Reduction / Return Audit
            </span>
          </div>
        }
      >
        {selectedLog && (
          <div className="py-2">
            {/* Overview Box */}
            <div className="bg-gray-50 p-3.5 rounded-2xl mb-4 border border-gray-200 flex items-center justify-between text-xs">
              <div className="min-w-0 pr-3">
                <strong className="block text-gray-900 font-bold mb-1 truncate text-sm">
                  {selectedLog.productTitle}
                </strong>
                <span className="text-gray-500">
                  {selectedLog.diffQuantity < 0
                    ? `Reduced by ${Math.abs(selectedLog.diffQuantity)} units`
                    : `Added ${selectedLog.diffQuantity} units`}{" "}
                  by <strong>{selectedLog.staffName || "Staff"}</strong>
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-red-600 font-black text-base block">
                  ₹{(selectedLog.potentialLossAmount || 0).toLocaleString()}
                </span>
                <span className="text-gray-400 text-[11px]">Cash Value</span>
              </div>
            </div>

            {/* Specific Color & Size Breakdown if available */}
            {((selectedLog.itemsBreakdown && selectedLog.itemsBreakdown.length > 0) ||
              selectedLog.variantDetails?.color ||
              selectedLog.variantDetails?.size) && (
              <div className="mb-4 p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs">
                <span className="text-indigo-900 font-bold block mb-2">Color & Size Breakdown:</span>
                {selectedLog.itemsBreakdown && selectedLog.itemsBreakdown.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedLog.itemsBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-indigo-100 shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          {item.color && (
                            <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded text-xs border border-gray-200">
                              🎨 {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs border border-indigo-100">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-red-600 font-mono">
                          {item.oldStock} ➔ {item.newStock} (-
                          {item.reducedUnits || Math.abs(selectedLog.diffQuantity)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedLog.variantDetails?.color && (
                      <span className="font-bold text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        🎨 {selectedLog.variantDetails.color}
                      </span>
                    )}
                    {selectedLog.variantDetails?.size && (
                      <span className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-100">
                        Size: {selectedLog.variantDetails.size}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Staff's declared reason */}
            <div className="mb-4 p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-xs">
              <span className="text-amber-900 font-bold block mb-1">Declared Reason:</span>
              <div className="mb-1">{renderReasonBadge(selectedLog.reason)}</div>
              {selectedLog.notes && (
                <p className="mt-1.5 text-gray-700 italic font-medium bg-white/60 p-2 rounded-lg border border-amber-200/40">
                  "{selectedLog.notes}"
                </p>
              )}
            </div>

            {/* Verification Status Selector */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Owner Audit Decision:
              </label>
              <Select
                value={auditStatus}
                onChange={(v) => setAuditStatus(v)}
                className="w-full"
                size="large"
                options={[
                  {
                    value: "VERIFIED_GENUINE",
                    label: "✓ Verified Genuine (Piece damaged / return accounted for)",
                  },
                  {
                    value: "SUSPECTED_FRAUD",
                    label: "🚨 Suspected Fraud (Possible cash theft / missing bill)",
                  },
                  {
                    value: "PENDING_REVIEW",
                    label: "⏳ Pending Review (Need to check CCTV / counter bills)",
                  },
                ]}
              />
            </div>

            {/* Investigation Notes */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Owner Investigation & CCTV Notes:
              </label>
              <TextArea
                rows={3}
                placeholder="e.g., 'Checked CCTV at counter at 11:30 AM - return confirmed with bill #104' or 'Defective piece inspected in backroom'"
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <Button onClick={() => setReviewModalOpen(false)} disabled={updatingAudit} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="primary"
                loading={updatingAudit}
                onClick={handleSaveReview}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-xs border-0 px-4"
              >
                Save Audit Decision
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockAuditAlerts;
