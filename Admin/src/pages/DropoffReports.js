import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Select, Typography, Statistic, Tooltip, Button, message } from 'antd';
import { ShoppingCartOutlined, CreditCardOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from '../utils/axiosconfig';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const DropoffReports = () => {
  const [cartDropoffs, setCartDropoffs] = useState([]);
  const [checkoutDropoffs, setCheckoutDropoffs] = useState([]);
  const [period, setPeriod] = useState('24h');
  const [cartLoading, setCartLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [period]);

  const loadAll = () => {
    loadCartDropoffs();
    loadCheckoutDropoffs();
  };

  const loadCartDropoffs = async () => {
    setCartLoading(true);
    try {
      const res = await axios.get('/tracking/cart-dropoffs', { params: { period } });
      setCartDropoffs(res.data.dropoffs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCartLoading(false);
    }
  };

  const loadCheckoutDropoffs = async () => {
    setCheckoutLoading(true);
    try {
      const res = await axios.get('/tracking/checkout-dropoffs', { params: { period } });
      setCheckoutDropoffs(res.data.dropoffs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const totalCartValue = cartDropoffs.reduce((s, r) => s + (r.totalValue || 0), 0);
  const totalCheckoutValue = checkoutDropoffs.reduce((s, r) => s + (r.totalValue || 0), 0);

  const userCell = (r) => (
    <div>
      <div style={{ fontWeight: 600, color: '#111827' }}>
        {r.userId ? `${r.userId.firstname} ${r.userId.lastname}` : '—'}
      </div>
      {r.userId?.email && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>{r.userId.email}</div>
      )}
      {r.userId?.mobile && (
        <div style={{ fontSize: 12, color: '#6b7280' }}>📞 {r.userId.mobile}</div>
      )}
    </div>
  );

  const itemsCell = (items = []) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.length === 0 && <Text type="secondary">—</Text>}
      {items.map((item, i) => (
        <Tooltip key={i} title={`₹${item.price} × ${item.quantity}`}>
          <Tag color="blue" style={{ marginBottom: 2 }}>
            {item.productName || 'Unknown'} ×{item.quantity}
          </Tag>
        </Tooltip>
      ))}
    </div>
  );

  const cartColumns = [
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_, r) => userCell(r),
    },
    {
      title: 'Items in Cart',
      key: 'items',
      render: (_, r) => itemsCell(r.items),
    },
    {
      title: 'Cart Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 110,
      sorter: (a, b) => a.totalValue - b.totalValue,
      render: (v) => (
        <Tag color="orange" style={{ fontWeight: 700 }}>₹{Number(v || 0).toFixed(2)}</Tag>
      ),
    },
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      width: 90,
      render: (d) => <Tag>{d || '—'}</Tag>,
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastAddedAt',
      key: 'lastAddedAt',
      width: 130,
      sorter: (a, b) => moment(a.lastAddedAt).unix() - moment(b.lastAddedAt).unix(),
      render: (t) => (
        <Tooltip title={moment(t).format('DD MMM YYYY, HH:mm')}>
          {moment(t).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, r) => r.userId?.email ? (
        <Button
          size="small"
          type="primary"
          onClick={() => {
            navigator.clipboard.writeText(r.userId.email);
            message.success('Email copied!');
          }}
        >
          Copy Email
        </Button>
      ) : null,
    },
  ];

  const checkoutColumns = [
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_, r) => userCell(r),
    },
    {
      title: 'Cart Items',
      key: 'items',
      render: (_, r) => itemsCell(r.items),
    },
    {
      title: 'Cart Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 110,
      sorter: (a, b) => a.totalValue - b.totalValue,
      render: (v) => (
        <Tag color="red" style={{ fontWeight: 700 }}>₹{Number(v || 0).toFixed(2)}</Tag>
      ),
    },
    {
      title: 'Dropped Page',
      dataIndex: 'page',
      key: 'page',
      width: 140,
      ellipsis: true,
      render: (p) => <Text type="secondary" style={{ fontSize: 12 }}>{p}</Text>,
    },
    {
      title: 'Device',
      dataIndex: 'device',
      key: 'device',
      width: 90,
      render: (d) => <Tag>{d || '—'}</Tag>,
    },
    {
      title: 'Dropped At',
      dataIndex: 'droppedAt',
      key: 'droppedAt',
      width: 130,
      sorter: (a, b) => moment(a.droppedAt).unix() - moment(b.droppedAt).unix(),
      render: (t) => (
        <Tooltip title={moment(t).format('DD MMM YYYY, HH:mm')}>
          {moment(t).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, r) => r.userId?.email ? (
        <Button
          size="small"
          type="primary"
          danger
          onClick={() => {
            navigator.clipboard.writeText(r.userId.email);
            message.success('Email copied!');
          }}
        >
          Copy Email
        </Button>
      ) : null,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-2 sm:p-4 lg:p-6"
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Drop-off Reports</Title>
          <Text type="secondary">Users who left without completing their purchase</Text>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Select value={period} onChange={setPeriod} style={{ width: 140 }}>
            <Option value="1h">Last 1 Hour</Option>
            <Option value="24h">Last 24 Hours</Option>
            <Option value="7d">Last 7 Days</Option>
            <Option value="30d">Last 30 Days</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadAll}>Refresh</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Cart Drop-offs"
              value={cartDropoffs.length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Lost Cart Value"
              value={totalCartValue.toFixed(2)}
              prefix="₹"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Checkout Drop-offs"
              value={checkoutDropoffs.length}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Lost Checkout Value"
              value={totalCheckoutValue.toFixed(2)}
              prefix="₹"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Cart Drop-offs Table */}
      <Card
        style={{ marginBottom: 24 }}
        title={
          <span>
            <ShoppingCartOutlined style={{ color: '#fa8c16', marginRight: 8 }} />
            Cart Drop-offs
            <Tag color="orange" style={{ marginLeft: 8 }}>{cartDropoffs.length} users</Tag>
          </span>
        }
        extra={<Text type="secondary">Added to cart → never went to checkout</Text>}
      >
        <Table
          rowKey="sessionId"
          loading={cartLoading}
          dataSource={cartDropoffs}
          columns={cartColumns}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} users` }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'No cart drop-offs in this period' }}
        />
      </Card>

      {/* Checkout Drop-offs Table */}
      <Card
        title={
          <span>
            <CreditCardOutlined style={{ color: '#f5222d', marginRight: 8 }} />
            Checkout Drop-offs
            <Tag color="red" style={{ marginLeft: 8 }}>{checkoutDropoffs.length} users</Tag>
          </span>
        }
        extra={<Text type="secondary">Started checkout → never paid</Text>}
      >
        <Table
          rowKey="sessionId"
          loading={checkoutLoading}
          dataSource={checkoutDropoffs}
          columns={checkoutColumns}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} users` }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'No checkout drop-offs in this period' }}
        />
      </Card>
    </motion.div>
  );
};

export default DropoffReports;
