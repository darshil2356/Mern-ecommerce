import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, DatePicker, Table, Tag, Space, Avatar, Typography } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import axios from '../utils/axiosconfig';
import moment from 'moment';
import { BiUser } from 'react-icons/bi';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const TrackingAnalytics = () => {
  const [analytics, setAnalytics] = useState({});
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    loadAnalytics();
    loadEvents();
    loadSessions();
  }, [timeRange, dateRange]);

  const loadAnalytics = async () => {
    try {
      const res = await axios.get('/tracking/analytics', {
        params: { period: timeRange }
      });
      setAnalytics(res.data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await axios.get('/tracking/activity', {
        params: { limit: 100 }
      });
      setEvents(res.data.events);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await axios.get('/tracking/sessions/active');
      setSessions(res.data.sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  // Process data for charts
  const getEventTypeData = () => {
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1;
    });

    return Object.entries(eventCounts).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count
    }));
  };

  const getPageViewData = () => {
    const pageViews = {};
    events.filter(e => e.eventType === 'page_view').forEach(event => {
      const date = moment(event.timestamp).format('HH:mm');
      pageViews[date] = (pageViews[date] || 0) + 1;
    });

    return Object.entries(pageViews).map(([time, views]) => ({
      time,
      views
    })).slice(-24); // Last 24 data points
  };

  const getDeviceData = () => {
    const devices = {};
    sessions.forEach(session => {
      devices[session.device] = (devices[session.device] || 0) + 1;
    });

    return Object.entries(devices).map(([device, count]) => ({
      device: device.charAt(0).toUpperCase() + device.slice(1),
      count
    }));
  };

  const getTopPages = () => {
    if (!analytics.topPages) return [];
    return analytics.topPages.map(page => ({
      page: page._id,
      views: page.count
    }));
  };

  const eventColumns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).format('MMM DD, HH:mm:ss'),
      sorter: (a, b) => moment(a.timestamp).unix() - moment(b.timestamp).unix(),
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (type) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'Page View', value: 'page_view' },
        { text: 'Product View', value: 'product_view' },
        { text: 'Add to Cart', value: 'add_to_cart' },
        { text: 'Checkout', value: 'checkout_started' },
        { text: 'Payment', value: 'payment_success' },
      ],
      onFilter: (value, record) => record.eventType === value,
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        record.userId ? (
          `${record.userId.firstname} ${record.userId.lastname}`
        ) : (
          `Guest ${record.guestId?.slice(-6)}`
        )
      ),
    },
    {
      title: 'Page',
      dataIndex: 'page',
      key: 'page',
      ellipsis: true,
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => {
        if (record.metadata?.productName) {
          return `Product: ${record.metadata.productName}`;
        }
        if (record.metadata?.query) {
          return `Search: "${record.metadata.query}"`;
        }
        return '-';
      },
    },
  ];

  const sessionColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar icon={<BiUser />} size="small" />
          {record.userId ? (
            `${record.userId.firstname} ${record.userId.lastname}`
          ) : (
            `Guest ${record.guestId?.slice(-6)}`
          )}
        </Space>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      render: (device) => (
        <Tag color="green">{device.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Current Page',
      dataIndex: 'currentPage',
      key: 'currentPage',
      ellipsis: true,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        record.location?.city ?
          `${record.location.city}, ${record.location.country}` :
          'Unknown'
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivity',
      key: 'lastActivity',
      render: (time) => moment(time).fromNow(),
      sorter: (a, b) => moment(a.lastActivity).unix() - moment(b.lastActivity).unix(),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        const duration = moment.duration(moment().diff(moment(record.startTime)));
        return `${Math.floor(duration.asMinutes())}m ${duration.seconds()}s`;
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-2 sm:p-4 lg:p-6"
    >
      <Title level={2}>User Tracking Analytics</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Text strong>Time Range:</Text>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="1h">Last Hour</Option>
            <Option value="24h">Last 24 Hours</Option>
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
          </Select>
          <Text strong>Date Range:</Text>
          <RangePicker onChange={(dates) => setDateRange(dates)} />
        </Space>
      </Card>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Page Views Over Time">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getPageViewData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Event Types Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getEventTypeData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getEventTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Device and Top Pages */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Device Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getDeviceData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="device" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top Pages">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTopPages()} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="page" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="views" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Data Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Events">
            <Table
              columns={eventColumns}
              dataSource={events.slice(0, 20)}
              rowKey="_id"
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Active Sessions">
            <Table
              columns={sessionColumns}
              dataSource={sessions}
              rowKey="_id"
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default TrackingAnalytics;