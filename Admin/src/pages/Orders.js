import React, { useEffect, useState, useMemo, useRef } from "react";
import { Table, Button, Select, Tag, message, Space, Tooltip, Input, DatePicker, Badge, Avatar, Modal, Dropdown } from "antd";
import {
  FilterOutlined, EyeOutlined, PrinterOutlined, RocketOutlined,
  SearchOutlined, ShoppingOutlined, CarOutlined, CheckCircleOutlined,
  ClockCircleOutlined, CloseCircleOutlined, SyncOutlined, ThunderboltOutlined,
  UserOutlined, ReloadOutlined, TrophyOutlined, FireOutlined, StopOutlined,
  DownOutlined, EditOutlined
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
  Processing:        { icon: <SyncOutlined />, color: "#2563eb", bg: "#eff6ff", border: "#60a5fa", gradient: "linear-gradient(135deg,#3b82f6,#60a5fa)" },
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
  const [modeFilter, setModeFilter] = useState("all"); // 'all' | 'online' | 'offline'
  // default: only Online-Current (GST) orders. Triple-click title to toggle all orders
  const [showAll, setShowAll] = useState(false);
  const titleClickRef = useRef(0);
  const titleTimerRef = useRef(null);
  const handleTitleClick = () => {
    titleClickRef.current += 1;
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => { titleClickRef.current = 0; }, 600);
    if (titleClickRef.current >= 3) {
      titleClickRef.current = 0;
      setShowAll(prev => !prev);
    }
  };

  useEffect(() => { dispatch(getOrders(showAll ? 'all' : 'online_current')); }, [dispatch, showAll]);

  const updateOrderStatus = async (orderId, newStatus) => {
    if (newStatus === "Cancelled") {
      setCancelModal({ open: true, orderId, reason: "" });
      return;
    }
    try {
      await dispatch(updateAOrder({ id: orderId, status: newStatus })).unwrap();
      message.success(`Status updated to ${newStatus}`);
      dispatch(getOrders(showAll ? 'all' : 'online_current'));
    } catch { message.error("Failed to update status"); }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.reason.trim()) { message.warning("Cancel reason is required"); return; }
    try {
      await dispatch(adminCancelAOrder({ id: cancelModal.orderId, cancelReason: cancelModal.reason.trim() })).unwrap();
      message.success("Order cancelled successfully");
      dispatch(getOrders(showAll ? 'all' : 'online_current'));
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
      dispatch(getOrders(showAll ? 'all' : 'online_current'));
    } catch { message.error("Bulk shipment failed"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!selectedRowKeys.length) { message.warning("Select orders first"); return; }
    setBulkLoading(true);
    try {
      const res = await axios.put(`${base_url}orders/bulk-update-status`, { orderIds: selectedRowKeys, status: newStatus }, config);
      const ok = res.data.results.filter(r => r.success).length;
      const failed = res.data.results.filter(r => !r.success).length;
      if (ok > 0) message.success(`${ok} order(s) updated to "${newStatus}"${failed > 0 ? `, ${failed} skipped (locked)` : ""}`);
      else message.warning(`No orders updated — all may be locked`);
      setSelectedRowKeys([]);
      dispatch(getOrders(showAll ? 'all' : 'online_current'));
    } catch { message.error("Bulk status update failed"); }
    finally { setBulkLoading(false); }
  };

  const printOrderBill = async (orderId) => {
    try {
      const [orderRes, pickupRes, settingsRes] = await Promise.all([
        axios.get(`${base_url}user/getaOrder/${orderId}`, config),
        axios.get(`${base_url}shiprocket/pickup-address`, config).catch(() => ({ data: { address: null } })),
        axios.get(`${base_url}user/settings`, config).catch(() => ({ data: {} })),
      ]);
      const order = orderRes.data.orders;
      const pickup = pickupRes.data.address;
      const settings = settingsRes.data;
      const invoiceNum = order._id.slice(-8).toUpperCase();
      const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const customerName = order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Walk-in Customer";
      const storeName = settings.storeName || "Yashoda Fashion";
      const storeAddress = settings.storeAddress || (pickup ? `${pickup.address}, ${pickup.city}, ${pickup.state} - ${pickup.pincode}` : "");
      const storePhone = settings.storePhone || pickup?.phone || "";
      const gstin = settings.gstin || "";

      const gst = order.gstBreakdown || {};
      const cgst = gst.cgst || 0; const sgst = gst.sgst || 0; const igst = gst.igst || 0;
      const cgstRate = gst.cgstRate || 0; const sgstRate = gst.sgstRate || 0; const igstRate = gst.igstRate || 0;
      const gstType = gst.gstType || "NONE";
      const taxIncluded = gst.taxIncluded === true;
      const gstTotal = cgst + sgst + igst;
      const shipping = order.mode === "OFFLINE" ? 0 : (gst.shippingCharge ?? 0);
      const discount = order.discountAmount || 0;
      const subtotal = order.totalPrice || 0;
      const finalTotal = order.totalPriceAfterDiscount || 0;
      const breakdown = order.discountBreakdown || {};

      const shippingAddr = order.shippingInfo
        ? `${order.shippingInfo.address || ""}, ${order.shippingInfo.city || ""}, ${order.shippingInfo.state || ""} - ${order.shippingInfo.pincode || ""}`
        : "N/A";

      const itemRows = order.orderItems.map((item, i) => {
        const title = item.isBundle ? (item.bundleTitle || "Bundle") : (item.product?.title || "Product");
        const hsn = item.hsnCode || item.product?.hsnCode || "-";
        const qty = item.quantity;
        const rate = item.price;
        const amt = qty * rate;
        return `<tr>
          <td style="color:#888">${i+1}</td>
          <td><span style="font-weight:700;color:#131921;font-size:14px">${title}</span>${item.isFreeItem ? '<span style="display:inline-block;font-size:9px;font-weight:800;padding:2px 8px;border-radius:4px;margin-left:6px;background:#e6f4ea;color:#1a7340">FREE</span>' : ""}</td>
          <td style="font-family:monospace;font-size:11px;color:#888">${hsn}</td>
          <td style="text-align:center;font-weight:600">${qty}</td>
          <td style="text-align:right;color:#565959">${item.isFreeItem ? "FREE" : "₹"+rate.toFixed(2)}</td>
          <td style="text-align:right;font-weight:800;color:#131921">${item.isFreeItem ? "FREE" : "₹"+amt.toFixed(2)}</td>
        </tr>`;
      }).join("");

      const gstRows = gstTotal > 0 ? (taxIncluded
        ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#007600"><span>✅ GST (included in price)</span><span>₹${gstTotal.toFixed(2)}</span></div>`
        : (gstType === "CGST_SGST"
          ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#007600"><span>CGST (${cgstRate}%)</span><span>+₹${cgst.toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#007600"><span>SGST (${sgstRate}%)</span><span>+₹${sgst.toFixed(2)}</span></div>`
          : `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#007600"><span>IGST (${igstRate}%)</span><span>+₹${igst.toFixed(2)}</span></div>`)
      ) : "";

      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Order #${invoiceNum}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f2f5;padding:24px 16px}
.wrap{max-width:720px;margin:0 auto}
.brand-bar{background:#fff;border-radius:14px 14px 0 0;padding:18px 28px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #ff9900}
.status-banner{padding:14px 28px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #e7e7e7}
.delivery-card{background:#fff8f0;border-left:4px solid #ff9900;padding:16px 28px;border-bottom:1px solid #e7e7e7}
table{width:100%;border-collapse:collapse;background:#fff}
thead tr{background:#f3f3f3;border-bottom:2px solid #e7e7e7}
thead th{padding:11px 14px;font-size:11px;font-weight:700;color:#131921;letter-spacing:0.5px;text-transform:uppercase}
tbody tr{border-bottom:1px solid #f3f3f3}
tbody td{padding:14px 14px;font-size:13px;color:#333}
.summary-box{background:#fff;padding:16px 28px 24px;border-top:1px solid #e7e7e7}
.info-strip{background:#f3f3f3;padding:14px 28px;display:flex;gap:32px;border-top:1px solid #e7e7e7}
.footer{background:#131921;padding:18px 28px;border-radius:0 0 14px 14px;text-align:center}
.no-print{padding:16px 28px;text-align:center;background:#fff;border-top:1px solid #e7e7e7}
@media print{body{background:#fff;padding:0}.wrap{max-width:100%}.no-print{display:none}.brand-bar,.footer{border-radius:0}}
</style></head><body>
<div class="wrap">
  <div class="brand-bar">
    <div>
      <div style="font-size:22px;font-weight:900;color:#131921">🛍️ ${storeName}</div>
      <div style="font-size:11px;color:#565959;margin-top:2px">Order Invoice</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:13px;font-weight:700;color:#131921;font-family:monospace">Order #${invoiceNum}</div>
      <div style="font-size:12px;color:#565959;margin-top:2px">📅 ${dateStr}</div>
    </div>
  </div>

  <div class="status-banner" style="background:${order.orderStatus==='Delivered'?'#f0fdf4':order.orderStatus==='Cancelled'?'#fef2f2':'#fffbeb'}">
    <div style="width:12px;height:12px;border-radius:50%;background:${order.orderStatus==='Delivered'?'#22c55e':order.orderStatus==='Cancelled'?'#ef4444':'#f59e0b'};flex-shrink:0"></div>
    <div>
      <div style="font-size:14px;font-weight:700;color:${order.orderStatus==='Delivered'?'#15803d':order.orderStatus==='Cancelled'?'#dc2626':'#92400e'}">${order.orderStatus==='Delivered'?'✅ Delivered':order.orderStatus==='Cancelled'?'❌ Cancelled':'📦 '+order.orderStatus}</div>
      <div style="font-size:12px;color:#565959;margin-top:1px">Order placed on ${dateStr}</div>
    </div>
    ${order.trackingId && order.trackingId !== '—' ? `<div style="margin-left:auto;font-size:12px;color:#4f46e5;font-weight:700">🚚 ${order.trackingId}${order.courierName && order.courierName !== '—' ? ' · '+order.courierName : ''}</div>` : ""}
  </div>

  <div class="delivery-card">
    <div style="font-size:10px;font-weight:800;color:#ff9900;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px">📍 Delivery Address</div>
    <div style="font-size:15px;font-weight:700;color:#131921">${customerName}</div>
    <div style="font-size:13px;color:#565959;margin-top:4px;line-height:1.6">${shippingAddr}</div>
    ${order.user?.mobile ? `<div style="font-size:12px;color:#565959;margin-top:4px">📞 ${order.user.mobile}</div>` : ""}
  </div>

  <div style="background:#fff;padding:14px 28px 0">
    <div style="font-size:11px;font-weight:800;color:#565959;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px">Items Ordered</div>
  </div>
  <table>
    <thead><tr>
      <th style="text-align:left;width:40px">#</th>
      <th style="text-align:left">Product</th>
      <th style="text-align:left;width:70px">HSN</th>
      <th style="text-align:center;width:50px">Qty</th>
      <th style="text-align:right;width:80px">Rate</th>
      <th style="text-align:right;width:90px">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="summary-box">
    <div style="font-size:11px;font-weight:800;color:#565959;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px">Price Details</div>
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#333"><span>Subtotal (${order.orderItems.length} item${order.orderItems.length>1?'s':''})</span><span>₹${subtotal.toFixed(2)}</span></div>
    ${shipping > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#007600"><span>🚚 Delivery Charges</span><span>+₹${shipping.toFixed(2)}</span></div>` : `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#007600"><span>🚚 Delivery Charges</span><span style="font-weight:700">FREE</span></div>`}
    ${breakdown.directDiscount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#b12704"><span>🏷️ Direct Discount</span><span>-₹${breakdown.directDiscount.toFixed(2)}</span></div>` : ""}
    ${breakdown.offerDiscount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#b12704"><span>🎁 Offer Discount</span><span>-₹${breakdown.offerDiscount.toFixed(2)}</span></div>` : ""}
    ${breakdown.coinDiscount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#7c3aed"><span>🪙 Coin Discount</span><span>-₹${breakdown.coinDiscount.toFixed(2)}</span></div>` : (discount > 0 && !breakdown.directDiscount && !breakdown.offerDiscount ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#b12704"><span>💰 Discount</span><span>-₹${discount.toFixed(2)}</span></div>` : "")}
    ${gstRows}
    <div style="display:flex;justify-content:space-between;border-top:2px solid #131921;margin-top:8px;padding-top:12px;font-size:17px;font-weight:900;color:#131921"><span>Total Amount</span><span>₹${finalTotal.toFixed(2)}</span></div>
  </div>

  <div class="info-strip">
    <div>
      <div style="font-size:10px;font-weight:700;color:#565959;text-transform:uppercase;letter-spacing:1px">Payment</div>
      <div style="font-size:13px;font-weight:700;color:#131921;margin-top:3px">${order.paymentDestination === "CASH" ? "💵 Cash on Delivery" : order.paymentDestination === "OTHER_ACCOUNT" ? "🏦 Online (Other)" : "💳 Online Payment"}</div>
    </div>
    ${order.paymentInfo?.razorpayPaymentId ? `<div><div style="font-size:10px;font-weight:700;color:#565959;text-transform:uppercase;letter-spacing:1px">Transaction ID</div><div style="font-size:11px;font-weight:700;color:#131921;font-family:monospace;margin-top:3px">${order.paymentInfo.razorpayPaymentId}</div></div>` : ""}
    ${order.trackingId && order.trackingId !== '—' ? `<div><div style="font-size:10px;font-weight:700;color:#565959;text-transform:uppercase;letter-spacing:1px">Tracking</div><div style="font-size:13px;font-weight:700;color:#131921;margin-top:3px">${order.trackingId}${order.courierName && order.courierName !== '—' ? ' · '+order.courierName : ''}</div></div>` : ""}
  </div>

  <div class="footer">
    <div style="font-size:13px;color:#ddd;font-weight:600">🙏 Thank you for shopping with <strong>${storeName}</strong>!</div>
    <div style="font-size:11px;color:#888;margin-top:4px">Computer-generated invoice · No signature required</div>
  </div>

  <div class="no-print">
    <button onclick="window.print()" style="background:#ff9900;color:#131921;border:none;padding:11px 36px;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer">🖨️ Print Invoice</button>
  </div>
</div>
</body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 600);
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
      payment: order?.mode === "OFFLINE"
        ? (order?.paymentDestination === "CASH" ? "Cash" : order?.paymentDestination === "OTHER_ACCOUNT" ? "Online-Other" : "Online-Current")
        : (order?.paymentDestination === "OTHER_ACCOUNT" ? "Online-Other" : "Online-Current"),
      date: dayjs(order?.createdAt).format("DD MMM YYYY"),
      rawDate: order?.createdAt,
      courierName: order?.courierName || "—",
      trackingId: order?.trackingId || "—",
      trackingUrl: order?.trackingUrl || null,
      isLocked: LOCKED_STATUSES.includes(order?.orderStatus),
      rawOrder: order,
    }));
  }, [orderState]);

  const baseFilteredData = useMemo(() => {
    return processedData.filter((item) => {
      if (!showAll && item.payment !== "Online-Current") return false;
      if (modeFilter === "online" && item.rawOrder?.mode !== "ONLINE") return false;
      if (modeFilter === "offline" && item.rawOrder?.mode !== "OFFLINE") return false;
      if (searchText) {
        const s = searchText.toLowerCase();
        if (!item.orderId.toLowerCase().includes(s) && !item.name.toLowerCase().includes(s) && !item.email.toLowerCase().includes(s) && !item.mobile.includes(s)) return false;
      }
      if (dateRange) {
        const [start, end] = dateRange;
        const d = dayjs(item.rawDate);
        if (d.isBefore(start.startOf("day")) || d.isAfter(end.endOf("day"))) return false;
      }
      if (paymentFilter !== "All" && item.payment !== paymentFilter) return false;
      return true;
    });
  }, [processedData, searchText, dateRange, paymentFilter, modeFilter, showAll]);

  const filteredData = useMemo(() => {
    if (activeStatus === "All") return baseFilteredData;
    return baseFilteredData.filter((item) => item.status === activeStatus);
  }, [baseFilteredData, activeStatus]);

  const statusCounts = useMemo(() => {
    const counts = {};
    Object.keys(STATUS_CONFIG).forEach(k => counts[k] = 0);
    baseFilteredData.forEach(item => { if (counts[item.status] !== undefined) counts[item.status]++; });
    counts.All = baseFilteredData.length;
    return counts;
  }, [baseFilteredData]);

  const totalRevenue = baseFilteredData.reduce((s, o) => s + (o.finalAmount || 0), 0);
  const deliveredCount = statusCounts["Delivered"] || 0;
  const pendingCount = (statusCounts["Ordered"] || 0) + (statusCounts["Processing"] || 0) + (statusCounts["Packed"] || 0);

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
            {["Ordered","Processing","Packed"].map(s => (
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
        <Tag color={p === "Cash" ? "warning" : p === "Online-Other" ? "purple" : "processing"} style={{ borderRadius: 12, padding: "3px 10px", fontWeight: 700, fontSize: 11 }}>{p}</Tag>
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
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "clamp(8px, 2vw, 24px)" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
        borderRadius: 20, padding: "clamp(14px, 4vw, 26px) clamp(16px, 4vw, 32px)", marginBottom: 16, color: "#fff",
        boxShadow: "0 8px 32px rgba(55,48,163,0.22)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShoppingOutlined style={{ fontSize: 24, color: "#fff" }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3, cursor: "default", userSelect: "none" }} onClick={handleTitleClick}>
                Orders Management
                {showAll && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", marginLeft: 8, verticalAlign: "middle" }} title="Showing all orders" />}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>Track, manage, and fulfill all customer orders</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Total Orders", value: baseFilteredData.length, accent: "rgba(255,255,255,0.12)" },
              { label: "Delivered", value: deliveredCount, accent: "rgba(16,185,129,0.28)" },
              { label: "Pending", value: pendingCount, accent: "rgba(251,191,36,0.22)" },
              { label: "Revenue", value: `₹${(totalRevenue/1000).toFixed(1)}K`, accent: "rgba(244,114,182,0.22)" },
            ].map(s => (
              <div key={s.label} style={{
                background: s.accent, border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 14, padding: "10px 14px", minWidth: 80, textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.62)", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const isActive = activeStatus === status;
            return (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
                  borderRadius: 40, cursor: "pointer", fontWeight: 600, fontSize: 12,
                  transition: "all 0.17s",
                  background: isActive ? cfg.gradient : "#f8fafc",
                  color: isActive ? "#fff" : cfg.color,
                  border: isActive ? "none" : `1.5px solid ${cfg.border}`,
                  boxShadow: isActive ? `0 4px 12px ${cfg.border}60` : "none",
                  transform: isActive ? "translateY(-1px)" : "none",
                }}
              >
                {cfg.icon} {status}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.25)" : cfg.bg,
                  color: isActive ? "#fff" : cfg.color,
                  borderRadius: 8, padding: "1px 6px", fontSize: 11, fontWeight: 800,
                }}>
                  {statusCounts[status] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <Input
            placeholder="Search order ID, name, email…"
            prefix={<SearchOutlined style={{ color: "#6366f1" }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ minWidth: 180, flex: "1 1 180px", borderRadius: 10 }}
          />
          <RangePicker value={dateRange} onChange={setDateRange} style={{ borderRadius: 10, flex: "1 1 220px", minWidth: 0 }} />
          <Select value={paymentFilter} onChange={setPaymentFilter} style={{ minWidth: 130, flex: "1 1 130px" }}>
            <Option value="All">All Payments</Option>
            <Option value="Online-Current">Online - Current</Option>
            <Option value="Online-Other">Online - Other</Option>
            <Option value="Cash">Cash (POS)</Option>
          </Select>
          <Select value={modeFilter} onChange={setModeFilter} style={{ minWidth: 120, flex: "1 1 120px" }}>
            <Option value="all">All Modes</Option>
            <Option value="online">🌐 Online</Option>
            <Option value="offline">🏪 Offline</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => { setActiveStatus("All"); setSearchText(""); setDateRange(null); setPaymentFilter("All"); setModeFilter("all"); }} style={{ borderRadius: 10 }}>
            Reset
          </Button>
          {/* modeFilter is intentionally NOT reset here so it persists across resets */}
          {selectedRowKeys.length > 0 && (
            <>
              <Dropdown
                menu={{ items: [
                  { key: "Ordered", label: "🕐 Mark as Ordered", onClick: () => handleBulkStatusChange("Ordered") },
                  { key: "Processing", label: "🔄 Mark as Processing", onClick: () => handleBulkStatusChange("Processing") },
                  { key: "Packed", label: "📦 Mark as Packed", onClick: () => handleBulkStatusChange("Packed") },
                ]}}
                disabled={bulkLoading}
              >
                <Button icon={<EditOutlined />} loading={bulkLoading}
                  style={{ borderRadius: 10, border: "1.5px solid #6366f1", color: "#6366f1", fontWeight: 600 }}>
                  Bulk Status ({selectedRowKeys.length}) <DownOutlined />
                </Button>
              </Dropdown>
              {activeStatus === "Packed" && (
                <Button type="primary" icon={<ThunderboltOutlined />} loading={bulkLoading} onClick={handleBulkShipment}
                  style={{ borderRadius: 10, background: "#10b981", border: "none", fontWeight: 600 }}>
                  Create Shipment ({selectedRowKeys.length})
                </Button>
              )}
            </>
          )}
          <div style={{ marginLeft: "auto", background: "#eef2ff", color: "#4f46e5", borderRadius: 10, padding: "7px 14px", fontWeight: 700, fontSize: 13 }}>
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
      <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", overflow: "hidden" }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: (r) => ({ disabled: r.isLocked || r.rawOrder?.shipmentId }) }}
          pagination={{ pageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} orders` }}
          scroll={{ x: 1200 }}
          size="middle"
          rowClassName={() => "order-row"}
        />
      </div>

      <style>{`
        .order-row:hover td { background: #f5f3ff !important; transition: background 0.15s; }
        .ant-table-thead > tr > th { background: #f8fafc !important; color: #374151 !important; font-weight: 700 !important; font-size: 12px !important; letter-spacing: 0.3px !important; border-bottom: 2px solid #e5e7eb !important; }
        .ant-table-tbody > tr > td { border-bottom: 1px solid #f3f4f6 !important; padding: 13px 16px !important; }
        .ant-pagination { padding: 14px 24px !important; }
      `}</style>
    </div>
  );
};

export default Orders;
