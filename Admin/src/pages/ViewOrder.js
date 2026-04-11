import React, { useEffect } from "react";
import {
  Card, Row, Col, Tag, Button, Divider, Descriptions, Timeline,
  Space, Alert, Typography, Progress, Avatar, List, Table,
  Badge, Steps, Statistic
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined, HomeOutlined, UserOutlined, CreditCardOutlined,
  ShopOutlined, CarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, PhoneOutlined, MailOutlined, GlobalOutlined,
  PrinterOutlined, RocketOutlined, EnvironmentOutlined, DollarOutlined,
  ThunderboltOutlined, GiftOutlined, StarOutlined, SyncOutlined,
  ShoppingOutlined, CloseCircleOutlined
} from "@ant-design/icons";
import { getaOrder } from "../features/auth/authSlice";
import dayjs from "dayjs";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

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
  const statusOrder = ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const currentIndex = statusOrder.indexOf(order.orderStatus);

  return statusOrder.map((status, index) => {
    const isCompleted = index <= currentIndex;
    const isCurrent = index === currentIndex;
    const isCancelled = order.orderStatus === "Cancelled";

    let color = "gray";
    if (isCancelled && status === "Cancelled") color = "red";
    else if (isCompleted) color = "green";
    else if (isCurrent) color = "blue";

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

  const timelineStatuses = getTimelineItems(orderState?.orderStatus);

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
      render: (price) => `₹${price?.toFixed(2)}`,
    },
    {
      title: "Total",
      dataIndex: "total",
      align: "right",
      render: (total) => <strong>₹{total?.toFixed(2)}</strong>,
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
      });
    } else {
      data1.push({
        key: i + 1,
        product: product?.title || "N/A",
        brand: product?.brand || "N/A",
        barcode: product?.barcode || "N/A",
        color: item?.color,
        count: item?.quantity,
        amount: item?.price,
        total: (item?.price || 0) * (item?.quantity || 0),
        image: product?.images?.[0] || null,
        isBundle: false,
      });
    }
  }

  const subtotal = orderState?.totalPrice || 0;
  const discount = orderState?.discountAmount || ((orderState?.totalPrice || 0) - (orderState?.totalPriceAfterDiscount || 0));
  const breakdown = orderState?.discountBreakdown || {};
  const directDiscount = breakdown.directDiscount || 0;
  const offerDiscount = breakdown.offerDiscount || 0;
  const coinDiscount = breakdown.coinDiscount || 0;
  const hasBreakdown = directDiscount > 0 || offerDiscount > 0 || coinDiscount > 0;

  // GST/Tax breakdown
  const gstBreakdown = orderState?.gstBreakdown || {};
  const cgst = gstBreakdown.cgst || 0;
  const sgst = gstBreakdown.sgst || 0;
  const igst = gstBreakdown.igst || 0;
  const cgstRate = gstBreakdown.cgstRate || 0;
  const sgstRate = gstBreakdown.sgstRate || 0;
  const igstRate = gstBreakdown.igstRate || 0;
  const gstType = gstBreakdown.gstType || "NONE";
  const taxableAmount = gstBreakdown.taxableAmount || 0;
  const hasGST = cgst > 0 || sgst > 0 || igst > 0;

  const shippingCost = 100; // Fixed shipping cost as per checkout logic
  const gstTotal = cgst + sgst + igst;
  const finalTotal = orderState?.totalPriceAfterDiscount || 0;

  return (
    <div style={{
        background: `linear-gradient(135deg, ${COLORS.neutral[50]} 0%, ${COLORS.neutral[100]} 50%, ${COLORS.neutral[200]} 100%)`,
        minHeight: '100vh',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden'
    }}>
        {/* Premium Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill-rule="evenodd"%3E%3Cg fill="%230F172A" fill-opacity="0.01"%3E%3Cpath d="M100 0c55.228 0 100 44.772 100 100s-44.772 100-100 100S0 155.228 0 100 44.772 0 100 0zm50 100c0 27.614-22.386 50-50 50s-50-22.386-50-50 22.386-50 50-50 50 22.386 50 50z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.3,
          zIndex: 0
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Modern Header */}
      <div style={{
        background: COLORS.glass.light,
        backdropFilter: COLORS.glass.backdrop,
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: COLORS.primary.glow,
        border: `1px solid ${COLORS.glass.border}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230F172A" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.5
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/admin/orders")}
                size="large"
                style={{
                  borderRadius: '12px',
                  border: '2px solid #667eea',
                  color: '#667eea',
                  fontWeight: 600
                }}
              >
                Back to Orders
              </Button>
              <div>
                <Title level={3} style={{
                  margin: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700
                }}>
                  Order Details
                </Title>
                <Text style={{
                  color: '#666',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  fontWeight: 600
                }}>
                  #{orderState?._id?.slice(-8).toUpperCase()}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <div style={{
                background: STATUS_CONFIG[orderState?.orderStatus]?.gradient || STATUS_CONFIG.All.gradient,
                color: 'white',
                padding: '12px 20px',
                borderRadius: '25px',
                fontWeight: 700,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}>
                {STATUS_CONFIG[orderState?.orderStatus]?.icon || <ClockCircleOutlined />}
                {orderState?.orderStatus}
              </div>
              <Tag
                color={orderState?.mode === "OFFLINE" ? "orange" : "green"}
                style={{
                  borderRadius: '12px',
                  padding: '6px 16px',
                  fontWeight: 600,
                  fontSize: '12px'
                }}
              >
                {orderState?.mode || "ONLINE"}
              </Tag>
            </Space>
          </Col>
        </Row>
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* Customer Information Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  size={32}
                  style={{ background: COLORS.primary.gradient }}
                  icon={<UserOutlined />}
                />
                <span style={{ fontWeight: 600 }}>Customer Information</span>
              </div>
            }
            size="small"
            style={{
              height: "100%",
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            headStyle={{
              background: COLORS.primary.gradient,
              color: 'white',
              borderRadius: '16px 16px 0 0'
            }}
          >
            <div style={{ padding: '16px 0' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <Avatar
                  size={48}
                  style={{
                    background: COLORS.secondary.gradient,
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  {orderState?.user?.firstname?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: '4px'
                  }}>
                    {orderState?.user?.firstname} {orderState?.user?.lastname}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#666',
                    fontSize: '12px'
                  }}>
                    <MailOutlined /> {orderState?.user?.email || "N/A"}
                  </div>
                </div>
              </div>

              <Divider style={{ margin: '16px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <PhoneOutlined style={{ color: '#52c41a' }} />
                <Text strong>{orderState?.user?.mobile || "N/A"}</Text>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EnvironmentOutlined style={{ color: '#fa8c16' }} />
                <Text style={{ color: '#666' }}>
                  {orderState?.shippingInfo?.city}, {orderState?.shippingInfo?.state}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* Order Timeline Card */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  size={32}
                  style={{ background: COLORS.accent.blue }}
                  icon={<ThunderboltOutlined />}
                />
                <span style={{ fontWeight: 600 }}>Order Timeline</span>
              </div>
            }
            size="small"
            style={{
              height: "100%",
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            headStyle={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: '16px 16px 0 0'
            }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  size={32}
                  style={{ background: COLORS.accent.orange }}
                  icon={<EnvironmentOutlined />}
                />
                <span style={{ fontWeight: 600 }}>Shipping Address</span>
              </div>
            }
            size="small"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            headStyle={{
              background: COLORS.accent.orange,
              color: 'white',
              borderRadius: '16px 16px 0 0'
            }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar
                  size={32}
                  style={{ background: COLORS.secondary.main }}
                  icon={<CreditCardOutlined />}
                />
                <span style={{ fontWeight: 600 }}>Payment Information</span>
              </div>
            }
            size="small"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
            headStyle={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: '16px 16px 0 0'
            }}
          >
            <div style={{ padding: '16px 0' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title={<span style={{ color: '#666', fontSize: '12px' }}>Payment Method</span>}
                    value={orderState?.paymentInfo?.razorpayOrderId === "OFFLINE" ? "Offline/Cash" : "Online"}
                    valueStyle={{
                      color: orderState?.paymentInfo?.razorpayOrderId === "OFFLINE" ? '#fa8c16' : '#52c41a',
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

      {/* Enhanced Product Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar
              size={32}
              style={{ background: COLORS.accent.purple }}
              icon={<ShopOutlined />}
            />
            <span style={{ fontWeight: 600 }}>Order Items</span>
            <Badge
              count={orderState?.orderItems?.length || 0}
              style={{
                background: COLORS.primary.gradient,
                boxShadow: `0 2px 8px rgba(26, 54, 93, 0.3)`
              }}
            />
          </div>
        }
        style={{
          marginTop: '24px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
          borderRadius: '16px 16px 0 0'
        }}
        extra={
          <Button
            icon={<PrinterOutlined />}
            style={{
              borderRadius: '8px',
              border: '2px solid #667eea',
              color: '#667eea',
              fontWeight: 600
            }}
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
                    color: '#6b7280',
                    fontWeight: 600
                  }}>
                    ₹100.00
                  </div>
                </Table.Summary.Cell>
              </Table.Summary.Row>

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

              {/* GST/Tax Breakdown */}
              {hasGST && gstType === "CGST_SGST" && cgst > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={6}>
                    <div style={{
                      color: '#16a34a',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏛️ CGST ({cgstRate}%)
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <div style={{
                      color: '#16a34a',
                      fontWeight: 600
                    }}>
                      +₹{cgst.toFixed(2)}
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              {hasGST && gstType === "CGST_SGST" && sgst > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={6}>
                    <div style={{
                      color: '#16a34a',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🏛️ SGST ({sgstRate}%)
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <div style={{
                      color: '#16a34a',
                      fontWeight: 600
                    }}>
                      +₹{sgst.toFixed(2)}
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              {hasGST && gstType === "IGST" && igst > 0 && (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={6}>
                    <div style={{
                      color: '#ea580c',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🌐 IGST ({igstRate}%) — Inter-state
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <div style={{
                      color: '#ea580c',
                      fontWeight: 600
                    }}>
                      +₹{igst.toFixed(2)}
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
              {hasGST && (
                <Table.Summary.Row>
                  <Table.Summary.Cell colSpan={6}>
                    <div style={{
                      color: '#722ed1',
                      fontWeight: 700,
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💼 Total GST
                    </div>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell align="right">
                    <div style={{
                      color: '#722ed1',
                      fontWeight: 700,
                      fontSize: '16px'
                    }}>
                      +₹{(cgst + sgst + igst).toFixed(2)}
                    </div>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
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
    </div>
  );
};

export default ViewOrder;
