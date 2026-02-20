import React, { useEffect, useState, useMemo } from "react";
import { BsArrowDownRight, BsArrowUpRight, BsCart4, BsGraphUp, BsBoxSeam, BsCurrencyRupee, BsPercent, BsCheckCircle, BsTruck, BsXCircle, BsClock, BsBarChart, BsPieChart, BsCalendar, BsLightning, BsPeople, BsCurrencyDollar } from "react-icons/bs";
import { Column, Pie } from "@ant-design/plots";
import { Table, Card, Tag, DatePicker, Select, Row, Col, Avatar, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getMonthlyData, getOrders, getYearlyData } from "../features/auth/authSlice";
import dayjs from "dayjs";

const { Option } = Select;

const Dashboard = () => {
  const dispatch = useDispatch();
  const monthlyDataState = useSelector((state) => state?.auth?.monthlyData);
  const yearlyDataState = useSelector((state) => state?.auth?.yearlyData);
  const [selectedMode, setSelectedMode] = useState("ONLINE");
  const [dateRange, setDateRange] = useState(null);
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const filteredOrders = useMemo(() => {
    if (!orderState) return [];
    return orderState.filter((order) => {
      if ((order.mode || "ONLINE") !== selectedMode) return false;
      if (dateRange) {
        const orderDate = dayjs(order.createdAt);
        const [start, end] = dateRange;
        if (orderDate.isBefore(start.startOf("day")) || orderDate.isAfter(end.endOf("day"))) {
          return false;
        }
      }
      return true;
    });
  }, [orderState, selectedMode, dateRange]);

  const totalIncome = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  }, [filteredOrders]);

  const totalSales = useMemo(() => filteredOrders.length, [filteredOrders]);

  const totalDiscount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      const discount = (order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0);
      return sum + discount;
    }, 0);
  }, [filteredOrders]);

  const averageOrderValue = useMemo(() => {
    return totalSales > 0 ? totalIncome / totalSales : 0;
  }, [totalIncome, totalSales]);

  const [dataMonthly, setDataMonthly] = useState([]);
  const [dataMonthlySales, setDataMonthlySales] = useState([]);
  const [orderData, setOrderData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);

  const getTokenFromLocalStorage = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const config3 = {
    headers: {
      Authorization: `Bearer ${getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""}`,
      Accept: "application/json",
    },
  };

  useEffect(() => {
    dispatch(getMonthlyData(config3));
    dispatch(getYearlyData(config3));
    dispatch(getOrders(config3));
  }, []);

  useEffect(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const incomeByMonth = {};
    const salesByMonth = {};
    const statusCount = {};

    filteredOrders.forEach((order) => {
      const date = new Date(order.createdAt);
      const month = monthNames[date.getMonth()];
      incomeByMonth[month] = (incomeByMonth[month] || 0) + order.totalPrice;
      salesByMonth[month] = (salesByMonth[month] || 0) + 1;
      const status = order.orderStatus || "Processing";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    setDataMonthly(Object.keys(incomeByMonth).map((m) => ({ type: m, income: incomeByMonth[m] })));
    setDataMonthlySales(Object.keys(salesByMonth).map((m) => ({ type: m, income: salesByMonth[m] })));
    setOrderStatusData(Object.keys(statusCount).map((status) => ({ type: status, value: statusCount[status] })));

    setOrderData(filteredOrders.map((order, i) => ({
      key: i,
      name: order.user ? `${order.user.firstname || ""} ${order.user.lastname || ""}` : "Deleted User",
      product: order.orderItems?.length,
      price: order.totalPrice,
      dprice: order.totalPriceAfterDiscount,
      staus: order.orderStatus,
      date: order.createdAt,
    })));
  }, [filteredOrders]);

  const columns = [
    { title: "SNo", dataIndex: "key", width: 60, render: (text, record, index) => <span className="text-muted">{index + 1}</span> },
    {
      title: "Customer", dataIndex: "name",
      render: (name) => (
        <div className="d-flex align-items-center gap-2">
          <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>{name.charAt(0)}</Avatar>
          <span className="fw-medium">{name}</span>
        </div>
      ),
    },
    { title: "Items", dataIndex: "product", width: 80, align: "center" },
    { title: "Amount", dataIndex: "price", render: (price) => <span className="fw-bold" style={{ color: "#1a1a1a" }}>₹{price?.toLocaleString()}</span> },
    { title: "After Discount", dataIndex: "dprice", render: (dprice) => <span className="text-success fw-medium">₹{dprice?.toLocaleString()}</span> },
    {
      title: "Status", dataIndex: "staus",
      render: (status) => {
        const statusConfig = { "Processing": { color: "gold" }, "Shipped": { color: "blue" }, "Delivered": { color: "green" }, "Cancelled": { color: "red" } };
        return <Tag color={statusConfig[status]?.color || "default"} style={{ borderRadius: "20px", padding: "2px 12px", fontWeight: 500 }}>{status}</Tag>;
      },
    },
  ];

  const config = { data: dataMonthly, xField: "type", yField: "income", color: "#1890ff", label: { position: "middle", style: { fill: "#FFFFFF", opacity: 1 } }, xAxis: { label: { autoHide: true, autoRotate: false } }, meta: { type: { alias: "Month" }, sales: { alias: "Income" } }, smooth: true };
  const config2 = { data: dataMonthlySales, xField: "type", yField: "income", color: "#52c41a", label: { position: "middle", style: { fill: "#FFFFFF", opacity: 1 } }, xAxis: { label: { autoHide: true, autoRotate: false } }, meta: { type: { alias: "Month" }, sales: { alias: "Sales" } }, smooth: true };
  const pieConfig = {
    data: orderStatusData, angleField: "value", colorField: "type", radius: 0.8, innerRadius: 0.6,
    label: { text: "value", style: { fontWeight: 600 } }, legend: { position: "bottom" },
    color: ({ type }) => ({ "Processing": "#faad14", "Shipped": "#1890ff", "Delivered": "#52c41a", "Cancelled": "#ff4d4f" }[type] || "#8c8c8c"),
    annotations: [{ type: "text", style: { text: `${totalSales}\nOrders`, x: "50%", y: "50%", textAlign: "center", fontSize: 20, fontWeight: 600 } }],
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", padding: "24px" }}>
      {/* Modern Gradient Header */}
      <div className="dashboard-header animate__animated animate__fadeInDown" style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        borderRadius: "20px", 
        padding: "28px 32px", 
        marginBottom: "24px",
        boxShadow: "0 8px 32px rgba(102, 126, 234, 0.35)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "300px", height: "300px", background: "rgba(255,255,255,0.1)", borderRadius: "50%" }}></div>
        <div style={{ position: "absolute", bottom: "-30%", left: "-5%", width: "200px", height: "200px", background: "rgba(255,255,255,0.08)", borderRadius: "50%" }}></div>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ position: "relative", zIndex: 1 }}>
          <div>
            <h2 className="mb-1" style={{ fontWeight: 700, color: "#ffffff", fontSize: "32px", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>Dashboard</h2>
            <p className="mb-0" style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>Welcome back! Here's your business overview</p>
          </div>
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <Select 
              value={selectedMode} 
              onChange={setSelectedMode} 
              style={{ width: 160 }} 
              className="fw-medium dashboard-select"
              popupClassName="dashboard-select-popup"
            >
              <Option value="ONLINE"><BsGraphUp style={{ marginRight: 8 }} />Online Orders</Option>
              <Option value="OFFLINE"><BsCart4 style={{ marginRight: 8 }} />Offline Orders</Option>
            </Select>
            <DatePicker.RangePicker 
              size="middle" 
              className="dashboard-datepicker" 
              placeholder={["Start Date", "End Date"]} 
              value={dateRange} 
              onChange={(dates) => setDateRange(dates)} 
              allowClear 
              style={{ borderRadius: "12px", width: "280px" }}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards Row with Gradient Effects */}
      <Row gutter={[24, 24]} className="mb-4">
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
              padding: "24px", 
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(59, 130, 246, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2" style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>Total Revenue</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "28px" }}>₹{totalIncome.toLocaleString()}</h3>
                </div>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "16px", 
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#ffffff", 
                  fontSize: "26px",
                  boxShadow: "0 8px 20px rgba(59, 130, 246, 0.5)"
                }}>
                  <BsCurrencyDollar />
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsArrowUpRight /> 12.5%</span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>vs last month</span>
              </div>
              <div className="mt-2" style={{ color: "#64748b", fontSize: "13px" }}>From {filteredOrders.length} orders</div>
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
              padding: "24px", 
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(34, 197, 94, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2" style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>Total Orders</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#15803d", fontSize: "28px" }}>{totalSales}</h3>
                </div>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "16px", 
                  background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#ffffff", 
                  fontSize: "26px",
                  boxShadow: "0 8px 20px rgba(34, 197, 94, 0.5)"
                }}>
                  <BsCart4 />
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsArrowUpRight /> 8.2%</span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>vs last month</span>
              </div>
              <div className="mt-2" style={{ color: "#64748b", fontSize: "13px" }}>Avg: ₹{averageOrderValue.toFixed(2)}/order</div>
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
              padding: "24px", 
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(249, 115, 22, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2" style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>Total Discount</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#c2410c", fontSize: "28px" }}>₹{totalDiscount.toLocaleString()}</h3>
                </div>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "16px", 
                  background: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#ffffff", 
                  fontSize: "26px",
                  boxShadow: "0 8px 20px rgba(249, 115, 22, 0.5)"
                }}>
                  <BsPercent />
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsArrowDownRight /> 3.1%</span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>vs last month</span>
              </div>
              <div className="mt-2" style={{ color: "#64748b", fontSize: "13px" }}>Savings offered to customers</div>
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
              padding: "24px", 
              borderRadius: "20px 20px 0 0",
              position: "relative"
            }}>
              <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", background: "rgba(168, 85, 247, 0.2)", borderRadius: "50%" }}></div>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-2" style={{ fontSize: "14px", fontWeight: 500, color: "#64748b" }}>Order Status</p>
                  <h3 className="mb-0" style={{ fontWeight: 700, color: "#7e22ce", fontSize: "28px" }}>{orderStatusData.length} Types</h3>
                </div>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "16px", 
                  background: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#ffffff", 
                  fontSize: "26px",
                  boxShadow: "0 8px 20px rgba(168, 85, 247, 0.5)"
                }}>
                  <BsBoxSeam />
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 24px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
              <div className="d-flex align-items-center gap-2">
                <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><BsArrowUpRight /> 5.4%</span>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>vs last month</span>
              </div>
              <div className="mt-2" style={{ color: "#64748b", fontSize: "13px" }}>Processing to Delivered</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]} className="mb-4">
        <Col xs={24} lg={14}>
          <Card 
            className="animate__animated animate__fadeInLeft"
            title={<span style={{ fontWeight: 600, fontSize: "16px" }}><BsBarChart style={{ marginRight: 10, color: "#3b82f6" }} />Revenue Overview</span>} 
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} 
            bodyStyle={{ padding: "24px" }}
            headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          >
            <Column {...config} height={320} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            className="animate__animated animate__fadeInRight"
            title={<span style={{ fontWeight: 600, fontSize: "16px" }}><BsPieChart style={{ marginRight: 10, color: "#a855f7" }} />Order Status</span>} 
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} 
            bodyStyle={{ padding: "24px" }}
            headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          >
            <Pie {...pieConfig} height={320} />
          </Card>
        </Col>
      </Row>

      {/* Sales and Recent Orders */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card 
            className="animate__animated animate__fadeInLeft"
            title={<span style={{ fontWeight: 600, fontSize: "16px" }}><BsCart4 style={{ marginRight: 10, color: "#22c55e" }} />Sales Overview</span>} 
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} 
            bodyStyle={{ padding: "24px" }}
            headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          >
            <Column {...config2} height={320} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card 
            className="animate__animated animate__fadeInRight"
            title={<span style={{ fontWeight: 600, fontSize: "16px" }}><BsCheckCircle style={{ marginRight: 10, color: "#f97316" }} />Recent Orders</span>} 
            style={{ borderRadius: "20px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }} 
            bodyStyle={{ padding: "0" }}
            headStyle={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px" }}
          >
            <Table 
              columns={columns} 
              dataSource={orderData} 
              pagination={{ pageSize: 5 }} 
              size="small" 
            />
          </Card>
        </Col>
      </Row>

      {/* Custom Styles */}
      <style>{`
        .dashboard-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        /* Animations */
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
        
        /* Stat Card Hover Effects */
        .stat-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15) !important;
        }
        
        /* Header Select Styling */
        .dashboard-header .ant-select-selector {
          border-radius: 12px !important;
          border: none !important;
          background: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          height: 40px !important;
          padding: 4px 12px !important;
        }
        
        .dashboard-header .ant-select-selection-item {
          line-height: 30px !important;
        }
        
        .dashboard-header .ant-picker {
          border-radius: 12px !important;
          border: none !important;
          background: rgba(255, 255, 255, 0.95) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          height: 40px !important;
        }
        
        .dashboard-header .ant-picker-input > input {
          font-size: 14px;
        }
        
        /* Card Head Improvements */
        .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          min-height: 60px;
          padding: 16px 24px;
        }
        
        .ant-card-head-title {
          font-weight: 600;
          color: #1e293b;
        }
        
        /* Table Improvements */
        .ant-table-thead > tr > th { 
          background-color: #f8fafc !important; 
          font-weight: 600 !important; 
          font-size: 13px;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          padding: 14px 16px !important;
        }
        
        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .ant-table-tbody > tr:hover > td { 
          background-color: #f1f5f9 !important; 
        }
        
        .ant-pagination { 
          padding: 16px !important; 
          margin: 0 !important; 
        }
        
        /* Status Badge Styling */
        .ant-tag {
          border-radius: 20px;
          padding: 4px 14px;
          font-weight: 500;
          font-size: 12px;
          border: none;
        }
        
        /* Smooth Transitions */
        .ant-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .ant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
        }
        
        /* Responsive Design */
        @media (max-width: 1200px) {
          .dashboard-header {
            padding: 24px !important;
          }
          
          .dashboard-header h2 {
            font-size: 26px !important;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px !important;
          }
          
          .dashboard-header {
            padding: 20px !important;
            border-radius: 16px !important;
          }
          
          .dashboard-header h2 {
            fontSize: 22px !important;
          }
          
          .dashboard-header .d-flex.gap-3 {
            gap: 12px !important;
          }
          
          .dashboard-header .ant-select-selector,
          .dashboard-header .ant-picker {
            width: 100% !important;
          }
          
          .stat-card {
            border-radius: 16px !important;
          }
          
          .stat-card > div:first-child {
            padding: 20px !important;
            border-radius: 16px 16px 0 0 !important;
          }
          
          .stat-card > div:last-child {
            padding: 14px 20px !important;
            border-radius: 0 0 16px 16px !important;
          }
          
          .ant-card {
            border-radius: 16px !important;
            margin-bottom: 16px;
          }
        }
        
        @media (max-width: 576px) {
          .dashboard-header {
            padding: 16px !important;
          }
          
          .dashboard-header h2 {
            font-size: 20px !important;
          }
          
          .dashboard-header p {
            font-size: 13px !important;
          }
          
          .stat-card h3 {
            font-size: 22px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

