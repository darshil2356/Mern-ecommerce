import React, { useEffect } from "react";
import { Table, Card, Row, Col, Tag, Button, Spin, Tooltip, Tabs } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  UserOutlined,
  ShopOutlined,
  GiftOutlined,
  TransactionOutlined,
} from "@ant-design/icons";
import { getCustomerDetails } from "../features/customers/customerSlice";

const getStatusColor = (status) => {
  const colors = {
    Ordered: "default",
    Processed: "blue",
    Shipped: "purple",
    "Out for Delivery": "cyan",
    Delivered: "green",
    Cancelled: "red",
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

  const { customer, statistics, orders, coinTransactions = [], referralInfo = {} } = customerDetails;

  const orderColumns = [
    { title: "SNo", dataIndex: "key", key: "key", width: 60 },
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
      defaultSortOrder: "descend",
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
        const discount =
          record.discountAmount ||
          (record.totalPrice || 0) - (record.totalPriceAfterDiscount || 0);
        return discount > 0 ? (
          <span style={{ color: "#52c41a" }}>₹{discount.toFixed(2)}</span>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Final",
      dataIndex: "totalPriceAfterDiscount",
      key: "totalPriceAfterDiscount",
      align: "right",
      render: (price) => (
        <strong style={{ color: "#1890ff" }}>₹{price?.toFixed(2) || "0.00"}</strong>
      ),
    },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      render: (mode) => (
        <Tag color={mode === "OFFLINE" ? "orange" : "green"}>{mode || "ONLINE"}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
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

  const coinColumns = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
      defaultSortOrder: "descend",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "credit" ? "green" : "red"}>
          {type === "credit" ? "+" : "-"} {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Coins",
      dataIndex: "coins",
      key: "coins",
      align: "right",
      render: (coins, record) => (
        <strong style={{ color: record.type === "credit" ? "#52c41a" : "#f5222d" }}>
          {record.type === "credit" ? "+" : "-"}
          {coins}
        </strong>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => <Tag>{source || "other"}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (desc) => desc || "-",
    },
  ];

  const orderDataSource = orders?.map((order, index) => ({ key: index + 1, ...order })) || [];
  const coinDataSource = coinTransactions?.map((txn, index) => ({ key: index + 1, ...txn })) || [];

  const totalCoinCredits = coinTransactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + (t.coins || 0), 0);

  const totalCoinDebits = coinTransactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + (t.coins || 0), 0);

  const getOfferText = () => {
    if (!customer.offerType) return "No Offer";
    if (customer.offerType === "percentage") return `${customer.offerDiscount}% OFF`;
    return `₹${customer.offerDiscount} FLAT OFF`;
  };

  const tabItems = [
    {
      key: "orders",
      label: (
        <span>
          <ShopOutlined /> Order History ({orders?.length || 0})
        </span>
      ),
      children: (
        <Table
          columns={orderColumns}
          dataSource={orderDataSource}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          size="small"
        />
      ),
    },
    {
      key: "coins",
      label: (
        <span>
          <TransactionOutlined /> Coin Transactions ({coinTransactions?.length || 0})
        </span>
      ),
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={8}>
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Current Balance</p>
                  <h3 style={{ margin: "6px 0", color: "#1890ff" }}>{customer.coins || 0} coins</h3>
                </div>
              </Card>
            </Col>
            <Col xs={8}>
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Total Earned</p>
                  <h3 style={{ margin: "6px 0", color: "#52c41a" }}>+{totalCoinCredits}</h3>
                </div>
              </Card>
            </Col>
            <Col xs={8}>
              <Card size="small">
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Total Used</p>
                  <h3 style={{ margin: "6px 0", color: "#f5222d" }}>-{totalCoinDebits}</h3>
                </div>
              </Card>
            </Col>
          </Row>
          <Table
            columns={coinColumns}
            dataSource={coinDataSource}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </>
      ),
    },
    {
      key: "referral",
      label: (
        <span>
          <GiftOutlined /> Referral Info
        </span>
      ),
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <p><strong>Referral Code:</strong> {customer.referralCode || "N/A"}</p>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <p>
                <strong>Referred By:</strong>{" "}
                {referralInfo?.referredBy
                  ? `${referralInfo.referredBy.firstname} ${referralInfo.referredBy.lastname} (${referralInfo.referredBy.mobile || ""})`
                  : customer.referredBy
                  ? "Linked"
                  : "Direct / No Referral"}
              </p>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <p><strong>Referral Count (referred others):</strong> {customer.referralCount || 0}</p>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <p><strong>Referral Earnings:</strong> {customer.referralEarnings || 0} coins</p>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

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

      {/* Personal Info */}
      <Card title={<><UserOutlined /> Personal Information</>} style={{ marginBottom: 16 }}>
        <Row gutter={[16, 8]}>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Name:</strong> {customer.firstname} {customer.lastname}</p>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <p><strong>Email:</strong> {customer.email || "N/A"}</p>
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
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
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
              <h2 style={{ margin: "10px 0", color: "#52c41a" }}>
                ₹{statistics.totalPurchaseAmount?.toFixed(2)}
              </h2>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Total Savings</p>
              <h2 style={{ margin: "10px 0", color: "#faad14" }}>
                ₹{statistics.totalSavings?.toFixed(2)}
              </h2>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Coin Balance</p>
              <h2 style={{ margin: "10px 0", color: "#722ed1" }}>{customer.coins || 0}</h2>
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
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0, fontSize: 12 }}>Referral Count</p>
              <h2 style={{ margin: "10px 0", color: "#13c2c2" }}>{customer.referralCount || 0}</h2>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tabs: Orders | Coins | Referral */}
      <Card>
        <Tabs defaultActiveKey="orders" items={tabItems} />
      </Card>
    </div>
  );
};

export default CustomerDetail;
