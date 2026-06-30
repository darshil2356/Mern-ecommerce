import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  fetchCustomers, createCustomer, updateCustomer, deleteCustomer,
  fetchCustomerLedger, fetchBills, createBill, updateBill, deleteBill,
  addPayment, deletePayment, fetchDashboard, fetchAlerts, clearError, clearLedger,
} from "../features/wholesale/wholesaleSlice";

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

const today = () => new Date().toISOString().split("T")[0];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_COLOR = {
  PENDING: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
  PARTIAL: { bg: "#fffbeb", text: "#92400e", border: "#fcd34d" },
  PAID:    { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
};
const STATUS_LABEL = { PENDING: "Baki", PARTIAL: "Partial", PAID: "Paid" };

const PIE_COLORS = { PENDING: "#ef4444", PARTIAL: "#f59e0b", PAID: "#22c55e" };

const EMPTY_CUSTOMER = { name: "", firmName: "", phone: "", altPhone: "", city: "", gstin: "", openingBalance: "", note: "" };
const EMPTY_BILL = { billNo: "", billDate: today(), customer: "", description: "", totalAmount: "", note: "", initCash: "", initOnline: "", initOnlineMode: "", initOnlineRef: "", initNote: "" };
const EMPTY_PAY  = { cashAmount: "", onlineAmount: "", onlineMode: "", onlineRef: "", date: today(), note: "" };

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = "#1d4ed8", bg = "#eff6ff", icon }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{label}</div>
        {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0009", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px #0004" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b", lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

const inputStyle = { width: "100%", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 12px", fontSize: 14, boxSizing: "border-box", outline: "none", background: "#fff" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4, display: "block" };

function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={labelStyle}>{label}</label>{children}</div>;
}
function Row2({ children, gap = 12 }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap }}>{children}</div>;
}

// ─── Searchable Customer Dropdown ──────────────────────────────────────────────

function CustomerSearchSelect({ customers, value, onChange, placeholder = "Select customer…" }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = customers.find((c) => c._id === value);
  const filtered = customers
    .filter((c) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        (c.firmName || "").toLowerCase().includes(s) ||
        c.phone.includes(s)
      );
    })
    .slice(0, 10);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        style={{ ...inputStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ color: selected ? "#1e293b" : "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected
            ? `${selected.name}${selected.firmName ? ` (${selected.firmName})` : ""} — ${selected.phone}`
            : placeholder}
        </span>
        <span style={{ color: "#94a3b8", marginLeft: 8, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200, background: "#fff", border: "1px solid #d1d5db", borderRadius: 10, boxShadow: "0 10px 30px #0002", maxHeight: 340, overflowY: "auto" }}>
          {/* Search input */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff" }}>
            <input
              autoFocus
              style={{ ...inputStyle, margin: 0, fontSize: 13 }}
              placeholder="Type name / firm / phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Clear option */}
          {value && (
            <div
              style={{ padding: "8px 14px", cursor: "pointer", fontSize: 13, color: "#94a3b8", borderBottom: "1px solid #f1f5f9" }}
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              ✕ Clear selection
            </div>
          )}

          {/* Results */}
          {filtered.length === 0 ? (
            <div style={{ padding: "16px 14px", color: "#94a3b8", textAlign: "center", fontSize: 13 }}>No customers found</div>
          ) : (
            filtered.map((c) => (
              <div
                key={c._id}
                style={{ padding: "10px 14px", cursor: "pointer", background: c._id === value ? "#eff6ff" : "transparent", borderBottom: "1px solid #f8fafc", transition: "background 0.1s" }}
                onMouseEnter={(e) => { if (c._id !== value) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={(e) => { if (c._id !== value) e.currentTarget.style.background = "transparent"; }}
                onClick={() => { onChange(c._id); setOpen(false); setSearch(""); }}
              >
                <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                  {c.name}{c.firmName ? <span style={{ color: "#64748b", fontWeight: 400 }}> ({c.firmName})</span> : ""}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  📞 {c.phone}{c.city ? ` · 📍 ${c.city}` : ""}
                  {c.totalDue > 0 && <span style={{ color: "#ef4444", fontWeight: 600 }}> · Due: {fmt(c.totalDue)}</span>}
                </div>
              </div>
            ))
          )}

          {!search && customers.length > 10 && (
            <div style={{ padding: "8px 14px", color: "#94a3b8", fontSize: 12, textAlign: "center", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
              Showing first 10 of {customers.length} — type to search more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Mixed Payment Fields ─────────────────────────────────────────────────────

function MixedPaymentFields({ form, onChange, label = "Payment" }) {
  const cash = Number(form.cashAmount) || 0;
  const online = Number(form.onlineAmount) || 0;
  const total = cash + online;

  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 12 }}>{label}</div>
      <Row2>
        <Field label="Cash Amount (₹)">
          <input style={inputStyle} type="number" min="0" placeholder="0" value={form.cashAmount} onChange={(e) => onChange({ ...form, cashAmount: e.target.value })} />
        </Field>
        <Field label="Online Amount (₹)">
          <input style={inputStyle} type="number" min="0" placeholder="0" value={form.onlineAmount} onChange={(e) => onChange({ ...form, onlineAmount: e.target.value })} />
        </Field>
      </Row2>
      {online > 0 && (
        <Row2>
          <Field label="Online Mode">
            <select style={inputStyle} value={form.onlineMode} onChange={(e) => onChange({ ...form, onlineMode: e.target.value })}>
              <option value="">Select Mode</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="NEFT/RTGS">NEFT/RTGS</option>
              <option value="Cheque">Cheque</option>
            </select>
          </Field>
          <Field label="Reference / UTR / Cheque No">
            <input style={inputStyle} placeholder="UPI ref / cheque no" value={form.onlineRef} onChange={(e) => onChange({ ...form, onlineRef: e.target.value })} />
          </Field>
        </Row2>
      )}
      <Row2>
        <Field label="Payment Date">
          <input style={inputStyle} type="date" value={form.date} onChange={(e) => onChange({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Note (optional)">
          <input style={inputStyle} placeholder="advance / partial…" value={form.note} onChange={(e) => onChange({ ...form, note: e.target.value })} />
        </Field>
      </Row2>
      {total > 0 && (
        <div style={{ padding: "8px 12px", background: "#eff6ff", borderRadius: 7, fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
          Total: {fmt(total)}
          {cash > 0 && online > 0 && <span style={{ fontWeight: 400, color: "#64748b" }}> (Cash {fmt(cash)} + Online {fmt(online)})</span>}
        </div>
      )}
    </div>
  );
}

// ─── Badge & PayPill ──────────────────────────────────────────────────────────

function Badge({ status }) {
  const c = STATUS_COLOR[status] || {};
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function PayPill({ cash, online, mode }) {
  if (cash > 0 && online > 0) return <span style={{ fontSize: 11, color: "#7c3aed" }}>💵 {fmt(cash)} + 📱 {fmt(online)}{mode ? ` (${mode})` : ""}</span>;
  if (online > 0) return <span style={{ fontSize: 11, color: "#0ea5e9" }}>📱 Online {fmt(online)}{mode ? ` (${mode})` : ""}</span>;
  return <span style={{ fontSize: 11, color: "#16a34a" }}>💵 Cash {fmt(cash)}</span>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  const { page, pages, total, limit } = pagination;
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const arr = [];
    if (pages <= 7) { for (let i = 1; i <= pages; i++) arr.push(i); return arr; }
    arr.push(1);
    if (page > 3) arr.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) arr.push(i);
    if (page < pages - 2) arr.push("...");
    arr.push(pages);
    return arr;
  };

  const btnBase = { border: "1px solid #e2e8f0", borderRadius: 6, padding: "6px 11px", cursor: "pointer", fontSize: 13, fontWeight: 600 };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, flexWrap: "wrap", gap: 10 }}>
      <div style={{ fontSize: 13, color: "#64748b" }}>Showing {from}–{to} of {total} bills</div>
      <div style={{ display: "flex", gap: 4 }}>
        <button style={{ ...btnBase, background: page === 1 ? "#f1f5f9" : "#fff", color: page === 1 ? "#94a3b8" : "#1e293b" }}
          disabled={page === 1} onClick={() => onPageChange(page - 1)}>←</button>
        {getPages().map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} style={{ ...btnBase, background: "none", border: "none", cursor: "default", color: "#94a3b8" }}>…</span>
          ) : (
            <button key={p} style={{ ...btnBase, background: p === page ? "#2563eb" : "#fff", color: p === page ? "#fff" : "#1e293b", borderColor: p === page ? "#2563eb" : "#e2e8f0" }}
              onClick={() => onPageChange(p)}>{p}</button>
          )
        )}
        <button style={{ ...btnBase, background: page === pages ? "#f1f5f9" : "#fff", color: page === pages ? "#94a3b8" : "#1e293b" }}
          disabled={page === pages} onClick={() => onPageChange(page + 1)}>→</button>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 20px #0004" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </div>
      ))}
    </div>
  );
}

// ─── Alert Bill Card ──────────────────────────────────────────────────────────

function AlertBillCard({ bill, urgency, onPayment, onLedger }) {
  const daysSince = Math.floor((Date.now() - new Date(bill.billDate)) / (1000 * 60 * 60 * 24));
  const isHigh = urgency === "high";

  const borderColor = isHigh ? "#fca5a5" : "#fcd34d";
  const bgColor     = isHigh ? "#fff5f5" : "#fffdf0";
  const accentColor = isHigh ? "#dc2626"  : "#d97706";
  const tagBg       = isHigh ? "#fef2f2"  : "#fffbeb";

  return (
    <div style={{ border: `1px solid ${borderColor}`, borderLeft: `4px solid ${accentColor}`, borderRadius: 10, background: bgColor, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      {/* Days badge */}
      <div style={{ background: accentColor, color: "#fff", borderRadius: 10, padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{daysSince}</div>
        <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>DAYS</div>
      </div>

      {/* Customer & bill info */}
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 15 }}>{bill.customer?.name}</div>
        {bill.customer?.firmName && <div style={{ fontSize: 12, color: "#64748b" }}>{bill.customer.firmName}</div>}
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
          📞 {bill.customer?.phone}
          {bill.customer?.city && <span> · 📍 {bill.customer.city}</span>}
        </div>
      </div>

      {/* Bill details */}
      <div style={{ minWidth: 120 }}>
        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>BILL NO</div>
        <div style={{ fontWeight: 700, color: "#334155" }}>#{bill.billNo}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>DATE</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{bill.billDate ? new Date(bill.billDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}</div>
      </div>

      {/* Amounts */}
      <div style={{ minWidth: 100, textAlign: "right" }}>
        <div style={{ fontSize: 11, color: "#94a3b8" }}>Bill Total</div>
        <div style={{ fontWeight: 600, color: "#475569" }}>
          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(bill.totalAmount)}
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Already Paid</div>
        <div style={{ fontWeight: 600, color: "#16a34a" }}>
          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(bill.paidAmount)}
        </div>
      </div>

      {/* Due amount */}
      <div style={{ minWidth: 110, textAlign: "right" }}>
        <div style={{ fontSize: 11, color: accentColor, fontWeight: 700 }}>BALANCE DUE</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: accentColor }}>
          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(bill.balanceDue)}
        </div>
        <span style={{ background: tagBg, color: accentColor, border: `1px solid ${borderColor}`, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
          {bill.status === "PARTIAL" ? "Partial" : "Pending"}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
        <button
          style={{ padding: "7px 16px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          onClick={onPayment}
        >
          💰 Collect Now
        </button>
        <button
          style={{ padding: "7px 16px", background: "#fff", color: "#475569", border: "1px solid #d1d5db", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          onClick={onLedger}
        >
          📒 View Ledger
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function WholesaleRojmal() {
  const dispatch = useDispatch();
  const { customers, bills, billSummary, pagination, ledger, dashboard, alerts, loading, actionLoading, error } = useSelector((s) => s.wholesale);

  const [tab, setTab] = useState("dashboard");

  // Customer state
  const [custSearch, setCustSearch] = useState("");
  const [showCustForm, setShowCustForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [custForm, setCustForm] = useState(EMPTY_CUSTOMER);

  // Bill state
  const [billFilters, setBillFilters] = useState({ customer: "", status: "", startDate: "", endDate: "", search: "", page: 1, limit: 20 });
  const [billForm, setBillForm] = useState(EMPTY_BILL);
  const [editBillModal, setEditBillModal] = useState(null);
  const [editBillForm, setEditBillForm] = useState({});
  const [payModal, setPayModal] = useState(null);
  const [payForm, setPayForm] = useState(EMPTY_PAY);
  const [expandedBill, setExpandedBill] = useState(null);

  // Ledger state
  const [ledgerCustId, setLedgerCustId] = useState("");

  // ─── Data loading ─────────────────────────────────────────────────────────

  const loadCustomers = useCallback(() => {
    dispatch(fetchCustomers({ search: custSearch }));
  }, [dispatch, custSearch]);

  const loadBills = useCallback((overrides = {}) => {
    const f = { ...billFilters, ...overrides };
    const params = { page: f.page, limit: f.limit };
    if (f.customer) params.customer = f.customer;
    if (f.status) params.status = f.status;
    if (f.startDate) params.startDate = f.startDate;
    if (f.endDate) params.endDate = f.endDate;
    if (f.search) params.search = f.search;
    dispatch(fetchBills(params));
  }, [dispatch, billFilters]);

  const loadDashboard = useCallback(() => { dispatch(fetchDashboard()); }, [dispatch]);
  const loadAlerts = useCallback(() => { dispatch(fetchAlerts()); }, [dispatch]);

  useEffect(() => { loadCustomers(); loadAlerts(); }, [loadCustomers]); // eslint-disable-line
  useEffect(() => { if (tab === "bills") loadBills(); }, [tab]); // eslint-disable-line
  useEffect(() => { if (tab === "dashboard") loadDashboard(); }, [tab]); // eslint-disable-line
  useEffect(() => { if (tab === "alerts") loadAlerts(); }, [tab]); // eslint-disable-line

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  // ─── Customer actions ─────────────────────────────────────────────────────

  const openAddCust = () => { setCustForm(EMPTY_CUSTOMER); setEditCustomer(null); setShowCustForm(true); };
  const openEditCust = (c) => { setCustForm({ ...c, openingBalance: c.openingBalance || "" }); setEditCustomer(c); setShowCustForm(true); };

  const handleSaveCustomer = async () => {
    if (!custForm.name.trim() || !custForm.phone.trim()) { toast.warn("Name and phone are required"); return; }
    const payload = { ...custForm, openingBalance: Number(custForm.openingBalance) || 0 };
    const res = await (editCustomer ? dispatch(updateCustomer({ id: editCustomer._id, ...payload })) : dispatch(createCustomer(payload)));
    if (!res.error) { toast.success(editCustomer ? "Customer updated" : "Customer added"); setShowCustForm(false); loadCustomers(); }
  };

  const handleDeleteCust = async (c) => {
    if (!window.confirm(`Delete customer "${c.name}"?`)) return;
    const res = await dispatch(deleteCustomer(c._id));
    if (!res.error) toast.success("Customer deleted");
  };

  // ─── Bill actions ─────────────────────────────────────────────────────────

  const handleCreateBill = async () => {
    const { billNo, billDate, customer, description, totalAmount, note, initCash, initOnline, initOnlineMode, initOnlineRef, initNote } = billForm;
    if (!billNo.trim() || !customer || !totalAmount) { toast.warn("Bill No, Customer, and Amount are required"); return; }
    const cash = Number(initCash) || 0;
    const online = Number(initOnline) || 0;
    const payload = {
      billNo: billNo.trim(), billDate, customer, description, totalAmount: Number(totalAmount), note,
      ...(cash + online > 0 ? { initialPayment: { cashAmount: cash, onlineAmount: online, onlineMode: initOnlineMode, onlineRef: initOnlineRef, note: initNote, date: billDate } } : {}),
    };
    const res = await dispatch(createBill(payload));
    if (!res.error) {
      toast.success("Bill created");
      setBillForm({ ...EMPTY_BILL, billDate: today() });
      setTab("bills");
      loadCustomers();
      loadDashboard();
    }
  };

  const openEditBill = (b) => {
    setEditBillForm({ billNo: b.billNo, billDate: b.billDate ? new Date(b.billDate).toISOString().split("T")[0] : today(), description: b.description || "", totalAmount: b.totalAmount, note: b.note || "" });
    setEditBillModal(b);
  };

  const handleUpdateBill = async () => {
    if (!editBillForm.billNo.trim() || !editBillForm.totalAmount) { toast.warn("Bill No and Amount are required"); return; }
    const res = await dispatch(updateBill({ id: editBillModal._id, ...editBillForm, totalAmount: Number(editBillForm.totalAmount) }));
    if (!res.error) { toast.success("Bill updated"); setEditBillModal(null); }
  };

  const handleDeleteBill = async (b) => {
    if (!window.confirm(`Delete bill #${b.billNo}?`)) return;
    const res = await dispatch(deleteBill(b._id));
    if (!res.error) { toast.success("Bill deleted"); loadCustomers(); loadDashboard(); }
  };

  // ─── Payment actions ──────────────────────────────────────────────────────

  const openPayModal = (bill) => { setPayModal(bill); setPayForm({ ...EMPTY_PAY, date: today() }); };

  const handleAddPayment = async () => {
    const cash = Number(payForm.cashAmount) || 0;
    const online = Number(payForm.onlineAmount) || 0;
    if (cash + online <= 0) { toast.warn("Enter at least one payment amount"); return; }
    const res = await dispatch(addPayment({ billId: payModal._id, ...payForm }));
    if (!res.error) { toast.success(`Payment ${fmt(cash + online)} recorded`); setPayModal(null); loadCustomers(); loadDashboard(); loadAlerts(); }
  };

  const handleDeletePayment = async (bill, payment) => {
    if (!window.confirm("Delete this payment?")) return;
    const res = await dispatch(deletePayment({ billId: bill._id, paymentId: payment._id }));
    if (!res.error) { toast.success("Payment removed"); loadBills(); }
  };

  // ─── Ledger ───────────────────────────────────────────────────────────────

  const loadLedger = () => {
    if (!ledgerCustId) { toast.warn("Select a customer"); return; }
    dispatch(fetchCustomerLedger(ledgerCustId));
  };

  // ─── Pagination handler ───────────────────────────────────────────────────

  const handlePageChange = (newPage) => {
    const updated = { ...billFilters, page: newPage };
    setBillFilters(updated);
    loadBills(updated);
  };

  // ─── Style helpers ────────────────────────────────────────────────────────

  const alertCount = (alerts?.totalAlerts) || 0;

  const TABS = [
    { id: "dashboard", label: "Dashboard",       icon: "📊" },
    { id: "alerts",    label: "Due Alerts",       icon: "🔔", badge: alertCount },
    { id: "customers", label: "Customers",        icon: "👥" },
    { id: "new-bill",  label: "New Bill",         icon: "➕" },
    { id: "bills",     label: "All Bills",        icon: "📋" },
    { id: "ledger",    label: "Customer Ledger",  icon: "📒" },
  ];

  const tabBtn = (id) => ({
    padding: "10px 18px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13,
    borderBottom: tab === id ? "3px solid #2563eb" : "3px solid transparent",
    background: "none", color: tab === id ? "#2563eb" : "#64748b", whiteSpace: "nowrap",
  });

  const btn = (color = "#2563eb", extra = {}) => ({
    padding: "8px 14px", background: color, color: "#fff", border: "none", borderRadius: 7,
    cursor: "pointer", fontSize: 13, fontWeight: 600, ...extra,
  });

  // ─── Dashboard data transformations ──────────────────────────────────────

  const monthlyChartData = (dashboard?.monthly || []).map((m) => ({
    name: `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`,
    Sales: m.sales,
    Received: m.paid,
    Due: m.due,
    Bills: m.count,
  }));

  const statusPieData = (dashboard?.statusBreakdown || []).map((s) => ({
    name: STATUS_LABEL[s._id] || s._id,
    value: s.amount,
    count: s.count,
    color: PIE_COLORS[s._id] || "#94a3b8",
  }));

  const topCustData = (dashboard?.topCustomers || []).map((c) => ({
    name: c.customer?.name || "Unknown",
    Due: c.totalDue,
    Sales: c.totalSales,
    Paid: c.totalPaid,
  })).reverse();

  const payModeData = (() => {
    const pm = dashboard?.paymentModes || {};
    const cash = pm.totalCash || 0;
    const online = pm.totalOnline || 0;
    if (!cash && !online) return [];
    return [
      { name: "Cash", value: cash, color: "#22c55e" },
      { name: "Online", value: online, color: "#3b82f6" },
    ];
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" }}>🏭 Wholesale Rojmal</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>Wholesale customer accounts, bills & payments</p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e2e8f0", marginBottom: 24, display: "flex", overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t.id} style={tabBtn(t.id)} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
            {t.badge > 0 && (
              <span style={{ marginLeft: 6, background: "#ef4444", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700, verticalAlign: "middle" }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════
          DASHBOARD TAB
      ════════════════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div>
          {loading && !dashboard ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: 60 }}>Loading dashboard…</p>
          ) : !dashboard ? (
            <p style={{ textAlign: "center", color: "#94a3b8", padding: 60 }}>No data yet.</p>
          ) : (
            <>
              {/* ── Top Stat Cards ── */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                <StatCard label="Active Customers" value={dashboard.stats.activeCustomers} icon="👥" color="#7c3aed" bg="#f5f3ff" />
                <StatCard label="Total Bills"      value={dashboard.stats.totalBills}       icon="📋" color="#0ea5e9" bg="#f0f9ff" />
                <StatCard label="Total Sales"      value={fmt(dashboard.stats.totalSales)}  icon="💰" color="#1d4ed8" bg="#eff6ff" />
                <StatCard label="Total Received"   value={fmt(dashboard.stats.totalPaid)}   icon="✅" color="#16a34a" bg="#f0fdf4" />
                <StatCard label="Total Due (Baki)" value={fmt(dashboard.stats.totalDue)}    icon="⚠️" color="#dc2626" bg="#fef2f2"
                  sub={dashboard.stats.totalDue > 0 ? "Needs collection" : "All clear!"} />
              </div>

              {/* ── Monthly Trend + Status Pie ── */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Monthly Bar Chart */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 16 }}>📈 Monthly Sales & Collection (Last 6 Months)</div>
                  {monthlyChartData.length === 0 ? (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No bills in last 6 months</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                        <YAxis tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}`} tick={{ fontSize: 11, fill: "#64748b" }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Sales"    fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sales" />
                        <Bar dataKey="Received" fill="#22c55e" radius={[4, 4, 0, 0]} name="Received" />
                        <Bar dataKey="Due"      fill="#f87171" radius={[4, 4, 0, 0]} name="Due" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Status Pie */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 16 }}>🥧 Bill Status</div>
                  {statusPieData.length === 0 ? (
                    <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No bills yet</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {statusPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v, n, p) => [fmt(v), `${p.payload.name} (${p.payload.count} bills)`]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {statusPieData.map((s) => (
                          <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                              <span style={{ color: "#475569", fontWeight: 600 }}>{s.name} ({s.count})</span>
                            </span>
                            <span style={{ fontWeight: 700, color: "#1e293b" }}>{fmt(s.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Top Customers + Payment Mode ── */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Top 5 by Due */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 16 }}>🏆 Top 5 Customers by Pending Due</div>
                  {topCustData.length === 0 ? (
                    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No pending dues</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topCustData} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => `₹${v >= 1000 ? Math.round(v / 1000) + "k" : v}`} tick={{ fontSize: 10, fill: "#64748b" }} />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#334155" }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="Due" fill="#f87171" radius={[0, 4, 4, 0]} name="Due Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Payment Mode breakdown */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 16 }}>💳 Payment Mode</div>
                  {payModeData.length === 0 ? (
                    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>No payments yet</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={payModeData} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                            {payModeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                        {payModeData.map((m) => (
                          <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, display: "inline-block" }} />
                              <span style={{ color: "#475569", fontWeight: 600 }}>{m.name}</span>
                            </span>
                            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{fmt(m.value)}</span>
                          </div>
                        ))}
                        {(dashboard?.onlineModes || []).length > 0 && (
                          <div style={{ marginTop: 8, borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>Online breakdown:</div>
                            {dashboard.onlineModes.map((m) => (
                              <div key={m._id || "Other"} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                                <span>{m._id || "Other"}</span><span>{fmt(m.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Recent Bills ── */}
              {(dashboard?.recentBills || []).length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 14 }}>🕐 Recent Bills</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Bill No", "Date", "Customer", "Total", "Paid", "Due", "Status"].map((h) => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.recentBills.map((b) => (
                        <tr key={b._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>#{b.billNo}</td>
                          <td style={{ padding: "8px 12px", color: "#64748b" }}>{fmtDate(b.billDate)}</td>
                          <td style={{ padding: "8px 12px" }}>{b.customer?.name}{b.customer?.firmName ? ` (${b.customer.firmName})` : ""}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#1d4ed8" }}>{fmt(b.totalAmount)}</td>
                          <td style={{ padding: "8px 12px", color: "#16a34a", fontWeight: 600 }}>{fmt(b.paidAmount)}</td>
                          <td style={{ padding: "8px 12px", color: b.balanceDue > 0 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>{fmt(b.balanceDue)}</td>
                          <td style={{ padding: "8px 12px" }}><Badge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button style={{ ...btn("#2563eb"), marginTop: 14, fontSize: 12, padding: "6px 14px" }} onClick={() => setTab("bills")}>View All Bills →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ALERTS TAB
      ════════════════════════════════════════════════════ */}
      {tab === "alerts" && (
        <div>
          {/* Refresh */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b" }}>🔔 Pending Payment Alerts</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Bills with balance due for 15+ and 30+ days</p>
            </div>
            <button style={btn("#64748b")} onClick={loadAlerts} disabled={loading}>↻ Refresh</button>
          </div>

          {loading && !alerts ? (
            <p style={{ textAlign: "center", color: "#64748b", padding: 40 }}>Loading alerts…</p>
          ) : !alerts ? null : alertCount === 0 ? (
            <div style={{ textAlign: "center", padding: 60, background: "#f0fdf4", borderRadius: 14, border: "1px solid #86efac" }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
              <h3 style={{ color: "#16a34a", margin: 0 }}>All clear!</h3>
              <p style={{ color: "#64748b", marginTop: 6 }}>No pending bills older than 15 days.</p>
            </div>
          ) : (
            <>
              {/* Summary banner */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ flex: 1, minWidth: 200, background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: 12, padding: "14px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>🚨 30+ DAYS OVERDUE (URGENT)</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#dc2626" }}>{fmt(alerts.overdue30.totalDue)}</div>
                  <div style={{ fontSize: 13, color: "#ef4444", marginTop: 2 }}>{alerts.overdue30.count} bill{alerts.overdue30.count !== 1 ? "s" : ""} pending</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, background: "#fffbeb", border: "2px solid #fcd34d", borderRadius: 12, padding: "14px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>⚠️ 15–30 DAYS OVERDUE (WARNING)</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#d97706" }}>{fmt(alerts.overdue15.totalDue)}</div>
                  <div style={{ fontSize: 13, color: "#f59e0b", marginTop: 2 }}>{alerts.overdue15.count} bill{alerts.overdue15.count !== 1 ? "s" : ""} pending</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>TOTAL DUE IN ALERTS</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1e293b" }}>{fmt(alerts.totalDue)}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{alertCount} total bills to collect</div>
                </div>
              </div>

              {/* 30+ day section */}
              {alerts.overdue30.bills.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 24, background: "#dc2626", borderRadius: 2 }} />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#dc2626" }}>
                      🚨 30+ Days Overdue — Urgent Collection
                    </h3>
                    <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                      {alerts.overdue30.count} bills · {fmt(alerts.overdue30.totalDue)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {alerts.overdue30.bills.map((b) => (
                      <AlertBillCard key={b._id} bill={b} urgency="high"
                        onPayment={() => { openPayModal(b); }}
                        onLedger={() => { setLedgerCustId(b.customer?._id); setTab("ledger"); dispatch(fetchCustomerLedger(b.customer?._id)); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 15-30 day section */}
              {alerts.overdue15.bills.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 4, height: 24, background: "#d97706", borderRadius: 2 }} />
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#d97706" }}>
                      ⚠️ 15–30 Days Overdue — Follow Up Needed
                    </h3>
                    <span style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                      {alerts.overdue15.count} bills · {fmt(alerts.overdue15.totalDue)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {alerts.overdue15.bills.map((b) => (
                      <AlertBillCard key={b._id} bill={b} urgency="medium"
                        onPayment={() => { openPayModal(b); }}
                        onLedger={() => { setLedgerCustId(b.customer?._id); setTab("ledger"); dispatch(fetchCustomerLedger(b.customer?._id)); }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          CUSTOMERS TAB
      ════════════════════════════════════════════════════ */}
      {tab === "customers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inputStyle, maxWidth: 260 }} placeholder="Search name / firm / phone…" value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadCustomers()} />
              <button style={btn("#64748b")} onClick={loadCustomers}>🔍</button>
            </div>
            <button style={btn()} onClick={openAddCust}>+ Add Customer</button>
          </div>

          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Loading…</p>
          ) : customers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <p>No wholesale customers yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["#", "Name / Firm", "Phone", "City", "Total Sales", "Total Paid", "Balance Due", "Bills", "Action"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => (
                    <tr key={c._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", color: "#94a3b8", fontSize: 12 }}>{i + 1}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#1e293b" }}>{c.name}</div>
                        {c.firmName && <div style={{ fontSize: 12, color: "#64748b" }}>{c.firmName}</div>}
                        {c.gstin && <div style={{ fontSize: 11, color: "#94a3b8" }}>GST: {c.gstin}</div>}
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div>{c.phone}</div>
                        {c.altPhone && <div style={{ fontSize: 12, color: "#64748b" }}>{c.altPhone}</div>}
                      </td>
                      <td style={{ padding: "10px 12px", color: "#475569" }}>{c.city || "-"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1d4ed8" }}>{fmt(c.totalSales)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "#16a34a" }}>{fmt(c.totalPaid)}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 700, color: c.totalDue > 0 ? "#dc2626" : "#16a34a" }}>{fmt(c.totalDue)}</span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "#64748b" }}>{c.billCount}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          <button style={{ ...btn("#0ea5e9"), padding: "5px 9px", fontSize: 11 }} onClick={() => { setLedgerCustId(c._id); setTab("ledger"); dispatch(fetchCustomerLedger(c._id)); }}>Ledger</button>
                          <button style={{ ...btn("#f59e0b"), padding: "5px 9px", fontSize: 11 }} onClick={() => openEditCust(c)}>Edit</button>
                          <button style={{ ...btn("#ef4444"), padding: "5px 9px", fontSize: 11 }} onClick={() => handleDeleteCust(c)}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          NEW BILL TAB
      ════════════════════════════════════════════════════ */}
      {tab === "new-bill" && (
        <div style={{ maxWidth: 700 }}>
          <h3 style={{ marginTop: 0, color: "#1e293b" }}>Create Wholesale Bill</h3>

          <Row2>
            <Field label="Bill Number *">
              <input style={inputStyle} placeholder="e.g. WS-001" value={billForm.billNo} onChange={(e) => setBillForm({ ...billForm, billNo: e.target.value })} />
            </Field>
            <Field label="Bill Date *">
              <input style={inputStyle} type="date" value={billForm.billDate} onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })} />
            </Field>
          </Row2>

          <Field label="Customer *">
            <CustomerSearchSelect customers={customers} value={billForm.customer} onChange={(v) => setBillForm({ ...billForm, customer: v })} placeholder="Select wholesale customer…" />
            {customers.length === 0 && (
              <div style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>
                No customers found. <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 12 }} onClick={() => setTab("customers")}>Add customer first →</button>
              </div>
            )}
          </Field>

          <Row2>
            <Field label="Total Bill Amount (₹) *">
              <input style={inputStyle} type="number" min="0" placeholder="0" value={billForm.totalAmount} onChange={(e) => setBillForm({ ...billForm, totalAmount: e.target.value })} />
            </Field>
            <Field label="Description (optional)">
              <input style={inputStyle} placeholder="e.g. Cloth, Shoes, Electronics…" value={billForm.description} onChange={(e) => setBillForm({ ...billForm, description: e.target.value })} />
            </Field>
          </Row2>

          <Field label="Note (optional)">
            <input style={inputStyle} placeholder="Any note" value={billForm.note} onChange={(e) => setBillForm({ ...billForm, note: e.target.value })} />
          </Field>

          <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700, color: "#334155" }}>Initial Payment (if received at billing time)</div>
          <MixedPaymentFields
            label="Payment at Billing Time"
            form={{ cashAmount: billForm.initCash, onlineAmount: billForm.initOnline, onlineMode: billForm.initOnlineMode, onlineRef: billForm.initOnlineRef, date: billForm.billDate, note: billForm.initNote }}
            onChange={(f) => setBillForm({ ...billForm, initCash: f.cashAmount, initOnline: f.onlineAmount, initOnlineMode: f.onlineMode, initOnlineRef: f.onlineRef, initNote: f.note })}
          />

          {billForm.totalAmount && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 14 }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <span>Bill Total: <strong>{fmt(Number(billForm.totalAmount) || 0)}</strong></span>
                <span>Paid Now: <strong style={{ color: "#16a34a" }}>{fmt((Number(billForm.initCash) || 0) + (Number(billForm.initOnline) || 0))}</strong></span>
                <span>Balance Due: <strong style={{ color: "#dc2626" }}>{fmt((Number(billForm.totalAmount) || 0) - (Number(billForm.initCash) || 0) - (Number(billForm.initOnline) || 0))}</strong></span>
              </div>
            </div>
          )}

          <button style={{ ...btn(), padding: "10px 28px", fontSize: 15 }} onClick={handleCreateBill} disabled={actionLoading}>
            {actionLoading ? "Saving…" : "✅ Create Bill"}
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ALL BILLS TAB
      ════════════════════════════════════════════════════ */}
      {tab === "bills" && (
        <div>
          {/* Summary */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total Sales"      value={fmt(billSummary.totalAmount)} color="#1d4ed8" bg="#eff6ff" />
            <StatCard label="Total Received"   value={fmt(billSummary.totalPaid)}   color="#16a34a" bg="#f0fdf4" />
            <StatCard label="Total Due (Baki)" value={fmt(billSummary.totalDue)}    color="#dc2626" bg="#fef2f2" />
            <StatCard label="Bills Showing"    value={pagination.total}             color="#64748b" bg="#f8fafc" />
          </div>

          {/* Filters */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div style={{ minWidth: 200, flex: 1 }}>
                <label style={labelStyle}>Customer</label>
                <CustomerSearchSelect
                  customers={[...customers]}
                  value={billFilters.customer}
                  onChange={(v) => setBillFilters({ ...billFilters, customer: v, page: 1 })}
                  placeholder="All customers…"
                />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={{ ...inputStyle, minWidth: 130 }} value={billFilters.status} onChange={(e) => setBillFilters({ ...billFilters, status: e.target.value, page: 1 })}>
                  <option value="">All</option>
                  <option value="PENDING">Baki (Pending)</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>From Date</label>
                <input style={{ ...inputStyle, minWidth: 140 }} type="date" value={billFilters.startDate} onChange={(e) => setBillFilters({ ...billFilters, startDate: e.target.value, page: 1 })} />
              </div>
              <div>
                <label style={labelStyle}>To Date</label>
                <input style={{ ...inputStyle, minWidth: 140 }} type="date" value={billFilters.endDate} onChange={(e) => setBillFilters({ ...billFilters, endDate: e.target.value, page: 1 })} />
              </div>
              <div>
                <label style={labelStyle}>Search</label>
                <input style={{ ...inputStyle, minWidth: 140 }} placeholder="Bill no / desc…" value={billFilters.search} onChange={(e) => setBillFilters({ ...billFilters, search: e.target.value, page: 1 })} />
              </div>
              <div style={{ display: "flex", gap: 6, alignSelf: "flex-end" }}>
                <button style={btn()} onClick={() => loadBills()}>🔍 Filter</button>
                <button style={btn("#64748b")} onClick={() => { const f = { customer: "", status: "", startDate: "", endDate: "", search: "", page: 1, limit: 20 }; setBillFilters(f); dispatch(fetchBills({ page: 1, limit: 20 })); }}>Clear</button>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Per page:</label>
              {[10, 20, 50].map((n) => (
                <button key={n} style={{ padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontSize: 13, background: billFilters.limit === n ? "#2563eb" : "#fff", color: billFilters.limit === n ? "#fff" : "#475569", fontWeight: billFilters.limit === n ? 700 : 400 }}
                  onClick={() => { const f = { ...billFilters, limit: n, page: 1 }; setBillFilters(f); loadBills(f); }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Bills list */}
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Loading…</p>
          ) : bills.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <p>No bills found. <button style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer" }} onClick={() => setTab("new-bill")}>Create first bill →</button></p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bills.map((b) => {
                  const isExpanded = expandedBill === b._id;
                  return (
                    <div key={b._id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
                      {/* Bill header */}
                      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", gap: 10, flexWrap: "wrap", cursor: "pointer" }}
                        onClick={() => setExpandedBill(isExpanded ? null : b._id)}>
                        <div style={{ flex: "0 0 auto", minWidth: 120 }}>
                          <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>#{b.billNo}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{fmtDate(b.billDate)}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <div style={{ fontWeight: 600, color: "#334155", fontSize: 13 }}>{b.customer?.name}</div>
                          {b.customer?.firmName && <div style={{ fontSize: 11, color: "#94a3b8" }}>{b.customer.firmName}</div>}
                        </div>
                        {b.description && <div style={{ flex: 2, fontSize: 12, color: "#64748b", minWidth: 100 }}>{b.description}</div>}
                        <div style={{ textAlign: "right", minWidth: 80 }}>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>Total</div>
                          <div style={{ fontWeight: 700, color: "#1d4ed8", fontSize: 14 }}>{fmt(b.totalAmount)}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 80 }}>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>Paid</div>
                          <div style={{ fontWeight: 700, color: "#16a34a", fontSize: 14 }}>{fmt(b.paidAmount)}</div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 80 }}>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>Baki</div>
                          <div style={{ fontWeight: 700, color: b.balanceDue > 0 ? "#dc2626" : "#16a34a", fontSize: 14 }}>{fmt(b.balanceDue)}</div>
                        </div>
                        <Badge status={b.status} />
                        <span style={{ fontSize: 16, color: "#94a3b8" }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #f1f5f9", padding: "14px 16px", background: "#fafafa" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#475569" }}>Payment History ({b.payments.length})</div>
                            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                              {b.status !== "PAID" && (
                                <button style={{ ...btn("#16a34a"), padding: "5px 12px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); openPayModal(b); }}>+ Payment</button>
                              )}
                              <button style={{ ...btn("#f59e0b"), padding: "5px 12px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); openEditBill(b); }}>✏️ Edit Bill</button>
                              <button style={{ ...btn("#ef4444"), padding: "5px 12px", fontSize: 12 }} onClick={(e) => { e.stopPropagation(); handleDeleteBill(b); }}>🗑 Delete</button>
                            </div>
                          </div>
                          {b.payments.length === 0 ? (
                            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No payments yet.</p>
                          ) : (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: "#f1f5f9" }}>
                                    {["Date", "Cash", "Online", "Mode / Ref", "Total", "Note", ""].map((h) => (
                                      <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.payments.map((p) => (
                                    <tr key={p._id} style={{ borderBottom: "1px solid #f8fafc" }}>
                                      <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>{fmtDate(p.date)}</td>
                                      <td style={{ padding: "6px 10px", color: "#16a34a", fontWeight: 600 }}>{p.cashAmount > 0 ? fmt(p.cashAmount) : "-"}</td>
                                      <td style={{ padding: "6px 10px", color: "#0ea5e9", fontWeight: 600 }}>{p.onlineAmount > 0 ? fmt(p.onlineAmount) : "-"}</td>
                                      <td style={{ padding: "6px 10px", color: "#64748b" }}>
                                        {p.onlineMode || ""}{p.onlineRef ? <span style={{ display: "block", fontSize: 11, color: "#94a3b8" }}>#{p.onlineRef}</span> : ""}
                                        {!p.onlineMode && !p.onlineRef && "-"}
                                      </td>
                                      <td style={{ padding: "6px 10px", fontWeight: 700, color: "#1e293b" }}>{fmt(p.totalAmount)}</td>
                                      <td style={{ padding: "6px 10px", color: "#64748b" }}>{p.note || "-"}</td>
                                      <td style={{ padding: "6px 10px" }}>
                                        <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 15 }} onClick={(e) => { e.stopPropagation(); handleDeletePayment(b, p); }}>🗑</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          LEDGER TAB
      ════════════════════════════════════════════════════ */}
      {tab === "ledger" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "flex-end" }}>
            <div style={{ flex: 1, maxWidth: 420 }}>
              <label style={labelStyle}>Select Customer</label>
              <CustomerSearchSelect
                customers={customers}
                value={ledgerCustId}
                onChange={(v) => { setLedgerCustId(v); dispatch(clearLedger()); }}
                placeholder="Search and select customer…"
              />
            </div>
            <button style={btn()} onClick={loadLedger} disabled={loading}>📒 View Ledger</button>
          </div>

          {loading && <p style={{ color: "#64748b", textAlign: "center", padding: 40 }}>Loading…</p>}

          {!loading && ledger && (
            <div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>{ledger.customer.name}</h3>
                    {ledger.customer.firmName && <div style={{ color: "#64748b", fontSize: 14 }}>{ledger.customer.firmName}</div>}
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                      📞 {ledger.customer.phone}
                      {ledger.customer.city && <span> · 📍 {ledger.customer.city}</span>}
                      {ledger.customer.gstin && <span> · GST: {ledger.customer.gstin}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatCard label="Total Sales" value={fmt(ledger.summary.totalSales)} color="#1d4ed8" bg="#fff" />
                    <StatCard label="Total Paid"  value={fmt(ledger.summary.totalPaid)}  color="#16a34a" bg="#fff" />
                    <StatCard label="Balance Due" value={fmt(ledger.summary.totalDue)} color={ledger.summary.totalDue > 0 ? "#dc2626" : "#16a34a"} bg="#fff" />
                  </div>
                </div>
              </div>

              <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#1e293b" }}>
                      {["Date", "Type", "Bill No", "Description", "Debit (Sale)", "Credit (Paid)", "Balance"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", color: "#f8fafc", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.entries.map((e, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "9px 14px", color: "#475569", whiteSpace: "nowrap" }}>{fmtDate(e.date)}</td>
                        <td style={{ padding: "9px 14px" }}>
                          {e.type === "BILL" && <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>BILL</span>}
                          {e.type === "PAYMENT" && (
                            <span>
                              <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>PAYMENT</span>
                              <div style={{ marginTop: 2 }}><PayPill cash={e.cashAmount || 0} online={e.onlineAmount || 0} mode={e.onlineMode} /></div>
                            </span>
                          )}
                          {e.type === "OPENING" && <span style={{ background: "#fef9c3", color: "#854d0e", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>OPENING</span>}
                        </td>
                        <td style={{ padding: "9px 14px", color: "#64748b", fontWeight: 600 }}>{e.billNo || "-"}</td>
                        <td style={{ padding: "9px 14px", color: "#334155" }}>{e.description}{e.onlineRef && <div style={{ fontSize: 11, color: "#94a3b8" }}>Ref: {e.onlineRef}</div>}</td>
                        <td style={{ padding: "9px 14px", fontWeight: 700, color: e.debit > 0 ? "#dc2626" : "#94a3b8" }}>{e.debit > 0 ? fmt(e.debit) : "-"}</td>
                        <td style={{ padding: "9px 14px", fontWeight: 700, color: e.credit > 0 ? "#16a34a" : "#94a3b8" }}>{e.credit > 0 ? fmt(e.credit) : "-"}</td>
                        <td style={{ padding: "9px 14px", fontWeight: 700, color: e.runningBalance > 0 ? "#dc2626" : "#16a34a" }}>
                          {fmt(Math.abs(e.runningBalance))}{e.runningBalance > 0 ? " Dr" : " Cr"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#1e293b" }}>
                      <td colSpan={4} style={{ padding: "10px 14px", color: "#f8fafc", fontWeight: 700 }}>TOTAL</td>
                      <td style={{ padding: "10px 14px", color: "#fca5a5", fontWeight: 700 }}>{fmt(ledger.entries.reduce((s, e) => s + e.debit, 0))}</td>
                      <td style={{ padding: "10px 14px", color: "#86efac", fontWeight: 700 }}>{fmt(ledger.entries.reduce((s, e) => s + e.credit, 0))}</td>
                      <td style={{ padding: "10px 14px", color: ledger.summary.totalDue > 0 ? "#fca5a5" : "#86efac", fontWeight: 700 }}>
                        {fmt(ledger.summary.totalDue)} {ledger.summary.totalDue > 0 ? "Due" : "Clear"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {!loading && !ledger && (
            <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📒</div>
              <p>Select a customer to view their full account ledger</p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          MODALS
      ════════════════════════════════════════════════════ */}

      {/* Add/Edit Customer Modal */}
      {showCustForm && (
        <Modal title={editCustomer ? "Edit Customer" : "Add Wholesale Customer"} onClose={() => setShowCustForm(false)}>
          <Row2>
            <Field label="Name *">
              <input style={inputStyle} placeholder="Customer name" value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} />
            </Field>
            <Field label="Firm / Company">
              <input style={inputStyle} placeholder="Firm name" value={custForm.firmName} onChange={(e) => setCustForm({ ...custForm, firmName: e.target.value })} />
            </Field>
          </Row2>
          <Row2>
            <Field label="Phone *">
              <input style={inputStyle} placeholder="Primary phone" value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })} />
            </Field>
            <Field label="Alt Phone">
              <input style={inputStyle} placeholder="Alternate phone" value={custForm.altPhone} onChange={(e) => setCustForm({ ...custForm, altPhone: e.target.value })} />
            </Field>
          </Row2>
          <Row2>
            <Field label="City">
              <input style={inputStyle} placeholder="City" value={custForm.city} onChange={(e) => setCustForm({ ...custForm, city: e.target.value })} />
            </Field>
            <Field label="GSTIN">
              <input style={inputStyle} placeholder="GST number (optional)" value={custForm.gstin} onChange={(e) => setCustForm({ ...custForm, gstin: e.target.value })} />
            </Field>
          </Row2>
          <Field label="Opening Balance (Previous Due ₹)">
            <input style={inputStyle} type="number" min="0" placeholder="0" value={custForm.openingBalance} onChange={(e) => setCustForm({ ...custForm, openingBalance: e.target.value })} />
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Amount this customer owed before adding to system</div>
          </Field>
          <Field label="Note">
            <input style={inputStyle} placeholder="Any notes" value={custForm.note} onChange={(e) => setCustForm({ ...custForm, note: e.target.value })} />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button style={btn("#64748b")} onClick={() => setShowCustForm(false)}>Cancel</button>
            <button style={btn()} onClick={handleSaveCustomer} disabled={actionLoading}>{actionLoading ? "Saving…" : editCustomer ? "Update" : "Add Customer"}</button>
          </div>
        </Modal>
      )}

      {/* Edit Bill Modal */}
      {editBillModal && (
        <Modal title={`Edit Bill #${editBillModal.billNo}`} onClose={() => setEditBillModal(null)}>
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 13 }}>
            ℹ️ Customer cannot be changed after bill creation. Total amount can only be reduced if already paid amount allows it.
          </div>
          <Row2>
            <Field label="Bill Number *">
              <input style={inputStyle} placeholder="WS-001" value={editBillForm.billNo} onChange={(e) => setEditBillForm({ ...editBillForm, billNo: e.target.value })} />
            </Field>
            <Field label="Bill Date *">
              <input style={inputStyle} type="date" value={editBillForm.billDate} onChange={(e) => setEditBillForm({ ...editBillForm, billDate: e.target.value })} />
            </Field>
          </Row2>
          <Row2>
            <Field label="Total Amount (₹) *">
              <input style={inputStyle} type="number" min={editBillModal.paidAmount || 0} placeholder="0" value={editBillForm.totalAmount} onChange={(e) => setEditBillForm({ ...editBillForm, totalAmount: e.target.value })} />
              {editBillModal.paidAmount > 0 && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>Min: {fmt(editBillModal.paidAmount)} (already paid)</div>}
            </Field>
            <Field label="Description">
              <input style={inputStyle} placeholder="Items description" value={editBillForm.description} onChange={(e) => setEditBillForm({ ...editBillForm, description: e.target.value })} />
            </Field>
          </Row2>
          <Field label="Note">
            <input style={inputStyle} placeholder="Any note" value={editBillForm.note} onChange={(e) => setEditBillForm({ ...editBillForm, note: e.target.value })} />
          </Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <button style={btn("#64748b")} onClick={() => setEditBillModal(null)}>Cancel</button>
            <button style={btn("#f59e0b")} onClick={handleUpdateBill} disabled={actionLoading}>{actionLoading ? "Saving…" : "✏️ Update Bill"}</button>
          </div>
        </Modal>
      )}

      {/* Add Payment Modal */}
      {payModal && (
        <Modal title={`Add Payment — Bill #${payModal.billNo}`} onClose={() => setPayModal(null)}>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 13 }}>
            <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>
              {payModal.customer?.name}{payModal.customer?.firmName ? ` (${payModal.customer.firmName})` : ""}
            </div>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span>Bill: <strong>{fmt(payModal.totalAmount)}</strong></span>
              <span>Paid: <strong style={{ color: "#16a34a" }}>{fmt(payModal.paidAmount)}</strong></span>
              <span>Remaining: <strong style={{ color: "#dc2626" }}>{fmt(payModal.balanceDue)}</strong></span>
            </div>
          </div>

          <MixedPaymentFields label="Enter Payment Received" form={payForm} onChange={setPayForm} />

          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: 10, marginBottom: 14, fontSize: 12 }}>
            💡 Mixed payment: Cash ₹500 + UPI ₹1,000 = ₹1,500 total — enter both together in one shot.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={btn("#64748b")} onClick={() => setPayModal(null)}>Cancel</button>
            <button style={btn("#16a34a")} onClick={handleAddPayment} disabled={actionLoading}>{actionLoading ? "Saving…" : "✅ Record Payment"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
