import React, { useEffect, useState, useMemo } from "react";
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
      dispatch(getOrders());
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
        return `<tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 8px;color:#666;font-size:13px">${i+1}</td>
          <td style="padding:10px 8px;font-size:13px;font-weight:600">${title}${item.isFreeItem ? ' <span style="background:#dcfce7;color:#15803d;font-size:10px;padding:2px 6px;border-radius:4px;font-weight:700">FREE</span>' : ""}</td>
          <td style="padding:10px 8px;font-size:12px;color:#888;font-family:monospace">${hsn}</td>
          <td style="padding:10px 8px;text-align:center;font-size:13px">${qty}</td>
          <td style="padding:10px 8px;text-align:right;font-size:13px">${item.isFreeItem ? "FREE" : "₹"+rate.toFixed(2)}</td>
          <td style="padding:10px 8px;text-align:right;font-size:13px;font-weight:700">${item.isFreeItem ? "FREE" : "₹"+amt.toFixed(2)}</td>
        </tr>`;
      }).join("");

      const gstRows = gstTotal > 0 ? (taxIncluded
        ? `<tr><td colspan="5" style="padding:6px 8px;color:#15803d;font-size:12px">✅ GST included in price</td><td style="padding:6px 8px;text-align:right;color:#15803d;font-size:12px">₹${gstTotal.toFixed(2)}</td></tr>`
        : (gstType === "CGST_SGST"
          ? `<tr><td colspan="5" style="padding:6px 8px;color:#ea580c;font-size:12px">CGST (${cgstRate}%)</td><td style="padding:6px 8px;text-align:right;color:#ea580c;font-size:12px">+₹${cgst.toFixed(2)}</td></tr>
             <tr><td colspan="5" style="padding:6px 8px;color:#ea580c;font-size:12px">SGST (${sgstRate}%)</td><td style="padding:6px 8px;text-align:right;color:#ea580c;font-size:12px">+₹${sgst.toFixed(2)}</td></tr>`
          : `<tr><td colspan="5" style="padding:6px 8px;color:#ea580c;font-size:12px">IGST (${igstRate}%)</td><td style="padding:6px 8px;text-align:right;color:#ea580c;font-size:12px">+₹${igst.toFixed(2)}</td></tr>`)
      ) : "";

      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${invoiceNum}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#f5f5f5; padding:20px; }
  .page { max-width:720px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1); }
  @media print { body{background:#fff;padding:0} .page{box-shadow:none;border-radius:0} .no-print{display:none} }
</style></head><body>
<div class="page">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:26px;font-weight:900;letter-spacing:-0.5px">${storeName}</div>
      ${storeAddress ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px;max-width:280px">${storeAddress}</div>` : ""}
      ${storePhone ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">📞 ${storePhone}</div>` : ""}
      ${gstin ? `<div style="font-size:11px;color:#64748b;margin-top:4px;font-family:monospace">GSTIN: ${gstin}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div style="font-size:22px;font-weight:900;color:#818cf8;letter-spacing:1px">INVOICE</div>
      <div style="font-size:14px;color:#94a3b8;margin-top:4px;font-family:monospace">#${invoiceNum}</div>
      <div style="font-size:12px;color:#64748b;margin-top:2px">${dateStr}</div>
      <div style="margin-top:8px;background:${order.orderStatus==="Delivered"?"#059669":order.orderStatus==="Cancelled"?"#dc2626":"#d97706"};color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block">${order.orderStatus}</div>
    </div>
  </div>

  <!-- Bill To / Ship To -->
  <div style="display:flex;gap:0;border-bottom:1px solid #f0f0f0">
    <div style="flex:1;padding:20px 32px;border-right:1px solid #f0f0f0">
      <div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Bill To</div>
      <div style="font-weight:700;font-size:15px;color:#0f172a">${customerName}</div>
      ${order.user?.mobile ? `<div style="font-size:13px;color:#64748b;margin-top:4px">📞 ${order.user.mobile}</div>` : ""}
      ${order.user?.email ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">${order.user.email}</div>` : ""}
    </div>
    <div style="flex:1;padding:20px 32px">
      <div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Ship To</div>
      <div style="font-size:13px;color:#374151;line-height:1.6">${shippingAddr}</div>
    </div>
  </div>

  ${pickup ? `
  <!-- Pickup / Seller Address -->
  <div style="background:#f8fafc;padding:14px 32px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px">
    <div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;white-space:nowrap">Pickup From</div>
    <div style="font-size:12px;color:#64748b">${pickup.name} — ${pickup.address}${pickup.address2 ? ", "+pickup.address2 : ""}, ${pickup.city}, ${pickup.state} - ${pickup.pincode}${pickup.phone ? " | 📞 "+pickup.phone : ""}</div>
  </div>` : ""}

  <!-- Items Table -->
  <div style="padding:0 32px">
    <table style="width:100%;border-collapse:collapse;margin-top:20px">
      <thead>
        <tr style="background:#0f172a;color:#e2e8f0">
          <th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px;border-radius:0">#</th>
          <th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">ITEM</th>
          <th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">HSN</th>
          <th style="padding:12px 8px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.5px">QTY</th>
          <th style="padding:12px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px">RATE</th>
          <th style="padding:12px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- Totals -->
  <div style="padding:16px 32px 28px">
    <table style="width:100%;border-collapse:collapse;margin-left:auto;max-width:320px">
      <tr><td style="padding:6px 8px;color:#64748b;font-size:13px">Subtotal</td><td style="padding:6px 8px;text-align:right;font-size:13px">₹${subtotal.toFixed(2)}</td></tr>
      ${shipping > 0 ? `<tr><td style="padding:6px 8px;color:#64748b;font-size:13px">🚚 Shipping</td><td style="padding:6px 8px;text-align:right;font-size:13px">₹${shipping.toFixed(2)}</td></tr>` : (order.mode !== "OFFLINE" ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">🚚 Shipping</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">Free</td></tr>` : "")}
      ${breakdown.directDiscount > 0 ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">🏷️ Direct Discount</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">-₹${breakdown.directDiscount.toFixed(2)}</td></tr>` : ""}
      ${breakdown.offerDiscount > 0 ? `<tr><td style="padding:6px 8px;color:#f59e0b;font-size:13px">🎁 Offer Discount</td><td style="padding:6px 8px;text-align:right;color:#f59e0b;font-size:13px">-₹${breakdown.offerDiscount.toFixed(2)}</td></tr>` : ""}
      ${breakdown.coinDiscount > 0 ? `<tr><td style="padding:6px 8px;color:#7c3aed;font-size:13px">🪙 Coin Discount</td><td style="padding:6px 8px;text-align:right;color:#7c3aed;font-size:13px">-₹${breakdown.coinDiscount.toFixed(2)}</td></tr>` : (discount > 0 && !breakdown.directDiscount && !breakdown.offerDiscount ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">💰 Discount</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">-₹${discount.toFixed(2)}</td></tr>` : "")}
      ${gstRows}
      <tr style="border-top:2px solid #0f172a">
        <td style="padding:12px 8px;font-size:17px;font-weight:900;color:#0f172a">TOTAL</td>
        <td style="padding:12px 8px;text-align:right;font-size:17px;font-weight:900;color:#6366f1">₹${finalTotal.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <!-- Payment Info -->
  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
    <div>
      <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Payment</span>
      <span style="margin-left:10px;font-size:13px;font-weight:700;color:${order.paymentInfo?.razorpayPaymentId && order.paymentInfo.razorpayPaymentId !== "OFFLINE" ? "#059669" : "#d97706"}">
        ${order.paymentInfo?.razorpayPaymentId && order.paymentInfo.razorpayPaymentId !== "OFFLINE" ? "✅ Paid Online" : order.mode === "OFFLINE" && order.paymentDestination === "CASH" ? "💵 Cash" : "🏦 Online Transfer"}
      </span>
    </div>
    ${order.trackingId && order.trackingId !== "—" ? `<div style="font-size:12px;color:#6366f1">🚚 Tracking: <strong>${order.trackingId}</strong>${order.courierName ? " via "+order.courierName : ""}</div>` : ""}
  </div>

  <!-- Footer -->
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0">
    <div style="font-size:12px;color:#94a3b8">Thank you for shopping with <strong>${storeName}</strong> 🛍️</div>
    <div style="font-size:11px;color:#cbd5e1;margin-top:4px">This is a computer-generated invoice. No signature required.</div>
  </div>

  <div class="no-print" style="padding:16px 32px;text-align:center;background:#f8fafc">
    <button onclick="window.print()" style="background:#6366f1;color:#fff;border:none;padding:10px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Print Invoice</button>
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
          {selectedRowKeys.length > 0 && (
            <>
              <Dropdown
                menu={{
                  items: [
                    { key: "Ordered", label: "🕐 Mark as Ordered", onClick: () => handleBulkStatusChange("Ordered") },
                    { key: "Processed", label: "🔄 Mark as Processed", onClick: () => handleBulkStatusChange("Processed") },
                    { key: "Packed", label: "📦 Mark as Packed", onClick: () => handleBulkStatusChange("Packed") },
                  ],
                }}
                disabled={bulkLoading}
              >
                <Button icon={<EditOutlined />} loading={bulkLoading}
                  style={{ borderRadius: 12, border: "2px solid #6366f1", color: "#6366f1", fontWeight: 700 }}>
                  Bulk Status ({selectedRowKeys.length}) <DownOutlined />
                </Button>
              </Dropdown>
              {activeStatus === "Packed" && (
                <Button type="primary" icon={<ThunderboltOutlined />} loading={bulkLoading} onClick={handleBulkShipment}
                  style={{ borderRadius: 12, background: "linear-gradient(135deg,#10b981,#34d399)", border: "none", fontWeight: 700, boxShadow: "0 4px 16px rgba(16,185,129,0.4)" }}>
                  Create Shipment ({selectedRowKeys.length})
                </Button>
              )}
            </>
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
