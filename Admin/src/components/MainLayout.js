import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import {
  AiOutlineDashboard, AiOutlineShoppingCart, AiOutlineUser,
  AiOutlineBgColors, AiOutlineLogout, AiOutlineSetting,
  AiOutlineFileText, AiFillStar,
} from "react-icons/ai";
import { RiCouponLine } from "react-icons/ri";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ImBlog } from "react-icons/im";
import { IoIosNotifications } from "react-icons/io";
import {
  FaClipboardList, FaBloggerB, FaChartLine, FaBox, FaUsers, FaTags,
  FaFileAlt, FaCube, FaLink, FaMagic, FaCoins, FaEye, FaChartBar,
  FaRocket, FaBook, FaRuler, FaHandshake, FaShoppingBasket, FaStore,
  FaLock, FaUnlockAlt,
} from "react-icons/fa";
import { SiBrandfolder } from "react-icons/si";
import { BiCategoryAlt } from "react-icons/bi";
import { Layout, Menu, theme, Drawer } from "antd";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

const { Header, Sider, Content } = Layout;

// ─── Route → group mapping ────────────────────────────────────────────────────
// Each route key maps to a lock group key
const ROUTE_GROUP = {
  "customers":          "customers",
  "customer":           "customers",
  "orders":             "orders",
  "order":              "orders",
  "list-product":       "catalog",
  "product":            "catalog",
  "list-bundle":        "catalog",
  "bundle":             "catalog",
  "list-brand":         "catalog",
  "list-category":      "catalog",
  "list-color":         "catalog",
  "list-size":          "catalog",
  "live-tracking":      "analytics",
  "tracking-analytics": "analytics",
  "dropoff-reports":    "analytics",
  "ai-growth":          "analytics",
  "market-intelligence":"analytics",
  "reports":            "analytics",
  "spin-management":    "rewards",
  "referral-settings":  "rewards",
  "referral-details":   "rewards",
  "coin-settings":      "rewards",
  "coupon-list":        "marketing",
  "coupon":             "marketing",
  "offer-list":         "marketing",
  "offer":              "marketing",
  "blog-list":          "marketing",
  "blog":               "marketing",
  "blog-category-list": "marketing",
  "blog-category":      "marketing",
  "purchase-list":      "purchase",
  "add-purchase":       "purchase",
  "vendors":            "purchase",
  "rojmel":             "rojmel",
  "wholesale-rojmal":   "rojmel",
  "udhar":              "udhar",
  "reviews":            "reviews",
  "enquiries":          "enquiries",
  "product-inquiries":  "enquiries",
  "settings":           "settings",
};

// ─── Lock Overlay ─────────────────────────────────────────────────────────────
const LockOverlay = ({ groupLabel, onUnlock }) => {
  const [input, setInput]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) { setError("Enter password"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${base_url}user/verify-pos-lock`, { password: input }, config);
      onUnlock();
    } catch {
      setError("Wrong password. Try again.");
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaLock className="text-3xl text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">🔒 {groupLabel}</h2>
          <p className="text-sm text-gray-500 mt-1">This section is locked. Enter owner password to continue.</p>
        </div>
        <input
          ref={inputRef}
          type="password"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg focus:border-indigo-500 outline-none transition-all"
          placeholder="Enter password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        >
          {loading
            ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            : <><FaUnlockAlt /> Unlock</>}
        </button>
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
const MainLayout = () => {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < 768);
  const [selectedKeys, setSelectedKeys] = useState([""]);

  // Lock system
  const [lockedGroups, setLockedGroups]     = useState({});   // { groupKey: true } — which groups are locked
  const [unlockedGroups, setUnlockedGroups] = useState({});   // { groupKey: true } — unlocked this session
  const [groupLabels, setGroupLabels]       = useState({});   // { groupKey: "Display Name" }
  const [activeOverlay, setActiveOverlay]   = useState(null); // groupKey currently showing overlay
  const [passwordSet, setPasswordSet]       = useState(false);

  const { token: { colorBgContainer } } = theme.useToken();
  const navigate  = useNavigate();
  const location  = useLocation();
  const vendorsVisible = useSelector(s => s.purchase?.vendorsVisible ?? false);

  // Fetch lock config on mount
  useEffect(() => {
    const fetchLockConfig = async () => {
      try {
        const res = await axios.get(`${base_url}user/settings`, config);
        const d = res.data;
        setPasswordSet(!!d.posLockPasswordSet);
        setLockedGroups({
          customers: !!d.lockCustomers,
          orders:    !!d.lockOrders,
          catalog:   !!d.lockCatalog,
          analytics: !!d.lockAnalytics,
          rewards:   !!d.lockRewards,
          marketing: !!d.lockMarketing,
          purchase:  !!d.lockPurchase,
          rojmel:    !!d.lockRojmel,
          udhar:     !!d.lockUdhar,
          reviews:   !!d.lockReviews,
          enquiries: !!d.lockEnquiries,
          settings:  !!d.lockSettings,
        });
        setGroupLabels({
          customers: "Customers",
          orders:    "Orders",
          catalog:   "Catalog",
          analytics: "Analytics",
          rewards:   "Rewards",
          marketing: "Marketing",
          purchase:  "Purchase",
          rojmel:    "Rojmel",
          udhar:     "Udhar Khata",
          reviews:   "Reviews",
          enquiries: "Enquiries",
          settings:  "Settings",
        });
      } catch {
        // silently fail — no lock applied
      }
    };
    fetchLockConfig();
  }, []);

  // Check lock on every route change
  useEffect(() => {
    const path = location.pathname;
    let routeKey = path.split("/").pop();
    if (routeKey && /^[0-9a-fA-F]{10,}$/.test(routeKey)) {
      const parts = path.split("/").filter(Boolean);
      routeKey = parts[parts.length - 2] || "";
    }
    if (path === "/admin" || path === "/admin/") routeKey = "";

    setSelectedKeys([routeKey]);

    const group = ROUTE_GROUP[routeKey];
    if (group && lockedGroups[group] && !unlockedGroups[group] && passwordSet) {
      setActiveOverlay(group);
    } else {
      setActiveOverlay(null);
    }
  }, [location.pathname, lockedGroups, unlockedGroups, passwordSet]);

  const handleUnlock = useCallback((group) => {
    setUnlockedGroups(prev => ({ ...prev, [group]: true }));
    setActiveOverlay(null);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMenuClick = useCallback(({ key }) => {
    if (key === "signout") {
      localStorage.clear();
      window.location.reload();
    } else {
      navigate(key);
      if (isMobile) setMobileOpen(false);
    }
  }, [navigate, isMobile]);

  const menuItems = [
    { key: "", icon: <AiOutlineDashboard />, label: "Dashboard" },
    { key: "customers", icon: <FaUsers />, label: "Customers" },
    { key: "orders", icon: <FaClipboardList />, label: "Orders" },
    { key: "live-billing", icon: <AiOutlineShoppingCart />, label: "POS Billing" },
    {
      key: "Catalog", icon: <FaBox />, label: "Catalog",
      children: [
        { key: "list-product",   icon: <AiOutlineShoppingCart />, label: "Products" },
        { key: "list-bundle",    icon: <FaCube />,                label: "Bundles" },
        { key: "list-brand",     icon: <SiBrandfolder />,         label: "Brands" },
        { key: "list-category",  icon: <BiCategoryAlt />,         label: "Categories" },
        { key: "list-color",     icon: <AiOutlineBgColors />,     label: "Colors" },
        { key: "list-size",      icon: <FaRuler />,               label: "Sizes" },
      ],
    },
    {
      key: "analytics-tracking", icon: <FaChartBar />, label: "Analytics",
      children: [
        { key: "live-tracking",      icon: <FaEye />,       label: "Live Tracking" },
        { key: "tracking-analytics", icon: <FaChartLine />, label: "Analytics" },
        { key: "dropoff-reports",    icon: <FaChartBar />,  label: "Drop-off Reports" },
        { key: "ai-growth",          icon: <FaRocket />,    label: "AI Growth" },
        { key: "market-intelligence",icon: <FaChartLine />, label: "Market Intel" },
        { key: "reports",            icon: <FaFileAlt />,   label: "Reports" },
      ],
    },
    {
      key: "rewards", icon: <FaCoins />, label: "Rewards",
      children: [
        { key: "spin-management",  icon: <FaMagic />,  label: "Spin Wheel" },
        { key: "referral-settings",icon: <FaLink />,   label: "Referral Settings" },
        { key: "referral-details", icon: <FaLink />,   label: "Referral Details" },
        { key: "coin-settings",    icon: <FaCoins />,  label: "Coin Settings" },
      ],
    },
    {
      key: "marketing", icon: <FaTags />, label: "Marketing",
      children: [
        { key: "coupon-list",       icon: <RiCouponLine />, label: "Coupons" },
        { key: "offer-list",        icon: <FaTags />,       label: "Offers" },
        { key: "blog-list",         icon: <FaBloggerB />,   label: "Blogs" },
        { key: "blog-category-list",icon: <ImBlog />,       label: "Blog Categories" },
      ],
    },
    {
      key: "purchase-module", icon: <FaShoppingBasket />, label: "Purchase",
      children: [
        { key: "purchase-list", icon: <FaFileAlt />,       label: "Purchase Bills" },
        { key: "add-purchase",  icon: <FaShoppingBasket />,label: "Add Bill" },
        ...(vendorsVisible ? [{ key: "vendors", icon: <FaStore />, label: "Vendors (Vepari)" }] : []),
      ],
    },
    { key: "rojmel",           icon: <FaBook />,          label: "Rojmel" },
    { key: "wholesale-rojmal", icon: <FaStore />,         label: "Wholesale Rojmal" },
    { key: "udhar",            icon: <FaHandshake />,     label: "Udhar Khata" },
    { key: "reviews",          icon: <AiFillStar />,      label: "Reviews" },
    { key: "enquiries",        icon: <AiOutlineFileText />,label: "Enquiries" },
    { key: "product-inquiries",icon: <AiOutlineFileText />,label: "Stock Inquiries" },
    { key: "signout",          icon: <AiOutlineLogout />, label: "Sign Out" },
  ];

  const sidebarContent = (
    <>
      <div className="logo-container">
        <div className="logo-content">
          <span className="sm-logo"><img src="/yashoda-logo.png" alt="YF" className="logo-img-sm" /></span>
          <span className="lg-logo"><img src="/yashoda-logo.png" alt="Yashoda Fashion" className="logo-img-lg" /></span>
        </div>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys}
        onClick={handleMenuClick}
        items={menuItems}
        className="main-menu"
      />
    </>
  );

  return (
    <Layout className="main-layout">
      {/* Lock Overlay */}
      {activeOverlay && (
        <LockOverlay
          groupLabel={groupLabels[activeOverlay] || activeOverlay}
          onUnlock={() => handleUnlock(activeOverlay)}
        />
      )}

      {!isMobile && (
        <Sider trigger={null} collapsible collapsed={collapsed} className="main-sider" width={260} collapsedWidth={80}>
          {sidebarContent}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          placement="left"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          width={260}
          bodyStyle={{ padding: 0, background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}
          headerStyle={{ display: "none" }}
          className="mobile-drawer"
        >
          {sidebarContent}
        </Drawer>
      )}

      <Layout className={`site-layout ${collapsed ? "site-layout-collapsed" : ""}`}>
        <Header className="main-header">
          <div className="header-left">
            <div className="trigger-btn" onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}>
              {React.createElement((!isMobile && collapsed) ? MenuUnfoldOutlined : MenuFoldOutlined, { className: "trigger-icon" })}
            </div>
          </div>
          <div className="header-right">
            <div className="header-action-btns">
              <button className="action-btn notification-btn">
                <IoIosNotifications className="fs-5" />
                <span className="notification-badge">3</span>
              </button>
              <Link to="/admin/settings" className="action-btn">
                <AiOutlineSetting className="fs-5" />
              </Link>
            </div>
            <div className="user-profile dropdown">
              <div className="user-avatar">
                <img width={40} height={40} src="https://ui-avatars.com/api/?name=Dev&background=667eea&color=fff&bold=true" alt="Profile" />
              </div>
              <div className="user-info" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
                <h5 className="mb-0">Dev</h5>
                <p className="mb-0">Administrator</p>
              </div>
              <div className="dropdown-menu profile-dropdown" aria-labelledby="dropdownMenuLink">
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/">
                    <AiOutlineUser className="fs-6 me-2" /> View Profile
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center" to="/admin/settings">
                    <AiOutlineSetting className="fs-6 me-2" /> Settings
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item d-flex align-items-center text-danger" to="/">
                    <AiOutlineLogout className="fs-6 me-2" /> Signout
                  </Link>
                </li>
              </div>
            </div>
          </div>
        </Header>
        <Content className="main-content">
          <ToastContainer position="top-right" autoClose={250} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable theme="light" />
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>

      <style>{`
        .main-layout { min-height: 100vh; }
        .main-sider {
          position: fixed !important; left: 0; top: 0; bottom: 0;
          height: 100vh !important;
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%) !important;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15); z-index: 100;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden;
        }
        .main-sider .ant-layout-sider-children { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .site-layout { margin-left: 260px; transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .site-layout-collapsed { margin-left: 80px; }
        .logo-container { padding: 12px 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .logo-content { display: flex; align-items: center; justify-content: center; width: 100%; }
        .logo-img-lg { height: 64px; width: 64px; object-fit: contain; display: block; border-radius: 50%; background: #fff; padding: 2px; }
        .logo-img-sm { height: 44px; width: 44px; object-fit: contain; display: block; border-radius: 50%; background: #fff; padding: 2px; }
        .sm-logo { display: none; }
        .lg-logo { display: flex; align-items: center; justify-content: center; width: 100%; }
        .ant-layout-sider-collapsed .sm-logo { display: flex; }
        .ant-layout-sider-collapsed .lg-logo { display: none; }
        .main-menu {
          background: transparent !important; border-right: none !important;
          padding: 0 8px 8px; flex: 1; overflow-y: auto; overflow-x: hidden; scrollbar-width: none;
        }
        .main-menu::-webkit-scrollbar { width: 0; }
        .main-menu .ant-menu-item, .main-menu .ant-menu-submenu-title {
          border-radius: 7px !important; margin: 1px 0 !important;
          height: 36px !important; line-height: 36px !important;
          font-size: 13px !important; transition: all 0.2s ease !important;
        }
        .main-menu .ant-menu-item:hover, .main-menu .ant-menu-submenu-title:hover { background: rgba(102,126,234,0.2) !important; }
        .main-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 2px 8px rgba(102,126,234,0.4);
        }
        .main-menu .ant-menu-item-selected::after { display: none; }
        .main-menu .ant-menu-submenu-selected > .ant-menu-submenu-title { color: #667eea !important; }
        .main-menu .ant-menu-sub { background: rgba(0,0,0,0.15) !important; border-radius: 7px !important; padding: 1px !important; }
        .main-menu .ant-menu-sub .ant-menu-item { height: 32px !important; line-height: 32px !important; font-size: 12px !important; margin: 1px 0 !important; }
        .main-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 20px !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 99; height: 60px;
        }
        .header-left { display: flex; align-items: center; }
        .trigger-btn {
          display: flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 10px;
          background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
          cursor: pointer; transition: all 0.3s ease;
        }
        .trigger-btn:hover { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); transform: scale(1.05); }
        .trigger-btn:hover .trigger-icon { color: white; }
        .trigger-icon { font-size: 18px; color: #1a1a2e; transition: all 0.3s ease; }
        .header-right { display: flex; align-items: center; gap: 20px; }
        .header-action-btns { display: flex; gap: 8px; }
        .action-btn {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 42px; height: 42px; border: none; border-radius: 10px;
          background: #f1f5f9; cursor: pointer; transition: all 0.3s ease; color: #64748b;
        }
        .action-btn:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102,126,234,0.3);
        }
        .notification-badge {
          position: absolute; top: 6px; right: 6px; width: 18px; height: 18px;
          background: #ef4444; color: white; font-size: 10px; font-weight: 600;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .user-profile {
          display: flex; align-items: center; gap: 12px; padding: 6px 16px 6px 6px;
          background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          cursor: pointer; transition: all 0.3s ease;
        }
        .user-profile:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .user-avatar img { border-radius: 10px; border: 2px solid #667eea; }
        .user-info h5 { font-size: 14px; font-weight: 600; color: #1a1a2e; line-height: 18px; }
        .user-info p { font-size: 12px; color: #64748b; line-height: 16px; }
        .profile-dropdown {
          border-radius: 12px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
          border: none !important; padding: 8px !important; margin-top: 8px !important;
        }
        .profile-dropdown .dropdown-item { border-radius: 8px !important; padding: 6px 16px !important; margin: 2px 0 !important; transition: all 0.2s ease; }
        .profile-dropdown .dropdown-item:hover { background: linear-gradient(90deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%) !important; transform: translateX(4px); }
        .main-content { margin: 0 !important; padding: 0 !important; min-height: calc(100svh - 60px); background: #f0f2f5; }
        .content-wrapper { padding: 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom)); animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .mobile-drawer .ant-drawer-body { display: flex; flex-direction: column; height: 100%; overflow-y: auto; overflow-x: hidden; }
        .mobile-drawer .main-menu { flex: 1; overflow-y: auto; overflow-x: hidden; }
        .mobile-drawer .main-menu::-webkit-scrollbar { width: 0px; }
        @media (max-width: 768px) {
          .site-layout { margin-left: 0 !important; }
          .main-header { padding: 0 10px !important; height: 52px; }
          .user-info { display: none; }
          .content-wrapper { padding: 8px; padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
          .trigger-btn { width: 36px; height: 36px; }
          .user-profile { padding: 4px 8px 4px 4px; gap: 8px; }
          .main-content { min-height: calc(100svh - 52px); }
        }
        @media (max-width: 576px) {
          .header-action-btns .notification-btn { display: none; }
          .user-avatar img { width: 32px !important; height: 32px !important; }
        }
      `}</style>
    </Layout>
  );
};

export default MainLayout;
