import React, { useEffect } from "react";
import { Table, Card, Row, Col, Tag, Button, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { getCustomerDetails } from "../features/customers/customerSlice";

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
    },
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => id?.slice(-8).toUpperCase(),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Items",
      dataIndex: "orderItems",
      key: "items",
      render: (items) => items?.length || 0,
    },
    {
      title: "Total",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price) => `₹${price?.toFixed(2) || "0.00"}`,
    },
    {
      title: "Discount",
      dataIndex: "totalPrice",
      key: "discount",
      render: (price, record) => {
        const discount = (record.totalPrice || 0) - (record.totalPriceAfterDiscount || 0);
        return discount > 0 ? `₹${discount.toFixed(2)}` : "-";
      },
    },
    {
      title: "Final Amount",
      dataIndex: "totalPriceAfterDiscount",
      key: "totalPriceAfterDiscount",
      render: (price) => `₹${price?.toFixed(2) || "0.00"}`,
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
        let color = "default";
        if (status === "Delivered") color = "green";
        else if (status === "Processed") color = "blue";
        else if (status === "Shipped") color = "purple";
        else if (status === "Out for Delivery") color = "cyan";
        
        return <Tag color={color}>{status}</Tag>;
      },
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
        <h3 className="mb-4 title">Customer Details</h3>
        <Button onClick={() => navigate("/admin/customers")}>
          Back to Customers
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card title="Personal Information" style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={8}>
            <p><strong>Name:</strong> {customer.firstname} {customer.lastname}</p>
          </Col>
          <Col span={8}>
            <p><strong>Email:</strong> {customer.email}</p>
          </Col>
          <Col span={8}>
            <p><strong>Mobile:</strong> {customer.mobile}</p>
          </Col>
          <Col span={8}>
            <p><strong>Address:</strong> {customer.address || "N/A"}</p>
          </Col>
          <Col span={8}>
            <p><strong>GSTIN:</strong> {customer.gstin || "N/A"}</p>
          </Col>
          <Col span={8}>
            <p><strong>Customer Since:</strong> {new Date(customer.createdAt).toLocaleDateString()}</p>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0 }}>Total Orders</p>
              <h2 style={{ margin: "10px 0", color: "#1890ff" }}>{statistics.totalOrders}</h2>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0 }}>Total Purchase</p>
              <h2 style={{ margin: "10px 0", color: "#52c41a" }}>₹{statistics.totalPurchaseAmount?.toFixed(2)}</h2>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0 }}>Total Savings Offered</p>
              <h2 style={{ margin: "10px 0", color: "#faad14" }}>₹{statistics.totalSavings?.toFixed(2)}</h2>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#8c8c8c", margin: 0 }}>Current Offer</p>
              <h2 style={{ margin: "10px 0", color: "#f5222d" }}>{getOfferText()}</h2>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Order History */}
      <Card title="Order History">
        {statistics.lastOrderDate && (
          <p style={{ marginBottom: 16, color: "#8c8c8c" }}>
            <strong>Last Order Date:</strong> {new Date(statistics.lastOrderDate).toLocaleString()}
          </p>
        )}
        <Table 
          columns={orderColumns} 
          dataSource={dataSource} 
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default CustomerDetail;

