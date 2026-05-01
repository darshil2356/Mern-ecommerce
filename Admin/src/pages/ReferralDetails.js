import React, { useEffect, useState } from "react";
import { Table, Card, Tag, Button, Spin, Avatar, Tooltip, Select, DatePicker, message, Progress } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getAllReferrals } from "../features/customers/customerSlice";
import {
  FaSearch, FaUsers, FaCoins, FaCode, FaUserPlus,
  FaChevronDown, FaChevronUp, FaLink, FaDownload, FaChartLine,
  FaTrophy, FaPercentage, FaRupeeSign, FaSync, FaGift,
} from "react-icons/fa";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
} from "recharts";

const { RangePicker } = DatePicker;
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const StatCard = ({ title, value, icon, color, sub }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-5 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace("border-", "bg-").replace("-500", "-50").replace("-600", "-50")}`}>
        {icon}
      </div>
    </div>
  </div>
);

const ReferralDetails = () => {
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState({});
  const [dateRange, setDateRange] = useState(null);
  const [topLimit, setTopLimit] = useState(6);

  const { referrals, referralStats, loading } = useSelector((state) => state.customer);

  useEffect(() => { dispatch(getAllReferrals()); }, [dispatch]);

  const filterByDate = (data) => {
    if (!dateRange?.[0] || !dateRange?.[1]) return data;
    const start = new Date(dateRange[0]);
    const end = new Date(dateRange[1]);
    end.setHours(23, 59, 59, 999);
    return data.filter((item) => {
      const d = new Date(item.createdAt);
      return d >= start && d <= end;
    });
  };

  const filteredReferrals = filterByDate(
    (referrals || []).filter(
      (ref) =>
        ref.firstname?.toLowerCase().includes(searchText.toLowerCase()) ||
        ref.lastname?.toLowerCase().includes(searchText.toLowerCase()) ||
        ref.mobile?.includes(searchText) ||
        ref.referralCode?.toLowerCase().includes(searchText.toLowerCase())
    )
  );

  // Top referrers: users who referred the most others
  const topReferrers = [...(referrals || [])]
    .filter((r) => (r.referredUsersCount || 0) > 0)
    .sort((a, b) => (b.referredUsersCount || 0) - (a.referredUsersCount || 0))
    .slice(0, topLimit);

  const maxReferrals = topReferrers[0]?.referredUsersCount || 1;

  // Monthly referral trend
  const monthlyData = (() => {
    const map = {};
    (referrals || []).forEach((ref) => {
      if (!ref.createdAt) return;
      const d = new Date(ref.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key]) map[key] = { month: key, newUsers: 0, referred: 0, coins: 0 };
      map[key].newUsers++;
      if (ref.referredBy) map[key].referred++;
      map[key].coins += ref.coins || 0;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-8);
  })();

  // Pie: direct vs referred
  const sourceData = [
    { name: "Direct Signups", value: (referrals || []).filter((r) => !r.referredBy).length },
    { name: "Referred Signups", value: (referrals || []).filter((r) => r.referredBy).length },
  ];

  const conversionRate =
    referralStats?.totalUsers > 0
      ? ((referralStats.usersReferred / referralStats.totalUsers) * 100).toFixed(1)
      : 0;

  const avgCoinsPerUser =
    referralStats?.totalUsers > 0
      ? Math.round(referralStats.totalCoins / referralStats.totalUsers)
      : 0;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied!");
  };

  const exportToCSV = () => {
    if (!filteredReferrals.length) return message.warning("No data to export");
    const rows = filteredReferrals.map((item, i) => ({
      "S.No": i + 1,
      Name: `${item.firstname} ${item.lastname}`,
      Mobile: item.mobile,
      Email: item.email || "",
      "Referral Code": item.referralCode || "",
      "Referred By": item.referredBy
        ? `${item.referredBy.firstname} ${item.referredBy.lastname} (${item.referredBy.referralCode})`
        : "Direct",
      "Referrals Made": item.referredUsersCount || 0,
      "Coins Balance": item.coins || 0,
      "Referral Earnings (coins)": item.referralEarnings || 0,
      "Joined Date": new Date(item.createdAt).toLocaleDateString("en-IN"),
    }));
    const csv = [
      Object.keys(rows[0]).join(","),
      ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `referrals_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    message.success("Exported!");
  };

  const columns = [
    {
      title: "#",
      width: 50,
      render: (_, __, i) => <span className="text-gray-400 font-medium">{i + 1}</span>,
    },
    {
      title: "Customer",
      sorter: (a, b) => (a.firstname || "").localeCompare(b.firstname || ""),
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={40}
            style={{ background: `hsl(${(r.firstname?.charCodeAt(0) || 65) * 5}, 60%, 55%)` }}
            className="font-bold text-white flex-shrink-0"
          >
            {(r.firstname?.[0] || "?").toUpperCase()}
          </Avatar>
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {r.firstname} {r.lastname}
            </div>
            <div className="text-gray-400 text-xs">{r.mobile}</div>
            {r.email && <div className="text-gray-400 text-xs">{r.email}</div>}
          </div>
        </div>
      ),
    },
    {
      title: "Referral Code",
      render: (_, r) =>
        r.referralCode ? (
          <div className="flex items-center gap-2">
            <code className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-mono font-bold tracking-wider">
              {r.referralCode}
            </code>
            <Tooltip title="Copy">
              <button
                onClick={() => copyToClipboard(r.referralCode)}
                className="text-gray-300 hover:text-indigo-500 transition-colors"
              >
                <FaLink size={11} />
              </button>
            </Tooltip>
          </div>
        ) : (
          <Tag color="default">N/A</Tag>
        ),
    },
    {
      title: "Referred By",
      render: (_, r) =>
        r.referredBy ? (
          <div className="text-sm">
            <div className="font-medium text-gray-800">
              {r.referredBy.firstname} {r.referredBy.lastname}
            </div>
            <code className="text-indigo-500 text-xs font-mono">{r.referredBy.referralCode}</code>
          </div>
        ) : (
          <Tag color="blue" className="text-xs">Direct</Tag>
        ),
    },
    {
      title: "Referrals Made",
      sorter: (a, b) => (a.referredUsersCount || 0) - (b.referredUsersCount || 0),
      align: "center",
      render: (_, r) => (
        <div className="text-center">
          {(r.referredUsersCount || 0) > 0 ? (
            <Tag color="green" className="font-semibold">
              {r.referredUsersCount} {r.referredUsersCount === 1 ? "user" : "users"}
            </Tag>
          ) : (
            <span className="text-gray-300 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      title: "Coins Balance",
      sorter: (a, b) => (a.coins || 0) - (b.coins || 0),
      align: "center",
      render: (_, r) => (
        <div className="flex items-center justify-center gap-1">
          <FaCoins className="text-yellow-400" size={13} />
          <span className="font-bold text-yellow-600">{r.coins || 0}</span>
        </div>
      ),
    },
    {
      title: "Referral Earnings",
      sorter: (a, b) => (a.referralEarnings || 0) - (b.referralEarnings || 0),
      align: "center",
      render: (_, r) => (
        <div className="flex items-center justify-center gap-1">
          <FaGift className="text-purple-400" size={12} />
          <span className="font-semibold text-purple-600">{r.referralEarnings || 0}</span>
        </div>
      ),
    },
    {
      title: "Joined",
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
      render: (_, r) => (
        <span className="text-gray-400 text-xs">
          {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}
        </span>
      ),
    },
  ];

  const referredUsersColumns = [
    { title: "#", width: 40, render: (_, __, i) => <span className="text-gray-400">{i + 1}</span> },
    {
      title: "Name",
      render: (_, r) => <span className="font-medium">{r.firstname} {r.lastname}</span>,
    },
    { title: "Mobile", dataIndex: "mobile" },
    {
      title: "Joined",
      dataIndex: "createdAt",
      render: (d) => new Date(d).toLocaleDateString("en-IN"),
    },
  ];

  if (loading && !referrals) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-2 sm:p-4 lg:p-8">
      {/* ── Header ── */}
      <div className="bg-white rounded-[32px] shadow-md mb-6 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-[24px] bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg">
              <FaLink size={22} />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Referral Dashboard</h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">A polished admin view for referral growth, codes and user incentives.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[1.15fr_1fr] items-end">
            <RangePicker
              onChange={setDateRange}
              className="w-full h-11 rounded-2xl border-slate-200"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:flex-wrap">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search name, mobile, code…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-11 w-full pl-11 pr-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              </div>
              <Button
                onClick={() => dispatch(getAllReferrals())}
                icon={<FaSync size={13} />}
                className="h-11 px-4 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </Button>
              <Button
                type="primary"
                onClick={exportToCSV}
                icon={<FaDownload size={13} />}
                className="h-11 px-4 rounded-2xl bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700"
              >
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Customers"
          value={referralStats?.totalUsers || 0}
          icon={<FaUsers size={20} className="text-indigo-600" />}
          color="border-indigo-500"
        />
        <StatCard
          title="With Referral Code"
          value={referralStats?.usersWithReferralCode || 0}
          icon={<FaCode size={18} className="text-violet-600" />}
          color="border-violet-500"
          sub={`${referralStats?.totalUsers ? Math.round((referralStats.usersWithReferralCode / referralStats.totalUsers) * 100) : 0}% of total`}
        />
        <StatCard
          title="Users Referred"
          value={referralStats?.usersReferred || 0}
          icon={<FaUserPlus size={18} className="text-emerald-600" />}
          color="border-emerald-500"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={<FaPercentage size={18} className="text-sky-600" />}
          color="border-sky-500"
          sub="Referred / total users"
        />
        <StatCard
          title="Total Coins"
          value={(referralStats?.totalCoins || 0).toLocaleString()}
          icon={<FaCoins size={18} className="text-amber-500" />}
          color="border-amber-500"
          sub={`Avg ${avgCoinsPerUser} per user`}
        />
        <StatCard
          title="Referral Earnings"
          value={(referralStats?.totalEarnings || 0).toLocaleString()}
          icon={<FaGift size={18} className="text-rose-500" />}
          color="border-rose-500"
          sub="Total coins from referrals"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1.3fr] gap-6 mb-6">
        <Card
          className="shadow-sm rounded-[28px]"
          title={
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <FaChartLine className="text-indigo-500" />
              Monthly Referral Trend
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <RechartsTooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#475569' }} />
              <Bar dataKey="newUsers" name="New Users" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="referred" name="Referred" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card
          className="shadow-sm rounded-[28px]"
          title={
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <FaPercentage className="text-green-500" />
              Signup Source
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sourceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {sourceData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 gap-2 mt-4 text-sm text-slate-500 sm:grid-cols-2">
            {sourceData.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="font-medium text-slate-700">{s.name}</span>
                <span>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Top Referrers ── */}
      <Card
        className="shadow-sm rounded-[28px] mb-6"
        title={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-slate-700 font-semibold">
            <div className="flex items-center gap-2">
              <FaTrophy className="text-amber-500" />
              Top Referrers
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span>Show top</span>
              <Select
                value={topLimit}
                onChange={setTopLimit}
                size="small"
                style={{ width: 76 }}
                options={[3, 6, 10, 20].map((v) => ({ value: v, label: v }))}
              />
            </div>
          </div>
        }
      >
        {topReferrers.length === 0 ? (
          <div className="text-center text-slate-400 py-8">No referrers yet</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {topReferrers.map((r, i) => (
              <div
                key={r._id}
                className={`p-4 rounded-[28px] border transition-all hover:shadow-xl ${
                  i === 0
                    ? 'border-amber-300 bg-amber-50'
                    : i === 1
                    ? 'border-slate-300 bg-slate-50'
                    : i === 2
                    ? 'border-orange-300 bg-orange-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-11 h-11 rounded-3xl flex items-center justify-center font-bold text-white text-base ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-500' : i === 2 ? 'bg-orange-500' : 'bg-indigo-500'
                    }`}
                  >
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{r.firstname} {r.lastname}</div>
                    <div className="text-xs text-slate-500 truncate">{r.mobile}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Referrals</span>
                    <span className="font-semibold text-emerald-700">{r.referredUsersCount}</span>
                  </div>
                  <Progress
                    percent={Math.round((r.referredUsersCount / maxReferrals) * 100)}
                    showInfo={false}
                    strokeColor={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : '#6366f1'}
                    size="small"
                  />
                  <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:justify-between sm:items-center">
                    <span className="flex items-center gap-1"><FaCoins className="text-amber-400" size={11} /> {r.coins || 0} coins</span>
                    <code className="text-indigo-600 font-mono text-xs break-all">{r.referralCode}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Referrals Table ── */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">Referral Customers</h3>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredReferrals.length} of {referrals?.length || 0} customers
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={filteredReferrals.map((item) => ({ ...item, key: item._id }))}
            rowKey="_id"
            loading={loading}
            scroll={{ x: 1120 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
              pageSizeOptions: ["10", "20", "50"],
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div className="p-4 bg-slate-50 rounded-[28px] mx-4 my-3">
                  <h4 className="font-semibold text-slate-700 mb-3 text-sm">
                    Users referred by {record.firstname} {record.lastname}
                  </h4>
                  {record.referredUsers?.length > 0 ? (
                    <Table
                      columns={referredUsersColumns}
                      dataSource={record.referredUsers.map((u, i) => ({ ...u, key: u._id || i }))}
                      pagination={false}
                      size="small"
                      className="rounded-2xl overflow-hidden"
                    />
                  ) : (
                    <p className="text-slate-400 text-sm">No referred users yet</p>
                  )}
                </div>
              ),
              expandedRowKeys: Object.keys(expandedRows).filter((k) => expandedRows[k]),
              onExpand: (_, record) =>
                setExpandedRows((prev) => ({ ...prev, [record._id]: !prev[record._id] })),
              rowExpandable: (record) => (record.referredUsersCount || 0) > 0,
            }}
          />
        </div>
      </div>

      <style>{`
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          color: #475569 !important;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          border-bottom: 2px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 14px 16px !important;
        }
        .ant-pagination {
          padding: 16px 24px !important;
          margin: 0 !important;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .ant-pagination-item-active {
          border-color: #6366f1 !important;
        }
        .ant-pagination-item-active a {
          color: #6366f1 !important;
        }
      `}</style>
    </div>
  );
};

export default ReferralDetails;
