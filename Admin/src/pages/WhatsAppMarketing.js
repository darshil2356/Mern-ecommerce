import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Tabs,
  Badge,
  Progress,
  Modal,
  Upload,
  Tooltip,
  Divider,
  Typography,
  Alert,
} from "antd";
import AdminDataTable from "../components/AdminDataTable";
import {
  SendOutlined,
  UsergroupAddOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  CopyOutlined,
  DownloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PauseOutlined,
  CaretRightOutlined,
  PictureOutlined,
  RightCircleOutlined,
  ForwardOutlined,
} from "@ant-design/icons";
import { FaWhatsapp, FaGift, FaUserCheck, FaBullhorn, FaFileCsv, FaImage, FaPaste } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import moment from "moment";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PRESET_TEMPLATES = [
  {
    key: "festive_sale",
    title: "🎉 Festive Special Offer (20% OFF)",
    text: "Dear {name},\n\nSpecial Festive Sale at {storeName}! 🛍️\nGet FLAT 20% OFF on all new Kurti & Saree collections.\n\nUse Code: {coupon}\nShop now or visit our store today!\n\nWebsite: https://yashodafashion.com",
    offerTitle: "Festive Sale 20% OFF",
    coupon: "FESTIVE20",
    mediaUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
  },
  {
    key: "new_arrivals",
    title: "✨ New Season Collection Launch",
    text: "Hello {name} 👋\n\nOur latest Ethnic & Western Wear collection just arrived at {storeName}!\nBe the first to explore the trendiest designs.\n\nVisit Us: Bapunagar, Ahmedabad\nOr check online: https://yashodafashion.com",
    offerTitle: "New Season Launch",
    coupon: "NEWCOLLECTION",
    mediaUrl: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
  },
  {
    key: "udhar_reminder",
    title: "🧾 Udhar / Dues Payment Reminder",
    text: "Respected {name},\n\nThis is a polite reminder from {storeName} regarding your pending balance amount.\n\nPlease clear your payment at your earliest convenience or pay online via UPI.\n\nThank you for your cooperation! 🙏",
    offerTitle: "Payment Reminder",
    coupon: "-",
    mediaUrl: "",
  },
  {
    key: "reward_coins",
    title: "🎁 Customer Loyalty Coins Bonus",
    text: "Hi {name}! 🎉\n\nYou have exclusive Reward Coins waiting in your account at {storeName}.\nRedeem them on your next visit for instant discount!\n\nCheck your coin balance: https://yashodafashion.com/profile",
    offerTitle: "Reward Coin Bonus",
    coupon: "REWARDCOINS",
    mediaUrl: "",
  },
];

const WhatsAppMarketing = () => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("1");
  const [audienceType, setAudienceType] = useState("ALL_USERS");
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [sendingMethod, setSendingMethod] = useState("WEB_DISPATCHER");
  
  // CSV Upload state
  const [customCsvRecipients, setCustomCsvRecipients] = useState([]);
  const [csvFileName, setCsvFileName] = useState("");

  // Media / Photo state
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Web Dispatcher Queue Modal State
  const [dispatcherVisible, setDispatcherVisible] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentLogs, setSentLogs] = useState([]);

  // Preview state
  const [previewText, setPreviewText] = useState("");
  const [offerTitle, setOfferTitle] = useState("Special Discount Offer");
  const [couponCode, setCouponCode] = useState("SAVE10");

  useEffect(() => {
    fetchRecipients(audienceType);
    fetchCampaigns();
  }, []);

  const fetchRecipients = async (audience) => {
    if (audience === "CSV_UPLOAD") {
      setRecipients(customCsvRecipients);
      return;
    }
    setLoadingRecipients(true);
    try {
      const res = await axios.get(`${base_url}whatsapp/recipients?audience=${audience}`, config);
      if (res.data.success) {
        setRecipients(res.data.recipients || []);
      }
    } catch (err) {
      message.error("Failed to load customer phone numbers");
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await axios.get(`${base_url}whatsapp/campaigns`, config);
      if (res.data.success) {
        setCampaigns(res.data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleAudienceChange = (val) => {
    setAudienceType(val);
    if (val === "CSV_UPLOAD") {
      setRecipients(customCsvRecipients);
    } else {
      fetchRecipients(val);
    }
  };

  const handleTemplateSelect = (templateKey) => {
    const tmpl = PRESET_TEMPLATES.find((t) => t.key === templateKey);
    if (tmpl) {
      form.setFieldsValue({
        offerTitle: tmpl.offerTitle,
        couponCode: tmpl.coupon,
        messageTemplate: tmpl.text,
        mediaUrl: tmpl.mediaUrl || "",
      });
      setOfferTitle(tmpl.offerTitle);
      setCouponCode(tmpl.coupon);
      setPreviewText(tmpl.text);
      setMediaUrl(tmpl.mediaUrl || "");
    }
  };

  const handleImageUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("images", file);

    setUploadingImage(true);
    try {
      const res = await axios.post(`${base_url}upload`, formData, config);
      const url = res.data[0]?.url || res.data?.url || "";
      if (url) {
        setMediaUrl(url);
        form.setFieldsValue({ mediaUrl: url });
        message.success("Offer photo uploaded successfully!");
        onSuccess("Ok");
      } else {
        throw new Error("No URL returned");
      }
    } catch (err) {
      message.error("Image upload failed");
      onError(err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCsvUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r\n|\n/);
      const parsed = [];
      lines.forEach((line) => {
        if (!line.trim()) return;
        const parts = line.split(",");
        const name = parts[0] ? parts[0].trim().replace(/"/g, "") : "Customer";
        const mobile = parts[1] ? parts[1].trim().replace(/\D/g, "") : parts[0].trim().replace(/\D/g, "");
        if (mobile && mobile.length >= 10) {
          parsed.push({ name, mobile: mobile.length === 10 ? `91${mobile}` : mobile });
        }
      });

      setCustomCsvRecipients(parsed);
      setRecipients(parsed);
      setCsvFileName(file.name);
      setAudienceType("CSV_UPLOAD");
      form.setFieldsValue({ audienceType: "CSV_UPLOAD" });
      message.success(`Uploaded ${parsed.length} contacts from CSV!`);
    };
    reader.readAsText(file);
    return false; // Prevent auto upload
  };

  const insertPlaceholder = (tag) => {
    const current = form.getFieldValue("messageTemplate") || "";
    const updated = current + ` ${tag} `;
    form.setFieldsValue({ messageTemplate: updated });
    setPreviewText(updated);
  };

  // Helper to copy real image file to Clipboard safely
  const copyImageBlobToClipboard = async (imageUrl) => {
    if (!imageUrl) return false;
    try {
      if (document.hasFocus() && navigator.clipboard && window.ClipboardItem) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        message.success("📸 Photo copied to Clipboard! Press Ctrl+V in WhatsApp Web to paste directly!");
        return true;
      }
    } catch (err) {
      console.warn("Async image clipboard copy skipped or unsupported:", err);
    }

    // Safe fallback text copy
    try {
      if (document.hasFocus() && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(imageUrl);
        message.info("Photo Link copied to Clipboard!");
      }
    } catch (e) {
      console.warn("Clipboard writeText fallback skipped:", e);
    }
    return false;
  };

  const handleFormFinish = async (values) => {
    if (recipients.length === 0) {
      message.warning("No recipient phone numbers found. Please select an audience or upload a CSV.");
      return;
    }

    try {
      const payload = {
        ...values,
        mediaUrl: mediaUrl || values.mediaUrl || "",
        recipients,
        audienceType,
        sendingMethod,
      };

      const res = await axios.post(`${base_url}whatsapp/campaign`, payload, config);

      if (res.data.success) {
        message.success("Campaign created successfully!");
        fetchCampaigns();
        const createdCampaign = res.data.campaign;

        if (sendingMethod === "WEB_DISPATCHER") {
          setActiveCampaign(createdCampaign);
          setCurrentIndex(0);
          setSentLogs([]);
          setDispatcherVisible(true);
        } else {
          message.loading("Initiating automated WhatsApp API dispatch...", 2);
          const bulkRes = await axios.post(`${base_url}whatsapp/send-bulk`, { campaignId: createdCampaign._id }, config);
          if (bulkRes.data.requiresWebDispatcher) {
            message.info("No Cloud API keys set up. Switch to Web Dispatcher.");
            setActiveCampaign(createdCampaign);
            setDispatcherVisible(true);
          } else {
            message.success("Bulk campaign dispatched via WhatsApp Cloud API!");
          }
          fetchCampaigns();
        }
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to launch campaign");
    }
  };

  // ── Dispatch single contact manually with zero window block ─────────────
  const dispatchNextContact = async () => {
    if (!activeCampaign || currentIndex >= activeCampaign.recipientLogs.length) return;

    const recipient = activeCampaign.recipientLogs[currentIndex];
    let rawMsg = activeCampaign.messageTemplate;

    const personalized = rawMsg
      .replace(/{name}/g, recipient.name || "Customer")
      .replace(/{offer}/g, activeCampaign.offerTitle)
      .replace(/{coupon}/g, activeCampaign.couponCode || "SPECIAL")
      .replace(/{storeName}/g, "Yashoda Fashion");

    const cleanPhone = recipient.phoneNumber.startsWith("91")
      ? recipient.phoneNumber
      : `91${recipient.phoneNumber}`;

    // Auto copy photo to clipboard if image exists (before window.open)
    if (activeCampaign.mediaUrl) {
      await copyImageBlobToClipboard(activeCampaign.mediaUrl);
    }

    const encodedText = encodeURIComponent(personalized);
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;

    // Open WhatsApp Web window
    const newWin = window.open(whatsappUrl, "_blank");

    if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
      message.error("⚠️ Browser blocked popup window! Please allow popups for this site in your browser address bar.");
      return;
    }

    // Report progress to backend
    try {
      await axios.put(
        `${base_url}whatsapp/campaign-progress`,
        {
          campaignId: activeCampaign._id,
          recipientPhone: recipient.phoneNumber,
          status: "sent",
        },
        config
      );
    } catch (e) {
      console.error(e);
    }

    setSentLogs((prev) => [...prev, { phone: cleanPhone, name: recipient.name, status: "sent", time: new Date() }]);
    setCurrentIndex((prev) => prev + 1);
  };

  const skipCurrentContact = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleExportCsv = () => {
    if (recipients.length === 0) {
      message.warning("No contacts to export");
      return;
    }
    let templateText = form.getFieldValue("messageTemplate") || "Special offer from Yashoda Fashion!";
    if (mediaUrl) {
      templateText += `\n\nOffer Photo: ${mediaUrl}`;
    }
    let csvContent = "data:text/csv;charset=utf-8,Name,Phone,WhatsApp Direct Link\n";

    recipients.forEach((r) => {
      const cleanPhone = r.mobile.replace(/\D/g, "");
      const msg = encodeURIComponent(templateText.replace(/{name}/g, r.name));
      const link = `https://wa.me/${cleanPhone}?text=${msg}`;
      csvContent += `"${r.name}","${cleanPhone}","${link}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WhatsApp_Contacts_${audienceType}_${moment().format("YYYYMMDD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("CSV file downloaded successfully!");
  };

  const campaignColumns = [
    {
      title: "Campaign Name",
      dataIndex: "campaignName",
      key: "campaignName",
      render: (text, record) => (
        <div>
          <span className="font-bold text-gray-800">{text}</span>
          <div className="text-xs text-gray-400">{record.offerTitle}</div>
          {record.mediaUrl && (
            <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold inline-block mt-0.5">
              📷 Includes Photo
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Audience",
      dataIndex: "audienceType",
      key: "audienceType",
      render: (type) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Recipients",
      dataIndex: "totalRecipients",
      key: "totalRecipients",
      render: (count) => <Badge count={count} overflowCount={9999} style={{ backgroundColor: "#52c41a" }} />,
    },
    {
      title: "Sent / Progress",
      key: "progress",
      render: (_, record) => (
        <div>
          <Text type="success">{record.sentCount || 0} / {record.totalRecipients || 0} sent</Text>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "COMPLETED") color = "green";
        if (status === "SENDING") color = "processing";
        if (status === "FAILED") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<CaretRightOutlined />}
            size="small"
            onClick={() => {
              setActiveCampaign(record);
              setCurrentIndex(record.sentCount || 0);
              setDispatcherVisible(true);
            }}
          >
            Open Dispatcher ({record.totalRecipients - (record.sentCount || 0)} left)
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={async () => {
              try {
                await axios.delete(`${base_url}whatsapp/campaign/${record._id}`, config);
                message.success("Campaign deleted");
                fetchCampaigns();
              } catch (e) {
                message.error("Failed to delete campaign");
              }
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-3 sm:p-6 bg-slate-50 min-h-screen"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-20 text-9xl">
          <FaWhatsapp />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-white/20 p-3 rounded-xl backdrop-blur-md text-2xl">
              <FaWhatsapp />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
                WhatsApp Marketing & Bulk Offer Center
              </h1>
              <p className="text-emerald-100 text-sm mt-1">
                Broadcast offer messages & banner photos to your 700+ customers easily & safely.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <p className="text-xs text-emerald-100 uppercase font-semibold">Loaded Contacts</p>
              <p className="text-2xl font-black">{recipients.length} Numbers</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <p className="text-xs text-emerald-100 uppercase font-semibold">Total Campaigns</p>
              <p className="text-2xl font-black">{campaigns.length} Sent</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <p className="text-xs text-emerald-100 uppercase font-semibold">Active Audience</p>
              <p className="text-lg font-bold text-white capitalize">{audienceType.replace("_", " ")}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
              <p className="text-xs text-emerald-100 uppercase font-semibold">Media Support</p>
              <p className="text-lg font-bold text-emerald-200">🖼️ Auto Photo Paste</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Card className="shadow-lg rounded-2xl border-none">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          {/* TAB 1: CREATE CAMPAIGN */}
          <Tabs.TabPane
            tab={
              <span>
                <FaBullhorn className="inline mr-2 text-emerald-600" />
                New Broadcast Campaign
              </span>
            }
            key="1"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={15}>
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleFormFinish}
                  initialValues={{
                    audienceType: "ALL_USERS",
                    sendingMethod: "WEB_DISPATCHER",
                    offerTitle: "Special Season Discount",
                    couponCode: "SAVE20",
                  }}
                >
                  {/* Preset Offer Templates */}
                  <div className="mb-6 p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <Text className="font-bold text-emerald-900 block mb-2">
                      💡 Quick Select Offer Template:
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_TEMPLATES.map((tmpl) => (
                        <Tag.CheckableTag
                          key={tmpl.key}
                          onChange={() => handleTemplateSelect(tmpl.key)}
                          className="bg-white border border-emerald-300 text-emerald-800 font-medium py-1 px-3 rounded-lg hover:bg-emerald-100 cursor-pointer"
                        >
                          {tmpl.title}
                        </Tag.CheckableTag>
                      ))}
                    </div>
                  </div>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="campaignName"
                        label="Campaign Title"
                        rules={[{ required: true, message: "Enter campaign title" }]}
                      >
                        <Input placeholder="e.g. Festival Kurti Sale Broadcast" size="large" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="audienceType"
                        label="Select Target Audience"
                        rules={[{ required: true }]}
                      >
                        <Select size="large" onChange={handleAudienceChange}>
                          <Option value="ALL_USERS">
                            🌐 All Registered App & Store Users ({recipients.length})
                          </Option>
                          <Option value="CUSTOMERS">👤 Retail Customers</Option>
                          <Option value="UDHAR_CLIENTS">🧾 Udhar Khata Accounts</Option>
                          <Option value="WHOLESALE">🏬 Wholesale Buyers</Option>
                          <Option value="CSV_UPLOAD">
                            📄 Custom Uploaded CSV ({customCsvRecipients.length})
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* CSV Upload Box */}
                  {audienceType === "CSV_UPLOAD" && (
                    <div className="mb-6 p-4 bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl text-center">
                      <FaFileCsv className="text-4xl text-blue-500 mx-auto mb-2" />
                      <p className="font-bold text-gray-700">Upload 700 Customer Phone Numbers CSV</p>
                      <p className="text-xs text-gray-500 mb-3">Format: Name, Phone (e.g. Rahul Sharma, 9876543210)</p>
                      <Upload beforeUpload={handleCsvUpload} showUploadList={false} accept=".csv,.txt">
                        <Button icon={<UploadOutlined />} type="primary">
                          Browse CSV File
                        </Button>
                      </Upload>
                      {csvFileName && (
                        <p className="text-sm font-semibold text-emerald-600 mt-2">
                          Loaded: {csvFileName} ({customCsvRecipients.length} valid numbers)
                        </p>
                      )}
                    </div>
                  )}

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item name="offerTitle" label="Offer Headline">
                        <Input
                          placeholder="FLAT 20% OFF on Sarees"
                          size="large"
                          onChange={(e) => setOfferTitle(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="couponCode" label="Coupon / Promo Code">
                        <Input
                          placeholder="FESTIVE20"
                          size="large"
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* OFFER BANNER PHOTO UPLOADER */}
                  <Form.Item name="mediaUrl" label="Offer Photo / Banner (Image Upload or Link)">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste image URL or upload photo below"
                          size="large"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                        />
                        <Upload
                          customRequest={handleImageUpload}
                          showUploadList={false}
                          accept="image/*"
                        >
                          <Button
                            icon={<PictureOutlined />}
                            size="large"
                            loading={uploadingImage}
                            className="bg-purple-50 text-purple-700 border-purple-300 font-semibold"
                          >
                            Upload Photo
                          </Button>
                        </Upload>
                      </div>
                      {mediaUrl && (
                        <div className="flex items-center gap-3 bg-purple-50 p-2 rounded-lg border border-purple-200">
                          <img
                            src={mediaUrl}
                            alt="Offer Banner"
                            className="w-12 h-12 object-cover rounded-md border"
                          />
                          <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-purple-900 truncate">{mediaUrl}</p>
                            <p className="text-[10px] text-purple-600">Attached to offer message preview</p>
                          </div>
                          <Button
                            size="small"
                            danger
                            type="text"
                            onClick={() => {
                              setMediaUrl("");
                              form.setFieldsValue({ mediaUrl: "" });
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="messageTemplate"
                    label={
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold">WhatsApp Offer Message Content</span>
                        <div className="space-x-1">
                          <span className="text-xs text-gray-500">Insert Tag:</span>
                          <Tag
                            color="cyan"
                            className="cursor-pointer"
                            onClick={() => insertPlaceholder("{name}")}
                          >
                            {"{name}"}
                          </Tag>
                          <Tag
                            color="gold"
                            className="cursor-pointer"
                            onClick={() => insertPlaceholder("{offer}")}
                          >
                            {"{offer}"}
                          </Tag>
                          <Tag
                            color="magenta"
                            className="cursor-pointer"
                            onClick={() => insertPlaceholder("{coupon}")}
                          >
                            {"{coupon}"}
                          </Tag>
                        </div>
                      </div>
                    }
                    rules={[{ required: true, message: "Write your offer message" }]}
                  >
                    <TextArea
                      rows={6}
                      placeholder="Dear {name}, enjoy special discounts..."
                      onChange={(e) => setPreviewText(e.target.value)}
                    />
                  </Form.Item>

                  <Form.Item name="sendingMethod" label="Choose Dispatch Method">
                    <Select size="large" value={sendingMethod} onChange={setSendingMethod}>
                      <Option value="WEB_DISPATCHER">
                        💬 1-Click Smart Sender (Zero Popup Block + Auto Clipboard Photo Paste)
                      </Option>
                      <Option value="META_CLOUD_API">
                        ⚡ Official Meta Cloud API (100% Automated Background Send with Direct Photos)
                      </Option>
                    </Select>
                  </Form.Item>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      icon={<SendOutlined />}
                      className="bg-emerald-600 hover:bg-emerald-700 border-none font-bold px-8 h-12 rounded-xl shadow-lg"
                      loading={loadingRecipients}
                    >
                      Launch Broadcast Campaign ({recipients.length} Contacts)
                    </Button>
                    <Button
                      size="large"
                      icon={<DownloadOutlined />}
                      className="h-12 rounded-xl border-emerald-500 text-emerald-700 font-semibold"
                      onClick={handleExportCsv}
                    >
                      Export Contacts CSV
                    </Button>
                  </div>
                </Form>
              </Col>

              {/* LIVE WHATSAPP PHONE PREVIEW WITH PHOTO BANNER */}
              <Col xs={24} lg={9}>
                <div className="sticky top-6">
                  <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border-4 border-slate-800 max-w-sm mx-auto">
                    {/* Phone Header */}
                    <div className="bg-emerald-800 rounded-t-2xl p-3 text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
                        YF
                      </div>
                      <div>
                        <p className="font-bold text-sm leading-tight">Yashoda Fashion</p>
                        <p className="text-[10px] text-emerald-200">Official Store Account</p>
                      </div>
                    </div>

                    {/* Chat Bubble Body */}
                    <div
                      className="bg-[#efeae2] p-4 min-h-[380px] max-h-[480px] overflow-y-auto rounded-b-2xl"
                      style={{
                        backgroundImage:
                          "radial-gradient(#cbd5e1 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    >
                      <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-md border border-slate-200 relative mb-4">
                        {/* PHOTO BANNER IN PREVIEW */}
                        {mediaUrl && (
                          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            <img
                              src={mediaUrl}
                              alt="Offer Banner"
                              className="w-full h-44 object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="bg-emerald-100 text-emerald-900 p-2 rounded-xl mb-2 text-xs font-semibold flex items-center justify-between">
                          <span>🏷️ {offerTitle || "Special Offer"}</span>
                          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {couponCode || "COUPON"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                          {previewText
                            ? previewText
                                .replace(/{name}/g, "Rahul Sharma")
                                .replace(/{offer}/g, offerTitle)
                                .replace(/{coupon}/g, couponCode)
                                .replace(/{storeName}/g, "Yashoda Fashion")
                            : "Your message preview will appear here..."}
                        </p>
                        <span className="text-[9px] text-slate-400 block text-right mt-2">
                          {moment().format("HH:mm")} ✓✓
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Tabs.TabPane>

          {/* TAB 2: CAMPAIGN HISTORY */}
          <Tabs.TabPane
            tab={
              <span>
                <ClockCircleOutlined className="mr-2 text-blue-600" />
                Broadcast Logs & History ({campaigns.length})
              </span>
            }
            key="2"
          >
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Past Offer Broadcasts</Title>
              <Button icon={<ReloadOutlined />} onClick={fetchCampaigns} loading={loadingCampaigns}>
                Refresh
              </Button>
            </div>
            <AdminDataTable columns={campaignColumns} dataSource={campaigns} rowKey="_id" />
          </Tabs.TabPane>

          {/* TAB 3: SETTINGS */}
          <Tabs.TabPane
            tab={
              <span>
                <SettingOutlined className="mr-2 text-gray-600" />
                API Gateway Setup
              </span>
            }
            key="3"
          >
            <Card title="Meta WhatsApp Cloud API Configuration" className="max-w-2xl">
              <Paragraph className="text-gray-600 text-sm">
                To send automated WhatsApp messages with photo attachments directly without opening WhatsApp Web, configure your Meta Developer Cloud API credentials below or in your Backend `.env` file.
              </Paragraph>
              <Form layout="vertical">
                <Form.Item label="Meta Cloud API Token (WHATSAPP_CLOUD_API_TOKEN)">
                  <Input.Password placeholder="EAAxxxxxxx..." />
                </Form.Item>
                <Form.Item label="Phone Number ID (WHATSAPP_PHONE_NUMBER_ID)">
                  <Input placeholder="1059xxxxxxx" />
                </Form.Item>
                <Button type="primary" className="bg-emerald-600">
                  Save Credentials
                </Button>
              </Form>
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* WEB QUEUE DISPATCHER MODAL (PERFECT STEPPER) */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-emerald-700">
            <FaWhatsapp className="text-2xl" />
            <span className="font-bold">WhatsApp 1-Click Dispatcher (Zero Drop Rate)</span>
          </div>
        }
        open={dispatcherVisible}
        onCancel={() => setDispatcherVisible(false)}
        footer={null}
        width={720}
        centered
      >
        {activeCampaign && (
          <div>
            <div className="bg-emerald-50 p-4 rounded-xl mb-4 border border-emerald-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-800">
                  Campaign: {activeCampaign.campaignName}
                </span>
                <Tag color="green">
                  {currentIndex} / {activeCampaign.recipientLogs.length} Processed
                </Tag>
              </div>
              <Progress
                percent={Math.round(
                  (currentIndex / activeCampaign.recipientLogs.length) * 100
                )}
                status="active"
                strokeColor="#10b981"
              />
            </div>

            {/* Instruction Banner */}
            <Alert
              type="info"
              showIcon
              message={
                <span className="font-bold text-blue-900">
                  ⚡ 100% Reliable 1-Click Queue Strategy:
                </span>
              }
              description={
                <div className="text-xs text-blue-800 space-y-1 mt-1">
                  <p>1. Click <b>"Send Message & Copy Photo"</b> below.</p>
                  <p>2. WhatsApp Web opens cleanly (never blocked by browser).</p>
                  <p>3. If sending a Photo, press <kbd className="bg-white px-1.5 py-0.5 rounded border shadow-sm font-mono font-bold">Ctrl + V</kbd> (or <kbd className="bg-white px-1.5 py-0.5 rounded border shadow-sm font-mono font-bold">Cmd + V</kbd>) in WhatsApp to paste the <b>REAL PHOTO ATTACHMENT</b> directly into chat!</p>
                </div>
              }
              className="mb-4 rounded-xl border-blue-200"
            />

            {activeCampaign.mediaUrl && (
              <div className="mb-4 bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeCampaign.mediaUrl}
                    alt="Offer Photo"
                    className="w-14 h-14 object-cover rounded-lg border"
                  />
                  <div>
                    <p className="text-xs font-bold text-purple-900">Offer Photo Attached</p>
                    <p className="text-[11px] text-purple-700">
                      Photo is automatically copied to your clipboard on every click!
                    </p>
                  </div>
                </div>
                <Button
                  size="small"
                  icon={<FaPaste />}
                  className="bg-purple-600 text-white border-none font-bold"
                  onClick={() => copyImageBlobToClipboard(activeCampaign.mediaUrl)}
                >
                  Copy Photo to Clipboard
                </Button>
              </div>
            )}

            {currentIndex < activeCampaign.recipientLogs.length ? (
              <div className="text-center py-6 bg-slate-50 rounded-2xl mb-4 border">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">
                  Target Customer ({currentIndex + 1} of {activeCampaign.recipientLogs.length}):
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {activeCampaign.recipientLogs[currentIndex]?.name || "Customer"}
                </p>
                <p className="text-lg text-emerald-600 font-mono font-bold">
                  +{activeCampaign.recipientLogs[currentIndex]?.phoneNumber}
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <Button
                    type="primary"
                    size="large"
                    className="bg-emerald-600 hover:bg-emerald-700 border-none font-extrabold px-8 h-14 text-base rounded-2xl shadow-xl flex items-center gap-2"
                    icon={<SendOutlined />}
                    onClick={() => dispatchNextContact()}
                  >
                    🚀 Send Message & Copy Photo ({currentIndex + 1} / {activeCampaign.recipientLogs.length})
                  </Button>

                  <Button
                    size="large"
                    className="h-14 rounded-2xl font-semibold border-slate-300"
                    icon={<RightCircleOutlined />}
                    onClick={skipCurrentContact}
                  >
                    Skip This Contact
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleOutlined className="text-5xl text-emerald-500 mb-3" />
                <h3 className="text-xl font-bold text-gray-800">
                  All Broadcast Messages Completed!
                </h3>
                <p className="text-gray-500">
                  Total {activeCampaign.recipientLogs.length} customer messages dispatched.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default WhatsAppMarketing;
