import React, { useEffect, useState } from "react";
import { Table, Card, Row, Col, Tag, Button, Spin, Input, Avatar, Tooltip, Collapse } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getAllReferrals } from "../features/customers/customerSlice";
import { FaSearch, FaUsers, FaCoins, FaMoneyBillWave, FaCode, FaUserPlus, FaChevronDown, FaChevronUp, FaLink } from "react-icons/fa";
import { MdOutlineReferrals } from "react-icons/md";

const { Panel } = Collapse;

const ReferralDetails = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  
  const { referrals, referralStats, loading } = useSelector((state) => state.customer);

  useEffect(() => {
    dispatch(getAllReferrals());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(getAllReferrals());
  };

  // Filter referrals based on search
  const filteredReferrals = referrals?.filter((ref) =>
    ref.firstname?.toLowerCase().includes(searchText.toLowerCase()) ||
    ref.lastname?.toLowerCase().includes(searchText.toLowerCase()) ||
    ref.mobile?.includes(searchText) ||
    ref.referralCode?.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  // Toggle expanded row
  const toggleExpand = (recordId) => {
    setExpandedRows(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const columns = [
    {
      title: "S.No",
      dataIndex: "key",
      key: "key",
      width: 60,
      render: (text, record, index) => (
        <span className="text-gray-500 font-medium">{index + 1}</span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => (a.firstname || "").localeCompare(b.firstname || ""),
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            shape="square"
            size={40}
            className="rounded-lg bg-blue-50 text-blue-600"
            icon={<FaUsers />}
          />
          <div>
            <div className="font-semibold text-gray-900">
              {record.firstname} {record.lastname}
            </div>
            <div className="text-gray-500 text-xs">{record.mobile}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Referral Code",
      dataIndex: "referralCode",
      key: "referralCode",
      render: (code) => (
        <div className="flex items-center gap-2">
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600">
            {code}
          </code>
          <Tooltip title="Copy Code">
            <Button 
              type="text" 
              size="small" 
              icon={<FaLink />} 
              onClick={() => copyToClipboard(code)}
              className="text-gray-400 hover:text-blue-600"
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "Referred By",
      dataIndex: "referredBy",
      key: "referredBy",
      render: (referrer) => (
        referrer ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {referrer.firstname} {referrer.lastname}
            </div>
            <div className="text-gray-500 text-xs">
              Code: <span className="font-mono text-blue-600">{referrer.referralCode}</span>
            </div>
          </div>
        ) : (
          <Tag color="default">Direct</Tag>
        )
      ),
    },
    {
      title: "Referrals Made",
      dataIndex: "referredUsersCount",
      key: "referredUsersCount",
      sorter: (a, b) => (a.referredUsersCount || 0) - (b.referredUsersCount || 0),
      align: "center",
      render: (count, record) => (
        <div className="flex items-center justify-center">
          {count > 0 ? (
            <div className="text-center">
              <Tag color="green" className="mb-1">{count} {count === 1 ? 'User' : 'Users'}</Tag>
              <Button 
                type="link" 
                size="small" 
                onClick={() => toggleExpand(record._id)}
                className="p-0 text-blue-600"
              >
                {expandedRows[record._id] ? <FaChevronUp /> : <FaChevronDown />} 
                {expandedRows[record._id] ? ' Hide' : ' View'}
              </Button>
            </div>
          ) : (
            <Tag color="default">0</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Coins Earned",
      dataIndex: "coins",
      key: "coins",
      sorter: (a, b) => (a.coins || 0) - (b.coins || 0),
      align: "center",
      render: (coins) => (
        <div className="flex items-center justify-center gap-1">
          <FaCoins className="text-yellow-500" />
          <span className="font-semibold text-yellow-600">{coins || 0}</span>
        </div>
      ),
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      render: (date) => (
        <span className="text-gray-500">
          {date ? new Date(date).toLocaleDateString('en-IN') : '-'}
        </span>
      ),
    },
  ];

  const data1 = filteredReferrals?.map((item, index) => ({
    key: index + 1,
    _id: item._id,
    firstname: item.firstname,
    lastname: item.lastname,
    mobile: item.mobile,
    email: item.email,
    referralCode: item.referralCode,
    referredBy: item.referredBy,
    referredUsersCount: item.referredUsersCount,
    coins: item.coins,
    referralEarnings: item.referralEarnings,
    createdAt: item.createdAt,
    referredUsers: item.referredUsers || [],
  })) || [];

  // Sub-table for referred users
  const referredUsersColumns = [
    {
      title: "S.No",
      key: "key",
      width: 50,
      render: (text, record, index) => index + 1,
    },
    {
      title: "Name",
      key: "name",
      render: (_, record) => (
        <span>{record.firstname} {record.lastname}</span>
      ),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
    },
    {
      title: "Joined Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString('en-IN'),
    },
  ];

  if (loading || !referrals) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                <MdOutlineReferrals size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-1">
                  Referral Details
                </h2>
                <p className="text-gray-500 text-sm mb-0">
                  View all customer referrals and earnings
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, mobile, code..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full sm:w-64 h-10 pl-10 pr-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all"
                />
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <Button 
                type="primary" 
                onClick={handleRefresh}
                className="h-10 px-4 bg-blue-600 hover:bg-blue-700"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Customers</p>
              <h3 className="text-2xl font-semibold text-gray-800">{referralStats?.totalUsers || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FaUsers size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">With Referral Code</p>
              <h3 className="text-2xl font-semibold text-gray-800">{referralStats?.usersWithReferralCode || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FaCode size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Users Referred</p>
              <h3 className="text-2xl font-semibold text-gray-800">{referralStats?.usersReferred || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <FaUserPlus size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Coins</p>
              <h3 className="text-2xl font-semibold text-yellow-600">{referralStats?.totalCoins || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600">
              <FaCoins size={20} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">Total Earnings</p>
              <h3 className="text-2xl font-semibold text-green-600">₹{referralStats?.totalEarnings || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <FaMoneyBillWave size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={data1}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-3">
                  Users Referred by {record.firstname} {record.lastname}
                </h4>
                {record.referredUsers && record.referredUsers.length > 0 ? (
                  <Table
                    columns={referredUsersColumns}
                    dataSource={record.referredUsers}
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <p className="text-gray-500">No referred users yet</p>
                )}
              </div>
            ),
            expandedRowKeys: Object.keys(expandedRows).filter(key => expandedRows[key]),
            onExpand: (expanded, record) => {
              toggleExpand(record._id);
            },
          }}
          className="referral-table"
        />
      </div>

      <style>{`
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
          color: #1a1a1a !important;
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #f5f5f5 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0 !important;
          padding: 16px !important;
        }
        .ant-pagination {
          padding: 16px 24px !important;
          margin: 0 !important;
          background: #fafafa;
          border-top: 1px solid #f0f0f0;
        }
        .ant-pagination-item-active {
          border-color: #1890ff !important;
        }
        .ant-pagination-item-active a {
          color: #1890ff !important;
        }
        .ant-table-expand-icon-col {
          width: 50px !important;
        }
      `}</style>
    </div>
  );
};

export default ReferralDetails;

