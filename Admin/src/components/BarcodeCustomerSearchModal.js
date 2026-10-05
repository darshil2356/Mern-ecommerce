import React, { useState, useEffect, useRef } from "react";
import { Modal, Input, Button, Tag, Avatar, Spin, Alert, Tooltip, Space, Badge } from "antd";
import {
  SearchOutlined,
  UserOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  ShopOutlined,
  ReloadOutlined,
  BarcodeOutlined,
  ThunderboltOutlined,
  TagOutlined,
  BoxPlotOutlined
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const BarcodeCustomerSearchModal = ({ open, onClose, initialBarcode = "" }) => {
  const [searchInput, setSearchInput] = useState(initialBarcode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSearchInput(initialBarcode || "");
      setResult(null);
      setError(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);

      if (initialBarcode && initialBarcode.trim()) {
        handleSearch(initialBarcode.trim());
      }
    }
  }, [open, initialBarcode]);

  const handleSearch = async (termToSearch) => {
    const query = (termToSearch || searchInput).trim();
    if (!query) {
      setError("Please scan or enter a product barcode, title, or ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await axios.get(
        `${base_url}user/get-customers-by-product-barcode?barcode=${encodeURIComponent(query)}`,
        config
      );
      if (res.data && res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data?.message || "No matching product or customer sales found.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to search product sales by barcode."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setResult(null);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={850}
      style={{ top: 20 }}
      styles={{ body: { padding: "20px 24px", borderRadius: 16 } }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}
          >
            <BarcodeOutlined />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
              Scan Barcode / Search Product Sales
            </div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
              Find which customer purchased a specific barcode or product item
            </div>
          </div>
        </div>
      }
    >
      {/* Search Bar Input */}
      <div
        style={{
          background: "#f8fafc",
          border: "1.5px solid #e2e8f0",
          borderRadius: 14,
          padding: 14,
          marginBottom: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Input
            ref={inputRef}
            size="large"
            placeholder="Scan barcode (e.g. PRD-595BC521) or type product title/ID…"
            prefix={<BarcodeOutlined style={{ color: "#6366f1", fontSize: 18 }} />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            allowClear
            style={{ borderRadius: 10, fontSize: 15, fontWeight: 600 }}
          />
          <Button
            type="primary"
            size="large"
            icon={<SearchOutlined />}
            loading={loading}
            onClick={() => handleSearch()}
            style={{
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              border: "none",
              fontWeight: 700,
              padding: "0 24px",
              boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
            }}
          >
            Search
          </Button>
          {searchInput && (
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={clearSearch}
              style={{ borderRadius: 10 }}
            >
              Clear
            </Button>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>💡 Press <b>Enter</b> or use handheld USB/Bluetooth barcode scanner</span>
          <span>• Example search: <code>PRD-595BC521</code></span>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" tip="Searching product stock & customer order records..." />
        </div>
      )}

      {error && !loading && (
        <Alert
          message="Search Result"
          description={error}
          type="warning"
          showIcon
          style={{ borderRadius: 12, marginBottom: 16 }}
        />
      )}

      {result && !loading && (
        <div>
          {/* Product Summary Header Card */}
          {result.product ? (
            <div
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                borderRadius: 16,
                padding: 16,
                color: "#fff",
                marginBottom: 16,
                boxShadow: "0 6px 20px rgba(49,46,129,0.25)",
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 12,
                  background: "#fff",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {result.product.image ? (
                  <img
                    src={result.product.image}
                    alt={result.product.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <ShoppingOutlined style={{ fontSize: 32, color: "#6366f1" }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      background: "rgba(255,255,255,0.18)",
                      color: "#fbbf24",
                      padding: "2px 10px",
                      borderRadius: 20,
                      fontWeight: 800,
                      fontSize: 12,
                      fontFamily: "monospace",
                      letterSpacing: "0.5px",
                    }}
                  >
                    🏷️ {result.product.barcode || result.searchQuery}
                  </span>
                  {result.product.category && (
                    <Tag color="purple" style={{ borderRadius: 10, margin: 0, fontWeight: 600 }}>
                      {result.product.category}
                    </Tag>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    marginTop: 6,
                    color: "#fff",
                    lineHeight: 1.3,
                  }}
                >
                  {result.product.title}
                </div>

                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                  Price: <b style={{ color: "#34d399", fontSize: 15 }}>₹{result.product.price}</b>
                </div>
              </div>

              {/* Stock Breakdown Badges */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    background: result.product.currentStock > 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                    border: result.product.currentStock > 0 ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(248,113,113,0.4)",
                    borderRadius: 12,
                    padding: "8px 14px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: result.product.currentStock > 0 ? "#34d399" : "#f87171" }}>
                    {result.product.currentStock} units
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                    In Inventory Stock
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(99,102,241,0.25)",
                    border: "1px solid rgba(129,140,248,0.4)",
                    borderRadius: 12,
                    padding: "8px 14px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#818cf8" }}>
                    {result.totalQuantitySold} units
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                    Sold Across Orders
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 16, fontSize: 14, fontWeight: 700, color: "#334155" }}>
              Search results for: <code>{result.searchQuery}</code>
            </div>
          )}

          {/* Sales History Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              👥 Customer Purchase Records ({result.totalSalesCount} Order{result.totalSalesCount !== 1 ? "s" : ""})
            </div>
            {result.totalSalesCount > 0 && (
              <Tag color="success" style={{ borderRadius: 12, fontWeight: 700, padding: "3px 10px" }}>
                ✓ Sold to {result.totalSalesCount} customer(s)
              </Tag>
            )}
          </div>

          {/* If 0 Sales: Show Unsold Notice */}
          {result.totalSalesCount === 0 ? (
            <Alert
              message={<span style={{ fontWeight: 800, fontSize: 15 }}>📦 Product Not Sold Yet (In Stock / Unsold)</span>}
              description={
                <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
                  No customer has purchased this barcode / item (<code>{result.searchQuery}</code>) yet!
                  <br />
                  This piece is currently <b>unsold</b> in your inventory stock (<b>{result.product?.currentStock || 0} unit(s) available</b>).
                </div>
              }
              type="info"
              showIcon
              style={{
                borderRadius: 14,
                padding: 16,
                background: "#f0f9ff",
                border: "1.5px solid #bae6fd",
              }}
            />
          ) : (
            /* Customers List */
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
              {result.sales.map((sale, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#fff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 14,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <Avatar
                        size={44}
                        style={{
                          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                          fontWeight: 800,
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {sale.customerName ? sale.customerName.charAt(0).toUpperCase() : "C"}
                      </Avatar>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "#0f172a" }}>
                          {sale.customerName}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", gap: 12, flexWrap: "wrap" }}>
                          {sale.phone && sale.phone !== "N/A" && (
                            <span>
                              <PhoneOutlined style={{ marginRight: 4, color: "#10b981" }} />
                              <a href={`tel:${sale.phone}`} style={{ color: "#0f172a", fontWeight: 600 }}>
                                {sale.phone}
                              </a>
                            </span>
                          )}
                          {sale.email && sale.email !== "N/A" && (
                            <span>
                              <MailOutlined style={{ marginRight: 4, color: "#6366f1" }} />
                              {sale.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Tag
                        color={sale.mode === "OFFLINE" ? "orange" : "blue"}
                        style={{ borderRadius: 10, fontWeight: 700, padding: "2px 8px" }}
                      >
                        {sale.mode === "OFFLINE" ? <ShopOutlined /> : <GlobalOutlined />} {sale.mode === "OFFLINE" ? "POS / Store" : "Online Web"}
                      </Tag>
                      <Tag
                        color={sale.orderStatus === "Delivered" ? "success" : sale.orderStatus === "Cancelled" ? "error" : "processing"}
                        style={{ borderRadius: 10, fontWeight: 700, padding: "2px 8px" }}
                      >
                        {sale.orderStatus}
                      </Tag>
                    </div>
                  </div>

                  {/* Order & Item Detail Box */}
                  <div
                    style={{
                      marginTop: 12,
                      padding: 10,
                      background: "#f8fafc",
                      borderRadius: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                        Order <span style={{ color: "#6366f1" }}>#{sale.displayOrderId}</span> &bull; 📅 {new Date(sale.orderDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        Size: <b>{sale.size}</b> | Color: <b>{sale.color}</b> | Qty: <b style={{ color: "#059669" }}>{sale.quantity} pc</b>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#059669" }}>
                          ₹{sale.totalItemAmount}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          (₹{sale.price} x {sale.quantity})
                        </div>
                      </div>

                      <Link to={`/admin/order/${sale.orderId}`} target="_blank">
                        <Button
                          size="small"
                          type="primary"
                          icon={<EyeOutlined />}
                          style={{
                            borderRadius: 8,
                            background: "#6366f1",
                            border: "none",
                            fontWeight: 600,
                          }}
                        >
                          View Order
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BarcodeCustomerSearchModal;
