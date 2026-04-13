import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Avatar, Badge, List, Typography, Tag, Button, Modal, Select, Input, message, Switch } from 'antd';
import { UserOutlined, EyeOutlined, AlertOutlined, MessageOutlined, GlobalOutlined, MobileOutlined, DesktopOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import io from 'socket.io-client';
import axios from '../utils/axiosconfig';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const LiveTrackingDashboard = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [issues, setIssues] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [followUpModal, setFollowUpModal] = useState(false);
  const [followUpData, setFollowUpData] = useState({ type: 'email', title: '', message: '' });
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to admin dashboard');
      newSocket.emit('join-admin');
    });

    // Listen for real-time updates
    newSocket.on('user_activity', (data) => {
      updateUserActivity(data);
    });

    newSocket.on('new_event', (event) => {
      updateAnalytics();
      checkForNewIssues();
    });

    // Initial data load
    loadDashboardData();
    loadTrackingConfig();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const loadTrackingConfig = async () => {
    try {
      const res = await axios.get('/tracking/config');
      setTrackingEnabled(res.data.isEnabled);
    } catch (error) {
      console.error('Error loading tracking config:', error);
    }
  };

  const handleTrackingToggle = async (checked) => {
    try {
      await axios.put('/tracking/config', { isEnabled: checked });
      setTrackingEnabled(checked);
      message.success(`Tracking ${checked ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      message.error('Failed to update tracking config');
    }
  };

  const loadDashboardData = async () => {
    try {
      const [sessionsRes, analyticsRes, issuesRes] = await Promise.all([
        axios.get('/tracking/sessions/active'),
        axios.get('/tracking/analytics'),
        axios.get('/tracking/issues')
      ]);

      setActiveSessions(sessionsRes.data.sessions);
      setAnalytics(analyticsRes.data.analytics);
      setIssues(issuesRes.data.issues);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const updateUserActivity = (data) => {
    setActiveSessions(prev => {
      const existing = prev.find(s => s.sessionId === data.sessionId);
      if (existing) {
        return prev.map(s =>
          s.sessionId === data.sessionId
            ? { ...s, currentPage: data.currentPage, lastActivity: data.timestamp }
            : s
        );
      }
      return prev;
    });
  };

  const updateAnalytics = async () => {
    try {
      const res = await axios.get('/tracking/analytics');
      setAnalytics(res.data.analytics);
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  };

  const checkForNewIssues = async () => {
    try {
      const res = await axios.get('/tracking/issues');
      setIssues(res.data.issues);
    } catch (error) {
      console.error('Error checking issues:', error);
    }
  };

  const loadUserActivity = async (userId, guestId, sessionId) => {
    try {
      const res = await axios.get('/tracking/activity', {
        params: { userId, guestId, sessionId, limit: 20 }
      });
      setUserActivity(res.data.events);
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  const handleUserClick = (session) => {
    setSelectedUser(session);
    loadUserActivity(session.userId?._id, session.guestId, session.sessionId);
  };

  const handleSendFollowUp = async () => {
    try {
      await axios.post('/tracking/followup', {
        userId: selectedUser?.userId?._id,
        guestId: selectedUser?.guestId,
        ...followUpData
      });
      message.success('Follow-up sent successfully!');
      setFollowUpModal(false);
      setFollowUpData({ type: 'email', title: '', message: '' });
    } catch (error) {
      message.error('Failed to send follow-up');
    }
  };

  const resolveIssue = async (issueId) => {
    try {
      await axios.put(`/tracking/issues/${issueId}/resolve`);
      setIssues(prev => prev.filter(i => i._id !== issueId));
      message.success('Issue resolved!');
    } catch (error) {
      message.error('Failed to resolve issue');
    }
  };

  const getDeviceIcon = (device) => {
    return device === 'mobile' ? <MobileOutlined /> : <DesktopOutlined />;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      default: return 'blue';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Live User Tracking Dashboard</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text strong>Tracking System:</Text>
          <Switch
            checked={trackingEnabled}
            onChange={handleTrackingToggle}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            style={{ backgroundColor: trackingEnabled ? '#52c41a' : '#ff4d4f' }}
          />
          <Badge status={trackingEnabled ? 'processing' : 'error'} text={trackingEnabled ? 'Active' : 'Stopped'} />
        </div>
      </div>

      {/* Analytics Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={analytics.activeUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Sessions"
              value={analytics.totalSessions || 0}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Events Today"
              value={analytics.totalEvents || 0}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Issues"
              value={issues.length}
              prefix={<AlertOutlined />}
              valueStyle={{ color: issues.length > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Live Visitors Panel */}
        <Col xs={24} lg={12}>
          <Card
            title="Live Visitors"
            extra={<Badge status="processing" text="Real-time" />}
          >
            <List
              dataSource={activeSessions.slice(0, 10)}
              renderItem={(session) => (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <List.Item
                    onClick={() => handleUserClick(session)}
                    style={{ cursor: 'pointer', padding: '12px' }}
                    actions={[
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(session);
                          setFollowUpModal(true);
                        }}
                      >
                        <MessageOutlined />
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar icon={<UserOutlined />} />
                      }
                      title={
                        <div>
                          {session.userId ? (
                            `${session.userId.firstname} ${session.userId.lastname}`
                          ) : (
                            `Guest ${session.guestId.slice(-6)}`
                          )}
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {getDeviceIcon(session.device)} {session.device} • {moment(session.lastActivity).fromNow()}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <Text ellipsis style={{ maxWidth: 200 }}>
                            Viewing: {session.currentPage}
                          </Text>
                          {session.location?.city && (
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              📍 {session.location.city}, {session.location.country}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                </motion.div>
              )}
            />
          </Card>
        </Col>

        {/* Issues Panel */}
        <Col xs={24} lg={12}>
          <Card title="Active Issues" extra={<AlertOutlined />}>
            <List
              dataSource={issues.slice(0, 10)}
              renderItem={(issue) => (
                <List.Item
                  actions={[
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => resolveIssue(issue._id)}
                    >
                      Resolve
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div>
                        <Tag color={getSeverityColor(issue.severity)}>
                          {issue.severity.toUpperCase()}
                        </Tag>
                        {issue.title}
                      </div>
                    }
                    description={
                      <div>
                        <div>{issue.description}</div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                          {moment(issue.createdAt).fromNow()} •
                          {issue.userId ?
                            ` ${issue.userId.firstname} ${issue.userId.lastname}` :
                            ` Guest ${issue.guestId?.slice(-6)}`
                          }
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* User Activity Modal */}
      <Modal
        title={selectedUser ? `Activity: ${selectedUser.userId ? `${selectedUser.userId.firstname} ${selectedUser.userId.lastname}` : `Guest ${selectedUser.guestId.slice(-6)}`}` : 'User Activity'}
        open={!!selectedUser}
        onCancel={() => setSelectedUser(null)}
        width={800}
        footer={null}
      >
        <List
          dataSource={userActivity}
          renderItem={(event) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div>
                    <Tag color="blue">{event.eventType.replace('_', ' ').toUpperCase()}</Tag>
                    <span style={{ marginLeft: 8 }}>{event.page}</span>
                  </div>
                }
                description={
                  <div>
                    {moment(event.timestamp).format('MMM DD, YYYY HH:mm:ss')}
                    {event.metadata?.productName && (
                      <div>Product: {event.metadata.productName}</div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Follow-up Modal */}
      <Modal
        title="Send Follow-up"
        open={followUpModal}
        onOk={handleSendFollowUp}
        onCancel={() => setFollowUpModal(false)}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Type:</Text>
          <Select
            value={followUpData.type}
            onChange={(value) => setFollowUpData(prev => ({ ...prev, type: value }))}
            style={{ width: '100%', marginTop: 8 }}
          >
            <Option value="email">Email</Option>
            <Option value="push">Push Notification</Option>
            <Option value="whatsapp">WhatsApp</Option>
          </Select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Title:</Text>
          <Input
            value={followUpData.title}
            onChange={(e) => setFollowUpData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Follow-up title"
            style={{ marginTop: 8 }}
          />
        </div>
        <div>
          <Text strong>Message:</Text>
          <TextArea
            value={followUpData.message}
            onChange={(e) => setFollowUpData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="Follow-up message"
            rows={4}
            style={{ marginTop: 8 }}
          />
        </div>
      </Modal>
    </motion.div>
  );
};

export default LiveTrackingDashboard;