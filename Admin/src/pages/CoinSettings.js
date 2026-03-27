import React, { useEffect, useState } from "react";
import { Card, Switch, InputNumber, Button, Select, message, Spin, Form } from "antd";
import { FaCoins, FaSave, FaUser, FaUsers } from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const CoinSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [purchaseEnabled, setPurchaseEnabled] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base_url}rewards/coins/config`, config);
      form.setFieldsValue(res.data);
      setPurchaseEnabled(res.data.purchaseRewardEnabled);
    } catch {
      message.error("Failed to load coin config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  const onFinish = async (values) => {
    try {
      setSaving(true);
      await axios.put(`${base_url}rewards/coins/config`, values, config);
      message.success("Coin settings saved!");
    } catch {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Spin size="large" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Coin System Settings</h2>
        <p className="text-gray-500">Control all coin reward sources globally</p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* Master Toggle */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaCoins className="text-yellow-500" /> Global Coin System</span>}>
          <Form.Item name="isEnabled" valuePropName="checked" label="Enable Coin Rewards System">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
          </Form.Item>
        </Card>

        {/* Reward Sources */}
        <Card className="mb-6 shadow-sm" title="Reward Sources">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="font-medium mb-2">🎰 Spin Wheel Coins</p>
              <p className="text-xs text-gray-500 mb-2">Customer earns coins when spin lands on COINS reward</p>
              <Form.Item name="spinRewardEnabled" valuePropName="checked" className="mb-0">
                <Switch size="small" />
              </Form.Item>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-medium mb-2">👥 Referrer Coins</p>
              <p className="text-xs text-gray-500 mb-2">Referrer earns coins when referred user purchases</p>
              <Form.Item name="referrerPurchaseRewardEnabled" valuePropName="checked" className="mb-0">
                <Switch size="small" />
              </Form.Item>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-medium mb-2">🛒 Buyer Purchase Coins</p>
              <p className="text-xs text-gray-500 mb-2">Buyer earns coins on their own purchase</p>
              <Form.Item name="buyerPurchaseRewardEnabled" valuePropName="checked" className="mb-0">
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>

          {/* Visual explanation */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">💡 How "Both Sides" works:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Buyer Purchase Coins ON + Referrer Coins ON</strong> → Both buyer AND referrer earn coins on every purchase</p>
              <p>• <strong>Only Referrer Coins ON</strong> → Only the referrer earns (buyer gets nothing extra)</p>
              <p>• <strong>Only Buyer Purchase Coins ON</strong> → Only the buyer earns (referrer gets nothing)</p>
            </div>
          </div>
        </Card>

        {/* Purchase Reward Config */}
        <Card
          className="mb-6 shadow-sm"
          title={
            <div className="flex items-center justify-between">
              <span>Purchase Reward Configuration</span>
              <Form.Item name="purchaseRewardEnabled" valuePropName="checked" className="mb-0">
                <Switch
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                  onChange={(v) => setPurchaseEnabled(v)}
                />
              </Form.Item>
            </div>
          }
        >
          <p className="text-sm text-gray-500 mb-4">
            These settings apply to <strong>Buyer Purchase Coins</strong>. The same reward type/percentage is used for both buyer and referrer calculations.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Reward Type" name="purchaseRewardType">
              <Select options={[
                { value: "FIXED", label: "Fixed Coins per Order" },
                { value: "PERCENTAGE", label: "Percentage of Order Amount" },
              ]} />
            </Form.Item>
            <Form.Item label="Fixed Coins per Order" name="purchaseFixedCoins">
              <InputNumber min={0} className="w-full" addonAfter="coins" />
            </Form.Item>
            <Form.Item label="Percentage of Order" name="purchasePercentage">
              <InputNumber min={0} max={100} className="w-full" addonAfter="%" />
            </Form.Item>
            <Form.Item label="Min Order Amount" name="purchaseMinOrderAmount">
              <InputNumber min={0} className="w-full" addonBefore="₹" />
            </Form.Item>
            <Form.Item label="Max Coins Per Order" name="purchaseMaxCoinsPerOrder" extra="0 = unlimited">
              <InputNumber min={0} className="w-full" addonAfter="coins" />
            </Form.Item>
          </div>

          {/* Example calculation */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700 font-medium">Example with 2% percentage, ₹1000 order:</p>
            <p className="text-xs text-blue-600 mt-1">• Buyer earns: floor(1000 × 2%) = <strong>20 coins</strong> (if Buyer Purchase Coins ON)</p>
            <p className="text-xs text-blue-600">• Referrer earns: based on Referral Settings % (separate config)</p>
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

export default CoinSettings;
