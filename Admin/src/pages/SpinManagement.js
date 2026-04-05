import React, { useEffect, useState } from "react";
import {
  Card, Switch, InputNumber, Button, Table, Modal, Form,
  Input, Select, message, Popconfirm, Tag, DatePicker, Spin, Row, Col, Divider, Space
} from "antd";
import { FaPlus, FaEdit, FaTrash, FaMagic, FaSave, FaCog, FaChartPie, FaToggleOn, FaToggleOff } from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";
import dayjs from "dayjs";

const REWARD_TYPES = [
  { value: "COINS", label: "Coins" },
  { value: "DISCOUNT", label: "Discount (%)" },
  { value: "FREE_PRODUCT", label: "Free Product" },
  { value: "NONE", label: "No Reward" },
];

const SpinManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [spinConfig, setSpinConfig] = useState(null);
  const [segmentModal, setSegmentModal] = useState({ open: false, editing: null });
  const [form] = Form.useForm();
  const [segForm] = Form.useForm();

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base_url}spin/config`, config);
      setSpinConfig(res.data);
    } catch {
      message.error("Failed to load spin config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const saveGlobalSettings = async (values) => {
    try {
      setSaving(true);
      await axios.put(`${base_url}spin/config`, {
        ...values,
        isEnabled: spinConfig.isEnabled,
        firstTimeBonusSpin: spinConfig.firstTimeBonusSpin,
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
      }, config);
      message.success("Settings saved!");
      fetchConfig();
    } catch {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (val) => {
    await axios.put(`${base_url}spin/config`, { isEnabled: val }, config);
    setSpinConfig((prev) => ({ ...prev, isEnabled: val }));
  };

  const toggleBonus = async (val) => {
    await axios.put(`${base_url}spin/config`, { firstTimeBonusSpin: val }, config);
    setSpinConfig((prev) => ({ ...prev, firstTimeBonusSpin: val }));
  };

  const openAddSegment = () => {
    segForm.resetFields();
    setSegmentModal({ open: true, editing: null });
  };

  const openEditSegment = (seg) => {
    segForm.setFieldsValue(seg);
    setSegmentModal({ open: true, editing: seg });
  };

  const saveSegment = async () => {
    const values = await segForm.validateFields();
    try {
      if (segmentModal.editing) {
        await axios.put(`${base_url}spin/segment/${segmentModal.editing._id}`, values, config);
        message.success("Segment updated!");
      } else {
        await axios.post(`${base_url}spin/segment`, values, config);
        message.success("Segment added!");
      }
      setSegmentModal({ open: false, editing: null });
      fetchConfig();
    } catch {
      message.error("Failed to save segment");
    }
  };

  const deleteSegment = async (segId) => {
    try {
      await axios.delete(`${base_url}spin/segment/${segId}`, config);
      message.success("Segment deleted!");
      fetchConfig();
    } catch {
      message.error("Failed to delete segment");
    }
  };

  const columns = [
    {
      title: "Color",
      dataIndex: "color",
      width: 80,
      render: (c) => (
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 mx-auto" style={{ background: c }} />
      ),
    },
    { title: "Label", dataIndex: "label", key: "label", ellipsis: true },
    {
      title: "Reward Type",
      dataIndex: "rewardType",
      render: (t) => {
        const colors = { COINS: "gold", DISCOUNT: "blue", FREE_PRODUCT: "green", NONE: "default" };
        return <Tag color={colors[t]}>{t.replace('_', ' ')}</Tag>;
      },
    },
    { title: "Value", dataIndex: "rewardValue", render: (v, r) => r.rewardType === "NONE" ? "-" : v },
    { title: "Probability", dataIndex: "probability", width: 100 },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions",
      width: 120,
      render: (_, seg) => (
        <Space>
          <Button size="small" type="text" icon={<FaEdit />} onClick={() => openEditSegment(seg)} />
          <Popconfirm title="Delete this segment?" onConfirm={() => deleteSegment(seg._id)}>
            <Button size="small" type="text" danger icon={<FaTrash />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Spin size="large" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaMagic className="text-indigo-600" />
            Spin Wheel Management
          </h1>
          <p className="text-gray-600 mt-2">Configure and manage your spin wheel rewards system</p>
        </div>

        {/* Global Settings */}
        <Card
          className="mb-8 shadow-lg border-0 bg-gradient-to-r from-indigo-50 to-purple-50"
          title={
            <span className="flex items-center gap-2 text-lg font-semibold">
              <FaCog className="text-indigo-600" />
              Global Settings
            </span>
          }
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8}>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Enable Spin Wheel</h3>
                    <p className="text-sm text-gray-500">Show spin wheel after purchase</p>
                  </div>
                  <Switch
                    checked={spinConfig?.isEnabled}
                    onChange={toggleEnabled}
                    checkedChildren={<FaToggleOn />}
                    unCheckedChildren={<FaToggleOff />}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">First-Time Bonus</h3>
                    <p className="text-sm text-gray-500">Extra spin for new users</p>
                  </div>
                  <Switch
                    checked={spinConfig?.firstTimeBonusSpin}
                    onChange={toggleBonus}
                    checkedChildren={<FaToggleOn />}
                    unCheckedChildren={<FaToggleOff />}
                  />
                </div>
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Segments:</span>
                    <span className="font-medium">{spinConfig?.segments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Segments:</span>
                    <span className="font-medium">{spinConfig?.segments?.filter(s => s.isActive).length || 0}</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

          <Divider />

          <Form
            layout="vertical"
            form={form}
            initialValues={{
              spinsPerDay: spinConfig?.spinsPerDay,
              minPurchaseAmount: spinConfig?.minPurchaseAmount,
              expiryDate: spinConfig?.expiryDate ? dayjs(spinConfig.expiryDate) : null,
            }}
            onFinish={saveGlobalSettings}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Form.Item
                  label={<span className="font-medium">Spins Per Day</span>}
                  name="spinsPerDay"
                  rules={[{ required: true, message: 'Please enter spins per day' }]}
                >
                  <InputNumber min={1} max={10} className="w-full" placeholder="e.g. 3" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label={<span className="font-medium">Min Purchase Amount (₹)</span>}
                  name="minPurchaseAmount"
                  rules={[{ required: true, message: 'Please enter minimum purchase amount' }]}
                >
                  <InputNumber min={0} className="w-full" placeholder="e.g. 500" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label={<span className="font-medium">Offer Expiry Date</span>}
                  name="expiryDate"
                >
                  <DatePicker className="w-full" placeholder="Select expiry date" />
                </Form.Item>
              </Col>
            </Row>
            <div className="flex justify-end mt-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<FaSave />}
                size="large"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Save Global Settings
              </Button>
            </div>
          </Form>
        </Card>

        {/* Segments Management */}
        <Card
          className="shadow-lg border-0"
          title={
            <span className="flex items-center gap-2 text-lg font-semibold">
              <FaChartPie className="text-indigo-600" />
              Spin Segments
            </span>
          }
          extra={
            <Button
              type="primary"
              icon={<FaPlus />}
              onClick={openAddSegment}
              size="large"
              className="bg-green-600 hover:bg-green-700"
            >
              Add Segment
            </Button>
          }
        >
          <Table
            dataSource={spinConfig?.segments || []}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
            size="middle"
            scroll={{ x: 600 }}
            className="border rounded-lg"
          />
        </Card>

        {/* Segment Modal */}
        <Modal
          title={
            <span className="flex items-center gap-2">
              {segmentModal.editing ? <FaEdit className="text-blue-600" /> : <FaPlus className="text-green-600" />}
              {segmentModal.editing ? "Edit Segment" : "Add New Segment"}
            </span>
          }
          open={segmentModal.open}
          onOk={saveSegment}
          onCancel={() => setSegmentModal({ open: false, editing: null })}
          okText="Save Segment"
          cancelText="Cancel"
          width={600}
          okButtonProps={{ className: "bg-indigo-600 hover:bg-indigo-700" }}
        >
          <Form form={segForm} layout="vertical" className="mt-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Segment Label"
                  name="label"
                  rules={[{ required: true, message: 'Please enter segment label' }]}
                >
                  <Input placeholder="e.g. 50 Coins" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Color"
                  name="color"
                  initialValue="#FF6B6B"
                >
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-12 h-10 border rounded" />
                    <span className="text-sm text-gray-500">Choose segment color</span>
                  </div>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Reward Type"
                  name="rewardType"
                  initialValue="NONE"
                  rules={[{ required: true, message: 'Please select reward type' }]}
                >
                  <Select options={REWARD_TYPES} placeholder="Select reward type" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Reward Value"
                  name="rewardValue"
                  initialValue={0}
                  rules={[{ required: true, message: 'Please enter reward value' }]}
                >
                  <InputNumber min={0} className="w-full" placeholder="e.g. 50" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Probability (Weight)"
                  name="probability"
                  initialValue={1}
                  rules={[{ required: true, message: 'Please enter probability' }]}
                >
                  <InputNumber min={0.1} step={0.1} className="w-full" placeholder="e.g. 1.0" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Status"
                  name="isActive"
                  initialValue={true}
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select
                    options={[
                      { value: true, label: "Active" },
                      { value: false, label: "Inactive" }
                    ]}
                    placeholder="Select status"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default SpinManagement;
