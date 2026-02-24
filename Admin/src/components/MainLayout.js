import React, { useState } from "react";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
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
import { Outlet } from "react-router-dom";
import { ImBlog } from "react-icons/im";
import { IoIosNotifications, IoMenuOutline } from "react-icons/io";
import { FaClipboardList, FaBloggerB, FaChartLine, FaBox, FaUsers, FaTags, FaFileAlt, FaCube } from "react-icons/fa";
import { SiBrandfolder } from "react-icons/si";
import { BiCategoryAlt, BiCategory } from "react-icons/bi";
import { Layout, Menu, theme } from "antd";
import { useNavigate } from "react-router-dom";
const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const navigate = useNavigate();

  const menuItems = [
    {
      key: "",
      icon: <AiOutlineDashboard className="fs-5" />,
      label: "Dashboard",
    },
{
      key: "customers",
      icon: <FaUsers className="fs-5" />,
      label: "Customers",
    },
    {
      key: "Catalog",
      icon: <FaBox className="fs-5" />,
      label: "Catalog",
      children: [
        {
          key: "product",
          icon: <AiOutlineShoppingCart className="fs-5" />,
          label: "Add Product",
        },
        {
          key: "list-product",
          icon: <AiOutlineShoppingCart className="fs-5" />,
          label: "Product List",
        },
        {
          key: "add-bundle",
          icon: <FaCube className="fs-5" />,
          label: "Add Bundle",
        },
        {
          key: "list-bundle",
          icon: <FaCube className="fs-5" />,
          label: "Bundle List",
        },
        {
          key: "brand",
          icon: <SiBrandfolder className="fs-5" />,
          label: "Brand",
        },
        {
          key: "list-brand",
          icon: <SiBrandfolder className="fs-5" />,
          label: "Brand List ",
        },
        {
          key: "category",
          icon: <BiCategoryAlt className="fs-5" />,
          label: "Category",
        },
        {
          key: "list-category",
          icon: <BiCategoryAlt className="fs-5" />,
          label: "Category List",
        },
        {
          key: "color",
          icon: <AiOutlineBgColors className="fs-5" />,
          label: "Color",
        },
        {
          key: "list-color",
          icon: <AiOutlineBgColors className="fs-5" />,
          label: "Color List",
        },
      ],
    },
    {
      key: "live-billing",
      icon: <AiOutlineShoppingCart className="fs-5" />,
      label: "POS Billing",
    },
    {
      key: "orders",
      icon: <FaClipboardList className="fs-5" />,
      label: "Orders",
    },
    {
      key: "reports",
      icon: <FaFileAlt className="fs-5" />,
      label: "Reports",
    },
    {
      key: "reviews",
      icon: <AiFillStar className="fs-5" />,
      label: "Reviews",
    },
    {
      key: "marketing",
      icon: <FaTags className="fs-5" />,
      label: "Marketing",
      children: [
        {
          key: "coupon",
          icon: <ImBlog className="fs-5" />,
          label: "Add Coupon",
        },
        {
          key: "coupon-list",
          icon: <RiCouponLine className="fs-5" />,
          label: "Coupon List",
        },
      ],
    },
    {
      key: "blogs",
      icon: <FaBloggerB className="fs-5" />,
      label: "Blogs",
      children: [
        {
          key: "blog",
          icon: <ImBlog className="fs-5" />,
          label: "Add Blog",
        },
        {
          key: "blog-list",
          icon: <FaBloggerB className="fs-5" />,
          label: "Blog List",
        },
        {
          key: "blog-category",
          icon: <ImBlog className="fs-5" />,
          label: "Add Blog Category",
        },
        {
          key: "blog-category-list",
          icon: <FaBloggerB className="fs-5" />,
          label: "Blog Category List",
        },
      ],
    },
    {
      key: "enquiries",
      icon: <AiOutlineFileText className="fs-5" />,
      label: "Enquiries",
    },
    {
      key: "signout",
      icon: <AiOutlineLogout className="fs-5" />,
      label: "Sign Out",
    },
  ];

  return (
    <Layout className="main-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="main-sider"
        width={260}
        collapsedWidth={80}
      >
        <div className="logo-container">
          <div className="logo-content">
            <span className="sm-logo">
              <FaChartLine className="fs-4 text-white" />
            </span>
            <span className="lg-logo">
              <span className="logo-icon">
                <FaChartLine />
              </span>
              <span className="logo-text">Cart Corner</span>
            </span>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[""]}
          onClick={({ key }) => {
            if (key === "signout") {
              localStorage.clear();
              window.location.reload();
            } else {
              navigate(key);
            }
          }}
          items={menuItems}
          className="main-menu"
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="main-header">
          <div className="header-left">
            <div 
              className="trigger-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {React.createElement(
                collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                {
                  className: "trigger-icon",
                }
              )}
            </div>
          </div>
          <div className="header-right">
            <div className="header-action-btns">
              <button className="action-btn">
                <IoIosNotifications className="fs-5" />
                <span className="notification-badge">3</span>
              </button>
              <button className="action-btn">
                <AiOutlineSetting className="fs-5" />
              </button>
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
                  <Link className="dropdown-item" to="/">
                    <AiOutlineUser className="me-2" /> View Profile
                  </Link>
                </li>
<li>
                  <Link className="dropdown-item" to="/admin/settings">
                    <AiOutlineSetting className="me-2" /> Settings
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item text-danger" to="/">
                    <AiOutlineLogout className="me-2" /> Signout
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
        /* Main Layout Styles */
        .main-layout {
          min-height: 100vh;
        }
        
        /* Animated Sidebar */
        .main-sider {
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%) !important;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          z-index: 100;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .main-sider .ant-layout-sider-children {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        /* Logo Styles */
        .logo-container {
          padding: 20px 16px;
          margin-bottom: 8px;
        }
        
        .logo-content {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 14px;
          animation: logoGlow 3s ease-in-out infinite;
        }
        
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 4px 25px rgba(102, 126, 234, 0.6); }
        }
        
        .logo-icon {
          font-size: 24px;
          margin-right: 10px;
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        .logo-text {
          font-size: 18px;
          font-weight: 700;
          color: white;
          letter-spacing: 0.5px;
        }
        
        .sm-logo {
          display: none;
        }
        
        .lg-logo {
          display: flex;
          align-items: center;
        }
        
        .ant-layout-sider-collapsed .sm-logo {
          display: block;
        }
        
        .ant-layout-sider-collapsed .lg-logo {
          display: none;
        }
        
        /* Menu Styles */
        .main-menu {
          background: transparent !important;
          border-right: none !important;
          padding: 0 12px;
        }
        
        .main-menu .ant-menu-item,
        .main-menu .ant-menu-submenu-title {
          border-radius: 10px !important;
          margin: 4px 0 !important;
          height: 46px !important;
          line-height: 46px !important;
          transition: all 0.3s ease !important;
        }
        
        .main-menu .ant-menu-item:hover,
        .main-menu .ant-menu-submenu-title:hover {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%) !important;
          transform: translateX(4px);
        }
        
        .main-menu .ant-menu-item-selected {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .main-menu .ant-menu-item-selected::after {
          display: none;
        }
        
        .main-menu .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: #667eea !important;
        }
        
        .main-menu .ant-menu-sub {
          background: rgba(0, 0, 0, 0.2) !important;
          border-radius: 10px !important;
          padding: 4px !important;
        }
        
        .main-menu .ant-menu-inline-collapsed .ant-menu-item {
          padding: 0 !important;
          display: flex;
          justify-content: center;
        }
        
        /* Header Styles */
        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px !important;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 0;
          z-index: 99;
          height: 70px;
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
          padding: 10px 16px !important;
          margin: 2px 0 !important;
          transition: all 0.2s ease;
        }
        
        .profile-dropdown .dropdown-item:hover {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
          transform: translateX(4px);
        }
        
        /* Content Area */
        .main-content {
          margin: 0 !important;
          padding: 0 !important;
          min-height: calc(100vh - 70px);
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
        
        /* Responsive Styles */
        @media (max-width: 768px) {
          .main-header {
            padding: 0 16px !important;
          }
          
          .user-info {
            display: none;
          }
          
          .content-wrapper {
            padding: 16px;
          }
          
          .trigger-btn {
            width: 38px;
            height: 38px;
          }
        }
        
        @media (max-width: 576px) {
          .header-action-btns {
            display: none;
          }
        }
      `}</style>
    </Layout>
  );
};
export default MainLayout;
