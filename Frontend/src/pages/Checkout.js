import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack, BiCheck } from "react-icons/bi";
import { FaCoins, FaShieldAlt, FaSpinner, FaMoneyBillWave } from "react-icons/fa";
import { FiMapPin, FiCreditCard, FiPackage, FiChevronRight, FiTruck } from "react-icons/fi";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { base_url, getConfig } from "../utils/axiosConfig";
import { createAnOrder, deleteUserCart, getUserCart, resetState, getAddresses } from "../features/user/userSlice";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";
import trackingService from "../utils/trackingService";
import "./Checkout.css";


const shippingSchema = yup.object({
  firstname: yup.string().required("First name is required"),
  lastname: yup.string().required("Last name is required"),
  address: yup.string().required("Address is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
  country: yup.string().required("Country is required"),
  pincode: yup.number().required("Pincode is required").positive().integer(),
});

const STEPS = [
  { id: 1, label: "Delivery", icon: FiMapPin },
  { id: 2, label: "Payment", icon: FiCreditCard },
  { id: 3, label: "Done", icon: FiPackage },
];

const Field = ({ formik, label, name, type = "text", placeholder, half }) => (
  <div className={half ? "co-field co-field-half" : "co-field"}>
    <label className="co-label">{label}</label>
    <input
      type={type}
      className={`co-input${formik.touched[name] && formik.errors[name] ? " co-input-err" : ""}`}
      placeholder={placeholder}
      name={name}
      value={formik.values[name]}
      onChange={formik.handleChange(name)}
      onBlur={formik.handleBlur(name)}
    />
    {formik.touched[name] && formik.errors[name] && (
      <span className="co-err">{formik.errors[name]}</span>
    )}
  </div>
);

const SelectField = ({ formik, label, name, options, onChange }) => (
  <div className="co-field co-field-half">
    <label className="co-label">{label}</label>
    <select
      className={`co-input co-select${formik.touched[name] && formik.errors[name] ? " co-input-err" : ""}`}
      name={name}
      value={formik.values[name]}
      onChange={(e) => { formik.handleChange(name)(e); onChange && onChange(e.target.value); }}
      onBlur={formik.handleBlur(name)}
    >
      <option value="">Select {label}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    {formik.touched[name] && formik.errors[name] && (
      <span className="co-err">{formik.errors[name]}</span>
    )}
  </div>
);

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartState = useSelector((s) => s?.auth?.cartProducts);
  const authState = useSelector((s) => s?.auth);
  const userCoins = useSelector((s) => s?.auth?.coins) || 0;
  const savedAddresses = useSelector((s) => s?.auth?.addresses || []);
  const checkoutLoading = useSelector((s) => s?.auth?.isLoading);
  // checkoutLoading is handled by GlobalLoader globally — no local loader needed

  const [totalAmount, setTotalAmount] = useState(0);
  const [offerDiscount, setOfferDiscount] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartProductState, setCartProductState] = useState([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  // GST settings from backend
  const [gstSettings, setGstSettings] = useState({ cgst: 0, sgst: 0, igst: 0, storeState: "Gujarat", taxIncluded: false, shippingCharge: 100 });
  const [gstType, setGstType] = useState("NONE");
  const [cgstAmt, setCgstAmt] = useState(0);
  const [sgstAmt, setSgstAmt] = useState(0);
  const [igstAmt, setIgstAmt] = useState(0);
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    dispatch(getUserCart(getConfig()));
    dispatch(getAddresses());

    // Fetch GST settings from public endpoint (no auth needed)
    axios.get(`${base_url}user/public-settings`).then(res => {
      setGstSettings({
        cgst: res.data.cgst || 0,
        sgst: res.data.sgst || 0,
        igst: res.data.igst || 0,
        storeState: res.data.storeState || "Gujarat",
        taxIncluded: res.data.taxIncluded === true,
        shippingCharge: res.data.shippingCharge ?? 100,
      });
    }).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!cartState?.length) { setTotalAmount(0); setOfferDiscount(0); return; }
    let subtotal = 0;
    let savings = 0;
    cartState.forEach(i => {
      if (i.isFreeItem) {
        savings += Number(i.originalPrice || 0) * Number(i.quantity);
      } else {
        subtotal += Number(i.quantity) * Number(i.price);
        if (i.offerLabel && i.originalPrice && i.originalPrice > i.price)
          savings += (i.originalPrice - i.price) * i.quantity;
      }
    });
    setTotalAmount(subtotal);
    setOfferDiscount(savings);
    const items = cartState.map(i => ({
      productId: i.productId?._id || i.productId,
      productName: i.productId?.title || i.bundleTitle || 'Unknown',
      quantity: i.quantity,
      price: i.price,
    }));
    trackingService.trackCheckoutStarted(items, subtotal);
  }, [cartState]);

  // Per-offer savings breakdown
  const offerBreakdown = (cartState || []).reduce((acc, item) => {
    const label = item.offerLabel;
    if (!label) return acc;
    let saving = 0;
    if (item.isFreeItem) saving = Number(item.originalPrice || 0) * Number(item.quantity);
    else if (item.originalPrice && item.originalPrice > item.price)
      saving = (item.originalPrice - item.price) * item.quantity;
    if (saving <= 0) return acc;
    acc[label] = (acc[label] || 0) + saving;
    return acc;
  }, {});

  useEffect(() => {
    setCartProductState((cartState || []).map((item) =>
      item?.isBundle
        ? { product: item.productId?._id || null, quantity: item.quantity, color: null, size: null, price: item.price, isBundle: true, bundleId: item.bundleId, bundleTitle: item.bundleTitle, bundleProducts: item.bundleProducts || [] }
        : { product: item.productId?._id || item.productId, quantity: item.quantity, color: item.color?._id || item.color, size: item.size || null, price: item.price, isFreeItem: item.isFreeItem || false, offerLabel: item.offerLabel || null }
    ));
  }, [cartState]);

  // Recalculate GST when state or totalAmount changes
  useEffect(() => {
    if (!totalAmount) {
      setCgstAmt(0); setSgstAmt(0); setIgstAmt(0);
      setGstType("NONE");
      return;
    }
    // Use selected state, or fall back to store's default state (intra-state)
    const effectiveState = selectedState || gstSettings.storeState;
    if (effectiveState === gstSettings.storeState) {
      setGstType("CGST_SGST");
      if (gstSettings.taxIncluded) {
        const totalRate = (gstSettings.cgst + gstSettings.sgst) / 100;
        const base = totalRate > 0 ? totalAmount / (1 + totalRate) : totalAmount;
        setCgstAmt(base * gstSettings.cgst / 100);
        setSgstAmt(base * gstSettings.sgst / 100);
      } else {
        setCgstAmt(totalAmount * gstSettings.cgst / 100);
        setSgstAmt(totalAmount * gstSettings.sgst / 100);
      }
      setIgstAmt(0);
    } else {
      setGstType("IGST");
      if (gstSettings.taxIncluded) {
        const totalRate = gstSettings.igst / 100;
        const base = totalRate > 0 ? totalAmount / (1 + totalRate) : totalAmount;
        setIgstAmt(base * totalRate);
      } else {
        setIgstAmt(totalAmount * gstSettings.igst / 100);
      }
      setCgstAmt(0); setSgstAmt(0);
    }
  }, [selectedState, totalAmount, gstSettings]);

  const taxAmount = gstType === "IGST" ? igstAmt : cgstAmt + sgstAmt;
  const maxCoinDiscount = Math.min(userCoins, totalAmount + gstSettings.shippingCharge + (gstSettings.taxIncluded ? 0 : taxAmount));
  const coinDiscount = useCoins ? Math.min(coinAmount, maxCoinDiscount) : 0;
  const finalAmount = Math.max(0, totalAmount + gstSettings.shippingCharge + (gstSettings.taxIncluded ? 0 : taxAmount) - coinDiscount);

  const formik = useFormik({
    initialValues: { firstname: "", lastname: "", address: "", state: "", city: "", country: "", pincode: "", other: "" },
    validationSchema: shippingSchema,
    onSubmit: async (values) => {
      localStorage.setItem("address", JSON.stringify(values));
      if (paymentMethod === "cod") {
        await codOrderHandler(values);
      } else {
        setCurrentStep(2);
        setIsProcessing(true);
        setTimeout(() => checkOutHandler(), 500);
      }
    },
  });

  const loadScript = (src) => new Promise((res) => {
    const s = document.createElement("script");
    s.src = src; s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });

  const codOrderHandler = async (values) => {
    try {
      setCurrentStep(2);
      setIsProcessing(true);
      await dispatch(createAnOrder({
        totalPrice: totalAmount,
        totalPriceAfterDiscount: finalAmount,
        orderItems: cartProductState,
        paymentInfo: { method: "COD", status: "Pending" },
        shippingInfo: values,
        coinsUsed: useCoins ? coinAmount : 0,
        coinAmount: coinDiscount,
        discountBreakdown: { directDiscount: 0, offerDiscount: offerDiscount, coinDiscount },
        gstBreakdown: { cgst: cgstAmt, sgst: sgstAmt, igst: igstAmt, cgstRate: gstSettings.cgst, sgstRate: gstSettings.sgst, igstRate: gstSettings.igst, gstType, taxableAmount: gstSettings.taxIncluded ? Math.round((totalAmount / (1 + (gstSettings.cgst + gstSettings.sgst + gstSettings.igst) / 100)) * 100) / 100 : totalAmount, taxIncluded: gstSettings.taxIncluded, shippingCharge: gstSettings.shippingCharge },
      }));
      await dispatch(deleteUserCart(getConfig()));
      localStorage.removeItem("address");
      dispatch(resetState());
      setCurrentStep(3);
      setIsProcessing(false);
      setTimeout(() => navigate("/my-orders"), 100);
    } catch (e) {
      alert("Failed to place order. Please try again.");
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  const checkOutHandler = async () => {
    try {
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok) { alert("Razorpay SDK failed to load"); setIsProcessing(false); return; }

      const result = await axios.post(`${base_url}user/order/checkout`, { amount: finalAmount }, getConfig());
      if (!result?.data) { alert("Order creation failed"); setIsProcessing(false); return; }

      const { amount, id: order_id, currency } = result.data.order;
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount, currency,
        name: "Yashoda Fashion",
        description: "Secure Payment",
        order_id,
        handler: async (response) => {
          try {
            setCurrentStep(3);
            const payRes = await axios.post(`${base_url}user/order/payment-verification`, {
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            }, getConfig());
            if (!payRes?.data) {
              trackingService.trackPaymentFailed(order_id, "Payment verification failed", "razorpay");
              alert("Payment verification failed");
              setIsProcessing(false);
              return;
            }

            // Track successful payment
            trackingService.trackPaymentSuccess(payRes.data.orderId || order_id, finalAmount, "razorpay");

            if (useCoins && coinDiscount > 0) {
              const stored = localStorage.getItem("customer");
              if (stored) {
                const p = JSON.parse(stored);
                localStorage.setItem("customer", JSON.stringify({ ...p, coins: Math.max(0, (p.coins || 0) - coinAmount) }));
              }
            }
            await dispatch(createAnOrder({
              totalPrice: totalAmount,
              totalPriceAfterDiscount: finalAmount,
              orderItems: cartProductState,
              paymentInfo: payRes.data,
              shippingInfo: JSON.parse(localStorage.getItem("address")),
              coinsUsed: useCoins ? coinAmount : 0,
              coinAmount: coinDiscount,
              discountBreakdown: { directDiscount: 0, offerDiscount: offerDiscount, coinDiscount },
              gstBreakdown: {
                cgst: cgstAmt,
                sgst: sgstAmt,
                igst: igstAmt,
                cgstRate: gstSettings.cgst,
                sgstRate: gstSettings.sgst,
                igstRate: gstSettings.igst,
                gstType,
                taxableAmount: gstSettings.taxIncluded
                  ? Math.round((totalAmount / (1 + (gstSettings.cgst + gstSettings.sgst + gstSettings.igst) / 100)) * 100) / 100
                  : totalAmount,
                taxIncluded: gstSettings.taxIncluded,
                shippingCharge: gstSettings.shippingCharge,
              },
            }));
            await dispatch(deleteUserCart(getConfig()));
            localStorage.removeItem("address");
            dispatch(resetState());
            setTimeout(() => navigate("/my-orders"), 100);
          } catch (e) {
            trackingService.trackPaymentFailed(order_id, e.message || "Payment processing failed", "razorpay");
            alert("Payment processing failed. Contact support if amount was deducted.");
            setIsProcessing(false); setCurrentStep(1);
          }
        },
        modal: { ondismiss: () => { setIsProcessing(false); setCurrentStep(1); } },
        prefill: { name: `${formik.values.firstname} ${formik.values.lastname}` },
        theme: { color: "#6366f1" },
      };
      new window.Razorpay(options).open();
    } catch (e) {
      alert("Failed to initiate payment. Please try again.");
      setIsProcessing(false); setCurrentStep(1);
    }
  };

  return (
    <>
      <div className="co-page">
        <Container class1="co-container">

          {/* ── Step Indicator ── */}
          <div className="co-steps">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = currentStep > step.id;
              const active = currentStep === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div className={`co-step${active ? " co-step-active" : ""}${done ? " co-step-done" : ""}`}>
                    <div className="co-step-circle">
                      {done ? <BiCheck size={16} /> : <Icon size={15} />}
                    </div>
                    <span className="co-step-label">{step.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`co-step-line${currentStep > step.id ? " co-step-line-done" : ""}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div className="co-layout">

            {/* ── LEFT: Form ── */}
            <div className="co-left">

              {/* Step 1 — Delivery */}
              {currentStep === 1 && (
                <div className="co-card">
                  <div className="co-card-head">
                    <div className="co-card-icon"><FiMapPin size={18} color="#6366f1" /></div>
                    <div>
                      <h5 className="co-card-title">Delivery Address</h5>
                      <p className="co-card-sub">Where should we deliver your order?</p>
                    </div>
                  </div>

                  {/* Contact info strip */}
                  <div className="co-contact-strip">
                    <div className="co-contact-avatar">
                      {authState?.user?.firstname?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="co-contact-name">{authState?.user?.firstname} {authState?.user?.lastname}</p>
                      <p className="co-contact-email">{authState?.user?.email}</p>
                    </div>
                  </div>

                  {/* Saved addresses picker */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-3">
                      <p className="co-label" style={{ marginBottom: 8 }}>Use a saved address</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {savedAddresses.map(addr => (
                          <button
                            key={addr._id}
                            type="button"
                            className="btn btn-sm"
                            style={{
                              borderRadius: 10,
                              border: "1px solid #e2e8f0",
                              background: "#f8fafc",
                              fontSize: 12,
                              textAlign: "left",
                              padding: "6px 12px",
                            }}
                            onClick={() => {
                              formik.setValues({
                                firstname: addr.firstname || "",
                                lastname: addr.lastname || "",
                                address: addr.address || "",
                                state: addr.state || "",
                                city: addr.city || "",
                                country: addr.country || "",
                                pincode: addr.pincode || "",
                                other: addr.other || "",
                              });
                              setSelectedState(addr.state || "");
                            }}
                          >
                            <span className="fw-semibold">{addr.label}</span> — {addr.address}, {addr.city}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={formik.handleSubmit} className="co-form">
                    <div className="co-row">
                      <SelectField formik={formik} label="Country" name="country" options={["India"]} />
                      <SelectField formik={formik} label="State" name="state" options={["Gujarat", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Rajasthan", "Uttar Pradesh", "West Bengal", "Telangana", "Punjab"]} onChange={setSelectedState} />
                    </div>
                    <div className="co-row">
                      <Field formik={formik} label="First Name" name="firstname" placeholder="First name" half />
                      <Field formik={formik} label="Last Name" name="lastname" placeholder="Last name" half />
                    </div>
                    <Field formik={formik} label="Street Address" name="address" placeholder="House no., street, area" />
                    <Field formik={formik} label="Landmark / Apt (optional)" name="other" placeholder="Landmark, apartment, floor" />
                    <div className="co-row">
                      <Field formik={formik} label="City" name="city" placeholder="City" half />
                      <Field formik={formik} label="Pincode" name="pincode" placeholder="6-digit pincode" type="number" half />
                    </div>

                    {/* Payment Method */}
                    <div className="co-payment-methods">
                      <p className="co-label" style={{ marginBottom: 10 }}>Payment Method</p>
                      <div className="co-pm-options">
                        <label className={`co-pm-card${paymentMethod === "online" ? " co-pm-selected" : ""}`}>
                          <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                          <FiCreditCard size={20} color={paymentMethod === "online" ? "#6366f1" : "#9ca3af"} />
                          <div>
                            <p className="co-pm-title">Online Payment</p>
                            <p className="co-pm-sub">UPI, Card, Net Banking</p>
                          </div>
                          {paymentMethod === "online" && <span className="co-pm-check"><BiCheck size={14} /></span>}
                        </label>
                        <label className={`co-pm-card${paymentMethod === "cod" ? " co-pm-selected" : ""}`}>
                          <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                          <FaMoneyBillWave size={20} color={paymentMethod === "cod" ? "#6366f1" : "#9ca3af"} />
                          <div>
                            <p className="co-pm-title">Cash on Delivery</p>
                            <p className="co-pm-sub">Pay when you receive</p>
                          </div>
                          {paymentMethod === "cod" && <span className="co-pm-check"><BiCheck size={14} /></span>}
                        </label>
                      </div>
                    </div>

                    {/* Coins toggle */}
                    {userCoins > 0 && (
                      <div className="co-coins-box">
                        <div className="co-coins-top">
                          <div className="d-flex align-items-center gap-2">
                            <FaCoins color="#f59e0b" size={18} />
                            <div>
                              <p className="co-coins-title">Use Reward Coins</p>
                              <p className="co-coins-sub">You have <strong>{userCoins}</strong> coins · 1 coin = ₹1</p>
                            </div>
                          </div>
                          <label className="co-toggle">
                            <input type="checkbox" checked={useCoins} onChange={(e) => {
                              setUseCoins(e.target.checked);
                              setCoinAmount(e.target.checked ? maxCoinDiscount : 0);
                            }} />
                            <span className="co-toggle-slider" />
                          </label>
                        </div>
                        {useCoins && (
                          <div className="co-coins-input-row">
                            <span className="co-coins-input-label">Coins to use:</span>
                            <input
                              type="number" min={0} max={maxCoinDiscount} value={coinAmount}
                              onChange={(e) => setCoinAmount(Math.min(parseInt(e.target.value) || 0, maxCoinDiscount))}
                              className="co-coins-input"
                            />
                            <span className="co-coins-saving">−₹{coinDiscount} off</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="co-form-actions">
                      <Link to="/cart" className="co-back-btn">
                        <BiArrowBack size={16} /> Back to Cart
                      </Link>
                      <button type="submit" className="co-pay-btn">
                        Continue to Payment <FiChevronRight size={16} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Step 2 — Processing */}
              {currentStep === 2 && (
                <div className="co-card co-processing-card">
                  <div className="co-processing-icon">
                    {isProcessing
                      ? <FaSpinner className="co-spin" size={48} color="#6366f1" />
                      : <FiCreditCard size={48} color="#6366f1" />
                    }
                  </div>
                  <h5 className="co-processing-title">
                    {isProcessing ? "Opening Payment Gateway…" : "Secure Payment"}
                  </h5>
                  <p className="co-processing-sub">
                    {isProcessing
                      ? "Please complete the payment in the Razorpay window."
                      : "You will be redirected to our secure payment gateway."}
                  </p>
                  {isProcessing && <div className="co-progress-bar"><div className="co-progress-fill" /></div>}
                  <div className="co-secure-badges">
                    <span className="co-secure-badge"><FaShieldAlt size={12} /> SSL Secured</span>
                    <span className="co-secure-badge"><FiTruck size={12} /> Fast Dispatch</span>
                  </div>
                </div>
              )}

              {/* Step 3 — Confirmed */}
              {currentStep === 3 && (
                <div className="co-card co-success-card">
                  <div className="co-success-circle">
                    <BiCheck size={36} color="#fff" />
                  </div>
                  <h5 className="co-success-title">Order Confirmed! 🎉</h5>
                  <p className="co-success-sub">Thank you! Your order has been placed successfully.</p>
                  <div className="co-success-actions">
                    <Link to="/my-orders" className="co-pay-btn">View My Orders</Link>
                    <Link to="/product" className="co-back-btn">Continue Shopping</Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="co-right">
              {/* Mobile accordion toggle */}
              <button className="co-summary-toggle d-lg-none" onClick={() => setSummaryOpen(!summaryOpen)}>
                <span>Order Summary · <strong>₹{finalAmount?.toLocaleString()}</strong></span>
                <FiChevronRight size={16} style={{ transform: summaryOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "0.2s" }} />
              </button>

              <div className={`co-summary-body${summaryOpen ? " co-summary-open" : ""}`}>
                <div className="co-summary-card">
                  <h6 className="co-summary-title">Order Summary</h6>

                  {/* Items */}
                  <div className="co-summary-items">
                    {cartState?.map((item, i) => (
                      <div key={i} className={`co-summary-item${item?.isBundle ? " co-summary-bundle" : ""}${item?.isFreeItem ? " co-summary-free" : ""}`}>
                        <div className="co-summary-img">
                          {item?.isBundle
                            ? (item?.bundleProducts?.[0]?.image
                              ? <img src={item.bundleProducts[0].image} alt="bundle" />
                              : <div className="co-bundle-placeholder"><FiPackage size={18} color="rgba(255,255,255,0.7)" /></div>)
                            : <img src={item?.productId?.images?.[0]?.url} alt={item?.productId?.title} />
                          }
                          <span className="co-summary-qty">{item?.quantity}</span>
                        </div>
                        <div className="co-summary-info">
                          <p className="co-summary-name">{item?.isBundle ? item?.bundleTitle : item?.productId?.title}</p>
                          {item?.isFreeItem && (
                            <span style={{ fontSize: 10, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 10 }}>🎁 FREE</span>
                          )}
                          {item?.offerLabel && !item?.isFreeItem && (
                            <span style={{ fontSize: 10, fontWeight: 600, background: '#fff7ed', color: '#c2410c', padding: '1px 7px', borderRadius: 10 }}>{item.offerLabel}</span>
                          )}
                          {!item?.isBundle && !item?.isFreeItem && (
                            <div className="co-summary-meta">
                              {item?.color && (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(item.color), border: "1.5px solid #e5e7eb", display: "inline-block" }} />
                                  {getReadableColorName(item.color)}
                                </span>
                              )}
                              {item?.size && <span>Size: {item.size}</span>}
                            </div>
                          )}
                          {item?.isBundle && <span className="co-bundle-pill">Bundle</span>}
                        </div>
                        <p className="co-summary-price">{item?.isFreeItem ? <span style={{ color: '#16a34a', fontWeight: 700 }}>FREE</span> : `₹${(item?.quantity * item?.price)?.toLocaleString()}`}</p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="co-totals">
                    <div className="co-total-row">
                      <span>MRP</span>
                      <span style={{ textDecoration: offerDiscount > 0 ? 'line-through' : 'none', color: offerDiscount > 0 ? '#9ca3af' : undefined }}>₹{(totalAmount + offerDiscount)?.toLocaleString()}</span>
                    </div>
                    {offerDiscount > 0 && (
                      <div className="co-total-row" style={{ flexDirection: 'column', alignItems: 'stretch', background: '#f0fdf4', borderRadius: 10, padding: '8px 10px', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>🎁 Offer Savings</span>
                          <span style={{ color: '#16a34a', fontWeight: 800 }}>−₹{offerDiscount.toLocaleString()}</span>
                        </div>
                        {Object.entries(offerBreakdown).map(([label, amt]) => (
                          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#15803d', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                              {label}
                            </span>
                            <span style={{ color: '#15803d', fontSize: 11, fontWeight: 700 }}>−₹{amt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="co-total-row">
                      <span>Subtotal</span>
                      <span>₹{totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="co-total-row">
                      <span>Shipping</span>
                      <span style={{ color: gstSettings.shippingCharge === 0 ? "#10b981" : "#6b7280" }}>
                        {gstSettings.shippingCharge === 0 ? "Free" : `₹${gstSettings.shippingCharge}`}
                      </span>
                    </div>

                    {/* ── GST rows — behaviour differs by taxIncluded ── */}
                    {gstSettings.taxIncluded ? (
                      /* TAX INCLUDED: GST is already inside the price — show as info, not added */
                      (cgstAmt > 0 || sgstAmt > 0 || igstAmt > 0) && (
                        <div style={{ background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 10, padding: '10px 12px', margin: '4px 0' }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#15803d', fontWeight: 700 }}>✅ GST Included in price (no extra charge)</p>
                          {gstType === "CGST_SGST" && cgstAmt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', marginBottom: 3 }}>
                              <span>CGST ({gstSettings.cgst}%) — included</span>
                              <span>₹{cgstAmt.toFixed(2)}</span>
                            </div>
                          )}
                          {gstType === "CGST_SGST" && sgstAmt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a', marginBottom: 3 }}>
                              <span>SGST ({gstSettings.sgst}%) — included</span>
                              <span>₹{sgstAmt.toFixed(2)}</span>
                            </div>
                          )}
                          {gstType === "IGST" && igstAmt > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#16a34a' }}>
                              <span>IGST ({gstSettings.igst}%) — included</span>
                              <span>₹{igstAmt.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      /* TAX EXCLUDED: GST added on top */
                      <>
                        {gstType === "CGST_SGST" && cgstAmt > 0 && (
                          <div className="co-total-row" style={{ color: '#ea580c' }}>
                            <span>CGST ({gstSettings.cgst}%)</span>
                            <span>+₹{cgstAmt.toFixed(2)}</span>
                          </div>
                        )}
                        {gstType === "CGST_SGST" && sgstAmt > 0 && (
                          <div className="co-total-row" style={{ color: '#ea580c' }}>
                            <span>SGST ({gstSettings.sgst}%)</span>
                            <span>+₹{sgstAmt.toFixed(2)}</span>
                          </div>
                        )}
                        {gstType === "IGST" && igstAmt > 0 && (
                          <div className="co-total-row" style={{ color: '#ea580c' }}>
                            <span>IGST ({gstSettings.igst}%) — Inter-state</span>
                            <span>+₹{igstAmt.toFixed(2)}</span>
                          </div>
                        )}
                      </>
                    )}

                    {coinDiscount > 0 && (
                      <div className="co-total-row co-discount-row">
                        <span>Coin Discount</span>
                        <span>−₹{coinDiscount}</span>
                      </div>
                    )}
                    <div className="co-divider" />
                    <div className="co-total-row co-grand-total">
                      <span>Total {gstSettings.taxIncluded && taxAmount > 0 && <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>(incl. GST ₹{taxAmount.toFixed(2)})</span>}</span>
                      <span>₹{finalAmount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="co-trust">
                    <div className="co-trust-item"><FaShieldAlt size={13} color="#6366f1" /><span>Secure Payment</span></div>
                    <div className="co-trust-item"><FiTruck size={13} color="#6366f1" /><span>Fast Delivery</span></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </div>

      {/* ── Sticky Pay Bar — Mobile ── */}
      {currentStep === 1 && (
        <div className="co-sticky-bar d-lg-none" style={{bottom: '56px'}}>
          <div className="co-sticky-inner">
            <div>
              <p className="co-sticky-label">Total Payable</p>
              <p className="co-sticky-amount">₹{finalAmount?.toLocaleString()}</p>
              {offerDiscount > 0 && (
                <p style={{ margin: 0, fontSize: 10, color: '#16a34a', fontWeight: 700, lineHeight: 1.2 }}>🎁 Saving ₹{offerDiscount.toLocaleString()}</p>
              )}
            </div>
            <button type="submit" form="checkout-form" className="co-pay-btn co-sticky-pay" onClick={() => formik.handleSubmit()}>
              Pay Now <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
