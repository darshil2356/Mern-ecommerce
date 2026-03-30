import React, { useEffect } from "react";
import { Table, Card, Row, Col, Tag, Button, Divider, Descriptions, Timeline } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftOutlined, HomeOutlined, UserOutlined, CreditCardOutlined, ShopOutlined } from "@ant-design/icons";
import { getaOrder } from "../features/auth/authSlice";
import dayjs from "dayjs";

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

const getTimelineStatus = (status) => {
  const statusOrder = ["Ordered", "Processed", "Shipped", "Out for Delivery", "Delivered"];
  const currentIndex = statusOrder.indexOf(status);
  return statusOrder.map((s, index) => ({
    status: s,
    completed: index <= currentIndex,
  }));
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

  const timelineStatuses = getTimelineStatus(orderState?.orderStatus);

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
            <div style={{ width: 50, height: 50, background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
              <span style={{ background: "#667eea", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, marginBottom: 4, display: "inline-block" }}>BUNDLE</span>
            )}
            <p style={{ margin: 0, fontWeight: 600, color: record.isBundle ? "#667eea" : "inherit" }}>{text}</p>
            {record.isBundle && record.bundleProducts?.map((bp, i) => (
              <p key={i} style={{ margin: 0, fontSize: 11, color: "#8c8c8c" }}>• {bp.title} ×{bp.quantity}</p>
            ))}
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
            backgroundColor: color?.title || color,
            border: "1px solid #d9d9d9"
          }} />
          <span>{color?.title || "N/A"}</span>
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
  const finalTotal = orderState?.totalPriceAfterDiscount || 0;
  const breakdown = orderState?.discountBreakdown || {};
  const directDiscount = breakdown.directDiscount || 0;
  const offerDiscount = breakdown.offerDiscount || 0;
  const coinDiscount = breakdown.coinDiscount || 0;
  const hasBreakdown = directDiscount > 0 || offerDiscount > 0 || coinDiscount > 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate("/admin/orders")}
          >
            Back
          </Button>
          <div>
            <h3 className="title" style={{ margin: 0 }}>Order Details</h3>
            <span style={{ fontSize: 12, color: "#8c8c8c" }}>
              Order ID: <span style={{ fontFamily: "monospace" }}>{orderState?._id?.slice(-8).toUpperCase()}</span>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag color={getStatusColor(orderState?.orderStatus)} style={{ fontSize: 14, padding: "4px 12px" }}>
            {orderState?.orderStatus}
          </Tag>
          <Tag color={orderState?.mode === "OFFLINE" ? "orange" : "green"} style={{ fontSize: 14, padding: "4px 12px" }}>
            {orderState?.mode || "ONLINE"}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {/* Customer Information */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><UserOutlined /> Customer Information</>} 
            size="small"
            style={{ height: "100%" }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">
                {orderState?.user?.firstname} {orderState?.user?.lastname}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {orderState?.user?.email || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Mobile">
                {orderState?.user?.mobile || "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Order Timeline */}
        <Col xs={24} lg={12}>
          <Card title="Order Status" size="small" style={{ height: "100%" }}>
            <Timeline
              mode="left"
              items={timelineStatuses.map(item => ({
                color: item.completed ? "green" : "gray",
                children: (
                  <span style={{ color: item.completed ? "#1890ff" : "#8c8c8c" }}>
                    {item.status}
                  </span>
                ),
              }))}
            />
          </Card>
        </Col>

        {/* Shipping Address */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><HomeOutlined /> Shipping Address</>} 
            size="small"
          >
            {orderState?.shippingInfo ? (
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Address">
                  {orderState.shippingInfo.address}
                </Descriptions.Item>
                <Descriptions.Item label="City">
                  {orderState.shippingInfo.city}
                </Descriptions.Item>
                <Descriptions.Item label="State">
                  {orderState.shippingInfo.state}
                </Descriptions.Item>
                <Descriptions.Item label="Pincode">
                  {orderState.shippingInfo.pincode}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <p style={{ color: "#8c8c8c" }}>No shipping address available</p>
            )}
          </Card>
        </Col>

        {/* Payment Information */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><CreditCardOutlined /> Payment Information</>} 
            size="small"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Payment Method">
                {orderState?.paymentInfo?.razorpayOrderId === "OFFLINE" ? "Offline/Cash" : "Online"}
              </Descriptions.Item>
              <Descriptions.Item label="Transaction ID">
                {orderState?.paymentInfo?.razorpayPaymentId || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {dayjs(orderState?.createdAt).format("DD-MM-YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Product Table */}
      <Card title="Order Items" style={{ marginTop: 16 }}>
        <Table 
          columns={productColumns} 
          dataSource={data1} 
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6}>
                  <strong>Subtotal</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right">
                  <strong>₹{subtotal.toFixed(2)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
              {hasBreakdown ? (
                <>
                  {directDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <span style={{ color: "#52c41a" }}>🏷️ Direct Discount</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <span style={{ color: "#52c41a" }}>-₹{directDiscount.toFixed(2)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {offerDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <span style={{ color: "#fa8c16" }}>🎁 User Offer Discount</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <span style={{ color: "#fa8c16" }}>-₹{offerDiscount.toFixed(2)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {coinDiscount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <span style={{ color: "#722ed1" }}>🪙 Coin Discount ({orderState?.coinsUsed || coinDiscount} coins)</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <span style={{ color: "#722ed1" }}>-₹{coinDiscount.toFixed(2)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {discount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell colSpan={6}>
                        <span style={{ color: "#cf1322", fontWeight: 600 }}>Total Discount</span>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <span style={{ color: "#cf1322", fontWeight: 600 }}>-₹{discount.toFixed(2)}</span>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                </>
              ) : (
                discount > 0 && (
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={6}>
                      <span style={{ color: "#52c41a" }}>Discount</span>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell align="right">
                      <span style={{ color: "#52c41a" }}>-₹{discount.toFixed(2)}</span>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )
              )}
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={6}>
                  <strong style={{ fontSize: 16 }}>Total Amount</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell align="right">
                  <strong style={{ fontSize: 16, color: "#1890ff" }}>₹{finalTotal.toFixed(2)}</strong>
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

