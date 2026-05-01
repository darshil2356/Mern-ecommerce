import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  BsArrowDownRight, BsArrowUpRight, BsCart4, BsGraphUp, BsBoxSeam, 
  BsCurrencyRupee, BsPercent, BsCheckCircle, BsTruck, BsXCircle, 
  BsClock, BsBarChart, BsPieChart, BsCalendar, BsLightning, BsPeople, 
  BsCurrencyDollar, BsGrid, BsGrid3X3Gap, BsClockHistory, BsExclamationTriangle
} from "react-icons/bs";
import { Column, Pie, Bar } from "@ant-design/plots";
import { Table, Card, Tag, DatePicker, Select, Row, Col, Avatar, Spin, Button, Empty, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getMonthlyData, getOrders, getYearlyData, getDailySalesData, getDashboardStatsData } from "../features/auth/authSlice";
import dayjs from "dayjs";

const { Option } = Select;

// Filter types
const FILTERS = {
  TODAY: "today",
  WEEK: "7days",
  MONTH: "month",
  YEAR: "year",
  CUSTOM: "custom"
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const monthlyDataState = useSelector((state) => state?.auth?.monthlyData);
  const yearlyDataState = useSelector((state) => state?.auth?.yearlyData);
  const dashboardStats = useSelector((state) => state?.auth?.dashboardStats);
  const dailySalesData = useSelector((state) => state?.auth?.dailySalesData);
  
  const [selectedMode, setSelectedMode] = useState("ALL");
  const [selectedFilter, setSelectedFilter] = useState(FILTERS.MONTH);
  const [dateRange, setDateRange] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // default: only Online-Current orders (matches Orders & Reports pages). Triple-click title to toggle all
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

  // Build query params based on filter
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

  // Fetch data based on filter
  useEffect(() => {
    setIsLoading(true);
    const params = buildQueryParams();
    dispatch(getDashboardStatsData({ params, config: config3 }));
    dispatch(getDailySalesData({ params, config: config3 }));
    dispatch(getMonthlyData(config3));
    dispatch(getYearlyData(config3));
    dispatch(getOrders(showAll ? 'all' : 'online_current'));
    
    // Small delay to show loading state
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [selectedFilter, selectedMode, dateRange, showAll]);

  // Filter orders based on mode, payment type, and date
  const filteredOrders = useMemo(() => {
    if (!orderState) return [];
    const now = dayjs();
    return orderState.filter((order) => {
      // Match Reports page: default to CURRENT_ACCOUNT only
      if (!showAll) {
        const dest = order.paymentDestination;
        const isOnlineCurrent =
          dest === 'CURRENT_ACCOUNT' ||
          (order.mode === 'ONLINE' && !dest);
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

  // Calculate stats from filtered orders (as fallback)
  const stats = useMemo(() => {
    const totalIncome = filteredOrders.reduce((sum, order) => sum + (order.totalPriceAfterDiscount || order.totalPrice || 0), 0);
    const totalSales = filteredOrders.length;
    const totalDiscount = filteredOrders.reduce((sum, order) => {
      const discount = order.discountAmount || ((order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0));
      return sum + discount;
    }, 0);
    const averageOrderValue = totalSales > 0 ? totalIncome / totalSales : 0;
    
    return { totalIncome, totalSales, totalDiscount, averageOrderValue };
  }, [filteredOrders]);

  // Use API stats if available, otherwise fallback to calculated stats
  const displayStats = dashboardStats?.stats || {
    totalRevenue: stats.totalIncome,
    totalOrders: stats.totalSales,
    totalDiscount: stats.totalDiscount,
    totalSubtotal: stats.totalSales > 0 ? stats.totalIncome + stats.totalDiscount : 0
  };

  const [dataMonthly, setDataMonthly] = useState([]);
  const [dataMonthlySales, setDataMonthlySales] = useState([]);
  const [dailyChartData, setDailyChartData] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [paymentModeData, setPaymentModeData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);

  useEffect(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Monthly income chart data
    if (monthlyDataState && monthlyDataState.length > 0) {
      const incomeByMonth = {};
      monthlyDataState.forEach((item) => {
        const month = item.month || monthNames[item._id - 1];
        incomeByMonth[month] = (incomeByMonth[month] || 0) + (item.amount || 0);
      });
      setDataMonthly(Object.keys(incomeByMonth).map((m) => ({ type: m, income: incomeByMonth[m] })));
      setDataMonthlySales(monthlyDataState.map((m) => ({ type: m.month || monthNames[m._id - 1], income: m.count || 0 })));
    }

    // Daily sales chart data (for today/7days filter)
    if (dailySalesData && dailySalesData.length > 0) {
      setDailyChartData(dailySalesData.map((d) => ({
        date: d._id,
        income: d.amount || 0,
        count: d.count || 0,
        discount: d.discount || 0
      })));
    }

    // Order status data — prefer API data, fall back to frontend calculation
    if (dashboardStats?.ordersByStatus?.length > 0) {
      setOrderStatusData(dashboardStats.ordersByStatus.map((s) => ({
        type: s._id || "Unknown",
        value: s.count
      })));
    } else {
      const statusCount = {};
      filteredOrders.forEach((order) => {
        const status = order.orderStatus || "Processing";
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      setOrderStatusData(Object.keys(statusCount).map((status) => ({ type: status, value: statusCount[status] })));
    }

    // Payment mode distribution — prefer API data, fall back to frontend calculation
    if (dashboardStats?.ordersByMode?.length > 0) {
      setPaymentModeData(dashboardStats.ordersByMode.map((m) => ({
        type: m._id || "ONLINE",
        value: m.count,
        revenue: m.revenue
      })));
    } else {
      const modeCount = {};
      filteredOrders.forEach((order) => {
        const mode = order.mode || "ONLINE";
        if (!modeCount[mode]) modeCount[mode] = { count: 0, revenue: 0 };
        modeCount[mode].count += 1;
        modeCount[mode].revenue += order.totalPriceAfterDiscount || order.totalPrice || 0;
      });
      setPaymentModeData(Object.keys(modeCount).map((mode) => ({
        type: mode,
        value: modeCount[mode].count,
        revenue: modeCount[mode].revenue
      })));
    }

    // Hourly distribution
    if (dashboardStats?.hourlyData) {
      setHourlyData(dashboardStats.hourlyData.map((h) => ({
        hour: h._id || 0,
        count: h.count || 0,
        revenue: h.revenue || 0
      })));
    }

    // Recent orders table
    setOrderData(filteredOrders.slice(0, 10).map((order, i) => ({
      key: i,
      name: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}` : "Deleted User",
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
    { title: "SNo", dataIndex: "key", width: 50, render: (text, record, index) => <span className="text-muted">{index + 1}</span> },
    {
      title: "Customer", dataIndex: "name",
      render: (name) => (
        <div className="d-flex align-items-center gap-2">
          <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>{name.charAt(0)}</Avatar>
          <span className="fw-medium">{name}</span>
        </div>
      ),
    },
    { title: "Items", dataIndex: "product", width: 60, align: "center" },
    { title: "Total", dataIndex: "price", render: (price) => <span className="fw-bold" style={{ color: "#1a1a1a" }}>₹{price?.toLocaleString()}</span> },
    { title: "Discount", dataIndex: "discount", render: (discount) => discount > 0 ? <span className="text-success">-₹{discount?.toLocaleString()}</span> : <span className="text-muted">-</span> },
    { title: "Final", dataIndex: "dprice", render: (dprice) => <span className="text-primary fw-bold">₹{dprice?.toLocaleString()}</span> },
    {
      title: "Status", dataIndex: "staus",
      render: (status) => {
        const statusConfig = { "Processing": { color: "gold" }, "Shipped": { color: "blue" }, "Delivered": { color: "green" }, "Cancelled": { color: "red" } };
        return <Tag color={statusConfig[status]?.color || "default"} style={{ borderRadius: "20px", padding: "2px 10px", fontWeight: 500 }}>{status}</Tag>;
      },
    },
    {
      title: "Mode", dataIndex: "mode",
      render: (mode) => (
        <Tag color={mode === "OFFLINE" ? "purple" : "cyan"} style={{ borderRadius: "20px", padding: "2px 10px" }}>
          {mode || "ONLINE"}
        </Tag>
      ),
    },
  ];

  // Chart configurations
  const config = { 
    data: dataMonthly, 
    xField: "type", 
    yField: "income", 
    color: "#1890ff", 
    label: { position: "middle", style: { fill: "#FFFFFF", opacity: 1 } }, 
    xAxis: { label: { autoHide: true, autoRotate: false } }, 
    meta: { type: { alias: "Month" }, sales: { alias: "Income" } }, 
    smooth: true 
  };

  const config2 = { 
    data: dataMonthlySales, 
    xField: "type", 
    yField: "income", 
    color: "#52c41a", 
    label: { position: "middle", style: { fill: "#FFFFFF", opacity: 1 } }, 
    xAxis: { label: { autoHide: true, autoRotate: false } }, 
    meta: { type: { alias: "Month" }, sales: { alias: "Sales" } }, 
    smooth: true 
  };

  const dailyConfig = {
    data: dailyChartData,
    xField: "date",
    yField: "income",
    color: "#722ed1",
    label: { position: "middle", style: { fill: "#FFFFFF", opacity: 1 } },
    xAxis: { label: { autoRotate: true } },
    meta: { date: { alias: "Date" }, income: { alias: "Revenue" } },
    smooth: true
  };

  const pieConfig = {
    data: orderStatusData, 
    angleField: "value", 
    colorField: "type", 
    radius: 0.8, 
    innerRadius: 0.6,
    label: { text: "value", style: { fontWeight: 600 } }, 
    legend: { position: "bottom" },
    color: ({ type }) => ({ "Processing": "#faad14", "Shipped": "#1890ff", "Delivered": "#52c41a", "Cancelled": "#ff4d4f", "Ordered": "#13c2c2" }[type] || "#8c8c8c"),
    annotations: [{ type: "text", style: { text: `${displayStats.totalOrders || 0}\nOrders`, x: "50%", y: "50%", textAlign: "center", fontSize: 18, fontWeight: 600 } }],
  };

  const paymentPieConfig = {
    data: paymentModeData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    innerRadius: 0.6,
    label: { text: "value", style: { fontWeight: 600 } },
    legend: { position: "bottom" },
    color: ({ type }) => ({ "ONLINE": "#1890ff", "OFFLINE": "#722ed1" }[type] || "#8c8c8c"),
  };

  const hourlyConfig = {
    data: hourlyData,
    xField: "hour",
    yField: "count",
    color: "#fa8c16",
    label: false,
    xAxis: { 
      label: { 
        formatter: (v) => `${v}:00`
      } 
    },
    meta: { hour: { alias: "Hour" }, count: { alias: "Orders" } },
  };

  // Get filter button style
  const getFilterButtonStyle = (filter) => {
    const isActive = selectedFilter === filter;
    return {
      background: isActive ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "rgba(255,255,255,0.95)",
      color: isActive ? "#fff" : "#667eea",
      border: isActive ? "none" : "1px solid #667eea",
      borderRadius: "20px",
      padding: "6px 16px",
      fontWeight: 500,
      transition: "all 0.3s ease",
      boxShadow: isActive ? "0 4px 12px rgba(102, 126, 234, 0.4)" : "none",
    };
  };

  // Top Products from API or empty
  const topProducts = dashboardStats?.topProducts || [];
  const topCustomers = dashboardStats?.topCustomers || [];

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", padding: "clamp(8px, 2vw, 24px)" }}>
      {/* Modern Gradient Header */}
      <div className="dashboard-header animate__animated animate__fadeInDown" style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "20px",
        padding: "24px 28px",
        marginBottom: "24px",
        boxShadow: "0 8px 32px rgba(102, 126, 234, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "300px", height: "300px", background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}></div>
        <div style={{ position: "absolute", bottom: "-30%", left: "-5%", width: "200px", height: "200px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }}></div>
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <div>
              <h2 className="mb-1" style={{ fontWeight: 700, color: "#ffffff", fontSize: "clamp(20px, 4vw, 28px)", textShadow: "0 2px 4px rgba(0,0,0,0.1)", cursor: "default", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 8 }} onClick={handleTitleClick}>
                  Dashboard
                  {showAll && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#fbbf24", verticalAlign: "middle" }} title="Showing all orders" />}
                </h2>
              <p className="mb-0" style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px" }}>Welcome back! Here's your business overview</p>
            </div>
            <Select
              value={selectedMode}
              onChange={setSelectedMode}
              style={{ width: 130, alignSelf: "flex-start" }}
              className="fw-medium"
              popupClassName="dashboard-select-popup"
            >
              <Option value="ALL"><div className="d-flex align-items-center gap-2"><BsGrid /><span>All Orders</span></div></Option>
              <Option value="ONLINE"><div className="d-flex align-items-center gap-2"><BsGraphUp /><span>Online</span></div></Option>
              <Option value="OFFLINE"><div className="d-flex align-items-center gap-2"><BsCart4 /><span>Offline</span></div></Option>
            </Select>
          </div>

          {/* Filter Buttons */}
          <div className="d-flex gap-2 flex-wrap align-items-center mt-3" style={{ overflowX: "auto", paddingBottom: 4 }}>
            <div className="filter-btn-group d-flex gap-1 flex-wrap" style={{ background: "rgba(255,255,255,0.15)", padding: "4px", borderRadius: "24px", flexShrink: 0 }}>
              {[{f: FILTERS.TODAY, label: "Today"}, {f: FILTERS.WEEK, label: "7 Days"}, {f: FILTERS.MONTH, label: "Month"}, {f: FILTERS.YEAR, label: "Year"}].map(({f, label}) => (
                <Button key={f} type="text" style={getFilterButtonStyle(f)} onClick={() => { setSelectedFilter(f); setDateRange(null); }}>{label}</Button>
              ))}
              <Button type="text" className="d-flex align-items-center" style={getFilterButtonStyle(FILTERS.CUSTOM)} onClick={() => setSelectedFilter(FILTERS.CUSTOM)}>
                <BsCalendar style={{ marginRight: 4 }} />Custom
              </Button>
            </div>
            {selectedFilter === FILTERS.CUSTOM && (
              <DatePicker.RangePicker
                size="middle"
                placeholder={["Start", "End"]}
                value={dateRange}
                onChange={(dates) => setDateRange(dates)}
                allowClear
                style={{ borderRadius: "12px", maxWidth: "100%" }}
              />
            )}
          </div>
        </div>
        
        {/* Date Range Display */}
        {selectedFilter !== FILTERS.CUSTOM && (
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
            {selectedFilter === FILTERS.TODAY && `Showing data for today - ${dayjs().format('DD MMMM YYYY')}`}
            {selectedFilter === FILTERS.WEEK && `Showing data for last 7 days`}
            {selectedFilter === FILTERS.MONTH && `Showing data for ${dayjs().format('MMMM YYYY')}`}
            {selectedFilter === FILTERS.YEAR && `Showing data for ${dayjs().format('YYYY')}`}
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <Row gutter={[20, 20]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-primary animate__animated animate__fadeInUp" style={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.15)",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animationDelay: "0.1s"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
              padding: "20px",
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(59, 130, 246, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>Total Revenue</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "26px" }}>₹{(displayStats.totalRevenue || 0).toLocaleString()}</h3>
                </div>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "22px",
                  boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)"
                }}>
                  <BsCurrencyDollar />
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsArrowUpRight /> {selectedFilter}</span>
              </div>
              <div className="mt-1" style={{ color: "#64748b", fontSize: "12px" }}>From {displayStats.totalOrders || 0} orders</div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-success animate__animated animate__fadeInUp" style={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 8px 24px rgba(34, 197, 94, 0.15)",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animationDelay: "0.2s"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
              padding: "20px",
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(34, 197, 94, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>Total Orders</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#15803d", fontSize: "26px" }}>{displayStats.totalOrders || 0}</h3>
                </div>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "22px",
                  boxShadow: "0 6px 16px rgba(34, 197, 94, 0.4)"
                }}>
                  <BsCart4 />
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsArrowUpRight /> Avg</span>
              </div>
              <div className="mt-1" style={{ color: "#64748b", fontSize: "12px" }}>₹{((displayStats.totalRevenue || 0) / (displayStats.totalOrders || 1)).toFixed(2)}/order</div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-warning animate__animated animate__fadeInUp" style={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 8px 24px rgba(249, 115, 22, 0.15)",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animationDelay: "0.3s"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
              padding: "20px",
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(249, 115, 22, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>Total Discount</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#c2410c", fontSize: "26px" }}>₹{(displayStats.totalDiscount || 0).toLocaleString()}</h3>
                </div>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "22px",
                  boxShadow: "0 6px 16px rgba(249, 115, 22, 0.4)"
                }}>
                  <BsPercent />
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: displayStats.totalSubtotal > 0 ? "#22c55e" : "#94a3b8", fontSize: "12px", fontWeight: 600 }}>
                  {((displayStats.totalDiscount || 0) / (displayStats.totalSubtotal || 1) * 100).toFixed(1)}% of total
                </span>
              </div>
              <div className="mt-1" style={{ color: "#64748b", fontSize: "12px" }}>Savings offered to customers</div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stat-card stat-card-purple animate__animated animate__fadeInUp" style={{
            borderRadius: "20px",
            border: "none",
            boxShadow: "0 8px 24px rgba(168, 85, 247, 0.15)",
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animationDelay: "0.4s"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
              padding: "20px",
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(168, 85, 247, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: 500, color: "#64748b" }}>Delivered Orders</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#7e22ce", fontSize: "26px" }}>{orderStatusData.find(s => s.type === "Delivered")?.value || 0}</h3>
                </div>
                <div style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: "22px",
                  boxShadow: "0 6px 16px rgba(168, 85, 247, 0.4)"
                }}>
                  <BsBoxSeam />
                </div>
              </div>
            </div>
            <div style={{ padding: "14px 20px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsCheckCircle /> Active</span>
              </div>
              <div className="mt-1" style={{ color: "#64748b", fontSize: "12px" }}>{displayStats.totalOrders > 0 ? (((orderStatusData.find(s => s.type === "Delivered")?.value || 0) / displayStats.totalOrders) * 100).toFixed(1) : 0}% delivery rate</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Charts Section - Show daily chart for today/7days, monthly for others */}
      <Row gutter={[20, 20]} className="mb-4">
        {(selectedFilter === FILTERS.TODAY || selectedFilter === FILTERS.WEEK) && dailyChartData.length > 0 ? (
          <Col xs={24} lg={16}>
            <Card
              className="animate__animated animate__fadeInLeft"
              title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsBarChart style={{ marginRight: 8, color: "#722ed1" }} />Daily Sales {selectedFilter === FILTERS.TODAY ? 'Today' : '(Last 7 Days)'}</span>}
              style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              bodyStyle={{ padding: "24px" }}
            >
              <Column {...dailyConfig} height={300} />
            </Card>
          </Col>
        ) : (
          <Col xs={24} lg={16}>
            <Card
              className="animate__animated animate__fadeInLeft"
              title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsBarChart style={{ marginRight: 8, color: "#3b82f6" }} />Revenue Overview (Monthly)</span>}
              style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              bodyStyle={{ padding: "24px" }}
            >
              <Column {...config} height={300} />
            </Card>
          </Col>
        )}
        
        <Col xs={24} lg={8}>
          <Card
            className="animate__animated animate__fadeInRight"
            title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsPieChart style={{ marginRight: 8, color: "#a855f7" }} />Order Status</span>}
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            bodyStyle={{ padding: "24px" }}
          >
            {orderStatusData.length > 0 ? (
              <Pie {...pieConfig} height={300} />
            ) : (
              <Empty description="No orders yet" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Analytics Section */}
      <Row gutter={[20, 20]} className="mb-4">
        {/* Payment Mode Distribution */}
        <Col xs={24} lg={8}>
          <Card
            className="animate__animated animate__fadeInLeft"
            title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsCurrencyRupee style={{ marginRight: 8, color: "#1890ff" }} />Payment Mode</span>}
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            bodyStyle={{ padding: "24px" }}
          >
            {paymentModeData.length > 0 ? (
              <Pie {...paymentPieConfig} height={280} />
            ) : (
              <Empty description="No data" />
            )}
          </Card>
        </Col>

        {/* Hourly Distribution (only for today/7days) */}
        {(selectedFilter === FILTERS.TODAY || selectedFilter === FILTERS.WEEK) && hourlyData.length > 0 ? (
          <Col xs={24} lg={16}>
            <Card
              className="animate__animated animate__fadeInRight"
              title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsClockHistory style={{ marginRight: 8, color: "#fa8c16" }} />Peak Hours Analysis</span>}
              style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              bodyStyle={{ padding: "24px" }}
            >
              <Bar {...hourlyConfig} height={280} />
            </Card>
          </Col>
        ) : (
          <Col xs={24} lg={16}>
            <Card
              className="animate__animated animate__fadeInRight"
              title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsCart4 style={{ marginRight: 8, color: "#52c41a" }} />Sales Overview</span>}
              style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              bodyStyle={{ padding: "24px" }}
            >
              <Column {...config2} height={280} />
            </Card>
          </Col>
        )}

        {/* Top Products */}
        <Col xs={24} lg={12}>
          <Card
            className="animate__animated animate__fadeInLeft"
            title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsLightning style={{ marginRight: 8, color: "#f5222d" }} />Top Products</span>}
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            bodyStyle={{ padding: "16px", maxHeight: 320, overflow: "auto" }}
          >
            {topProducts.length > 0 ? (
              <div className="top-products-list">
                {topProducts.map((product, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between p-2" style={{ borderBottom: index < topProducts.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <div className="d-flex align-items-center gap-2">
                      <Avatar size="small" style={{ backgroundColor: "#f5222d" }}>{index + 1}</Avatar>
                      <div>
                        <div className="fw-medium" style={{ fontSize: 13 }}>{product.title?.substring(0, 20) || 'Unknown'}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{product.totalQuantity || 0} sold</div>
                      </div>
                    </div>
                    <div className="text-success fw-bold" style={{ fontSize: 13 }}>₹{(product.totalRevenue || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No product data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Top Customers */}
        <Col xs={24} lg={12}>
          <Card
            className="animate__animated animate__fadeInRight"
            title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsPeople style={{ marginRight: 8, color: "#1890ff" }} />Top Customers</span>}
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            bodyStyle={{ padding: "16px", maxHeight: 320, overflow: "auto" }}
          >
            {topCustomers.length > 0 ? (
              <div className="top-customers-list">
                {topCustomers.map((customer, index) => (
                  <div key={index} className="d-flex align-items-center justify-content-between p-2" style={{ borderBottom: index < topCustomers.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <div className="d-flex align-items-center gap-2">
                      <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>{index + 1}</Avatar>
                      <div>
                        <div className="fw-medium" style={{ fontSize: 13 }}>{customer.firstname} {customer.lastname}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{customer.totalOrders || 0} orders</div>
                      </div>
                    </div>
                    <div className="text-success fw-bold" style={{ fontSize: 13 }}>₹{(customer.totalSpent || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="No customer data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Row gutter={[20, 20]}>
        <Col xs={24}>
          <Card
            className="animate__animated animate__fadeInUp"
            title={<span style={{ fontWeight: 600, fontSize: "15px" }}><BsCheckCircle style={{ marginRight: 8, color: "#f97316" }} />Recent Orders</span>}
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            bodyStyle={{ padding: "0" }}
          >
            <Table
              columns={columns}
              dataSource={orderData}
              pagination={{ pageSize: 5 }}
              size="small"
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Custom Styles */}
      <style>{`
        .dashboard-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate__fadeInUp { animation: fadeInUp 0.6s ease forwards; }
        .animate__fadeInDown { animation: fadeInDown 0.6s ease forwards; }
        .animate__fadeInLeft { animation: fadeInLeft 0.6s ease forwards; }
        .animate__fadeInRight { animation: fadeInRight 0.6s ease forwards; }
        
        .stat-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.15) !important;
        }
        
        .dashboard-header .ant-select-selector {
          border-radius: 12px !important;
          border: none !important;
          background: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          height: 38px !important;
        }
        
        .dashboard-header .ant-picker {
          border-radius: 12px !important;
          border: none !important;
          background: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          height: 38px !important;
        }
        
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          min-height: 56px;
          padding: 14px 20px;
        }
        
        .ant-table-thead > tr > th { 
          background-color: #f8fafc !important; 
          font-weight: 600 !important; 
          font-size: 12px;
          color: #475569;
          padding: 12px !important;
        }
        
        .ant-table-tbody > tr > td {
          padding: 12px !important;
        }
        
        .ant-tag {
          border-radius: 20px;
          padding: 2px 10px;
          font-weight: 500;
          font-size: 11px;
          border: none;
        }
        
        .ant-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1) !important;
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 12px !important;
          }

          .dashboard-header {
            padding: 16px !important;
            border-radius: 16px !important;
          }

          .stat-card {
            border-radius: 16px !important;
          }

          .filter-btn-group {
            border-radius: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 8px !important;
          }

          .filter-btn-group button {
            padding: 4px 10px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

