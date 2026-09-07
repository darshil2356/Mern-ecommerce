import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchPurchases,
  deletePurchase,
  recordPurchasePayment,
  fetchVendors,
  fetchPurchaseSummary,
  toggleVendorsVisible,
} from "../features/purchase/purchaseSlice";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const STATUS_STYLE = {
  PAID:    { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  PARTIAL: { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" },
  PENDING: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
};

const GST_LABEL = {
  NONE:      { label: "Non-GST", color: "#6b7280", bg: "#f9fafb" },
  CGST_SGST: { label: "GST (C+S)", color: "#1d4ed8", bg: "#eff6ff" },
  IGST:      { label: "GST (IGST)", color: "#7c3aed", bg: "#f5f3ff" },
};

export default function PurchaseList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { purchases, total, totals, vendors, summary, loading, vendorsVisible } = useSelector(s => s.purchase);

  // Default: GST bills only
  const [showAll, setShowAll] = useState(false);

  // Triple-click title = toggle Vendors section visibility in sidebar
  const titleClickRef = useRef(0);
  const titleTimerRef = useRef(null);
  const handleTitleClick = () => {
    titleClickRef.current += 1;
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => { titleClickRef.current = 0; }, 600);
    if (titleClickRef.current >= 3) {
      titleClickRef.current = 0;
      dispatch(toggleVendorsVisible());
      setShowAll(prev => !prev);
      toast.info(vendorsVisible ? "Vendors hidden · GST only" : "Vendors unlocked · All bills", { autoClose: 1500 });
    }
  };

  const [filters, setFilters] = useState({
    vendor: "", status: "", startDate: "", endDate: "", search: "",
  });
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PENDING | PARTIAL | PAID
  const [payModal, setPayModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const EMPTY_PAY_FORM = {
    amount: "",
    discountType: "NONE",
    discountValue: "",
    discountAmount: "",
    grAmount: "",
    grNote: "",
    mode: "Cash",
    referenceNo: "",
    note: "",
    date: new Date().toISOString().split("T")[0],
  };

  const [payForm, setPayForm] = useState(EMPTY_PAY_FORM);

  const sumMonth = new Date().getMonth() + 1;
  const sumYear = new Date().getFullYear();

  const load = useCallback(() => {
    const params = { ...filters };
    if (activeTab !== "ALL") params.status = activeTab;
    if (!showAll) params.onlyGST = "true";
    else params.onlyGST = "false";
    dispatch(fetchPurchases(params));
  }, [dispatch, filters, activeTab, showAll]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    dispatch(fetchVendors({}));
    dispatch(fetchPurchaseSummary({ month: sumMonth, year: sumYear }));
  }, [dispatch, sumMonth, sumYear]);

  const handlePay = async (e) => {
    e.preventDefault();
    const paidAmt = parseFloat(payForm.amount) || 0;
    const discVal = parseFloat(payForm.discountValue) || 0;
    let discAmt = parseFloat(payForm.discountAmount) || 0;
    if (payForm.discountType === "PERCENTAGE" && discVal > 0 && !discAmt) {
      discAmt = (payModal.totalAmount * discVal) / 100;
    }
    const grAmt = parseFloat(payForm.grAmount) || 0;

    if (paidAmt <= 0 && discAmt <= 0 && grAmt <= 0) {
      return toast.error("Please enter a valid paid, discount, or GR amount");
    }

    const res = await dispatch(recordPurchasePayment({
      id: payModal._id,
      amount: paidAmt,
      discountType: payForm.discountType,
      discountValue: discVal,
      discountAmount: discAmt,
      grAmount: grAmt,
      grNote: payForm.grNote,
      mode: payForm.mode,
      referenceNo: payForm.referenceNo,
      note: payForm.note,
      date: payForm.date,
    }));

    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Payment & settlement recorded!");
      setPayModal(null);
      setPayForm(EMPTY_PAY_FORM);
      load();
    } else {
      toast.error(res.payload || "Payment failed");
    }
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deletePurchase(id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Bill deleted");
      setDeleteConfirm(null);
      load();
    } else {
      toast.error(res.payload || "Delete failed");
    }
  };

  const displayedPurchases = showAll
    ? purchases
    : purchases.filter(p => p.gstType === "CGST_SGST" || p.gstType === "IGST");

  const displayedTotals = {
    totalAmount: displayedPurchases.reduce((a, p) => a + (p.totalAmount || 0), 0),
    totalPaid:   displayedPurchases.reduce((a, p) => a + (p.paidAmount || 0), 0),
    totalDue:    displayedPurchases.reduce((a, p) => a + (p.balanceDue || 0), 0),
  };

  const counts = {
    ALL: displayedPurchases.length,
    PENDING: displayedPurchases.filter(p => p.status === "PENDING").length,
    PARTIAL: displayedPurchases.filter(p => p.status === "PARTIAL").length,
    PAID: displayedPurchases.filter(p => p.status === "PAID").length,
  };

  return (
    <div style={{ padding: "20px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2
            onClick={handleTitleClick}
            style={{ margin: 0, fontSize: 22, fontWeight: 700, cursor: "default", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            Purchase Bills
            {vendorsVisible && (
              <span
                style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", verticalAlign: "middle" }}
                title="Vendors section unlocked"
              />
            )}
          </h2>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            {showAll ? "Showing all bills (GST + Non-GST)" : "Showing GST bills only"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {vendorsVisible && (
            <button onClick={() => navigate("/admin/vendors")} style={{
              padding: "10px 16px", background: "#f3f4f6", border: "1px solid #d1d5db",
              borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#374151",
            }}>
              🏪 Vendors
            </button>
          )}
          <button onClick={() => navigate("/admin/add-purchase")} style={{
            padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none",
            borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14,
          }}>
            + Add Bill
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Bills", value: displayedPurchases.length, color: "#6366f1", icon: "📄" },
          { label: "Total Amount", value: fmt(displayedTotals.totalAmount), color: "#3b82f6", icon: "📦" },
          { label: "Total Paid", value: fmt(displayedTotals.totalPaid), color: "#22c55e", icon: "✅" },
          { label: "Total Due", value: fmt(displayedTotals.totalDue), color: "#ef4444", icon: "⏳" },
        ].map(c => (
          <div key={c.label} style={{
            background: "#fff", borderRadius: 10, padding: "14px 16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: `4px solid ${c.color}`,
          }}>
            <div style={{ fontSize: 20 }}>{c.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 8, padding: 4, marginBottom: 16, width: "fit-content" }}>
        {["ALL", "PENDING", "PARTIAL", "PAID"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
            background: activeTab === tab ? "#fff" : "transparent",
            color: activeTab === tab ? (tab === "PENDING" ? "#dc2626" : tab === "PARTIAL" ? "#d97706" : tab === "PAID" ? "#15803d" : "#111") : "#6b7280",
            boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
            {tab} {counts[tab] ? `(${counts[tab]})` : ""}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          placeholder="Search bill no..."
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, width: 160 }}
        />
        <select
          value={filters.vendor}
          onChange={e => setFilters(f => ({ ...f, vendor: e.target.value }))}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, maxWidth: 180 }}
        >
          <option value="">All Vendors</option>
          {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
        </select>
        <input
          type="date"
          value={filters.startDate}
          onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
        <button onClick={() => setFilters({ vendor: "", status: "", startDate: "", endDate: "", search: "" })} style={{
          padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca",
          borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>
          Clear
        </button>
      </div>

      {/* Table */}
      {loading && !displayedPurchases.length ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Loading...</div>
      ) : displayedPurchases.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 60, background: "#fff", borderRadius: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
          <p style={{ color: "#6b7280", fontSize: 16 }}>No purchase bills found.</p>
          <button onClick={() => navigate("/admin/add-purchase")} style={{
            background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontWeight: 600, cursor: "pointer",
          }}>
            + Add First Bill
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Bill No", "Date", "Vendor", "Type", "Items", "Total", "Paid", "Balance", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedPurchases.map((p, i) => {
                  const gst = GST_LABEL[p.gstType] || GST_LABEL.NONE;
                  const st = STATUS_STYLE[p.status] || STATUS_STYLE.PENDING;
                  return (
                    <tr key={p._id} style={{ borderBottom: "1px solid #f9fafb", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#6366f1", fontSize: 14 }}>
                        {p.billNo || <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>No Bill No</span>}
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>{fmtDate(p.billDate)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.vendor?.name || "-"}</div>
                        {p.vendor?.firmName && <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.vendor.firmName}</div>}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: gst.bg, color: gst.color, padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                          {gst.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: "#374151" }}>
                        {p.items?.length || 0}
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 700, fontSize: 14 }}>{fmt(p.totalAmount)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "#22c55e", fontWeight: 600 }}>{fmt(p.paidAmount)}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontWeight: 700, color: p.balanceDue > 0 ? "#ef4444" : "#22c55e", fontSize: 13 }}>
                          {fmt(p.balanceDue)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: st.bg, color: st.text, border: `1px solid ${st.border}`, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setViewModal(p)} style={{
                            padding: "4px 10px", background: "#eff6ff", color: "#1d4ed8",
                            border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12,
                          }}>View</button>
                          <button onClick={() => navigate(`/admin/add-purchase?edit=${p._id}`)} style={{
                            padding: "4px 10px", background: "#fffbeb", color: "#b45309",
                            border: "1px solid #fde68a", borderRadius: 6, cursor: "pointer", fontSize: 12,
                          }}>Edit</button>
                          {p.status !== "PAID" && (
                            <button onClick={() => { setPayModal(p); setPayForm({ amount: p.balanceDue, mode: "Cash", referenceNo: "", note: "", date: new Date().toISOString().split("T")[0] }); }} style={{
                              padding: "4px 10px", background: "#f0fdf4", color: "#15803d",
                              border: "1px solid #bbf7d0", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
                            }}>Pay</button>
                          )}
                          <button onClick={() => setDeleteConfirm(p)} style={{
                            padding: "4px 10px", background: "#fef2f2", color: "#dc2626",
                            border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 12,
                          }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Bill Modal */}
      {viewModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700,
            maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
                  Purchase Bill {viewModal.billNo ? `#${viewModal.billNo}` : ""}
                </h3>
                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  {viewModal.vendor?.name} {viewModal.vendor?.firmName ? `(${viewModal.vendor.firmName})` : ""} · {fmtDate(viewModal.billDate)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => window.print()} style={{
                  padding: "6px 14px", background: "#f3f4f6", border: "1px solid #d1d5db",
                  borderRadius: 8, cursor: "pointer", fontSize: 13,
                }}>🖨️ Print</button>
                <button onClick={() => setViewModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Bill type badge */}
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{
                  background: GST_LABEL[viewModal.gstType]?.bg, color: GST_LABEL[viewModal.gstType]?.color,
                  padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>
                  {GST_LABEL[viewModal.gstType]?.label}
                </span>
                {viewModal.gstType !== "NONE" && viewModal.taxIncluded && (
                  <span style={{ background: "#fffbeb", color: "#92400e", padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>
                    Tax Inclusive
                  </span>
                )}
                <span style={{
                  background: STATUS_STYLE[viewModal.status]?.bg, color: STATUS_STYLE[viewModal.status]?.text,
                  border: `1px solid ${STATUS_STYLE[viewModal.status]?.border}`,
                  padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>
                  {viewModal.status}
                </span>
              </div>

              {/* Items */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Description</th>
                    {viewModal.gstType !== "NONE" && <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>HSN</th>}
                    <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Qty</th>
                    <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Rate</th>
                    <th style={{ padding: "8px 8px", textAlign: "center", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Disc%</th>
                    {viewModal.gstType !== "NONE" && <th style={{ padding: "8px 8px", textAlign: "right", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Tax</th>}
                    <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewModal.items || []).map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 12px", fontSize: 14 }}>
                        <div style={{ fontWeight: 500 }}>{item.description}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{item.unit}</div>
                      </td>
                      {viewModal.gstType !== "NONE" && <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 12, color: "#6b7280" }}>{item.hsnCode || "-"}</td>}
                      <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 13 }}>{item.qty}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 13 }}>₹{item.rate}</td>
                      <td style={{ padding: "10px 8px", textAlign: "center", fontSize: 13 }}>{item.discountPercent || 0}%</td>
                      {viewModal.gstType !== "NONE" && (
                        <td style={{ padding: "10px 8px", textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                          {viewModal.gstType === "CGST_SGST"
                            ? `${item.cgstPercent || 0}+${item.sgstPercent || 0}%`
                            : `${item.igstPercent || 0}%`}
                        </td>
                      )}
                      <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 14, fontWeight: 600 }}>₹{item.total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: 280, background: "#f9fafb", borderRadius: 8, padding: 14 }}>
                  {[
                    { label: "Subtotal", value: `₹${viewModal.subtotal?.toFixed(2)}`, show: true },
                    { label: "Total Discount", value: `-₹${(viewModal.discountAmount || 0).toFixed(2)}`, show: viewModal.discountAmount > 0 },
                    { label: "Taxable Amt", value: `₹${viewModal.taxableAmount?.toFixed(2)}`, show: viewModal.gstType !== "NONE" },
                    { label: "CGST", value: `₹${viewModal.totalCGST?.toFixed(2)}`, show: viewModal.gstType === "CGST_SGST" },
                    { label: "SGST", value: `₹${viewModal.totalSGST?.toFixed(2)}`, show: viewModal.gstType === "CGST_SGST" },
                    { label: "IGST", value: `₹${viewModal.totalIGST?.toFixed(2)}`, show: viewModal.gstType === "IGST" },
                    { label: "Round Off", value: `₹${viewModal.roundOff?.toFixed(2)}`, show: Math.abs(viewModal.roundOff) > 0.001 },
                  ].filter(r => r.show).map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 4 }}>
                      <span>{r.label}</span><span>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: "1px solid #e5e7eb" }}>
                    <span>TOTAL</span><span>₹{viewModal.totalAmount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#22c55e", marginTop: 6 }}>
                    <span>Cash Paid</span><span>₹{viewModal.paidAmount || 0}</span>
                  </div>
                  {viewModal.settlementDiscount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#b45309", marginTop: 4 }}>
                      <span>Discount (Kasur)</span><span>₹{viewModal.settlementDiscount}</span>
                    </div>
                  )}
                  {viewModal.grAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#166534", marginTop: 4 }}>
                      <span>Goods Return (GR)</span><span>₹{viewModal.grAmount}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: viewModal.balanceDue > 0 ? "#ef4444" : "#22c55e", marginTop: 6, paddingTop: 6, borderTop: "1px dashed #e5e7eb" }}>
                    <span>Balance Due</span><span>₹{viewModal.balanceDue}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Settlement History */}
              {viewModal.payments?.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700 }}>Payment & Settlement History</h4>
                  {viewModal.payments.map((pay, i) => (
                    <div key={i} style={{ background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 4 }}>
                        <span style={{ color: "#6b7280", fontWeight: 600 }}>{fmtDate(pay.date)}</span>
                        <span style={{ fontWeight: 600, color: "#334155" }}>{pay.mode} {pay.referenceNo ? `(${pay.referenceNo})` : ""}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: 13, flexWrap: "wrap" }}>
                        {pay.amount > 0 && <span style={{ fontWeight: 700, color: "#16a34a" }}>Paid: ₹{pay.amount}</span>}
                        {pay.discountAmount > 0 && (
                          <span style={{ fontWeight: 600, color: "#b45309" }}>
                            Disc: ₹{pay.discountAmount} ({pay.discountType === "PERCENTAGE" ? `${pay.discountValue}%` : "Flat"})
                          </span>
                        )}
                        {pay.grAmount > 0 && <span style={{ fontWeight: 600, color: "#166534" }}>GR: ₹{pay.grAmount}</span>}
                      </div>
                      {pay.grNote && <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>📦 {pay.grNote}</div>}
                      {pay.note && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>📝 {pay.note}</div>}
                    </div>
                  ))}
                </div>
              )}

              {viewModal.note && (
                <div style={{ marginTop: 16, background: "#fffbeb", borderRadius: 8, padding: 12, fontSize: 13, color: "#92400e" }}>
                  📝 {viewModal.note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (() => {
        const discVal = parseFloat(payForm.discountValue) || 0;
        const calcDiscAmt = payForm.discountType === "PERCENTAGE" ? ((payModal.totalAmount || 0) * discVal) / 100 : (payForm.discountType === "FLAT" ? discVal : 0);
        const effectiveDiscAmt = parseFloat(payForm.discountAmount) || calcDiscAmt;
        const grAmt = parseFloat(payForm.grAmount) || 0;
        const paidAmt = parseFloat(payForm.amount) || 0;
        const totalSettlement = paidAmt + effectiveDiscAmt + grAmt;
        const remDue = Math.max(0, payModal.balanceDue - totalSettlement);

        return (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1001,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
          }}>
            <div style={{
              background: "#fff", borderRadius: 16, padding: 24, maxWidth: 500, width: "100%",
              maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Record Payment & Settlement</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                    {payModal.vendor?.name} · Bill #{payModal.billNo || "-"} · Total: <strong>{fmt(payModal.totalAmount)}</strong> · Due: <strong style={{ color: "#ef4444" }}>{fmt(payModal.balanceDue)}</strong>
                  </p>
                </div>
                <button onClick={() => setPayModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
              </div>

              <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* 1. Cash / Online Paid */}
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: 14, border: "1px solid #e5e7eb" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#111" }}>💵 Money Paid (Cash / Bank)</label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    min={0}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 15, fontWeight: 700, boxSizing: "border-box" }}
                  />

                  {/* Payment Mode */}
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4, color: "#6b7280" }}>Payment Mode</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                      {[
                        { value: "Cash",           icon: "💵", label: "Cash" },
                        { value: "Online-Current", icon: "🏦", label: "Current" },
                        { value: "Online-Saving",  icon: "📱", label: "Saving" },
                        { value: "Cheque",         icon: "🧾", label: "Cheque" },
                      ].map(({ value, icon, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPayForm(f => ({ ...f, mode: value }))}
                          style={{
                            padding: "8px 4px", borderRadius: 7, cursor: "pointer", fontWeight: 600, fontSize: 11,
                            border: payForm.mode === value ? "2px solid #6366f1" : "2px solid #e5e7eb",
                            background: payForm.mode === value ? "#f8f9ff" : "#fff",
                            color: payForm.mode === value ? "#6366f1" : "#374151",
                          }}
                        >
                          {icon}<br />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(payForm.mode === "Online-Current" || payForm.mode === "Online-Saving" || payForm.mode === "Cheque") && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        value={payForm.referenceNo}
                        onChange={e => setPayForm(f => ({ ...f, referenceNo: e.target.value }))}
                        placeholder={payForm.mode === "Cheque" ? "Cheque Number" : "UTR / Transaction ID"}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Vendor Discount (Kasur) Section */}
                <div style={{ background: "#fffbeb", borderRadius: 10, padding: 14, border: "1px solid #fde68a" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#92400e" }}>🏷️ Vendor Discount (Kasur Cut)</label>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[
                      { value: "NONE", label: "No Disc" },
                      { value: "PERCENTAGE", label: "% Percentage" },
                      { value: "FLAT", label: "₹ Flat Disc" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPayForm(f => ({ ...f, discountType: opt.value, discountValue: "", discountAmount: "" }))}
                        style={{
                          flex: 1, padding: "6px 4px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12,
                          border: payForm.discountType === opt.value ? "2px solid #d97706" : "1px solid #fcd34d",
                          background: payForm.discountType === opt.value ? "#fff" : "#fffbeb",
                          color: payForm.discountType === opt.value ? "#b45309" : "#78350f",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {payForm.discountType !== "NONE" && (
                    <div style={{ display: "grid", gridTemplateColumns: payForm.discountType === "PERCENTAGE" ? "1fr 1fr" : "1fr", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#92400e", marginBottom: 2 }}>
                          {payForm.discountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Flat Discount Amount (₹)"}
                        </label>
                        <input
                          type="number"
                          value={payForm.discountValue}
                          onChange={e => {
                            const val = e.target.value;
                            setPayForm(f => ({ ...f, discountValue: val, discountAmount: "" }));
                          }}
                          placeholder={payForm.discountType === "PERCENTAGE" ? "e.g. 5" : "e.g. 5000"}
                          min={0}
                          style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #fcd34d", fontSize: 14, fontWeight: 700, boxSizing: "border-box", background: "#fff" }}
                        />
                      </div>
                      {payForm.discountType === "PERCENTAGE" && (
                        <div>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#92400e", marginBottom: 2 }}>Calculated Cut (₹)</label>
                          <div style={{ padding: "7px 10px", background: "#fef3c7", borderRadius: 6, border: "1px solid #fcd34d", fontSize: 14, fontWeight: 700, color: "#b45309" }}>
                            ₹{calcDiscAmt.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Goods Return (GR) Section */}
                <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14, border: "1px solid #bbf7d0" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#166534" }}>📦 Goods Return (GR Cut)</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#166534", marginBottom: 2 }}>GR Amount (₹)</label>
                      <input
                        type="number"
                        value={payForm.grAmount}
                        onChange={e => setPayForm(f => ({ ...f, grAmount: e.target.value }))}
                        placeholder="e.g. 10000"
                        min={0}
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #86efac", fontSize: 14, fontWeight: 700, boxSizing: "border-box", background: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#166534", marginBottom: 2 }}>GR Note / Item Details</label>
                      <input
                        value={payForm.grNote}
                        onChange={e => setPayForm(f => ({ ...f, grNote: e.target.value }))}
                        placeholder="e.g. 5 sarees returned"
                        style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #86efac", fontSize: 13, boxSizing: "border-box", background: "#fff" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Date & Note */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Date</label>
                    <input
                      type="date"
                      value={payForm.date}
                      onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Note (optional)</label>
                    <input
                      value={payForm.note}
                      onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Remarks..."
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Live Settlement Breakdown */}
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569" }}>
                    <span>Cash / Bank Paid:</span><span>{fmt(paidAmt)}</span>
                  </div>
                  {effectiveDiscAmt > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#b45309", marginTop: 3 }}>
                      <span>Discount (Kasur):</span><span>- {fmt(effectiveDiscAmt)}</span>
                    </div>
                  )}
                  {grAmt > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#166534", marginTop: 3 }}>
                      <span>Goods Return (GR):</span><span>- {fmt(grAmt)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 6, paddingTop: 6, borderTop: "1px dashed #cbd5e1" }}>
                    <span>Total Settlement:</span><span>{fmt(totalSettlement)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: remDue > 0 ? "#dc2626" : "#16a34a", marginTop: 3 }}>
                    <span>Remaining Due:</span><span>{fmt(remDue)} {remDue === 0 ? "(Fully Settled)" : ""}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setPayModal(null)} style={{
                    flex: 1, padding: "11px", background: "#f3f4f6", border: "1px solid #d1d5db",
                    borderRadius: 8, cursor: "pointer", fontWeight: 600,
                  }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{
                    flex: 2, padding: "11px", background: "#22c55e", color: "#fff",
                    border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 15,
                  }}>
                    {loading ? "Saving..." : "✅ Confirm Settlement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1002,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, maxWidth: 380, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px" }}>Delete Bill?</h3>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>
              Delete bill {deleteConfirm.billNo || "-"} from <strong>{deleteConfirm.vendor?.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: "10px 24px", background: "#f3f4f6", border: "1px solid #d1d5db",
                borderRadius: 8, cursor: "pointer", fontWeight: 600,
              }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} style={{
                padding: "10px 24px", background: "#ef4444", color: "#fff",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
