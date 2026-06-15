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

/* ─── constants ─────────────────────────────────────────────── */
const ENTRIES_PER_PAGE = 6;
const CATEGORIES = ["General", "Orders", "Rent", "Salary", "Ads", "Utilities", "Refund", "Other"];

/* ─── helpers ────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const today = () => new Date().toISOString().split("T")[0];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Rojmel() {
  const dispatch = useDispatch();
  const { entries, summary, pagination, loading } = useSelector((s) => s.rojmel);
  const monthlySummary = useSelector((s) => s.rojmel.monthlySummary);

  const [view, setView] = useState("today");
  const [filters, setFilters] = useState({ startDate: today(), endDate: today(), paymentMethod: "", search: "", page: 1 });
  const [monthFilter, setMonthFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today(), particulars: "", voucherNo: "", type: "INCOME", amount: "", paymentMethod: "Online", category: "General" });

  /* book state — currentPage = index of the LEFT page in the pages array */
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState("next");
  const [flipKey, setFlipKey] = useState(0);

  /* date navigation state */
  const [selectedDate, setSelectedDate] = useState(today());
  const [isDateFlipping, setIsDateFlipping] = useState(false);
  const [dateFlipDir, setDateFlipDir] = useState("agla");
  const [dateFlipKey, setDateFlipKey] = useState(0);

  const printRef = useRef();

  /* load is driven by view/filters only — date nav dispatches independently */
  const load = useCallback(() => {
    if (view === "today") dispatch(fetchTodayEntries());
    else if (view === "range") dispatch(fetchByDate({ ...filters }));
    else dispatch(fetchSummary(monthFilter));
  }, [dispatch, view, filters, monthFilter]);

  /* when view/filters change: fetch fresh data + reset to today */
  useEffect(() => {
    load();
    setCurrentPage(0);
    setSelectedDate(today()); // reset date back to today on every tab/filter change
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  /* split entries into pages (left + right each hold ENTRIES_PER_PAGE rows) */
  const pages = [];
  for (let i = 0; i < entries.length; i += ENTRIES_PER_PAGE) {
    pages.push(entries.slice(i, i + ENTRIES_PER_PAGE));
  }
  if (pages.length === 0) pages.push([]);

  /* left = pages[currentPage], right = pages[currentPage + 1] */
  const leftPageEntries  = pages[currentPage]     || [];
  const rightPageEntries = pages[currentPage + 1] || [];
  const leftPageNum  = currentPage + 1;
  const rightPageNum = currentPage + 2;

  /* Next: enabled whenever there is at least one more page beyond the current left page */
  const canNext = currentPage < pages.length - 1;
  const canPrev = currentPage > 0;

  /* ── date navigation handler ──
     Calculates new date, plays flip, then DIRECTLY dispatches the fetch.
     Does NOT rely on useEffect chain — avoids stale-closure issues. */
  const handleDateNav = (dir) => {
    if (isDateFlipping || isFlipping) return;
    if (dir === "agla" && selectedDate >= today()) return;

    // UTC-safe arithmetic: parse YYYY-MM-DD directly into UTC to avoid
    // timezone shift — new Date("YYYY-MM-DDT00:00:00") is LOCAL midnight,
    // so .toISOString() in IST (UTC+5:30) would roll back to the previous UTC day.
    const [y, mo, dy] = selectedDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, mo - 1, dy));
    dateObj.setUTCDate(dateObj.getUTCDate() + (dir === "agla" ? 1 : -1));
    const newDate = dateObj.toISOString().split("T")[0];

    setDateFlipDir(dir);
    setDateFlipKey((k) => k + 1);
    setIsDateFlipping(true);

    setTimeout(() => {
      setSelectedDate(newDate);
      setCurrentPage(0);
      setIsDateFlipping(false);
      // dispatch directly — don't depend on useEffect chain
      if (newDate === today()) {
        dispatch(fetchTodayEntries());
      } else {
        dispatch(fetchByDate({ startDate: newDate, endDate: newDate, page: 1 }));
      }
    }, 650);
  };

  /* ── flip handler ── */
  const handleFlip = (dir) => {
    if (isFlipping) return;
    if (dir === "next" && !canNext) return;
    if (dir === "prev" && !canPrev) return;
    setFlipDir(dir);
    setFlipKey((k) => k + 1);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage((p) => dir === "next" ? p + 1 : p - 1);
      setIsFlipping(false);
    }, 650);
  };

  /* ── form handlers ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.particulars || !form.amount) return toast.error("Particulars and amount are required");
    const res = await dispatch(addRojmelEntry(form));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Entry added");
      setShowForm(false);
      setForm({ date: today(), particulars: "", voucherNo: "", type: "INCOME", amount: "", paymentMethod: "Online", category: "General" });
      // Refresh the currently-viewed date/range instead of always fetching `today`
      if (view === "today") {
        // If entry date is not today (user viewing past date), re-fetch that date
        if (form.date && form.date !== today()) {
          setSelectedDate(form.date);
          setCurrentPage(0);
          dispatch(fetchByDate({ startDate: form.date, endDate: form.date, page: 1 }));
        } else {
          dispatch(fetchTodayEntries());
        }
      } else if (view === "range") {
        // For range view, re-run current filters
        setCurrentPage(0);
        dispatch(fetchByDate({ ...filters }));
      } else {
        // monthly or others
        load();
      }
    } else toast.error(res.payload || "Failed to add entry");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry? Balances will be recalculated.")) return;
    const res = await dispatch(deleteRojmelEntry(id));
    if (res.meta.requestStatus === "fulfilled") { toast.success("Deleted"); load(); }
    else toast.error(res.payload || "Delete failed");
  };

  const handlePrint = () => {
    const content = printRef.current?.innerHTML || "";
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Rojmel</title>
      <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap" rel="stylesheet">
      <style>
        body{font-family:'Kalam',cursive;background:#fdf6e3;padding:20px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #c8b89a;padding:6px 10px;font-size:12px}
        th{background:#e8d5b0;font-weight:700}
        .dr{color:#991b1b}.cr{color:#166534}
        @media print{button{display:none}}
      </style></head><body>${content}</body></html>`);
    win.document.close(); win.print();
  };

  /* ══════════════════════════════════
     RENDER
  ══════════════════════════════════ */
  return (
    <>
      <RojmelStyles />
      <div className="rj-wrapper">

        {/* ── Header ── */}
        <div className="rj-header">
          <div>
            <h1 className="rj-title">📒 Rojmel</h1>
            <p className="rj-subtitle">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="rj-btn-outline" onClick={handlePrint}>🖨 Print</button>
            <button className="rj-btn-green" onClick={() => setShowForm(!showForm)}>
              {showForm ? "✕ Cancel" : "+ New Entry"}
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="rj-summary-grid">
          <SummaryCard label="Opening Balance" value={fmt(summary.openingBalance)} color="#1d4ed8" icon="🏦" />
          <SummaryCard label="Total Income"    value={fmt(summary.totalIncome)}    color="#166534" icon="📈" />
          <SummaryCard label="Total Expense"   value={fmt(summary.totalExpense)}   color="#991b1b" icon="📉" />
          <SummaryCard label="Closing Balance" value={fmt(summary.closingBalance)} color={summary.closingBalance >= 0 ? "#1d4ed8" : "#991b1b"} icon="💰" bold />
        </div>

        {/* ── View Tabs ── */}
        <div className="rj-tabs">
          {[["today","📅 Today"],["range","📆 Date Range"],["monthly","📊 Monthly"]].map(([v, label]) => (
            <button key={v} className={`rj-tab${view === v ? " rj-tab-active" : ""}`} onClick={() => setView(v)}>{label}</button>
          ))}
        </div>

        {/* ── Range Filters ── */}
        {view === "range" && (
          <div className="rj-filters">
            <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({...f, startDate: e.target.value, page: 1}))} className="rj-input" />
            <input type="date" value={filters.endDate}   onChange={e => setFilters(f => ({...f, endDate: e.target.value, page: 1}))} className="rj-input" />
            <select value={filters.paymentMethod} onChange={e => setFilters(f => ({...f, paymentMethod: e.target.value, page: 1}))} className="rj-input">
              <option value="">All Methods</option>
              {["Cash","Online","COD"].map(m => <option key={m}>{m}</option>)}
            </select>
            <input placeholder="🔍 Search..." value={filters.search} onChange={e => setFilters(f => ({...f, search: e.target.value, page: 1}))} className="rj-input" style={{minWidth:200}} />
            <button onClick={load} className="rj-btn-outline">Apply</button>
          </div>
        )}

        {/* ── Monthly Filters ── */}
        {view === "monthly" && (
          <div className="rj-filters">
            <select value={monthFilter.month} onChange={e => setMonthFilter(f => ({...f, month: Number(e.target.value)}))} className="rj-input">
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                <option key={i} value={i+1}>{m}</option>
              ))}
            </select>
            <input type="number" value={monthFilter.year} onChange={e => setMonthFilter(f => ({...f, year: Number(e.target.value)}))} className="rj-input" style={{width:90}} min={2020} max={2099} />
            <button onClick={load} className="rj-btn-outline">Apply</button>
          </div>
        )}

        {/* ── Entry Form ── */}
        {showForm && (
          <form className="rj-form" onSubmit={handleSubmit}>
            <div className="rj-form-title">✏️ New Ledger Entry</div>
            <div className="rj-form-grid">
              <div className="rj-field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="rj-input" required />
              </div>
              <div className="rj-field">
                <label>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} className="rj-input">
                  <option value="INCOME">Income (Credit)</option>
                  <option value="EXPENSE">Expense (Debit)</option>
                </select>
              </div>
              <div className="rj-field rj-span2">
                <label>Particulars *</label>
                <input placeholder="e.g. Rent paid, Order #1234..." value={form.particulars} onChange={e => setForm(f => ({...f, particulars: e.target.value}))} className="rj-input" style={{width:"100%"}} required />
              </div>
              <div className="rj-field">
                <label>Amount (₹) *</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="rj-input" required />
              </div>
              <div className="rj-field">
                <label>Voucher No</label>
                <input placeholder="VCH-001" value={form.voucherNo} onChange={e => setForm(f => ({...f, voucherNo: e.target.value}))} className="rj-input" />
              </div>
              <div className="rj-field">
                <label>Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm(f => ({...f, paymentMethod: e.target.value}))} className="rj-input">
                  {["Cash","Online","COD"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="rj-field">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="rj-input">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:16, display:"flex", gap:10}}>
              <button type="submit" disabled={loading} className="rj-btn-green">{loading ? "Saving..." : "✓ Save Entry"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="rj-btn-outline">Cancel</button>
            </div>
          </form>
        )}

        {/* ── Monthly Summary (non-book view) ── */}
        {view === "monthly" && monthlySummary && (
          <div className="rj-monthly-wrap">
            <div className="rj-monthly-head">
              Monthly Summary —{" "}
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][(monthlySummary.month || 1) - 1]}{" "}
              {monthlySummary.year}
            </div>
            <div style={{padding:20}}>
              <div className="rj-summary-grid" style={{marginBottom:20}}>
                <SummaryCard label="Total Income"  value={fmt(monthlySummary.summary?.totalIncome)}  color="#166534" icon="📈" />
                <SummaryCard label="Total Expense" value={fmt(monthlySummary.summary?.totalExpense)} color="#991b1b" icon="📉" />
                <SummaryCard label="Net Balance"   value={fmt(monthlySummary.summary?.netBalance)}   color="#1d4ed8" icon="💰" bold />
              </div>
              <table className="rj-monthly-table">
                <thead>
                  <tr>
                    {["Date","Income","Expense","Net"].map(h => (
                      <th key={h} style={{textAlign: h==="Date" ? "left" : "right"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlySummary.daily || {}).map(([day, d], i) => (
                    <tr key={day} style={{background: i%2===0 ? "#fdf6e3" : "#f7edd8"}}>
                      <td>{fmtDate(day)}</td>
                      <td style={{textAlign:"right", color:"#166534", fontWeight:600}}>{d.income > 0 ? fmt(d.income) : "—"}</td>
                      <td style={{textAlign:"right", color:"#991b1b", fontWeight:600}}>{d.expense > 0 ? fmt(d.expense) : "—"}</td>
                      <td style={{textAlign:"right", fontWeight:700, color: d.income-d.expense>=0 ? "#166534" : "#991b1b"}}>{fmt(d.income - d.expense)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════
            THE BOOK
        ══════════════════════════════ */}
        {(view === "today" || view === "range") && (
          <>
            <div className="rj-book-scene" ref={printRef}>

              {/* book shadow base */}
              <div className="rj-book-shadow" />

              <div className="rj-book-open">

                {/* ── LEFT PAGE ── */}
                <div className="rj-page rj-page-left">
                  <div className="rj-page-inner">

                    {/* margin line */}
                    <div className="rj-margin-line" />

                    {/* page header */}
                    <PageHeader view={view} filters={filters} selectedDate={selectedDate} />

                    {loading ? (
                      <EmptyPage icon="📖" msg="Loading entries..." />
                    ) : leftPageEntries.length === 0 && currentPage === 0 ? (
                      <EmptyPage icon="📒" msg="No entries found" sub='Click "+ New Entry" to begin' />
                    ) : (
                      <LedgerTable
                        entries={leftPageEntries}
                        showOpening={currentPage === 0}
                        openingBalance={summary.openingBalance}
                        onDelete={handleDelete}
                      />
                    )}

                    {/* page number — bottom-left */}
                    <div className="rj-page-num rj-page-num-left">{leftPageNum}</div>
                  </div>
                </div>

                {/* ── SPINE ── */}
                <div className="rj-spine">
                  <div className="rj-spine-line" />
                  <div className="rj-spine-line" />
                  <div className="rj-spine-line" />
                </div>

                {/* ── RIGHT PAGE ── */}
                <div className="rj-page rj-page-right">
                  <div className="rj-page-inner">

                    <div className="rj-margin-line" />

                    <PageHeader view={view} filters={filters} selectedDate={selectedDate} />

                    {!loading && (
                      rightPageEntries.length > 0 ? (
                        <LedgerTable
                          entries={rightPageEntries}
                          showOpening={false}
                          openingBalance={0}
                          onDelete={handleDelete}
                        />
                      ) : (
                        <EmptyPage icon="📝" msg="This page is blank" />
                      )
                    )}

                    {/* closing balance on last spread */}
                    {!canNext && !loading && entries.length > 0 && (
                      <div className="rj-closing-row">
                        <span>Closing Balance</span>
                        <span style={{color: summary.closingBalance >= 0 ? "#1d4ed8" : "#991b1b"}}>
                          {fmt(summary.closingBalance)}
                        </span>
                      </div>
                    )}

                    {/* page number — bottom-right */}
                    <div className="rj-page-num rj-page-num-right">{rightPageNum}</div>
                  </div>
                </div>

                {/* ── PAGE FLIP OVERLAY ── */}
                {isFlipping && (
                  <div key={flipKey} className={`rj-flip-overlay${flipDir === "prev" ? " rj-flip-prev" : ""}`}>
                    <div className="rj-flip-face rj-flip-front">
                      <div className="rj-flip-gradient" />
                    </div>
                  </div>
                )}
                {/* ── DATE FLIP OVERLAY (full-width) ── */}
                {isDateFlipping && (
                  <div key={`d${dateFlipKey}`} className={`rj-flip-overlay${dateFlipDir === "pichhla" ? " rj-flip-prev" : ""}`}>
                    <div className="rj-flip-face rj-flip-front">
                      <div className="rj-flip-gradient" />
                    </div>
                  </div>
                )}

              </div>{/* book-open */}

              {/* top-right corner curl decoration (static) */}
              <div className="rj-corner-curl" />

            </div>{/* book-scene */}

            {/* ── Page Navigation ── */}
            <div className="rj-nav">
              <button className="rj-nav-btn" onClick={() => handleFlip("prev")} disabled={!canPrev || isFlipping || isDateFlipping}>
                ◀ Prev Page
              </button>
              <div className="rj-nav-info">
                <div>Pages {leftPageNum} – {Math.min(rightPageNum, pages.length)}</div>
                <div style={{fontSize:12, color:"#c8a96e", marginTop:2}}>{entries.length} entries • {pages.length} pages</div>
              </div>
              <button className="rj-nav-btn" onClick={() => handleFlip("next")} disabled={!canNext || isFlipping || isDateFlipping}>
                Next Page ▶
              </button>
            </div>

            {/* ── Date Navigation (Today view only) ── */}
            {view === "today" && (
            <div className="rj-date-nav">
              <button
                className="rj-date-nav-btn"
                onClick={() => handleDateNav("pichhla")}
                disabled={isDateFlipping || isFlipping}
                title="Go to previous date"
              >
                ◀ Pichhla
              </button>
              <div className="rj-date-display">
                <span className="rj-date-display-icon">📅</span>
                <span>{new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}</span>
                {selectedDate !== today() && (
                  <button className="rj-date-today-btn" onClick={() => {
                    const t = today();
                    setSelectedDate(t);
                    setCurrentPage(0);
                    dispatch(fetchTodayEntries());
                  }} title="Jump to today">
                    Aaj
                  </button>
                )}
              </div>
              <button
                className="rj-date-nav-btn"
                onClick={() => handleDateNav("agla")}
                disabled={isDateFlipping || isFlipping || selectedDate >= today()}
                title="Go to next date"
              >
                Agla ▶
              </button>
            </div>
            )}{/* end date nav */}
          </>
        )}

      </div>{/* rj-wrapper */}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */

function PageHeader({ view, filters, selectedDate }) {
  return (
    <div className="rj-page-header">
      <div className="rj-page-header-title">ROJMEL — BAHI KHATA</div>
      <div className="rj-page-header-date">
        {view === "today"
          ? fmtDate(new Date(selectedDate + "T12:00:00"))
          : `${fmtDate(filters.startDate)} — ${fmtDate(filters.endDate)}`}
      </div>
    </div>
  );
}

function EmptyPage({ icon, msg, sub }) {
  return (
    <div className="rj-empty">
      <div style={{fontSize: 50, marginBottom: 10}}>{icon}</div>
      <div style={{fontSize: 15, fontWeight: 700}}>{msg}</div>
      {sub && <div style={{fontSize: 12, marginTop: 6, color: "#a07840"}}>{sub}</div>}
    </div>
  );
}

function LedgerTable({ entries, showOpening, openingBalance, onDelete }) {
  return (
    <div className="rj-ledger-wrap">
      <table className="rj-ledger">
        <thead>
          <tr>
            <th style={{width:68}}>Date</th>
            <th style={{textAlign:"left"}}>Particulars</th>
            <th className="rj-th-dr">Debit ₹</th>
            <th className="rj-th-cr">Credit ₹</th>
            <th>Balance</th>
            <th style={{width:26}}></th>
          </tr>
        </thead>
        <tbody>
          {showOpening && (
            <tr className="rj-opening-row">
              <td colSpan={4} style={{fontStyle:"italic", color:"#5a3e28"}}>Opening Balance</td>
              <td style={{textAlign:"right", color:"#1d4ed8", fontWeight:700}}>{fmt(openingBalance)}</td>
              <td></td>
            </tr>
          )}
          {entries.map((entry, i) => (
            <tr key={entry._id} className={`rj-entry-row${i % 2 === 0 ? "" : " rj-entry-alt"}`}>
              <td className="rj-cell-date">{fmtDate(entry.date)}</td>
              <td className="rj-cell-part">
                <span>{entry.particulars}</span>
                {entry.category && entry.category !== "General" && (
                  <span className="rj-cat-badge">[{entry.category}]</span>
                )}
                {entry.voucherNo && (
                  <span className="rj-voucher">{entry.voucherNo}</span>
                )}
              </td>
              <td className="rj-cell-dr">{entry.type === "EXPENSE" ? fmt(entry.amount) : ""}</td>
              <td className="rj-cell-cr">{entry.type === "INCOME"  ? fmt(entry.amount) : ""}</td>
              <td className="rj-cell-bal" style={{color: entry.balance >= 0 ? "#1d4ed8" : "#991b1b"}}>
                {fmt(entry.balance)}
              </td>
              <td style={{textAlign:"center", padding:"2px"}}>
                <button
                  onClick={() => onDelete(entry._id)}
                  className="rj-del-btn"
                  title="Delete entry"
                >🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({ label, value, color, icon, bold }) {
  return (
    <div className="rj-card">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <div>
          <div className="rj-card-label">{label}</div>
          <div className="rj-card-value" style={{color, fontSize: bold ? 21 : 18}}>{value}</div>
        </div>
        <span style={{fontSize:22}}>{icon}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ALL STYLES  (injected as a style tag so we can use @import)
═══════════════════════════════════════════════════════════════ */
function RojmelStyles() {
  return (
    <style>{`
      /* ── Google Font ── */
      @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap');

      /* ── Wrapper / background ── */
      .rj-wrapper {
        min-height: 100vh;
        background:
          radial-gradient(ellipse at 20% 50%, #6b3a1f 0%, transparent 60%),
          radial-gradient(ellipse at 80% 50%, #3d1c0a 0%, transparent 60%),
          #2d1206;
        padding: 24px 20px 40px;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: 'Kalam', cursive;
      }

      /* ── Header ── */
      .rj-header {
        width: 100%;
        max-width: 1200px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;
      }
      .rj-title {
        margin: 0;
        font-size: 30px;
        font-weight: 700;
        color: #f5e6c8;
        letter-spacing: 2px;
        text-shadow: 2px 2px 6px rgba(0,0,0,0.6);
        font-family: 'Kalam', cursive;
      }
      .rj-subtitle {
        margin: 4px 0 0;
        font-size: 13px;
        color: #c8a96e;
        font-family: 'Kalam', cursive;
      }

      /* ── Buttons ── */
      .rj-btn-outline {
        padding: 8px 18px;
        background: rgba(200,169,110,0.15);
        color: #f5e6c8;
        border: 1.5px solid #c8a96e;
        border-radius: 6px;
        font-family: 'Kalam', cursive;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .rj-btn-outline:hover { background: rgba(200,169,110,0.3); }
      .rj-btn-green {
        padding: 8px 18px;
        background: #1a6b3c;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-family: 'Kalam', cursive;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
      }
      .rj-btn-green:hover { background: #145c31; }

      /* ── Summary Cards ── */
      .rj-summary-grid {
        width: 100%;
        max-width: 1200px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
        gap: 12px;
        margin-bottom: 20px;
      }
      .rj-card {
        background: linear-gradient(135deg, #fdf6e3, #f5e6c8);
        border: 1px solid #c8a96e;
        border-radius: 8px;
        padding: 14px 18px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        font-family: 'Kalam', cursive;
        transition: transform 0.2s;
      }
      .rj-card:hover { transform: translateY(-3px); }
      .rj-card-label { font-size: 11px; color: #7a5c3e; margin-bottom: 4px; }
      .rj-card-value { font-weight: 700; font-family: 'Kalam', cursive; }

      /* ── Tabs ── */
      .rj-tabs {
        width: 100%;
        max-width: 1200px;
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }
      .rj-tab {
        padding: 8px 20px;
        border: 1.5px solid #c8a96e;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Kalam', cursive;
        font-size: 14px;
        transition: all 0.2s;
        background: rgba(255,255,255,0.07);
        color: #f5e6c8;
      }
      .rj-tab:hover { background: rgba(200,169,110,0.2); }
      .rj-tab-active {
        background: #c8a96e !important;
        color: #3d2b1f !important;
        font-weight: 700;
      }

      /* ── Filters ── */
      .rj-filters {
        width: 100%;
        max-width: 1200px;
        background: rgba(253,246,227,0.07);
        border: 1px solid #c8a96e40;
        border-radius: 8px;
        padding: 12px 16px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .rj-input {
        padding: 8px 10px;
        border: 1px solid #c8b89a;
        border-radius: 6px;
        background: rgba(253,246,227,0.92);
        font-family: 'Kalam', cursive;
        font-size: 13px;
        color: #3d2b1f;
        outline: none;
        transition: border-color 0.2s;
      }
      .rj-input:focus { border-color: #c8a96e; box-shadow: 0 0 0 2px rgba(200,169,110,0.25); }

      /* ── Entry Form ── */
      .rj-form {
        width: 100%;
        max-width: 1200px;
        background: linear-gradient(135deg, #fdf6e3, #f5e6c8);
        border: 2px solid #c8a96e;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        font-family: 'Kalam', cursive;
      }
      .rj-form-title { font-size: 17px; color: #3d2b1f; font-weight: 700; margin-bottom: 16px; font-family: 'Kalam', cursive; }
      .rj-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
      .rj-field label { display: block; font-size: 11px; color: #7a5c3e; margin-bottom: 4px; font-weight: 700; }
      .rj-span2 { grid-column: span 2; }

      /* ── Monthly summary ── */
      .rj-monthly-wrap {
        width: 100%;
        max-width: 1200px;
        background: linear-gradient(135deg, #fdf6e3, #f5e6c8);
        border: 2px solid #c8a96e;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 8px 28px rgba(0,0,0,0.3);
      }
      .rj-monthly-head {
        background: linear-gradient(135deg, #c8a96e, #a07840);
        padding: 14px 20px;
        color: #fff;
        font-size: 18px;
        font-weight: 700;
        font-family: 'Kalam', cursive;
      }
      .rj-monthly-table { width: 100%; border-collapse: collapse; font-family: 'Kalam', cursive; font-size: 13px; }
      .rj-monthly-table th { padding: 10px 12px; background: #e8d5b0; color: #3d2b1f; font-weight: 700; border-bottom: 2px solid #c8b89a; }
      .rj-monthly-table td { padding: 8px 12px; border-bottom: 1px solid #e0cba8; color: #3d2b1f; }

      /* ════════════════════════════════
         THE OPEN BOOK
      ════════════════════════════════ */
      .rj-book-scene {
        width: 100%;
        max-width: 1200px;
        perspective: 2500px;
        position: relative;
      }

      /* book drop shadow on "table surface" */
      .rj-book-shadow {
        position: absolute;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        height: 40px;
        background: radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%);
        filter: blur(12px);
        z-index: 0;
        pointer-events: none;
      }

      .rj-book-open {
        display: flex;
        position: relative;
        z-index: 1;
        border-radius: 3px 10px 10px 3px;
        box-shadow:
          -6px 6px 20px rgba(0,0,0,0.4),
          6px 6px 20px rgba(0,0,0,0.3),
          0 2px 6px rgba(0,0,0,0.5);
        min-height: 580px;
        overflow: visible;
      }

      /* ── Page ── */
      .rj-page {
        flex: 1;
        position: relative;
        overflow: hidden;
        /* paper colour + texture + ruled lines */
        background-color: #fdf6e3;
        background-image:
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E"),
          repeating-linear-gradient(
            transparent 0px,
            transparent 30px,
            #b8a88a44 30px,
            #b8a88a44 31px
          );
        min-height: 580px;
      }

      .rj-page-left {
        border-radius: 3px 0 0 3px;
        box-shadow: inset -10px 0 24px rgba(0,0,0,0.09), inset 0 0 0 1px #d4c4a8;
      }
      .rj-page-right {
        border-radius: 0 10px 10px 0;
        box-shadow: inset 10px 0 24px rgba(0,0,0,0.09), inset 0 0 0 1px #d4c4a8;
      }

      /* page inner padding */
      .rj-page-inner {
        padding: 20px 18px 36px 52px;
        position: relative;
        height: 100%;
        box-sizing: border-box;
      }

      /* red margin line */
      .rj-margin-line {
        position: absolute;
        left: 40px;
        top: 0;
        bottom: 0;
        width: 1.5px;
        background: #e07070;
        opacity: 0.55;
        pointer-events: none;
      }

      /* ── Page header ── */
      .rj-page-header {
        text-align: center;
        padding-bottom: 8px;
        margin-bottom: 10px;
        border-bottom: 2px solid #c8a96e;
        font-family: 'Kalam', cursive;
      }
      .rj-page-header-title {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 2px;
        color: #3d2b1f;
        text-transform: uppercase;
      }
      .rj-page-header-date {
        font-size: 11px;
        color: #7a5c3e;
        margin-top: 2px;
      }

      /* ── Spine ── */
      .rj-spine {
        width: 22px;
        flex-shrink: 0;
        background: linear-gradient(to right,
          #6b3a1f 0%,
          #a07840 20%,
          #f5e6c8 40%,
          #fff8ee 50%,
          #f5e6c8 60%,
          #a07840 80%,
          #6b3a1f 100%
        );
        box-shadow: -3px 0 12px rgba(0,0,0,0.35), 3px 0 12px rgba(0,0,0,0.25);
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
        padding: 30px 0;
      }
      .rj-spine-line {
        width: 2px;
        height: 40px;
        background: rgba(100,60,20,0.35);
        border-radius: 1px;
      }

      /* ── Ledger table ── */
      .rj-ledger-wrap { overflow-x: auto; }
      .rj-ledger {
        width: 100%;
        border-collapse: collapse;
        font-family: 'Kalam', cursive;
        font-size: 12px;
      }
      .rj-ledger th {
        padding: 4px 6px;
        text-align: center;
        font-size: 11px;
        font-weight: 700;
        color: #4a2e14;
        border-bottom: 2px solid #c8a96e;
        border-right: 1px solid #c8b89a80;
        background: transparent;
        font-family: 'Kalam', cursive;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .rj-ledger th:last-child { border-right: none; }
      .rj-th-dr { color: #991b1b !important; }
      .rj-th-cr { color: #166534 !important; }

      .rj-ledger td {
        padding: 5px 6px;
        border-bottom: 1px solid #c8b89a45;
        border-right: 1px solid #c8b89a35;
        font-family: 'Kalam', cursive;
        font-size: 12px;
        color: #3d2b1f;
        background: transparent;
        vertical-align: middle;
        line-height: 1.3;
      }
      .rj-ledger td:last-child { border-right: none; }

      .rj-opening-row td {
        background: rgba(200,169,110,0.2) !important;
        font-style: italic;
        font-size: 11px;
      }
      .rj-entry-alt td { background: rgba(200,180,140,0.08) !important; }
      .rj-entry-row:hover td { background: rgba(200,169,110,0.18) !important; transition: background 0.15s; }

      .rj-cell-date  { font-size: 10.5px; color: #5a3e28; text-align: center; white-space: nowrap; }
      .rj-cell-part  { font-size: 11.5px; color: #3d2b1f; text-align: left; }
      .rj-cell-dr    { text-align: right; color: #991b1b; font-weight: 700; white-space: nowrap; }
      .rj-cell-cr    { text-align: right; color: #166534; font-weight: 700; white-space: nowrap; }
      .rj-cell-bal   { text-align: right; font-weight: 700; white-space: nowrap; }

      .rj-cat-badge  { display: block; font-size: 9px; color: #a07840; margin-top: 1px; }
      .rj-voucher    { display: block; font-size: 9px; color: #aaa; font-style: italic; }

      .rj-del-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #dc2626;
        font-size: 11px;
        padding: 2px 3px;
        opacity: 0.6;
        transition: opacity 0.15s;
      }
      .rj-del-btn:hover { opacity: 1; }

      /* closing balance banner */
      .rj-closing-row {
        margin-top: 12px;
        padding: 9px 12px;
        background: rgba(200,169,110,0.25);
        border: 1.5px solid #c8a96e;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        font-family: 'Kalam', cursive;
        font-weight: 700;
        color: #3d2b1f;
        font-size: 13px;
      }

      /* page numbers */
      .rj-page-num {
        position: absolute;
        bottom: 10px;
        font-family: 'Kalam', cursive;
        font-size: 12px;
        color: #7a5c3e;
        opacity: 0.7;
      }
      .rj-page-num-left  { left: 52px; }
      .rj-page-num-right { right: 18px; }

      /* corner curl (decorative) */
      .rj-corner-curl {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 30px;
        height: 30px;
        background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%);
        border-bottom-right-radius: 10px;
        z-index: 12;
        pointer-events: none;
      }

      /* empty state */
      .rj-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 380px;
        color: #7a5c3e;
        font-family: 'Kalam', cursive;
        text-align: center;
      }

      /* ═══════════════════════════════
         PAGE FLIP ANIMATION
      ═══════════════════════════════ */
      .rj-flip-overlay {
        position: absolute;
        top: 0;
        right: 0;
        width: calc(50% - 11px);   /* right half width (excluding spine) */
        height: 100%;
        transform-origin: left center;
        transform-style: preserve-3d;
        z-index: 30;
        pointer-events: none;
        border-radius: 0 10px 10px 0;
        animation: rjFlipNext 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .rj-flip-overlay.rj-flip-prev {
        right: auto;
        left: 0;
        transform-origin: right center;
        border-radius: 3px 0 0 3px;
        animation: rjFlipPrev 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .rj-flip-face {
        width: 100%;
        height: 100%;
        background-color: #fdf6e3;
        background-image:
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E"),
          repeating-linear-gradient(
            transparent 0px,
            transparent 30px,
            #b8a88a44 30px,
            #b8a88a44 31px
          );
        border-radius: inherit;
        overflow: hidden;
      }

      /* gradient sweep to simulate curling / shadow */
      .rj-flip-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(to left, rgba(0,0,0,0) 0%, rgba(60,30,10,0.12) 100%);
        animation: rjGradientSweep 0.65s ease forwards;
      }

      @keyframes rjFlipNext {
        0%   { transform: perspective(2200px) rotateY(0deg);    box-shadow:  0 0 0px rgba(0,0,0,0);   }
        45%  { transform: perspective(2200px) rotateY(-90deg);  box-shadow: -20px 0 40px rgba(0,0,0,0.45); }
        100% { transform: perspective(2200px) rotateY(-182deg); box-shadow:  0 0 0px rgba(0,0,0,0);   opacity:0; }
      }

      @keyframes rjFlipPrev {
        0%   { transform: perspective(2200px) rotateY(0deg);   box-shadow: 0 0 0px rgba(0,0,0,0);    }
        45%  { transform: perspective(2200px) rotateY(90deg);  box-shadow: 20px 0 40px rgba(0,0,0,0.45); }
        100% { transform: perspective(2200px) rotateY(182deg); box-shadow: 0 0 0px rgba(0,0,0,0);    opacity:0; }
      }

      @keyframes rjGradientSweep {
        0%   { opacity: 0; }
        45%  { opacity: 1; }
        100% { opacity: 0; }
      }

      /* ── Navigation ── */
      .rj-nav {
        width: 100%;
        max-width: 1200px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 18px;
      }
      .rj-nav-btn {
        background: linear-gradient(135deg, #c8a96e, #a07840);
        color: #3d2b1f;
        border: none;
        border-radius: 7px;
        padding: 11px 28px;
        font-family: 'Kalam', cursive;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        transition: all 0.2s;
        letter-spacing: 0.5px;
      }
      .rj-nav-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0,0,0,0.4);
      }
      .rj-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
      .rj-nav-info {
        text-align: center;
        font-family: 'Kalam', cursive;
        color: #f5e6c8;
        font-size: 15px;
        font-weight: 700;
      }

      /* ── Date Navigation ── */
      .rj-date-nav {
        width: 100%;
        max-width: 1200px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        padding: 10px 16px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(200,169,110,0.3);
        border-radius: 10px;
      }
      .rj-date-nav-btn {
        background: linear-gradient(135deg, #3b2a6e, #5b3fa0);
        color: #e8d8ff;
        border: none;
        border-radius: 7px;
        padding: 10px 26px;
        font-family: 'Kalam', cursive;
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(80,50,160,0.4);
        transition: all 0.2s;
        letter-spacing: 0.5px;
      }
      .rj-date-nav-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(80,50,160,0.55);
        background: linear-gradient(135deg, #4a36a0, #6b50c0);
      }
      .rj-date-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
      .rj-date-display {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Kalam', cursive;
        font-size: 15px;
        font-weight: 700;
        color: #f5e6c8;
      }
      .rj-date-display-icon { font-size: 18px; }
      .rj-date-today-btn {
        background: #c8a96e;
        color: #3d2b1f;
        border: none;
        border-radius: 5px;
        padding: 3px 10px;
        font-family: 'Kalam', cursive;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
      }
      .rj-date-today-btn:hover { background: #e0c080; }

      /* Date flip overlay covers full book width */
      .rj-date-flip {
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        transform-origin: left center;
      }
      .rj-date-flip.rj-flip-prev {
        transform-origin: right center;
      }

      /* ── Responsive ── */
      @media (max-width: 700px) {
        .rj-wrapper { padding: 8px 8px 20px; }
        .rj-title { font-size: 22px; }
        .rj-summary-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .rj-card { padding: 10px 12px; }
        .rj-filters { flex-direction: column; gap: 8px; }
        .rj-filters input[style*="minWidth"], .rj-filters .rj-input { min-width: unset !important; width: 100% !important; }
        .rj-input { width: 100%; }
        .rj-form-grid { grid-template-columns: 1fr; }
        .rj-span2 { grid-column: span 1; }
        .rj-book-open { flex-direction: column; }
        .rj-spine { width: 100%; height: 16px; flex-direction: row; padding: 0 20px; }
        .rj-spine-line { width: 40px; height: 2px; }
        .rj-page { min-height: 350px; }
        .rj-page-inner { padding: 16px 14px 30px 40px; }
        .rj-flip-overlay { display: none; }
        .rj-monthly-table { font-size: 12px; }
        .rj-monthly-table th, .rj-monthly-table td { padding: 6px 8px; }
        .rj-date-nav { flex-wrap: wrap; gap: 6px; }
        .rj-pagination { flex-wrap: wrap; gap: 6px; justify-content: center; }
      }

      @media (max-width: 400px) {
        .rj-summary-grid { grid-template-columns: 1fr 1fr; }
        .rj-title { font-size: 18px; }
      }
    `}</style>
  );
}
