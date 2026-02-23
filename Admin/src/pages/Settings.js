import React, { useEffect, useState } from "react";
import { Form, Input, Switch, Button, Card, message, Spin } from "antd";
import {
  FaBuilding,
  FaEnvelope,
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaMagic,
  FaSave,
  FaQuoteRight,
  FaPercentage
} from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Manual state for spinner (no Form binding issues)
  const [spinnerEnabled, setSpinnerEnabled] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base_url}user/settings`, config);

      form.setFieldsValue({
        gstin: res.data.gstin || "",
        email: res.data.email || "",
        cgst: res.data.cgst || 0,
        sgst: res.data.sgst || 0,
        storeName: res.data.storeName || "Cart Corner",
        storeTagline:
          res.data.storeTagline || "Your One-Stop Shopping Destination",
        storeAddress: res.data.storeAddress || "",
        storePhone: res.data.storePhone || ""
      });

      // Set spinner separately
      setSpinnerEnabled(res.data.showSpinner === true);
    } catch (error) {
      message.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setSaving(true);

      // Force boolean
      const payload = {
        ...values,
        showSpinner: spinnerEnabled
      };

      // Update settings
      await axios.put(
        `${base_url}user/settings`,
        payload,
        config
      );

      // Update GSTIN separately
      if (values.gstin !== undefined) {
        await axios.put(`${base_url}user/gstin`, { gstin: values.gstin }, config);
      }

      message.success("Settings saved successfully!");
    } catch (error) {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        <p className="text-gray-500">
          Manage your store configurations and preferences
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* Business Info */}
        <Card
          className="mb-6 shadow-sm"
          title={
            <span className="flex items-center gap-2">
              <FaBuilding className="text-indigo-600" />
              Business Information
            </span>
          }
        >
          <Form.Item
            label="GSTIN Number"
            name="gstin"
            rules={[
              {
                pattern:
                  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: "Invalid GSTIN format"
              }
            ]}
          >
            <Input
              placeholder="Enter GSTIN"
              maxLength={15}
              prefix={<FaBuilding className="text-gray-400" />}
            />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[{ type: "email", message: "Invalid email" }]}
          >
            <Input
              placeholder="Enter email"
              prefix={<FaEnvelope className="text-gray-400" />}
            />
          </Form.Item>

          <div className="flex gap-4">
            <Form.Item
              className="flex-1"
              label="CGST (%)"
              name="cgst"
              rules={[{ required: true, message: "Please enter CGST" }]}
            >
              <Input
                type="number"
                min={0}
                placeholder="Enter CGST"
                prefix={<FaPercentage className="text-gray-400" />}
              />
            </Form.Item>
            <Form.Item
              className="flex-1"
              label="SGST (%)"
              name="sgst"
              rules={[{ required: true, message: "Please enter SGST" }]}
            >
              <Input
                type="number"
                min={0}
                placeholder="Enter SGST"
                prefix={<FaPercentage className="text-gray-400" />}
              />
            </Form.Item>
          </div>
        </Card>

        {/* Store Details */}
        <Card
          className="mb-6 shadow-sm"
          title={
            <span className="flex items-center gap-2">
              <FaStore className="text-indigo-600" />
              Store Details
            </span>
          }
        >
          <Form.Item label="Store Name" name="storeName">
            <Input prefix={<FaStore className="text-gray-400" />} />
          </Form.Item>

          <Form.Item label="Phone Number" name="storePhone">
            <Input prefix={<FaPhone className="text-gray-400" />} />
          </Form.Item>

          <Form.Item label="Store Tagline" name="storeTagline">
            <Input prefix={<FaQuoteRight className="text-gray-400" />} />
          </Form.Item>

          <Form.Item label="Store Address" name="storeAddress">
            <Input.TextArea
              rows={2}
              prefix={<FaMapMarkerAlt className="text-gray-400" />}
            />
          </Form.Item>
        </Card>

        {/* Spinner Feature */}
        <Card
          className="mb-6 shadow-sm"
          title={
            <span className="flex items-center gap-2">
              <FaMagic className="text-indigo-600" />
              Features & Preferences
            </span>
          }
        >
          <div className="flex items-center gap-4">
            <Switch
              checked={spinnerEnabled}
              onChange={(checked) => setSpinnerEnabled(checked)}
              checkedChildren="Enabled"
              unCheckedChildren="Disabled"
            />
            <span className="text-gray-500 text-sm">
              Show spin wheel offer after purchase
            </span>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button size="large" onClick={fetchSettings}>
            Reset
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={saving}
            icon={<FaSave />}
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;