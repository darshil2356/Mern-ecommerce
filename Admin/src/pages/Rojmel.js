import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  fetchTodayEntries,
  fetchByDate,
  fetchSummary,
  addRojmelEntry,
  deleteRojmelEntry,
} from "../features/rojmel/rojmelSlice";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const today = () => new Date().toISOString().split("T")[0];

const CATEGORIES = ["General", "Orders", "Rent", "Salary", "Ads", "Utilities", "Refund", "Other"];

export default function Rojmel() {
  const dispatch = useDispatch();
  const { entries, summary, pagination, loading } = useSelector((s) => s.rojmel);

  const [view, setView] = useState("today"); // today | range | monthly
  const [filters, setFilters] = useState({ startDate: today(), endDate: today(), paymentMethod: "", search: "", page: 1 });
  const [monthFilter, setMonthFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), particulars: "", voucherNo: "", type: "INCOME", amount: "", paymentMethod: "Online", category: "General" });
  const printRef = useRef();

  const load = useCallback(() => {
    if (view === "today") dispatch(fetchTodayEntries());
    else if (view === "range") dispatch(fetchByDate({ ...filters }));
    else dispatch(fetchSummary(monthFilter));
  }, [dispatch, view, filters, monthFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.particulars || !form.amount) return toast.error("Particulars and amount are required");
    const res = await dispatch(addRojmelEntry(form));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Entry added successfully");
      setShowForm(false);
      setForm({ date: today(), particulars: "", voucherNo: "", type: "INCOME", amount: "", paymentMethod: "Online", category: "General" });
      load();
    } else {
      toast.error(res.payload || "Failed to add entry");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry? Balances will be recalculated.")) return;
    const res = await dispatch(deleteRojmelEntry(id));
    if (res.meta.requestStatus === "fulfilled") { toast.success("Deleted"); load(); }
    else toast.error(res.payload || "Delete failed");
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Rojmel</title><style>
      body{font-family:'Courier New',monospace;background:#fdf6e3;padding:20px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #c8b89a;padding:6px 10px;font-size:12px}
      th{background:#e8d5b0;font-weight:bold}
      .income{color:#166534}.expense{color:#991b1b}
      .closing{font-weight:bold;background:#f5e6c8}
      @media print{button{display:none}}
    </style></head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  const monthlySummary = useSelector((s) => s.rojmel.monthlySummary);

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#f5efe0", minHeight: "100vh", padding: "24px" }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#3d2b1f", letterSpacing: 1, fontFamily: "'Georgia', serif" }}>
            📒 Rojmel — Daily Ledger
          </h1>
          <p style={{ margin: "4px 0 0", color: "#7a5c3e", fontSize: 13 }}>Traditional accounting book • {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handlePrint} style={btnStyle("#7a5c3e", "#fff")}>🖨 Print</button>
          <button onClick={() => setShowForm(!showForm)} style={btnStyle("#1a6b3c", "#fff")}>
            {showForm ? "✕ Cancel" : "+ New Entry"}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <SummaryCard label="Opening Balance" value={fmt(summary.openingBalance)} color="#1d4ed8" icon="🏦" />
        <SummaryCard label="Total Income" value={fmt(summary.totalIncome)} color="#166534" icon="📈" />
        <SummaryCard label="Total Expense" value={fmt(summary.totalExpense)} color="#991b1b" icon="📉" />
        <SummaryCard label="Closing Balance" value={fmt(summary.closingBalance)} color={summary.closingBalance >= 0 ? "#1d4ed8" : "#991b1b"} icon="💰" bold />
      </div>

      {/* ── View Tabs ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "2px solid #c8b89a", paddingBottom: 8 }}>
        {[["today", "📅 Today"], ["range", "📆 Date Range"], ["monthly", "📊 Monthly"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "6px 18px", border: "none", borderRadius: "6px 6px 0 0", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: 13, fontWeight: 600,
            background: view === v ? "#c8a96e" : "#e8d5b0", color: view === v ? "#3d2b1f" : "#7a5c3e",
            borderBottom: view === v ? "2px solid #c8a96e" : "none", transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* ── Filters ── */}
      {view === "range" && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, background: "#fdf6e3", padding: 14, borderRadius: 8, border: "1px solid #c8b89a" }}>
          <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value, page: 1 }))} style={inputStyle} />
          <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value, page: 1 }))} style={inputStyle} />
          <select value={filters.paymentMethod} onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value, page: 1 }))} style={inputStyle}>
            <option value="">All Methods</option>
            {["Cash", "Online", "COD"].map(m => <option key={m}>{m}</option>)}
          </select>
          <input placeholder="🔍 Search particulars / voucher..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))} style={{ ...inputStyle, minWidth: 220 }} />
          <button onClick={load} style={btnStyle("#7a5c3e", "#fff")}>Apply</button>
        </div>
      )}

      {view === "monthly" && (
        <div style={{ display: "flex", gap: 10, marginBottom: 16, background: "#fdf6e3", padding: 14, borderRadius: 8, border: "1px solid #c8b89a" }}>
          <select value={monthFilter.month} onChange={e => setMonthFilter(f => ({ ...f, month: Number(e.target.value) }))} style={inputStyle}>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <input type="number" value={monthFilter.year} onChange={e => setMonthFilter(f => ({ ...f, year: Number(e.target.value) }))} style={{ ...inputStyle, width: 90 }} min={2020} max={2099} />
          <button onClick={load} style={btnStyle("#7a5c3e", "#fff")}>Apply</button>
        </div>
      )}

      {/* ── Entry Form ── */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "#fdf6e3", border: "1px solid #c8b89a", borderRadius: 10, padding: 20, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 16px", color: "#3d2b1f", fontFamily: "'Georgia', serif", fontSize: 16 }}>✏️ New Ledger Entry</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                <option value="INCOME">Income (Credit)</option>
                <option value="EXPENSE">Expense (Debit)</option>
              </select>
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Particulars *</label>
              <input placeholder="e.g. Rent paid, Order #1234..." value={form.particulars} onChange={e => setForm(f => ({ ...f, particulars: e.target.value }))} style={{ ...inputStyle, width: "100%" }} required />
            </div>
            <div>
              <label style={labelStyle}>Amount (₹) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Voucher No</label>
              <input placeholder="VCH-001" value={form.voucherNo} onChange={e => setForm(f => ({ ...f, voucherNo: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} style={inputStyle}>
                {["Cash", "Online", "COD"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button type="submit" disabled={loading} style={btnStyle("#1a6b3c", "#fff")}>
              {loading ? "Saving..." : "✓ Save Entry"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={btnStyle("#7a5c3e", "#fff")}>Cancel</button>
          </div>
        </form>
      )}

      {/* ── Monthly Summary View ── */}
      {view === "monthly" && monthlySummary && (
        <div style={{ background: "#fdf6e3", border: "1px solid #c8b89a", borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", color: "#3d2b1f", fontFamily: "'Georgia', serif" }}>
            Monthly Summary — {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][monthlySummary.month - 1]} {monthlySummary.year}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            <SummaryCard label="Total Income" value={fmt(monthlySummary.summary?.totalIncome)} color="#166534" icon="📈" />
            <SummaryCard label="Total Expense" value={fmt(monthlySummary.summary?.totalExpense)} color="#991b1b" icon="📉" />
            <SummaryCard label="Net Balance" value={fmt(monthlySummary.summary?.netBalance)} color="#1d4ed8" icon="💰" bold />
          </div>
          <table style={tableStyle}>
            <thead>
              <tr style={{ background: "#e8d5b0" }}>
                {["Date", "Income", "Expense", "Net"].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthlySummary.daily || {}).map(([day, d], i) => (
                <tr key={day} style={{ background: i % 2 === 0 ? "#fdf6e3" : "#f5ece0" }}>
                  <td style={tdStyle}>{fmtDate(day)}</td>
                  <td style={{ ...tdStyle, color: "#166534", textAlign: "right" }}>{d.income > 0 ? fmt(d.income) : "—"}</td>
                  <td style={{ ...tdStyle, color: "#991b1b", textAlign: "right" }}>{d.expense > 0 ? fmt(d.expense) : "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: d.income - d.expense >= 0 ? "#166534" : "#991b1b" }}>{fmt(d.income - d.expense)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Ledger Table ── */}
      {(view === "today" || view === "range") && (
        <div ref={printRef} style={{ background: "#fdf6e3", border: "2px solid #c8b89a", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          {/* Book Header */}
          <div style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "'Georgia', serif", letterSpacing: 1 }}>ROJMEL — DAILY LEDGER BOOK</div>
              <div style={{ color: "#f5e6c8", fontSize: 12, marginTop: 2 }}>
                {view === "today" ? `Date: ${fmtDate(new Date())}` : `${filters.startDate} to ${filters.endDate}`}
              </div>
            </div>
            <div style={{ textAlign: "right", color: "#f5e6c8", fontSize: 12 }}>
              <div>Entries: {entries.length}</div>
              <div>Closing: <strong style={{ color: "#fff" }}>{fmt(summary.closingBalance)}</strong></div>
            </div>
          </div>

          {/* Ruled lines background effect */}
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#7a5c3e", fontFamily: "'Georgia', serif" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📖</div>
                Loading ledger entries...
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#7a5c3e", fontFamily: "'Georgia', serif" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📒</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>No entries found</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Click "+ New Entry" to add your first ledger entry</div>
              </div>
            ) : (
              <table style={{ ...tableStyle, borderRadius: 0 }}>
                <thead>
                  <tr style={{ background: "#e8d5b0", position: "sticky", top: 0, zIndex: 1 }}>
                    <th style={{ ...thStyle, width: 100 }}>Date</th>
                    <th style={{ ...thStyle, textAlign: "left", minWidth: 200 }}>Particulars</th>
                    <th style={{ ...thStyle, width: 110 }}>Voucher No</th>
                    <th style={{ ...thStyle, width: 80 }}>Method</th>
                    <th style={{ ...thStyle, width: 80 }}>Source</th>
                    <th style={{ ...thStyle, width: 120, color: "#991b1b" }}>Debit (Dr)</th>
                    <th style={{ ...thStyle, width: 120, color: "#166534" }}>Credit (Cr)</th>
                    <th style={{ ...thStyle, width: 130 }}>Balance</th>
                    <th style={{ ...thStyle, width: 50 }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr style={{ background: "#f0e6cc", borderBottom: "2px solid #c8b89a" }}>
                    <td style={{ ...tdStyle, fontStyle: "italic", color: "#7a5c3e" }} colSpan={7}>Opening Balance</td>
                    <td style={{ ...tdStyle, fontWeight: 700, textAlign: "right", color: "#1d4ed8" }}>{fmt(summary.openingBalance)}</td>
                    <td style={tdStyle}></td>
                  </tr>

                  {entries.map((entry, i) => (
                    <tr key={entry._id} style={{
                      background: i % 2 === 0 ? "#fdf6e3" : "#f7edd8",
                      borderBottom: "1px solid #e0cba8",
                      transition: "background 0.15s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0e0c0"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fdf6e3" : "#f7edd8"}
                    >
                      <td style={{ ...tdStyle, fontSize: 12, color: "#5a3e28" }}>{fmtDate(entry.date)}</td>
                      <td style={{ ...tdStyle, textAlign: "left" }}>
                        <div style={{ fontWeight: 600, color: "#3d2b1f", fontSize: 13 }}>{entry.particulars}</div>
                        {entry.category && entry.category !== "General" && (
                          <span style={{ fontSize: 10, background: "#e8d5b0", color: "#7a5c3e", padding: "1px 6px", borderRadius: 10, marginTop: 2, display: "inline-block" }}>{entry.category}</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontSize: 11, color: "#7a5c3e", fontFamily: "'Courier New', monospace" }}>{entry.voucherNo}</td>
                      <td style={{ ...tdStyle, fontSize: 11 }}>
                        <span style={{ background: entry.paymentMethod === "Cash" ? "#fef3c7" : entry.paymentMethod === "COD" ? "#ede9fe" : "#dbeafe", color: "#374151", padding: "2px 6px", borderRadius: 8, fontSize: 10 }}>
                          {entry.paymentMethod}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, fontSize: 10 }}>
                        <span style={{ background: entry.entrySource === "AUTO" ? "#dcfce7" : "#fef9c3", color: "#374151", padding: "2px 6px", borderRadius: 8 }}>
                          {entry.entrySource}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: "#991b1b", fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                        {entry.type === "EXPENSE" ? fmt(entry.amount) : ""}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: "#166534", fontWeight: 600, fontFamily: "'Courier New', monospace" }}>
                        {entry.type === "INCOME" ? fmt(entry.amount) : ""}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontFamily: "'Courier New', monospace", color: entry.balance >= 0 ? "#1d4ed8" : "#991b1b" }}>
                        {fmt(entry.balance)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <button onClick={() => handleDelete(entry._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 14, padding: "2px 4px" }} title="Delete">🗑</button>
                      </td>
                    </tr>
                  ))}

                  {/* Closing Balance Row */}
                  <tr style={{ background: "#e8d5b0", borderTop: "2px solid #c8b89a" }}>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#3d2b1f", fontStyle: "italic" }} colSpan={5}>Closing Balance</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#991b1b", fontFamily: "'Courier New', monospace" }}>{fmt(summary.totalExpense)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: "#166534", fontFamily: "'Courier New', monospace" }}>{fmt(summary.totalIncome)}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 15, color: summary.closingBalance >= 0 ? "#1d4ed8" : "#991b1b", fontFamily: "'Courier New', monospace" }}>
                      {fmt(summary.closingBalance)}
                    </td>
                    <td style={tdStyle}></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {view === "range" && pagination.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: 16, borderTop: "1px solid #c8b89a", background: "#f5ece0" }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))} style={{
                  width: 32, height: 32, border: "1px solid #c8b89a", borderRadius: 6, cursor: "pointer",
                  background: filters.page === p ? "#c8a96e" : "#fdf6e3", color: filters.page === p ? "#fff" : "#3d2b1f",
                  fontFamily: "'Georgia', serif", fontWeight: filters.page === p ? 700 : 400,
                }}>{p}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Ledger Paper Lines Effect ── */}
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .rojmel-page { animation: fadeSlideIn 0.3s ease; }
        tr:hover td { transition: background 0.15s ease; }
      `}</style>
    </div>
  );
}

function SummaryCard({ label, value, color, icon, bold }) {
  return (
    <div style={{
      background: "#fdf6e3", border: `1px solid ${color}30`, borderLeft: `4px solid ${color}`,
      borderRadius: 10, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "#7a5c3e", fontFamily: "'Georgia', serif", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: bold ? 22 : 20, fontWeight: 700, color, fontFamily: "'Courier New', monospace" }}>{value}</div>
        </div>
        <span style={{ fontSize: 24 }}>{icon}</span>
      </div>
    </div>
  );
}

// Shared styles
const tableStyle = { width: "100%", borderCollapse: "collapse", fontFamily: "'Georgia', serif" };
const thStyle = { padding: "10px 12px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#3d2b1f", borderBottom: "2px solid #c8b89a", borderRight: "1px solid #c8b89a", whiteSpace: "nowrap" };
const tdStyle = { padding: "9px 12px", fontSize: 13, color: "#3d2b1f", borderBottom: "1px solid #e0cba8", borderRight: "1px solid #e0cba8", textAlign: "center", verticalAlign: "middle" };
const inputStyle = { padding: "7px 10px", border: "1px solid #c8b89a", borderRadius: 6, background: "#fdf6e3", fontFamily: "'Georgia', serif", fontSize: 13, color: "#3d2b1f", outline: "none" };
const labelStyle = { display: "block", fontSize: 11, color: "#7a5c3e", marginBottom: 4, fontFamily: "'Georgia', serif", fontWeight: 600 };
const btnStyle = (bg, color) => ({ padding: "8px 18px", background: bg, color, border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: 13, fontWeight: 600, transition: "opacity 0.2s", letterSpacing: 0.3 });
