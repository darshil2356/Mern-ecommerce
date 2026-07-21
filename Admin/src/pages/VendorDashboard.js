import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import api from "../utils/axiosconfig";
import { recordPurchasePayment } from "../features/purchase/purchaseSlice";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [overdueSearch, setOverdueSearch] = useState("");
  const [selectedVendorOverdue, setSelectedVendorOverdue] = useState(null);

  // Payment Modal State
  const [payModal, setPayModal] = useState(null); // { purchaseId, billNo, vendorName, dueAmount }
  const [payForm, setPayForm] = useState({
    amount: "",
    mode: "Cash",
    referenceNo: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [submittingPay, setSubmittingPay] = useState(false);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/vendor/dashboard-stats");
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load vendor dashboard stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleOpenPay = (bill, vendorName) => {
    setPayModal({
      purchaseId: bill._id,
      billNo: bill.billNo,
      vendorName,
      dueAmount: bill.balanceDue,
    });
    setPayForm({
      amount: bill.balanceDue,
      mode: "Cash",
      referenceNo: "",
      note: `30+ Days overdue payment settlement`,
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleConfirmPay = async (e) => {
    e.preventDefault();
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) {
      return toast.error("Please enter a valid payment amount");
    }

    setSubmittingPay(true);
    try {
      const res = await dispatch(
        recordPurchasePayment({
          id: payModal.purchaseId,
          ...payForm,
        })
      );

      if (res.meta.requestStatus === "fulfilled") {
        toast.success(`Payment of ${fmt(payForm.amount)} recorded successfully!`);
        setPayModal(null);
        fetchDashboardStats();
      } else {
        toast.error(res.payload || "Payment failed");
      }
    } catch (error) {
      toast.error("An error occurred during payment");
    } finally {
      setSubmittingPay(false);
    }
  };

  const summary = data?.summary || {};
  const overdueVendors = data?.overdue30DaysVendors || [];
  const topVendorsDue = data?.topVendorsByDue || [];
  const topVendorsPurchase = data?.topVendorsByPurchase || [];
  const gstBreakdown = data?.gstBreakdown || [];

  const filteredOverdueVendors = overdueVendors.filter((v) => {
    const term = overdueSearch.toLowerCase();
    return (
      v.vendor?.name?.toLowerCase().includes(term) ||
      v.vendor?.firmName?.toLowerCase().includes(term) ||
      v.vendor?.phone?.includes(term)
    );
  });

  const paidPercentage = summary.totalPurchases
    ? Math.min(100, Math.round((summary.totalPaid / summary.totalPurchases) * 100))
    : 0;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 10 }}>
            <span>🏪</span> Vendor Dashboard (Vepari Calculations)
          </h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
            Complete vendor financial analysis, GST calculations, and 30-day payment due tracking.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/admin/vendors")}
            style={{
              padding: "10px 18px",
              background: "#f1f5f9",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            📋 All Vendors List
          </button>
          <button
            onClick={() => navigate("/admin/add-purchase")}
            style={{
              padding: "10px 18px",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            }}
          >
            + Add Purchase Bill
          </button>
          <button
            onClick={fetchDashboardStats}
            style={{
              padding: "10px 14px",
              background: "#fff",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
            }}
            title="Refresh statistics"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: 16, color: "#64748b", fontWeight: 500 }}>Calculating Vendor Dashboard Metrics...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Cards (5 Cards Grid) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
            {/* 1. Total Vendors */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #6366f1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Vendors</span>
                <span style={{ fontSize: 20 }}>🏪</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", marginTop: 8 }}>
                {summary.totalVendors || 0}
              </div>
              <div style={{ fontSize: 12, color: "#166534", marginTop: 4, fontWeight: 500 }}>
                {summary.activeVendors || 0} Active Vepari
              </div>
            </div>

            {/* 2. Total Purchases */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #3b82f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Purchases</span>
                <span style={{ fontSize: 20 }}>📦</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6", marginTop: 8 }}>
                {fmt(summary.totalPurchases)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Across {summary.totalBills || 0} purchase bills
              </div>
            </div>

            {/* 3. Total Paid */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #22c55e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Paid Amount</span>
                <span style={{ fontSize: 20 }}>✅</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e", marginTop: 8 }}>
                {fmt(summary.totalPaid)}
              </div>
              <div style={{ fontSize: 12, color: "#166534", marginTop: 4, fontWeight: 600 }}>
                {paidPercentage}% Paid Ratio
              </div>
            </div>

            {/* 4. Total Balance Due */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: "4px solid #f59e0b" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Total Balance Due</span>
                <span style={{ fontSize: 20 }}>⏳</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706", marginTop: 8 }}>
                {fmt(summary.totalDue)}
              </div>
              <div style={{ fontSize: 12, color: "#b45309", marginTop: 4 }}>
                {summary.pendingBills || 0} pending / {summary.partialBills || 0} partial bills
              </div>
            </div>

            {/* 5. 30+ DAYS OVERDUE ALERT CARD */}
            <div
              style={{
                background: summary.totalOverdueAmount > 0 ? "linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%)" : "#fff",
                borderRadius: 14,
                padding: "20px",
                boxShadow: summary.totalOverdueAmount > 0 ? "0 4px 14px rgba(239, 68, 68, 0.15)" : "0 2px 10px rgba(0,0,0,0.05)",
                borderLeft: "4px solid #ef4444",
                border: summary.totalOverdueAmount > 0 ? "1px solid #fecaca" : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#991b1b", fontWeight: 700 }}>
                  ⚠️ Due &gt; 30 Days
                </span>
                <span style={{ fontSize: 20 }}>🚨</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626", marginTop: 8 }}>
                {fmt(summary.totalOverdueAmount)}
              </div>
              <div style={{ fontSize: 12, color: "#991b1b", marginTop: 4, fontWeight: 600 }}>
                {summary.overdue30DaysVendorCount || 0} Vendors ({summary.overdue30DaysBillCount || 0} Overdue Bills)
              </div>
            </div>
          </div>

          {/* Progress Bar Overview */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>Payment Settlement Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>{paidPercentage}% Paid ({fmt(summary.totalPaid)} / {fmt(summary.totalPurchases)})</span>
            </div>
            <div style={{ width: "100%", height: 10, background: "#e2e8f0", borderRadius: 10, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${paidPercentage}%`, background: "linear-gradient(90deg, #22c55e, #16a34a)", transition: "width 0.5s ease" }} />
              <div style={{ width: `${100 - paidPercentage}%`, background: "#ef4444", transition: "width 0.5s ease" }} />
            </div>
          </div>

          {/* 🚨 PROMINENT 30+ DAYS PAYMENT OVERDUE SECTION */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              border: "2px solid #fca5a5",
              marginBottom: 28,
              overflow: "hidden",
            }}
          >
            {/* Banner Header */}
            <div
              style={{
                background: "linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)",
                color: "#fff",
                padding: "16px 24px",
                display: "flex",
                justify: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>⚠️</span> Payment Due (&gt; 30 Days) — Action Required!
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.9 }}>
                  Vendors with unpaid bills pending for more than 30 days. Please pay to clear dues.
                </p>
              </div>
              <div style={{ background: "rgba(255,255,255,0.2)", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                {overdueVendors.length} Vendors Need Payment
              </div>
            </div>

            {/* Filter & Content */}
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Filter overdue vendors by name, firm, phone..."
                  value={overdueSearch}
                  onChange={(e) => setOverdueSearch(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              {filteredOverdueVendors.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#166534", background: "#f0fdf4", borderRadius: 12 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>All Good! No Vendor Payments Due Over 30 Days!</h4>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#15803d" }}>
                    All vendor payments within the 30-day window are up to date or settled.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {filteredOverdueVendors.map((item) => {
                    const v = item.vendor || {};
                    const isExpanded = selectedVendorOverdue === v._id;

                    return (
                      <div
                        key={v._id || Math.random()}
                        style={{
                          background: "#fff1f2",
                          border: "1px solid #fecaca",
                          borderRadius: 12,
                          padding: "16px 20px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Main Vendor Overdue Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <h4 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#991b1b" }}>
                                {v.name}
                              </h4>
                              {v.firmName && (
                                <span style={{ fontSize: 13, background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                                  {v.firmName}
                                </span>
                              )}
                              <span style={{ fontSize: 12, background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                                {item.maxDaysOverdue} Days Overdue!
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 13, color: "#7f1d1d" }}>
                              {v.phone && (
                                <span>
                                  📞 <strong>{v.phone}</strong>
                                </span>
                              )}
                              {v.city && <span>📍 {v.city}</span>}
                              <span>📅 Oldest Bill: <strong>{fmtDate(item.oldestBillDate)}</strong></span>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 12, color: "#991b1b" }}>Overdue Amount (&gt;30 Days)</div>
                              <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>
                                {fmt(item.overdueAmount)}
                              </div>
                              <div style={{ fontSize: 11, color: "#7f1d1d" }}>
                                {item.overdueBillCount} Overdue {item.overdueBillCount === 1 ? "Bill" : "Bills"}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {/* WhatsApp Reminder Button */}
                              {v.phone && (
                                <a
                                  href={`https://wa.me/91${v.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                                    `Hello ${v.name}, this is a payment reminder for purchase bill balance due of ${fmt(
                                      item.overdueAmount
                                    )}. Oldest bill date: ${fmtDate(item.oldestBillDate)}. Please let us know when payment will be processed. Thank you!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    padding: "8px 14px",
                                    background: "#25d366",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    textDecoration: "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  💬 WhatsApp
                                </a>
                              )}

                              {/* Pay Now Direct Button */}
                              {item.bills && item.bills[0] && (
                                <button
                                  onClick={() => handleOpenPay(item.bills[0], v.name)}
                                  style={{
                                    padding: "8px 16px",
                                    background: "#dc2626",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
                                  }}
                                >
                                  💳 Pay Now
                                </button>
                              )}

                              {/* View Details Toggle */}
                              <button
                                onClick={() => setSelectedVendorOverdue(isExpanded ? null : v._id)}
                                style={{
                                  padding: "8px 12px",
                                  background: "#fff",
                                  color: "#991b1b",
                                  border: "1px solid #fca5a5",
                                  borderRadius: 8,
                                  fontWeight: 600,
                                  fontSize: 13,
                                  cursor: "pointer",
                                }}
                              >
                                {isExpanded ? "Hide Bills ▲" : "View Bills ▼"}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Bills List */}
                        {isExpanded && (
                          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed #fca5a5" }}>
                            <h5 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#991b1b" }}>
                              Overdue Purchase Bills for {v.name}:
                            </h5>
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden" }}>
                                <thead>
                                  <tr style={{ background: "#fee2e2", textAlign: "left", fontSize: 12, color: "#991b1b" }}>
                                    <th style={{ padding: "8px 12px" }}>Bill No</th>
                                    <th style={{ padding: "8px 12px" }}>Bill Date</th>
                                    <th style={{ padding: "8px 12px" }}>Days Overdue</th>
                                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Total Amount</th>
                                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Paid</th>
                                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Balance Due</th>
                                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.bills.map((b) => (
                                    <tr key={b._id} style={{ borderBottom: "1px solid #fecaca", fontSize: 13 }}>
                                      <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1e293b" }}>{b.billNo || "N/A"}</td>
                                      <td style={{ padding: "8px 12px" }}>{fmtDate(b.billDate)}</td>
                                      <td style={{ padding: "8px 12px" }}>
                                        <span style={{ color: "#dc2626", fontWeight: 700 }}>{b.daysOverdue} Days</span>
                                      </td>
                                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{fmt(b.totalAmount)}</td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#22c55e" }}>{fmt(b.paidAmount)}</td>
                                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 800, color: "#dc2626" }}>
                                        {fmt(b.balanceDue)}
                                      </td>
                                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                        <button
                                          onClick={() => handleOpenPay(b, v.name)}
                                          style={{
                                            padding: "4px 10px",
                                            background: "#22c55e",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            fontWeight: 600,
                                            fontSize: 12,
                                            cursor: "pointer",
                                          }}
                                        >
                                          Pay Bill
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Grid Layout for Analytics Widgets */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, marginBottom: 24 }}>
            {/* Top Vendors by Balance Due */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Top Vendors by Balance Due</span>
                <span style={{ fontSize: 12, color: "#ef4444", background: "#fef2f2", padding: "2px 8px", borderRadius: 12 }}>Highest Debt</span>
              </h3>
              {topVendorsDue.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", margin: "20px 0" }}>No pending vendor dues</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topVendorsDue.map((item, idx) => {
                    const v = item.vendor || {};
                    return (
                      <div
                        key={v._id || idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#f8fafc",
                          borderRadius: 10,
                          borderLeft: "3px solid #ef4444",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{v.name || "Unknown"}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {v.firmName ? `${v.firmName} · ` : ""}
                            {item.billCount} bills
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "#ef4444" }}>{fmt(item.totalDue)}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>Total: {fmt(item.totalPurchases)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GST vs Non-GST Purchase Calculations */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                GST vs Non-GST Purchases
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {gstBreakdown.map((gb) => {
                  const isGst = gb._id === "GST";
                  return (
                    <div
                      key={gb._id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: isGst ? "#f0fdf4" : "#fefce8",
                        border: `1px solid ${isGst ? "#bbf7d0" : "#fef08a"}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: isGst ? "#166534" : "#854d0e" }}>
                          {isGst ? "🧾 GST Purchase Bills" : "📦 Non-GST Purchase Bills"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, background: isGst ? "#dcfce7" : "#fef9c3", padding: "2px 8px", borderRadius: 10 }}>
                          {gb.billCount} Bills
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Total Amount</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{fmt(gb.totalAmount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Total Paid</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#22c55e" }}>{fmt(gb.totalPaid)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>Balance Due</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: gb.totalDue > 0 ? "#ef4444" : "#22c55e" }}>
                            {fmt(gb.totalDue)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Vendors by Purchase Volume */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                Top Vendors by Purchase Volume
              </h3>
              {topVendorsPurchase.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", margin: "20px 0" }}>No purchases recorded yet</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {topVendorsPurchase.map((item, idx) => {
                    const v = item.vendor || {};
                    return (
                      <div
                        key={v._id || idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "#f8fafc",
                          borderRadius: 10,
                          borderLeft: "3px solid #3b82f6",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{v.name || "Unknown"}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {v.firmName ? `${v.firmName} · ` : ""}
                            {item.billCount} bills
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: "#3b82f6" }}>{fmt(item.totalPurchases)}</div>
                          <div style={{ fontSize: 11, color: "#22c55e" }}>Paid: {fmt(item.totalPaid)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Payment Processing Modal */}
      {payModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1005,
            display: "flex",
            alignItems: "center",
            justify: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 28,
              maxWidth: 420,
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
                  Record Payment
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  Bill #{payModal.billNo || "N/A"} · <strong>{payModal.vendorName}</strong>
                </p>
              </div>
              <button
                onClick={() => setPayModal(null)}
                style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#fef2f2", padding: "10px 14px", borderRadius: 10, border: "1px solid #fecaca", marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#991b1b" }}>Outstanding Balance Due</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{fmt(payModal.dueAmount)}</div>
            </div>

            <form onSubmit={handleConfirmPay} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                  Amount to Pay (₹) *
                </label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                  min={1}
                  max={payModal.dueAmount}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "2px solid #cbd5e1",
                    fontSize: 16,
                    fontWeight: 700,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                  Payment Date
                </label>
                <input
                  type="date"
                  value={payForm.date}
                  onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#334155" }}>
                  Payment Mode
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                  {[
                    { value: "Cash", icon: "💵", label: "Cash" },
                    { value: "Online-Current", icon: "🏦", label: "Current" },
                    { value: "Online-Saving", icon: "📱", label: "Saving" },
                    { value: "Cheque", icon: "🧾", label: "Cheque" },
                  ].map(({ value, icon, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPayForm((f) => ({ ...f, mode: value }))}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 11,
                        border: payForm.mode === value ? "2px solid #6366f1" : "1px solid #e2e8f0",
                        background: payForm.mode === value ? "#eef2ff" : "#fff",
                        color: payForm.mode === value ? "#4f46e5" : "#475569",
                      }}
                    >
                      {icon}
                      <br />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(payForm.mode.includes("Online") || payForm.mode === "Cheque") && (
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                    Reference / UTR / Cheque No.
                  </label>
                  <input
                    value={payForm.referenceNo}
                    onChange={(e) => setPayForm((f) => ({ ...f, referenceNo: e.target.value }))}
                    placeholder="Enter transaction reference number"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 4, color: "#334155" }}>
                  Payment Note
                </label>
                <input
                  value={payForm.note}
                  onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Optional payment details..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setPayModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#475569",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  style={{
                    flex: 2,
                    padding: "12px",
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
                  }}
                >
                  {submittingPay ? "Saving..." : "✅ Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
