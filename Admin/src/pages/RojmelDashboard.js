import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSummary, fetchTodayEntries } from "../features/rojmel/rojmelSlice";
import { fetchDashboard } from "../features/wholesale/wholesaleSlice";

/* ─── helpers ────────────────────────────────────────────────── */
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 0 
  }).format(n || 0);

const today = () => new Date().toISOString().split("T")[0];

/* ══════════════════════════════════════════════════════════════
   STAT CARD COMPONENT
═══════════════════════════════════════════════════════════════ */
function StatCard({ label, amount, icon, color = "#1d4ed8", bgColor = "#eff6ff" }) {
  return (
    <div style={{
      background: bgColor,
      border: `2px solid ${color}`,
      borderRadius: 16,
      padding: "24px 28px",
      flex: 1,
      minWidth: 200,
      textAlign: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.2 }}>
        {fmt(amount)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB BUTTON COMPONENT
═══════════════════════════════════════════════════════════════ */
function TabButton({ isActive, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 24px",
        border: "none",
        borderRadius: 10,
        fontSize: 15,
        fontWeight: isActive ? 700 : 500,
        cursor: "pointer",
        background: isActive ? "#1d4ed8" : "#f1f5f9",
        color: isActive ? "#fff" : "#64748b",
        display: "flex",
        alignItems: "center",
        gap: 8,
        transition: "all 0.2s",
        boxShadow: isActive ? "0 4px 12px rgba(29,78,216,0.3)" : "none"
      }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function RojmelDashboard() {
  const dispatch = useDispatch();
  const { monthlySummary, loading: rojmelLoading } = useSelector((s) => s.rojmel);
  const { dashboard, loading: wholesaleLoading } = useSelector((s) => s.wholesale);
  
  const [activeTab, setActiveTab] = useState("overview"); // overview, rojmel, wholesale
  const [monthFilter, setMonthFilter] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });

  const loading = rojmelLoading || wholesaleLoading;

  useEffect(() => {
    dispatch(fetchSummary(monthFilter));
    dispatch(fetchDashboard());
    // also fetch today's rojmel summary so we can show "in hand right now"
    dispatch(fetchTodayEntries());
  }, [dispatch, monthFilter]);

  /* Calculate totals - prefer true closing balance when available */
  const rojmelIncome = monthlySummary?.summary?.totalIncome || 0;
  const rojmelExpense = monthlySummary?.summary?.totalExpense || 0;
  const rojmelOpening = monthlySummary?.summary?.openingBalance || 0;
  const rojmelClosing = monthlySummary?.summary?.closingBalance ?? (rojmelOpening + rojmelIncome - rojmelExpense);

  // current rojmel summary (today) from fetchTodayEntries
  const currentRojmelSummary = useSelector((s) => s.rojmel.summary);
  const rojmelNow = currentRojmelSummary?.closingBalance ?? rojmelClosing;

  const wholesaleStats = dashboard?.stats || {};
  const wholesaleReceivable = wholesaleStats?.totalDue || 0;
  const wholesalePayable = 0; // Not available in dashboard
  const paymentModes = dashboard?.paymentModes || {};
  const wholesaleBalance = (paymentModes?.totalCash || 0) + (paymentModes?.totalOnline || 0);

  const totalInHand = rojmelNow + wholesaleBalance;

  /* ── Month navigation ── */
  const handlePrevMonth = () => {
    setMonthFilter((prev) => {
      const newMonth = prev.month - 1;
      if (newMonth === 0) {
        return { month: 12, year: prev.year - 1 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const handleNextMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    setMonthFilter((prev) => {
      if (prev.year > currentYear || (prev.year === currentYear && prev.month >= currentMonth)) {
        return prev; // Don't go beyond current month
      }
      
      const newMonth = prev.month + 1;
      if (newMonth === 13) {
        return { month: 1, year: prev.year + 1 };
      }
      return { ...prev, month: newMonth };
    });
  };

  const monthName = new Date(monthFilter.year, monthFilter.month - 1).toLocaleDateString("en-IN", { 
    month: "long", 
    year: "numeric" 
  });

  return (
    <div style={{ padding: "24px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontWeight: 800, color: "#1e293b" }}>
          📊 Income & Receivables Dashboard
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
          Track your Rojmel and Wholesale amounts at a glance
        </p>
      </div>

      {/* Month Navigation */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
        background: "#fff",
        padding: "16px 20px",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <button
          onClick={handlePrevMonth}
          style={{
            background: "#e2e8f0",
            border: "none",
            borderRadius: 8,
            width: 40,
            height: 40,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          ←
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", minWidth: 160 }}>
          {monthName}
        </span>
        <button
          onClick={handleNextMonth}
          disabled={monthFilter.year === new Date().getFullYear() && monthFilter.month === new Date().getMonth() + 1}
          style={{
            background: monthFilter.year === new Date().getFullYear() && monthFilter.month === new Date().getMonth() + 1 ? "#e2e8f0" : "#e2e8f0",
            border: "none",
            borderRadius: 8,
            width: 40,
            height: 40,
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: monthFilter.year === new Date().getFullYear() && monthFilter.month === new Date().getMonth() + 1 ? 0.5 : 1
          }}
        >
          →
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap"
      }}>
        <TabButton 
          isActive={activeTab === "overview"} 
          onClick={() => setActiveTab("overview")}
          icon="📈"
        >
          Overview
        </TabButton>
        <TabButton 
          isActive={activeTab === "rojmel"} 
          onClick={() => setActiveTab("rojmel")}
          icon="📕"
        >
          Rojmel
        </TabButton>
        <TabButton 
          isActive={activeTab === "wholesale"} 
          onClick={() => setActiveTab("wholesale")}
          icon="🏭"
        >
          Wholesale
        </TabButton>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          background: "#fff",
          padding: 40,
          borderRadius: 14,
          textAlign: "center",
          color: "#64748b"
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          <p>Loading data...</p>
        </div>
      )}

      {/* Overview Tab */}
      {!loading && activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Main Stats Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16
          }}>
            <StatCard 
              label="💰 Rojmel (in hand now)"
              amount={rojmelNow}
              icon="📘"
              color="#0891b2"
              bgColor="#ecfdf5"
            />
            <StatCard 
              label="📦 Wholesale (cash on hand)"
              amount={wholesaleBalance}
              icon="📗"
              color="#ea580c"
              bgColor="#fff7ed"
            />
            <StatCard 
              label="💳 Total In Hand"
              amount={totalInHand}
              icon="💵"
              color="#16a34a"
              bgColor="#f0fdf4"
            />
          </div>

          <div style={{
            marginTop: 22,
            padding: 18,
            borderRadius: 14,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            color: "#334155"
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>How the total is calculated</div>
            <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Rojmel in hand now</span>
                <strong>{fmt(rojmelNow)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#475569" }}>
                <span>Wholesale cash on hand</span>
                <strong>{fmt(wholesaleBalance)}</strong>
              </div>
              <div style={{ borderTop: "1px solid #cbd5e1", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                <span>Total in hand</span>
                <strong>{fmt(totalInHand)}</strong>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div style={{
            background: "#fff",
            borderRadius: 14,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
              📊 Summary Breakdown
            </h3>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16
            }}>
              {/* Rojmel Section */}
              <div style={{
                background: "#f0f9ff",
                border: "1px solid #0284c7",
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0c4a6e", marginBottom: 8 }}>
                  🔴 ROJMEL
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Income</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0284c7" }}>
                    {fmt(rojmelIncome)}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Expense</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>
                    {fmt(rojmelExpense)}
                  </div>
                </div>
                <div style={{
                  background: "#fff",
                  border: "1px solid #0284c7",
                  borderRadius: 8,
                  padding: 10,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Balance</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0284c7" }}>
                    {fmt(rojmelClosing)}
                  </div>
                </div>
              </div>

              {/* Wholesale Section */}
              <div style={{
                background: "#fef3c7",
                border: "1px solid #ea580c",
                borderRadius: 10,
                padding: 16
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>
                  🟡 WHOLESALE
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Receivable</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ea580c" }}>
                    {fmt(wholesaleReceivable)}
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Payable</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>
                    {fmt(wholesalePayable)}
                  </div>
                </div>
                <div style={{
                  background: "#fff",
                  border: "1px solid #ea580c",
                  borderRadius: 8,
                  padding: 10,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Cash Hand</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#ea580c" }}>
                    {fmt(wholesaleBalance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rojmel Tab */}
      {!loading && activeTab === "rojmel" && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
            📕 Rojmel Details - {monthName}
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24
          }}>
            <div style={{
              background: "#f0f9ff",
              border: "1px solid #0284c7",
              borderRadius: 10,
              padding: 18,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0c4a6e", marginBottom: 8 }}>
                Total Income
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7" }}>
                {fmt(rojmelIncome)}
              </div>
            </div>

            <div style={{
              background: "#fef2f2",
              border: "1px solid #dc2626",
              borderRadius: 10,
              padding: 18,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7f1d1d", marginBottom: 8 }}>
                Total Expense
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>
                {fmt(rojmelExpense)}
              </div>
            </div>

            <div style={{
              background: "#f0fdf4",
              border: "1px solid #16a34a",
              borderRadius: 10,
              padding: 18,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#15803d", marginBottom: 8 }}>
                Balance in Hand
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>
                {fmt(rojmelClosing)}
              </div>
            </div>
          </div>

          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            ℹ️ This is your Rojmel cash book for {monthName}. Income includes all revenue sources, and expenses include all disbursements.
          </p>
        </div>
      )}

      {/* Wholesale Tab */}
      {!loading && activeTab === "wholesale" && (
        <div style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
            🏭 Wholesale Details
          </h3>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24
          }}>
            <div style={{
              background: "#fef3c7",
              border: "1px solid #ea580c",
              borderRadius: 10,
              padding: 18,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>
                Total Receivable
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ea580c" }}>
                {fmt(wholesaleReceivable)}
              </div>
            </div>

            <div style={{
              background: "#fef2f2",
              border: "1px solid #dc2626",
              borderRadius: 10,
              padding: 18,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#7f1d1d", marginBottom: 8 }}>
                Total Payable
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>
                {fmt(wholesalePayable)}
              </div>
            </div>

            <div style={{
              background: "#f0fdf4",
              border: "1px solid #16a34a",
              borderRadius: 10,
              padding: 18,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#15803d", marginBottom: 8 }}>
                Cash on Hand
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>
                {fmt(wholesaleBalance)}
              </div>
            </div>
          </div>

          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            ℹ️ This shows your wholesale business status. Receivable is money owed to you by customers, Payable is money you owe to suppliers, and Cash on Hand is your current available balance.
          </p>
        </div>
      )}
    </div>
  );
}
