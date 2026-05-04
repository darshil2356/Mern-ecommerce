import React, { useEffect, useState } from "react";
import { Form, Input, Switch, Button, Card, message, Spin } from "antd";
import {
  FaBuilding, FaEnvelope, FaStore, FaMapMarkerAlt, FaPhone,
  FaMagic, FaSave, FaQuoteRight, FaPercentage, FaTruck,
  FaRss, FaSyncAlt, FaExternalLinkAlt, FaCopy,
} from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

// base_url = "http://localhost:8000/api/" → strip /api/ to get backend root
const BACKEND_ROOT  = (process.env.REACT_APP_API_URL || "").replace(/\/api\/?$/, "");
const FEED_XML_URL  = `${BACKEND_ROOT}/feed.xml`;
const FEED_JSON_URL = `${BACKEND_ROOT}/feed.json`;

const Settings = () => {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedInfo, setFeedInfo]     = useState(null); // { builtAt, count }
  const [form] = Form.useForm();

  const [taxIncluded, setTaxIncluded]                       = useState(false);
  const [storeState, setStoreState]                         = useState("Gujarat");
  const [onlinePaymentDestination, setOnlinePaymentDestination] = useState("CURRENT_ACCOUNT");
  const [requireOtpForSignup, setRequireOtpForSignup]       = useState(false);

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
        igst:         res.data.igst         || 0,
        storeName:    res.data.storeName    || "Yashoda Fashion",
        storeTagline: res.data.storeTagline || "Your One-Stop Shopping Destination",
        storeAddress: res.data.storeAddress || "",
        storePhone:   res.data.storePhone   || "",
        storeEmail:   res.data.storeEmail   || "",
        shippingCharge: res.data.shippingCharge ?? 100,
        upiIdA:       res.data.upiIdA       || "",
        upiIdB:       res.data.upiIdB       || "",
      });
      setTaxIncluded(res.data.taxIncluded === true);
      setStoreState(res.data.storeState || "Gujarat");
      setOnlinePaymentDestination(res.data.onlinePaymentDestination || "CURRENT_ACCOUNT");
      setRequireOtpForSignup(res.data.requireOtpForSignup === true);
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
        cgst: parseFloat(values.cgst) || 0,
        sgst: parseFloat(values.sgst) || 0,
        igst: parseFloat(values.igst) || 0,
        shippingCharge: parseFloat(values.shippingCharge) >= 0 ? parseFloat(values.shippingCharge) : 0,
        taxIncluded,
        storeState,
        onlinePaymentDestination,
        requireOtpForSignup,
        upiIdA: values.upiIdA || "",
        upiIdB: values.upiIdB || "",
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

  const refreshFeed = async () => {
    const secret = process.env.REACT_APP_FEED_REFRESH_SECRET || "";
    try {
      setFeedRefreshing(true);
      const res = await axios.post(
        // base_url ends with /api/ — feed/refresh is at root level
        `${base_url.replace(/\/api\/?$/, "")}/feed/refresh`,
        {},
        { headers: { "x-feed-secret": secret } }
      );
      setFeedInfo({ builtAt: res.data.builtAt, count: res.data.count });
      message.success(`Feed refreshed — ${res.data.count} products`);
    } catch {
      message.error("Feed refresh failed. Check FEED_REFRESH_SECRET.");
    } finally {
      setFeedRefreshing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Copied!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-4">
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
            <Form.Item className="flex-1" label="CGST (%)" name="cgst"
              rules={[{ validator: (_, v) => (v === "" || v === null || v === undefined) ? Promise.reject("Enter CGST") : isNaN(Number(v)) || Number(v) < 0 ? Promise.reject("Invalid") : Promise.resolve() }]}>
              <Input type="number" min={0} step={0.01} placeholder="e.g. 2.5" prefix={<FaPercentage className="text-gray-400" />} />
            </Form.Item>
            <Form.Item className="flex-1" label="SGST (%)" name="sgst"
              rules={[{ validator: (_, v) => (v === "" || v === null || v === undefined) ? Promise.reject("Enter SGST") : isNaN(Number(v)) || Number(v) < 0 ? Promise.reject("Invalid") : Promise.resolve() }]}>
              <Input type="number" min={0} step={0.01} placeholder="e.g. 2.5" prefix={<FaPercentage className="text-gray-400" />} />
            </Form.Item>
            <Form.Item className="flex-1" label="IGST (%)" name="igst"
              rules={[{ validator: (_, v) => (v === "" || v === null || v === undefined) ? Promise.reject("Enter IGST") : isNaN(Number(v)) || Number(v) < 0 ? Promise.reject("Invalid") : Promise.resolve() }]}>
              <Input type="number" min={0} step={0.01} placeholder="e.g. 5" prefix={<FaPercentage className="text-gray-400" />} />
            </Form.Item>
          </div>

          {/* Store State */}
          <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
            <p className="font-medium text-gray-800 mb-1">Store Location (State)</p>
            <p className="text-xs text-gray-500 mb-3">
              Orders from <strong>{storeState}</strong> → CGST + SGST applied. Orders from other states → IGST applied.
            </p>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
              value={storeState}
              onChange={(e) => setStoreState(e.target.value)}
            >
              {["Gujarat","Maharashtra","Delhi","Karnataka","Tamil Nadu","Rajasthan","Uttar Pradesh","West Bengal","Telangana","Punjab","Madhya Pradesh","Bihar","Haryana","Odisha","Kerala"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Tax mode toggle */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">Tax Mode</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {taxIncluded
                    ? "Prices INCLUDE tax — tax is extracted from the price"
                    : "Prices EXCLUDE tax — tax is added on top of the price"}
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
              </div>
              <div className={`p-3 rounded-lg border-2 ${taxIncluded ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                <p className="font-semibold text-gray-700 mb-1">🏷️ Tax Included</p>
                <p className="text-gray-500">Product: ₹1180 (incl. tax)</p>
                <p className="text-gray-500">CGST 9% extracted: ₹90</p>
                <p className="text-gray-500">SGST 9% extracted: ₹90</p>
                <p className="font-bold text-indigo-600">Base: ₹1000 | Total: ₹1180</p>
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
          <Form.Item label="Store Email" name="storeEmail">
            <Input type="email" prefix={<FaEnvelope className="text-gray-400" />} placeholder="e.g. info@yashodafashion.com" />
          </Form.Item>
          <Form.Item label="Store Tagline" name="storeTagline">
            <Input prefix={<FaQuoteRight className="text-gray-400" />} />
          </Form.Item>
          <Form.Item label="Store Address" name="storeAddress">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            label="Shipping Charge (₹)"
            name="shippingCharge"
            rules={[{ validator: (_, v) => (v === "" || v === null || v === undefined) ? Promise.reject("Enter shipping charge") : isNaN(Number(v)) || Number(v) < 0 ? Promise.reject("Must be ≥ 0") : Promise.resolve() }]}
            extra="Set to 0 for free shipping. This charge is shown to customers at checkout."
          >
            <Input type="number" min={0} step={1} placeholder="e.g. 100" prefix={<FaTruck className="text-gray-400" />} />
          </Form.Item>

          {/* OTP Signup Toggle */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">OTP Verification on Signup</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {requireOtpForSignup
                    ? "Customers must verify mobile via OTP before registering"
                    : "Customers can register without OTP verification"}
                </p>
              </div>
              <Switch
                checked={requireOtpForSignup}
                onChange={setRequireOtpForSignup}
                checkedChildren="OTP ON"
                unCheckedChildren="OTP OFF"
              />
            </div>
          </div>
        </Card>

        {/* ── Payment ── */}
        <Card className="mb-6 shadow-sm" title={<span className="flex items-center gap-2"><FaMagic className="text-indigo-600" /> Payment Preferences</span>}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Online Payment Account</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "CURRENT_ACCOUNT", label: "Current Account", desc: "Primary business account" },
                { value: "OTHER_ACCOUNT",   label: "Saving Account",  desc: "Secondary savings account" },
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => setOnlinePaymentDestination(opt.value)}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    onlinePaymentDestination === opt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className={`font-semibold text-sm ${
                    onlinePaymentDestination === opt.value ? "text-indigo-700" : "text-gray-700"
                  }`}>{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Choose where new online payments are recorded in reports.
            </p>
          </div>

          {/* UPI IDs for QR code */}
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="font-medium text-gray-800 mb-1">📱 UPI Payment QR Codes</p>
            <p className="text-xs text-gray-500 mb-4">
              These UPI IDs are used to generate QR codes on POS bills. Customers scan to pay — amount is auto-filled.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item label="Account A UPI ID (Current)" name="upiIdA" className="mb-0">
                <Input placeholder="e.g. yourname@upi or 9876543210@paytm" />
              </Form.Item>
              <Form.Item label="Account B UPI ID (Saving)" name="upiIdB" className="mb-0">
                <Input placeholder="e.g. yourname@ybl or 9876543210@gpay" />
              </Form.Item>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button size="large" onClick={fetchSettings}>Reset</Button>
          <Button type="primary" size="large" htmlType="submit" loading={saving} icon={<FaSave />}>
            Save Settings
          </Button>
        </div>
      </Form>

      {/* ── Google Merchant Feed ── */}
      <Card
        className="mt-6 shadow-sm"
        title={<span className="flex items-center gap-2"><FaRss className="text-orange-500" /> Google Merchant Center Feed</span>}
      >
        <p className="text-sm text-gray-500 mb-4">
          Feed is auto-regenerated daily at <strong>2:00 AM IST</strong>. Use the button below to force-refresh immediately after adding/updating products.
        </p>

        {/* Feed URLs */}
        <div className="space-y-3 mb-5">
          {[
            { label: "XML Feed (paste in Merchant Center)", url: FEED_XML_URL, highlight: true },
            { label: "JSON Feed", url: FEED_JSON_URL, highlight: false },
          ].map(({ label, url, highlight }) => (
            <div key={url} className={`flex items-center gap-2 p-3 rounded-lg border ${
              highlight ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"
            }`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-mono text-gray-800 truncate">{url}</p>
              </div>
              <Button
                size="small"
                icon={<FaCopy />}
                onClick={() => copyToClipboard(url)}
                title="Copy URL"
              />
              <Button
                size="small"
                icon={<FaExternalLinkAlt />}
                onClick={() => window.open(url, "_blank")}
                title="Open in new tab"
              />
            </div>
          ))}
        </div>

        {/* Last built info */}
        {feedInfo && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            ✅ Last refreshed: <strong>{new Date(feedInfo.builtAt).toLocaleString("en-IN")}</strong>
            &nbsp;·&nbsp; <strong>{feedInfo.count}</strong> products in feed
          </div>
        )}

        <Button
          type="primary"
          icon={<FaSyncAlt className={feedRefreshing ? "animate-spin" : ""} />}
          loading={feedRefreshing}
          onClick={refreshFeed}
          className="bg-orange-500 hover:bg-orange-600 border-orange-500"
        >
          Refresh Feed Now
        </Button>

        <p className="text-xs text-gray-400 mt-3">
          Tip: In Google Merchant Center → Products → Feeds → Add feed → Scheduled fetch → paste the XML URL above.
        </p>
      </Card>
    </div>
  );
};

export default Settings;
