import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  BsArrowDownRight, BsArrowUpRight, BsCart4, BsGraphUp, BsBoxSeam,
  BsCurrencyRupee, BsPercent, BsCheckCircle, BsTruck, BsXCircle,
  BsClock, BsBarChart, BsPieChart, BsCalendar, BsLightning, BsPeople,
  BsCurrencyDollar, BsGrid, BsGrid3X3Gap, BsClockHistory, BsExclamationTriangle,
  BsTrophy, BsStarFill, BsArrowRight, BsEye, BsShop, BsActivity
} from "react-icons/bs";
import { FaCrown, FaMedal } from "react-icons/fa";
import { Column, Pie, Bar } from "@ant-design/plots";
import { Table, Card, Tag, DatePicker, Select, Row, Col, Avatar, Spin, Button, Empty, Tooltip, Badge, Progress, Statistic } from "antd";
import AdminDataTable from "../components/AdminDataTable";
import { useDispatch, useSelector } from "react-redux";
import { getMonthlyData, getOrders, getYearlyData, getDailySalesData, getDashboardStatsData } from "../features/auth/authSlice";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const FILTERS = {
  TODAY: "today",
  WEEK: "7days",
  MONTH: "month",
  YEAR: "year",
  CUSTOM: "custom"
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const hashColor = (str = "") => {
  const palette = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const StatCard = ({ title, value, subtitle, icon, gradient, shadowColor, trend, trendLabel, delay }) => (
  <div
    className="stat-card-pro"
    style={{
      background: gradient,
      borderRadius: "20px",
      padding: "22px",
      boxShadow: `0 8px 32px ${shadowColor}`,
      position: "relative",
      overflow: "hidden",
      animationDelay: delay,
      transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
      cursor: "default",
    }}
  >
    {/* decorative blobs */}
    <div style={{ position:"absolute", top:-30, right:-30, width:110, height:110, background:"rgba(255,255,255,0.12)", borderRadius:"50%" }} />
    <div style={{ position:"absolute", bottom:-40, left:-20, width:80, height:80, background:"rgba(255,255,255,0.08)", borderRadius:"50%" }} />

    <div style={{ position:"relative", zIndex:1 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <p style={{ margin:0, fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.8px" }}>{title}</p>
          <h2 style={{ margin:"6px 0 0", fontSize:28, fontWeight:800, color:"#fff", lineHeight:1 }}>{value}</h2>
        </div>
        <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#fff", flexShrink:0 }}>
          {icon}
        </div>
      </div>
      <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"rgba(255,255,255,0.9)", display:"flex", alignItems:"center", gap:3, background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"2px 10px" }}>
          {trend}
        </span>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{trendLabel}</span>
      </div>
      {subtitle && <p style={{ margin:"6px 0 0", fontSize:12, color:"rgba(255,255,255,0.65)" }}>{subtitle}</p>}
    </div>
  </div>
);

const MiniStatChip = ({ label, value, color, icon }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:"#fff", borderRadius:12, boxShadow:"0 2px 10px rgba(0,0,0,0.06)", flex:"1 1 140px", minWidth:130, borderLeft:`3px solid ${color}` }}>
    <div style={{ width:32, height:32, borderRadius:10, background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", color, fontSize:15, flexShrink:0 }}>{icon}</div>
    <div>
      <div style={{ fontSize:18, fontWeight:700, color:"#1a1a2e", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:11, color:"#94a3b8", fontWeight:500, marginTop:2 }}>{label}</div>
    </div>
  </div>
);

const RankBadge = ({ rank }) => {
  if (rank === 0) return <FaCrown style={{ color:"#f59e0b", fontSize:18 }} />;
  if (rank === 1) return <FaMedal style={{ color:"#94a3b8", fontSize:16 }} />;
  if (rank === 2) return <FaMedal style={{ color:"#cd7f32", fontSize:16 }} />;
  return <span style={{ width:22, height:22, borderRadius:"50%", background:"#f1f5f9", color:"#64748b", fontSize:11, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>{rank + 1}</span>;
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const monthlyDataState = useSelector((state) => state?.auth?.monthlyData);
  const yearlyDataState = useSelector((state) => state?.auth?.yearlyData);
  const dashboardStats = useSelector((state) => state?.auth?.dashboardStats);
  const dailySalesData = useSelector((state) => state?.auth?.dailySalesData);

  const [selectedMode, setSelectedMode] = useState("ALL");
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.MONTH);
  const [dateRange, setDateRange] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const titleClickRef = useRef(0);
  const titleTimerRef = useRef(null);

  const handleTitleClick = () => {
    titleClickRef.current += 1;
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => { titleClickRef.current = 0; }, 600);
    if (titleClickRef.current >= 3) {
      titleClickRef.current = 0;
      setShowAll(prev => !prev);
      setShowProfit(prev => !prev);
    }
  };

  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const getTokenFromLocalStorage = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const config3 = {
    headers: {
      Authorization: `Bearer ${getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""}`,
      Accept: "application/json",
    },
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append("filter", selectedFilter);
    params.append("mode", selectedMode === "ALL" ? "" : selectedMode);
    params.append("paymentFilter", showAll ? "all" : "online_current");
    if (selectedFilter === FILTERS.CUSTOM && dateRange) {
      params.append("startDate", dateRange[0].toISOString());
      params.append("endDate", dateRange[1].toISOString());
    }
    return params.toString();
  };

  useEffect(() => {
    dispatch(getMonthlyData(config3));
    dispatch(getYearlyData(config3));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const params = buildQueryParams();
    dispatch(getDashboardStatsData({ params, config: config3 }));
    dispatch(getDailySalesData({ params, config: config3 }));
    dispatch(getOrders(showAll ? "all" : "online_current"));
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [selectedFilter, selectedMode, dateRange, showAll]);

  const filteredOrders = useMemo(() => {
    if (!orderState) return [];
    const now = dayjs();
    return orderState.filter((order) => {
      if (!showAll) {
        const dest = order.paymentDestination;
        const isOnlineCurrent = dest === "CURRENT_ACCOUNT" || (order.mode === "ONLINE" && !dest);
        if (!isOnlineCurrent) return false;
      }
      if (selectedMode !== "ALL" && (order.mode || "ONLINE") !== selectedMode) return false;
      const orderDate = dayjs(order.createdAt);
      if (selectedFilter === FILTERS.CUSTOM && dateRange) {
        const [start, end] = dateRange;
        if (orderDate.isBefore(start.startOf("day")) || orderDate.isAfter(end.endOf("day"))) return false;
      } else if (selectedFilter === FILTERS.TODAY) {
        if (!orderDate.isSame(now, "day")) return false;
      } else if (selectedFilter === FILTERS.WEEK) {
        if (orderDate.isBefore(now.subtract(7, "day").startOf("day"))) return false;
      } else if (selectedFilter === FILTERS.MONTH) {
        if (!orderDate.isSame(now, "month")) return false;
      } else if (selectedFilter === FILTERS.YEAR) {
        if (!orderDate.isSame(now, "year")) return false;
      }
      return true;
    });
  }, [orderState, selectedMode, dateRange, selectedFilter, showAll]);

  const stats = useMemo(() => {
    const totalIncome = filteredOrders.reduce((sum, o) => sum + (o.totalPriceAfterDiscount || o.totalPrice || 0), 0);
    const totalSales = filteredOrders.length;
    const totalDiscount = filteredOrders.reduce((sum, o) => {
      return sum + (o.discountAmount || ((o.totalPrice || 0) - (o.totalPriceAfterDiscount || 0)));
    }, 0);
    return { totalIncome, totalSales, totalDiscount, averageOrderValue: totalSales > 0 ? totalIncome / totalSales : 0 };
  }, [filteredOrders]);

  const profitStats = useMemo(() => {
    const res = { totalProfit: 0, totalRevenue: 0, totalOrders: 0, totalItems: 0, itemsWithPurchase: 0 };
    if (!filteredOrders || !filteredOrders.length) return { ...res, avgProfitPerOrder: 0, profitMarginPct: "0.0" };
    filteredOrders.forEach(order => {
      res.totalOrders += 1;
      (order.orderItems || []).forEach(item => {
        const qty = Number(item.quantity || 1);
        const selling = Number(item.price || item.sellingPrice || item.product?.price || 0) || 0;
        let purchase = item.purchasePrice !== undefined && item.purchasePrice !== null ? Number(item.purchasePrice) : (item.product?.purchasePrice !== undefined && item.product?.purchasePrice !== null ? Number(item.product.purchasePrice) : null);
        let profitPerUnit = 0;
        if (purchase !== null && !Number.isNaN(purchase)) {
          profitPerUnit = selling - purchase;
          res.itemsWithPurchase += 1;
        } else {
          profitPerUnit = selling * 0.30; // assume 30% profit when purchase cost not available
        }
        res.totalProfit += profitPerUnit * qty;
        res.totalRevenue += selling * qty;
        res.totalItems += qty;
      });
    });
    const avgProfitPerOrder = res.totalOrders > 0 ? res.totalProfit / res.totalOrders : 0;
    const profitMarginPct = res.totalRevenue > 0 ? ((res.totalProfit / res.totalRevenue) * 100).toFixed(1) : "0.0";
    return { ...res, avgProfitPerOrder, profitMarginPct };
  }, [filteredOrders]);

  const displayStats = dashboardStats?.stats || {
    totalRevenue: stats.totalIncome,
    totalOrders: stats.totalSales,
    totalDiscount: stats.totalDiscount,
    totalSubtotal: stats.totalSales > 0 ? stats.totalIncome + stats.totalDiscount : 0,
  };

  const [dataMonthly, setDataMonthly] = useState([]);
  const [dataMonthlySales, setDataMonthlySales] = useState([]);
  const [dailyChartData, setDailyChartData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [paymentModeData, setPaymentModeData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    if (monthlyDataState?.length > 0) {
      const incomeByMonth = {};
      monthlyDataState.forEach((item) => {
        const month = item.month || monthNames[item._id - 1];
        incomeByMonth[month] = (incomeByMonth[month] || 0) + (item.amount || 0);
      });
      setDataMonthly(Object.keys(incomeByMonth).map((m) => ({ type: m, income: incomeByMonth[m] })));
      setDataMonthlySales(monthlyDataState.map((m) => ({ type: m.month || monthNames[m._id - 1], income: m.count || 0 })));
    }
    if (dailySalesData?.length > 0) {
      setDailyChartData(dailySalesData.map((d) => ({ date: d._id, income: d.amount || 0, count: d.count || 0 })));
    }
    if (dashboardStats?.ordersByStatus?.length > 0) {
      setOrderStatusData(dashboardStats.ordersByStatus.map((s) => ({ type: s._id || "Unknown", value: s.count })));
    } else {
      const sc = {};
      filteredOrders.forEach((o) => { const s = o.orderStatus || "Processing"; sc[s] = (sc[s] || 0) + 1; });
      setOrderStatusData(Object.keys(sc).map((s) => ({ type: s, value: sc[s] })));
    }
    if (dashboardStats?.ordersByMode?.length > 0) {
      setPaymentModeData(dashboardStats.ordersByMode.map((m) => ({ type: m._id || "ONLINE", value: m.count, revenue: m.revenue })));
    } else {
      const mc = {};
      filteredOrders.forEach((o) => {
        const mode = o.mode || "ONLINE";
        if (!mc[mode]) mc[mode] = { count: 0, revenue: 0 };
        mc[mode].count += 1;
        mc[mode].revenue += o.totalPriceAfterDiscount || o.totalPrice || 0;
      });
      setPaymentModeData(Object.keys(mc).map((m) => ({ type: m, value: mc[m].count, revenue: mc[m].revenue })));
    }
    if (dashboardStats?.hourlyData) {
      setHourlyData(dashboardStats.hourlyData.map((h) => ({ hour: h._id || 0, count: h.count || 0, revenue: h.revenue || 0 })));
    }
    setOrderData(filteredOrders.slice(0, 10).map((order, i) => ({
      key: i,
      name: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}`.trim() : "Deleted User",
      product: order.orderItems?.length,
      price: order.totalPrice,
      dprice: order.totalPriceAfterDiscount || order.totalPrice,
      discount: order.discountAmount || ((order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0)),
      staus: order.orderStatus,
      date: order.createdAt,
      mode: order.mode,
    })));
  }, [filteredOrders, monthlyDataState, dailySalesData, dashboardStats]);

  const columns = [
    {
      title: "#", dataIndex: "key", width: 44,
      render: (_, __, index) => <span style={{ color:"#94a3b8", fontWeight:600, fontSize:12 }}>{index + 1}</span>
    },
    {
      title: "Customer", dataIndex: "name",
      render: (name) => (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:hashColor(name), display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{name}</span>
        </div>
      ),
    },
    { title: "Items", dataIndex: "product", width: 60, align: "center", render: (v) => <span style={{ background:"#f1f5f9", borderRadius:8, padding:"2px 8px", fontWeight:600, fontSize:12 }}>{v}</span> },
    { title: "Total", dataIndex: "price", render: (v) => <span style={{ fontWeight:600, color:"#64748b", fontSize:13 }}>₹{v?.toLocaleString()}</span> },
    { title: "Discount", dataIndex: "discount", render: (v) => v > 0 ? <span style={{ color:"#10b981", fontWeight:600, fontSize:13 }}>-₹{v?.toLocaleString()}</span> : <span style={{ color:"#cbd5e1" }}>—</span> },
    { title: "Final", dataIndex: "dprice", render: (v) => <span style={{ fontWeight:800, color:"#6366f1", fontSize:14 }}>₹{v?.toLocaleString()}</span> },
    {
      title: "Status", dataIndex: "staus",
      render: (status) => {
        const cfg = { Processing: { color:"#f59e0b", bg:"#fef3c7" }, Shipped: { color:"#3b82f6", bg:"#dbeafe" }, Delivered: { color:"#10b981", bg:"#d1fae5" }, Cancelled: { color:"#ef4444", bg:"#fee2e2" } };
        const c = cfg[status] || { color:"#64748b", bg:"#f1f5f9" };
        return <span style={{ background:c.bg, color:c.color, borderRadius:20, padding:"3px 12px", fontWeight:600, fontSize:11, display:"inline-block" }}>{status}</span>;
      },
    },
    {
      title: "Mode", dataIndex: "mode",
      render: (mode) => {
        const isOnline = !mode || mode === "ONLINE";
        return <span style={{ background: isOnline ? "#e0f2fe" : "#f3e8ff", color: isOnline ? "#0284c7" : "#7c3aed", borderRadius:20, padding:"3px 12px", fontWeight:600, fontSize:11 }}>{mode || "ONLINE"}</span>;
      },
    },
  ];

  const chartTheme = { colors10: ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6","#f97316","#84cc16"] };

  const config = {
    data: dataMonthly, xField: "type", yField: "income",
    color: "#6366f1",
    columnStyle: { radius: [6,6,0,0], fill: "l(90) 0:#6366f1 1:#818cf8" },
    label: false,
    xAxis: { label: { autoHide: true, autoRotate: false, style:{ fill:"#94a3b8", fontSize:11 } } },
    yAxis: { label: { formatter:(v) => `₹${Number(v).toLocaleString()}`, style:{ fill:"#94a3b8", fontSize:11 } } },
    tooltip: { formatter: (d) => ({ name:"Revenue", value:`₹${d.income?.toLocaleString()}` }) },
    meta: { type: { alias: "Month" } },
  };

  const config2 = {
    data: dataMonthlySales, xField: "type", yField: "income",
    color: "#10b981",
    columnStyle: { radius: [6,6,0,0], fill: "l(90) 0:#10b981 1:#34d399" },
    label: false,
    xAxis: { label: { autoHide: true, autoRotate: false, style:{ fill:"#94a3b8", fontSize:11 } } },
    yAxis: { label: { style:{ fill:"#94a3b8", fontSize:11 } } },
    tooltip: { formatter: (d) => ({ name:"Sales", value:d.income }) },
  };

  const dailyConfig = {
    data: dailyChartData, xField: "date", yField: "income",
    color: "#8b5cf6",
    columnStyle: { radius: [6,6,0,0], fill: "l(90) 0:#8b5cf6 1:#a78bfa" },
    label: false,
    xAxis: { label: { autoRotate: true, style:{ fill:"#94a3b8", fontSize:11 } } },
    yAxis: { label: { formatter:(v) => `₹${Number(v).toLocaleString()}`, style:{ fill:"#94a3b8", fontSize:11 } } },
    tooltip: { formatter: (d) => ({ name:"Revenue", value:`₹${d.income?.toLocaleString()}` }) },
  };

  const pieConfig = {
    data: orderStatusData, angleField: "value", colorField: "type",
    radius: 0.82, innerRadius: 0.65,
    label: false,
    legend: { position: "bottom", itemName:{ style:{ fill:"#64748b", fontSize:12 } } },
    color: ({ type }) => ({ Processing:"#f59e0b", Shipped:"#3b82f6", Delivered:"#10b981", Cancelled:"#ef4444", Ordered:"#14b8a6" }[type] || "#8c8c8c"),
    statistic: {
      title: { style:{ fontSize:14, fontWeight:600, color:"#1e293b" }, content: `${displayStats.totalOrders || 0}` },
      content: { style:{ fontSize:12, color:"#94a3b8" }, content:"Orders" },
    },
    tooltip: { formatter: (d) => ({ name: d.type, value: d.value }) },
  };

  const paymentPieConfig = {
    data: paymentModeData, angleField: "value", colorField: "type",
    radius: 0.82, innerRadius: 0.65,
    label: false,
    legend: { position: "bottom", itemName:{ style:{ fill:"#64748b", fontSize:12 } } },
    color: ({ type }) => ({ ONLINE:"#6366f1", OFFLINE:"#f59e0b" }[type] || "#8c8c8c"),
    tooltip: { formatter: (d) => ({ name: d.type, value: `${d.value} orders` }) },
  };

  const hourlyConfig = {
    data: hourlyData, xField: "count", yField: "hour",
    color: "#f97316",
    barStyle: { radius: [0,4,4,0], fill: "l(0) 0:#f97316 1:#fb923c" },
    label: false,
    xAxis: { label: { style:{ fill:"#94a3b8", fontSize:11 } } },
    yAxis: { label: { formatter:(v) => `${v}:00`, style:{ fill:"#94a3b8", fontSize:11 } } },
    tooltip: { formatter: (d) => ({ name:"Orders", value: d.count }) },
  };

  const getFilterStyle = (f) => {
    const active = selectedFilter === f;
    return {
      background: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)",
      color: active ? "#6366f1" : "rgba(255,255,255,0.85)",
      border: "none",
      borderRadius: 20,
      padding: "5px 16px",
      fontWeight: active ? 700 : 500,
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: active ? "0 4px 14px rgba(0,0,0,0.12)" : "none",
    };
  };

  const topProducts = dashboardStats?.topProducts || [];
  const topCustomers = dashboardStats?.topCustomers || [];
  const maxProductRevenue = Math.max(...topProducts.map(p => p.totalRevenue || 0), 1);
  const maxCustomerSpent = Math.max(...topCustomers.map(c => c.totalSpent || 0), 1);

  const processingCount = orderStatusData.find(s => s.type === "Processing")?.value || 0;
  const shippedCount = orderStatusData.find(s => s.type === "Shipped")?.value || 0;
  const deliveredCount = orderStatusData.find(s => s.type === "Delivered")?.value || 0;
  const cancelledCount = orderStatusData.find(s => s.type === "Cancelled")?.value || 0;
  const avgOrderValue = displayStats.totalOrders > 0 ? (displayStats.totalRevenue / displayStats.totalOrders) : 0;
  const discountPct = displayStats.totalSubtotal > 0 ? ((displayStats.totalDiscount / displayStats.totalSubtotal) * 100).toFixed(1) : "0.0";
  const deliveryRate = displayStats.totalOrders > 0 ? ((deliveredCount / displayStats.totalOrders) * 100).toFixed(1) : "0.0";

  return (
    <div className="dash-root">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="dash-header animate-down">
        {/* blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,0.7)", fontWeight:500 }}>
                {getGreeting()}, Admin 👋
              </p>
              <h2
                style={{ margin:"4px 0 2px", fontWeight:800, color:"#fff", fontSize:"clamp(20px,4vw,26px)", letterSpacing:"-0.3px", cursor:"default", userSelect:"none", display:"inline-flex", alignItems:"center", gap:8 }}
                onClick={handleTitleClick}
              >
                Business Dashboard
                {showAll && <span style={{ width:7, height:7, borderRadius:"50%", background:"#fbbf24", display:"inline-block" }} title="Showing all orders" />}
              </h2>
              <p style={{ margin:0, fontSize:13, color:"rgba(255,255,255,0.65)" }}>
                {selectedFilter === FILTERS.TODAY && `Today — ${dayjs().format("ddd, DD MMM YYYY")}`}
                {selectedFilter === FILTERS.WEEK && "Last 7 days overview"}
                {selectedFilter === FILTERS.MONTH && `${dayjs().format("MMMM YYYY")} overview`}
                {selectedFilter === FILTERS.YEAR && `${dayjs().format("YYYY")} annual overview`}
                {selectedFilter === FILTERS.CUSTOM && dateRange ? `${dateRange[0].format("DD MMM")} – ${dateRange[1].format("DD MMM YYYY")}` : ""}
              </p>
            </div>

            <Select
              value={selectedMode}
              onChange={setSelectedMode}
              style={{ width:140, flexShrink:0 }}
              className="header-select"
            >
              <Option value="ALL"><div style={{ display:"flex", alignItems:"center", gap:6 }}><BsGrid />All Orders</div></Option>
              <Option value="ONLINE"><div style={{ display:"flex", alignItems:"center", gap:6 }}><BsGraphUp />Online</div></Option>
              <Option value="OFFLINE"><div style={{ display:"flex", alignItems:"center", gap:6 }}><BsShop />Offline</div></Option>
            </Select>
          </div>

          {/* Filter Pills */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginTop:16 }}>
            <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.12)", padding:4, borderRadius:24, flexShrink:0, flexWrap:"wrap" }}>
              {[{f:FILTERS.TODAY,l:"Today"},{f:FILTERS.WEEK,l:"7 Days"},{f:FILTERS.MONTH,l:"Month"},{f:FILTERS.YEAR,l:"Year"}].map(({f,l}) => (
                <button key={f} style={getFilterStyle(f)} onClick={() => { setSelectedFilter(f); setDateRange(null); }}>{l}</button>
              ))}
              <button
                style={{ ...getFilterStyle(FILTERS.CUSTOM), display:"flex", alignItems:"center", gap:5 }}
                onClick={() => setSelectedFilter(FILTERS.CUSTOM)}
              >
                <BsCalendar style={{ fontSize:11 }} />Custom
              </button>
            </div>
            {selectedFilter === FILTERS.CUSTOM && (
              <DatePicker.RangePicker
                size="middle"
                placeholder={["Start","End"]}
                value={dateRange}
                onChange={(d) => setDateRange(d)}
                allowClear
                style={{ borderRadius:12, background:"rgba(255,255,255,0.95)", border:"none", boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <Row gutter={[20,20]} style={{ marginBottom:20 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Revenue"
            value={`₹${(displayStats.totalRevenue || 0).toLocaleString()}`}
            subtitle={`From ${displayStats.totalOrders || 0} orders`}
            icon={<BsCurrencyRupee />}
            gradient="linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)"
            shadowColor="rgba(99,102,241,0.35)"
            trend={<><BsArrowUpRight /> {selectedFilter}</>}
            trendLabel="period"
            delay="0.05s"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Orders"
            value={displayStats.totalOrders || 0}
            subtitle={`Avg ₹${Math.round(avgOrderValue).toLocaleString()} / order`}
            icon={<BsCart4 />}
            gradient="linear-gradient(135deg,#10b981 0%,#059669 100%)"
            shadowColor="rgba(16,185,129,0.35)"
            trend={<><BsActivity /> {deliveryRate}%</>}
            trendLabel="delivery rate"
            delay="0.1s"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Discount"
            value={`₹${(displayStats.totalDiscount || 0).toLocaleString()}`}
            subtitle="Savings offered to customers"
            icon={<BsPercent />}
            gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)"
            shadowColor="rgba(245,158,11,0.35)"
            trend={<>{discountPct}%</>}
            trendLabel="of gross sales"
            delay="0.15s"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Delivered Orders"
            value={deliveredCount}
            subtitle={`${deliveryRate}% delivery rate`}
            icon={<BsTruck />}
            gradient="linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%)"
            shadowColor="rgba(139,92,246,0.35)"
            trend={<><BsCheckCircle /> Success</>}
            trendLabel="fulfilment"
            delay="0.2s"
          />
        </Col>
      </Row>

      {/* ── Mini Status Strip ──────────────────────────────── */}
      {showProfit && (
        <Row gutter={[20,20]} style={{ marginBottom:20 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Gross Profit"
              value={`₹${Math.round(profitStats.totalProfit || 0).toLocaleString()}`}
              subtitle={`Avg ₹${Math.round(profitStats.avgProfitPerOrder || 0).toLocaleString()} / order`}
              icon={<BsCurrencyDollar />}
              gradient="linear-gradient(135deg,#ef4444 0%,#f97316 100%)"
              shadowColor="rgba(239,68,68,0.18)"
              trend={<><BsArrowUpRight /> {profitStats.profitMarginPct}%</>}
              trendLabel="profit margin"
              delay="0.25s"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="Profit Margin"
              value={`${profitStats.profitMarginPct}%`}
              subtitle={`${profitStats.itemsWithPurchase || 0} items used cost`}
              icon={<BsPercent />}
              gradient="linear-gradient(135deg,#14b8a6 0%,#059669 100%)"
              shadowColor="rgba(20,184,166,0.18)"
              trend={<><BsGraphUp /> Avg</>}
              trendLabel="per order"
              delay="0.3s"
            />
          </Col>
        </Row>
      )}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:20 }}>
        <MiniStatChip label="Processing" value={processingCount} color="#f59e0b" icon={<BsClock />} />
        <MiniStatChip label="Shipped" value={shippedCount} color="#3b82f6" icon={<BsTruck />} />
        <MiniStatChip label="Delivered" value={deliveredCount} color="#10b981" icon={<BsCheckCircle />} />
        <MiniStatChip label="Cancelled" value={cancelledCount} color="#ef4444" icon={<BsXCircle />} />
        <MiniStatChip label="Avg Order Value" value={`₹${Math.round(avgOrderValue).toLocaleString()}`} color="#6366f1" icon={<BsGraphUp />} />
      </div>

      {/* ── Primary Charts ─────────────────────────────────── */}
      <Row gutter={[20,20]} style={{ marginBottom:20 }}>
        <Col xs={24} lg={16}>
          <Card
            className="dash-card animate-left"
            title={
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background: (selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) ? "#8b5cf6":"#6366f1" }} />
                    <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>
                      {(selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) ? `Daily Sales${selectedFilter===FILTERS.TODAY?" — Today":" (Last 7 Days)"}` : "Revenue Overview (Monthly)"}
                    </span>
                  </div>
                  <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>Revenue generated over time</p>
                </div>
                <span style={{ fontSize:12, color:"#94a3b8", fontWeight:500 }}>₹ INR</span>
              </div>
            }
          >
            {(selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) && dailyChartData.length > 0
              ? <Column {...dailyConfig} height={280} theme={chartTheme} />
              : dataMonthly.length > 0
                ? <Column {...config} height={280} theme={chartTheme} />
                : <Empty description="No revenue data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:"40px 0" }} />
            }
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            className="dash-card animate-right"
            title={
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#a855f7" }} />
                  <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>Order Status</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>Distribution by status</p>
              </div>
            }
          >
            {orderStatusData.length > 0
              ? <Pie {...pieConfig} height={280} />
              : <Empty description="No orders yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:"40px 0" }} />
            }
          </Card>
        </Col>
      </Row>

      {/* ── Secondary Charts ───────────────────────────────── */}
      <Row gutter={[20,20]} style={{ marginBottom:20 }}>
        <Col xs={24} lg={8}>
          <Card
            className="dash-card animate-left"
            title={
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6" }} />
                  <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>Payment Mode</span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>Online vs Offline split</p>
              </div>
            }
          >
            {paymentModeData.length > 0
              ? <Pie {...paymentPieConfig} height={260} />
              : <Empty description="No data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:"30px 0" }} />
            }
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            className="dash-card animate-right"
            title={
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background: (selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) ? "#f97316":"#10b981" }} />
                  <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>
                    {(selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) ? "Peak Hours Analysis" : "Sales Overview (Monthly)"}
                  </span>
                </div>
                <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>
                  {(selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) ? "Order volume by hour" : "Monthly order count"}
                </p>
              </div>
            }
          >
            {(selectedFilter===FILTERS.TODAY||selectedFilter===FILTERS.WEEK) && hourlyData.length > 0
              ? <Bar {...hourlyConfig} height={260} />
              : dataMonthlySales.length > 0
                ? <Column {...config2} height={260} theme={chartTheme} />
                : <Empty description="No data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:"30px 0" }} />
            }
          </Card>
        </Col>
      </Row>

      {/* ── Top Lists ──────────────────────────────────────── */}
      <Row gutter={[20,20]} style={{ marginBottom:20 }}>
        {/* Top Products */}
        <Col xs={24} lg={12}>
          <Card
            className="dash-card animate-left"
            title={
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#ef4444" }} />
                    <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>Top Products</span>
                  </div>
                  <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>Best-selling by revenue</p>
                </div>
                <BsTrophy style={{ color:"#f59e0b", fontSize:18 }} />
              </div>
            }
            bodyStyle={{ padding:"8px 16px 16px" }}
          >
            {topProducts.length > 0 ? (
              <div>
                {topProducts.map((product, index) => (
                  <div key={index} style={{ padding:"10px 0", borderBottom: index < topProducts.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                      <div style={{ width:32, height:32, borderRadius:10, background: index===0?"#fef3c7":index===1?"#f1f5f9":"#fdf2e9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <RankBadge rank={index} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:"#1e293b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{product.title || "Unknown Product"}</div>
                        <div style={{ fontSize:11, color:"#94a3b8" }}>{product.totalQuantity || 0} units sold</div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#10b981", flexShrink:0 }}>₹{(product.totalRevenue || 0).toLocaleString()}</div>
                    </div>
                    <Progress
                      percent={Math.round(((product.totalRevenue || 0) / maxProductRevenue) * 100)}
                      showInfo={false}
                      size="small"
                      strokeColor={{ from:"#6366f1", to:"#a78bfa" }}
                      trailColor="#f1f5f9"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No product data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:"30px 0" }} />
            )}
          </Card>
        </Col>

        {/* Top Customers */}
        <Col xs={24} lg={12}>
          <Card
            className="dash-card animate-right"
            title={
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6" }} />
                    <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>Top Customers</span>
                  </div>
                  <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>Highest spenders</p>
                </div>
                <BsPeople style={{ color:"#6366f1", fontSize:18 }} />
              </div>
            }
            bodyStyle={{ padding:"8px 16px 16px" }}
          >
            {topCustomers.length > 0 ? (
              <div>
                {topCustomers.map((customer, index) => {
                  const name = `${customer.firstname || ""} ${customer.lastname || ""}`.trim() || "Guest";
                  return (
                    <div key={index} style={{ padding:"10px 0", borderBottom: index < topCustomers.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:hashColor(name), display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0, position:"relative" }}>
                          {name.charAt(0).toUpperCase()}
                          {index === 0 && <FaCrown style={{ position:"absolute", top:-6, right:-6, color:"#f59e0b", fontSize:12 }} />}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:"#1e293b" }}>{name}</div>
                          <div style={{ fontSize:11, color:"#94a3b8" }}>{customer.totalOrders || 0} orders</div>
                        </div>
                        <div style={{ fontWeight:700, fontSize:14, color:"#6366f1", flexShrink:0 }}>₹{(customer.totalSpent || 0).toLocaleString()}</div>
                      </div>
                      <Progress
                        percent={Math.round(((customer.totalSpent || 0) / maxCustomerSpent) * 100)}
                        showInfo={false}
                        size="small"
                        strokeColor={{ from:"#3b82f6", to:"#818cf8" }}
                        trailColor="#f1f5f9"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="No customer data" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding:"30px 0" }} />
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Recent Orders ──────────────────────────────────── */}
      <Card
        className="dash-card animate-up"
        title={
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#f97316" }} />
                <span style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>Recent Orders</span>
              </div>
              <p style={{ margin:0, fontSize:12, color:"#94a3b8", marginTop:2 }}>Latest {orderData.length} transactions</p>
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              style={{ display:"flex", alignItems:"center", gap:6, background:"#f1f5f9", color:"#6366f1", border:"none", borderRadius:10, padding:"7px 16px", fontWeight:600, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#6366f1"; e.currentTarget.style.color="#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background="#f1f5f9"; e.currentTarget.style.color="#6366f1"; }}
            >
              View All <BsArrowRight />
            </button>
          </div>
        }
        bodyStyle={{ padding:0 }}
      >
        <AdminDataTable
          columns={columns}
          dataSource={orderData}
          paginationOptions={{ pageSize:5 }}
          loading={isLoading}
        />
      </Card>

      {/* ── Styles ─────────────────────────────────────────── */}
      <style>{`
        .dash-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #f1f5f9;
          min-height: 100vh;
          padding: clamp(12px,2vw,24px);
        }

        /* Header */
        .dash-header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%);
          border-radius: 24px;
          padding: 28px 32px;
          margin-bottom: 24px;
          box-shadow: 0 12px 40px rgba(79,70,229,0.3);
          position: relative;
          overflow: hidden;
        }

        .blob { position:absolute; border-radius:50%; }
        .blob-1 { top:-60px; right:-40px; width:220px; height:220px; background:rgba(255,255,255,0.08); }
        .blob-2 { bottom:-50px; left:-30px; width:180px; height:180px; background:rgba(255,255,255,0.06); }
        .blob-3 { top:20px; left:40%; width:120px; height:120px; background:rgba(255,255,255,0.05); }

        /* header select override */
        .header-select .ant-select-selector {
          border-radius: 12px !important;
          border: none !important;
          background: rgba(255,255,255,0.95) !important;
          box-shadow: 0 4px 14px rgba(0,0,0,0.12) !important;
          font-weight: 600 !important;
          height: 38px !important;
          line-height: 38px !important;
        }

        /* Cards */
        .dash-card {
          border-radius: 20px !important;
          border: none !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06) !important;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          background: #fff;
        }

        .dash-card:hover {
          box-shadow: 0 10px 32px rgba(0,0,0,0.1) !important;
          transform: translateY(-2px);
        }

        .dash-card .ant-card-head {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px 20px;
          min-height: unset;
        }

        .dash-card .ant-card-body {
          padding: 20px;
        }

        /* Stat cards */
        .stat-card-pro {
          animation: fadeUp 0.5s ease both;
        }

        .stat-card-pro:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 20px 50px rgba(0,0,0,0.18) !important;
        }

        /* Table */
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          color: #64748b !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .ant-table-tbody > tr > td {
          padding: 10px 16px !important;
          border-bottom: 1px solid #f8fafc !important;
        }

        .ant-table-tbody > tr:hover > td {
          background: #fafaff !important;
        }

        /* Animations */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity:0; transform:translateY(-20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity:0; transform:translateX(-20px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes fadeRight {
          from { opacity:0; transform:translateX(20px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .animate-down { animation: fadeDown 0.5s ease both; }
        .animate-up   { animation: fadeUp  0.5s ease both; }
        .animate-left { animation: fadeLeft  0.55s ease both; }
        .animate-right{ animation: fadeRight 0.55s ease both; }

        /* Mobile */
        @media (max-width: 768px) {
          .dash-root { padding: 10px; }
          .dash-header { padding: 18px 16px; border-radius: 16px; }
        }
        @media (max-width: 480px) {
          .dash-header { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
