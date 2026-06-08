import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchAllUdhar,
  addUdhar,
  recordUdharPayment,
  deleteUdhar,
} from "../features/udhar/udharSlice";

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const today = () => new Date().toISOString().split("T")[0];

const STATUS_COLOR = {
  PENDING: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
  PARTIAL: { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" },
  CLEARED: { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Udhar() {
  const dispatch = useDispatch();
  const { records, totalPending, loading } = useSelector((s) => s.udhar);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ type: "", status: "", search: "" });
  const [showForm, setShowForm] = useState(false);
  const [payModal, setPayModal] = useState(null); // { id, personName, remaining }
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | PRODUCT_SALE | PERSONAL_LOAN

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
    if (activeTab !== "ALL") params.type = activeTab;
    dispatch(fetchAllUdhar(params));
  }, [dispatch, filters, activeTab]);

  useEffect(() => { load(); }, [load]);

  /* ── summary counts ── */
  const pending = records.filter(r => r.status === "PENDING").length;
  const partial = records.filter(r => r.status === "PARTIAL").length;
  const cleared = records.filter(r => r.status === "CLEARED").length;

  /* ── add form submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.personName || !form.totalAmount) return toast.error("Name and amount are required");
    const res = await dispatch(addUdhar({ ...form, type: activeTab === "ALL" ? form.type : activeTab }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Udhar entry added!");
      setShowForm(false);
      setForm({ type: "PRODUCT_SALE", personName: "", personPhone: "", productDetails: "", totalAmount: "", dueDate: "", note: "" });
      load();
    } else toast.error(res.payload || "Failed");
  };

  /* ── payment submit ── */
  const handlePay = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) return toast.error("Enter valid amount");
    const res = await dispatch(recordUdharPayment({ id: payModal.id, amount: Number(payAmount), note: payNote }));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Payment recorded!");
      setPayModal(null);
      setPayAmount("");
      setPayNote("");
    } else toast.error(res.payload || "Failed");
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this udhar entry?")) return;
    const res = await dispatch(deleteUdhar(id));
    if (res.meta.requestStatus === "fulfilled") toast.success("Deleted");
    else toast.error(res.payload || "Delete failed");
  };

  return (
    <>
      <UdharStyles />
      <div className="ud-wrapper">

        {/* ── Header ── */}
        <div className="ud-header">
          <div>
            <h1 className="ud-title">🤝 Udhar Khata</h1>
            <p className="ud-subtitle">Track credit sales & personal loans</p>
          </div>
          <button className="ud-btn-green" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ Cancel" : "+ New Entry"}
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="ud-summary-grid">
          <SummaryCard label="Total Pending" value={fmt(totalPending)} color="#991b1b" icon="💸" bold />
          <SummaryCard label="Pending Entries" value={pending} color="#991b1b" icon="⏳" />
          <SummaryCard label="Partial Paid" value={partial} color="#92400e" icon="🔄" />
          <SummaryCard label="Cleared" value={cleared} color="#166534" icon="✅" />
        </div>

        {/* ── Tabs ── */}
        <div className="ud-tabs">
          {[["ALL", "📋 All"], ["PRODUCT_SALE", "🛍 Product Sales"], ["PERSONAL_LOAN", "🤝 Personal Loans"]].map(([v, label]) => (
            <button key={v} className={`ud-tab${activeTab === v ? " ud-tab-active" : ""}`} onClick={() => setActiveTab(v)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="ud-filters">
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="ud-input">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="CLEARED">Cleared</option>
          </select>
          <input
            placeholder="🔍 Search name / phone..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="ud-input"
            style={{ minWidth: 220 }}
          />
        </div>

        {/* ── Add Form ── */}
        {showForm && (
          <form className="ud-form" onSubmit={handleSubmit}>
            <div className="ud-form-title">✏️ New Udhar Entry</div>
            <div className="ud-form-grid">
              {activeTab === "ALL" && (
                <div className="ud-field">
                  <label>Type</label>
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
                <label>Phone</label>
                <input placeholder="Mobile number" value={form.personPhone} onChange={e => setForm(f => ({ ...f, personPhone: e.target.value }))} className="ud-input" />
              </div>
              {(activeTab === "PRODUCT_SALE" || (activeTab === "ALL" && form.type === "PRODUCT_SALE")) && (
                <div className="ud-field ud-span2">
                  <label>Product Details</label>
                  <input placeholder="e.g. Red Kurti x2, Blue Saree x1" value={form.productDetails} onChange={e => setForm(f => ({ ...f, productDetails: e.target.value }))} className="ud-input" style={{ width: "100%" }} />
                </div>
              )}
              <div className="ud-field">
                <label>Total Amount (₹) *</label>
                <input type="number" min="1" placeholder="0" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} className="ud-input" required />
              </div>
              <div className="ud-field">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="ud-input" />
              </div>
              <div className="ud-field ud-span2">
                <label>Note</label>
                <input placeholder="Any extra note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="ud-input" style={{ width: "100%" }} />
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button type="submit" disabled={loading} className="ud-btn-green">{loading ? "Saving..." : "✓ Save Entry"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="ud-btn-outline">Cancel</button>
            </div>
          </form>
        )}

        {/* ── Records List ── */}
        {loading && <div className="ud-loading">Loading...</div>}

        {!loading && records.length === 0 && (
          <div className="ud-empty">
            <div style={{ fontSize: 50 }}>🤝</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10 }}>No udhar entries found</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>Click "+ New Entry" to add one</div>
          </div>
        )}

        {!loading && records.length > 0 && (
          <div className="ud-cards-grid">
            {records.map(record => {
              const remaining = record.totalAmount - record.paidAmount;
              const pct = Math.round((record.paidAmount / record.totalAmount) * 100);
              const sc = STATUS_COLOR[record.status];
              return (
                <div key={record._id} className="ud-card">
                  {/* Card Header */}
                  <div className="ud-card-head">
                    <div>
                      <div className="ud-card-name">{record.personName}</div>
                      {record.personPhone && <div className="ud-card-phone">📞 {record.personPhone}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <span className="ud-badge" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                        {record.status}
                      </span>
                      <span className="ud-type-badge">
                        {record.type === "PRODUCT_SALE" ? "🛍 Sale" : "🤝 Loan"}
                      </span>
                    </div>
                  </div>

                  {/* Product details */}
                  {record.productDetails && (
                    <div className="ud-card-detail">📦 {record.productDetails}</div>
                  )}
                  {record.note && (
                    <div className="ud-card-detail" style={{ color: "#6b7280" }}>📝 {record.note}</div>
                  )}

                  {/* Amount breakdown */}
                  <div className="ud-amount-row">
                    <div className="ud-amount-box">
                      <div className="ud-amount-label">Total</div>
                      <div className="ud-amount-val" style={{ color: "#1d4ed8" }}>{fmt(record.totalAmount)}</div>
                    </div>
                    <div className="ud-amount-box">
                      <div className="ud-amount-label">Paid</div>
                      <div className="ud-amount-val" style={{ color: "#166534" }}>{fmt(record.paidAmount)}</div>
                    </div>
                    <div className="ud-amount-box">
                      <div className="ud-amount-label">Remaining</div>
                      <div className="ud-amount-val" style={{ color: remaining > 0 ? "#991b1b" : "#166534" }}>{fmt(remaining)}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="ud-progress-wrap">
                    <div className="ud-progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="ud-progress-label">{pct}% paid</div>

                  {/* Due date */}
                  {record.dueDate && (
                    <div className="ud-due" style={{ color: new Date(record.dueDate) < new Date() && record.status !== "CLEARED" ? "#991b1b" : "#6b7280" }}>
                      📅 Due: {fmtDate(record.dueDate)}
                      {new Date(record.dueDate) < new Date() && record.status !== "CLEARED" && " ⚠️ Overdue"}
                    </div>
                  )}

                  {/* Payment history */}
                  {record.payments?.length > 0 && (
                    <div className="ud-payments">
                      <div className="ud-payments-title">Payment History</div>
                      {record.payments.map((p, i) => (
                        <div key={i} className="ud-payment-row">
                          <span>{fmtDate(p.date)}</span>
                          <span style={{ color: "#166534", fontWeight: 700 }}>{fmt(p.amount)}</span>
                          {p.note && <span style={{ color: "#6b7280", fontSize: 11 }}>{p.note}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="ud-card-actions">
                    {record.status !== "CLEARED" && (
                      <button
                        className="ud-btn-pay"
                        onClick={() => { setPayModal({ id: record._id, personName: record.personName, remaining }); setPayAmount(""); setPayNote(""); }}
                      >
                        💰 Record Payment
                      </button>
                    )}
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

        {/* ── Payment Modal ── */}
        {payModal && (
          <div className="ud-modal-overlay" onClick={() => setPayModal(null)}>
            <div className="ud-modal" onClick={e => e.stopPropagation()}>
              <div className="ud-modal-title">💰 Record Payment</div>
              <div style={{ marginBottom: 12, color: "#374151" }}>
                <strong>{payModal.personName}</strong> — Remaining: <strong style={{ color: "#991b1b" }}>{fmt(payModal.remaining)}</strong>
              </div>
              <form onSubmit={handlePay}>
                <div className="ud-field" style={{ marginBottom: 12 }}>
                  <label>Amount Received (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    max={payModal.remaining}
                    placeholder="Enter amount"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="ud-input"
                    style={{ width: "100%" }}
                    autoFocus
                    required
                  />
                </div>
                <div className="ud-field" style={{ marginBottom: 16 }}>
                  <label>Note (optional)</label>
                  <input
                    placeholder="e.g. Paid by cash"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    className="ud-input"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={loading} className="ud-btn-green" style={{ flex: 1 }}>
                    {loading ? "Saving..." : "✓ Confirm Payment"}
                  </button>
                  <button type="button" onClick={() => setPayModal(null)} className="ud-btn-outline">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

/* ── Sub-components ── */
function SummaryCard({ label, value, color, icon, bold }) {
  return (
    <div className="ud-sum-card">
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
        background: #f0f2f5;
        padding: 24px 20px 40px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .ud-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;
      }
      .ud-title { margin: 0; font-size: 26px; font-weight: 700; color: #1a1a2e; }
      .ud-subtitle { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

      .ud-btn-green {
        padding: 9px 20px;
        background: linear-gradient(135deg, #1a6b3c, #145c31);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(26,107,60,0.3);
      }
      .ud-btn-green:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(26,107,60,0.4); }
      .ud-btn-green:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

      .ud-btn-outline {
        padding: 9px 20px;
        background: #fff;
        color: #374151;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ud-btn-outline:hover { border-color: #9ca3af; background: #f9fafb; }

      .ud-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 14px;
        margin-bottom: 20px;
      }
      .ud-sum-card {
        background: #fff;
        border-radius: 12px;
        padding: 16px 18px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        transition: transform 0.2s;
      }
      .ud-sum-card:hover { transform: translateY(-2px); }
      .ud-sum-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; font-weight: 500; }
      .ud-sum-value { font-weight: 700; }

      .ud-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .ud-tab {
        padding: 8px 18px;
        border: 1.5px solid #d1d5db;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        background: #fff;
        color: #374151;
        transition: all 0.2s;
      }
      .ud-tab:hover { border-color: #667eea; color: #667eea; }
      .ud-tab-active { background: linear-gradient(135deg, #667eea, #764ba2) !important; color: #fff !important; border-color: transparent !important; font-weight: 700; }

      .ud-filters {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 20px;
        background: #fff;
        padding: 12px 16px;
        border-radius: 10px;
        box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      }
      .ud-input {
        padding: 8px 12px;
        border: 1.5px solid #e5e7eb;
        border-radius: 8px;
        font-size: 13px;
        color: #374151;
        background: #fff;
        outline: none;
        transition: border-color 0.2s;
      }
      .ud-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }

      .ud-form {
        background: #fff;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        border: 1px solid #e5e7eb;
      }
      .ud-form-title { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-bottom: 16px; }
      .ud-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
      .ud-field label { display: block; font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
      .ud-span2 { grid-column: span 2; }

      .ud-loading { text-align: center; padding: 60px; color: #6b7280; font-size: 16px; }
      .ud-empty { text-align: center; padding: 80px 20px; color: #9ca3af; }

      .ud-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }

      .ud-card {
        background: #fff;
        border-radius: 14px;
        padding: 18px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        border: 1px solid #f3f4f6;
        transition: box-shadow 0.2s, transform 0.2s;
      }
      .ud-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.12); transform: translateY(-2px); }

      .ud-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
      .ud-card-name { font-size: 17px; font-weight: 700; color: #1a1a2e; }
      .ud-card-phone { font-size: 12px; color: #6b7280; margin-top: 2px; }
      .ud-card-detail { font-size: 12px; color: #374151; margin-bottom: 6px; background: #f9fafb; padding: 5px 8px; border-radius: 6px; }

      .ud-badge {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 20px;
        letter-spacing: 0.5px;
      }
      .ud-type-badge {
        font-size: 11px;
        color: #6b7280;
        background: #f3f4f6;
        padding: 2px 8px;
        border-radius: 20px;
      }

      .ud-amount-row {
        display: flex;
        gap: 8px;
        margin: 12px 0 8px;
      }
      .ud-amount-box {
        flex: 1;
        background: #f9fafb;
        border-radius: 8px;
        padding: 8px 10px;
        text-align: center;
      }
      .ud-amount-label { font-size: 10px; color: #9ca3af; font-weight: 600; text-transform: uppercase; margin-bottom: 3px; }
      .ud-amount-val { font-size: 14px; font-weight: 700; }

      .ud-progress-wrap {
        height: 6px;
        background: #e5e7eb;
        border-radius: 99px;
        overflow: hidden;
        margin-bottom: 4px;
      }
      .ud-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 99px;
        transition: width 0.4s ease;
      }
      .ud-progress-label { font-size: 11px; color: #9ca3af; margin-bottom: 8px; }

      .ud-due { font-size: 12px; margin-bottom: 10px; }

      .ud-payments {
        background: #f9fafb;
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 12px;
      }
      .ud-payments-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
      .ud-payment-row {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 12px;
        color: #374151;
        padding: 3px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .ud-payment-row:last-child { border-bottom: none; }

      .ud-card-actions { display: flex; gap: 8px; margin-top: 12px; }
      .ud-btn-pay {
        flex: 1;
        padding: 8px;
        background: linear-gradient(135deg, #1a6b3c, #145c31);
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ud-btn-pay:hover { opacity: 0.9; transform: translateY(-1px); }
      .ud-btn-del {
        padding: 8px 14px;
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .ud-btn-del:hover { background: #fee2e2; }

      /* Modal */
      .ud-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      .ud-modal {
        background: #fff;
        border-radius: 16px;
        padding: 28px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: udModalIn 0.2s ease;
      }
      .ud-modal-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; }

      @keyframes udModalIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      @media (max-width: 700px) {
        .ud-wrapper { padding: 8px 8px 20px; }
        .ud-summary-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ud-filters { flex-direction: column; gap: 8px; }
        .ud-filters .ud-input { width: 100% !important; min-width: unset !important; }
        .ud-tabs { flex-wrap: wrap; gap: 6px; }
        .ud-tab { padding: 6px 12px; font-size: 13px; }
        .ud-form-grid { grid-template-columns: 1fr; }
        .ud-span2 { grid-column: span 1; }
        .ud-header { flex-direction: column; align-items: flex-start; gap: 12px; }
      }

      @media (max-width: 600px) {
        .ud-cards-grid { grid-template-columns: 1fr; }
        .ud-span2 { grid-column: span 1; }
        .ud-amount-row { flex-direction: column; }
      }
    `}</style>
  );
}
