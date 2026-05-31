import React, { useEffect, useState, useRef } from "react";
import { Form, Input, Switch, Button, Card, message, Spin } from "antd";
import {
  FaBuilding, FaEnvelope, FaStore, FaPhone,
  FaMagic, FaSave, FaQuoteRight, FaPercentage, FaTruck,
  FaRss, FaSyncAlt, FaExternalLinkAlt, FaCopy, FaLock, FaUnlockAlt,
  FaShieldAlt,
} from "react-icons/fa";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const BACKEND_ROOT  = (process.env.REACT_APP_API_URL || "").replace(/\/api\/?$/, "");
const FEED_XML_URL  = `${BACKEND_ROOT}/feed.xml`;
const FEED_JSON_URL = `${BACKEND_ROOT}/feed.json`;

const LOCK_SECTIONS = [
  { key: "lockCustomers", label: "Customers",       desc: "Protect the Customers section" },
  { key: "lockOrders",    label: "Orders",           desc: "Protect the Orders section" },
  { key: "lockCatalog",   label: "Catalog",          desc: "Protect Products, Brands, Categories, etc." },
  { key: "lockAnalytics", label: "Analytics",        desc: "Protect Reports & Analytics" },
  { key: "lockRewards",   label: "Rewards",          desc: "Protect Spin, Referral & Coins" },
  { key: "lockMarketing", label: "Marketing",        desc: "Protect Coupons, Offers & Blogs" },
  { key: "lockPurchase",  label: "Purchase",         desc: "Protect Purchase & Vendors" },
  { key: "lockRojmel",    label: "Rojmel",           desc: "Protect Rojmel section" },
  { key: "lockUdhar",     label: "Udhar",            desc: "Protect Udhar section" },
  { key: "lockReviews",   label: "Reviews",          desc: "Protect Reviews section" },
  { key: "lockEnquiries", label: "Enquiries",        desc: "Protect Enquiries & Product Inquiries" },
  { key: "lockSettings",  label: "Settings Page",    desc: "Require password every time Settings is opened" },
];

const LOCK_DEFAULTS = Object.fromEntries(LOCK_SECTIONS.map(s => [s.key, false]));

// ─── Password Gate ────────────────────────────────────────────────────────────
const PasswordGate = ({ onUnlock }) => {
  const [input, setInput]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) { setError("Enter password"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${base_url}user/verify-pos-lock`, { password: input }, config);
      onUnlock();
    } catch {
      setError("Wrong password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaLock className="text-3xl text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Settings Protected</h2>
          <p className="text-sm text-gray-500 mt-1">Enter owner password to access Settings</p>
        </div>
        <input
          type="password"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg focus:border-indigo-500 outline-none transition-all"
          placeholder="Enter password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          autoFocus
        />
        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {loading
            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            : <><FaUnlockAlt /> Unlock Settings</>}
        </button>
      </div>
    </div>
  );
};

// ─── Main Settings Component ──────────────────────────────────────────────────
const Settings = () => {
  const [pageLoading, setPageLoading]       = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [feedInfo, setFeedInfo]             = useState(null);
  const [form] = Form.useForm();

  // Gate: null = not yet checked, false = no gate needed, true = gate needed
  const [gateRequired, setGateRequired] = useState(null);
  const [gateUnlocked, setGateUnlocked] = useState(false);

  // Form state
  const [taxIncluded, setTaxIncluded]                           = useState(false);
  const [storeState, setStoreState]                             = useState("Gujarat");
  const [onlinePaymentDestination, setOnlinePaymentDestination] = useState("CURRENT_ACCOUNT");
  const [requireOtpForSignup, setRequireOtpForSignup]           = useState(false);

  // Lock state
  const [locks, setLocks]           = useState(LOCK_DEFAULTS);
  const [passwordSet, setPasswordSet] = useState(false);
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Prevent double-fetch: store settings data from gate check
  const cachedSettings = useRef(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${base_url}user/settings`, config);
        const data = res.data;
        if (data.lockSettings && data.posLockPasswordSet) {
          // Gate needed — cache data for after unlock
          cachedSettings.current = data;
          setGateRequired(true);
          setPageLoading(false);
        } else {
          // No gate — load immediately
          applySettings(data);
          setGateRequired(false);
        }
      } catch {
        message.error("Failed to load settings");
        setGateRequired(false);
        setPageLoading(false);
      }
    };
    init();
  }, []);

  // After gate is unlocked, apply cached settings (no second fetch needed)
  useEffect(() => {
    if (gateUnlocked && cachedSettings.current) {
      applySettings(cachedSettings.current);
      cachedSettings.current = null;
    }
  }, [gateUnlocked]);

  const applySettings = (data) => {
    form.setFieldsValue({
      gstin:          data.gstin          || "",
      email:          data.email          || "",
      cgst:           data.cgst           || 0,
      sgst:           data.sgst           || 0,
      igst:           data.igst           || 0,
      storeName:      data.storeName      || "Yashoda Fashion",
      storeTagline:   data.storeTagline   || "Your One-Stop Shopping Destination",
      storeAddress:   data.storeAddress   || "",
      storePhone:     data.storePhone     || "",
      storeEmail:     data.storeEmail     || "",
      shippingCharge: data.shippingCharge ?? 100,
      upiIdA:         data.upiIdA         || "",
      upiIdB:         data.upiIdB         || "",
    });
    setTaxIncluded(data.taxIncluded === true);
    setStoreState(data.storeState || "Gujarat");
    setOnlinePaymentDestination(data.onlinePaymentDestination || "CURRENT_ACCOUNT");
    setRequireOtpForSignup(data.requireOtpForSignup === true);
    setLocks(Object.fromEntries(LOCK_SECTIONS.map(s => [s.key, !!data[s.key]])));
    setPasswordSet(!!data.posLockPasswordSet);
    setPageLoading(false);
  };

  const refetchSettings = async () => {
    try {
      setPageLoading(true);
      const res = await axios.get(`${base_url}user/settings`, config);
      applySettings(res.data);
    } catch {
      message.error("Failed to load settings");
      setPageLoading(false);
    }
  };

  const onFinish = async (values) => {
    if (newPassword && newPassword !== confirmPassword) {
      message.error("Passwords do not match!");
      return;
    }
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
        ...locks,
        ...(newPassword && { posLockPassword: newPassword }),
      };
      await axios.put(`${base_url}user/settings`, payload, config);
      if (values.gstin !== undefined) {
        await axios.put(`${base_url}user/gstin`, { gstin: values.gstin }, config);
      }
      if (newPassword) setPasswordSet(true);
      setNewPassword("");
      setConfirmPassword("");
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

  // ── Gate screen ──
  if (gateRequired === true && !gateUnlocked) {
    return <PasswordGate onUnlock={() => setGateUnlocked(true)} />;
  }

  // ── Loading spinner ──
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  const pwMatch = newPassword && newPassword === confirmPassword;
  const pwMismatch = newPassword && newPassword !== confirmPassword;

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

          <div className="flex gap-4">
            {["cgst", "sgst", "igst"].map(field => (
              <Form.Item key={field} className="flex-1" label={`${field.toUpperCase()} (%)`} name={field}
                rules={[{ validator: (_, v) => (v === "" || v == null) ? Promise.reject(`Enter ${field.toUpperCase()}`) : isNaN(Number(v)) || Number(v) < 0 ? Promise.reject("Invalid") : Promise.resolve() }]}>
                <Input type="number" min={0} step={0.01} placeholder="e.g. 2.5" prefix={<FaPercentage className="text-gray-400" />} />
              </Form.Item>
            ))}
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-200 mb-4">
            <p className="font-medium text-gray-800 mb-1">Store Location (State)</p>
            <p className="text-xs text-gray-500 mb-3">
              Orders from <strong>{storeState}</strong> → CGST + SGST applied. Other states → IGST applied.
            </p>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
              value={storeState}
              onChange={e => setStoreState(e.target.value)}
            >
              {["Gujarat","Maharashtra","Delhi","Karnataka","Tamil Nadu","Rajasthan","Uttar Pradesh","West Bengal","Telangana","Punjab","Madhya Pradesh","Bihar","Haryana","Odisha","Kerala"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-gray-800">Tax Mode</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {taxIncluded ? "Prices INCLUDE tax — tax is extracted from the price" : "Prices EXCLUDE tax — tax is added on top of the price"}
                </p>
              </div>
              <Switch checked={taxIncluded} onChange={setTaxIncluded} checkedChildren="Tax Included" unCheckedChildren="Tax Excluded" />
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
            rules={[{ validator: (_, v) => (v === "" || v == null) ? Promise.reject("Enter shipping charge") : isNaN(Number(v)) || Number(v) < 0 ? Promise.reject("Must be ≥ 0") : Promise.resolve() }]}
            extra="Set to 0 for free shipping."
          >
            <Input type="number" min={0} step={1} placeholder="e.g. 100" prefix={<FaTruck className="text-gray-400" />} />
          </Form.Item>

          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">OTP Verification on Signup</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {requireOtpForSignup ? "Customers must verify mobile via OTP before registering" : "Customers can register without OTP verification"}
                </p>
              </div>
              <Switch checked={requireOtpForSignup} onChange={setRequireOtpForSignup} checkedChildren="OTP ON" unCheckedChildren="OTP OFF" />
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
                    onlinePaymentDestination === opt.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <p className={`font-semibold text-sm ${onlinePaymentDestination === opt.value ? "text-indigo-700" : "text-gray-700"}`}>{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="font-medium text-gray-800 mb-1">📱 UPI Payment QR Codes</p>
            <p className="text-xs text-gray-500 mb-4">Used to generate QR codes on POS bills. Amount is auto-filled.</p>
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

        {/* ── Lock Management ── */}
        <Card
          className="mb-6 shadow-sm"
          title={<span className="flex items-center gap-2"><FaShieldAlt className="text-indigo-600" /> Lock Management</span>}
        >
          <p className="text-sm font-medium text-gray-700 mb-3">Choose which areas to protect with a password:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {LOCK_SECTIONS.map(sec => (
              <div
                key={sec.key}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  locks[sec.key] ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${locks[sec.key] ? "bg-indigo-600" : "bg-gray-300"}`}>
                    <FaLock className="text-white text-xs" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{sec.label}</p>
                    <p className="text-xs text-gray-500 leading-tight">{sec.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={locks[sec.key]}
                  onChange={v => setLocks(prev => ({ ...prev, [sec.key]: v }))}
                  checkedChildren="Locked"
                  unCheckedChildren="Open"
                />
              </div>
            ))}
          </div>

          {/* Password setup */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="font-medium text-gray-800 mb-1 flex items-center gap-2">
              <FaLock className="text-indigo-500" />
              {passwordSet ? "Change Lock Password" : "Set Lock Password"}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              {passwordSet
                ? "Leave blank to keep existing password. Fill both fields to change it."
                : "Set a password to activate the locks above."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                <Input.Password
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  size="large"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                <Input.Password
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  size="large"
                />
              </div>
            </div>
            {pwMismatch && <p className="text-red-500 text-xs mt-2">❌ Passwords do not match</p>}
            {pwMatch    && <p className="text-green-600 text-xs mt-2">✅ Passwords match — will be saved on Save Settings</p>}
          </div>

          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>How it works:</strong> Toggle ON the areas you want to protect. Set a password and save.
              Staff will see a password screen when they try to open locked areas.
            </p>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button size="large" onClick={refetchSettings}>Reset</Button>
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

        <div className="space-y-3 mb-5">
          {[
            { label: "XML Feed (paste in Merchant Center)", url: FEED_XML_URL, highlight: true },
            { label: "JSON Feed", url: FEED_JSON_URL, highlight: false },
          ].map(({ label, url, highlight }) => (
            <div key={url} className={`flex items-center gap-2 p-3 rounded-lg border ${highlight ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-sm font-mono text-gray-800 truncate">{url}</p>
              </div>
              <Button size="small" icon={<FaCopy />} onClick={() => copyToClipboard(url)} title="Copy URL" />
              <Button size="small" icon={<FaExternalLinkAlt />} onClick={() => window.open(url, "_blank")} title="Open in new tab" />
            </div>
          ))}
        </div>

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
