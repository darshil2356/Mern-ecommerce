import React, { useState, useEffect, useCallback } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined, CloseOutlined } from "@ant-design/icons";
import {
  AiOutlineDashboard,
  AiOutlineShoppingCart,
  AiOutlineUser,
  AiOutlineBgColors,
  AiOutlineLogout,
  AiOutlineSetting,
  AiOutlineFileText,
  AiFillStar,
} from "react-icons/ai";

import { RiCouponLine } from "react-icons/ri";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import { Outlet, useLocation } from "react-router-dom";
import { ImBlog } from "react-icons/im";
import { IoIosNotifications } from "react-icons/io";
import { FaClipboardList, FaBloggerB, FaChartLine, FaBox, FaUsers, FaTags, FaFileAlt, FaCube, FaLink, FaMagic, FaCoins, FaEye, FaChartBar, FaRocket, FaBook } from "react-icons/fa";
import { SiBrandfolder } from "react-icons/si";
import { BiCategoryAlt } from "react-icons/bi";
import { Layout, Menu, theme, Drawer } from "antd";
import { useNavigate } from "react-router-dom";
const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedKeys, setSelectedKeys] = useState([""]);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update selected keys when URL changes
  useEffect(() => {
    const path = location.pathname;
    // Extract the key from path (e.g., "/admin/product" -> "product")
    // Handle cases like /admin/product/:id -> "product"
    let key = path.split("/").pop();
    
    // If the last part is an ID (contains alphanumeric mix), try to get the second last part
    if (key && /^[0-9a-fA-F]+$/.test(key)) {
      const parts = path.split("/").filter(Boolean);
      key = parts[parts.length - 2] || "";
    }
    
    // Handle index route (/admin) - should show dashboard as selected
    if (path === "/admin" || path === "/admin/") {
      key = "";
    }
    
    setSelectedKeys([key]);
  }, [location.pathname]);

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
    {
      key: "",
      icon: <AiOutlineDashboard />,
      label: "Dashboard",
    },
    {
      key: "customers",
      icon: <FaUsers />,
      label: "Customers",
    },
    {
      key: "orders",
      icon: <FaClipboardList />,
      label: "Orders",
    },
    {
      key: "live-billing",
      icon: <AiOutlineShoppingCart />,
      label: "POS Billing",
    },
    {
      key: "Catalog",
      icon: <FaBox />,
      label: "Catalog",
      children: [
        { key: "product", icon: <AiOutlineShoppingCart />, label: "Add Product" },
        { key: "list-product", icon: <AiOutlineShoppingCart />, label: "Product List" },
        { key: "add-bundle", icon: <FaCube />, label: "Add Bundle" },
        { key: "list-bundle", icon: <FaCube />, label: "Bundle List" },
        { key: "brand", icon: <SiBrandfolder />, label: "Brand" },
        { key: "list-brand", icon: <SiBrandfolder />, label: "Brand List" },
        { key: "category", icon: <BiCategoryAlt />, label: "Category" },
        { key: "list-category", icon: <BiCategoryAlt />, label: "Category List" },
        { key: "color", icon: <AiOutlineBgColors />, label: "Color" },
        { key: "list-color", icon: <AiOutlineBgColors />, label: "Color List" },
      ],
    },
    {
      key: "analytics-tracking",
      icon: <FaChartBar />,
      label: "Analytics",
      children: [
        { key: "live-tracking", icon: <FaEye />, label: "Live Tracking" },
        { key: "tracking-analytics", icon: <FaChartLine />, label: "Analytics" },
        { key: "dropoff-reports", icon: <FaChartBar />, label: "Drop-off Reports" },
        { key: "ai-growth", icon: <FaRocket />, label: "AI Growth" },
        { key: "market-intelligence", icon: <FaChartLine />, label: "Market Intel" },
        { key: "reports", icon: <FaFileAlt />, label: "Reports" },
      ],
    },
    {
      key: "rewards",
      icon: <FaCoins />,
      label: "Rewards",
      children: [
        { key: "spin-management", icon: <FaMagic />, label: "Spin Wheel" },
        { key: "referral-settings", icon: <FaLink />, label: "Referral Settings" },
        { key: "referral-details", icon: <FaLink />, label: "Referral Details" },
        { key: "coin-settings", icon: <FaCoins />, label: "Coin Settings" },
      ],
    },
    {
      key: "marketing",
      icon: <FaTags />,
      label: "Marketing",
      children: [
        { key: "coupon", icon: <RiCouponLine />, label: "Add Coupon" },
        { key: "coupon-list", icon: <RiCouponLine />, label: "Coupon List" },
        { key: "blog", icon: <ImBlog />, label: "Add Blog" },
        { key: "blog-list", icon: <FaBloggerB />, label: "Blog List" },
        { key: "blog-category", icon: <ImBlog />, label: "Blog Category" },
        { key: "blog-category-list", icon: <FaBloggerB />, label: "Blog Cat List" },
      ],
    },
    {
      key: "rojmel",
      icon: <FaBook />,
      label: "Rojmel",
    },
    {
      key: "reviews",
      icon: <AiFillStar />,
      label: "Reviews",
    },
    {
      key: "enquiries",
      icon: <AiOutlineFileText />,
      label: "Enquiries",
    },
    {
      key: "signout",
      icon: <AiOutlineLogout />,
      label: "Sign Out",
    },
  ];

  const sidebarContent = (
    <>
      <div className="logo-container">
        <div className="logo-content">
          <span className="sm-logo">
            <FaChartLine className="fs-4 text-white" />
          </span>
          <span className="lg-logo">
            <span className="logo-icon"><FaChartLine /></span>
            <span className="logo-text">Cart Corner</span>
          </span>
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
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          className="main-sider"
          width={260}
          collapsedWidth={80}
        >
          {sidebarContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
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

      <Layout className={`site-layout ${collapsed ? 'site-layout-collapsed' : ''}`}>
        <Header className="main-header">
          <div className="header-left">
            <div
              className="trigger-btn"
              onClick={() => isMobile ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)}
            >
              {React.createElement(
                (!isMobile && collapsed) ? MenuUnfoldOutlined : MenuFoldOutlined,
                { className: "trigger-icon" }
              )}
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
                <img
                  width={40}
                  height={40}
                  src="https://ui-avatars.com/api/?name=Dev&background=667eea&color=fff&bold=true"
                  alt="Profile"
                />
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
          <ToastContainer
            position="top-right"
            autoClose={250}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            theme="light"
          />
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>

      <style>{`
        /* Main Layout */
        .main-layout {
          min-height: 100vh;
        }

        /* Sidebar fixed full height */
        .main-sider {
          position: fixed !important;
          left: 0;
          top: 0;
          bottom: 0;
          height: 100vh !important;
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%) !important;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          z-index: 100;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        .main-sider .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* Push content right to account for fixed sidebar */
        .site-layout {
          margin-left: 260px;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .site-layout-collapsed {
          margin-left: 80px;
        }

        /* Logo */
        .logo-container {
          padding: 10px 14px;
          flex-shrink: 0;
        }

        .logo-content {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          padding: 9px 12px;
        }

        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(102, 126, 234, 0.6); }
        }

        .logo-icon {
          font-size: 18px;
          margin-right: 8px;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .logo-text {
          font-size: 15px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.5px;
        }

        .sm-logo { display: none; }
        .lg-logo { display: flex; align-items: center; }
        .ant-layout-sider-collapsed .sm-logo { display: block; }
        .ant-layout-sider-collapsed .lg-logo { display: none; }

        /* Menu — fills remaining height, scrollable but no scrollbar */
        .main-menu {
          background: transparent !important;
          border-right: none !important;
          padding: 0 8px 8px;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
        }

        .main-menu::-webkit-scrollbar { width: 0; }

        .main-menu .ant-menu-item,
        .main-menu .ant-menu-submenu-title {
          border-radius: 7px !important;
          margin: 1px 0 !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 13px !important;
          transition: all 0.2s ease !important;
        }

        .main-menu .ant-menu-item:hover,
        .main-menu .ant-menu-submenu-title:hover {
          background: rgba(102, 126, 234, 0.2) !important;
        }

        .main-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }

        .main-menu .ant-menu-item-selected::after { display: none; }

        .main-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #667eea !important;
        }

        .main-menu .ant-menu-sub {
          background: rgba(0,0,0,0.15) !important;
          border-radius: 7px !important;
          padding: 1px !important;
        }

        .main-menu .ant-menu-sub .ant-menu-item {
          height: 32px !important;
          line-height: 32px !important;
          font-size: 12px !important;
          margin: 1px 0 !important;
        }

        .main-menu .ant-menu-inline-collapsed .ant-menu-item {
          padding: 0 !important;
          display: flex;
          justify-content: center;
        }
        
        /* Header */
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          position: sticky;
          top: 0;
          z-index: 99;
          height: 60px;
        }
        
        .header-left {
          display: flex;
          align-items: center;
        }
        
        .trigger-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .trigger-btn:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transform: scale(1.05);
        }
        
        .trigger-btn:hover .trigger-icon {
          color: white;
        }
        
        .trigger-icon {
          font-size: 18px;
          color: #1a1a2e;
          transition: all 0.3s ease;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .header-action-btns {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 10px;
          background: #f1f5f9;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #64748b;
        }
        
        .action-btn:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .notification-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* User Profile */
        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 16px 6px 6px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .user-profile:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        
        .user-avatar img {
          border-radius: 10px;
          border: 2px solid #667eea;
        }
        
        .user-info h5 {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
          line-height: 18px;
        }
        
        .user-info p {
          font-size: 12px;
          color: #64748b;
          line-height: 16px;
        }
        
        .profile-dropdown {
          border-radius: 12px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
          border: none !important;
          padding: 8px !important;
          margin-top: 8px !important;
        }
        
        .profile-dropdown .dropdown-item {
          border-radius: 8px !important;
          padding: 6px 16px !important;
          margin: 2px 0 !important;
          transition: all 0.2s ease;
        }
        
        .profile-dropdown .dropdown-item:hover {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
          transform: translateX(4px);
        }
        
        .main-content {
          margin: 0 !important;
          padding: 0 !important;
          min-height: calc(100vh - 60px);
          background: #f0f2f5;
        }
        
        .content-wrapper {
          padding: 24px;
          animation: fadeIn 0.4s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Mobile Drawer Sidebar */
        .mobile-drawer .ant-drawer-body {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .mobile-drawer .main-menu {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .mobile-drawer .main-menu::-webkit-scrollbar {
          width: 0px;
        }

        @media (max-width: 768px) {
          .site-layout { margin-left: 0 !important; }
          .main-header { padding: 0 12px !important; height: 56px; }
          .user-info { display: none; }
          .content-wrapper { padding: 12px; }
          .trigger-btn { width: 36px; height: 36px; }
          .user-profile { padding: 4px 8px 4px 4px; gap: 8px; }
          .main-content { min-height: calc(100vh - 56px); }
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
