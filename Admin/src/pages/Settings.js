import React, { useEffect, useState } from "react";
import { Form, Input, Switch, Button, Card, message, Spin } from "antd";
import {
  FaBuilding, FaEnvelope, FaStore, FaMapMarkerAlt, FaPhone,
  FaMagic, FaSave, FaQuoteRight, FaPercentage, FaUsers, FaInfoCircle
} from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const Settings = () => {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [form] = Form.useForm();

  const [spinnerEnabled,      setSpinnerEnabled]      = useState(false);
  const [referralOfferEnabled, setReferralOfferEnabled] = useState(false);
  const [referralCoinPercent,  setReferralCoinPercent]  = useState(10);
  // Tax mode: false = prices EXCLUDE tax (add on top), true = prices INCLUDE tax (extract)
  const [taxIncluded, setTaxIncluded] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${base_url}user/settings`, config);
      form.setFieldsValue({
        gstin:        res.data.gstin        || "",
        email:        res.data.email        || "",
        cgst:         res.data.cgst         || 0,
        sgst:         res.data.sgst         || 0,
        storeName:    res.data.storeName    || "Cart Corner",
        storeTagline: res.data.storeTagline || "Your One-Stop Shopping Destination",
        storeAddress: res.data.storeAddress || "",
        storePhone:   res.data.storePhone   || "",
      });
      setSpinnerEnabled(res.data.showSpinner === true);
      setReferralOfferEnabled(res.data.showReferralOffer === true);
      setReferralCoinPercent(res.data.referralCoinPercent || 10);
      setTaxIncluded(res.data.taxIncluded === true);
    } catch {
      message.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setSaving(true);
      const payload = {
        ...values,
        showSpinner:         spinnerEnabled,
        showReferralOffer:   referralOfferEnabled,
        referralCoinPercent: referralOfferEnabled ? referralCoinPercent : 0,
        taxIncluded,
      };
      await axios.put(`${base_url}user/settings`, payload, config);
      if (values.gstin !== undefined) {
        await axios.put(`${base_url}user/gstin`, { gstin: values.gstin }, config);
      }
      message.success("Settings saved successfully!");
    } catch {
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
        <p className="text-gray-500">Manage your store configurations and preferences</p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>

        {/* ── Business Info ── */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaBuilding className="text-indigo-600" /> Business Information</span>}>
          <Form.Item label="GSTIN Number" name="gstin"
            rules={[{ pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: "Invalid GSTIN format" }]}>
            <Input placeholder="Enter GSTIN" maxLength={15} prefix={<FaBuilding className="text-gray-400" />} />
          </Form.Item>
          <Form.Item label="Email Address" name="email" rules={[{ type: "email", message: "Invalid email" }]}>
            <Input placeholder="Enter email" prefix={<FaEnvelope className="text-gray-400" />} />
          </Form.Item>

          {/* Tax rates */}
          <div className="flex gap-4">
            <Form.Item className="flex-1" label="CGST (%)" name="cgst" rules={[{ required: true, message: "Please enter CGST" }]}>
              <Input type="number" min={0} placeholder="Enter CGST" prefix={<FaPercentage className="text-gray-400" />} />
            </Form.Item>
            <Form.Item className="flex-1" label="SGST (%)" name="sgst" rules={[{ required: true, message: "Please enter SGST" }]}>
              <Input type="number" min={0} placeholder="Enter SGST" prefix={<FaPercentage className="text-gray-400" />} />
            </Form.Item>
          </div>

          {/* Tax mode toggle */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">Tax Mode</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {taxIncluded
                    ? "Prices INCLUDE tax — tax is extracted from the price (e.g. ₹1000 product price already has GST inside)"
                    : "Prices EXCLUDE tax — tax is added on top of the price (e.g. ₹1000 + 18% GST = ₹1180)"}
                </p>
              </div>
              <Switch
                checked={taxIncluded}
                onChange={setTaxIncluded}
                checkedChildren="Tax Included"
                unCheckedChildren="Tax Excluded"
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-lg border-2 ${!taxIncluded ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                <p className="font-semibold text-gray-700 mb-1">📦 Tax Excluded (default)</p>
                <p className="text-gray-500">Product: ₹1000</p>
                <p className="text-gray-500">+ CGST 9%: ₹90</p>
                <p className="text-gray-500">+ SGST 9%: ₹90</p>
                <p className="font-bold text-indigo-600">Total: ₹1180</p>
                <p className="text-gray-400 mt-1">Coins on ₹1180 (after discount)</p>
              </div>
              <div className={`p-3 rounded-lg border-2 ${taxIncluded ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                <p className="font-semibold text-gray-700 mb-1">🏷️ Tax Included</p>
                <p className="text-gray-500">Product: ₹1180 (incl. tax)</p>
                <p className="text-gray-500">CGST 9% extracted: ₹90</p>
                <p className="text-gray-500">SGST 9% extracted: ₹90</p>
                <p className="font-bold text-indigo-600">Base: ₹1000 | Total: ₹1180</p>
                <p className="text-gray-400 mt-1">Coins on ₹1180 (after discount)</p>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Store Details ── */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaStore className="text-indigo-600" /> Store Details</span>}>
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
            <Input.TextArea rows={2} />
          </Form.Item>
        </Card>

        {/* ── Features ── */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaMagic className="text-indigo-600" /> Features & Preferences</span>}>
          <div className="flex items-center gap-4 mb-4">
            <Switch checked={spinnerEnabled} onChange={setSpinnerEnabled} checkedChildren="Enabled" unCheckedChildren="Disabled" />
            <span className="text-gray-500 text-sm">Show spin wheel offer after purchase</span>
          </div>

          <div className="flex items-center gap-4">
            <Switch checked={referralOfferEnabled} onChange={setReferralOfferEnabled} checkedChildren="Enabled" unCheckedChildren="Disabled" />
            <span className="text-gray-500 text-sm">Show referral offer while live billing</span>
          </div>

          {referralOfferEnabled && (
            <div className="mt-4 pl-4 border-l-2 border-indigo-200">
              <div className="flex items-center gap-4">
                <FaPercentage className="text-gray-400" />
                <span className="text-gray-500 text-sm">Coins to referrer (% of order amount):</span>
                <input
                  type="number" min={0} max={100}
                  className="w-20 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center"
                  value={referralCoinPercent}
                  onChange={(e) => setReferralCoinPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                />
                <span className="text-gray-500 text-sm">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Calculated on the final payable amount (after all discounts)
              </p>
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-4">
          <Button size="large" onClick={fetchSettings}>Reset</Button>
          <Button type="primary" size="large" htmlType="submit" loading={saving} icon={<FaSave />}>
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;
