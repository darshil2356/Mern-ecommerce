import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import api from "../utils/axiosconfig";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtLakh = (num) => {
  if (!num || num <= 0) return "₹0";
  if (num >= 100000) {
    const lakhs = (num / 100000).toFixed(2);
    return `₹${lakhs} Lakh (${fmt(num)})`;
  }
  return fmt(num);
};

export default function VendorStockAnalyticsModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("COST_DESC");

  // Deep Check state for a specific vendor
  const [deepVendor, setDeepVendor] = useState(null); // vendor object or item list
  const [deepSearch, setDeepSearch] = useState("");

  const fetchStockAnalytics = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      const res = await api.get("/vendor/stock-analysis");
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load vendor stock analytics");
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchStockAnalytics();
  }, [fetchStockAnalytics]);

  if (!isOpen) return null;

  const summary = data?.summary || {};
  const vendorWiseStock = data?.vendorWiseStock || [];

  // Filter & Sort vendors
  const filteredVendors = vendorWiseStock
    .filter((item) => {
      const term = search.toLowerCase().trim();
      if (!term) return true;
      const v = item.vendor || {};
      const matchVendor =
        v.name?.toLowerCase().includes(term) ||
        v.firmName?.toLowerCase().includes(term) ||
        v.phone?.includes(term);
      const matchProduct = item.items?.some(
        (it) =>
          it.title?.toLowerCase().includes(term) ||
          it.sku?.toLowerCase().includes(term) ||
          it.category?.toLowerCase().includes(term)
      );
      return matchVendor || matchProduct;
    })
    .sort((a, b) => {
      if (sortBy === "COST_DESC") return b.totalStockCostValue - a.totalStockCostValue;
      if (sortBy === "QTY_DESC") return b.totalStockQty - a.totalStockQty;
      if (sortBy === "RETAIL_DESC") return b.totalStockRetailValue - a.totalStockRetailValue;
      if (sortBy === "NAME_ASC") return (a.vendor.name || "").localeCompare(b.vendor.name || "");
      return 0;
    });

  // Deep check filtered items
  const deepItemsFiltered = deepVendor
    ? (deepVendor.items || []).filter((it) => {
        const term = deepSearch.toLowerCase().trim();
        if (!term) return true;
        return (
          it.title?.toLowerCase().includes(term) ||
          it.sku?.toLowerCase().includes(term) ||
          it.category?.toLowerCase().includes(term) ||
          it.barcode?.toLowerCase().includes(term)
        );
      })
    : [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 20,
          width: "100%",
          maxWidth: 1180,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            color: "#fff",
            padding: "20px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 10,
                letterSpacing: "-0.5px",
              }}
            >
              <span>🏬</span> Vendor-Wise Stock & Inventory Analytics
            </h3>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 14 }}>
              Check total shop inventory value & exact stock amount available from each vendor.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={fetchStockAnalytics}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
              title="Refresh Data"
            >
              🔄 Refresh
            </button>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                width: 38,
                height: 38,
                cursor: "pointer",
                fontSize: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {loading && !data ? (
            <div style={{ textAlign: "center", padding: 80 }}>
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: 16, color: "#64748b", fontWeight: 600 }}>
                Calculating vendor wise stock in your shop...
              </p>
            </div>
          ) : (
            <>
              {/* Overall Shop Inventory Summary Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                {/* 1. Total Shop Stock Cost Value */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                    color: "#fff",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>
                    🏬 Total Shop Stock Value (Cost)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
                    {fmtLakh(summary.grandTotalStockCostValue)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                    Total capital locked in shop stock
                  </div>
                </div>

                {/* 2. Total Shop Stock Retail Value */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#fff",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
                  }}
                >
                  <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 600 }}>
                    🏷️ Total Shop Stock Value (Selling)
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>
                    {fmtLakh(summary.grandTotalStockRetailValue)}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                    Potential Profit: {fmt(summary.grandTotalPotentialProfit)}
                  </div>
                </div>

                {/* 3. Total In-Stock Quantity */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 20,
                    borderLeft: "5px solid #0284c7",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    📦 Total In-Stock Quantity
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0284c7", marginTop: 8 }}>
                    {(summary.grandTotalStockQty || 0).toLocaleString()} <span style={{ fontSize: 14 }}>Pcs</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Across all shop product items
                  </div>
                </div>

                {/* 4. Active Vendors Count */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 20,
                    borderLeft: "5px solid #d97706",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                    🏪 Vendors Holding Stock
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#d97706", marginTop: 8 }}>
                    {summary.vendorsWithStockCount || 0}{" "}
                    <span style={{ fontSize: 14, color: "#64748b", fontWeight: 400 }}>
                      / {summary.totalVendorsCount || 0} Vendors
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Vendors with active inventory in store
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginBottom: 20,
                  flexWrap: "wrap",
                  alignItems: "center",
                  background: "#fff",
                  padding: "14px 18px",
                  borderRadius: 14,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search vendor by name, firm, phone, or product title/SKU..."
                    style={{
                      width: "100%",
                      padding: "9px 14px 9px 36px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      fontSize: 15,
                    }}
                  >
                    🔍
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: "9px 14px",
                      borderRadius: 10,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      outline: "none",
                      background: "#fff",
                    }}
                  >
                    <option value="COST_DESC">Stock Value (Highest First)</option>
                    <option value="QTY_DESC">Stock Qty (Highest First)</option>
                    <option value="RETAIL_DESC">Selling Value (Highest First)</option>
                    <option value="NAME_ASC">Vendor Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* All Vendor-Wise Stock Breakdown Table */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                    Vendor Wise Stock Analysis Breakdown ({filteredVendors.length} Vendors)
                  </h4>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                    Click "Check Deeply" to view item-by-item stock details for any vendor.
                  </span>
                </div>

                {filteredVendors.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
                    <div style={{ fontSize: 44, marginBottom: 8 }}>📦</div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                      No vendors matching search criteria.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            Vendor / Vepari
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            Items Count
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            Stock Qty (Pcs)
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>
                            Stock Cost Amount (In Store)
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "right", fontSize: 12, color: "#059669", fontWeight: 700 }}>
                            Selling Value
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#64748b", fontWeight: 700, width: 140 }}>
                            Store Stock Share
                          </th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                            Action / Deep Check
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVendors.map((item, idx) => {
                          const v = item.vendor || {};
                          const isUnassigned = v._id === null;

                          return (
                            <tr
                              key={v._id || `unassigned-${idx}`}
                              style={{
                                borderBottom: "1px solid #f1f5f9",
                                background: idx % 2 === 0 ? "#fff" : "#fafafa",
                                transition: "background 0.2s ease",
                              }}
                            >
                              {/* Vendor info */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div
                                    style={{
                                      width: 38,
                                      height: 38,
                                      borderRadius: 10,
                                      background: isUnassigned ? "#f1f5f9" : "#e0e7ff",
                                      color: isUnassigned ? "#64748b" : "#4f46e5",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: 800,
                                      fontSize: 16,
                                    }}
                                  >
                                    {isUnassigned ? "🏬" : (v.name || "V")[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                                      {v.name}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>
                                      {v.firmName ? `${v.firmName}` : ""}
                                      {v.phone ? ` · 📞 ${v.phone}` : ""}
                                      {v.city ? ` · 📍 ${v.city}` : ""}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Items Count */}
                              <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600, fontSize: 14, color: "#334155" }}>
                                {item.totalProducts} Items
                              </td>

                              {/* Total Stock Qty */}
                              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: item.totalStockQty > 0 ? "#0284c7" : "#94a3b8",
                                    background: item.totalStockQty > 0 ? "#e0f2fe" : "#f1f5f9",
                                    padding: "4px 12px",
                                    borderRadius: 12,
                                  }}
                                >
                                  {item.totalStockQty.toLocaleString()} Pcs
                                </span>
                              </td>

                              {/* Total Stock Cost Value (e.g. ₹10,00,000 / 10 Lakhs) */}
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{ fontWeight: 800, fontSize: 16, color: "#4f46e5" }}>
                                  {fmt(item.totalStockCostValue)}
                                </div>
                                {item.totalStockCostValue >= 100000 && (
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4338ca" }}>
                                    {(item.totalStockCostValue / 100000).toFixed(2)} Lakh Stock
                                  </div>
                                )}
                              </td>

                              {/* Total Selling Value */}
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#059669" }}>
                                  {fmt(item.totalStockRetailValue)}
                                </div>
                                <div style={{ fontSize: 11, color: "#166534" }}>
                                  Profit: +{fmt(item.potentialProfit)}
                                </div>
                              </td>

                              {/* Store Stock Share */}
                              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                                  {item.stockSharePercent}%
                                </div>
                                <div
                                  style={{
                                    width: "100%",
                                    height: 6,
                                    background: "#e2e8f0",
                                    borderRadius: 6,
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${Math.min(100, item.stockSharePercent)}%`,
                                      height: "100%",
                                      background: "#4f46e5",
                                      borderRadius: 6,
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Action Button: Check Deeply */}
                              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                <button
                                  onClick={() => {
                                    setDeepVendor(item);
                                    setDeepSearch("");
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  🔍 Check Deeply
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🔍 DEEP CHECK SUB-MODAL FOR A SPECIFIC VENDOR */}
      {deepVendor && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              width: "100%",
              maxWidth: 1040,
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
                color: "#fff",
                padding: "20px 24px",
                display: "flex",
                justify: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, textTransform: "uppercase", tracking: "1px", opacity: 0.85, fontWeight: 700 }}>
                  🔍 Deep Item Analysis
                </div>
                <h3 style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 800 }}>
                  {deepVendor.vendor.name}
                  {deepVendor.vendor.firmName ? ` (${deepVendor.vendor.firmName})` : ""}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.9 }}>
                  Total In-Stock Items: <strong>{deepVendor.totalProducts}</strong> · Total Stock Qty:{" "}
                  <strong>{deepVendor.totalStockQty} Pcs</strong> · Total Stock Cost Value:{" "}
                  <strong style={{ fontSize: 15, color: "#fef08a" }}>
                    {fmtLakh(deepVendor.totalStockCostValue)}
                  </strong>
                </p>
              </div>

              <button
                onClick={() => setDeepVendor(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  width: 38,
                  height: 38,
                  cursor: "pointer",
                  fontSize: 20,
                }}
              >
                ✕
              </button>
            </div>

            {/* Sub-Header & Search */}
            <div
              style={{
                padding: "14px 24px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justify: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                placeholder="Search products of this vendor by name, SKU, or barcode..."
                value={deepSearch}
                onChange={(e) => setDeepSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 260,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                  outline: "none",
                }}
              />

              <div style={{ display: "flex", gap: 12, fontSize: 13 }}>
                <span style={{ background: "#e0e7ff", color: "#4338ca", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>
                  Total Cost: {fmt(deepVendor.totalStockCostValue)}
                </span>
                <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>
                  Selling Value: {fmt(deepVendor.totalStockRetailValue)}
                </span>
              </div>
            </div>

            {/* Product Table */}
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              {deepItemsFiltered.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  No items found matching search filter.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", textAlign: "left", fontSize: 12, color: "#64748b" }}>
                      <th style={{ padding: "10px 12px" }}>Product</th>
                      <th style={{ padding: "10px 12px" }}>Category / SKU</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>In-Stock Qty</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Cost Price</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Selling Price</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Cost Value</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Selling Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deepItemsFiltered.map((it, idx) => (
                      <tr key={it._id || idx} style={{ borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {it.image ? (
                              <img
                                src={it.image}
                                alt={it.title}
                                style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  background: "#f1f5f9",
                                  borderRadius: 6,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 18,
                                }}
                              >
                                📦
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: "#1e293b" }}>{it.title}</div>
                              {it.barcode && (
                                <div style={{ fontSize: 11, color: "#64748b" }}>
                                  Barcode: {it.barcode}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600, color: "#334155" }}>{it.category}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>SKU: {it.sku}</div>
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: it.stockQty > 0 ? "#0284c7" : "#ef4444",
                              background: it.stockQty > 0 ? "#e0f2fe" : "#fef2f2",
                              padding: "2px 8px",
                              borderRadius: 10,
                            }}
                          >
                            {it.stockQty} Pcs
                          </span>
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>
                          {fmt(it.costPrice)}
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#059669" }}>
                          {fmt(it.sellingPrice)}
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#4f46e5" }}>
                          {fmt(it.stockCostValue)}
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#059669" }}>
                          {fmt(it.stockRetailValue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeepVendor(null)}
                style={{
                  padding: "8px 20px",
                  background: "#475569",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Close Deep Check
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
