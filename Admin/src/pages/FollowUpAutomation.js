import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Table, Tag, Space, message, Switch, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, MailOutlined, MessageOutlined, PhoneOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const FollowUpAutomation = () => {
  const [automations, setAutomations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAutomations();
    loadNotifications();
  }, []);

  const loadAutomations = async () => {
    try {
      // This would load automation rules from backend
      // For now, using mock data
      setAutomations([
        {
          _id: '1',
          trigger: 'abandoned_cart',
          delay: 30, // minutes
          type: 'email',
          title: 'Complete Your Purchase',
          message: 'You left some items in your cart. Complete your purchase now!',
          active: true,
          createdAt: new Date(),
        },
        {
          _id: '2',
          trigger: 'payment_failed',
          delay: 5, // minutes
          type: 'push',
          title: 'Payment Issue',
          message: 'We encountered an issue with your payment. Please try again.',
          active: true,
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error loading automations:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // This would load sent notifications from backend
      setNotifications([
        {
          _id: '1',
          type: 'email',
          title: 'Welcome Back!',
          message: 'We noticed you were browsing our site...',
          status: 'sent',
          sentAt: new Date(),
          recipient: 'john@example.com',
        },
      ]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleCreateAutomation = () => {
    setEditingAutomation(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAutomation = (automation) => {
    setEditingAutomation(automation);
    form.setFieldsValue(automation);
    setModalVisible(true);
  };

  const handleDeleteAutomation = async (id) => {
    try {
      // API call to delete automation
      setAutomations(prev => prev.filter(a => a._id !== id));
      message.success('Automation deleted successfully');
    } catch (error) {
      message.error('Failed to delete automation');
    }
  };

  const handleSubmitAutomation = async (values) => {
    try {
      if (editingAutomation) {
        // Update existing
        setAutomations(prev =>
          prev.map(a => a._id === editingAutomation._id ? { ...a, ...values } : a)
        );
        message.success('Automation updated successfully');
      } else {
        // Create new
        const newAutomation = {
          _id: Date.now().toString(),
          ...values,
          createdAt: new Date(),
        };
        setAutomations(prev => [...prev, newAutomation]);
        message.success('Automation created successfully');
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to save automation');
    }
  };

  const toggleAutomation = async (id, active) => {
    try {
      setAutomations(prev =>
        prev.map(a => a._id === id ? { ...a, active } : a)
      );
      message.success(`Automation ${active ? 'enabled' : 'disabled'}`);
    } catch (error) {
      message.error('Failed to update automation');
    }
  };

  const sendManualNotification = async (values) => {
    try {
      await axios.post('/api/tracking/followup', values);
      message.success('Notification sent successfully');
      loadNotifications(); // Refresh list
    } catch (error) {
      message.error('Failed to send notification');
    }
  };

  const getTriggerLabel = (trigger) => {
    const labels = {
      abandoned_cart: 'Abandoned Cart',
      payment_failed: 'Payment Failed',
      checkout_stuck: 'Stuck on Checkout',
      inactive_user: 'Inactive User',
      high_value_drop: 'High Value User Drop-off',
    };
    return labels[trigger] || trigger;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return <MailOutlined />;
      case 'push': return <SendOutlined />;
      case 'whatsapp': return <PhoneOutlined />;
      default: return <MessageOutlined />;
    }
  };

  const automationColumns = [
    {
      title: 'Trigger',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger) => (
        <Tag color="blue">{getTriggerLabel(trigger)}</Tag>
      ),
    },
    {
      title: 'Delay',
      dataIndex: 'delay',
      key: 'delay',
      render: (delay) => `${delay} minutes`,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Space>
          {getTypeIcon(type)}
          <span>{type.toUpperCase()}</span>
        </Space>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Active',
      dataIndex: 'active',
      key: 'active',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={(checked) => toggleAutomation(record._id, checked)}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditAutomation(record)}
          />
          <Popconfirm
            title="Delete this automation?"
            onConfirm={() => handleDeleteAutomation(record._id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const notificationColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Space>
          {getTypeIcon(type)}
          <span>{type.toUpperCase()}</span>
        </Space>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Recipient',
      dataIndex: 'recipient',
      key: 'recipient',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'sent' ? 'green' : status === 'failed' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Sent At',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (date) => moment(date).format('MMM DD, HH:mm'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Title level={2}>Follow-up Automation</Title>

      <Row gutter={[16, 16]}>
        {/* Automation Rules */}
        <Col xs={24} lg={16}>
          <Card
            title="Automation Rules"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAutomation}>
                Add Rule
              </Button>
            }
          >
            <Table
              columns={automationColumns}
              dataSource={automations}
              rowKey="_id"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Quick Send */}
        <Col xs={24} lg={8}>
          <Card title="Quick Send">
            <Form onFinish={sendManualNotification} layout="vertical">
              <Form.Item
                name="type"
                label="Type"
                initialValue="email"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="email">Email</Option>
                  <Option value="push">Push Notification</Option>
                  <Option value="whatsapp">WhatsApp</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true }]}
              >
                <Input placeholder="Notification title" />
              </Form.Item>

              <Form.Item
                name="message"
                label="Message"
                rules={[{ required: true }]}
              >
                <TextArea
                  placeholder="Notification message"
                  rows={4}
                />
              </Form.Item>

              <Form.Item
                name="userId"
                label="User ID (optional)"
              >
                <Input placeholder="Leave empty to send to all users" />
              </Form.Item>

              <Button type="primary" htmlType="submit" block>
                Send Notification
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Recent Notifications */}
      <Card title="Recent Notifications" style={{ marginTop: 24 }}>
        <Table
          columns={notificationColumns}
          dataSource={notifications}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Automation Modal */}
      <Modal
        title={editingAutomation ? 'Edit Automation Rule' : 'Create Automation Rule'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmitAutomation}
          layout="vertical"
        >
          <Form.Item
            name="trigger"
            label="Trigger Event"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select trigger event">
              <Option value="abandoned_cart">Abandoned Cart</Option>
              <Option value="payment_failed">Payment Failed</Option>
              <Option value="checkout_stuck">Stuck on Checkout</Option>
              <Option value="inactive_user">Inactive User</Option>
              <Option value="high_value_drop">High Value User Drop-off</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="delay"
            label="Delay (minutes)"
            rules={[{ required: true }]}
          >
            <Input type="number" placeholder="30" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Notification Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select notification type">
              <Option value="email">Email</Option>
              <Option value="push">Push Notification</Option>
              <Option value="whatsapp">WhatsApp</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true }]}
          >
            <Input placeholder="Notification title" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true }]}
          >
            <TextArea
              placeholder="Notification message"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            name="active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingAutomation ? 'Update' : 'Create'}
            </Button>
          </Space>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default FollowUpAutomation;