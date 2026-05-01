import React, { useEffect } from "react";
import { Table, Tag, Button, Spin, Tooltip, Tabs } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendarAlt,
  FaIdCard, FaShoppingBag, FaCoins, FaGift, FaChartLine,
  FaArrowUp, FaArrowDown, FaTag, FaUsers,
} from "react-icons/fa";
import { getCustomerDetails } from "../features/customers/customerSlice";

const statusConfig = {
  Ordered: { color: "default", bg: "#f5f5f5", text: "#595959" },
  Processed: { color: "blue", bg: "#e6f4ff", text: "#1677ff" },
  Shipped: { color: "purple", bg: "#f9f0ff", text: "#722ed1" },
  "Out for Delivery": { color: "cyan", bg: "#e6fffb", text: "#08979c" },
  Delivered: { color: "green", bg: "#f6ffed", text: "#389e0d" },
  Cancelled: { color: "red", bg: "#fff2f0", text: "#cf1322" },
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm text-gray-700 font-medium break-words">{value || <span className="text-gray-300">N/A</span>}</p>
    </div>
  </div>
);

const StatCard = ({ label, value, color, icon }) => {
  const colorMap = {
    blue: { bg: "from-blue-500 to-blue-600", light: "bg-blue-50", text: "text-blue-600" },
    green: { bg: "from-emerald-500 to-emerald-600", light: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "from-amber-500 to-amber-600", light: "bg-amber-50", text: "text-amber-600" },
    purple: { bg: "from-purple-500 to-purple-600", light: "bg-purple-50", text: "text-purple-600" },
    red: { bg: "from-red-500 to-red-600", light: "bg-red-50", text: "text-red-600" },
    teal: { bg: "from-teal-500 to-teal-600", light: "bg-teal-50", text: "text-teal-600" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-white shadow-md flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
      </div>
    </div>
  );
};

const CustomerDetail = () => {
  const location = useLocation();
  const customerId = location.pathname.split("/")[3];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { customerDetails, loading } = useSelector((state) => state.customer);

  useEffect(() => {
    if (customerId) dispatch(getCustomerDetails(customerId));
  }, [dispatch, customerId]);

  if (loading || !customerDetails) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-400 mt-3 text-sm">Loading customer details...</p>
        </div>
      </div>
    );
  }

  const { customer, statistics, orders, coinTransactions = [], referralInfo = {} } = customerDetails;

  const totalCoinCredits = coinTransactions.filter((t) => t.type === "credit").reduce((s, t) => s + (t.coins || 0), 0);
  const totalCoinDebits = coinTransactions.filter((t) => t.type === "debit").reduce((s, t) => s + (t.coins || 0), 0);

  const getOfferText = () => {
    if (!customer.offerType) return "No Offer";
    if (customer.offerType === "percentage") return `${customer.offerDiscount}% OFF`;
    return `₹${customer.offerDiscount} FLAT OFF`;
  };

  const getInitials = (f, l) => `${f?.[0] || ""}${l?.[0] || ""}`.toUpperCase();

  const orderColumns = [
    { title: "#", dataIndex: "key", key: "key", width: 50, render: (v) => <span className="text-gray-400 text-xs">{v}</span> },
    {
      title: "Order ID",
      dataIndex: "_id",
      key: "_id",
      render: (id) => (
        <Link to={`/admin/order/${id}`}>
          <span className="font-mono text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors">
            #{id?.slice(-8).toUpperCase()}
          </span>
        </Link>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["md"],
      render: (date) => <span className="text-gray-500 text-xs">{new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Items",
      dataIndex: "orderItems",
      key: "items",
      align: "center",
      render: (items) => <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{items?.length || 0}</span>,
    },
    {
      title: "Total",
      dataIndex: "totalPriceAfterDiscount",
      key: "total",
      align: "right",
      render: (price) => <span className="font-bold text-blue-600 text-sm">₹{price?.toFixed(2) || "0.00"}</span>,
    },
    {
      title: "Mode",
      dataIndex: "mode",
      key: "mode",
      responsive: ["sm"],
      render: (mode) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mode === "OFFLINE" ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
          {mode || "ONLINE"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      render: (status) => {
        const cfg = statusConfig[status] || {};
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.text }}>
            {status}
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, record) => (
        <Tooltip title="View Order">
          <Link to={`/admin/order/${record._id}`}>
            <button className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all border-0 cursor-pointer">
              <EyeOutlined style={{ fontSize: 12 }} />
            </button>
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
      render: (date) => <span className="text-gray-500 text-xs">{new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
            {type === "credit" ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
          </div>
          <span className={`text-xs font-semibold ${type === "credit" ? "text-green-600" : "text-red-500"}`}>
            {type.toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      title: "Coins",
      dataIndex: "coins",
      key: "coins",
      align: "right",
      render: (coins, record) => (
        <span className={`font-bold text-sm ${record.type === "credit" ? "text-green-600" : "text-red-500"}`}>
          {record.type === "credit" ? "+" : "-"}{coins}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      render: (source) => <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{source || "other"}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      responsive: ["md"],
      render: (desc) => <span className="text-gray-500 text-xs">{desc || "—"}</span>,
    },
  ];

  const orderDataSource = orders?.map((o, i) => ({ key: i + 1, ...o })) || [];
  const coinDataSource = coinTransactions?.map((t, i) => ({ key: i + 1, ...t })) || [];

  const tabItems = [
    {
      key: "orders",
      label: (
        <span className="flex items-center gap-2 text-sm">
          <FaShoppingBag size={13} />
          Orders
          <span className="bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{orders?.length || 0}</span>
        </span>
      ),
      children: (
        <Table
          columns={orderColumns}
          dataSource={orderDataSource}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 600 }}
          size="small"
          className="detail-table"
        />
      ),
    },
    {
      key: "coins",
      label: (
        <span className="flex items-center gap-2 text-sm">
          <FaCoins size={13} />
          Coins
          <span className="bg-amber-100 text-amber-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{coinTransactions?.length || 0}</span>
        </span>
      ),
      children: (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: "Balance", value: `${customer.coins || 0}`, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Earned", value: `+${totalCoinCredits}`, color: "text-green-600", bg: "bg-green-50" },
              { label: "Used", value: `-${totalCoinDebits}`, color: "text-red-500", bg: "bg-red-50" },
            ].map((item) => (
              <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <Table
            columns={coinColumns}
            dataSource={coinDataSource}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            size="small"
            className="detail-table"
            scroll={{ x: 400 }}
          />
        </>
      ),
    },
    {
      key: "referral",
      label: (
        <span className="flex items-center gap-2 text-sm">
          <FaGift size={13} />
          Referral
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
          {[
            { label: "Referral Code", value: customer.referralCode, icon: <FaIdCard size={14} /> },
            {
              label: "Referred By",
              value: referralInfo?.referredBy
                ? `${referralInfo.referredBy.firstname} ${referralInfo.referredBy.lastname} (${referralInfo.referredBy.mobile || ""})`
                : customer.referredBy ? "Linked" : "Direct / No Referral",
              icon: <FaUsers size={14} />,
            },
            { label: "Referral Count", value: `${customer.referralCount || 0} people`, icon: <FaChartLine size={14} /> },
            { label: "Referral Earnings", value: `${customer.referralEarnings || 0} coins`, icon: <FaCoins size={14} /> },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-500 flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-gray-700">{item.value || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/80 p-2 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin/customers")}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeftOutlined style={{ fontSize: 14 }} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800 mb-0">Customer Details</h1>
          <p className="text-gray-400 text-xs">View full profile, orders & activity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Left: Profile Card */}
        <div className="xl:col-span-1 space-y-4">
          {/* Profile */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            <div className="px-5 pb-5 -mt-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg border-4 border-white mb-3">
                {getInitials(customer.firstname, customer.lastname) || <FaUser />}
              </div>
              <h2 className="text-lg font-bold text-gray-800 leading-tight">
                {customer.firstname} {customer.lastname}
              </h2>
              <p className="text-gray-400 text-xs mb-3">{customer.email}</p>
              <div className="flex flex-wrap gap-2">
                {customer.offerType && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 font-semibold px-2.5 py-1 rounded-full">
                    <FaTag size={9} /> {getOfferText()}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 font-semibold px-2.5 py-1 rounded-full">
                  <FaCoins size={9} /> {customer.coins || 0} coins
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact Info</h3>
            <InfoRow icon={<FaPhone size={12} />} label="Mobile" value={customer.mobile} />
            <InfoRow icon={<FaEnvelope size={12} />} label="Email" value={customer.email} />
            <InfoRow icon={<FaMapMarkerAlt size={12} />} label="Address" value={customer.address} />
            <InfoRow icon={<FaIdCard size={12} />} label="GSTIN" value={customer.gstin} />
            <InfoRow
              icon={<FaCalendarAlt size={12} />}
              label="Customer Since"
              value={new Date(customer.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            />
          </div>
        </div>

        {/* Right: Stats + Tabs */}
        <div className="xl:col-span-3 space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
            <StatCard label="Total Orders" value={statistics.totalOrders} color="blue" icon={<FaShoppingBag size={16} />} />
            <StatCard label="Total Purchase" value={`₹${statistics.totalPurchaseAmount?.toFixed(0)}`} color="green" icon={<FaChartLine size={16} />} />
            <StatCard label="Total Savings" value={`₹${statistics.totalSavings?.toFixed(0)}`} color="amber" icon={<FaTag size={16} />} />
            <StatCard label="Coin Balance" value={customer.coins || 0} color="purple" icon={<FaCoins size={16} />} />
            <StatCard label="Referral Count" value={customer.referralCount || 0} color="teal" icon={<FaUsers size={16} />} />
            <StatCard label="Current Offer" value={getOfferText()} color="red" icon={<FaGift size={16} />} />
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <Tabs
              defaultActiveKey="orders"
              items={tabItems}
              className="customer-detail-tabs"
              tabBarStyle={{ padding: "0 20px", marginBottom: 0, borderBottom: "1px solid #f1f5f9" }}
            />
          </div>
        </div>
      </div>

      <style>{`
        .detail-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #94a3b8 !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 10px 12px !important;
        }
        .detail-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f8fafc !important;
          padding: 10px 12px !important;
        }
        .detail-table .ant-table-tbody > tr:hover > td {
          background: #f8faff !important;
        }
        .detail-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .customer-detail-tabs .ant-tabs-tab {
          padding: 14px 4px !important;
          margin: 0 16px 0 0 !important;
        }
        .customer-detail-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #3b82f6 !important;
        }
        .customer-detail-tabs .ant-tabs-ink-bar {
          background: #3b82f6 !important;
        }
        .customer-detail-tabs .ant-tabs-content-holder {
          padding: 16px 20px 20px !important;
        }
        .customer-detail-tabs .ant-tabs-nav::before {
          border-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default CustomerDetail;
