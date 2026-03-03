import React, { useState, useEffect, useMemo } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Container from "../components/Container";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, getOrders, getMyReferrals, applyReferralCode, getReferralCode } from "../features/user/userSlice";
import { FiEdit, FiCopy, FiCheck, FiShare2, FiUsers, FiGift, FiLink, FiUserCheck, FiShoppingBag, FiAward, FiStar, FiChevronRight } from "react-icons/fi";
import { motion } from "framer-motion";

let profileSchema = yup.object({
  firstname: yup.string().required("First Name is Required"),
  lastname: yup.string().required("Last Name is Required"),
  email: yup
    .string()
    .required("Email is Required")
    .email("Email Should be valid"),
  mobile: yup.number().required().positive().integer("Mobile No is Required"),
});

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const [coinFilter, setCoinFilter] = useState("all");

  const getTokenFromLocalStorage = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;

  const config2 = {
    headers: {
      Authorization: `Bearer ${
        getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""
      }`,
      Accept: "application/json",
    },
  };

  const dispatch = useDispatch();
  const userState = useSelector((state) => state?.auth?.user);
  const orderState = useSelector((state) => state?.auth?.getorderedProduct?.orders);
  const referralState = useSelector((state) => state.auth);
  
  // Get referral code from multiple sources: localStorage, userState, or referralState
  const getUserReferralCode = () => {
    // First check localStorage (most reliable after login)
    const localStorageData = localStorage.getItem("customer");
    if (localStorageData) {
      const parsed = JSON.parse(localStorageData);
      if (parsed.referralCode) return parsed.referralCode;
    }
    // Then check userState
    if (userState?.referralCode) return userState.referralCode;
    // Then check referralState
    if (referralState?.referralCode) return referralState.referralCode;
    return "";
  };
  
  const userReferralCode = getUserReferralCode();
  
  const [edit, setEdit] = useState(true);

  const formik = useFormik({
    initialValues: {
      firstname: userState?.firstname,
      lastname: userState?.lastname,
      email: userState?.email,
      mobile: userState?.mobile,
    },
    validationSchema: profileSchema,
    onSubmit: (values) => {
      dispatch(updateProfile({ data: values, config2: config2 }));
      setEdit(true);
    },
  });

  // Fetch orders when tab is changed to orders
  useEffect(() => {
    if (activeTab === "orders" && getTokenFromLocalStorage?.token) {
      dispatch(
        getOrders({
          headers: {
            Authorization: `Bearer ${getTokenFromLocalStorage.token}`,
          },
        })
      );
    }
  }, [activeTab, dispatch]);

  // Fetch referrals when tab is changed to referrals
  useEffect(() => {
    if (activeTab === "referrals" && getTokenFromLocalStorage?.token) {
      dispatch(getMyReferrals());
    }
  }, [activeTab, dispatch]);

  // Fetch referral code if not available and user is logged in
  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!userReferralCode && getTokenFromLocalStorage?.token && !isLoadingReferral) {
        setIsLoadingReferral(true);
        try {
          await dispatch(getReferralCode()).unwrap();
        } catch (error) {
          console.error("Error fetching referral code:", error);
        } finally {
          setIsLoadingReferral(false);
        }
      }
    };

    if (activeTab === "referrals") {
      fetchReferralCode();
    }
  }, [activeTab, userReferralCode, dispatch, getTokenFromLocalStorage?.token, isLoadingReferral]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    return `₹ ${price?.toLocaleString("en-IN")}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const coinTransactions = referralState?.coinTransactions || [];
  const filteredCoinTransactions = useMemo(() => {
    if (coinFilter === "credited") {
      return coinTransactions.filter((txn) => txn.type === "credit");
    }
    if (coinFilter === "debited") {
      return coinTransactions.filter((txn) => txn.type === "debit");
    }
    return coinTransactions;
  }, [coinFilter, coinTransactions]);

  const getCoinTxnLabel = (txn) => {
    if (txn.reason === "referral_purchase") return "Referral Purchase Reward";
    if (txn.reason === "purchase") return "Used In Purchase";
    if (txn.reason === "expiry") return "Coin Expiry";
    if (txn.reason === "admin_adjustment") return "Manual Adjustment";
    return txn.description || "Coin Update";
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    const code = userReferralCode || referralState?.referralCode || "";
    return `${baseUrl}/signup?ref=${code}`;
  };

  const copyToClipboard = () => {
    if (userReferralCode || referralState?.referralCode) {
      navigator.clipboard.writeText(userReferralCode || referralState?.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLinkToClipboard = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApplyReferral = () => {
    if (referralCodeInput.trim()) {
      dispatch(applyReferralCode(referralCodeInput.trim()));
      setReferralCodeInput("");
    }
  };

  // Render Profile Info Tab
  const renderProfileInfo = () => (
    <div className="row">
      <div className="col-12">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="my-3">Update Profile</h3>
          <FiEdit className="fs-3 cursor-pointer" onClick={() => setEdit(false)} style={{ cursor: "pointer" }} />
        </div>
      </div>
      <div className="col-12">
        <form action="" onSubmit={formik.handleSubmit}>
          <div className="mb-3">
            <div className="mb-3">
              <label htmlFor="example1" className="form-label">
                First Name
              </label>
              <input
                type="text"
                name="firstname"
                className="form-control"
                id="example1"
                disabled={edit}
                value={formik.values.firstname}
                onChange={formik.handleChange("firstname")}
                onBlur={formik.handleBlur("firstname")}
              />
              <div className="error">
                {formik.touched.firstname && formik.errors.firstname}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="example2" className="form-label">
                Last Name
              </label>
              <input
                type="text"
                name="lastname"
                className="form-control"
                id="example2"
                disabled={edit}
                value={formik.values.lastname}
                onChange={formik.handleChange("lastname")}
                onBlur={formik.handleBlur("lastname")}
              />
              <div className="error">
                {formik.touched.lastname && formik.errors.lastname}
              </div>
            </div>
            <label htmlFor="exampleInputEmail1" className="form-label">
              Email address
            </label>
            <input
              type="email"
              name="email"
              className="form-control"
              id="exampleInputEmail1"
              disabled={edit}
              aria-describedby="emailHelp"
              value={formik.values.email}
              onChange={formik.handleChange("email")}
              onBlur={formik.handleBlur("email")}
            />
            <div className="error">
              {formik.touched.email && formik.errors.email}
            </div>
            <div className="mb-3">
              <label htmlFor="example3" className="form-label">
                Mobile No
              </label>
              <input
                type="number"
                name="mobile"
                className="form-control"
                id="example3"
                disabled={edit}
                value={formik.values.mobile}
                onChange={formik.handleChange("mobile")}
                onBlur={formik.handleBlur("mobile")}
              />
              <div className="error">
                {formik.touched.mobile && formik.errors.mobile}
              </div>
            </div>
          </div>

          {edit === false && (
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          )}
        </form>
      </div>
    </div>
  );

  // Render My Orders Tab
  const renderMyOrders = () => (
    <div className="row">
      <div className="col-12">
        <h3 className="mb-4 fw-bold">My Orders</h3>

        {!orderState || orderState.length === 0 ? (
          <div className="text-center py-5">
            <h5>No Orders Found</h5>
          </div>
        ) : (
          orderState.map((order) => (
            <div
              key={order._id}
              className="card mb-4 shadow-sm border-0"
              style={{ borderRadius: "12px" }}
            >
              {/* Order Header */}
              <div
                className="card-header d-flex justify-content-between align-items-center"
                style={{ background: "#f8f9fa" }}
              >
                <div>
                  <small className="text-muted">Order ID</small>
                  <div className="fw-semibold">{order._id}</div>
                </div>

                <div>
                  <small className="text-muted">Placed On</small>
                  <div className="fw-semibold">
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                <div>
                  <small className="text-muted">Total</small>
                  <div className="fw-bold text-success">
                    {formatPrice(order.totalPriceAfterDiscount)}
                  </div>
                </div>

                <span
                  className={`badge ${
                    order.orderStatus === "Delivered"
                      ? "bg-success"
                      : order.orderStatus === "Ordered"
                      ? "bg-warning text-dark"
                      : "bg-secondary"
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>

              {/* Order Items */}
              <div className="card-body">
                {order.orderItems?.map((item) => (
                  <div
                    key={item._id}
                    className="row align-items-center mb-3 border-bottom pb-3"
                  >
                    {/* Product Image */}
                    <div className="col-md-2">
                      {item?.product?.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt="product"
                          className="img-fluid rounded"
                        />
                      ) : (
                        <div
                          style={{
                            height: "80px",
                            background: "#eee",
                            borderRadius: "8px",
                          }}
                        ></div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="col-md-4">
                      <h6 className="mb-1">
                        {item?.product?.title || "Product Not Available"}
                      </h6>
                      <small className="text-muted">
                        Qty: {item.quantity}
                      </small>
                    </div>

                    {/* Price */}
                    <div className="col-md-3 fw-semibold">
                      {formatPrice(item.price)}
                    </div>

                    {/* Color */}
                    <div className="col-md-3">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            backgroundColor: item?.color?.title,
                            border: "1px solid #ccc",
                          }}
                        ></div>
                        <small>{item?.color?.title}</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render Referrals Tab - Premium Design
  const renderReferrals = () => (
    <div className="row">
      <div className="col-12">
        {/* Premium Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '16px',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
          
          <div className="d-flex align-items-center gap-3 mb-3 position-relative">
            <div className="bg-warning bg-opacity-25 p-3 rounded-circle" style={{ background: 'rgba(212, 175, 55, 0.2)' }}>
              <FiShare2 className="text-warning fs-4" style={{ color: '#d4af37' }} />
            </div>
            <div>
              <h4 className="mb-1 fw-bold" style={{ color: '#fff', fontFamily: "'Playfair Display', serif" }}>Refer & Earn</h4>
              <p className="mb-0" style={{ color: 'rgba(255,255,255,0.7)' }}>Share the love, earn rewards together!</p>
            </div>
          </div>
          
          {/* VIP Badge */}
          <div className="d-flex align-items-center gap-2 position-relative">
            <span style={{
              background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
              color: '#1a1a1a',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              <FiAward /> VIP Member
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              Level {Math.floor((referralState?.coins || 0) / 100) + 1}
            </span>
          </div>
        </motion.div>

        {/* Your Referral Code Section - Premium Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-4"
        >
          <div 
            className="card border-0" 
            style={{ 
              borderRadius: '16px',
              background: '#fff',
              boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Gradient Border Top */}
            <div style={{
              height: '4px',
              background: 'linear-gradient(90deg, #d4af37, #f4d03f, #d4af37)'
            }} />
            
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div 
                  className="p-3 rounded-circle" 
                  style={{ 
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
                    border: '1px solid rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <FiGift className="fs-5" style={{ color: '#d4af37' }} />
                </div>
                <div>
                  <h5 className="mb-1 fw-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Your Referral Code</h5>
                  <p className="text-muted mb-0 small">Share this code or link with friends and earn coins!</p>
                </div>
              </div>
              
              {isLoadingReferral ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-warning" role="status" style={{ color: '#d4af37' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : referralState?.referralCode || userReferralCode ? (
                <>
                  {/* Referral Code - Premium Display */}
                  <div 
                    className="mb-3 p-4" 
                    style={{ 
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                      borderRadius: '12px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4af37\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                      opacity: 0.5
                    }} />
                    <div className="d-flex align-items-center justify-content-between position-relative">
                      <div>
                        <small style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Your Code</small>
                        <div 
                          style={{ 
                            fontFamily: "'Courier New', monospace", 
                            fontSize: '1.75rem', 
                            fontWeight: 700,
                            letterSpacing: '4px',
                            color: '#d4af37'
                          }}
                        >
                          {userReferralCode || referralState.referralCode}
                        </div>
                      </div>
                      <button
                        className="btn d-flex align-items-center gap-2"
                        onClick={copyToClipboard}
                        style={{
                          background: copied ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                          color: '#d4af37',
                          padding: '10px 20px',
                          borderRadius: '8px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {copied ? <FiCheck /> : <FiCopy />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="flex-grow-1 p-3 rounded"
                      style={{ 
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        fontSize: '0.85rem',
                        color: '#6c757d',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {getReferralLink()}
                    </div>
                    <button
                      className="btn d-flex align-items-center gap-2"
                      onClick={copyLinkToClipboard}
                      style={{
                        background: copiedLink ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                        border: copiedLink ? '1px solid #d4af37' : '1px solid #d4af37',
                        color: copiedLink ? '#d4af37' : '#d4af37',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {copiedLink ? <FiCheck /> : <FiLink />}
                      {copiedLink ? "Copied!" : "Copy Link"}
                    </button>
                  </div>

                  {/* Share Buttons */}
                  <div className="mt-3 d-flex gap-2">
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join me on this amazing platform!',
                            text: `Use my referral code ${userReferralCode || referralState.referralCode} to sign up!`,
                            url: getReferralLink()
                          });
                        }
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      WhatsApp
                    </button>
                   
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">No referral code available</p>
                  <button 
                    className="btn"
                    onClick={() => dispatch(getReferralCode())}
                    style={{
                      background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                      color: '#1a1a1a',
                      border: 'none',
                      padding: '12px 32px',
                      borderRadius: '8px',
                      fontWeight: 600
                    }}
                  >
                    Generate Referral Code
                  </button>
                </div>
              )}

              {/* Stats - Premium Glassmorphism Cards */}
              <div className="row mt-4 g-3">
                <div className="col-md-4">
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="p-3 rounded"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255, 195, 0, 0.15) 0%, rgba(255, 215, 0, 0.05) 100%)',
                      border: '1px solid rgba(255, 195, 0, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded" style={{ background: 'rgba(255, 195, 0, 0.2)' }}>
                        <FiGift className="fs-4" style={{ color: '#ffc300' }} />
                      </div>
                      <div>
                        <small className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>My Coins</small>
                        <h3 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>{referralState?.coins || 0}</h3>
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-4">
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="p-3 rounded"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(0, 184, 148, 0.05) 100%)',
                      border: '1px solid rgba(0, 184, 148, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded" style={{ background: 'rgba(0, 184, 148, 0.2)' }}>
                        <FiUserCheck className="fs-4" style={{ color: '#00b894' }} />
                      </div>
                      <div>
                        <small className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Signed Up</small>
                        <h3 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>{referralState?.signedInCount || 0}</h3>
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-4">
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="p-3 rounded"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.15) 0%, rgba(108, 92, 231, 0.05) 100%)',
                      border: '1px solid rgba(108, 92, 231, 0.3)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded" style={{ background: 'rgba(108, 92, 231, 0.2)' }}>
                        <FiShoppingBag className="fs-4" style={{ color: '#6c5ce7' }} />
                      </div>
                      <div>
                        <small className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Ordered</small>
                        <h3 className="mb-0 fw-bold" style={{ color: '#1a1a1a' }}>{referralState?.orderedCount || 0}</h3>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* How it works - Premium Box */}
              <div 
                className="mt-4 p-3 rounded"
                style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  border: '1px dashed rgba(212, 175, 55, 0.4)'
                }}
              >
                <div className="d-flex align-items-start gap-3">
                  <FiStar className="fs-5 mt-1" style={{ color: '#d4af37', flexShrink: 0 }} />
                  <div>
                    <h6 className="mb-2 fw-bold" style={{ fontSize: '14px' }}>How it works</h6>
                    <p className="mb-0 small text-muted">
                      Earn 1 coin for every ₹10 spent by your referred friends. 
                      Coins are awarded when they complete their first order! 
                      <span className="text-warning fw-bold ms-1">🎉</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Apply Referral Code Section - Premium */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-4"
        >
          <div 
            className="card border-0" 
            style={{ 
              borderRadius: '16px',
              background: '#fff',
              boxShadow: '0 4px 30px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(90deg, #6c5ce7, #a29bfe, #6c5ce7)'
            }} />
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div 
                  className="p-2 rounded"
                  style={{ background: 'rgba(108, 92, 231, 0.1)' }}
                >
                  <FiChevronRight className="fs-5" style={{ color: '#6c5ce7' }} />
                </div>
                <h5 className="mb-0 fw-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Have a Referral Code?</h5>
              </div>
              <div className="d-flex gap-3">
                <div className="flex-grow-1" style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter referral code"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '2px solid #e9ecef',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      background: '#f8f9fa'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#d4af37';
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = '0 0 0 4px rgba(212, 175, 55, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e9ecef';
                      e.target.style.background = '#f8f9fa';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <button
                  className="btn"
                  onClick={handleApplyReferral}
                  disabled={!referralCodeInput.trim() || referralState?.isLoading}
                  style={{
                    background: referralCodeInput.trim() ? 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)' : '#e9ecef',
                    color: referralCodeInput.trim() ? '#1a1a1a' : '#6c757d',
                    border: 'none',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {referralState?.isLoading ? "Applying..." : "Apply"}
                </button>
              </div>
              <small className="text-muted mt-2 d-block">
                Enter a referral code shared by your friend to connect accounts and start earning together.
              </small>
            </div>
          </div>
        </motion.div>

        {/* Coin Activity - All / Credited / Debited */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-4"
        >
          <div
            className="card border-0"
            style={{
              borderRadius: "16px",
              background: "#fff",
              boxShadow: "0 4px 30px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #f59e0b, #fcd34d, #f59e0b)",
              }}
            />
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0 fw-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Coin Activity
                </h5>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => setCoinFilter("all")}
                    style={{
                      borderRadius: "999px",
                      padding: "6px 14px",
                      border: coinFilter === "all" ? "none" : "1px solid #d1d5db",
                      background: coinFilter === "all" ? "linear-gradient(135deg, #111827 0%, #1f2937 100%)" : "#fff",
                      color: coinFilter === "all" ? "#fff" : "#374151",
                      fontWeight: 600,
                    }}
                  >
                    All
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setCoinFilter("credited")}
                    style={{
                      borderRadius: "999px",
                      padding: "6px 14px",
                      border: coinFilter === "credited" ? "none" : "1px solid #d1d5db",
                      background: coinFilter === "credited" ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)" : "#fff",
                      color: coinFilter === "credited" ? "#fff" : "#374151",
                      fontWeight: 600,
                    }}
                  >
                    Credited
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => setCoinFilter("debited")}
                    style={{
                      borderRadius: "999px",
                      padding: "6px 14px",
                      border: coinFilter === "debited" ? "none" : "1px solid #d1d5db",
                      background: coinFilter === "debited" ? "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)" : "#fff",
                      color: coinFilter === "debited" ? "#fff" : "#374151",
                      fontWeight: 600,
                    }}
                  >
                    Debited
                  </button>
                </div>
              </div>

              {filteredCoinTransactions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d" }}>Type</th>
                        <th style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d" }}>Details</th>
                        <th style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d" }}>From (Contact)</th>
                        <th style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d" }}>Order</th>
                        <th style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d" }}>Coins</th>
                        <th style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#6c757d" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCoinTransactions.map((txn) => (
                        <tr key={txn._id || `${txn.type}-${txn.createdAt}`}>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: txn.type === "credit"
                                  ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
                                  : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                                color: "#fff",
                                padding: "6px 10px",
                                borderRadius: "999px",
                                fontSize: "11px",
                                textTransform: "capitalize",
                              }}
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td>{getCoinTxnLabel(txn)}</td>
                          <td style={{ fontSize: "13px", color: "#374151" }}>
                            {txn?.relatedUser ? (
                              <div>
                                <div className="fw-semibold">{txn.relatedUser.name}</div>
                                <div className="text-muted">{txn.relatedUser.mobile}</div>
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td style={{ fontSize: "13px", color: "#374151" }}>
                            {txn?.orderInfo ? (
                              <div>
                                <div className="fw-semibold">{txn.orderInfo.orderTitle || "Order"}</div>
                                <div className="text-muted">{txn.orderInfo.orderId}</div>
                              </div>
                            ) : txn?.metadata?.orderId ? (
                              <span className="text-muted">{txn.metadata.orderId}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className={txn.type === "credit" ? "text-success fw-bold" : "text-danger fw-bold"}>
                            {txn.type === "credit" ? "+" : "-"}{txn.coins || 0}
                          </td>
                          <td style={{ color: "#6b7280", fontSize: "13px" }}>{formatDateTime(txn.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  No coin activity found for this filter.
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Referred Users List - Premium Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div 
            className="card border-0" 
            style={{ 
              borderRadius: '16px',
              background: '#fff',
              boxShadow: '0 4px 30px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{
              height: '4px',
              background: 'linear-gradient(90deg, #00b894, #55efc4, #00b894)'
            }} />
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="p-2 rounded"
                    style={{ background: 'rgba(0, 184, 148, 0.1)' }}
                  >
                    <FiUsers className="fs-5" style={{ color: '#00b894' }} />
                  </div>
                  <h5 className="mb-0 fw-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Referred Users</h5>
                </div>
                {referralState?.referrals && referralState.referrals.length > 0 && (
                  <span 
                    className="badge"
                    style={{
                      background: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
                      color: '#fff',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {referralState.referrals.length} {referralState.referrals.length === 1 ? 'User' : 'Users'}
                  </span>
                )}
              </div>
              
              {referralState?.referrals && referralState.referrals.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: 'none', background: 'transparent', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6c757d', padding: '12px 16px' }}>Name</th>
                        <th style={{ border: 'none', background: 'transparent', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6c757d', padding: '12px 16px' }}>Mobile</th>
                        <th style={{ border: 'none', background: 'transparent', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6c757d', padding: '12px 16px' }}>Joined On</th>
                        <th style={{ border: 'none', background: 'transparent', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6c757d', padding: '12px 16px' }}>Status</th>
                        <th style={{ border: 'none', background: 'transparent', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#6c757d', padding: '12px 16px' }}>Lifetime Coins Earned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralState.referrals.map((ref, index) => (
                        <motion.tr 
                          key={ref._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          style={{ 
                            background: '#fff',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                            borderRadius: '12px'
                          }}
                        >
                          <td style={{ border: 'none', padding: '16px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                            <div className="d-flex align-items-center gap-3">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                                  color: '#d4af37',
                                  fontWeight: 600,
                                  fontSize: '14px'
                                }}
                              >
                                {ref.firstname?.charAt(0)}{ref.lastname?.charAt(0)}
                              </div>
                              <span className="fw-semibold" style={{ color: '#1a1a1a' }}>{ref.firstname} {ref.lastname}</span>
                            </div>
                          </td>
                          <td style={{ border: 'none', padding: '16px', color: '#6c757d' }}>{ref.mobile}</td>
                          <td style={{ border: 'none', padding: '16px', color: '#6c757d' }}>{formatDate(ref.createdAt)}</td>
                          <td style={{ border: 'none', padding: '16px' }}>
                            {ref.status === "ordered" ? (
                              <span 
                                className="badge d-flex align-items-center gap-1" 
                                style={{ 
                                  width: 'fit-content',
                                  background: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
                                  color: '#fff',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                <FiShoppingBag /> Ordered
                              </span>
                            ) : (
                              <span 
                                className="badge d-flex align-items-center gap-1" 
                                style={{ 
                                  width: 'fit-content',
                                  background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                                  color: '#fff',
                                  padding: '6px 12px',
                                  borderRadius: '20px',
                                  fontSize: '11px',
                                  fontWeight: 600
                                }}
                              >
                                <FiUserCheck /> Signed In
                              </span>
                            )}
                          </td>
                          <td style={{ border: 'none', padding: '16px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                            <span 
                              className="badge"
                              style={{
                                background: 'linear-gradient(135deg, #ffc300 0%, #ffd700 100%)',
                                color: '#1a1a1a',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: 700
                              }}
                            >
                              <FiGift className="me-1" />
                              {ref.referrerEarnedCoins || 0}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5">
                  <div 
                    className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                    style={{
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                      borderRadius: '50%'
                    }}
                  >
                    <FiUsers className="fs-1" style={{ color: '#d4af37', opacity: 0.5 }} />
                  </div>
                  <h6 className="mb-2" style={{ color: '#1a1a1a' }}>No referrals yet</h6>
                  <p className="text-muted mb-0" style={{ maxWidth: '300px', margin: '0 auto' }}>
                    Share your referral code with friends and start earning coins together!
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <>
      <BreadCrumb title="My Profile" />
      <Container class1="cart-wrapper home-wrapper-2 py-5">
        {/* Tab Navigation */}
        <div className="row mb-4">
          <div className="col-12">
            <ul className="nav nav-pills">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
                  onClick={() => setActiveTab("profile")}
                  style={{ 
                    borderRadius: "8px",
                    marginRight: "8px",
                    backgroundColor: activeTab === "profile" ? "#febd69" : "transparent",
                    color: activeTab === "profile" ? "#1a1a1a" : "#1a1a1a",
                    border: activeTab === "profile" ? "none" : "1px solid #ddd"
                  }}
                >
                  Profile Info
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
                  onClick={() => setActiveTab("orders")}
                  style={{ 
                    borderRadius: "8px",
                    marginRight: "8px",
                    backgroundColor: activeTab === "orders" ? "#febd69" : "transparent",
                    color: activeTab === "orders" ? "#1a1a1a" : "#1a1a1a",
                    border: activeTab === "orders" ? "none" : "1px solid #ddd"
                  }}
                >
                  My Orders
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "referrals" ? "active" : ""}`}
                  onClick={() => setActiveTab("referrals")}
                  style={{ 
                    borderRadius: "8px",
                    backgroundColor: activeTab === "referrals" ? "#febd69" : "transparent",
                    color: activeTab === "referrals" ? "#1a1a1a" : "#1a1a1a",
                    border: activeTab === "referrals" ? "none" : "1px solid #ddd"
                  }}
                >
                  Referrals
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && renderProfileInfo()}
        {activeTab === "orders" && renderMyOrders()}
        {activeTab === "referrals" && renderReferrals()}
      </Container>
    </>
  );
};

export default Profile;
