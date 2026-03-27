import React, { useEffect, useState } from "react";
import {
  Card, Switch, InputNumber, Button, Table, Modal, Form,
  Input, Select, message, Popconfirm, Tag, DatePicker, Spin
} from "antd";
import { FaPlus, FaEdit, FaTrash, FaMagic, FaSave } from "react-icons/fa";
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
      width: 60,
      render: (c) => (
        <div className="w-8 h-8 rounded-full border" style={{ background: c }} />
      ),
    },
    { title: "Label", dataIndex: "label", key: "label" },
    {
      title: "Reward Type",
      dataIndex: "rewardType",
      render: (t) => {
        const colors = { COINS: "gold", DISCOUNT: "blue", FREE_PRODUCT: "green", NONE: "default" };
        return <Tag color={colors[t]}>{t}</Tag>;
      },
    },
    { title: "Value", dataIndex: "rewardValue", render: (v, r) => r.rewardType === "NONE" ? "-" : v },
    { title: "Probability (Weight)", dataIndex: "probability" },
    {
      title: "Active",
      dataIndex: "isActive",
      render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Actions",
      render: (_, seg) => (
        <div className="flex gap-2">
          <Button size="small" icon={<FaEdit />} onClick={() => openEditSegment(seg)} />
          <Popconfirm title="Delete this segment?" onConfirm={() => deleteSegment(seg._id)}>
            <Button size="small" danger icon={<FaTrash />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Spin Wheel Management</h2>
        <p className="text-gray-500">Configure spin wheel segments and global settings</p>
      </div>

      {/* Global Settings */}
      <Card
        className="mb-6 shadow-sm"
        title={<span className="flex items-center gap-2"><FaMagic className="text-indigo-600" /> Global Settings</span>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Enable Spin Wheel</p>
              <p className="text-sm text-gray-500">Show spin wheel to users after purchase</p>
            </div>
            <Switch checked={spinConfig?.isEnabled} onChange={toggleEnabled} />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">First-Time Bonus Spin</p>
              <p className="text-sm text-gray-500">Give new users an extra spin</p>
            </div>
            <Switch checked={spinConfig?.firstTimeBonusSpin} onChange={toggleBonus} />
          </div>
        </div>

        <Form
          layout="vertical"
          className="mt-4"
          initialValues={{
            spinsPerDay: spinConfig?.spinsPerDay,
            minPurchaseAmount: spinConfig?.minPurchaseAmount,
            expiryDate: spinConfig?.expiryDate ? dayjs(spinConfig.expiryDate) : null,
          }}
          onFinish={saveGlobalSettings}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Form.Item label="Spins Per Day" name="spinsPerDay">
              <InputNumber min={1} max={10} className="w-full" />
            </Form.Item>
            <Form.Item label="Min Purchase to Unlock (₹)" name="minPurchaseAmount">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="Offer Expiry Date" name="expiryDate">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
          <Button type="primary" htmlType="submit" loading={saving} icon={<FaSave />}>
            Save Global Settings
          </Button>
        </Form>
      </Card>

      {/* Segments */}
      <Card
        className="shadow-sm"
        title="Spin Segments"
        extra={
          <Button type="primary" icon={<FaPlus />} onClick={openAddSegment}>
            Add Segment
          </Button>
        }
      >
        <Table
          dataSource={spinConfig?.segments || []}
          columns={columns}
          rowKey="_id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Segment Modal */}
      <Modal
        title={segmentModal.editing ? "Edit Segment" : "Add Segment"}
        open={segmentModal.open}
        onOk={saveSegment}
        onCancel={() => setSegmentModal({ open: false, editing: null })}
        okText="Save"
      >
        <Form form={segForm} layout="vertical">
          <Form.Item label="Label" name="label" rules={[{ required: true }]}>
            <Input placeholder="e.g. 50 Coins" />
          </Form.Item>
          <Form.Item label="Color" name="color" initialValue="#FF6B6B">
            <Input type="color" className="w-16 h-10" />
          </Form.Item>
          <Form.Item label="Reward Type" name="rewardType" initialValue="NONE">
            <Select options={REWARD_TYPES} />
          </Form.Item>
          <Form.Item label="Reward Value" name="rewardValue" initialValue={0}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item label="Probability (Weight)" name="probability" initialValue={1}>
            <InputNumber min={0.1} step={0.1} className="w-full" />
          </Form.Item>
          <Form.Item label="Active" name="isActive" initialValue={true}>
            <Select options={[{ value: true, label: "Active" }, { value: false, label: "Inactive" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SpinManagement;
