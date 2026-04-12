import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Container from "../components/Container";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, getOrders, getMyReferrals, applyReferralCode, getReferralCode } from "../features/user/userSlice";
import { FiEdit, FiCopy, FiCheck, FiShare2, FiUsers, FiGift, FiLink, FiUserCheck, FiShoppingBag, FiAward, FiStar, FiChevronRight, FiPackage } from "react-icons/fi";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const ORDERS_LIMIT = 10;

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
  const ordersData  = useSelector((state) => state?.auth?.getorderedProduct);
  const orders      = ordersData?.orders  || [];
  const hasMore     = ordersData?.hasMore ?? false;
  const currentPage = ordersData?.page    || 0;
  const isOrdersLoading = useSelector((state) => state?.auth?.isLoading);
  const referralState = useSelector((state) => state.auth);
  const sentinelRef = useRef(null);
  
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
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: (values) => {
      dispatch(updateProfile({ data: values, config2: config2 }));
      setEdit(true);
    },
  });

  // Fetch orders when tab is changed to orders
  useEffect(() => {
    if (activeTab === "orders") {
      dispatch(getOrders({ page: 1, limit: ORDERS_LIMIT }));
    }
  }, [activeTab, dispatch]);

  const loadMoreOrders = useCallback(() => {
    if (!isOrdersLoading && hasMore) {
      dispatch(getOrders({ page: currentPage + 1, limit: ORDERS_LIMIT }));
    }
  }, [dispatch, isOrdersLoading, hasMore, currentPage]);

  useEffect(() => {
    if (activeTab !== "orders") return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreOrders(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, loadMoreOrders]);

  // Fetch referrals when tab is changed to referrals
  useEffect(() => {
    if (activeTab === "referrals" && getTokenFromLocalStorage?.token) {
      dispatch(getMyReferrals({ page: 1, limit: 10 }));
    }
  }, [activeTab, dispatch]);

  // Fetch order total on profile load so the summary count is available
  useEffect(() => {
    if (getTokenFromLocalStorage?.token && !ordersData?.total) {
      dispatch(getOrders({ page: 1, limit: 1 }));
    }
  }, [dispatch, getTokenFromLocalStorage?.token, ordersData?.total]);

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
  const coinTransactionsPage = referralState?.coinTransactionsPage || 1;
  const coinTransactionsLimit = referralState?.coinTransactionsLimit || 10;
  const coinTransactionsHasMore = referralState?.coinTransactionsHasMore || false;
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

  const loadMoreCoinTransactions = () => {
    if (!referralState?.isLoading && coinTransactionsHasMore) {
      dispatch(
        getMyReferrals({ page: coinTransactionsPage + 1, limit: coinTransactionsLimit })
      );
    }
  };

  const renderProfileSummary = () => (
    <div className="row mb-4">
      <div className="col-12">
        <div
          className="card border-0"
          style={{
            borderRadius: 26,
            background: "#fff",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #febd69, #ffda7a)",
              padding: "28px",
            }}
          >
            <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 24,
                    background: "#1a1a1a",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 32,
                    fontWeight: 700,
                  }}
                >
                  {(userState?.firstname?.[0] || "U").toUpperCase()}
                  {(userState?.lastname?.[0] || "").toUpperCase()}
                </div>
                <div>
                  <p className="mb-1 text-uppercase fw-bold small text-dark opacity-75">
                    Welcome back
                  </p>
                  <h2 className="mb-1 fw-bold" style={{ color: "#111827" }}>
                    {userState?.firstname || "User"} {userState?.lastname || ""}
                  </h2>
                  <p className="mb-0 text-muted">{userState?.email}</p>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3">
                <div
                  className="p-3 rounded-4"
                  style={{
                    minWidth: 140,
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                >
                  <p className="mb-1 text-uppercase small text-muted">Orders Placed</p>
                  <h4 className="mb-0 fw-bold">{ordersData?.total || 0}</h4>
                </div>
                <div
                  className="p-3 rounded-4"
                  style={{
                    minWidth: 140,
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                >
                  <p className="mb-1 text-uppercase small text-muted">Referral Coins</p>
                  <h4 className="mb-0 fw-bold">{referralState?.coins || 0}</h4>
                </div>
                <div
                  className="p-3 rounded-4"
                  style={{
                    minWidth: 140,
                    background: "rgba(255,255,255,0.9)",
                    border: "1px solid rgba(255,255,255,0.6)",
                  }}
                >
                  <p className="mb-1 text-uppercase small text-muted">Referrals</p>
                  <h4 className="mb-0 fw-bold">{referralState?.referrals?.length || 0}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleApplyReferral = () => {
    if (referralCodeInput.trim()) {
      dispatch(applyReferralCode(referralCodeInput.trim()));
      setReferralCodeInput("");
    }
  };

  // Render Profile Info Tab
  const renderProfileInfo = () => (
    <div className="row g-4">
      <div className="col-12 col-lg-4">
        <div
          className="card h-100 p-4"
          style={{
            borderRadius: 22,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "#febd69",
                display: "grid",
                placeItems: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "#1a1a1a",
              }}
            >
              {(userState?.firstname?.[0] || "U").toUpperCase()}
              {(userState?.lastname?.[0] || "").toUpperCase()}
            </div>
            <div>
              <h5 className="mb-1 fw-bold">
                {userState?.firstname || "User"} {userState?.lastname || ""}
              </h5>
              <p className="text-muted small mb-1">{userState?.email}</p>
              <p className="text-muted small mb-0">
                {userState?.mobile || "Mobile number not set"}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-3 text-muted small">
              Quick overview of your account metrics.
            </div>
            <div className="d-flex flex-column gap-3">
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3"
                style={{ background: "#f8fafc" }}
              >
                <span className="text-muted small">Orders Placed</span>
                <strong>{ordersData?.total || 0}</strong>
              </div>
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3"
                style={{ background: "#f8fafc" }}
              >
                <span className="text-muted small">Referral Coins</span>
                <strong>{referralState?.coins || 0}</strong>
              </div>
              <div
                className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3"
                style={{ background: "#f8fafc" }}
              >
                <span className="text-muted small">Active Referrals</span>
                <strong>{referralState?.referrals?.length || 0}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-warning w-100"
            onClick={() => setEdit(false)}
            style={{ borderRadius: 14 }}
          >
            <FiEdit className="me-2" /> Update Profile
          </button>
        </div>
      </div>

      <div className="col-12 col-lg-8">
        <div
          className="card p-4"
          style={{
            borderRadius: 22,
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div className="d-flex justify-content-between align-items-start flex-column flex-md-row gap-3 mb-4">
            <div>
              <h3 className="mb-2 fw-bold">Profile Details</h3>
              <p className="text-muted mb-0 small">
                Review and update your information for a smoother shopping experience.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={() => setEdit(false)}
              style={{ borderRadius: 14, minWidth: 120 }}
            >
              <FiEdit className="me-1" /> Edit
            </button>
          </div>

          <form onSubmit={formik.handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="firstname" className="form-label">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstname"
                  id="firstname"
                  className="form-control"
                  disabled={edit}
                  value={formik.values.firstname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <div className="error small text-danger mt-1">
                  {formik.touched.firstname && formik.errors.firstname}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="lastname" className="form-label">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastname"
                  id="lastname"
                  className="form-control"
                  disabled={edit}
                  value={formik.values.lastname}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <div className="error small text-danger mt-1">
                  {formik.touched.lastname && formik.errors.lastname}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="form-control"
                  disabled={edit}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <div className="error small text-danger mt-1">
                  {formik.touched.email && formik.errors.email}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <label htmlFor="mobile" className="form-label">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobile"
                  id="mobile"
                  className="form-control"
                  disabled={edit}
                  value={formik.values.mobile}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                <div className="error small text-danger mt-1">
                  {formik.touched.mobile && formik.errors.mobile}
                </div>
              </div>
            </div>

            {!edit && (
              <button
                type="submit"
                className="btn btn-primary mt-4"
                style={{ borderRadius: 14 }}
              >
                Save Changes
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  const fmtOrderPrice = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
  const fmtOrderDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const statusStyle = (s) => {
    const m = {
      Delivered: { bg: "#dcfce7", color: "#166534" },
      Shipped:   { bg: "#dbeafe", color: "#1e40af" },
      Ordered:   { bg: "#fef9c3", color: "#854d0e" },
      Processed: { bg: "#e0e7ff", color: "#3730a3" },
      Cancelled: { bg: "#fee2e2", color: "#991b1b" },
    };
    return m[s] || { bg: "#f3f4f6", color: "#374151" };
  };

  const renderOrderCard = (order) => {
    const subtotal      = order.totalPrice || 0;
    const paid          = order.totalPriceAfterDiscount || 0;
    const b             = order.discountBreakdown || {};
    const coinDiscount  = b.coinDiscount    || order.coinAmount || 0;
    const offerDiscount = b.offerDiscount   || 0;
    const directDiscount = b.directDiscount || 0;
    const totalDiscount  = subtotal - paid;
    const sc = statusStyle(order.orderStatus);

    return (
      <div
        key={order._id}
        className="card mb-4 border-0"
        style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}
      >
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3"
          style={{ background: "#f8f9fa", borderBottom: "1px solid #eee" }}
        >
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>Order ID</div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>#{order._id?.slice(-10).toUpperCase()}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>Placed On</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtOrderDate(order.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>Total Paid</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#16a34a" }}>{fmtOrderPrice(paid)}</div>
          </div>
          <span style={{ background: sc.bg, color: sc.color, padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {order.orderStatus}
          </span>
        </div>

        <div className="card-body px-4 py-3">
          {order.orderItems?.map((item, idx) => {
            const isLast = idx === order.orderItems.length - 1;
            const border = isLast ? "none" : "1px solid #f0f0f0";

            if (item?.isBundle) {
              return (
                <div key={idx} className="d-flex align-items-start gap-3 mb-3 pb-3" style={{ borderBottom: border, padding: "10px 12px", borderRadius: 14, background: "#f8fafc" }}>
                  <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#0f172a,#334155)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FiPackage style={{ color: "#fff", fontSize: 26 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span style={{ background: "#0f172a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>BUNDLE</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{item?.bundleTitle || "Bundle"}</span>
                    </div>
                    <div className="d-flex flex-column gap-2 mt-2">
                      {item?.bundleProducts?.map((bp, i) => (
                        <div key={i} style={{ padding: "8px 10px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{bp.title} ×{bp.quantity}</div>
                          <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                            {bp.selectedColorLabel && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel), border: "1px solid #cbd5e1" }} />
                                Color selected
                              </span>
                            )}
                            {bp.selectedSize && <span style={{ fontSize: 12, color: "#64748b" }}>Size {bp.selectedSize}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{fmtOrderPrice(item.price * item.quantity)}</div>
                    <div style={{ fontSize: 11, color: "#0f766e", fontWeight: 700 }}>Bundle Price</div>
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="d-flex align-items-center gap-3 mb-3 pb-3" style={{ borderBottom: border }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f5f5f5" }}>
                  {item?.product?.images?.[0]?.url ? (
                    <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FiPackage style={{ color: "#ccc", fontSize: 24 }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item?.product?.title || "Product"}</div>
                  <div className="d-flex align-items-center gap-2">
                    {item?.color && (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: getColorSwatch(item.color), border: "1px solid #ddd", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 12, color: "#999" }}>
                      {item?.color ? `${getReadableColorName(item.color)} • ` : ""}Qty: {item.quantity}
                    </span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>• {fmtOrderPrice(item.price)} each</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{fmtOrderPrice(item.price * item.quantity)}</div>
                </div>
              </div>
            );
          })}

          <div className="mt-2 pt-3" style={{ borderTop: "2px solid #f0f0f0" }}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ color: "#666", fontSize: 14 }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmtOrderPrice(subtotal)}</span>
            </div>
            {order.mode !== "OFFLINE" && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>Shipping</span>
                <span style={{ fontWeight: 600 }}>₹100</span>
              </div>
            )}
            {directDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>🏷️ Direct Discount</span>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>-{fmtOrderPrice(directDiscount)}</span>
              </div>
            )}
            {offerDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>🎁 Offer Discount</span>
                <span style={{ color: "#f97316", fontWeight: 600 }}>-{fmtOrderPrice(offerDiscount)}</span>
              </div>
            )}
            {coinDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>🪙 Coins Redeemed ({order.coinsUsed || coinDiscount} coins)</span>
                <span style={{ color: "#7c3aed", fontWeight: 600 }}>-{fmtOrderPrice(coinDiscount)}</span>
              </div>
            )}
            {!directDiscount && !offerDiscount && !coinDiscount && totalDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>Discount</span>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>-{fmtOrderPrice(totalDiscount)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between mt-2 pt-2" style={{ borderTop: "1px solid #eee" }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total Paid</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>{fmtOrderPrice(paid)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

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

              {coinTransactionsHasMore && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={loadMoreCoinTransactions}
                    disabled={referralState?.isLoading}
                    style={{ borderRadius: 14 }}
                  >
                    {referralState?.isLoading ? "Loading more..." : "Load More Transactions"}
                  </button>
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
        {renderProfileSummary()}
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
        {activeTab === "referrals" && renderReferrals()}
      </Container>
    </>
  );
};

export default Profile;
