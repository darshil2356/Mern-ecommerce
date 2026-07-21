import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchSummary, fetchTodayEntries } from "../features/rojmel/rojmelSlice";
import { fetchPurchaseSummary } from "../features/purchase/purchaseSlice";
import { fetchDashboard } from "../features/wholesale/wholesaleSlice";
import api from "../utils/axiosconfig";

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 0 
  }).format(n || 0);

/* ══════════════════════════════════════════════════════════════
   STAT CARD COMPONENT
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, amount, subtitle, icon, color = "#1d4ed8", bgColor = "#eff6ff", onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        background: bgColor,
        border: `2px solid ${color}`,
        borderRadius: 16,
        padding: "20px 24px",
        flex: 1,
        minWidth: 220,
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default"
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>
          {label}
        </span>
        <span style={{ fontSize: 28 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.2, marginBottom: 4 }}>
        {fmt(amount)}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB BUTTON COMPONENT
═══════════════════════════════════════════════════════════════ */
function TabButton({ isActive, onClick, children, icon, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 22px",
        border: "none",
        borderRadius: 12,
        fontSize: 15,
        fontWeight: isActive ? 700 : 600,
        cursor: "pointer",
        background: isActive ? "#1e293b" : "#f1f5f9",
        color: isActive ? "#ffffff" : "#475569",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s ease",
        boxShadow: isActive ? "0 4px 14px rgba(30,41,59,0.25)" : "none"
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span>{children}</span>
      {badge !== undefined && (
        <span style={{
          background: isActive ? "#38bdf8" : "#cbd5e1",
          color: isActive ? "#0f172a" : "#334155",
          fontSize: 11,
          fontWeight: 800,
          padding: "2px 8px",
          borderRadius: 20
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN MASTER DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function RojmelDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { monthlySummary, loading: rojmelLoading } = useSelector((s) => s.rojmel);
  const currentRojmelSummary = useSelector((s) => s.rojmel.summary);
  const { summary: purchaseSummary, loading: purchaseLoading } = useSelector((s) => s.purchase);
  const { dashboard: wholesaleDashboard, loading: wholesaleLoading } = useSelector((s) => s.wholesale);
  
  const [vendorStats, setVendorStats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, rojmel, purchase, wholesale
  const [monthFilter, setMonthFilter] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });

  const loading = rojmelLoading || purchaseLoading || wholesaleLoading;

  useEffect(() => {
    dispatch(fetchSummary(monthFilter));
    dispatch(fetchPurchaseSummary(monthFilter));
    dispatch(fetchDashboard());
    dispatch(fetchTodayEntries());

    // Fetch overall lifetime vendor payables & stats to match Vendor Dashboard & Vendor Bills exactly
    api.get("/vendor/dashboard-stats")
      .then((res) => setVendorStats(res.data))
      .catch((err) => console.error("Failed to load vendor stats", err));
  }, [dispatch, monthFilter]);

  /* ── 1. ROJMEL METRICS ── */
  const rojmelIncome = monthlySummary?.summary?.totalIncome || 0;
  const rojmelExpense = monthlySummary?.summary?.totalExpense || 0;
  const rojmelOpening = monthlySummary?.summary?.openingBalance || 0;
  const rojmelClosing = monthlySummary?.summary?.closingBalance ?? (rojmelOpening + rojmelIncome - rojmelExpense);
  const rojmelNow = currentRojmelSummary?.closingBalance ?? rojmelClosing;

  /* ── 2. PURCHASE & VENDOR METRICS ── */
  // Selected Month Purchase Totals
  const monthPurchaseTotals = purchaseSummary?.totals || {};
  const monthlyPurchaseAmount = monthPurchaseTotals.totalAmount || 0;
  const monthlyPurchasePaid = monthPurchaseTotals.totalPaid || 0;
  const monthlyPurchaseDue = monthPurchaseTotals.totalDue || 0;
  const monthlyPurchaseBillCount = monthPurchaseTotals.billCount || 0;

  // Overall Lifetime Vendor Payables (Matches Vendor Dashboard & Vendor Bills)
  const lifetimeVendorPayable = vendorStats?.summary?.totalDue ?? monthlyPurchaseDue;
  const lifetimeTotalPurchases = vendorStats?.summary?.totalPurchases || 0;
  const lifetimeTotalPaid = vendorStats?.summary?.totalPaid || 0;
  const topVendorsByDue = vendorStats?.topVendorsByDue || purchaseSummary?.byVendor || [];

  /* ── 3. WHOLESALE METRICS ── */
  const wholesaleStats = wholesaleDashboard?.stats || {};
  const wholesaleReceivable = wholesaleStats?.totalDue || 0;
  const wholesaleTotalSales = wholesaleStats?.totalSales || 0;
  const wholesalePaymentModes = wholesaleDashboard?.paymentModes || {};
  const wholesaleCashCollected = wholesalePaymentModes?.totalCash || 0;
  const wholesaleOnlineCollected = wholesalePaymentModes?.totalOnline || 0;
  const wholesaleTotalCollected = wholesaleCashCollected + wholesaleOnlineCollected;

  /* ── 4. NET MASTER FINANCIAL CALCULATIONS ── */
  // Liquid Cash on hand = Rojmel Closing balance + Wholesale Cash/Online collections
  const totalCashInHand = rojmelNow + wholesaleTotalCollected;
  // Net Business Financial Position = Cash in Hand + Customer Receivables - Lifetime Vendor Payables
  const netBusinessStanding = (totalCashInHand + wholesaleReceivable) - lifetimeVendorPayable;

  /* ── Month navigation ── */
  const handlePrevMonth = () => {
    setMonthFilter((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth === 0) return { month: 12, year: prev.year - 1 };
      return { ...prev, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    setMonthFilter((prev) => {
      if (prev.year > currentYear || (prev.year === currentYear && prev.month >= currentMonth)) {
        return prev;
      }
      const newMonth = prev.month + 1;
      if (newMonth === 13) return { month: 1, year: prev.year + 1 };
      return { ...prev, month: newMonth };
    });
  };

  const monthName = new Date(monthFilter.year, monthFilter.month - 1).toLocaleDateString("en-IN", { 
    month: "long", 
    year: "numeric" 
  });

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            📊 Unified Master Financial Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
            One single dashboard for <strong>Rojmel (Cashbook)</strong>, <strong>Purchase Bills (Payables)</strong> & <strong>Wholesale (Receivables)</strong>
          </p>
        </div>

        {/* Month Navigation Control */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#ffffff",
          padding: "10px 16px",
          borderRadius: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e2e8f0"
        }}>
          <button
            onClick={handlePrevMonth}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              fontSize: 18,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ←
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", minWidth: 150, textAlign: "center" }}>
            📅 {monthName}
          </span>
          <button
            onClick={handleNextMonth}
            disabled={monthFilter.year === new Date().getFullYear() && monthFilter.month === new Date().getMonth() + 1}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: 8,
              width: 36,
              height: 36,
              fontSize: 18,
              fontWeight: 700,
              color: "#334155",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: (monthFilter.year === new Date().getFullYear() && monthFilter.month === new Date().getMonth() + 1) ? 0.4 : 1
            }}
          >
            →
          </button>
        </div>
      </div>

      {/* EXECUTIVE NET FINANCIAL STANDING BANNER */}
      <div style={{
        background: netBusinessStanding >= 0 
          ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" 
          : "linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)",
        color: "#ffffff",
        borderRadius: 20,
        padding: "24px 28px",
        marginBottom: 28,
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 6 }}>
              ⚖️ Net Business Position (Cash + Receivables - Payables)
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: netBusinessStanding >= 0 ? "#4ade80" : "#fca5a5", letterSpacing: "-1px" }}>
              {fmt(netBusinessStanding)}
            </div>
            <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
              {netBusinessStanding >= 0 
                ? "✅ Strong Financial Position — Available Assets exceed Liabilities" 
                : "⚠️ Liabilities (Vendor Payables) exceed immediate Liquid Cash & Receivables"}
            </div>
          </div>

          {/* Quick Metrics Pill Bar */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "12px 18px", borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>💵 Total Liquid Cash</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8" }}>{fmt(totalCashInHand)}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "12px 18px", borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>📥 Customer Receivables</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fb923c" }}>{fmt(wholesaleReceivable)}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", padding: "12px 18px", borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>📤 Vendor Payables</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f87171" }}>{fmt(lifetimeVendorPayable)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <TabButton isActive={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon="📈">
          Master Overview
        </TabButton>
        <TabButton isActive={activeTab === "rojmel"} onClick={() => setActiveTab("rojmel")} icon="📕">
          Rojmel (Cashbook)
        </TabButton>
        <TabButton isActive={activeTab === "purchase"} onClick={() => setActiveTab("purchase")} icon="🛍️" badge={monthlyPurchaseBillCount}>
          Purchase (Payables)
        </TabButton>
        <TabButton isActive={activeTab === "wholesale"} onClick={() => setActiveTab("wholesale")} icon="🏭">
          Wholesale (Receivables)
        </TabButton>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div style={{ background: "#ffffff", padding: 48, borderRadius: 16, textAlign: "center", color: "#64748b", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Fetching latest Rojmel, Purchase & Wholesale data...</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         TAB 1: MASTER OVERVIEW
      ═══════════════════════════════════════════════════════════════ */}
      {!loading && activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Top 4 KPI Hero Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
            <StatCard 
              label="💵 Cash in Hand"
              amount={totalCashInHand}
              subtitle="Rojmel Cash + Wholesale Collections"
              icon="💰"
              color="#0284c7"
              bgColor="#f0f9ff"
            />
            <StatCard 
              label="📥 Customer Receivables"
              amount={wholesaleReceivable}
              subtitle="Money customers owe you (Wholesale)"
              icon="📥"
              color="#ea580c"
              bgColor="#fff7ed"
              onClick={() => navigate("/admin/wholesale-rojmal")}
            />
            <StatCard 
              label="📤 Total Vendor Payables"
              amount={lifetimeVendorPayable}
              subtitle="Total unpaid balance owed to vendors"
              icon="📤"
              color="#dc2626"
              bgColor="#fef2f2"
              onClick={() => navigate("/admin/vendor-dashboard")}
            />
            <StatCard 
              label="🛒 Monthly Purchase Spend"
              amount={monthlyPurchaseAmount}
              subtitle={`Total Bills in ${monthName}`}
              icon="🛍️"
              color="#4f46e5"
              bgColor="#eef2ff"
              onClick={() => navigate("/admin/purchase-list")}
            />
          </div>

          {/* 3 Module Side-by-Side Breakdown Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            
            {/* ROJMEL CARD */}
            <div style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📕</span> Rojmel (Retail Daily Book)
                </div>
                <button 
                  onClick={() => navigate("/admin/rojmel")}
                  style={{ background: "#e0f2fe", border: "none", color: "#0369a1", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  View Details →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Total Income ({monthName})</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0284c7" }}>{fmt(rojmelIncome)}</div>
                </div>
                <div style={{ background: "#fef2f2", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Total Expense ({monthName})</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#dc2626" }}>{fmt(rojmelExpense)}</div>
                </div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Current Rojmel Cash in Hand</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{fmt(rojmelNow)}</div>
              </div>
            </div>

            {/* PURCHASE CARD */}
            <div style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#4338ca", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🛍️</span> Purchase Bills (Payables)
                </div>
                <button 
                  onClick={() => navigate("/admin/vendor-dashboard")}
                  style={{ background: "#e0e7ff", border: "none", color: "#4338ca", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Vendor Dashboard →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#eef2ff", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Purchases ({monthName})</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#4f46e5" }}>{fmt(monthlyPurchaseAmount)}</div>
                </div>
                <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Paid ({monthName})</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{fmt(monthlyPurchasePaid)}</div>
                </div>
              </div>

              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#991b1b", fontWeight: 600 }}>Total Vendor Payables (Lifetime Dues)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{fmt(lifetimeVendorPayable)}</div>
              </div>
            </div>

            {/* WHOLESALE CARD */}
            <div style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#c2410c", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🏭</span> Wholesale Rojmal (Receivables)
                </div>
                <button 
                  onClick={() => navigate("/admin/wholesale-rojmal")}
                  style={{ background: "#ffedd5", border: "none", color: "#c2410c", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  View Ledger →
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ background: "#fff7ed", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Wholesale Sales</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#ea580c" }}>{fmt(wholesaleTotalSales)}</div>
                </div>
                <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Collections</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{fmt(wholesaleTotalCollected)}</div>
                </div>
              </div>

              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#9a3412", fontWeight: 600 }}>Customer Dues (Receivables)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#ea580c" }}>{fmt(wholesaleReceivable)}</div>
              </div>
            </div>

          </div>

          {/* CALCULATION & FINANCIAL HEALTH BREAKDOWN CARD */}
          <div style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: 24,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
              💡 Understanding Your Combined Business Financials
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
                  1. Liquid Cash Calculation
                </div>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span>Rojmel Cash in Hand</span>
                    <strong>{fmt(rojmelNow)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
                    <span>Wholesale Collections (Cash + Online)</span>
                    <strong>{fmt(wholesaleTotalCollected)}</strong>
                  </div>
                  <div style={{ borderTop: "2px dashed #cbd5e1", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: "#0284c7" }}>
                    <span>= Total Liquid Cash</span>
                    <span>{fmt(totalCashInHand)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
                  2. Net Business Standing Formula
                </div>
                <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#16a34a" }}>
                    <span>(+) Total Liquid Cash</span>
                    <strong>+ {fmt(totalCashInHand)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#ea580c" }}>
                    <span>(+) Customer Receivables</span>
                    <strong>+ {fmt(wholesaleReceivable)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "#dc2626" }}>
                    <span>(-) Total Vendor Payables</span>
                    <strong>- {fmt(lifetimeVendorPayable)}</strong>
                  </div>
                  <div style={{ borderTop: "2px dashed #cbd5e1", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 800, color: netBusinessStanding >= 0 ? "#16a34a" : "#dc2626" }}>
                    <span>= Net Business Standing</span>
                    <span>{fmt(netBusinessStanding)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         TAB 2: ROJMEL (CASHBOOK)
      ═══════════════════════════════════════════════════════════════ */}
      {!loading && activeTab === "rojmel" && (
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              📕 Rojmel Cashbook Details — {monthName}
            </h3>
            <button 
              onClick={() => navigate("/admin/rojmel")}
              style={{ background: "#0284c7", color: "#ffffff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}
            >
              Open Daily Rojmel Journal →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#f0f9ff", border: "1px solid #7dd3fc", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0369a1", marginBottom: 6 }}>Monthly Total Income</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7" }}>{fmt(rojmelIncome)}</div>
            </div>
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", marginBottom: 6 }}>Monthly Total Expense</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{fmt(rojmelExpense)}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Opening Cash Balance</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#334155" }}>{fmt(rojmelOpening)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 6 }}>Closing Cash Balance</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{fmt(rojmelClosing)}</div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         TAB 3: PURCHASE (PAYABLES)
      ═══════════════════════════════════════════════════════════════ */}
      {!loading && activeTab === "purchase" && (
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              🛍️ Purchase Bills & Vendor Payables
            </h3>
            <div style={{ display: "flex", gap: 10 }}>
              <button 
                onClick={() => navigate("/admin/add-purchase")}
                style={{ background: "#4f46e5", color: "#ffffff", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}
              >
                + Add Bill
              </button>
              <button 
                onClick={() => navigate("/admin/vendor-dashboard")}
                style={{ background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}
              >
                Vendor Dashboard →
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#991b1b", marginBottom: 6 }}>Total Vendor Payables (Lifetime Dues)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{fmt(lifetimeVendorPayable)}</div>
            </div>
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#3730a3", marginBottom: 6 }}>Purchases in {monthName}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#4f46e5" }}>{fmt(monthlyPurchaseAmount)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 6 }}>Amount Paid in {monthName}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{fmt(monthlyPurchasePaid)}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Bills in {monthName}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{monthlyPurchaseBillCount}</div>
            </div>
          </div>

          {/* Top Vendors Table */}
          {topVendorsByDue.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: "#334155", marginBottom: 12 }}>
                🏢 Vendors with Highest Outstanding Dues
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 16px", color: "#64748b" }}>Vendor / Firm Name</th>
                      <th style={{ padding: "12px 16px", color: "#64748b" }}>Total Purchases</th>
                      <th style={{ padding: "12px 16px", color: "#64748b" }}>Total Paid</th>
                      <th style={{ padding: "12px 16px", color: "#64748b" }}>Balance Due (Payable)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVendorsByDue.map((v, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>
                          {v.vendor?.firmName || v.vendor?.name || "Vendor"}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#4f46e5" }}>{fmt(v.totalPurchases || v.totalAmount)}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 600, color: "#16a34a" }}>{fmt(v.totalPaid)}</td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: (v.totalDue || v.balanceDue) > 0 ? "#dc2626" : "#64748b" }}>
                          {fmt(v.totalDue ?? v.balanceDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
         TAB 4: WHOLESALE (RECEIVABLES)
      ═══════════════════════════════════════════════════════════════ */}
      {!loading && activeTab === "wholesale" && (
        <div style={{ background: "#ffffff", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              🏭 Wholesale Customer Receivables & Collections
            </h3>
            <button 
              onClick={() => navigate("/admin/wholesale-rojmal")}
              style={{ background: "#ea580c", color: "#ffffff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}
            >
              Open Wholesale Ledger →
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9a3412", marginBottom: 6 }}>Customer Receivables (Dues)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ea580c" }}>{fmt(wholesaleReceivable)}</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 6 }}>Total Collected (Cash + Online)</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{fmt(wholesaleTotalCollected)}</div>
            </div>
            <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Cash Collections</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{fmt(wholesaleCashCollected)}</div>
            </div>
            <div style={{ background: "#f0f9ff", border: "1px solid #7dd3fc", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0369a1", marginBottom: 6 }}>Online Collections</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7" }}>{fmt(wholesaleOnlineCollected)}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
