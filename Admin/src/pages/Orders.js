import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Select, Tag, message, Space, Tooltip, Input, DatePicker, Badge, Avatar, Modal } from "antd";
import {
  FilterOutlined, EyeOutlined, PrinterOutlined, RocketOutlined,
  SearchOutlined, ShoppingOutlined, CarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, SyncOutlined, ThunderboltOutlined,
  UserOutlined, ReloadOutlined, TrophyOutlined, FireOutlined, StopOutlined
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getOrders, updateAOrder, adminCancelAOrder } from "../features/auth/authSlice";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import axios from "axios";

const { RangePicker } = DatePicker;
const { Option } = Select;

const STATUS_CONFIG = {
  All:              { icon: <ShoppingOutlined />, color: "#64748b", bg: "#f1f5f9", border: "#cbd5e1", gradient: "linear-gradient(135deg,#64748b,#94a3b8)" },
  Ordered:          { icon: <ClockCircleOutlined />, color: "#d97706", bg: "#fffbeb", border: "#fbbf24", gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)" },
  Processed:        { icon: <SyncOutlined />, color: "#2563eb", bg: "#eff6ff", border: "#60a5fa", gradient: "linear-gradient(135deg,#3b82f6,#60a5fa)" },
  Packed:           { icon: <ShoppingOutlined />, color: "#7c3aed", bg: "#f5f3ff", border: "#a78bfa", gradient: "linear-gradient(135deg,#8b5cf6,#a78bfa)" },
  Shipped:          { icon: <CarOutlined />, color: "#0891b2", bg: "#ecfeff", border: "#22d3ee", gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)" },
  "Out for Delivery":{ icon: <RocketOutlined />, color: "#db2777", bg: "#fdf2f8", border: "#f472b6", gradient: "linear-gradient(135deg,#ec4899,#f472b6)" },
  Delivered:        { icon: <CheckCircleOutlined />, color: "#059669", bg: "#ecfdf5", border: "#34d399", gradient: "linear-gradient(135deg,#10b981,#34d399)" },
  Cancelled:        { icon: <CloseCircleOutlined />, color: "#dc2626", bg: "#fef2f2", border: "#f87171", gradient: "linear-gradient(135deg,#ef4444,#f87171)" },
};

const LOCKED_STATUSES = ["Shipped", "Out for Delivery", "Delivered"];

const Orders = () => {
  const dispatch = useDispatch();
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const [activeStatus, setActiveStatus] = useState("All");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, reason: "" });

  useEffect(() => { dispatch(getOrders()); }, [dispatch]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === "Cancelled") {
      setCancelModal({ open: true, orderId, reason: "" });
      return;
    }
    try {
      await dispatch(updateAOrder({ id: orderId, status: newStatus })).unwrap();
      message.success(`Status updated to ${newStatus}`);
      dispatch(getOrders());
    } catch { message.error("Failed to update status"); }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.reason.trim()) { message.warning("Cancel reason is required"); return; }
    try {
      await dispatch(adminCancelAOrder({ id: cancelModal.orderId, cancelReason: cancelModal.reason.trim() })).unwrap();
      message.success("Order cancelled successfully");
      dispatch(getOrders());
    } catch { message.error("Failed to cancel order"); }
    setCancelModal({ open: false, orderId: null, reason: "" });
  };

  const handleBulkShipment = async () => {
    if (!selectedRowKeys.length) { message.warning("Select orders first"); return; }
    setBulkLoading(true);
    try {
      const res = await axios.put(`${base_url}orders/bulk-create-shipment`, { orderIds: selectedRowKeys }, config);
      const ok = res.data.results.filter(r => r.success).length;
      message.success(`${ok} shipment(s) created`);
      setSelectedRowKeys([]);
      dispatch(getOrders());
    } catch { message.error("Bulk shipment failed"); }
    finally { setBulkLoading(false); }
  };

  const printOrderBill = async (orderId) => {
    try {
      const res = await axios.get(`${base_url}user/getaOrder/${orderId}`, config);
      const order = res.data.orders;
      const invoiceNum = order._id.slice(-8).toUpperCase();
      const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const customerName = order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer";
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${invoiceNum}</title>
        <script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-gray-50 p-6">
        <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
          <h1 class="text-3xl font-black tracking-tight">INVOICE</h1>
          <p class="text-indigo-200 mt-1">#${invoiceNum} &bull; ${dateStr}</p>
        </div>
        <div class="p-8">
          <p class="text-gray-600 mb-6"><span class="font-semibold text-gray-900">Bill To:</span> ${customerName}</p>
          <table class="w-full text-sm border-collapse">
            <thead><tr class="bg-indigo-50 text-indigo-700"><th class="p-3 text-left rounded-l-lg">#</th><th class="p-3 text-left">Item</th><th class="p-3 text-left">HSN</th><th class="p-3 text-center">Qty</th><th class="p-3 text-right">Rate</th><th class="p-3 text-right rounded-r-lg">Amount</th></tr></thead>
            <tbody>${order.orderItems.map((item, i) => `<tr class="border-b border-gray-100"><td class="p-3 text-gray-500">${i+1}</td><td class="p-3 font-medium">${item.product?.title || "Product"}</td><td class="p-3 text-left">${item.hsnCode || item.product?.hsnCode || "-"}</td><td class="p-3 text-center">${item.quantity}</td><td class="p-3 text-right">₹${item.price.toFixed(2)}</td><td class="p-3 text-right font-semibold">₹${(item.quantity*item.price).toFixed(2)}</td></tr>`).join("")}</tbody>
          </table>
          <div class="mt-6 text-right border-t pt-4">
            ${order.discountAmount > 0 ? `<p class="text-green-600 mb-1">Discount: -₹${order.discountAmount.toFixed(2)}</p>` : ""}
            <p class="text-2xl font-black text-indigo-600">Total: ₹${order.totalPriceAfterDiscount.toFixed(2)}</p>
          </div>
        </div></div></body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 500);
    } catch { message.error("Failed to print"); }
  };

  const processedData = useMemo(() => {
    if (!orderState) return [];
    return orderState.map((order, index) => ({
      key: order._id,
      sno: index + 1,
      orderId: order._id,
      name: order?.user?.firstname || "N/A",
      email: order?.user?.email || "N/A",
      mobile: order?.user?.mobile || "N/A",
      items: order?.orderItems?.length || 0,
      amount: order?.totalPrice,
      finalAmount: order?.totalPriceAfterDiscount,
      status: order?.orderStatus || "Ordered",
      payment: order?.paymentInfo?.razorpayPaymentId ? "Paid" : (order?.mode === "OFFLINE" ? (order?.paymentDestination === "CASH" ? "Cash" : order?.paymentDestination === "OTHER_ACCOUNT" ? "Online-Other" : "Online-Current") : "Pending"),
      date: dayjs(order?.createdAt).format("DD MMM YYYY"),
      rawDate: order?.createdAt,
      courierName: order?.courierName || "—",
      trackingId: order?.trackingId || "—",
      trackingUrl: order?.trackingUrl || null,
      isLocked: LOCKED_STATUSES.includes(order?.orderStatus),
      rawOrder: order,
    }));
  }, [orderState]);

  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      if (activeStatus !== "All" && item.status !== activeStatus) return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        if (!item.orderId.toLowerCase().includes(s) && !item.name.toLowerCase().includes(s) && !item.email.toLowerCase().includes(s) && !item.mobile.includes(s)) return false;
      }
      if (dateRange) {
        const [start, end] = dateRange;
        const d = dayjs(item.rawDate);
        if (!d.isAfter(start.startOf("day")) || !d.isBefore(end.endOf("day"))) return false;
      }
      if (paymentFilter !== "All" && item.payment !== paymentFilter) return false;
      return true;
    });
  }, [processedData, activeStatus, searchText, dateRange, paymentFilter]);

  const statusCounts = useMemo(() => {
    const counts = {};
    Object.keys(STATUS_CONFIG).forEach(k => counts[k] = 0);
    processedData.forEach(item => { if (counts[item.status] !== undefined) counts[item.status]++; });
    counts.All = processedData.length;
    return counts;
  }, [processedData]);

  const totalRevenue = processedData.reduce((s, o) => s + (o.finalAmount || 0), 0);
  const deliveredCount = statusCounts["Delivered"] || 0;
  const pendingCount = (statusCounts["Ordered"] || 0) + (statusCounts["Processed"] || 0) + (statusCounts["Packed"] || 0);

  const columns = [
    {
      title: "#",
      dataIndex: "sno",
      width: 56,
      align: "center",
      render: (v) => (
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, margin: "0 auto" }}>{v}</div>
      ),
    },
    {
      title: "Order",
      key: "order",
      width: 260,
      render: (_, r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar size={44} style={{ background: "linear-gradient(135deg,#f093fb,#f5576c)", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {r.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>#{r.orderId.slice(-8).toUpperCase()}</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}><UserOutlined style={{ marginRight: 4 }} />{r.name} &bull; {r.items} item{r.items !== 1 ? "s" : ""}</div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>📅 {r.date}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "finalAmount",
      width: 130,
      align: "right",
      render: (amt, r) => (
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#059669" }}>₹{amt?.toFixed(2)}</div>
          {r.amount !== amt && <div style={{ fontSize: 11, color: "#f87171", textDecoration: "line-through" }}>₹{r.amount?.toFixed(2)}</div>}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 200,
      align: "center",
      render: (status, r) => {
        const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.All;
        if (r.isLocked || status === "Cancelled") {
          return (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, borderRadius: 20, padding: "5px 12px", fontWeight: 700, fontSize: 11 }}>
              {cfg.icon} {status}
              {r.isLocked && <Tooltip title="Managed by Shiprocket"><RocketOutlined style={{ fontSize: 10, opacity: 0.7 }} /></Tooltip>}
            </div>
          );
        }
        return (
          <Select
            value={status}
            onChange={(v) => updateOrderStatus(r.orderId, v)}
            style={{ width: 170 }}
            size="small"
            dropdownStyle={{ minWidth: 180 }}
          >
            {["Ordered","Processed","Packed"].map(s => (
              <Option key={s} value={s}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: STATUS_CONFIG[s]?.color }}>
                  {STATUS_CONFIG[s]?.icon} {s}
                </span>
              </Option>
            ))}
            <Option value="Shipped" disabled><span style={{ color: "#94a3b8" }}>🚀 Shipped (auto)</span></Option>
            <Option value="Out for Delivery" disabled><span style={{ color: "#94a3b8" }}>📦 Out for Delivery (auto)</span></Option>
            <Option value="Delivered" disabled><span style={{ color: "#94a3b8" }}>✅ Delivered (auto)</span></Option>
            <Option value="Cancelled">
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#dc2626" }}>
                <CloseCircleOutlined /> Cancelled
              </span>
            </Option>
          </Select>
        );
      },
    },
    {
      title: "Payment",
      dataIndex: "payment",
      width: 110,
      align: "center",
      render: (p) => (
        <Tag color={p === "Paid" ? "success" : p === "Cash" ? "warning" : p.startsWith("Online") ? "processing" : "error"} style={{ borderRadius: 12, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>{p}</Tag>
      ),
    },
    {
      title: "Tracking",
      key: "tracking",
      width: 170,
      render: (_, r) => (
        <div>
          {r.courierName !== "—" && <div style={{ fontWeight: 600, fontSize: 12, color: "#0f172a", marginBottom: 4 }}>🚚 {r.courierName}</div>}
          {r.trackingId !== "—" ? (
            r.trackingUrl
              ? <a href={r.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontFamily: "monospace", color: "#6366f1", fontWeight: 600 }}>🔗 {r.trackingId}</a>
              : <span style={{ fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>{r.trackingId}</span>
          ) : <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Not shipped</span>}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      align: "center",
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="View Details">
            <Link to={`/admin/order/${r.orderId}`}>
              <Button size="small" icon={<EyeOutlined />} style={{ borderRadius: 8, border: "2px solid #6366f1", color: "#6366f1", fontWeight: 600 }} />
            </Link>
          </Tooltip>
          <Tooltip title="Print Bill">
            <Button size="small" icon={<PrinterOutlined />} onClick={() => printOrderBill(r.orderId)} style={{ borderRadius: 8, border: "2px solid #10b981", color: "#10b981", fontWeight: 600 }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: "#f4f6f8", minHeight: "100vh", padding: 28 }}>

      {/* ── Header ── */}
      <div style={{ background: "#ffffff", borderRadius: 24, padding: "32px 36px", marginBottom: 28, boxShadow: "0 10px 30px rgba(15,23,42,0.08)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}>
              <ShoppingOutlined style={{ fontSize: 30, color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>Orders Management</div>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>Track and manage all customer orders with clear status and fast actions</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Total Orders", value: processedData.length, icon: <ShoppingOutlined />, grad: "linear-gradient(135deg,#6366f1,#8b5cf6)", glow: "rgba(99,102,241,0.4)" },
              { label: "Delivered", value: deliveredCount, icon: <CheckCircleOutlined />, grad: "linear-gradient(135deg,#10b981,#34d399)", glow: "rgba(16,185,129,0.4)" },
              { label: "Pending", value: pendingCount, icon: <ClockCircleOutlined />, grad: "linear-gradient(135deg,#f59e0b,#fbbf24)", glow: "rgba(245,158,11,0.4)" },
              { label: "Revenue", value: `₹${(totalRevenue/1000).toFixed(1)}K`, icon: <TrophyOutlined />, grad: "linear-gradient(135deg,#ec4899,#f472b6)", glow: "rgba(236,72,153,0.4)" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#f8fafc", borderRadius: 16, padding: "18px 20px", minWidth: 140, textAlign: "center", boxShadow: "0 8px 20px rgba(15,23,42,0.08)" }}>
                <div style={{ color: "#4f46e5", fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ color: "#111827", fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{ background: "#ffffff", borderRadius: 20, padding: "20px 24px", marginBottom: 20, boxShadow: "0 12px 28px rgba(15,23,42,0.06)", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 50, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, transition: "all 0.2s",
                  background: isActive ? cfg.gradient : "#f8fafc",
                  color: isActive ? "#fff" : cfg.color,
                  boxShadow: isActive ? `0 4px 16px ${cfg.border}80` : "0 1px 4px rgba(0,0,0,0.06)",
                  transform: isActive ? "translateY(-1px)" : "none",
                }}
              >
                {cfg.icon}
                {status}
                <span style={{ background: isActive ? "rgba(255,255,255,0.25)" : cfg.bg, color: isActive ? "#fff" : cfg.color, borderRadius: 10, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "#ffffff", borderRadius: 20, padding: "20px 24px", marginBottom: 20, boxShadow: "0 12px 28px rgba(15,23,42,0.06)", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Input
            placeholder="Search order ID, name, email, mobile…"
            prefix={<SearchOutlined style={{ color: "#6366f1" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300, borderRadius: 12, border: "1.5px solid #e2e8f0" }}
          />
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ borderRadius: 12, border: "1.5px solid #e2e8f0" }}
          />
          <Select value={paymentFilter} onChange={setPaymentFilter} style={{ width: 150, borderRadius: 12 }}>
            <Option value="All">All Payments</Option>
            <Option value="Paid">Paid (Online)</Option>
            <Option value="Cash">Cash</Option>
            <Option value="Online-Current">Online-Current</Option>
            <Option value="Online-Other">Online-Other</Option>
            <Option value="Pending">Pending</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => { setActiveStatus("All"); setSearchText(""); setDateRange(null); setPaymentFilter("All"); }} style={{ borderRadius: 12, border: "1.5px solid #e2e8f0", fontWeight: 600 }}>
            Reset
          </Button>
          {selectedRowKeys.length > 0 && activeStatus === "Packed" && (
            <Button type="primary" icon={<ThunderboltOutlined />} loading={bulkLoading} onClick={handleBulkShipment}
              style={{ borderRadius: 12, background: "linear-gradient(135deg,#10b981,#34d399)", border: "none", fontWeight: 700, boxShadow: "0 4px 16px rgba(16,185,129,0.4)" }}>
              Create Shipment ({selectedRowKeys.length})
            </Button>
          )}
          <div style={{ marginLeft: "auto", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", borderRadius: 12, padding: "8px 18px", fontWeight: 700, fontSize: 13 }}>
            <FireOutlined style={{ marginRight: 6 }} />
            {filteredData.length} / {processedData.length} Orders
          </div>
        </div>
      </div>

      {/* ── Cancel Modal ── */}
      <Modal
        title={<span style={{ display: "flex", alignItems: "center", gap: 8 }}><StopOutlined style={{ color: "#dc2626" }} /> Cancel Order</span>}
        open={cancelModal.open}
        onCancel={() => setCancelModal({ open: false, orderId: null, reason: "" })}
        onOk={handleConfirmCancel}
        okText="Confirm Cancel"
        okButtonProps={{ danger: true, disabled: !cancelModal.reason.trim() }}
        cancelText="Keep Order"
      >
        <p style={{ color: "#374151", marginBottom: 12 }}>This will cancel the order, restore stock, and refund the amount as coins to the customer.</p>
        <Input.TextArea
          rows={3}
          placeholder="Enter cancel reason (required)"
          value={cancelModal.reason}
          onChange={e => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
          style={{ borderRadius: 8 }}
        />
        {!cancelModal.reason.trim() && (
          <div style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>Cancel reason is required</div>
        )}
      </Modal>

      {/* ── Table ── */}
      <div style={{ background: "#ffffff", borderRadius: 20, boxShadow: "0 12px 28px rgba(15,23,42,0.08)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: (r) => ({ disabled: r.isLocked || r.rawOrder?.shipmentId }) }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} orders` }}
          scroll={{ x: 1200 }}
          size="middle"
          rowClassName={() => "order-row"}
          style={{ borderRadius: 20 }}
        />
      </div>

      <style>{`
        .order-row:hover td { background: #f8f7ff !important; }
        .ant-table-thead > tr > th { background: linear-gradient(135deg,#0f172a,#1e293b) !important; color: #e2e8f0 !important; font-weight: 700 !important; font-size: 12px !important; letter-spacing: 0.5px !important; border-bottom: none !important; }
        .ant-table-thead > tr > th:first-child { border-radius: 0 !important; }
        .ant-table-tbody > tr > td { border-bottom: 1px solid #f1f5f9 !important; padding: 14px 16px !important; }
        .ant-pagination { padding: 16px 24px !important; }
      `}</style>
    </div>
  );
};

export default Orders;
