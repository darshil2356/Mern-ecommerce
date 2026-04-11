import React, { useEffect, useState, useMemo } from "react";
import {
  Table, Button, Select, Tag, message, Card, Row, Col, Statistic,
  Space, Tooltip, Input, DatePicker, Badge, Avatar, Dropdown, Progress,
  Divider, Typography
} from "antd";
import {
  FilterOutlined, EyeOutlined, PrinterOutlined, RocketOutlined,
  SearchOutlined, CalendarOutlined, DollarOutlined, ShoppingOutlined,
  CarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  SyncOutlined, DownloadOutlined, MoreOutlined, UserOutlined, PhoneOutlined,
  MailOutlined, EnvironmentOutlined, CreditCardOutlined, ThunderboltOutlined
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getOrders, updateAOrder } from "../features/auth/authSlice";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import axios from "axios";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

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

const LOCKED_STATUSES = ["Shipped", "Out for Delivery", "Delivered"];

const Orders = () => {
  const dispatch = useDispatch();
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  // State management
  const [activeStatus, setActiveStatus] = useState("All");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await dispatch(updateAOrder({ id: orderId, status: newStatus })).unwrap();
      message.success(`Order status updated to ${newStatus}`);
      dispatch(getOrders()); // Refresh data
    } catch (error) {
      message.error("Failed to update order status");
    }
  };

  // Bulk shipment creation
  const handleBulkShipment = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Please select orders to create shipments");
      return;
    }

    setBulkLoading(true);
    try {
      const response = await axios.put(`${base_url}orders/bulk-create-shipment`, {
        orderIds: selectedRowKeys
      }, config);

      const { results } = response.data;
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        message.success(`${successCount} shipment(s) created successfully${failCount > 0 ? `, ${failCount} failed` : ''}`);
      }

      setSelectedRowKeys([]);
      dispatch(getOrders());
    } catch (error) {
      message.error("Bulk shipment creation failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Print order bill
  const printOrderBill = async (orderId) => {
    try {
      const response = await axios.get(`${base_url}user/getaOrder/${orderId}`, config);
      const order = response.data.orders;

      const invoiceNum = order._id.slice(-8).toUpperCase();
      const now = new Date(order.createdAt);
      const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      const customerName = order.user ? `${order.user.firstname || ''} ${order.user.lastname || ''}`.trim() : "Walk-in Customer";
      const customerMobile = order.user ? order.user.mobile : "";
      const subtotal = order.totalPrice;
      const discountAmount = order.discountAmount || 0;
      const totalAmount = order.totalPriceAfterDiscount;

      const win = window.open("", "_blank");
      if (!win) return;

      win.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${invoiceNum}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>* { font-family: 'Segoe UI', sans-serif; } @media print { body { -webkit-print-color-adjust: exact; } }</style>
        </head><body class="bg-gray-50 p-4">
        <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6">
          <h1 class="text-2xl font-bold">PREMIUM STORE</h1>
          <p class="text-blue-200 text-sm">Invoice: ${invoiceNum} | Date: ${dateStr} ${timeStr}</p>
        </div>
        <div class="p-6">
          <p><strong>Bill To:</strong> ${customerName} ${customerMobile ? `| ${customerMobile}` : ''}</p>
          <table class="w-full text-sm mt-4 border-collapse">
            <thead><tr class="bg-blue-50"><th class="p-2 text-left">#</th><th class="p-2 text-left">Item</th><th class="p-2 text-center">Qty</th><th class="p-2 text-right">Rate</th><th class="p-2 text-right">Amount</th></tr></thead>
            <tbody>${order.orderItems.map((item, i) => `<tr class="border-b"><td class="p-2">${i+1}</td><td class="p-2">${item.product ? item.product.title : 'Product'}</td><td class="p-2 text-center">${item.quantity}</td><td class="p-2 text-right">₹${item.price.toFixed(2)}</td><td class="p-2 text-right">₹${(item.quantity * item.price).toFixed(2)}</td></tr>`).join('')}</tbody>
          </table>
          <div class="mt-4 text-right">
            ${discountAmount > 0 ? `<p>Discount: -₹${discountAmount.toFixed(2)}</p>` : ''}
            <p class="text-xl font-bold text-blue-600">Total: ₹${totalAmount.toFixed(2)}</p>
          </div>
        </div></div></body></html>`);
      win.document.close();
      setTimeout(() => win.print(), 500);
    } catch (error) {
      message.error("Failed to print bill");
    }
  };

  // Process data for display
  const processedData = useMemo(() => {
    if (!orderState) return [];

    return orderState.map((order, index) => {
      const discount = order.discountAmount || ((order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0));
      const payment = order.paymentInfo?.razorpayPaymentId ? "Paid" : (order.paymentInfo?.razorpayOrderId === "OFFLINE" ? "Offline Paid" : "Pending");
      const isLocked = LOCKED_STATUSES.includes(order.orderStatus);

      return {
        key: order._id,
        sno: index + 1,
        orderId: order._id,
        name: order?.user?.firstname || "N/A",
        email: order?.user?.email || "N/A",
        mobile: order?.user?.mobile || "N/A",
        items: order?.orderItems?.length || 0,
        amount: order?.totalPrice,
        discount,
        finalAmount: order?.totalPriceAfterDiscount,
        status: order?.orderStatus || "Ordered",
        payment,
        mode: order?.mode || "ONLINE",
        date: dayjs(order?.createdAt).format("DD-MM-YYYY HH:mm"),
        rawDate: order?.createdAt,
        courierName: order?.courierName || "—",
        trackingId: order?.trackingId || "—",
        trackingUrl: order?.trackingUrl || null,
        isLocked,
        rawOrder: order,
      };
    });
  }, [orderState]);

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return processedData.filter((item) => {
      // Status filter
      if (activeStatus !== "All" && item.status !== activeStatus) return false;

      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch =
          item.orderId.toLowerCase().includes(searchLower) ||
          item.name.toLowerCase().includes(searchLower) ||
          item.email.toLowerCase().includes(searchLower) ||
          item.mobile.includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateRange) {
        const [start, end] = dateRange;
        const itemDate = dayjs(item.rawDate);
        if (!itemDate.isAfter(start.startOf("day")) || !itemDate.isBefore(end.endOf("day"))) {
          return false;
        }
      }

      // Payment filter
      if (paymentFilter !== "All" && item.payment !== paymentFilter) return false;

      // Mode filter
      if (modeFilter !== "All" && item.mode !== modeFilter) return false;

      return true;
    });
  }, [processedData, activeStatus, searchText, dateRange, paymentFilter, modeFilter]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = { ...STATUS_CONFIG };
    processedData.forEach((item) => {
      if (counts[item.orderStatus]) {
        counts[item.orderStatus].count++;
      }
    });
    counts.All.count = processedData.length;
    return counts;
  }, [processedData]);

  // Enhanced Table columns with modern styling
  const columns = [
    {
      title: "#",
      dataIndex: "sno",
      width: 60,
      align: "center",
      render: (sno) => (
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {sno}
        </div>
      )
    },
    {
      title: "Order Details",
      key: "orderDetails",
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Avatar
            size={48}
            style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              fontWeight: 'bold'
            }}
          >
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{
              fontWeight: 600,
              color: '#1a1a1a',
              fontSize: '14px',
              marginBottom: '4px'
            }}>
              #{record.orderId.slice(-8).toUpperCase()}
            </div>
            <div style={{
              color: '#666',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <UserOutlined /> {record.name} • {record.items} item{record.items !== 1 ? 's' : ''}
            </div>
            <div style={{
              color: '#999',
              fontSize: '11px',
              marginTop: '2px'
            }}>
              📅 {record.date}
            </div>
          </div>
        </div>
      ),
      width: 250,
    },
    {
      title: "Amount",
      dataIndex: "finalAmount",
      render: (amount, record) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#52c41a',
            marginBottom: '4px'
          }}>
            ₹{amount?.toFixed(2)}
          </div>
          {record.amount !== amount && (
            <div style={{
              fontSize: '12px',
              color: '#ff4d4f',
              textDecoration: 'line-through'
            }}>
              ₹{record.amount?.toFixed(2)}
            </div>
          )}
        </div>
      ),
      width: 140,
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.All;
        return (
          <div style={{
            background: config.gradient,
            padding: '8px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '12px',
            color: config.textColor,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {config.icon}
            {status}
          </div>
        );
      },
      width: 160,
      align: "center",
    },
    {
      title: "Payment",
      dataIndex: "payment",
      render: (payment) => (
        <Tag
          color={payment === "Paid" ? "success" : payment === "Offline Paid" ? "warning" : "error"}
          style={{
            borderRadius: '12px',
            padding: '4px 12px',
            fontWeight: 600,
            fontSize: '11px'
          }}
        >
          {payment}
         </Tag>
       ),
       width: 120,
       align: "center",
     },
     {
       title: "Shipping",
       key: "shipping",
       render: (_, record) => (
         <div>
           <div style={{
             fontWeight: 600,
             color: '#1a1a1a',
             marginBottom: '4px'
           }}>
             🚚 {record.courierName}
           </div>
           {record.trackingId !== "—" && (
             <div style={{
               fontSize: '11px',
               fontFamily: 'monospace',
               background: '#f5f5f5',
               padding: '4px 8px',
               borderRadius: '6px',
               display: 'inline-block'
             }}>
               {record.trackingUrl ? (
                 <a
                   href={record.trackingUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   style={{
                     color: '#667eea',
                     textDecoration: 'none',
                     fontWeight: 600
                   }}
                 >
                   🔗 {record.trackingId}
                 </a>
               ) : (
                 <span style={{ color: '#666' }}>{record.trackingId}</span>
               )}
             </div>
           )}
           {record.courierName === "—" && record.trackingId === "—" && (
             <span style={{
               color: '#999',
               fontSize: '11px',
               fontStyle: 'italic'
             }}>
               Not shipped
             </span>
           )}
         </div>
       ),
       width: 180,
     },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Link to={`/admin/order/${record.orderId}`}>
              <Button
                size="small"
                icon={<EyeOutlined />}
                style={{
                  borderRadius: '8px',
                  border: '2px solid #667eea',
                  color: '#667eea'
                }}
              />
            </Link>
          </Tooltip>

          <Tooltip title="Print Bill">
            <Button
              size="small"
              icon={<PrinterOutlined />}
              onClick={() => printOrderBill(record.orderId)}
              style={{
                borderRadius: '8px',
                border: '2px solid #52c41a',
                color: '#52c41a'
              }}
            />
          </Tooltip>

          {!record.isLocked ? (
            <Select
              size="small"
              value={record.status}
              onChange={(value) => updateOrderStatus(record.orderId, value)}
              style={{
                width: 120,
                borderRadius: '8px',
                fontWeight: 600
              }}
              disabled={record.isLocked}
            >
              <Option value="Ordered">Ordered</Option>
              <Option value="Processed">Processed</Option>
              <Option value="Packed">Packed</Option>
              <Option value="Shipped" disabled>Shipped (Auto)</Option>
              <Option value="Out for Delivery" disabled>Out for Delivery</Option>
              <Option value="Delivered" disabled>Delivered</Option>
              <Option value="Cancelled">Cancelled</Option>
            </Select>
          ) : (
            <Tooltip title="Managed by Shiprocket">
              <div style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(250, 112, 154, 0.3)'
              }}>
                <RocketOutlined />
                Auto-managed
              </div>
            </Tooltip>
          )}
        </Space>
      ),
      width: 220,
      align: "center",
    },
  ];

  // Clear all filters
  const clearFilters = () => {
    setActiveStatus("All");
    setSearchText("");
    setDateRange(null);
    setPaymentFilter("All");
    setModeFilter("All");
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      {/* Modern Header with Glassmorphism */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              }}>
                <ShoppingOutlined style={{ fontSize: '28px', color: 'white' }} />
              </div>
              <div>
                <Title level={2} style={{
                  margin: 0,
                    background: COLORS.primary.gradient,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700
                }}>
                  Orders Management
                </Title>
                <Text style={{ color: COLORS.neutral[600], fontSize: '16px' }}>
                  Track and manage all customer orders efficiently
                </Text>
              </div>
            </div>
          </Col>
          <Col>
            <Row gutter={24}>
              <Col>
                <div style={{
                    background: COLORS.primary.gradient,
                  padding: '20px',
                  borderRadius: '16px',
                  textAlign: 'center',
                    boxShadow: COLORS.primary.glow,
                  minWidth: '120px'
                }}>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                    {processedData.length}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                    Total Orders
                  </div>
                </div>
              </Col>
              <Col>
                <div style={{
                    background: COLORS.secondary.gradient,
                    padding: '20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    boxShadow: COLORS.secondary.glow,
                    minWidth: '120px'
                }}>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                    {statusCounts.Delivered.count}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                    Delivered
                  </div>
                </div>
              </Col>
              <Col>
                <div style={{
                      background: COLORS.accent.orange,
                  padding: '20px',
                  borderRadius: '16px',
                  textAlign: 'center',
                    boxShadow: '0 8px 25px rgba(234, 88, 12, 0.3)',
                  minWidth: '120px'
                }}>
                  <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                    ₹{processedData.reduce((sum, order) => sum + (order.finalAmount || 0), 0).toLocaleString()}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                    Total Revenue
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>

      {/* Premium Status Tabs */}
      <Card style={{
        marginBottom: '24px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(15,23,42,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(5,150,105,0.03) 0%, transparent 50%)',
          opacity: 0.5
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {Object.entries(statusCounts).map(([status, config]) => (
              <Button
                key={status}
                type="text"
                size="large"
                icon={config.icon}
                onClick={() => setActiveStatus(status)}
                style={{
                  borderRadius: '25px',
                  padding: '12px 20px',
                  fontWeight: 600,
                  fontSize: '13px',
                  letterSpacing: '0.3px',
                  background: activeStatus === status
                    ? STATUS_CONFIG[status].gradient
                    : 'rgba(255,255,255,0.8)',
                  border: activeStatus === status
                    ? `1px solid ${STATUS_CONFIG[status].borderColor}`
                    : '1px solid rgba(148,163,184,0.3)',
                  color: activeStatus === status
                    ? STATUS_CONFIG[status].textColor
                    : COLORS.neutral[600],
                  boxShadow: activeStatus === status
                    ? STATUS_CONFIG[status].glow
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  minWidth: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transform: activeStatus === status ? 'translateY(-1px)' : 'translateY(0)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: activeStatus === status
                      ? STATUS_CONFIG[status].glow
                      : '0 4px 16px rgba(0,0,0,0.08)',
                    background: activeStatus === status
                      ? STATUS_CONFIG[status].gradient
                      : 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  zIndex: 2
                }}>
                  <span>{status}</span>
                  <Badge
                    count={config.count}
                    style={{
                      background: activeStatus === status
                        ? 'rgba(255,255,255,0.95)'
                        : COLORS.neutral[300],
                      color: activeStatus === status
                        ? STATUS_CONFIG[status].textColor
                        : COLORS.neutral[700],
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '12px',
                      minWidth: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                {activeStatus === status && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60%',
                    height: '2px',
                    background: `linear-gradient(90deg, ${STATUS_CONFIG[status].borderColor}, ${STATUS_CONFIG[status].borderColor}60)`,
                    borderRadius: '1px'
                  }} />
                )}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Advanced Filters */}
      <Card style={{
        marginBottom: '24px',
        background: COLORS.glass.medium,
        backdropFilter: COLORS.glass.backdrop,
        borderRadius: '20px',
        boxShadow: COLORS.glass.shadow,
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
          background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill-rule="evenodd"%3E%3Cg fill="%230F172A" fill-opacity="0.03"%3E%3Cpath d="m0 0h80v80H0V0zm20 20c5.523 0 10-4.477 10-10S25.523 0 20 0 10 4.477 10 10s4.477 10 10 10zm30 10c5.523 0 10-4.477 10-10S55.523 10 50 10s-10 4.477-10 10 4.477 10 10 10zm-40 10c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm50-10c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM30 60c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.05
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '24px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search by Order ID, Name, Email, Mobile"
                prefix={<SearchOutlined style={{ color: COLORS.primary.main }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="large"
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${COLORS.neutral[300]}`,
                  padding: '12px 16px',
                  background: COLORS.glass.light,
                  color: COLORS.neutral[700],
                  width: '100%'
                }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                placeholder={["Start Date", "End Date"]}
                value={dateRange}
                onChange={(values) => setDateRange(values)}
                size="large"
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  border: `1px solid ${COLORS.neutral[300]}`
                }}
              />
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="Payment"
                value={paymentFilter}
                onChange={setPaymentFilter}
                size="large"
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${COLORS.neutral[300]}`,
                  width: '100%',
                  background: COLORS.glass.light
                }}
              >
                <Option value="All">All Payments</Option>
                <Option value="Paid">Paid</Option>
                <Option value="Offline Paid">Offline Paid</Option>
                <Option value="Pending">Pending</Option>
              </Select>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Select
                placeholder="Mode"
                value={modeFilter}
                onChange={setModeFilter}
                size="large"
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${COLORS.neutral[300]}`,
                  width: '100%',
                  background: COLORS.glass.light
                }}
              >
                <Option value="All">All Modes</Option>
                <Option value="ONLINE">Online</Option>
                <Option value="OFFLINE">Offline</Option>
              </Select>
            </Col>
            <Col xs={24}>
              <Space size="middle" wrap>
                <Button
                  onClick={clearFilters}
                  icon={<FilterOutlined />}
                  size="large"
                  style={{
                    borderRadius: '14px',
                    border: `1px solid ${COLORS.primary.main}`,
                    color: COLORS.primary.main,
                    fontWeight: 700,
                    background: COLORS.glass.light,
                    boxShadow: COLORS.glass.shadow,
                    padding: '12px 24px',
                    fontSize: '14px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  Clear Filters
                </Button>
                {(selectedRowKeys.length > 0 && activeStatus === "Packed") && (
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={bulkLoading}
                    onClick={handleBulkShipment}
                    size="large"
                    style={{
                      borderRadius: '14px',
                      background: COLORS.secondary.gradient,
                      border: `1px solid ${COLORS.secondary.main}`,
                      fontWeight: 700,
                      boxShadow: COLORS.secondary.glow,
                      color: '#fff',
                      padding: '12px 24px',
                      fontSize: '14px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}
                  >
                    Create Shipment ({selectedRowKeys.length})
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      {/* Premium Results Summary */}
      <div style={{
        marginBottom: '24px',
        padding: '20px 32px',
        background: COLORS.primary.gradient,
        borderRadius: '20px',
        color: 'white',
        fontWeight: 700,
        textAlign: 'center',
        boxShadow: COLORS.primary.glow,
        border: `1px solid ${COLORS.glass.border}`,
        backdropFilter: COLORS.glass.backdrop,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>📊 Order Analytics Dashboard</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Showing <span style={{ color: COLORS.secondary.lighter, fontWeight: 800 }}>{filteredData.length}</span> of{' '}
            <span style={{ color: COLORS.secondary.lighter, fontWeight: 800 }}>{processedData.length}</span> orders
            {activeStatus !== "All" && (
              <span> in <span style={{ color: COLORS.accent.blue, fontWeight: 800 }}>{activeStatus}</span> status</span>
            )}
          </div>
        </div>
      </div>

      {/* Premium Orders Table */}
      <Card style={{
        background: COLORS.glass.dark,
        backdropFilter: COLORS.glass.backdrop,
        borderRadius: '20px',
        boxShadow: COLORS.glass.shadow,
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
          background: 'url("data:image/svg+xml,%3Csvg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill-rule="evenodd"%3E%3Cg fill="%230F172A" fill-opacity="0.02"%3E%3Cpath d="M20 20c5.523 0 10-4.477 10-10S25.523 0 20 0 10 4.477 10 10s4.477 10 10 10zm40 20c5.523 0 10-4.477 10-10S65.523 20 50 20s-10 4.477-10 10 4.477 10 10 10zm40 20c5.523 0 10-4.477 10-10S105.523 40 90 40s-10 4.477-10 10 4.477 10 10 10zm-80 20c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm60-10c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm40 20c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zM40 100c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6zm60-20c3.314 0 6-2.686 6-6s-2.686-6-6-6-6 2.686-6 6 2.686 6 6 6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.03
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
            style: { marginTop: '20px' }
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              disabled: record.isLocked || record.rawOrder?.shipmentId,
            }),
          }}
          scroll={{ x: 1200 }}
          size="middle"
          style={{ borderRadius: '12px' }}
        />
        </div>
      </Card>
    </div>
  );
};

export default Orders;
