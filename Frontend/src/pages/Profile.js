import React, { useState, useEffect } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Container from "../components/Container";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, getOrders, getMyReferrals, applyReferralCode, getReferralCode } from "../features/user/userSlice";
import { FiEdit, FiCopy, FiCheck, FiShare2, FiUsers, FiGift, FiLink, FiUserCheck, FiShoppingBag } from "react-icons/fi";

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
  const getReferralCode = () => {
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
  
  const userReferralCode = getReferralCode();
  
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

  // Render Referrals Tab
  const renderReferrals = () => (
    <div className="row">
      <div className="col-12">
        <h3 className="mb-4 fw-bold">My Referrals</h3>

        {/* Your Referral Code Section */}
        <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                <FiShare2 className="text-primary fs-4" />
              </div>
              <div>
                <h5 className="mb-1">Your Referral Code</h5>
                <p className="text-muted mb-0">Share this code or link with friends and earn coins!</p>
              </div>
            </div>
            
            {isLoadingReferral ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : referralState?.referralCode || userReferralCode ? (
              <>
                {/* Referral Code */}
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div 
                    className="flex-grow-1 p-3 bg-light rounded"
                    style={{ fontFamily: "monospace", fontSize: "1.25rem", letterSpacing: "2px" }}
                  >
                    {userReferralCode || referralState.referralCode}
                  </div>
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={copyToClipboard}
                  >
                    {copied ? <FiCheck /> : <FiCopy />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Referral Link */}
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="flex-grow-1 p-3 bg-light rounded text-truncate"
                    style={{ fontSize: "0.9rem" }}
                  >
                    {getReferralLink()}
                  </div>
                  <button
                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                    onClick={copyLinkToClipboard}
                  >
                    {copiedLink ? <FiCheck /> : <FiLink />}
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-muted">No referral code available</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => dispatch(getReferralCode())}
                >
                  Generate Referral Code
                </button>
              </div>
            )}

            {/* Stats - Now with Coins */}
            <div className="row mt-4">
              <div className="col-md-4">
                <div className="p-3 bg-warning bg-opacity-10 rounded">
                  <div className="d-flex align-items-center gap-2">
                    <FiGift className="text-warning fs-5" />
                    <div>
                      <small className="text-muted">My Coins</small>
                      <h4 className="mb-0">{referralState?.coins || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-info bg-opacity-10 rounded">
                  <div className="d-flex align-items-center gap-2">
                    <FiUserCheck className="text-info fs-5" />
                    <div>
                      <small className="text-muted">Signed Up</small>
                      <h4 className="mb-0">{referralState?.signedInCount || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 bg-success bg-opacity-10 rounded">
                  <div className="d-flex align-items-center gap-2">
                    <FiShoppingBag className="text-success fs-5" />
                    <div>
                      <small className="text-muted">Ordered</small>
                      <h4 className="mb-0">{referralState?.orderedCount || 0}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-light rounded">
              <small className="text-muted">
                <strong>How it works:</strong> Earn 1 coin for every ₹10 spent by your referred friends. 
                Coins are awarded when they complete their first order!
              </small>
            </div>
          </div>
        </div>

        {/* Apply Referral Code Section */}
        <div className="card mb-4 border-0 shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            <h5 className="mb-3">Have a Referral Code?</h5>
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Enter referral code"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
              />
              <button
                className="btn btn-outline-primary"
                onClick={handleApplyReferral}
                disabled={!referralCodeInput.trim() || referralState?.isLoading}
              >
                {referralState?.isLoading ? "Applying..." : "Apply"}
              </button>
            </div>
            <small className="text-muted mt-2 d-block">
              Enter a referral code shared by your friend to connect accounts and start earning together.
            </small>
          </div>
        </div>

        {/* Referred Users List with Detailed Status */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            <h5 className="mb-3">Referred Users</h5>
            {referralState?.referrals && referralState.referrals.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Joined On</th>
                      <th>Status</th>
                      <th>Coins Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralState.referrals.map((ref) => (
                      <tr key={ref._id}>
                        <td>{ref.firstname} {ref.lastname}</td>
                        <td>{ref.mobile}</td>
                        <td>{formatDate(ref.createdAt)}</td>
                        <td>
                          {ref.status === "ordered" ? (
                            <span className="badge bg-success d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
                              <FiShoppingBag /> Ordered
                            </span>
                          ) : (
                            <span className="badge bg-info d-flex align-items-center gap-1" style={{ width: "fit-content" }}>
                              <FiUserCheck /> Signed In
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark">
                            <FiGift className="me-1" />
                            {ref.coins || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <FiUsers className="text-muted fs-1 mb-2" />
                <p className="text-muted mb-0">No referrals yet. Share your code to get started!</p>
              </div>
            )}
          </div>
        </div>
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
