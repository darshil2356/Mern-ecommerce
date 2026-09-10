import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchAllUdhar,
  addUdhar,
  recordUdharPayment,
  deleteUdhar,
  toggleHideUdhar,
} from "../features/udhar/udharSlice";

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const hashColor = (str = "") => {
  const palette = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#14b8a6"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const STATUS_CONFIG = {
  PENDING: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5", label: "🔴 Pending" },
  PARTIAL: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d", label: "🟡 Partial" },
  CLEARED: { bg: "#d1fae5", text: "#166534", border: "#86efac", label: "🟢 Cleared" },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Udhar() {
  const dispatch = useDispatch();
  const udharState = useSelector((s) => s?.udhar) || {};
  const records = Array.isArray(udharState.records) ? udharState.records : [];
  const totalPending = udharState.totalPending || 0;
  const loading = Boolean(udharState.loading);
  const navigate = useNavigate();

  // Default status set to PENDING_PARTIAL (Pending + Partial) as requested
  const [filters, setFilters] = useState({
    type: "",
    status: "PENDING_PARTIAL",
    search: "",
    selectedCustomer: "",
    startDate: "",
    endDate: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [payModal, setPayModal] = useState(null); // { id, personName, remaining }
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PRODUCT_SALE | PERSONAL_LOAN
  const [whatsappPrompt, setWhatsappPrompt] = useState({ open: false, title: "", personName: "", whatsappUrl: "", messageText: "", whatsappSent: false });

  const [form, setForm] = useState({
    type: "PRODUCT_SALE",
    personName: "",
    personPhone: "",
    productDetails: "",
    totalAmount: "",
    dueDate: "",
    note: "",
  });

  const load = useCallback(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (activeTab !== "ALL") params.type = activeTab;
    dispatch(fetchAllUdhar(params));
  }, [dispatch, filters.status, filters.search, filters.startDate, filters.endDate, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── unique customer names list ── */
  const uniqueCustomers = React.useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      if (r.personName && r.personName.trim()) {
        const trimmed = r.personName.trim();
        const key = trimmed.toLowerCase();
        if (!map.has(key)) map.set(key, trimmed);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [records]);

  /* ── records for selected customer ── */
  const customerRecords = React.useMemo(() => {
    if (!filters.selectedCustomer) return records;
    const target = filters.selectedCustomer.trim().toLowerCase();
    return records.filter(r => (r.personName || "").trim().toLowerCase() === target);
  }, [records, filters.selectedCustomer]);

  /* ── customer stats summary ── */
  const custStats = React.useMemo(() => {
    if (!filters.selectedCustomer) return null;
    let totalBills = customerRecords.length;
    let totalAmount = 0;
    let totalPaid = 0;
    let outstanding = 0;
    customerRecords.forEach(r => {
      const tot = Number(r.totalAmount || 0);
      const pd = Number(r.paidAmount || 0);
      totalAmount += tot;
      totalPaid += pd;
      if (!r.isHidden && r.status !== "CLEARED" && (tot - pd) > 0.01) {
        outstanding += Math.max(0, tot - pd);
      }
    });
    return { totalBills, totalAmount, totalPaid, outstanding };
  }, [customerRecords, filters.selectedCustomer]);

  /* ── display total outstanding pending balance ── */
  const displayOutstanding = React.useMemo(() => {
    const targetList = filters.selectedCustomer ? customerRecords : records;
    return targetList
      .filter(r => (filters.status === "HIDDEN" ? r.isHidden === true : !r.isHidden) && r.status !== "CLEARED" && (Number(r.totalAmount || 0) - Number(r.paidAmount || 0)) > 0.01)
      .reduce((sum, r) => sum + Math.max(0, Number(r.totalAmount || 0) - Number(r.paidAmount || 0)), 0);
  }, [records, customerRecords, filters.selectedCustomer, filters.status]);

  /* ── client safety filter ── */
  const displayRecords = React.useMemo(() => {
    const targetList = filters.selectedCustomer ? customerRecords : records;
    return targetList.filter(r => {
      const paid = Number(r.paidAmount || 0);
      const total = Number(r.totalAmount || 0);
      const remaining = Math.max(0, total - paid);
      const isCleared = r.status === "CLEARED" || remaining <= 0.01 || (total > 0 && paid >= total);

      if (filters.status === "HIDDEN") {
        return r.isHidden === true;
      }

      // Non-hidden views strictly exclude hidden records
      if (r.isHidden === true) return false;

      if (filters.status === "PENDING_PARTIAL") {
        if (isCleared) return false;
      } else if (filters.status === "PENDING") {
        if (isCleared || paid > 0) return false;
      } else if (filters.status === "PARTIAL") {
        if (isCleared || paid === 0) return false;
      } else if (filters.status === "CLEARED") {
        if (!isCleared) return false;
      }
      return true;
    });
  }, [records, customerRecords, filters.status, filters.selectedCustomer]);

  /* ── summary counts ── */
  const targetSummaryList = filters.selectedCustomer ? customerRecords : records;
  const pendingCount = targetSummaryList.filter(r => !r.isHidden && r.status !== "CLEARED" && (Number(r.totalAmount || 0) - Number(r.paidAmount || 0)) > 0.01 && Number(r.paidAmount || 0) === 0).length;
  const partialCount = targetSummaryList.filter(r => !r.isHidden && r.status !== "CLEARED" && (Number(r.totalAmount || 0) - Number(r.paidAmount || 0)) > 0.01 && Number(r.paidAmount || 0) > 0).length;
  const clearedCount = targetSummaryList.filter(r => !r.isHidden && (r.status === "CLEARED" || (Number(r.totalAmount || 0) - Number(r.paidAmount || 0)) <= 0.01)).length;
  const hiddenCount = targetSummaryList.filter(r => r.isHidden === true).length;

  /* ── add form submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.totalAmount) return toast.error("Name and amount are required");
    const res = await dispatch(addUdhar({ ...form, type: activeTab === "ALL" ? form.type : activeTab }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Udhar entry added successfully!");
      const payload = res.payload;
      if (payload?.whatsappUrl) {
        setWhatsappPrompt({
          open: true,
          title: "Udhar Purchase Bill Notification",
          personName: form.personName,
          whatsappUrl: payload.whatsappUrl,
          messageText: payload.whatsappMessage || "",
          whatsappSent: payload.whatsappSent || false,
        });
      }
      setShowForm(false);
      setForm({ type: "PRODUCT_SALE", personName: "", personPhone: "", productDetails: "", totalAmount: "", dueDate: "", note: "" });
      load();
    } else toast.error(res.payload || "Failed to add Udhar entry");
  };

  /* ── payment submit ── */
  const handlePay = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return toast.error("Enter valid payment amount");
    const res = await dispatch(recordUdharPayment({ id: payModal.id, amount: Number(payAmount), note: payNote }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Payment recorded successfully!");
      const payload = res.payload;
      if (payload?.whatsappUrl) {
        setWhatsappPrompt({
          open: true,
          title: "Udhar Payment Confirmation Receipt",
          personName: payModal.personName,
          whatsappUrl: payload.whatsappUrl,
          messageText: payload.whatsappMessage || "",
          whatsappSent: payload.whatsappSent || false,
        });
      }
      setPayModal(null);
      setPayAmount("");
      setPayNote("");
      load();
    } else toast.error(res.payload || "Failed to record payment");
  };

  /* ── 1-click direct full clear payment ── */
  const handleDirectClearFull = async (record) => {
    const remaining = Math.max(0, Number(record.totalAmount || 0) - Number(record.paidAmount || 0));
    if (remaining <= 0.01) return toast.info("This record is already cleared!");

    if (!window.confirm(`⚡ Confirm Direct Full Payment Clear?\n\nCustomer: ${record.personName}\nRemaining Balance: ₹${remaining}\n\nThis will record full payment and move customer to Cleared status.`)) {
      return;
    }

    const res = await dispatch(recordUdharPayment({ id: record._id, amount: remaining, note: "Full Payment Direct Clear" }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Full payment cleared successfully!");
      const payload = res.payload;
      if (payload?.whatsappUrl) {
        setWhatsappPrompt({
          open: true,
          title: "Udhar Payment Confirmation Receipt",
          personName: record.personName,
          whatsappUrl: payload.whatsappUrl,
          messageText: payload.whatsappMessage || "",
          whatsappSent: payload.whatsappSent || false,
        });
      }
      load();
    } else {
      toast.error(res.payload || "Failed to clear payment");
    }
  };

  /* ── toggle hide/unhide customer (all bills) ── */
  const handleToggleHide = async (id, isCurrentlyHidden) => {
    const res = await dispatch(toggleHideUdhar(id));
    if (res.meta.requestStatus === "fulfilled") {
      const msg = res.payload?.message || (isCurrentlyHidden ? "All bills for this customer restored to active list" : "All bills for this customer hidden/archived");
      toast.success(msg);
      load();
    } else {
      toast.error(res.payload || "Failed to update customer status");
    }
  };

  /* ── send card whatsapp ── */
  const sendCardWhatsapp = (record) => {
    if (!record.personPhone) return toast.error("No phone number registered for this entry");
    const remaining = Math.max(0, record.totalAmount - record.paidAmount);
    const msg = `🛍️ *Yashoda Fashion* 🛍️\n*Udhar Status Notice*\n\nHello *${record.personName}*,\nHere is your current balance summary:\n\n💵 *Total Bill:* ₹${record.totalAmount}\n✅ *Paid So Far:* ₹${record.paidAmount}\n⚠️ *Remaining Baki (Udhar):* ₹${remaining}\n\nThank you!`;
    const cleanPhone = String(record.personPhone).replace(/\D/g, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://web.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Udhar entry?")) return;
    const res = await dispatch(deleteUdhar(id));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Deleted successfully");
      load();
    } else toast.error(res.payload || "Delete failed");
  };

  return (
    <>
      <UdharStyles />
      <div className="ud-wrapper">

        {/* ── Header ── */}
        <div className="ud-header">
          <div>
            <h1 className="ud-title">🤝 Udhar Khata (Credit Manager)</h1>
            <p className="ud-subtitle">Track customer credit sales, repayments, and automated WhatsApp receipts</p>
          </div>
          <button className="ud-btn-green" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Close Form" : "+ New Udhar Entry"}
          </button>
        </div>

        {/* ── Interactive Summary Cards ── */}
        <div className="ud-summary-grid">
          <SummaryCard
            label={filters.selectedCustomer ? `Outstanding (${filters.selectedCustomer})` : "Total Outstanding Pending"}
            value={fmt(displayOutstanding)}
            color="#991b1b"
            icon="💸"
            bold
            active={filters.status === "PENDING_PARTIAL"}
            onClick={() => setFilters(f => ({ ...f, status: "PENDING_PARTIAL" }))}
          />
          <SummaryCard
            label="Pending Entries (🔴)"
            value={pendingCount}
            color="#991b1b"
            icon="⏳"
            active={filters.status === "PENDING"}
            onClick={() => setFilters(f => ({ ...f, status: "PENDING" }))}
          />
          <SummaryCard
            label="Partial Paid (🟡)"
            value={partialCount}
            color="#92400e"
            icon="🔄"
            active={filters.status === "PARTIAL"}
            onClick={() => setFilters(f => ({ ...f, status: "PARTIAL" }))}
          />
          <SummaryCard
            label="Cleared Entries (🟢)"
            value={clearedCount}
            color="#166534"
            icon="✅"
            active={filters.status === "CLEARED"}
            onClick={() => setFilters(f => ({ ...f, status: "CLEARED" }))}
          />
          <SummaryCard
            label="Hidden Customers (🙈)"
            value={hiddenCount}
            color="#475569"
            icon="🙈"
            active={filters.status === "HIDDEN"}
            onClick={() => setFilters(f => ({ ...f, status: "HIDDEN" }))}
          />
        </div>

        {/* ── Category Tabs ── */}
        <div className="ud-tabs">
          {[["ALL", "📋 All Entries"], ["PRODUCT_SALE", "🛍 Product Sales"], ["PERSONAL_LOAN", "🤝 Personal Loans"]].map(([v, label]) => (
            <button key={v} className={`ud-tab${activeTab === v ? " ud-tab-active" : ""}`} onClick={() => setActiveTab(v)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="ud-filters">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Status:</span>
            <select
              value={filters.status}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="ud-input"
              style={{ fontWeight: 600, flex: 1 }}
            >
              <option value="PENDING_PARTIAL">⏳ Pending + Partial (Active Udhar)</option>
              <option value="">📋 All Statuses (Include Cleared)</option>
              <option value="PENDING">🔴 Pending Only</option>
              <option value="PARTIAL">🟡 Partial Only</option>
              <option value="CLEARED">🟢 Cleared Only</option>
              <option value="HIDDEN">🙈 Hidden Customers (Archived)</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 220px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Customer:</span>
            <select
              value={filters.selectedCustomer}
              onChange={e => setFilters(f => ({ ...f, selectedCustomer: e.target.value }))}
              className="ud-input"
              style={{ fontWeight: 700, flex: 1, color: filters.selectedCustomer ? "#2563eb" : "#1e293b" }}
            >
              <option value="">👤 All Customers ({uniqueCustomers.length})</option>
              {uniqueCustomers.map(cust => (
                <option key={cust} value={cust}>👤 {cust}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 200px" }}>
            <input
              placeholder="🔍 Search name / phone / product..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="ud-input"
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>From:</span>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="ud-input"
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>To:</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="ud-input"
            />
          </div>

          {(filters.search || filters.selectedCustomer || filters.startDate || filters.endDate || filters.status !== "PENDING_PARTIAL" || filters.type) && (
            <button
              className="ud-btn-outline"
              style={{ fontSize: 12, padding: "8px 14px", fontWeight: 600 }}
              onClick={() => setFilters({ type: "", status: "PENDING_PARTIAL", search: "", selectedCustomer: "", startDate: "", endDate: "" })}
            >
              🔄 Reset Filters
            </button>
          )}
        </div>

        {/* ── Selected Customer Profile & Financial Summary Banner ── */}
        {custStats && (
          <div className="ud-customer-banner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="ud-avatar" style={{ width: 44, height: 44, fontSize: 20, background: hashColor(filters.selectedCustomer) }}>
                  {filters.selectedCustomer.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                    👤 Customer Statement: <span style={{ color: "#2563eb" }}>{filters.selectedCustomer}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    Financial ledger breakdown for customer <strong>{filters.selectedCustomer}</strong>
                  </div>
                </div>
              </div>
              <button
                className="ud-btn-outline"
                style={{ fontSize: 12, padding: "6px 14px", borderColor: "#fca5a5", color: "#dc2626", fontWeight: 700 }}
                onClick={() => setFilters(f => ({ ...f, selectedCustomer: "" }))}
              >
                ✕ Clear Customer Filter
              </button>
            </div>

            <div className="ud-cust-stats-grid" style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div className="ud-cust-stat-box">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>TOTAL BILLS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#334155" }}>{custStats.totalBills}</div>
              </div>
              <div className="ud-cust-stat-box">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>TOTAL BILL AMOUNT</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>{fmt(custStats.totalAmount)}</div>
              </div>
              <div className="ud-cust-stat-box">
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>TOTAL PAID</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#166534" }}>{fmt(custStats.totalPaid)}</div>
              </div>
              <div className="ud-cust-stat-box" style={{ background: custStats.outstanding > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${custStats.outstanding > 0 ? "#fca5a5" : "#86efac"}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: custStats.outstanding > 0 ? "#991b1b" : "#166534" }}>OUTSTANDING BAKI</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: custStats.outstanding > 0 ? "#dc2626" : "#166534" }}>{fmt(custStats.outstanding)}</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Add New Entry Form ── */}
        {showForm && (
          <form className="ud-form" onSubmit={handleSubmit}>
            <div className="ud-form-title">✏️ Add New Udhar Record</div>
            <div className="ud-form-grid">
              {activeTab === "ALL" && (
                <div className="ud-field">
                  <label>Entry Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="ud-input">
                    <option value="PRODUCT_SALE">Product Sale (Credit)</option>
                    <option value="PERSONAL_LOAN">Personal Loan Given</option>
                  </select>
                </div>
              )}
              <div className="ud-field">
                <label>Person Name *</label>
                <input placeholder="Customer / Friend name" value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} className="ud-input" required />
              </div>
              <div className="ud-field">
                <label>Phone Number</label>
                <input placeholder="10-digit mobile number" value={form.personPhone} onChange={e => setForm(f => ({ ...f, personPhone: e.target.value }))} className="ud-input" />
              </div>
              {(activeTab === "PRODUCT_SALE" || (activeTab === "ALL" && form.type === "PRODUCT_SALE")) && (
                <div className="ud-field ud-span2">
                  <label>Product Details</label>
                  <input placeholder="e.g. Red Kurti x2, Blue Saree x1" value={form.productDetails} onChange={e => setForm(f => ({ ...f, productDetails: e.target.value }))} className="ud-input" style={{ width: "100%" }} />
                </div>
              )}
              <div className="ud-field">
                <label>Total Bill Amount (₹) *</label>
                <input type="number" min="1" placeholder="0" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} className="ud-input" required />
              </div>
              <div className="ud-field">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="ud-input" />
              </div>
              <div className="ud-field ud-span2">
                <label>Note / Remarks</label>
                <input placeholder="Any extra note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="ud-input" style={{ width: "100%" }} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading} className="ud-btn-green">{loading ? "Saving..." : "✓ Save Entry & Generate Receipt"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="ud-btn-outline">Cancel</button>
            </div>
          </form>
        )}

        {/* ── Records Cards Grid ── */}
        {loading && <div className="ud-loading">Loading Udhar records...</div>}

        {!loading && displayRecords.length === 0 && (
          <div className="ud-empty">
            <div style={{ fontSize: 50 }}>🤝</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>No matching Udhar records found</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Try changing status filter or click "+ New Udhar Entry"</div>
          </div>
        )}

        {!loading && displayRecords.length > 0 && (
          <div className="ud-cards-grid">
            {displayRecords.map(record => {
              const remaining = Math.max(0, Number(record.totalAmount || 0) - Number(record.paidAmount || 0));
              const pct = Math.min(100, Math.round((Number(record.paidAmount || 0) / Number(record.totalAmount || 1)) * 100));
              const sc = STATUS_CONFIG[record.status] || STATUS_CONFIG.PENDING;
              const isCleared = record.status === "CLEARED" || remaining <= 0.01;

              return (
                <div key={record._id} className="ud-card">
                  {/* Header */}
                  <div className="ud-card-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="ud-avatar" style={{ background: hashColor(record.personName) }}>
                        {record.personName ? record.personName.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className="ud-card-name">{record.personName}</div>
                        {record.personPhone ? (
                          <div className="ud-card-phone">📞 {record.personPhone}</div>
                        ) : (
                          <div className="ud-card-phone" style={{ color: "#9ca3af" }}>No mobile number</div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className="ud-badge" style={{ background: isCleared ? "#d1fae5" : sc.bg, color: isCleared ? "#166534" : sc.text, border: `1px solid ${isCleared ? "#86efac" : sc.border}` }}>
                        {isCleared ? "🟢 Cleared" : sc.label}
                      </span>
                      <span className="ud-type-badge">
                        {record.type === "PRODUCT_SALE" ? "🛍 Sale" : "🤝 Loan"}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {record.productDetails && (
                    <div className="ud-card-detail">📦 {record.productDetails}</div>
                  )}
                  {record.note && (
                    <div className="ud-card-detail" style={{ color: "#475569" }}>📝 {record.note}</div>
                  )}

                  {/* 3-Column Amount Breakdown */}
                  <div className="ud-amount-row">
                    <div className="ud-amount-box" style={{ borderLeft: "3px solid #3b82f6" }}>
                      <div className="ud-amount-label">Total Bill</div>
                      <div className="ud-amount-val" style={{ color: "#1d4ed8" }}>{fmt(record.totalAmount)}</div>
                    </div>
                    <div className="ud-amount-box" style={{ borderLeft: "3px solid #10b981" }}>
                      <div className="ud-amount-label">Paid</div>
                      <div className="ud-amount-val" style={{ color: "#166534" }}>{fmt(record.paidAmount)}</div>
                    </div>
                    <div className="ud-amount-box" style={{ borderLeft: `3px solid ${remaining > 0 ? "#ef4444" : "#10b981"}` }}>
                      <div className="ud-amount-label">Remaining</div>
                      <div className="ud-amount-val" style={{ color: remaining > 0 ? "#991b1b" : "#166534" }}>{fmt(remaining)}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="ud-progress-wrap">
                    <div className="ud-progress-bar" style={{ width: `${pct}%`, background: isCleared ? "#10b981" : "linear-gradient(90deg, #3b82f6, #8b5cf6)" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span className="ud-progress-label">{pct}% Paid</span>
                    {record.dueDate && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: new Date(record.dueDate) < new Date() && !isCleared ? "#ef4444" : "#64748b" }}>
                        📅 Due: {fmtDate(record.dueDate)} {new Date(record.dueDate) < new Date() && !isCleared && "⚠️ Overdue"}
                      </span>
                    )}
                  </div>

                  {/* Payment History */}
                  {record.payments?.length > 0 && (
                    <div className="ud-payments">
                      <div className="ud-payments-title">Payment History ({record.payments.length})</div>
                      {record.payments.map((p, i) => (
                        <div key={i} className="ud-payment-row">
                          <span>{fmtDate(p.date)}</span>
                          <span style={{ color: "#166534", fontWeight: 700 }}>+{fmt(p.amount)}</span>
                          {p.note && <span style={{ color: "#64748b", fontSize: 11 }}>({p.note})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="ud-card-actions">
                    {!isCleared && (
                      <>
                        <button
                          className="ud-btn-pay"
                          onClick={() => { setPayModal({ id: record._id, personName: record.personName, remaining }); setPayAmount(""); setPayNote(""); }}
                        >
                          💰 Record Payment
                        </button>
                        <button
                          className="ud-btn-green"
                          style={{ background: "linear-gradient(135deg, #059669, #10b981)", padding: "8px 10px", fontSize: 12 }}
                          onClick={() => handleDirectClearFull(record)}
                          title="1-Click Direct Clear Full Payment and update status to Cleared"
                        >
                          ⚡ Quick Clear Full
                        </button>
                      </>
                    )}

                    {record.personPhone && (
                      <button className="ud-btn-outline" style={{ borderColor: "#25D366", color: "#16a34a", fontWeight: 700 }} onClick={() => sendCardWhatsapp(record)}>
                        💬 WhatsApp
                      </button>
                    )}

                    <button
                      className="ud-btn-outline"
                      style={{ borderColor: record.isHidden ? "#3b82f6" : "#cbd5e1", color: record.isHidden ? "#2563eb" : "#475569" }}
                      onClick={() => handleToggleHide(record._id, record.isHidden)}
                    >
                      {record.isHidden ? "👁️ Unhide Customer" : "🙈 Hide Customer"}
                    </button>

                    {record.orderId && (
                      <button className="ud-btn-outline" onClick={() => navigate(`/admin/order/${record.orderId}`)}>
                        🔎 View Order
                      </button>
                    )}

                    <button className="ud-btn-del" onClick={() => handleDelete(record._id)}>🗑 Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Record Payment Modal ── */}
        {payModal && (
          <div className="ud-modal-overlay" onClick={() => setPayModal(null)}>
            <div className="ud-modal" onClick={e => e.stopPropagation()}>
              <div className="ud-modal-title">💰 Confirm Udhar Payment</div>
              <div style={{ marginBottom: 14, background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{payModal.personName}</div>
                <div style={{ fontSize: 13, color: "#991b1b", marginTop: 4 }}>
                  Remaining Udhar Balance: <strong>{fmt(payModal.remaining)}</strong>
                </div>
              </div>
              <form onSubmit={handlePay}>
                <div className="ud-field" style={{ marginBottom: 14 }}>
                  <label>Amount Received Today (₹) *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      min="1"
                      max={payModal.remaining}
                      placeholder="Enter collected amount"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      className="ud-input"
                      style={{ flex: 1, fontSize: 16, fontWeight: 700 }}
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      className="ud-btn-outline"
                      style={{ fontSize: 12, padding: "8px 12px", background: "#f1f5f9" }}
                      onClick={() => setPayAmount(payModal.remaining.toString())}
                    >
                      Max (Clear All)
                    </button>
                  </div>
                </div>
                <div className="ud-field" style={{ marginBottom: 18 }}>
                  <label>Note / Mode (optional)</label>
                  <input
                    placeholder="e.g. Received via GPay / Cash"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    className="ud-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={loading} className="ud-btn-green" style={{ flex: 1, padding: "10px", fontSize: 14 }}>
                    {loading ? "Recording..." : "✓ Confirm Payment & Send WhatsApp"}
                  </button>
                  <button type="button" onClick={() => setPayModal(null)} className="ud-btn-outline">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── WhatsApp Receipt Dispatch Modal ── */}
        {whatsappPrompt.open && (
          <div className="ud-modal-overlay" onClick={() => setWhatsappPrompt(p => ({ ...p, open: false }))}>
            <div className="ud-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <div className="ud-modal-title" style={{ display: "flex", alignItems: "center", gap: 8, color: "#16a34a" }}>
                <span>📱</span> {whatsappPrompt.title}
              </div>
              <div style={{ margin: "12px 0", fontSize: 13, color: "#374151" }}>
                {whatsappPrompt.whatsappSent ? (
                  <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, color: "#166534", fontWeight: 700 }}>
                    ✅ Automatically sent via Meta WhatsApp Cloud API!
                  </div>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#fefce8", border: "1px solid #fde047", borderRadius: 10, color: "#854d0e", fontWeight: 600 }}>
                    💡 Send WhatsApp receipt to <strong>{whatsappPrompt.personName}</strong>:
                  </div>
                )}
              </div>
              <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", color: "#334155", maxHeight: 160, overflowY: "auto", border: "1px solid #cbd5e1" }}>
                {whatsappPrompt.messageText}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="ud-btn-green"
                  style={{ flex: 1, background: "#25D366", borderColor: "#25D366", fontWeight: 700, padding: "10px" }}
                  onClick={() => {
                    if (whatsappPrompt.whatsappUrl) {
                      window.open(whatsappPrompt.whatsappUrl, "_blank");
                    }
                    setWhatsappPrompt(p => ({ ...p, open: false }));
                  }}
                >
                  💬 Open WhatsApp Web Now
                </button>
                <button
                  type="button"
                  className="ud-btn-outline"
                  onClick={() => setWhatsappPrompt(p => ({ ...p, open: false }))}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

/* ── Sub-components ── */
function SummaryCard({ label, value, color, icon, bold, active, onClick }) {
  return (
    <div
      className={`ud-sum-card ${active ? "ud-sum-card-active" : ""}`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="ud-sum-label">{label}</div>
          <div className="ud-sum-value" style={{ color, fontSize: bold ? 22 : 20 }}>{value}</div>
        </div>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
    </div>
  );
}

/* ── Styles ── */
function UdharStyles() {
  return (
    <style>{`
      .ud-wrapper {
        min-height: 100vh;
        background: #f8fafc;
        padding: 24px 20px 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .ud-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;
      }
      .ud-title { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; }
      .ud-subtitle { margin: 4px 0 0; font-size: 13px; color: #64748b; }

      .ud-btn-green {
        padding: 10px 20px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        border: none;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
      }
      .ud-btn-green:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(16, 185, 129, 0.45); }
      .ud-btn-green:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

      .ud-btn-outline {
        padding: 9px 18px;
        background: #fff;
        color: #334155;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .ud-btn-outline:hover { border-color: #94a3b8; background: #f8fafc; }

      .ud-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
        margin-bottom: 20px;
      }
      .ud-sum-card {
        background: #fff;
        border-radius: 14px;
        padding: 16px 18px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        border: 1.5px solid #e2e8f0;
        transition: all 0.2s ease;
      }
      .ud-sum-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
      .ud-sum-card-active { border-color: #3b82f6 !important; background: #eff6ff !important; }
      .ud-sum-label { font-size: 12px; color: #64748b; margin-bottom: 4px; font-weight: 600; }
      .ud-sum-value { font-weight: 800; }

      .ud-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .ud-tab {
        padding: 8px 18px;
        border: 1.5px solid #cbd5e1;
        border-radius: 10px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        background: #fff;
        color: #475569;
        transition: all 0.2s ease;
      }
      .ud-tab:hover { border-color: #6366f1; color: #6366f1; }
      .ud-tab-active { background: linear-gradient(135deg, #4f46e5, #6366f1) !important; color: #fff !important; border-color: transparent !important; font-weight: 700; shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }

      .ud-filters {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 20px;
        background: #fff;
        padding: 14px 18px;
        border-radius: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        border: 1px solid #e2e8f0;
      }
      .ud-customer-banner {
        background: linear-gradient(135deg, #ffffff, #f8fafc);
        border: 1.5px solid #cbd5e1;
        border-radius: 16px;
        padding: 18px 22px;
        margin-bottom: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      }
      .ud-cust-stat-box {
        background: #fff;
        padding: 12px 16px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      }
      .ud-input {
        padding: 9px 13px;
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        font-size: 13px;
        color: #1e293b;
        background: #fff;
        outline: none;
        transition: border-color 0.2s ease;
      }
      .ud-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); }

      .ud-form {
        background: #fff;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        border: 1px solid #e2e8f0;
      }
      .ud-form-title { font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 18px; }
      .ud-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
      .ud-field label { display: block; font-size: 11px; color: #64748b; margin-bottom: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      .ud-span2 { grid-column: span 2; }

      .ud-loading { text-align: center; padding: 60px; color: #64748b; font-size: 15px; font-weight: 600; }
      .ud-empty { text-align: center; padding: 80px 20px; color: #94a3b8; }

      .ud-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 18px;
      }

      .ud-card {
        background: #fff;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .ud-card:hover { box-shadow: 0 10px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }

      .ud-avatar {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        color: #fff;
        font-weight: 800;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .ud-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
      .ud-card-name { font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.2; }
      .ud-card-phone { font-size: 12px; color: #64748b; margin-top: 3px; font-weight: 600; }
      .ud-card-detail { font-size: 12px; color: #334155; margin-bottom: 8px; background: #f8fafc; padding: 6px 10px; border-radius: 8px; border: 1px solid #f1f5f9; }

      .ud-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
      }
      .ud-type-badge {
        font-size: 11px;
        color: #64748b;
        background: #f1f5f9;
        padding: 2px 8px;
        border-radius: 20px;
        font-weight: 600;
      }

      .ud-amount-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 12px 0 8px;
      }
      .ud-amount-box {
        background: #f8fafc;
        border-radius: 10px;
        padding: 8px;
        text-align: center;
        border: 1px solid #f1f5f9;
      }
      .ud-amount-label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 3px; }
      .ud-amount-val { font-size: 14px; font-weight: 800; }

      .ud-progress-wrap {
        height: 7px;
        background: #e2e8f0;
        border-radius: 99px;
        overflow: hidden;
        margin-top: 6px;
      }
      .ud-progress-bar {
        height: 100%;
        border-radius: 99px;
        transition: width 0.4s ease;
      }
      .ud-progress-label { font-size: 11px; color: #64748b; font-weight: 600; }

      .ud-payments {
        background: #f8fafc;
        border-radius: 10px;
        padding: 10px 12px;
        margin: 10px 0;
        border: 1px solid #f1f5f9;
      }
      .ud-payments-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
      .ud-payment-row {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 12px;
        color: #334155;
        padding: 3px 0;
        border-bottom: 1px solid #e2e8f0;
      }
      .ud-payment-row:last-child { border-bottom: none; }

      .ud-card-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
      .ud-btn-pay {
        flex: 1;
        padding: 8px 12px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .ud-btn-pay:hover { opacity: 0.9; transform: translateY(-1px); }
      .ud-btn-del {
        padding: 8px 12px;
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .ud-btn-del:hover { background: #fee2e2; }

      /* Modal */
      .ud-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      .ud-modal {
        background: #fff;
        border-radius: 20px;
        padding: 28px;
        width: 100%;
        max-width: 440px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: udModalIn 0.25s ease;
      }
      .ud-modal-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 14px; }

      @keyframes udModalIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      @media (max-width: 768px) {
        .ud-wrapper { padding: 12px 10px 30px; }
        .ud-summary-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .ud-filters { flex-direction: column; align-items: stretch; gap: 10px; }
        .ud-form-grid { grid-template-columns: 1fr; }
        .ud-span2 { grid-column: span 1; }
        .ud-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      }

      @media (max-width: 480px) {
        .ud-cards-grid { grid-template-columns: 1fr; }
        .ud-card-actions { flex-direction: column; }
        .ud-btn-pay { width: 100%; }
      }
    `}</style>
  );
}
