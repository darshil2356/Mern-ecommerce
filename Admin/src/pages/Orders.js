import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Popover, DatePicker, Radio, Tag, Tooltip } from "antd";
import { FilterOutlined, EyeOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getOrders, updateAOrder } from "../features/auth/authSlice";

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

const getPaymentStatus = (paymentInfo) => {
  if (!paymentInfo) return { status: "Unknown", color: "default" };
  if (paymentInfo.razorpayPaymentId) {
    return { status: "Paid", color: "green" };
  }
  if (paymentInfo.razorpayOrderId === "OFFLINE") {
    return { status: "Offline Paid", color: "blue" };
  }
  return { status: "Pending", color: "orange" };
};

const columns = [
  { 
    title: "SNo", 
    dataIndex: "key",
    width: 60,
  },
  { 
    title: "Order ID", 
    dataIndex: "orderId",
    render: (id) => <span style={{ fontFamily: "monospace", fontSize: 12 }}>{id?.slice(-8).toUpperCase()}</span>,
  },
  { 
    title: "Name", 
    dataIndex: "name",
    ellipsis: true,
  },
  { 
    title: "Items", 
    dataIndex: "items",
    align: "center",
    width: 70,
  },
  { 
    title: "Amount", 
    dataIndex: "amount",
    render: (amount) => <span style={{ fontWeight: 600 }}>₹{amount?.toFixed(2)}</span>,
  },
  { 
    title: "Discount", 
    dataIndex: "discount",
    render: (discount) => discount > 0 ? <span style={{ color: "#52c41a" }}>-₹{discount.toFixed(2)}</span> : "-",
  },
  { 
    title: "Final", 
    dataIndex: "finalAmount",
    render: (amount) => <span style={{ fontWeight: 700, color: "#1890ff" }}>₹{amount?.toFixed(2)}</span>,
  },
  { 
    title: "Status", 
    dataIndex: "status",
    render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    width: 130,
  },
  { 
    title: "Payment", 
    dataIndex: "payment",
    render: (payment) => <Tag color={payment.color}>{payment.status}</Tag>,
  },
  { 
    title: "Mode", 
    dataIndex: "mode",
    render: (mode) => (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 11,
          color: "#fff",
          background: mode === "OFFLINE" ? "#fa541c" : "#52c41a",
        }}
      >
        {mode}
      </span>
    ),
    width: 90,
  },
  { 
    title: "Date", 
    dataIndex: "date",
    sorter: (a, b) => new Date(a.rawDate) - new Date(b.rawDate),
  },
  { 
    title: "Action", 
    dataIndex: "action",
    width: 150,
  },
];

const Orders = () => {
  const dispatch = useDispatch();
  const orderState = useSelector((state) => state?.auth?.orders?.orders);

  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: null,
    mode: null,
    status: null,
  });

  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  const updateOrderStatus = (id, status) => {
    dispatch(updateAOrder({ id, status }));
  };

  const dataSource = useMemo(() => {
    if (!orderState) return [];

    return orderState.map((order, index) => {
      // Use discountAmount if available, otherwise calculate from difference
      const discount = order.discountAmount || ((order.totalPrice || 0) - (order.totalPriceAfterDiscount || 0));
      const payment = getPaymentStatus(order.paymentInfo);
      
      return {
        key: index + 1,
        orderId: order._id,
        name: order?.user?.firstname || "N/A",
        items: order?.orderItems?.length || 0,
        amount: order?.totalPrice,
        discount: discount,
        finalAmount: order?.totalPriceAfterDiscount,
        status: order?.orderStatus || "Ordered",
        payment: payment,
        mode: order?.mode || "ONLINE",
        date: dayjs(order?.createdAt).format("DD-MM-YYYY HH:mm"),
        rawDate: order?.createdAt,
        action: (
          <div style={{ display: "flex", gap: 8 }}>
            <Tooltip title="View Order">
              <Link to={`/admin/order/${order?._id}`}>
                <Button size="small" icon={<EyeOutlined />} />
              </Link>
            </Tooltip>
            <select
              defaultValue={order?.orderStatus}
              onChange={(e) => updateOrderStatus(order?._id, e.target.value)}
              className="form-control form-select"
              style={{ fontSize: 12, padding: "4px 8px" }}
            >
              <option value="Ordered" disabled>Ordered</option>
              <option value="Processed">Processed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        ),
      };
    });
  }, [orderState]);

  const filteredData = useMemo(() => {
    return dataSource.filter((item) => {
      let ok = true;

      if (filters.mode) {
        ok = ok && item.mode === filters.mode;
      }

      if (filters.status) {
        ok = ok && item.status === filters.status;
      }

      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const d = dayjs(item.rawDate);
        ok =
          ok &&
          d.isAfter(start.startOf("day")) &&
          d.isBefore(end.endOf("day"));
      }

      return ok;
    });
  }, [filters, dataSource]);

  const filterContent = (
    <div style={{ width: 280 }}>
      <Radio.Group
        size="small"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}
        style={{ marginBottom: 12 }}
      >
        <Radio.Button value="date">Date</Radio.Button>
        <Radio.Button value="mode">Mode</Radio.Button>
        <Radio.Button value="status">Status</Radio.Button>
      </Radio.Group>

      {activeFilter === "date" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Date Range
          </div>
          <DatePicker.RangePicker
            size="small"
            className="w-full"
            popupClassName="single-calendar-range"
            onChange={(dates) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: dates,
              }))
            }
          />
        </>
      )}

      {activeFilter === "mode" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Order Mode
          </div>
          <Radio.Group
            size="small"
            value={filters.mode}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                mode: e.target.value,
              }))
            }
          >
            <Radio value="ONLINE">Online</Radio>
            <Radio value="OFFLINE">Offline (POS)</Radio>
          </Radio.Group>
        </>
      )}

      {activeFilter === "status" && (
        <>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            Order Status
          </div>
          <Radio.Group
            size="small"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
          >
            <Radio value="Ordered">Ordered</Radio>
            <Radio value="Processed">Processed</Radio>
            <Radio value="Shipped">Shipped</Radio>
            <Radio value="Out for Delivery">Out for Delivery</Radio>
            <Radio value="Delivered">Delivered</Radio>
            <Radio value="Cancelled">Cancelled</Radio>
          </Radio.Group>
        </>
      )}

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        <Button
          size="small"
          onClick={() => {
            setFilters({ dateRange: null, mode: null, status: null });
            setActiveFilter(null);
          }}
        >
          Clear
        </Button>
        <Button size="small" type="primary">
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h3 className="title" style={{ margin: 0 }}>Orders</h3>
          <span style={{ fontSize: 12, color: "#8c8c8c" }}>
            Total: {filteredData.length} orders
          </span>
        </div>

        <Popover
          content={filterContent}
          trigger="click"
          placement="bottomRight"
        >
          <Button size="small" icon={<FilterOutlined />}>
            Filters
          </Button>
        </Popover>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredData} 
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
        size="small"
      />
    </div>
  );
};

export default Orders;

