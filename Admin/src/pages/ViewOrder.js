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
        ? [
            order.shippingInfo.address,
            order.shippingInfo.other,
            order.shippingInfo.city,
            order.shippingInfo.state,
            order.shippingInfo.pincode ? `- ${order.shippingInfo.pincode}` : null,
          ].filter(Boolean).join(", ")
        : "N/A";
      const itemRows = order.orderItems.map((item, i) => {
        const title = item.isBundle ? (item.bundleTitle || "Bundle") : (item.product?.title || "Product");
        const hsn = item.hsnCode || item.product?.hsnCode || "-";
        const qty = item.quantity; const rate = item.price; const amt = qty * rate;
        const colorName = item.color ? (item.color?.title || item.color?.name || null) : null;
        const sizeName = item.size || null;
        const metaParts = [colorName, sizeName ? `Size: ${sizeName}` : null].filter(Boolean).join(" · ");
        return `<tr>
          <td style="color:#888">${i+1}</td>
          <td>
            <span class="item-title">${title}</span>
            ${item.isFreeItem ? '<span class="badge free-badge">FREE</span>' : ""}
            ${metaParts ? `<div class="item-meta">${metaParts}</div>` : ""}
          </td>
          <td style="font-family:monospace;font-size:11px;color:#888">${hsn}</td>
          <td style="text-align:center;font-weight:600">${qty}</td>
          <td style="text-align:right;color:#565959">${item.isFreeItem ? "FREE" : "\u20b9"+rate.toFixed(2)}</td>
          <td style="text-align:right;font-weight:800;color:#131921">${item.isFreeItem ? "FREE" : "\u20b9"+amt.toFixed(2)}</td>
        </tr>`;
      }).join("");
      const gstRows = gstTotal > 0 ? (taxIncluded
        ? `<div class="summary-row gst"><span>✅ GST (included in price)</span><span>₹${gstTotal.toFixed(2)}</span></div>`
        : (gstType === "CGST_SGST"
          ? `<div class="summary-row gst"><span>CGST (${cgstRate}%)</span><span>+₹${cgst.toFixed(2)}</span></div><div class="summary-row gst"><span>SGST (${sgstRate}%)</span><span>+₹${sgst.toFixed(2)}</span></div>`
          : `<div class="summary-row gst"><span>IGST (${igstRate}%)</span><span>+₹${igst.toFixed(2)}</span></div>`)
      ) : "";
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${invoiceNum}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px 12px;color:#111}
.wrap{max-width:700px;margin:0 auto;background:#fff;border:1px solid #ddd}
/* Header */
.hdr{padding:20px 24px 16px;border-bottom:2px solid #e7e7e7;display:flex;justify-content:space-between;align-items:flex-start}
.store-name{font-size:20px;font-weight:800;color:#0f1111}
.store-info{font-size:11px;color:#565959;margin-top:3px;line-height:1.6}
.inv-block{text-align:right}
.inv-title{font-size:11px;font-weight:700;color:#565959;text-transform:uppercase;letter-spacing:1px}
.inv-num{font-size:15px;font-weight:800;color:#0f1111;font-family:monospace;margin-top:2px}
.inv-date{font-size:11px;color:#565959;margin-top:2px}
/* Status strip */
.status-strip{padding:10px 24px;font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px;border-bottom:1px solid #e7e7e7}
/* Addresses */
.addr-row{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid #e7e7e7}
.addr-box{padding:14px 24px}
.addr-label{font-size:10px;font-weight:800;color:#565959;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.addr-name{font-size:13px;font-weight:700;color:#0f1111}
.addr-text{font-size:12px;color:#565959;margin-top:3px;line-height:1.6}
/* Items */
table{width:100%;border-collapse:collapse}
thead tr{background:#f3f3f3;border-top:1px solid #e7e7e7;border-bottom:2px solid #e7e7e7}
thead th{padding:10px 14px;font-size:11px;font-weight:700;color:#0f1111;text-transform:uppercase;letter-spacing:0.4px}
tbody tr{border-bottom:1px solid #f0f0f0}
tbody td{padding:12px 14px;font-size:13px;vertical-align:top}
.item-name{font-weight:700;color:#0f1111;font-size:13px}
.item-meta{font-size:11px;color:#888;margin-top:2px}
.badge{display:inline-block;font-size:9px;font-weight:800;padding:2px 7px;border-radius:3px;margin-left:5px;vertical-align:middle}
.free-badge{background:#e6f4ea;color:#1a7340}
/* Summary */
.summary-wrap{display:flex;justify-content:flex-end;border-top:2px solid #e7e7e7}
.summary-table{width:280px;padding:16px 24px}
.s-row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;color:#333}
.s-row.disc{color:#b12704}
.s-row.gst{color:#007600}
.s-row.ship{color:#007600}
.s-divider{border-top:2px solid #0f1111;margin:8px 0}
.s-total{display:flex;justify-content:space-between;padding:6px 0;font-size:16px;font-weight:800;color:#0f1111}
/* Payment strip */
.pay-strip{background:#f3f3f3;padding:12px 24px;display:flex;gap:28px;border-top:1px solid #e7e7e7;flex-wrap:wrap}
.pay-block .lbl{font-size:10px;font-weight:700;color:#565959;text-transform:uppercase;letter-spacing:0.8px}
.pay-block .val{font-size:12px;font-weight:700;color:#0f1111;margin-top:2px;font-family:monospace}
/* Footer */
.ftr{background:#0f1111;padding:14px 24px;text-align:center}
.ftr-text{font-size:12px;color:#ccc;font-weight:600}
.ftr-note{font-size:10px;color:#777;margin-top:3px}
.no-print{padding:14px;text-align:center;background:#fff;border-top:1px solid #e7e7e7}
@media print{body{background:#fff;padding:0}.wrap{border:none;max-width:100%}.no-print{display:none}}
</style></head><body>
<div class="wrap">
  <div class="hdr">
    <div>
      <div class="store-name">${storeName}</div>
      <div class="store-info">${storeAddress ? storeAddress+'<br>' : ''}${storePhone ? '📞 '+storePhone : ''}${gstin ? '<br>GSTIN: '+gstin : ''}</div>
    </div>
    <div class="inv-block">
      <div class="inv-title">Tax Invoice</div>
      <div class="inv-num">#${invoiceNum}</div>
      <div class="inv-date">${dateStr}</div>
    </div>
  </div>

  <div class="status-strip" style="background:${order.orderStatus==='Delivered'?'#f0fdf4':order.orderStatus==='Cancelled'?'#fef2f2':'#fffbeb'};color:${order.orderStatus==='Delivered'?'#15803d':order.orderStatus==='Cancelled'?'#dc2626':'#92400e'}">
    <span>${order.orderStatus==='Delivered'?'✅':order.orderStatus==='Cancelled'?'❌':'📦'}</span>
    <span>Status: ${order.orderStatus}</span>
    ${order.trackingId ? `<span style="margin-left:auto;font-size:11px">🚚 ${order.trackingId}${order.courierName?' · '+order.courierName:''}</span>` : ''}
  </div>

  <div class="addr-row">
    <div class="addr-box" style="border-right:1px solid #e7e7e7">
      <div class="addr-label">Sold By</div>
      <div class="addr-name">${storeName}</div>
      <div class="addr-text">${storeAddress || 'N/A'}</div>
    </div>
    <div class="addr-box">
      <div class="addr-label">Ship To</div>
      <div class="addr-name">${customerName}</div>
      <div class="addr-text">${shippingAddr}${order.user?.mobile ? '<br>📞 '+order.user.mobile : ''}</div>
    </div>
  </div>

  <table>
    <thead><tr>
      <th style="text-align:left;width:36px">#</th>
      <th style="text-align:left">Product</th>
      <th style="text-align:left;width:64px">HSN</th>
      <th style="text-align:center;width:44px">Qty</th>
      <th style="text-align:right;width:76px">Rate</th>
      <th style="text-align:right;width:84px">Amount</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="summary-wrap">
    <div class="summary-table">
      <div class="s-row"><span>Subtotal (${order.orderItems.length} item${order.orderItems.length>1?'s':''})</span><span>₹${subtotal.toFixed(2)}</span></div>
      ${shipping > 0 ? `<div class="s-row ship"><span>🚚 Delivery Charges</span><span>+₹${shipping.toFixed(2)}</span></div>` : `<div class="s-row ship"><span>🚚 Delivery</span><span style="color:#007600;font-weight:700">FREE</span></div>`}
      ${breakdown.directDiscount > 0 ? `<div class="s-row disc"><span>🏷️ Direct Discount</span><span>-₹${breakdown.directDiscount.toFixed(2)}</span></div>` : ''}
      ${breakdown.offerDiscount > 0 ? `<div class="s-row disc"><span>🎁 Offer Discount</span><span>-₹${breakdown.offerDiscount.toFixed(2)}</span></div>` : ''}
      ${breakdown.couponDiscount > 0 ? `<div class="s-row disc"><span>🏷️ Coupon Discount${order.couponCode ? ' (' + order.couponCode + ')' : ''}</span><span>-₹${breakdown.couponDiscount.toFixed(2)}</span></div>` : ''}
      ${breakdown.coinDiscount > 0 ? `<div class="s-row" style="color:#7c3aed"><span>🪙 Coins Redeemed (${order.coinsUsed || breakdown.coinDiscount} coins)</span><span>-₹${breakdown.coinDiscount.toFixed(2)}</span></div>` : ''}
      ${!breakdown.directDiscount && !breakdown.offerDiscount && !breakdown.coinDiscount && discount > 0 ? `<div class="s-row disc"><span>💰 Discount</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
      ${discount > 0 ? `<div class="s-row disc" style="font-weight:700"><span>Total Savings</span><span>-₹${discount.toFixed(2)}</span></div>` : ''}
      ${gstRows}
      <div class="s-divider"></div>
      <div class="s-total"><span>Total</span><span>₹${finalTotal.toFixed(2)}</span></div>
    </div>
  </div>

  <div class="pay-strip">
    <div class="pay-block"><div class="lbl">Payment</div><div class="val">${order.paymentDestination === 'CASH' ? 'Cash on Delivery' : order.paymentDestination === 'OTHER_ACCOUNT' ? 'Online (Other)' : 'Online Payment'}</div></div>
    ${order.paymentInfo?.razorpayPaymentId ? `<div class="pay-block"><div class="lbl">Txn ID</div><div class="val">${order.paymentInfo.razorpayPaymentId}</div></div>` : ''}
    ${order.trackingId ? `<div class="pay-block"><div class="lbl">Tracking</div><div class="val">${order.trackingId}</div></div>` : ''}
  </div>

  <div class="ftr">
    <div class="ftr-text">Thank you for shopping with ${storeName}!</div>
    <div class="ftr-note">Computer-generated invoice · No signature required</div>
  </div>

  <div class="no-print">
    <button onclick="window.print()" style="background:#ff9900;color:#0f1111;border:none;padding:10px 32px;border-radius:6px;font-size:14px;font-weight:800;cursor:pointer">🖨️ Print Invoice</button>
  </div>
</div>
</body></html>`);
      win.document.close();
      win.print();
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
      title: "Color & Size",
      dataIndex: "color",
      render: (color, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {color ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: getColorSwatch(color), border: "1px solid #d9d9d9", flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{getReadableColorName(color)}</span>
            </div>
          ) : null}
          {record.size ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ background: "#f0f0ff", color: "#4338ca", fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 6, border: "1.5px solid #c7d2fe", letterSpacing: 0.5 }}>
                Size: {record.size}
              </span>
            </div>
          ) : null}
          {!color && !record.size && <span style={{ color: "#ccc" }}>—</span>}
        </div>
      ),
    },
    {
      title: "Qty",
      dataIndex: "count",
      align: "center",
      render: (qty) => (
        <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{qty}</span>
      ),
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
        size: item?.size || null,
        count: item?.quantity,
        amount: item?.price,
        total: (item?.price || 0) * (item?.quantity || 0),
        image: product?.images?.[0]?.url || product?.images?.[0] || null,
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
  const couponDiscount = breakdown.couponDiscount || 0;
  const couponCode     = orderState?.couponCode || null;
  const hasBreakdownAny = hasBreakdown || couponDiscount > 0;
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
    <div style={{ background: "#f0f2f5", minHeight: "100vh", padding: "clamp(8px, 2vw, 24px)" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)",
        borderRadius: 20, padding: "clamp(14px, 3vw, 22px) clamp(14px, 4vw, 28px)", marginBottom: 16, color: "#fff",
        boxShadow: "0 8px 28px rgba(55,48,163,0.22)",
      }}>
        <Row align="middle" justify="space-between" wrap gutter={[0, 12]}>
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
          scroll={{ x: "max-content" }}
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

              {hasBreakdownAny ? (
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
                  {couponDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ color: '#be185d', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            🏷️ Coupon Discount
                          </div>
                          {couponCode && <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#be185d', fontWeight: 700, letterSpacing: 1 }}>{couponCode}</span>}
                        </div>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <div style={{ color: '#be185d', fontWeight: 700 }}>-₹{couponDiscount.toFixed(2)}</div>
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
                      <div style={{ color: '#52c41a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💰 Discount
                      </div>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <div style={{ color: '#52c41a', fontWeight: 600 }}>-₹{discount.toFixed(2)}</div>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              )}

              {/* Total Savings Banner */}
              {(offerDiscount + couponDiscount + coinDiscount + directDiscount) > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={7}>
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#15803d', fontSize: 13 }}>🎉 Total Customer Savings</span>
                        <span style={{ fontWeight: 800, color: '#15803d', fontSize: 15 }}>−₹{(offerDiscount + couponDiscount + coinDiscount + directDiscount).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {offerDiscount > 0 && <span style={{ fontSize: 11, background: '#fff', color: '#15803d', padding: '2px 8px', borderRadius: 20, border: '1px solid #86efac' }}>🎁 Offer ₹{offerDiscount.toFixed(2)}</span>}
                        {couponDiscount > 0 && <span style={{ fontSize: 11, background: '#fff', color: '#be185d', padding: '2px 8px', borderRadius: 20, border: '1px solid #f9a8d4' }}>🏷️ Coupon{couponCode ? ` (${couponCode})` : ''} ₹{couponDiscount.toFixed(2)}</span>}
                        {coinDiscount > 0 && <span style={{ fontSize: 11, background: '#fff', color: '#7c3aed', padding: '2px 8px', borderRadius: 20, border: '1px solid #ddd6fe' }}>🪙 Coins ₹{coinDiscount.toFixed(2)}</span>}
                        {directDiscount > 0 && <span style={{ fontSize: 11, background: '#fff', color: '#0369a1', padding: '2px 8px', borderRadius: 20, border: '1px solid #bae6fd' }}>💰 Direct ₹{directDiscount.toFixed(2)}</span>}
                      </div>
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
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
