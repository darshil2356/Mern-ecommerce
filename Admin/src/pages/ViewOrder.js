import React, { useEffect, useState } from "react";
import {
  Card, Row, Col, Tag, Button, Divider, Descriptions, Timeline,
  Space, Alert, Typography, Progress, Avatar, List, Table,
  Badge, Steps, Statistic, Modal, Input, message
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined, HomeOutlined, UserOutlined, CreditCardOutlined,
  ShopOutlined, CarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, PhoneOutlined, MailOutlined, GlobalOutlined,
  PrinterOutlined, RocketOutlined, EnvironmentOutlined, DollarOutlined,
  ThunderboltOutlined, GiftOutlined, StarOutlined, SyncOutlined,
  ShoppingOutlined, CloseCircleOutlined, StopOutlined
} from "@ant-design/icons";
import { getaOrder, adminCancelAOrder } from "../features/auth/authSlice";
import dayjs from "dayjs";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import axios from "axios";

const { Title, Text } = Typography;
const { Step } = Steps;

// Premium Enterprise Color Palette
const COLORS = {
  // Primary Brand Colors
  primary: {
    main: '#0F172A',        // Rich charcoal black
    light: '#1E293B',       // Dark slate
    lighter: '#334155',     // Medium slate
    dark: '#020617',        // Deep black
    gradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
    glow: '0 0 20px rgba(15, 23, 42, 0.3)'
  },

  // Secondary Success Colors
  secondary: {
    main: '#059669',        // Emerald green
    light: '#10B981',       // Light emerald
    lighter: '#34D399',     // Bright emerald
    dark: '#047857',        // Dark emerald
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
    glow: '0 0 20px rgba(5, 150, 105, 0.3)'
  },

  // Accent Colors
  accent: {
    blue: '#2563EB',        // Professional blue
    purple: '#7C3AED',      // Deep purple
    orange: '#EA580C',      // Burnt orange
    red: '#DC2626',         // Crimson red
    teal: '#0D9488',        // Teal
    indigo: '#4338CA',      // Indigo
    pink: '#DB2777',        // Magenta pink
    cyan: '#0891B2'         // Cyan blue
  },

  // Neutral Professional Grays
  neutral: {
    50: '#F8FAFC',          // Off-white
    100: '#F1F5F9',         // Very light gray
    200: '#E2E8F0',         // Light gray
    300: '#CBD5E1',         // Light medium gray
    400: '#94A3B8',         // Medium gray
    500: '#64748B',         // Medium dark gray
    600: '#475569',         // Dark gray
    700: '#334155',         // Darker gray
    800: '#1E293B',         // Very dark gray
    900: '#0F172A'          // Almost black
  },

  // Status-Specific Colors with Premium Feel
  status: {
    ordered: {
      bg: '#FFFBEB',         // Warm cream
      text: '#92400E',       // Dark brown
      border: '#F59E0B',     // Golden yellow
      gradient: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 50%, #FDE68A 100%)',
      glow: '0 0 15px rgba(245, 158, 11, 0.2)'
    },
    processed: {
      bg: '#EFF6FF',         // Light blue
      text: '#1E40AF',       // Dark blue
      border: '#3B82F6',     // Blue
      gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)',
      glow: '0 0 15px rgba(59, 130, 246, 0.2)'
    },
    packed: {
      bg: '#F3E8FF',         // Light purple
      text: '#6B21A8',       // Dark purple
      border: '#8B5CF6',     // Purple
      gradient: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #D8B4FE 100%)',
      glow: '0 0 15px rgba(139, 92, 246, 0.2)'
    },
    shipped: {
      bg: '#ECFDF5',         // Light green
      text: '#065F46',       // Dark green
      border: '#10B981',     // Green
      gradient: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 50%, #A7F3D0 100%)',
      glow: '0 0 15px rgba(16, 185, 129, 0.2)'
    },
    outForDelivery: {
      bg: '#FDF4FF',         // Light magenta
      text: '#831843',       // Dark magenta
      border: '#EC4899',     // Magenta
      gradient: 'linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 50%, #F5D0FE 100%)',
      glow: '0 0 15px rgba(236, 72, 153, 0.2)'
    },
    delivered: {
      bg: '#F0FDF4',         // Mint green
      text: '#14532D',       // Dark green
      border: '#22C55E',     // Bright green
      gradient: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)',
      glow: '0 0 15px rgba(34, 197, 94, 0.2)'
    },
    cancelled: {
      bg: '#FEF2F2',         // Light red
      text: '#991B1B',       // Dark red
      border: '#EF4444',     // Red
      gradient: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 50%, #FECACA 100%)',
      glow: '0 0 15px rgba(239, 68, 68, 0.2)'
    }
  },

  // Glassmorphism Effects
  glass: {
    light: 'rgba(255, 255, 255, 0.85)',
    medium: 'rgba(255, 255, 255, 0.75)',
    dark: 'rgba(255, 255, 255, 0.65)',
    backdrop: 'blur(20px)',
    border: 'rgba(255, 255, 255, 0.2)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
  }
};

// Enhanced status configuration with premium styling
const STATUS_CONFIG = {
  "All": {
    color: "default",
    icon: null,
    bgColor: COLORS.neutral[100],
    textColor: COLORS.neutral[600],
    gradient: `linear-gradient(135deg, ${COLORS.neutral[100]} 0%, ${COLORS.neutral[200]} 100%)`,
    borderColor: COLORS.neutral[300],
    glow: 'none',
    count: 0
  },
  "Ordered": {
    color: "orange",
    icon: <ClockCircleOutlined />,
    bgColor: COLORS.status.ordered.bg,
    textColor: COLORS.status.ordered.text,
    gradient: COLORS.status.ordered.gradient,
    borderColor: COLORS.status.ordered.border,
    glow: COLORS.status.ordered.glow,
    count: 0
  },
  "Processed": {
    color: "blue",
    icon: <SyncOutlined />,
    bgColor: COLORS.status.processed.bg,
    textColor: COLORS.status.processed.text,
    gradient: COLORS.status.processed.gradient,
    borderColor: COLORS.status.processed.border,
    glow: COLORS.status.processed.glow,
    count: 0
  },
  "Packed": {
    color: "purple",
    icon: <ShoppingOutlined />,
    bgColor: COLORS.status.packed.bg,
    textColor: COLORS.status.packed.text,
    gradient: COLORS.status.packed.gradient,
    borderColor: COLORS.status.packed.border,
    glow: COLORS.status.packed.glow,
    count: 0
  },
  "Shipped": {
    color: "cyan",
    icon: <CarOutlined />,
    bgColor: COLORS.status.shipped.bg,
    textColor: COLORS.status.shipped.text,
    gradient: COLORS.status.shipped.gradient,
    borderColor: COLORS.status.shipped.border,
    glow: COLORS.status.shipped.glow,
    count: 0
  },
  "Out for Delivery": {
    color: "geekblue",
    icon: <RocketOutlined />,
    bgColor: COLORS.status.outForDelivery.bg,
    textColor: COLORS.status.outForDelivery.text,
    gradient: COLORS.status.outForDelivery.gradient,
    borderColor: COLORS.status.outForDelivery.border,
    glow: COLORS.status.outForDelivery.glow,
    count: 0
  },
  "Delivered": {
    color: "green",
    icon: <CheckCircleOutlined />,
    bgColor: COLORS.status.delivered.bg,
    textColor: COLORS.status.delivered.text,
    gradient: COLORS.status.delivered.gradient,
    borderColor: COLORS.status.delivered.border,
    glow: COLORS.status.delivered.glow,
    count: 0
  },
  "Cancelled": {
    color: "red",
    icon: <CloseCircleOutlined />,
    bgColor: COLORS.status.cancelled.bg,
    textColor: COLORS.status.cancelled.text,
    gradient: COLORS.status.cancelled.gradient,
    borderColor: COLORS.status.cancelled.border,
    glow: COLORS.status.cancelled.glow,
    count: 0
  },
};

// Status order for timeline
const statusOrder = ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const getStatusColor = (status) => {
  const colors = {
    "Ordered": "orange",
    "Processed": "blue",
    "Packed": "purple",
    "Shipped": "cyan",
    "Out for Delivery": "geekblue",
    "Delivered": "green",
    "Cancelled": "red",
  };
  return colors[status] || "default";
};

const getStatusIcon = (status) => {
  const icons = {
    "Ordered": <ClockCircleOutlined />,
    "Processed": <ExclamationCircleOutlined />,
    "Packed": <ShopOutlined />,
    "Shipped": <CarOutlined />,
    "Out for Delivery": <RocketOutlined />,
    "Delivered": <CheckCircleOutlined />,
    "Cancelled": <ExclamationCircleOutlined />,
  };
  return icons[status] || <ClockCircleOutlined />;
};

const getTimelineItems = (order) => {
  const isOffline = order.mode === "OFFLINE";
  // POS orders skip the fulfilment pipeline — show only Delivered (or Cancelled)
  const statusOrder = isOffline
    ? ["Delivered"]
    : ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

  if (order.orderStatus === "Cancelled") {
    const cancelDate = order.statusHistory?.find(h => h.status === "Cancelled")?.date
      || order.cancelledAt;
    return [{
      color: "red",
      dot: getStatusIcon("Cancelled"),
      children: (
        <div>
          <div style={{ fontWeight: 600, color: "#ff4d4f" }}>Cancelled</div>
          {cancelDate && (
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
              {dayjs(cancelDate).format("DD MMM YYYY, HH:mm")}
            </div>
          )}
          {order.cancelReason && (
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
              Reason: {order.cancelReason}
            </div>
          )}
        </div>
      ),
    }];
  }

  const currentIndex = statusOrder.indexOf(order.orderStatus);

  return statusOrder.map((status, index) => {
    const isCompleted = index <= currentIndex;
    const isCurrent = index === currentIndex;

    const color = isCompleted ? "green" : "gray";
    const statusDate = order.statusHistory?.find(h => h.status === status)?.date;

    return {
      color,
      dot: getStatusIcon(status),
      children: (
        <div>
          <div style={{ fontWeight: isCurrent ? 600 : 400, color: isCurrent ? "#1890ff" : "inherit" }}>
            {status}
          </div>
          {statusDate && (
            <div style={{ fontSize: 12, color: "#8c8c8c", marginTop: 2 }}>
              {dayjs(statusDate).format("DD MMM YYYY, HH:mm")}
            </div>
          )}
        </div>
      ),
    };
  });
};

const ViewOrder = () => {
  const location = useLocation();
  const orderId = location.pathname.split("/")[3];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const printBill = async () => {
    try {
      const [pickupRes, settingsRes] = await Promise.all([
        axios.get(`${base_url}shiprocket/pickup-address`, config).catch(() => ({ data: { address: null } })),
        axios.get(`${base_url}user/settings`, config).catch(() => ({ data: {} })),
      ]);
      const order = orderState;
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
        const qty = item.quantity; const rate = item.price; const amt = qty * rate;
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
          ? `<tr><td colspan="5" style="padding:6px 8px;color:#ea580c;font-size:12px">CGST (${cgstRate}%)</td><td style="padding:6px 8px;text-align:right;color:#ea580c;font-size:12px">+₹${cgst.toFixed(2)}</td></tr><tr><td colspan="5" style="padding:6px 8px;color:#ea580c;font-size:12px">SGST (${sgstRate}%)</td><td style="padding:6px 8px;text-align:right;color:#ea580c;font-size:12px">+₹${sgst.toFixed(2)}</td></tr>`
          : `<tr><td colspan="5" style="padding:6px 8px;color:#ea580c;font-size:12px">IGST (${igstRate}%)</td><td style="padding:6px 8px;text-align:right;color:#ea580c;font-size:12px">+₹${igst.toFixed(2)}</td></tr>`)
      ) : "";
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${invoiceNum}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px}.page{max-width:720px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}@media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}.no-print{display:none}}</style></head><body>
<div class="page">
  <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start">
    <div><div style="font-size:26px;font-weight:900;letter-spacing:-0.5px">${storeName}</div>${storeAddress ? `<div style="font-size:12px;color:#94a3b8;margin-top:4px;max-width:280px">${storeAddress}</div>` : ""}${storePhone ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">📞 ${storePhone}</div>` : ""}${gstin ? `<div style="font-size:11px;color:#64748b;margin-top:4px;font-family:monospace">GSTIN: ${gstin}</div>` : ""}</div>
    <div style="text-align:right"><div style="font-size:22px;font-weight:900;color:#818cf8;letter-spacing:1px">INVOICE</div><div style="font-size:14px;color:#94a3b8;margin-top:4px;font-family:monospace">#${invoiceNum}</div><div style="font-size:12px;color:#64748b;margin-top:2px">${dateStr}</div><div style="margin-top:8px;background:${order.orderStatus==="Delivered"?"#059669":order.orderStatus==="Cancelled"?"#dc2626":"#d97706"};color:#fff;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;display:inline-block">${order.orderStatus}</div></div>
  </div>
  <div style="display:flex;gap:0;border-bottom:1px solid #f0f0f0">
    <div style="flex:1;padding:20px 32px;border-right:1px solid #f0f0f0"><div style="font-size:11px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Bill To</div><div style="font-weight:700;font-size:15px;color:#0f172a">${customerName}</div>${order.user?.mobile ? `<div style="font-size:13px;color:#64748b;margin-top:4px">📞 ${order.user.mobile}</div>` : ""}${order.user?.email ? `<div style="font-size:12px;color:#94a3b8;margin-top:2px">${order.user.email}</div>` : ""}</div>
    <div style="flex:1;padding:20px 32px"><div style="font-size:11px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Ship To</div><div style="font-size:13px;color:#374151;line-height:1.6">${shippingAddr}</div></div>
  </div>
  ${pickup ? `<div style="background:#f8fafc;padding:14px 32px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:12px"><div style="font-size:11px;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:1px;white-space:nowrap">Pickup From</div><div style="font-size:12px;color:#64748b">${pickup.name} — ${pickup.address}${pickup.address2 ? ", "+pickup.address2 : ""}, ${pickup.city}, ${pickup.state} - ${pickup.pincode}${pickup.phone ? " | 📞 "+pickup.phone : ""}</div></div>` : ""}
  <div style="padding:0 32px"><table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="background:#0f172a;color:#e2e8f0"><th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">#</th><th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">ITEM</th><th style="padding:12px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:0.5px">HSN</th><th style="padding:12px 8px;text-align:center;font-size:11px;font-weight:700;letter-spacing:0.5px">QTY</th><th style="padding:12px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px">RATE</th><th style="padding:12px 8px;text-align:right;font-size:11px;font-weight:700;letter-spacing:0.5px">AMOUNT</th></tr></thead><tbody>${itemRows}</tbody></table></div>
  <div style="padding:16px 32px 28px"><table style="width:100%;border-collapse:collapse;margin-left:auto;max-width:320px">
    <tr><td style="padding:6px 8px;color:#64748b;font-size:13px">Subtotal</td><td style="padding:6px 8px;text-align:right;font-size:13px">₹${subtotal.toFixed(2)}</td></tr>
    ${shipping > 0 ? `<tr><td style="padding:6px 8px;color:#64748b;font-size:13px">🚚 Shipping</td><td style="padding:6px 8px;text-align:right;font-size:13px">₹${shipping.toFixed(2)}</td></tr>` : (order.mode !== "OFFLINE" ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">🚚 Shipping</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">Free</td></tr>` : "")}
    ${breakdown.directDiscount > 0 ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">🏷️ Direct Discount</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">-₹${breakdown.directDiscount.toFixed(2)}</td></tr>` : ""}
    ${breakdown.offerDiscount > 0 ? `<tr><td style="padding:6px 8px;color:#f59e0b;font-size:13px">🎁 Offer Discount</td><td style="padding:6px 8px;text-align:right;color:#f59e0b;font-size:13px">-₹${breakdown.offerDiscount.toFixed(2)}</td></tr>` : ""}
    ${breakdown.coinDiscount > 0 ? `<tr><td style="padding:6px 8px;color:#7c3aed;font-size:13px">🪙 Coin Discount</td><td style="padding:6px 8px;text-align:right;color:#7c3aed;font-size:13px">-₹${breakdown.coinDiscount.toFixed(2)}</td></tr>` : (discount > 0 && !breakdown.directDiscount && !breakdown.offerDiscount ? `<tr><td style="padding:6px 8px;color:#16a34a;font-size:13px">💰 Discount</td><td style="padding:6px 8px;text-align:right;color:#16a34a;font-size:13px">-₹${discount.toFixed(2)}</td></tr>` : "")}
    ${gstRows}
    <tr style="border-top:2px solid #0f172a"><td style="padding:12px 8px;font-size:17px;font-weight:900;color:#0f172a">TOTAL</td><td style="padding:12px 8px;text-align:right;font-size:17px;font-weight:900;color:#6366f1">₹${finalTotal.toFixed(2)}</td></tr>
  </table></div>
  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
    <div><span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Payment</span><span style="margin-left:10px;font-size:13px;font-weight:700;color:${order.paymentDestination === "CASH" ? "#d97706" : order.paymentDestination === "OTHER_ACCOUNT" ? "#7c3aed" : "#059669"}">${order.paymentDestination === "CASH" ? "💵 Cash" : order.paymentDestination === "OTHER_ACCOUNT" ? "🏦 Online (Other Account)" : "💳 Online (Current Account)"}</span></div>
    ${order.trackingId ? `<div style="font-size:12px;color:#6366f1">🚚 Tracking: <strong>${order.trackingId}</strong>${order.courierName ? " via "+order.courierName : ""}</div>` : ""}
  </div>
  <div style="padding:16px 32px;text-align:center;border-top:1px solid #f0f0f0"><div style="font-size:12px;color:#94a3b8">Thank you for shopping with <strong>${storeName}</strong> 🛍️</div><div style="font-size:11px;color:#cbd5e1;margin-top:4px">This is a computer-generated invoice. No signature required.</div></div>
  <div class="no-print" style="padding:16px 32px;text-align:center;background:#f8fafc"><button onclick="window.print()" style="background:#6366f1;color:#fff;border:none;padding:10px 32px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Print Invoice</button></div>
</div></body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 600);
    } catch (e) { console.error(e); message.error("Failed to print bill"); }
  };
  
  useEffect(() => {
    dispatch(getaOrder(orderId));
  }, [dispatch, orderId]);
  
  const orderState = useSelector((state) => state?.auth?.singleorder?.orders);
  console.log("Order State:", orderState);

  if (!orderState) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <p>Loading order details...</p>
      </div>
    );
  }

  const timelineStatuses = getTimelineItems(orderState);

  const productColumns = [
    {
      title: "SNo",
      dataIndex: "key",
      width: 60,
    },
    {
      title: "Product",
      dataIndex: "product",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {record.isBundle ? (
            <div style={{ width: 50, height: 50, background: "linear-gradient(135deg,#0f172a,#334155)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <ShopOutlined style={{ fontSize: 20, color: "#fff" }} />
            </div>
          ) : record.image ? (
            <img src={record.image} alt={text} style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }} />
          ) : (
            <div style={{ width: 50, height: 50, background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShopOutlined style={{ fontSize: 20, color: "#ccc" }} />
            </div>
          )}
          <div>
            {record.isBundle && (
              <span style={{ background: "#0f172a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, marginBottom: 6, display: "inline-block" }}>BUNDLE</span>
            )}
            {record.isFreeItem && (
              <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, marginBottom: 6, display: "inline-block", marginLeft: record.isBundle ? 4 : 0 }}>🎁 FREE</span>
            )}
            {record.offerLabel && !record.isFreeItem && (
              <span style={{ background: "#fff7ed", color: "#c2410c", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999, marginBottom: 6, display: "inline-block", border: "1px dashed #fb923c" }}>🏷️ {record.offerLabel}</span>
            )}
            <p style={{ margin: 0, fontWeight: 700, color: record.isBundle ? "#0f172a" : "inherit" }}>{text}</p>
            {record.isBundle && (
              <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
                {record.bundleProducts?.map((bp, i) => (
                  <div key={i} style={{ padding: "8px 10px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ margin: 0, fontSize: 12, color: "#0f172a", fontWeight: 600 }}>{bp.title} ×{bp.quantity}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                      {bp.selectedColorLabel && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#64748b" }}>
                          <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel), border: "1px solid #cbd5e1" }} />
                          Color selected
                        </span>
                      )}
                      {bp.selectedSize && (
                        <span style={{ fontSize: 11, color: "#64748b" }}>Size {bp.selectedSize}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!record.isBundle && <p style={{ margin: 0, fontSize: 12, color: "#8c8c8c" }}>{record.brand}</p>}
          </div>
        </div>
      ),
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      render: (barcode) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{barcode}</span>,
    },
    {
      title: "HSN",
      dataIndex: "hsnCode",
      render: (hsnCode) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{hsnCode || "-"}</span>,
    },
    {
      title: "Color",
      dataIndex: "color",
      render: (color) => color ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: getColorSwatch(color),
            border: "1px solid #d9d9d9"
          }} />
          <span>{getReadableColorName(color)}</span>
        </div>
      ) : "-",
    },
    {
      title: "Qty",
      dataIndex: "count",
      align: "center",
    },
    {
      title: "Price",
      dataIndex: "amount",
      align: "right",
      render: (price, record) => record.isFreeItem
        ? <span style={{ color: "#16a34a", fontWeight: 700 }}>FREE</span>
        : <span>₹{price?.toFixed(2)}{record.originalPrice && record.originalPrice > price ? <span style={{ color: "#aaa", textDecoration: "line-through", fontSize: 11, marginLeft: 4 }}>₹{record.originalPrice?.toFixed(2)}</span> : null}</span>,
    },
    {
      title: "Total",
      dataIndex: "total",
      align: "right",
      render: (total, record) => record.isFreeItem
        ? <strong style={{ color: "#16a34a" }}>FREE</strong>
        : <strong>₹{total?.toFixed(2)}</strong>,
    },
  ];

  const data1 = [];
  for (let i = 0; i < orderState?.orderItems?.length; i++) {
    const item = orderState.orderItems[i];
    const product = item?.product;
    if (item?.isBundle) {
      data1.push({
        key: i + 1,
        product: item?.bundleTitle || "Bundle",
        brand: "Bundle Deal",
        barcode: "—",
        color: null,
        count: item?.quantity,
        amount: item?.price,
        total: (item?.price || 0) * (item?.quantity || 0),
        image: null,
        isBundle: true,
        bundleProducts: item?.bundleProducts || [],
        hsnCode: item?.hsnCode || "-",
      });
    } else {
      data1.push({
        key: i + 1,
        product: product?.title || "N/A",
        brand: product?.brand || "N/A",
        barcode: product?.barcode || "N/A",
        hsnCode: item?.hsnCode || product?.hsnCode || "-",
        color: item?.color,
        count: item?.quantity,
        amount: item?.price,
        total: (item?.price || 0) * (item?.quantity || 0),
        image: product?.images?.[0] || null,
        isBundle: false,
        isFreeItem: item?.isFreeItem || false,
        offerLabel: item?.offerLabel || null,
        originalPrice: item?.originalPrice || null,
      });
    }
  }

  const isOffline = orderState?.mode === "OFFLINE";
  const subtotal = orderState?.totalPrice || 0;
  const discount = orderState?.discountAmount || 0;
  const breakdown = orderState?.discountBreakdown || {};
  const directDiscount = breakdown.directDiscount || 0;
  const offerDiscount = breakdown.offerDiscount || 0;
  const coinDiscount = breakdown.coinDiscount || 0;
  const hasBreakdown = directDiscount > 0 || offerDiscount > 0 || coinDiscount > 0;
  const isCancelledOrder = orderState?.orderStatus === "Cancelled";

  // GST/Tax breakdown
  const gstBreakdown = orderState?.gstBreakdown || {};
  const cgst = gstBreakdown.cgst || 0;
  const sgst = gstBreakdown.sgst || 0;
  const igst = gstBreakdown.igst || 0;
  const cgstRate = gstBreakdown.cgstRate || 0;
  const sgstRate = gstBreakdown.sgstRate || 0;
  const igstRate = gstBreakdown.igstRate || 0;
  const gstType = gstBreakdown.gstType || "NONE";
  const taxIncluded = gstBreakdown.taxIncluded === true;
  const hasGST = cgst > 0 || sgst > 0 || igst > 0;
  const gstTotal = cgst + sgst + igst;

  // Shipping: read from stored gstBreakdown, fallback to 100 for online / 0 for offline
  const shippingCost = isOffline ? 0 : (gstBreakdown.shippingCharge ?? 0);

  // Always trust DB totalPriceAfterDiscount as the final amount
  const finalTotal = orderState?.totalPriceAfterDiscount || 0;

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "20px 24px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
        borderRadius: 20, padding: "22px 28px", marginBottom: 20, color: "#fff",
        boxShadow: "0 8px 28px rgba(55,48,163,0.22)",
      }}>
        <Row align="middle" justify="space-between" wrap>
          <Col>
            <Space size={14}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/admin/orders")}
                style={{
                  borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.35)",
                  color: "#fff", background: "rgba(255,255,255,0.1)",
                  fontWeight: 600, height: 38,
                }}
              >
                Back
              </Button>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Order Details</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "monospace", marginTop: 1 }}>
                  #{orderState?._id?.slice(-8).toUpperCase()}
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size={10}>
              <div style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                padding: "8px 16px", borderRadius: 20, fontWeight: 700, fontSize: 13,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {STATUS_CONFIG[orderState?.orderStatus]?.icon || <ClockCircleOutlined />}
                {orderState?.orderStatus}
              </div>
              <Tag
                color={orderState?.mode === "OFFLINE" ? "orange" : "green"}
                style={{ borderRadius: 10, padding: "5px 14px", fontWeight: 600, fontSize: 12 }}
              >
                {orderState?.mode || "ONLINE"}
              </Tag>
              {orderState?.orderStatus !== "Cancelled" && orderState?.orderStatus !== "Delivered" && (
                <Button
                  danger icon={<StopOutlined />}
                  style={{ borderRadius: 10, fontWeight: 600, height: 38 }}
                  onClick={() => { setCancelReason(""); setCancelModalOpen(true); }}
                >
                  Cancel Order
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Admin Cancel Order Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StopOutlined style={{ color: '#dc2626', fontSize: 20 }} />
            <span style={{ fontWeight: 700, fontSize: 16 }}>Cancel Order</span>
          </div>
        }
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalOpen(false)}>Keep Order</Button>,
          <Button
            key="submit"
            danger
            type="primary"
            disabled={!cancelReason.trim()}
            onClick={() => {
              dispatch(adminCancelAOrder({ id: orderId, cancelReason: cancelReason.trim() }));
              setCancelModalOpen(false);
            }}
          >
            Confirm Cancel
          </Button>
        ]}
      >
        <div style={{ marginBottom: 8, color: '#374151', fontSize: 14 }}>
          This will:
          <ul style={{ marginTop: 8, paddingLeft: 20, lineHeight: 2 }}>
            <li>Cancel the order and restore stock</li>
            <li>Reverse any purchase-reward coins earned on this order</li>
            <li>Reverse referrer coins earned from this order</li>
            <li>Add full purchase amount as coins to customer account (no money-back policy)</li>
            {orderState?.coinsUsed > 0 && <li>Refund {orderState.coinsUsed} coins used during payment</li>}
          </ul>
        </div>
        <Input.TextArea
          rows={3}
          placeholder="Enter cancel reason (required)"
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          style={{ borderRadius: 8 }}
        />
        {!cancelReason.trim() && (
          <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>Cancel reason is required</div>
        )}
      </Modal>

      <Row gutter={[24, 24]}>
        {/* Cancelled Order Info Banner */}
        {isCancelledOrder && (
          <Col span={24}>
            <Alert
              type="error"
              showIcon
              icon={<StopOutlined />}
              message={
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  Order Cancelled
                  {orderState?.cancelledAt && ` — ${dayjs(orderState.cancelledAt).format("DD MMM YYYY, HH:mm")}`}
                </span>
              }
              description={
                <div>
                  <div><strong>Reason:</strong> {orderState?.cancelReason || "No reason provided"}</div>
                  <div style={{ marginTop: 6, color: '#7c3aed', fontWeight: 600 }}>
                    🪙 ₹{orderState?.totalPriceAfterDiscount?.toFixed(2)} added as coins to customer account
                  </div>
                </div>
              }
              style={{ borderRadius: 12 }}
            />
          </Col>
        )}

        {/* Customer Information Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <UserOutlined style={{ color: "#fff", fontSize: 13 }} />
                </div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Customer</span>
              </div>
            }
            size="small"
            style={{ height: "100%", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}
          >
            <div style={{ padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Avatar size={48} style={{ background: "linear-gradient(135deg,#059669,#34d399)", fontSize: 18, fontWeight: "bold" }}>
                  {orderState?.user?.firstname?.charAt(0)?.toUpperCase() || "U"}
                </Avatar>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                    {orderState?.user?.firstname} {orderState?.user?.lastname}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748b", fontSize: 12, marginTop: 2 }}>
                    <MailOutlined /> {orderState?.user?.email || "N/A"}
                  </div>
                </div>
              </div>
              <Divider style={{ margin: "12px 0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <PhoneOutlined style={{ color: "#059669" }} />
                <Text strong>{orderState?.user?.mobile || "N/A"}</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <EnvironmentOutlined style={{ color: "#f59e0b" }} />
                <Text style={{ color: "#64748b" }}>{orderState?.shippingInfo?.city}, {orderState?.shippingInfo?.state}</Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Order Timeline Card */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ThunderboltOutlined style={{ color: "#fff", fontSize: 13 }} />
                </div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Order Timeline</span>
              </div>
            }
            size="small"
            style={{ height: "100%", borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}
          >
            <div style={{ padding: '20px' }}>
              <Steps
                current={statusOrder.indexOf(orderState?.orderStatus)}
                direction="horizontal"
                size="small"
                style={{ marginBottom: '24px' }}
              >
                {statusOrder.map((status, index) => {
                  const isCompleted = index <= statusOrder.indexOf(orderState?.orderStatus);
                  const isCurrent = index === statusOrder.indexOf(orderState?.orderStatus);

                  return (
                    <Step
                      key={status}
                      title={
                        <span style={{
                          fontSize: '12px',
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCompleted ? '#52c41a' : isCurrent ? '#1890ff' : '#d9d9d9'
                        }}>
                          {status}
                        </span>
                      }
                      icon={
                        <div style={{
                          background: isCompleted ? 'linear-gradient(135deg, #52c41a 0%, #38f9d7 100%)' :
                                     isCurrent ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' :
                                     '#f0f0f0',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          boxShadow: isCompleted || isCurrent ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                        }}>
                          {getStatusIcon(status)}
                        </div>
                      }
                    />
                  );
                })}
              </Steps>

              <Timeline
                mode="left"
                style={{ paddingLeft: '20px' }}
              >
                {timelineStatuses.map((item, index) => (
                  <Timeline.Item
                    key={index}
                    color={item.color}
                    dot={
                      <div style={{
                        background: item.color === 'green' ? 'linear-gradient(135deg, #52c41a 0%, #38f9d7 100%)' :
                                   item.color === 'blue' ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)' :
                                   item.color === 'red' ? 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' :
                                   '#d9d9d9',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.dot}
                      </div>
                    }
                  >
                    <div style={{
                      background: 'rgba(255,255,255,0.8)',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      {item.children}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </Card>
        </Col>

        {/* Shipping Address Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EnvironmentOutlined style={{ color: "#fff", fontSize: 13 }} />
                </div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Shipping Address</span>
              </div>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}
          >
            {orderState?.shippingInfo ? (
              <div style={{ padding: '16px 0' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #bae7ff'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '12px'
                  }}>
                    📍 Delivery Address
                  </div>
                  <div style={{ lineHeight: '1.6', color: '#666' }}>
                    {orderState.shippingInfo.address}<br />
                    {orderState.shippingInfo.city}, {orderState.shippingInfo.state} - {orderState.shippingInfo.pincode}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#999'
              }}>
                <EnvironmentOutlined style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
                <div>No shipping address available</div>
              </div>
            )}
          </Card>
        </Col>

        {/* Payment Information Card */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CreditCardOutlined style={{ color: "#fff", fontSize: 13 }} />
                </div>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>Payment Information</span>
              </div>
            }
            size="small"
            style={{ borderRadius: 16, boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb" }}
          >
            <div style={{ padding: '16px 0' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={<span style={{ color: '#666', fontSize: '12px' }}>Payment Method</span>}
                    value={
                      orderState?.paymentDestination === "CASH"
                        ? "💵 Cash"
                        : orderState?.paymentDestination === "OTHER_ACCOUNT"
                        ? "🏦 Online (Other Account)"
                        : "💳 Online (Current Account)"
                    }
                    valueStyle={{
                      color: orderState?.paymentDestination === "CASH" ? '#fa8c16' : orderState?.paymentDestination === "OTHER_ACCOUNT" ? '#7c3aed' : '#52c41a',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<span style={{ color: '#666', fontSize: '12px' }}>Transaction ID</span>}
                    value={orderState?.paymentInfo?.razorpayPaymentId || "N/A"}
                    valueStyle={{
                      color: '#1890ff',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}
                  />
                </Col>
                <Col span={24}>
                  <div style={{
                    background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #b7eb8f'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#389e0d'
                    }}>
                      <ClockCircleOutlined />
                      Order Date: {dayjs(orderState?.createdAt).format("DD MMM YYYY, HH:mm")}
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Order Items Table */}
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShopOutlined style={{ color: "#fff", fontSize: 13 }} />
            </div>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>Order Items</span>
            <Badge count={orderState?.orderItems?.length || 0} style={{ background: "#6366f1" }} />
          </div>
        }
        style={{
          marginTop: 16, borderRadius: 16,
          boxShadow: "0 1px 8px rgba(0,0,0,0.07)", border: "1px solid #e5e7eb",
        }}
        extra={
          <Button
            icon={<PrinterOutlined />}
            onClick={printBill}
            style={{ borderRadius: 8, border: "1.5px solid #6366f1", color: "#6366f1", fontWeight: 600 }}
          >
            Print Bill
          </Button>
        }
      >
        <Table
          columns={productColumns}
          dataSource={data1}
          pagination={false}
          size="middle"
          style={{ borderRadius: '12px' }}
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <DollarOutlined />
                    Subtotal
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right">
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1a1a1a'
                  }}>
                    ₹{subtotal.toFixed(2)}
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>

              {!isOffline && (
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6}>
                  <div style={{
                    color: '#6b7280',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🚚 Shipping
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right">
                  <div style={{
                    color: shippingCost === 0 ? '#16a34a' : '#6b7280',
                    fontWeight: 600
                  }}>
                    {shippingCost === 0 ? 'Free' : `₹${shippingCost.toFixed(2)}`}
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              )}

              {hasBreakdown ? (
                <>
                  {directDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <div style={{
                          color: '#52c41a',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🏷️ Direct Discount
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <div style={{
                          color: '#52c41a',
                          fontWeight: 600
                        }}>
                          -₹{directDiscount.toFixed(2)}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {offerDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <div style={{
                          color: '#fa8c16',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🎁 User Offer Discount
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <div style={{
                          color: '#fa8c16',
                          fontWeight: 600
                        }}>
                          -₹{offerDiscount.toFixed(2)}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {coinDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <div style={{
                          color: '#722ed1',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          🪙 Coin Discount ({orderState?.coinsUsed || coinDiscount} coins)
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <div style={{
                          color: '#722ed1',
                          fontWeight: 600
                        }}>
                          -₹{coinDiscount.toFixed(2)}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {discount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <div style={{
                          color: '#cf1322',
                          fontWeight: 700,
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          💰 Total Discount
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <div style={{
                          color: '#cf1322',
                          fontWeight: 700,
                          fontSize: '16px'
                        }}>
                          -₹{discount.toFixed(2)}
                        </div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                </>
              ) : (
                discount > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={6}>
                      <div style={{
                        color: '#52c41a',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        💰 Discount
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <div style={{
                        color: '#52c41a',
                        fontWeight: 600
                      }}>
                        -₹{discount.toFixed(2)}
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              )}

              {/* GST/Tax Breakdown — taxIncluded = already in price, else added on top */}
              {hasGST && (
                taxIncluded ? (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={7}>
                      <div style={{ background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 10, padding: '10px 14px', margin: '4px 0' }}>
                        <div style={{ color: '#15803d', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                          ✅ GST included in price — no extra charge to customer
                        </div>
                        {gstType === "CGST_SGST" && cgst > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', marginBottom: 3 }}>
                            <span>🏛️ CGST ({cgstRate}%) — included in price</span>
                            <span>₹{cgst.toFixed(2)}</span>
                          </div>
                        )}
                        {gstType === "CGST_SGST" && sgst > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a', marginBottom: 3 }}>
                            <span>🏛️ SGST ({sgstRate}%) — included in price</span>
                            <span>₹{sgst.toFixed(2)}</span>
                          </div>
                        )}
                        {gstType === "IGST" && igst > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#16a34a' }}>
                            <span>🌐 IGST ({igstRate}%) — included in price</span>
                            <span>₹{igst.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#15803d', fontWeight: 700, marginTop: 6, borderTop: '1px solid #bbf7d0', paddingTop: 6 }}>
                          <span>💼 Total GST (included)</span>
                          <span>₹{gstTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                ) : (
                  <>
                    {gstType === "CGST_SGST" && cgst > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell colSpan={6}>
                          <div style={{ color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏛️ CGST ({cgstRate}%)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <div style={{ color: '#ea580c', fontWeight: 600 }}>+₹{cgst.toFixed(2)}</div>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {gstType === "CGST_SGST" && sgst > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell colSpan={6}>
                          <div style={{ color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🏛️ SGST ({sgstRate}%)
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <div style={{ color: '#ea580c', fontWeight: 600 }}>+₹{sgst.toFixed(2)}</div>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {gstType === "IGST" && igst > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell colSpan={6}>
                          <div style={{ color: '#ea580c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🌐 IGST ({igstRate}%) — Inter-state
                          </div>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <div style={{ color: '#ea580c', fontWeight: 600 }}>+₹{igst.toFixed(2)}</div>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <div style={{ color: '#722ed1', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          💼 Total GST
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <div style={{ color: '#722ed1', fontWeight: 700, fontSize: 15 }}>+₹{gstTotal.toFixed(2)}</div>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </>
                )
              )}

              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#1890ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🏆 Total Amount
                  </div>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right">
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#1890ff',
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    ₹{finalTotal.toFixed(2)}
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default ViewOrder;
