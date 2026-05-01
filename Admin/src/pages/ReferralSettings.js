import React, { useEffect, useState } from "react";
import {
  Card, Switch, InputNumber, Button, Select, message, Spin, Form
} from "antd";
import { FaUsers, FaSave, FaCoins } from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const REWARD_TYPES = [
  { value: "FIXED_COINS", label: "Fixed Coins" },
  { value: "PERCENTAGE", label: "Percentage of Purchase" },
];

const TRIGGER_OPTIONS = [
  { value: "ON_SIGNUP", label: "On Signup" },
  { value: "ON_FIRST_PURCHASE", label: "On First Purchase" },
  { value: "ON_EVERY_PURCHASE", label: "On Every Purchase" },
];

const ReferralSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refConfig, setRefConfig] = useState(null);
  const [form] = Form.useForm();

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base_url}rewards/referral/config`, config);
      setRefConfig(res.data);
      form.setFieldsValue(res.data);
    } catch {
      message.error("Failed to load referral config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const onFinish = async (values) => {
    try {
      setSaving(true);
      await axios.put(`${base_url}rewards/referral/config`, values, config);
      message.success("Referral settings saved!");
      fetchConfig();
    } catch {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Referral Settings</h2>
        <p className="text-gray-500">Configure how referral rewards are distributed</p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Enable / Disable */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaUsers className="text-indigo-600" /> Referral Module</span>}>
          <Form.Item name="isEnabled" valuePropName="checked" label="Enable Referral System">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
        </Card>

        {/* Reward Config */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaCoins className="text-yellow-500" /> Reward Configuration</span>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Reward Type" name="rewardType">
              <Select options={REWARD_TYPES} />
            </Form.Item>
            <Form.Item label="Reward Trigger" name="rewardTrigger">
              <Select options={TRIGGER_OPTIONS} />
            </Form.Item>
            <Form.Item label="Fixed Coins (if Fixed type)" name="fixedCoins">
              <InputNumber min={0} className="w-full" addonAfter="coins" />
            </Form.Item>
            <Form.Item label="Percentage (if % type)" name="percentage">
              <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
            </Form.Item>
          </div>
        </Card>

        {/* Limits */}
        <Card className="mb-6 shadow-sm" title="Limits & Conditions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Max Reward Per User Per Month" name="maxRewardPerUserPerMonth" extra="0 = unlimited">
              <InputNumber min={0} className="w-full" addonAfter="coins" />
            </Form.Item>
            <Form.Item label="Min Purchase Amount" name="minPurchaseAmount" extra="Only reward if purchase ≥ this amount">
              <InputNumber min={0} className="w-full" addonBefore="₹" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <Form.Item name="enableEveryPurchaseReward" valuePropName="checked" label="Enable Every Purchase Reward">
              <Switch />
            </Form.Item>
            <Form.Item name="enableFirstPurchaseReward" valuePropName="checked" label="Enable First Purchase Reward">
              <Switch />
            </Form.Item>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button size="large" onClick={fetchConfig}>Reset</Button>
          <Button type="primary" size="large" htmlType="submit" loading={saving} icon={<FaSave />}>
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ReferralSettings;
