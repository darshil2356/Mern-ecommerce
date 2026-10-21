import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import {
  FaAward,
  FaUsers,
  FaSearch,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaFileInvoiceDollar,
  FaPrint,
  FaDownload,
  FaSync,
  FaArrowLeft,
  FaUserCheck,
  FaFilter,
  FaCashRegister,
  FaTrophy,
  FaEye,
  FaTimes,
  FaPercentage
} from "react-icons/fa";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const currentMonthStr = () => {
  const d = new Date();
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${yr}-${mo}`;
};

export default function StaffIncentiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    stats: {
      totalOrdersCount: 0,
      totalSalesVolume: 0,
      totalIncentiveEarned: 0,
      totalIncentivePending: 0,
      totalIncentivePaid: 0,
      averageIncentiveRate: 0,
    },
    staffSummary: [],
    orders: [],
  });

  const [activeStaffList, setActiveStaffList] = useState([]);

  // Active View Tab: "SUMMARY" | "TRANSACTIONS" | "VOUCHER"
  const [activeTab, setActiveTab] = useState("SUMMARY");

  // Filters
  const [datePreset, setDatePreset] = useState("THIS_MONTH"); // TODAY | THIS_WEEK | THIS_MONTH | LAST_MONTH | ALL | CUSTOM
  const [monthYear, setMonthYear] = useState(currentMonthStr());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("ALL");
  const [selectedBilledById, setSelectedBilledById] = useState("ALL");
  const [incentiveStatusFilter, setIncentiveStatusFilter] = useState("ALL"); // ALL | PENDING | PAID
  const [searchTerm, setSearchTerm] = useState("");

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutTargetStaff, setPayoutTargetStaff] = useState(null);
  const [payoutPaymentNote, setPayoutPaymentNote] = useState("Incentive payout settled");
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Voucher generator selection
  const [voucherStaffId, setVoucherStaffId] = useState("");

  // Fetch active staff list for filter dropdowns
  const fetchStaffList = useCallback(async () => {
    try {
      const res = await axios.get(`${base_url}staff?status=ACTIVE`, config);
      if (res.data?.data) {
        setActiveStaffList(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff members:", err);
    }
  }, []);

  // Compute date range based on preset
  const computeDatesFromPreset = useCallback((preset) => {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "TODAY") {
      const ymd = toYMD(today);
      return { start: ymd, end: ymd, mo: "" };
    }
    if (preset === "THIS_WEEK") {
      const day = today.getDay(); // 0 is Sunday
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(today);
      monday.setDate(diff);
      return { start: toYMD(monday), end: toYMD(today), mo: "" };
    }
    if (preset === "THIS_MONTH") {
      const mo = currentMonthStr();
      return { start: "", end: "", mo };
    }
    if (preset === "LAST_MONTH") {
      const prevMoDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const mo = `${prevMoDate.getFullYear()}-${pad(prevMoDate.getMonth() + 1)}`;
      return { start: "", end: "", mo };
    }
    if (preset === "ALL") {
      return { start: "", end: "", mo: "" };
    }
    return { start: startDate, end: endDate, mo: monthYear };
  }, [startDate, endDate, monthYear]);

  // Fetch Incentive Report from backend
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (datePreset === "CUSTOM") {
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
      } else if (datePreset === "THIS_MONTH" || datePreset === "LAST_MONTH") {
        const { mo } = computeDatesFromPreset(datePreset);
        if (mo) params.append("monthYear", mo);
      } else {
        const { start, end } = computeDatesFromPreset(datePreset);
        if (start) params.append("startDate", start);
        if (end) params.append("endDate", end);
      }

      if (selectedStaffId && selectedStaffId !== "ALL") {
        params.append("staffId", selectedStaffId);
      }
      if (selectedBilledById && selectedBilledById !== "ALL") {
        params.append("billedById", selectedBilledById);
      }
      if (incentiveStatusFilter && incentiveStatusFilter !== "ALL") {
        params.append("incentiveStatus", incentiveStatusFilter);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const res = await axios.get(`${base_url}staff/incentives/report?${params.toString()}`, config);
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error("Failed to load staff incentive report:", err);
      toast.error("Failed to load incentive data");
    } finally {
      setLoading(false);
    }
  }, [
    datePreset,
    startDate,
    endDate,
    selectedStaffId,
    selectedBilledById,
    incentiveStatusFilter,
    searchTerm,
    computeDatesFromPreset,
  ]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Open payout modal for specific staff member
  const openPayoutModal = (staff) => {
    setPayoutTargetStaff(staff);
    setPayoutPaymentNote(`Incentive settlement for ${staff.name} - ${datePreset === "THIS_MONTH" ? "Current Month" : datePreset}`);
    setPayoutModalOpen(true);
  };

  // Submit Payout
  const handleConfirmPayout = async () => {
    if (!payoutTargetStaff) return;
    setIsProcessingPayout(true);
    try {
      let payload = {
        staffId: payoutTargetStaff.staffId,
        paymentNote: payoutPaymentNote,
      };

      if (datePreset === "THIS_MONTH" || datePreset === "LAST_MONTH") {
        const { mo } = computeDatesFromPreset(datePreset);
        if (mo) payload.monthYear = mo;
      }

      const res = await axios.post(`${base_url}staff/incentives/payout`, payload, config);
      toast.success(res.data?.message || "Incentive marked as paid successfully");
      setPayoutModalOpen(false);
      fetchReport();
    } catch (err) {
      console.error("Payout update failed:", err);
      toast.error(err.response?.data?.message || "Failed to mark incentive as paid");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Mark single order incentive as paid directly
  const handleMarkSingleOrderPaid = async (orderId) => {
    try {
      const confirm = await Swal.fire({
        title: "Mark as Paid?",
        text: "Are you sure you want to mark this bill's incentive as settled?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#059669",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, Mark Paid",
      });

      if (!confirm.isConfirmed) return;

      await axios.post(
        `${base_url}staff/incentives/payout`,
        { orderIds: [orderId], paymentNote: "Settled individual bill incentive" },
        config
      );
      toast.success("Bill incentive marked as Paid");
      fetchReport();
    } catch (err) {
      console.error("Failed to mark order paid:", err);
      toast.error("Failed to update status");
    }
  };

  // Export report as CSV
  const handleExportCSV = () => {
    if (!reportData.orders || reportData.orders.length === 0) {
      toast.info("No records to export");
      return;
    }

    const headers = [
      "Date & Time",
      "Bill ID",
      "Customer Name",
      "Customer Phone",
      "Bill Total (₹)",
      "Seller Staff",
      "Incentive %",
      "Incentive Amount (₹)",
      "Billed By (Cashier)",
      "Payment Mode",
      "Incentive Status",
      "Paid Date",
      "Note",
    ];

    const rows = reportData.orders.map((o) => [
      `"${fmtDateTime(o.createdAt)}"`,
      `"${String(o._id || "").slice(-8).toUpperCase()}"`,
      `"${(o.customer?.name || "Walk-in").replace(/"/g, '""')}"`,
      `"${o.customer?.phone || ""}"`,
      (o.totalPriceAfterDiscount || o.totalPrice || 0).toFixed(2),
      `"${(o.sellerStaffName || "").replace(/"/g, '""')}"`,
      `${o.incentiveRate || 0}%`,
      (o.incentiveAmount || 0).toFixed(2),
      `"${(o.billedByStaffName || "").replace(/"/g, '""')}"`,
      o.paymentMethod || "CASH",
      o.incentiveStatus || "PENDING",
      `"${fmtDate(o.incentivePaidAt)}"`,
      `"${(o.incentivePaymentNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_incentives_report_${datePreset}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported CSV successfully");
  };

  // Print Staff Incentive Voucher
  const handlePrintVoucher = (staffItem) => {
    const target = staffItem || reportData.staffSummary.find((s) => s.staffId.toString() === voucherStaffId);
    if (!target) {
      toast.warning("Please select a staff member to print voucher");
      return;
    }

    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Staff Incentive Voucher - ${target.name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    body { background:#f8fafc; padding:24px; color:#1e293b; }
    .voucher-card { max-width:680px; margin:0 auto; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:32px; box-shadow:0 4px 14px rgba(0,0,0,0.06); }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #f1f5f9; padding-bottom:20px; }
    .store-name { font-size:22px; font-weight:900; color:#0f172a; }
    .store-sub { font-size:12px; color:#64748b; margin-top:2px; }
    .doc-title { text-align:right; }
    .doc-title h2 { font-size:16px; font-weight:800; color:#d97706; text-transform:uppercase; letter-spacing:1px; }
    .doc-title p { font-size:12px; color:#64748b; }
    .staff-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin:20px 0; display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .info-item { font-size:13px; }
    .info-label { color:#64748b; font-size:11px; text-transform:uppercase; font-weight:600; margin-bottom:2px; }
    .info-val { font-weight:700; color:#0f172a; }
    table { width:100%; border-collapse:collapse; margin:24px 0; }
    th { text-align:left; background:#f1f5f9; padding:10px 12px; font-size:11px; text-transform:uppercase; color:#475569; }
    td { padding:12px; border-bottom:1px solid #f1f5f9; font-size:13px; }
    .net-box { background:#fef3c7; border:1.5px solid #fde68a; border-radius:12px; padding:18px; display:flex; justify-content:space-between; align-items:center; margin:20px 0; }
    .net-label { font-size:14px; font-weight:700; color:#92400e; }
    .net-val { font-size:24px; font-weight:900; color:#78350f; }
    .signatures { display:flex; justify-content:space-between; margin-top:60px; padding-top:20px; border-top:1px dashed #cbd5e1; }
    .sig-line { width:200px; text-align:center; font-size:12px; color:#475569; }
    .sig-line div { border-top:1px solid #94a3b8; margin-top:40px; padding-top:6px; font-weight:700; }
    @media print {
      body { background:#fff; padding:0; }
      .voucher-card { box-shadow:none; border:none; padding:10px; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header">
      <div>
        <div class="store-name">Yashoda Fashion</div>
        <div class="store-sub">Staff Commission & Sales Incentive Statement</div>
      </div>
      <div class="doc-title">
        <h2>Incentive Voucher</h2>
        <p>Date: ${fmtDate(new Date())}</p>
      </div>
    </div>

    <div class="staff-box">
      <div class="info-item">
        <div class="info-label">Staff Member</div>
        <div class="info-val">${target.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Designation / Role</div>
        <div class="info-val">${target.designation || "Sales Staff"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Base Salary</div>
        <div class="info-val">${fmt(target.baseSalary)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Commission Rate</div>
        <div class="info-val" style="color:#d97706">${target.incentivePercentage || 0}% on Sales</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center">Bills Count</th>
          <th style="text-align:right">Sales Volume</th>
          <th style="text-align:right">Commission Earned</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Total Retail / Offline Sales</strong><br><span style="font-size:11px;color:#64748b">Calculated on net customer billing amount</span></td>
          <td style="text-align:center"><strong>${target.ordersCount || 0}</strong></td>
          <td style="text-align:right"><strong>${fmt(target.salesVolume)}</strong></td>
          <td style="text-align:right;color:#059669;font-weight:800;font-size:15px">${fmt(target.incentiveEarned)}</td>
        </tr>
        <tr>
          <td>Previously Settled / Paid Amount</td>
          <td style="text-align:center">—</td>
          <td style="text-align:right">—</td>
          <td style="text-align:right;color:#64748b">-${fmt(target.incentivePaid)}</td>
        </tr>
      </tbody>
    </table>

    <div class="net-box">
      <div>
        <div class="net-label">Net Incentive Payable</div>
        <div style="font-size:11px;color:#b45309">Approved sales performance payout</div>
      </div>
      <div class="net-val">${fmt(target.incentivePending)}</div>
    </div>

    <div class="signatures">
      <div class="sig-line">
        <div>Employee / Staff Signature</div>
      </div>
      <div class="sig-line">
        <div>Authorized Signatory / Owner</div>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

  // Top performer computation
  const topPerformer = useMemo(() => {
    if (!reportData.staffSummary || reportData.staffSummary.length === 0) return null;
    return [...reportData.staffSummary].sort((a, b) => b.salesVolume - a.salesVolume)[0];
  }, [reportData.staffSummary]);

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/staff"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
              title="Back to Staff Directory"
            >
              <FaArrowLeft />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2.5">
              <FaAward className="text-amber-500" /> Staff Sales Incentive Module
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1 pl-9">
            Real-time percentage commission tracker, billing staff attribution, date-wise reports, and monthly payout vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 text-xs shadow-xs transition-all"
          >
            <FaSync className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-xl border border-slate-200 text-xs shadow-xs transition-all"
          >
            <FaDownload className="text-emerald-600" /> Export CSV
          </button>

          <Link
            to="/admin/staff"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition-all"
          >
            <FaUsers /> Staff Setup
          </Link>
        </div>
      </div>

      {/* ── KPI Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Incentive Earned */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-20 text-6xl">
            <FaAward />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Total Incentive Earned</p>
          <h3 className="text-2xl md:text-3xl font-black mt-1">
            {fmt(reportData.stats?.totalIncentiveEarned)}
          </h3>
          <p className="text-[11px] text-amber-100 mt-1 flex items-center gap-1">
            <span>Avg Rate:</span>
            <span className="font-bold bg-amber-700/50 px-1.5 py-0.5 rounded text-[10px]">
              {reportData.stats?.averageIncentiveRate || 0}%
            </span>
          </p>
        </div>

        {/* Total Staff Sales */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Staff Sales</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
              <FaMoneyBillWave />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-slate-800">
              {fmt(reportData.stats?.totalSalesVolume)}
            </h3>
            <p className="text-xs text-indigo-600 font-semibold mt-0.5">
              Across {reportData.stats?.totalOrdersCount || 0} Bills
            </p>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Payout</p>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-sm font-bold">
              <FaClock />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-rose-600">
              {fmt(reportData.stats?.totalIncentivePending)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">To be paid to staff</p>
          </div>
        </div>

        {/* Settled / Paid */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Settled / Paid</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
              <FaCheckCircle />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-black text-emerald-600">
              {fmt(reportData.stats?.totalIncentivePaid)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Paid commission</p>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Sales Person</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
              <FaTrophy />
            </div>
          </div>
          <div className="mt-2">
            {topPerformer && topPerformer.salesVolume > 0 ? (
              <>
                <h4 className="text-base font-extrabold text-slate-800 truncate" title={topPerformer.name}>
                  {topPerformer.name}
                </h4>
                <p className="text-xs text-amber-600 font-bold mt-0.5">
                  {fmt(topPerformer.salesVolume)} ({topPerformer.ordersCount} sales)
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400 mt-2">No sales logged in period</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Multi-Dimensional Filter Toolbar ── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-3">
        {/* Row 1: Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <FaFilter className="text-[10px]" /> Period:
            </span>
            {[
              { id: "TODAY", label: "Today" },
              { id: "THIS_WEEK", label: "This Week" },
              { id: "THIS_MONTH", label: "This Month" },
              { id: "LAST_MONTH", label: "Last Month" },
              { id: "ALL", label: "All Time" },
              { id: "CUSTOM", label: "Custom Dates" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  datePreset === p.id
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search customer, staff, bill #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Row 2: Secondary Dropdowns (Staff, Cashier, Status, Custom Range) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          {/* Seller Staff Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Seller Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Sales Staff ({activeStaffList.length})</option>
              {activeStaffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.incentivePercentage || 0}% inc.)
                </option>
              ))}
            </select>
          </div>

          {/* Billed By Staff (Cashier) Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Billed By (Cashier Accountability)</label>
            <select
              value={selectedBilledById}
              onChange={(e) => setSelectedBilledById(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Counter Operators</option>
              {activeStaffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.designation})
                </option>
              ))}
            </select>
          </div>

          {/* Incentive Payout Status */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Incentive Status</label>
            <select
              value={incentiveStatusFilter}
              onChange={(e) => setIncentiveStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses (Pending & Paid)</option>
              <option value="PENDING">Pending Payout Only</option>
              <option value="PAID">Paid / Settled Only</option>
            </select>
          </div>

          {/* Custom Date Range Picker */}
          {datePreset === "CUSTOM" ? (
            <div className="flex items-center gap-1.5">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedStaffId("ALL");
                  setSelectedBilledById("ALL");
                  setIncentiveStatusFilter("ALL");
                  setSearchTerm("");
                  setDatePreset("THIS_MONTH");
                }}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── View Switcher Tabs ── */}
      <div className="flex items-center gap-2 mb-4 bg-white p-1 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab("SUMMARY")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "SUMMARY"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FaUsers /> Staff-wise Summary ({reportData.staffSummary?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("TRANSACTIONS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "TRANSACTIONS"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FaFileInvoiceDollar /> Detailed Bill Audit Log ({reportData.orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("VOUCHER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "VOUCHER"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FaPrint /> Payout Voucher Generator
        </button>
      </div>

      {/* ── TAB 1: STAFF PERFORMANCE & PAYOUT SUMMARY ── */}
      {activeTab === "SUMMARY" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Role & Contract</th>
                  <th className="p-4 text-center">Incentive %</th>
                  <th className="p-4 text-center">Bills Sold</th>
                  <th className="p-4 text-right">Total Sales Generated</th>
                  <th className="p-4 text-right">Incentive Earned</th>
                  <th className="p-4 text-right">Paid</th>
                  <th className="p-4 text-right">Pending Payout</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-amber-600"></div>
                        <span>Calculating staff sales & incentives...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.staffSummary?.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500 font-medium">
                      No staff sales found for selected period and filters.
                    </td>
                  </tr>
                ) : (
                  reportData.staffSummary.map((st) => (
                    <tr key={st.staffId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Phone */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-base uppercase">
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{st.name}</p>
                            <p className="text-xs text-slate-500">{st.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Base Salary */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                          {st.designation}
                        </span>
                        {st.baseSalary > 0 && (
                          <p className="text-xs text-slate-500 mt-1">Base: {fmt(st.baseSalary)}</p>
                        )}
                      </td>

                      {/* Commission % */}
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          st.incentivePercentage > 0
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {st.incentivePercentage || 0}%
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="p-4 text-center font-bold text-slate-700">
                        {st.ordersCount}
                      </td>

                      {/* Total Sales Volume */}
                      <td className="p-4 text-right font-bold text-slate-900">
                        {fmt(st.salesVolume)}
                      </td>

                      {/* Total Incentive Earned */}
                      <td className="p-4 text-right font-extrabold text-amber-700">
                        {fmt(st.incentiveEarned)}
                      </td>

                      {/* Paid */}
                      <td className="p-4 text-right font-semibold text-emerald-600">
                        {fmt(st.incentivePaid)}
                      </td>

                      {/* Pending Payout */}
                      <td className="p-4 text-right font-black text-rose-600">
                        {fmt(st.incentivePending)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {st.incentivePending > 0 ? (
                            <button
                              onClick={() => openPayoutModal(st)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                              title="Mark pending incentive as Paid"
                            >
                              <FaCheckCircle className="text-[10px]" /> Settle
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Settled</span>
                          )}

                          <button
                            onClick={() => handlePrintVoucher(st)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                            title="Print Voucher Statement"
                          >
                            <FaPrint />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: DETAILED BILL AUDIT LOG ── */}
      {activeTab === "TRANSACTIONS" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-4">Date & Bill #</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4 text-right">Bill Total</th>
                  <th className="p-4">Sales Person (Seller)</th>
                  <th className="p-4 text-center">Rate</th>
                  <th className="p-4 text-right">Incentive Earned</th>
                  <th className="p-4">Billed By (Counter)</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-600"></div>
                        <span>Loading sales bills...</span>
                      </div>
                    </td>
                  </tr>
                ) : reportData.orders?.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-8 text-center text-slate-500 font-medium">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  reportData.orders.map((o) => {
                    const billAmt = o.totalPriceAfterDiscount > 0 ? o.totalPriceAfterDiscount : o.totalPrice;
                    return (
                      <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Date & Order ID */}
                        <td className="p-4">
                          <p className="font-mono font-bold text-slate-800 text-xs">
                            #{String(o._id || "").slice(-8).toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {fmtDateTime(o.createdAt)}
                          </p>
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                          <p className="font-bold text-slate-800 text-xs">{o.customer?.name || "Walk-in Customer"}</p>
                          <p className="text-[11px] text-slate-500">{o.customer?.phone || "—"}</p>
                        </td>

                        {/* Bill Total */}
                        <td className="p-4 text-right font-black text-slate-900">
                          {fmt(billAmt)}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {o.paymentMethod || "CASH"}
                          </span>
                        </td>

                        {/* Seller Staff */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px] uppercase">
                              {(o.sellerStaffName || "U").charAt(0)}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{o.sellerStaffName}</p>
                              {o.sellerStaff?.designation && (
                                <p className="text-[10px] text-slate-500">{o.sellerStaff.designation}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Commission Rate */}
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-xs font-bold">
                            {o.incentiveRate || 0}%
                          </span>
                        </td>

                        {/* Calculated Incentive */}
                        <td className="p-4 text-right font-extrabold text-amber-700">
                          {fmt(o.incentiveAmount)}
                        </td>

                        {/* Billed By Staff (Counter / Mistake tracking) */}
                        <td className="p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold inline-flex items-center gap-1">
                            <FaCashRegister className="text-[10px] text-indigo-500" />
                            {o.billedByStaffName || "Counter Admin"}
                          </span>
                        </td>

                        {/* Payout Status */}
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            o.incentiveStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}>
                            {o.incentiveStatus || "PENDING"}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-4 text-center">
                          {o.incentiveStatus === "PENDING" ? (
                            <button
                              onClick={() => handleMarkSingleOrderPaid(o._id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                              title="Mark as Paid"
                            >
                              Pay
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Paid on {fmtDate(o.incentivePaidAt)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: PAYOUT VOUCHER GENERATOR ── */}
      {activeTab === "VOUCHER" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl mx-auto mb-2">
              <FaPrint />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">Print Staff Incentive Voucher</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select any staff member to generate and print a formal commission payout receipt for company accounts or staff salary attachment.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Staff Member *</label>
              <select
                value={voucherStaffId}
                onChange={(e) => setVoucherStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose Staff Member --</option>
                {reportData.staffSummary?.map((st) => (
                  <option key={st.staffId} value={st.staffId}>
                    {st.name} — Earned: {fmt(st.incentiveEarned)} | Pending: {fmt(st.incentivePending)}
                  </option>
                ))}
              </select>
            </div>

            {voucherStaffId && (() => {
              const st = reportData.staffSummary.find((s) => s.staffId.toString() === voucherStaffId);
              if (!st) return null;
              return (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Sales Value:</span>
                    <span className="font-bold text-slate-800">{fmt(st.salesVolume)} ({st.ordersCount} bills)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Commission Rate:</span>
                    <span className="font-bold text-amber-700">{st.incentivePercentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Commission Earned:</span>
                    <span className="font-bold text-slate-800">{fmt(st.incentiveEarned)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-amber-200 text-sm">
                    <span className="font-bold text-rose-800">Pending Amount to Pay:</span>
                    <span className="font-black text-rose-800">{fmt(st.incentivePending)}</span>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => handlePrintVoucher()}
              disabled={!voucherStaffId}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPrint /> Print Incentive Voucher
            </button>
          </div>
        </div>
      )}

      {/* ── PAYOUT SETTLEMENT MODAL ── */}
      {payoutModalOpen && payoutTargetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FaCheckCircle className="text-xl" />
                <h3 className="font-bold text-base">Settle Staff Incentive</h3>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-[11px] text-slate-400 uppercase font-bold">Staff Member</p>
                <h4 className="font-extrabold text-slate-800 text-base">{payoutTargetStaff.name}</h4>
                <p className="text-slate-500">{payoutTargetStaff.designation || "Sales Staff"}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] text-slate-400 uppercase font-bold">Total Sales</p>
                  <p className="font-black text-slate-800 text-sm mt-0.5">{fmt(payoutTargetStaff.salesVolume)}</p>
                  <p className="text-[10px] text-slate-400">{payoutTargetStaff.ordersCount} bills sold</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[11px] text-emerald-800 uppercase font-bold">Pending Incentive</p>
                  <p className="font-black text-emerald-700 text-sm mt-0.5">{fmt(payoutTargetStaff.incentivePending)}</p>
                  <p className="text-[10px] text-emerald-600">{payoutTargetStaff.incentivePercentage}% rate</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Settlement Remarks / Payment Note
                </label>
                <input
                  type="text"
                  value={payoutPaymentNote}
                  onChange={(e) => setPayoutPaymentNote(e.target.value)}
                  placeholder="e.g. Paid along with October salary in Cash"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                ℹ️ Marking this as paid will update all pending bills for this staff member in the selected period to <strong>PAID</strong> status.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayout}
                  onClick={handleConfirmPayout}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessingPayout ? "Updating..." : "Confirm & Settle"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
