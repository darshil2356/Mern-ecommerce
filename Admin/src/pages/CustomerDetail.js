import React, { useEffect } from "react";
import { Table, Card, Row, Col, Tag, Button, Spin, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeftOutlined, EyeOutlined, UserOutlined, ShopOutlined } from "@ant-design/icons";
import { getCustomerDetails } from "../features/customers/customerSlice";

const getStatusColor = (status) => {
  const colors = {
    "Ordered": "default",
    "Processed": "blue",
    "Shipped": "purple",
    "Out for Delivery": "cyan",
    "Delivered": "green",
    "Cancelled": "red",
  };
  return colors[status] || "default";
};

const CustomerDetail = () => {
  const location = useLocation();
  const customerId = location.pathname.split("/")[3];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { customerDetails, loading } = useSelector((state) => state.customer);

  useEffect(() => {
    if (customerId) {
      dispatch(getCustomerDetails(customerId));
    }
  }, [dispatch, customerId]);

  if (loading || !customerDetails) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  const { customer, statistics, orders } = customerDetails;

  const orderColumns = [
    {
      title: "SNo",
      dataIndex: "key",
      key: "key",
      width: 60,
    },
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => (
        <Link to={`/admin/order/${id}`}>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#1890ff" }}>
            {id?.slice(-8).toUpperCase()}
          </span>
        </Link>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
    },
    {
      title: "Items",
      dataIndex: "orderItems",
      key: "items",
      align: "center",
      render: (items) => items?.length || 0,
    },
    {
      title: "Subtotal",
      dataIndex: "totalPrice",
      key: "totalPrice",
      align: "right",
      render: (price) => `₹${price?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Discount",
      dataIndex: "totalPrice",
      key: "discount",
      align: "right",
      render: (price, record) => {
        const discount = record.discountAmount || ((record.totalPrice || 0) - (record.totalPriceAfterDiscount || 0));
        return discount > 0 ? <span style={{ color: "#52c41a" }}>₹{discount.toFixed(2)}</span> : "-";
      },
    },
    {
      title: "Final",
      dataIndex: "totalPriceAfterDiscount",
      key: "totalPriceAfterDiscount",
      align: "right",
      render: (price) => <strong style={{ color: "#1890ff" }}>₹{price?.toFixed(2) || "0.00"}</strong>,
    },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      render: (mode) => (
        <Tag color={mode === "OFFLINE" ? "orange" : "green"}>
          {mode || "ONLINE"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      render: (status) => {
        return <Tag color={getStatusColor(status)}>{status}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Tooltip title="View Order Details">
          <Link to={`/admin/order/${record._id}`}>
            <Button size="small" icon={<EyeOutlined />} />
          </Link>
        </Tooltip>
      ),
    },
  ];

  const dataSource = orders?.map((order, index) => ({
    key: index + 1,
    ...order,
  })) || [];

  const getOfferText = () => {
    if (!customer.offerType) return "No Offer";
    if (customer.offerType === "percentage") {
      return `${customer.offerDiscount}% OFF`;
    }
    return `₹${customer.offerDiscount} FLAT OFF`;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/admin/customers")}>
            Back
          </Button>
          <h3 className="mb-0 title">Customer Details</h3>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card title={<><UserOutlined /> Personal Information</>}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Name:</strong> {customer.firstname} {customer.lastname}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Email:</strong> {customer.email}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Mobile:</strong> {customer.mobile}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Address:</strong> {customer.address || "N/A"}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>GSTIN:</strong> {customer.gstin || "N/A"}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Customer Since:</strong> {new Date(customer.createdAt).toLocaleDateString()}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Referral Code:</strong> {customer.referralCode || "N/A"}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Referred By:</strong> {customer.referredBy ? `${customer.referredBy.firstname} ${customer.referredBy.lastname}` : "Direct"}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Referral Count:</strong> {customer.referralCount || 0}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Coins:</strong> {customer.coins || 0}</p>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Total Orders</p>
              <h2 style={{ margin: "10px 0", color: "#1890ff" }}>{statistics.totalOrders}</h2>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Total Purchase</p>
              <h2 style={{ margin: "10px 0", color: "#52c41a" }}>₹{statistics.totalPurchaseAmount?.toFixed(2)}</h2>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Total Savings</p>
              <h2 style={{ margin: "10px 0", color: "#faad14" }}>₹{statistics.totalSavings?.toFixed(2)}</h2>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Current Offer</p>
              <h2 style={{ margin: "10px 0", color: "#f5222d", fontSize: 18 }}>{getOfferText()}</h2>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Order History */}
      <Card 
        title={<><ShopOutlined /> Order History</>} 
        style={{ marginTop: 16 }}
        extra={statistics.lastOrderDate && (
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>
            Last Order: {new Date(statistics.lastOrderDate).toLocaleString()}
          </span>
        )}
      >
        <Table 
          columns={orderColumns} 
          dataSource={dataSource} 
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default CustomerDetail;

