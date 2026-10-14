import React, { useState, useEffect, useCallback } from "react";
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

  // Filters
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [staffFilter, setStaffFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  // Debounce search input to drastically reduce API calls while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 400);
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
        changeType: "MANUAL_REDUCE", // focus on reductions
        limit: 100,
      };

      if (statusFilter) params.auditStatus = statusFilter;
      if (reasonFilter) params.reason = reasonFilter;
      if (staffFilter) params.staffName = staffFilter;
      if (debouncedSearch) params.search = debouncedSearch;

      // Date ranges
      const now = new Date();
      if (dateFilter === "today") {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.startDate = d.toISOString();
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
  }, [statusFilter, reasonFilter, staffFilter, debouncedSearch, dateFilter]);

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

  // Export CSV
  const exportCSV = () => {
    if (!logs.length) {
      message.warning("No logs to export");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Product Name",
      "Barcode",
      "SKU",
      "Color & Size Breakdown",
      "Previous Stock",
      "New Stock",
      "Units Reduced",
      "Unit Price (INR)",
      "Cash Value at Risk (INR)",
      "Reason",
      "Notes",
      "Staff Name",
      "Handled By Account",
      "Audit Status",
      "Investigation Notes",
    ];

    const rows = logs.map((l) => {
      const d = new Date(l.createdAt);
      const variantStr = (l.itemsBreakdown && l.itemsBreakdown.length > 0)
        ? l.itemsBreakdown.map((it) => `${it.color ? it.color + " " : ""}${it.size ? "Size: " + it.size + " " : ""}(-${it.reducedUnits || Math.abs(l.diffQuantity)})`).join("; ")
        : (l.variantDetails?.color || l.variantDetails?.size ? `${l.variantDetails.color || ""} ${l.variantDetails.size ? "Size: " + l.variantDetails.size : ""}` : "Standard");

      return [
        `"${d.toLocaleDateString("en-IN")}"`,
        `"${d.toLocaleTimeString("en-IN")}"`,
        `"${(l.productTitle || "").replace(/"/g, '""')}"`,
        `"${(l.barcode || "").replace(/"/g, '""')}"`,
        `"${(l.sku || "").replace(/"/g, '""')}"`,
        `"${variantStr.replace(/"/g, '""')}"`,
        l.previousStock,
        l.newStock,
        Math.abs(l.diffQuantity),
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

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `manual_stock_reductions_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-gray-800">
              {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-gray-400">
              {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
            </span>
          </div>
        );
      },
    },
    {
      title: "Product",
      key: "product",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size={44}
            src={r.productImage}
            icon={<FiPackage />}
            className="rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-xs truncate max-w-[200px]" title={r.productTitle}>
              {r.productTitle}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
              {r.barcode && <span>Code: {r.barcode}</span>}
              {r.category && <span>• {r.category}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Stock Reduced",
      key: "stockDelta",
      width: 130,
      render: (_, r) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="text-gray-400">{r.previousStock}</span>
            <span>➔</span>
            <span className="font-bold text-gray-900">{r.newStock}</span>
          </div>
          <Tag color="error" className="font-bold text-xs m-0 w-fit rounded-full px-2 py-0.5">
            🔻 -{Math.abs(r.diffQuantity)} {Math.abs(r.diffQuantity) === 1 ? "unit" : "units"}
          </Tag>
        </div>
      ),
    },
    {
      title: "Color / Size",
      key: "variants",
      width: 170,
      render: (_, r) => {
        if (r.itemsBreakdown && r.itemsBreakdown.length > 0) {
          return (
            <div className="flex flex-col gap-1 max-w-[200px]">
              {r.itemsBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 flex-wrap text-xs">
                  {item.color && (
                    <span className="font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                      🎨 {item.color}
                    </span>
                  )}
                  {item.size && (
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] border border-indigo-100">
                      {item.size}
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-red-600">
                    (-{item.reducedUnits || Math.abs(r.diffQuantity)})
                  </span>
                </div>
              ))}
            </div>
          );
        }
        if (r.variantDetails?.color || r.variantDetails?.size) {
          return (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {r.variantDetails.color && (
                <span className="font-semibold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                  🎨 {r.variantDetails.color}
                </span>
              )}
              {r.variantDetails.size && (
                <span className="font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] border border-indigo-100">
                  {r.variantDetails.size}
                </span>
              )}
            </div>
          );
        }
        return <span className="text-gray-400 text-xs italic">Standard</span>;
      },
    },
    {
      title: "Cash Risk (Value)",
      key: "potentialLoss",
      width: 140,
      sorter: (a, b) => (a.potentialLossAmount || 0) - (b.potentialLossAmount || 0),
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-bold text-red-600 text-sm">
            ₹{(r.potentialLossAmount || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-gray-400">
            @ ₹{(r.unitPrice || 0).toLocaleString()} / unit
          </span>
        </div>
      ),
    },
    {
      title: "Reason & Notes",
      key: "reason",
      render: (_, r) => (
        <div className="flex flex-col gap-1 max-w-[260px]">
          <Tag color="purple" className="w-fit text-xs font-semibold m-0 rounded-md">
            {r.reason}
          </Tag>
          {r.notes ? (
            <span className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5 truncate" title={r.notes}>
              "{r.notes}"
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">No extra notes</span>
          )}
        </div>
      ),
    },
    {
      title: "Staff / Handler",
      key: "staff",
      width: 150,
      render: (_, r) => (
        <div className="flex flex-col text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-gray-800">
            <FiUser size={12} className="text-gray-400" />
            <span>{r.staffName || "Staff"}</span>
          </div>
          {r.performedBy?.name && (
            <span className="text-[11px] text-gray-400 mt-0.5">
              Login: {r.performedBy.name} ({r.performedBy.role || "Admin"})
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
              <Tag color="success" className="font-semibold text-xs rounded-full m-0 w-fit">
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
              <Tag color="error" className="font-bold text-xs rounded-full m-0 w-fit animate-pulse">
                🚨 Suspected Fraud
              </Tag>
              {r.investigationNotes && (
                <span className="text-[10px] text-red-600 font-medium truncate max-w-[130px]" title={r.investigationNotes}>
                  {r.investigationNotes}
                </span>
              )}
            </div>
          );
        }
        return (
          <Tag color="warning" className="font-semibold text-xs rounded-full m-0 w-fit">
            ⏳ Pending Review
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "action",
      width: 130,
      render: (_, r) => (
        <div className="flex items-center gap-2">
          {r.auditStatus === "PENDING_REVIEW" && (
            <Popconfirm
              title="Verify as Genuine?"
              description="Confirm this stock reduction is genuine."
              onConfirm={() => handleQuickVerify(r._id)}
              okText="Verify"
              cancelText="Cancel"
            >
              <Button size="small" type="primary" className="bg-green-600 hover:bg-green-700 text-xs px-2 py-0 h-7 rounded-md">
                Verify
              </Button>
            </Popconfirm>
          )}

          <Button
            size="small"
            onClick={() => openReviewModal(r)}
            className="text-xs px-2 py-0 h-7 rounded-md border-gray-300 hover:border-indigo-500"
          >
            Review
          </Button>

          <Tooltip title="View Product in Catalog">
            <Link
              to={`/admin/product/${r.productId}`}
              className="text-gray-400 hover:text-indigo-600 p-1"
            >
              <FiEye size={14} />
            </Link>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {/* Top Banner / Heading */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-xl shadow-xs">
              <FiShield />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Stock Reduction & Cash Fraud Audit Center
              </h1>
              <p className="text-xs text-gray-500">
                Prevent staff theft: Monitor physical stock reductions made without counter billing or POS cash records.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<FiRefreshCw />}
            onClick={() => {
              fetchLogs();
              fetchSummary();
            }}
            loading={loading}
            className="rounded-lg text-xs"
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<FiDownload />}
            onClick={exportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs"
          >
            Export Audit Report
          </Button>
        </div>
      </div>

      {/* Fraud Alert Explanation Box */}
      <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-indigo-500/10 border border-amber-300/60 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0">
            <FiAlertTriangle size={18} />
          </div>
          <div className="text-xs text-gray-700 leading-relaxed">
            <strong className="block text-gray-900 font-bold mb-0.5">
              🛡️ Cash Fraud Prevention Safeguard:
            </strong>
            When store staff sell items for cash and do not enter them into POS Live Billing, they
            may attempt to reduce product stock manually to make inventory match during audits. Every
            manual reduction requires a mandatory reason, logs the authorizing staff member, and
            flags potential unrecorded cash risk below for owner verification.
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Reductions */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Manual Reductions
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {summary?.totalReductionsCount || 0}
            </span>
            <div className="mt-1 text-[11px] text-gray-500">
              Today: <strong className="text-indigo-600">{summary?.todayReductionsCount || 0}</strong>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
            <FiPackage />
          </div>
        </div>

        {/* Card 2: Units Deducted */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Total Units Deducted
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {summary?.totalUnitsReduced || 0}
            </span>
            <div className="mt-1 text-[11px] text-gray-500">Physical stock removed</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">
            <FiAlertTriangle />
          </div>
        </div>

        {/* Card 3: Total Cash Risk Value */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Unaccounted Cash Risk
            </span>
            <span className="text-2xl font-bold text-red-600">
              ₹{(summary?.totalPotentialLoss || 0).toLocaleString()}
            </span>
            <div className="mt-1 text-[11px] text-gray-500">Potential unrecorded sales</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl">
            <FiDollarSign />
          </div>
        </div>

        {/* Card 4: Pending Review Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 block mb-1">
              Pending Verification
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-600">
                {summary?.pendingReviewsCount || 0}
              </span>
              {summary?.suspectedFraudCount > 0 && (
                <Tag color="error" className="m-0 font-bold text-[11px] rounded-full">
                  {summary.suspectedFraudCount} Fraud Flags
                </Tag>
              )}
            </div>
            <div className="mt-1 text-[11px] text-amber-700 font-medium">Needs owner sign-off</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">
            <FiShield />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Search */}
          <Input
            placeholder="Search product, barcode, staff, notes..."
            prefix={<FiSearch className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-64 rounded-xl text-xs"
            allowClear
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
              { value: "week", label: "Last 7 Days" },
              { value: "month", label: "This Month" },
            ]}
          />
        </div>

        <div>
          <span className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{logs.length}</strong> alerts
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          dataSource={logs.map((l) => ({ ...l, key: l._id }))}
          loading={loading}
          pagination={{ pageSize: 15 }}
          size="middle"
          rowClassName={(record) =>
            record.auditStatus === "SUSPECTED_FRAUD"
              ? "bg-red-50/40"
              : record.auditStatus === "PENDING_REVIEW"
              ? "bg-amber-50/20"
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
        width={520}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FiShield size={16} />
            </div>
            <span className="font-bold text-gray-900 text-sm">
              Review Stock Reduction Audit
            </span>
          </div>
        }
      >
        {selectedLog && (
          <div className="py-2">
            {/* Overview Box */}
            <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100 flex items-center justify-between text-xs">
              <div>
                <strong className="block text-gray-900 font-semibold mb-0.5">
                  {selectedLog.productTitle}
                </strong>
                <span className="text-gray-500">
                  Reduced by {Math.abs(selectedLog.diffQuantity)} units by{" "}
                  <strong>{selectedLog.staffName || "Staff"}</strong>
                </span>
              </div>
              <div className="text-right">
                <span className="text-red-600 font-bold text-sm block">
                  ₹{(selectedLog.potentialLossAmount || 0).toLocaleString()}
                </span>
                <span className="text-gray-400">Cash Value</span>
              </div>
            </div>

            {/* Specific Color & Size Breakdown if available */}
            {((selectedLog.itemsBreakdown && selectedLog.itemsBreakdown.length > 0) || (selectedLog.variantDetails?.color || selectedLog.variantDetails?.size)) && (
              <div className="mb-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                <span className="text-indigo-900 font-semibold block mb-1.5">Color & Size Breakdown:</span>
                {selectedLog.itemsBreakdown && selectedLog.itemsBreakdown.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedLog.itemsBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs">
                        <div className="flex items-center gap-2">
                          {item.color && (
                            <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                              🎨 {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              Size: {item.size}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-red-600">
                          {item.oldStock} ➔ {item.newStock} (-{item.reducedUnits || Math.abs(selectedLog.diffQuantity)})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {selectedLog.variantDetails?.color && (
                      <span className="font-semibold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200">
                        🎨 {selectedLog.variantDetails.color}
                      </span>
                    )}
                    {selectedLog.variantDetails?.size && (
                      <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        Size: {selectedLog.variantDetails.size}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Staff's declared reason */}
            <div className="mb-4 p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 text-xs">
              <span className="text-amber-800 font-semibold block mb-0.5">Declared Reason:</span>
              <span className="font-bold text-gray-900">{selectedLog.reason}</span>
              {selectedLog.notes && (
                <p className="mt-1 text-gray-600 italic">"{selectedLog.notes}"</p>
              )}
            </div>

            {/* Verification Status Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Owner Audit Decision:
              </label>
              <Select
                value={auditStatus}
                onChange={(v) => setAuditStatus(v)}
                className="w-full"
                size="large"
                options={[
                  { value: "VERIFIED_GENUINE", label: "✓ Verified Genuine (Piece damaged/tested/accounted for)" },
                  { value: "SUSPECTED_FRAUD", label: "🚨 Suspected Fraud (Possible cash theft / missing bill)" },
                  { value: "PENDING_REVIEW", label: "⏳ Pending Review (Need to check CCTV / receipts)" },
                ]}
              />
            </div>

            {/* Investigation Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Owner Investigation & CCTV Notes:
              </label>
              <TextArea
                rows={3}
                placeholder="e.g., 'Checked CCTV at counter at 11:30 AM - customer paid online/cash shortage verified' or 'Defective piece inspected in backroom'"
                value={investigationNotes}
                onChange={(e) => setInvestigationNotes(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button onClick={() => setReviewModalOpen(false)} disabled={updatingAudit}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={updatingAudit}
                onClick={handleSaveReview}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold text-xs"
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
