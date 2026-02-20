import React, { useEffect, useState, useMemo } from "react";
import { BsArrowDownRight, BsCart4, BsGraphUp, BsBoxSeam } from "react-icons/bs";
import { Column, Pie } from "@ant-design/plots";
import { Table, Card, Tag, DatePicker, Select, Row, Col, Avatar } from "antd";
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
    <div style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", padding: "24px" }}>
      <Card style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "24px" }} bodyStyle={{ padding: "20px 24px" }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h2 className="mb-1" style={{ fontWeight: 600, color: "#1a1a1a", fontSize: "24px" }}>Dashboard</h2>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Welcome back! Here's your business overview</p>
          </div>
          <div className="d-flex gap-3 align-items-center">
            <Select value={selectedMode} onChange={setSelectedMode} style={{ width: 140 }} className="fw-medium">
              <Option value="ONLINE"><BsGraphUp style={{ marginRight: 8 }} />Online</Option>
              <Option value="OFFLINE"><BsCart4 style={{ marginRight: 8 }} />Offline</Option>
            </Select>
            <DatePicker.RangePicker size="middle" className="w-[240px]" placeholder={["Start Date", "End Date"]} value={dateRange} onChange={(dates) => setDateRange(dates)} allowClear />
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Revenue</p>
                <h3 className="mb-0" style={{ fontWeight: 700, color: "#1890ff", fontSize: "24px" }}>₹{totalIncome.toLocaleString()}</h3>
              </div>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "#e6f7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1890ff", fontSize: "24px" }}>₹</div>
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: "12px" }}>From {filteredOrders.length} orders</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Orders</p>
                <h3 className="mb-0" style={{ fontWeight: 700, color: "#52c41a", fontSize: "24px" }}>{totalSales}</h3>
              </div>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "#f6ffed", display: "flex", alignItems: "center", justifyContent: "center", color: "#52c41a", fontSize: "24px" }}><BsCart4 /></div>
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: "12px" }}>Avg: ₹{averageOrderValue.toFixed(2)}/order</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total Discount</p>
                <h3 className="mb-0" style={{ fontWeight: 700, color: "#fa8c16", fontSize: "24px" }}>₹{totalDiscount.toLocaleString()}</h3>
              </div>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "#fff7e6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fa8c16", fontSize: "24px" }}><BsArrowDownRight /></div>
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: "12px" }}>Savings offered to customers</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "20px" }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Order Status</p>
                <h3 className="mb-0" style={{ fontWeight: 700, color: "#722ed1", fontSize: "24px" }}>{orderStatusData.length} Types</h3>
              </div>
              <div style={{ width: "56px", height: "56px", borderRadius: "12px", backgroundColor: "#f9f0ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#722ed1", fontSize: "24px" }}><BsBoxSeam /></div>
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: "12px" }}>Processing to Delivered</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={14}>
          <Card title={<span style={{ fontWeight: 600 }}>Revenue Overview</span>} style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "16px" }}><Column {...config} height={280} /></Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={{ fontWeight: 600 }}>Order Status Distribution</span>} style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "16px" }}><Pie {...pieConfig} height={280} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={<span style={{ fontWeight: 600 }}>Sales Overview</span>} style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "16px" }}><Column {...config2} height={280} /></Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={{ fontWeight: 600 }}>Recent Orders</span>} style={{ borderRadius: "12px", border: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} bodyStyle={{ padding: "0" }}><Table columns={columns} dataSource={orderData} pagination={{ pageSize: 5 }} size="small" /></Card>
        </Col>
      </Row>

      <style>{`
        .ant-card-head { border-bottom: 1px solid #f0f0f0; }
        .ant-card-head-title { font-weight: 600; }
        .ant-table-thead > tr > th { background-color: #fafafa !important; font-weight: 600 !important; font-size: 13px; }
        .ant-table-tbody > tr:hover > td { background-color: #f5f5f5 !important; }
        .ant-pagination { padding: 12px !important; margin: 0 !important; }
      `}</style>
    </div>
  );
};

export default Dashboard;

