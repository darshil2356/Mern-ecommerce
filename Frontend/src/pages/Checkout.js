import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack, BiCheck, BiMapPin, BiCreditCard, BiPackage } from "react-icons/bi";
import { FaCoins, FaShippingFast, FaShieldAlt, FaSpinner } from "react-icons/fa";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { base_url, getConfig } from "../utils/axiosConfig";
import {
  createAnOrder,
  deleteUserCart,
  getUserCart,
  resetState,
} from "../features/user/userSlice";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";
import { motion } from "framer-motion";
import "./Checkout.css";

let shippingSchema = yup.object({
  firstname: yup.string().required("First Name is Required"),
  lastname: yup.string().required("Last Name is Required"),
  address: yup.string().required("Address Details are Required"),
  state: yup.string().required("State is Required"),
  city: yup.string().required("City is Required"),
  country: yup.string().required("Country is Required"),
  pincode: yup.number("Pincode No is Required").required().positive().integer(),
});

const Checkout = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const authState = useSelector((state) => state?.auth);
  const userCoins = useSelector((state) => state?.auth?.coins) || 0;

  const [totalAmount, setTotalAmount] = useState(0);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [useCoins, setUseCoins] = useState(false);
  const [coinAmount, setCoinAmount] = useState(0);
  const [paymentInfo, setPaymentInfo] = useState({
    razorpayPaymentId: "",
    razorpayOrderId: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: "Shipping", icon: BiMapPin },
    { id: 2, title: "Payment", icon: BiCreditCard },
    { id: 3, title: "Review", icon: BiPackage },
  ];

  useEffect(() => {
    let sum = 0;
    for (let index = 0; index < cartState?.length; index++) {
      sum = sum + Number(cartState[index].quantity) * cartState[index].price;
    }
    setTotalAmount(sum);
  }, [cartState]);

  useEffect(() => {
    dispatch(getUserCart(getConfig()));
  }, [dispatch]);

  const [cartProductState, setCartProductState] = useState([]);

  const formik = useFormik({
    initialValues: {
      firstname: "",
      lastname: "",
      address: "",
      state: "",
      city: "",
      country: "",
      pincode: "",
      other: "",
    },
    validationSchema: shippingSchema,
    onSubmit: async (values) => {
      try {
        setShippingInfo(values);
        localStorage.setItem("address", JSON.stringify(values));
        setCurrentStep(2);
        setIsProcessing(true);
        setTimeout(() => checkOutHandler(), 500);
      } catch (error) {
        console.error("Error saving shipping info:", error);
        alert("Error saving shipping information. Please try again.");
        setIsProcessing(false);
      }
    },
  });

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    let items = [];
    for (let index = 0; index < cartState?.length; index++) {
      const item = cartState[index];
      if (item?.isBundle) {
        // Bundle item — store as single order item with bundle price
        items.push({
          product: item.productId?._id || item.productId || null,
          quantity: item.quantity,
          color: item.color?._id || item.color || null,
          size: item.size || null,
          price: item.price,
          isBundle: true,
          bundleId: item.bundleId,
          bundleTitle: item.bundleTitle,
          bundleProducts: item.bundleProducts || [],
        });
      } else {
        items.push({
          product: item.productId?._id || item.productId,
          quantity: item.quantity,
          color: item.color?._id || item.color,
          size: item.size || null,
          price: item.price,
        });
      }
    }
    setCartProductState(items);
  }, [cartState]);

  // Coin discount: 1 coin = ₹1, max = min(userCoins, totalAmount+100)
  const maxCoinDiscount = Math.min(userCoins, totalAmount + 100);
  const coinDiscount = useCoins ? Math.min(coinAmount, maxCoinDiscount) : 0;
  const finalAmount = Math.max(0, totalAmount + 100 - coinDiscount);

  const handleUseCoinsToggle = (checked) => {
    setUseCoins(checked);
    if (checked) {
      setCoinAmount(maxCoinDiscount);
    } else {
      setCoinAmount(0);
    }
  };

  const checkOutHandler = async () => {
    try {
      setIsProcessing(true);

      const res = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );

      if (!res) {
        alert("Razorpay SDK failed to Load");
        setIsProcessing(false);
        return;
      }

      const result = await axios.post(
        `${base_url}user/order/checkout`,
        { amount: finalAmount },
        getConfig()
      );

      if (!result || !result.data) {
        alert("Something Went Wrong with order creation");
        setIsProcessing(false);
        return;
      }

      const { amount, id: order_id, currency } = result.data.order;

      const options = {
        key: "rzp_test_HSSeDI22muUrLR",
        amount: amount,
        currency: currency,
        name: "Cart's corner",
        description: "Test Transaction",
        order_id: order_id,
        handler: async function (response) {
          try {
            console.log("Payment successful:", response);
            setCurrentStep(3);

            const data = {
              orderCreationId: order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            };

            console.log("Verifying payment with data:", data);
            const paymentResult = await axios.post(
              `${base_url}user/order/paymentVerification`,
              data,
              getConfig()
            );

            console.log("Payment verification result:", paymentResult);

            if (!paymentResult || !paymentResult.data) {
              alert("Payment verification failed");
              setIsProcessing(false);
              return;
            }

            // Update localStorage coins before resetState reads it
            if (useCoins && coinDiscount > 0) {
              const stored = localStorage.getItem("customer");
              if (stored) {
                const parsed = JSON.parse(stored);
                const newCoins = Math.max(0, (parsed.coins || 0) - coinAmount);
                localStorage.setItem("customer", JSON.stringify({ ...parsed, coins: newCoins }));
              }
            }

            console.log("Creating order with data:", {
              totalPrice: totalAmount,
              totalPriceAfterDiscount: totalAmount + 100 - coinDiscount,
              orderItems: cartProductState,
              paymentInfo: paymentResult.data,
              shippingInfo: JSON.parse(localStorage.getItem("address")),
              coinsUsed: useCoins ? coinAmount : 0,
              coinAmount: coinDiscount,
            });

            await dispatch(
              createAnOrder({
                totalPrice: totalAmount,
                totalPriceAfterDiscount: totalAmount + 100 - coinDiscount,
                orderItems: cartProductState,
                paymentInfo: paymentResult.data,
                shippingInfo: JSON.parse(localStorage.getItem("address")),
                coinsUsed: useCoins ? coinAmount : 0,
                coinAmount: coinDiscount,
                discountBreakdown: {
                  directDiscount: 0,
                  offerDiscount: 0,
                  coinDiscount: coinDiscount,
                },
              })
            );

            console.log("Order created successfully");
            await dispatch(deleteUserCart(getConfig()));
            console.log("Cart deleted");
            localStorage.removeItem("address");

            // Reset state first, then navigate
            dispatch(resetState());
            console.log("State reset");

            // Small delay to ensure state is reset before navigation
            setTimeout(() => {
              console.log("Navigating to my-orders");
              navigate("/my-orders");
            }, 100);
          } catch (error) {
            console.error("Error in payment handler:", error);
            alert("Payment processing failed. Please contact support if amount was deducted.");
            setIsProcessing(false);
            setCurrentStep(1); // Go back to shipping step
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            setCurrentStep(1); // Go back to shipping step if payment modal is closed
          }
        },
        prefill: {
          name: formik.values.firstname + " " + formik.values.lastname,
          email: "",
          contact: "",
        },
        theme: { color: "#d4af37" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Error in checkout handler:", error);
      alert("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
      setCurrentStep(1);
    }
  };

  return (
    <>
      <Container class1="checkout-wrapper py-5">
        <div className="checkout-atmosphere">
          <div className="checkout-orb checkout-orb-one"></div>
          <div className="checkout-orb checkout-orb-two"></div>
          <div className="checkout-orb checkout-orb-three"></div>
          <div className="checkout-grid"></div>
          <div className="checkout-particles"></div>
        </div>
        <motion.div
          className="checkout-hero"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="checkout-hero-copy">
            <span className="checkout-kicker shimmer">Premium Checkout</span>
            <h1>Complete Your Order</h1>
            <p>Fast, secure, and designed to make every step feel magical ✨</p>
          </div>
          <div className="checkout-hero-cards">
            <div className="checkout-stat-card">
              <span className="checkout-stat-label">Items</span>
              <strong>{cartProductState?.length || 0}</strong>
            </div>
            <div className="checkout-stat-card">
              <span className="checkout-stat-label">Payable</span>
              <strong>₹{finalAmount}</strong>
            </div>
            <div className="checkout-stat-card">
              <span className="checkout-stat-label">Support</span>
              <strong>Secure</strong>
            </div>
          </div>
        </motion.div>
        <div className="row">
          {/* Progress Steps */}
          <div className="col-12 mb-5">
            <motion.div
              className="checkout-progress"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
            >
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  ></div>
                </div>
                <div className="progress-steps">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep >= step.id;
                    const isCompleted = currentStep > step.id;

                    return (
                      <div key={step.id} className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                        <div className="step-icon">
                          {isCompleted ? <BiCheck size={20} /> : <Icon size={20} />}
                        </div>
                        <div className="step-title">{step.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="col-lg-7">
            <motion.div
              className="checkout-form-container"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
            >
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <motion.div
                  className="checkout-step shipping-step"
                  key="shipping-step"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div className="step-header mb-4">
                    <div className="step-header-icon">
                      <BiMapPin size={28} className="text-primary" />
                    </div>
                    <h3 className="fw-bold text-dark">Shipping Information</h3>
                    <p className="text-muted">Please enter your shipping details</p>
                  </div>

                  <div className="contact-info-card p-4 mb-4 rounded-4">
                    <h5 className="mb-3">Contact Information</h5>
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted">{authState?.user?.firstname} {authState?.user?.lastname}</span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{authState?.user?.email}</span>
                    </div>
                  </div>

                  <form onSubmit={formik.handleSubmit} className="shipping-form">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Country</label>
                        <select
                          className={`form-select form-control-lg ${formik.touched.country && formik.errors.country ? 'is-invalid' : ''}`}
                          name="country"
                          value={formik.values.country}
                          onChange={formik.handleChange("country")}
                          onBlur={formik.handleBlur("country")}
                        >
                          <option value="" disabled>Select Country</option>
                          <option value="India">India</option>
                        </select>
                        {formik.touched.country && formik.errors.country && (
                          <div className="invalid-feedback d-block">{formik.errors.country}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${formik.touched.firstname && formik.errors.firstname ? 'is-invalid' : ''}`}
                          placeholder="First Name"
                          name="firstname"
                          value={formik.values.firstname}
                          onChange={formik.handleChange("firstname")}
                          onBlur={formik.handleBlur("firstname")}
                        />
                        {formik.touched.firstname && formik.errors.firstname && (
                          <div className="invalid-feedback d-block">{formik.errors.firstname}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${formik.touched.lastname && formik.errors.lastname ? 'is-invalid' : ''}`}
                          placeholder="Last Name"
                          name="lastname"
                          value={formik.values.lastname}
                          onChange={formik.handleChange("lastname")}
                          onBlur={formik.handleBlur("lastname")}
                        />
                        {formik.touched.lastname && formik.errors.lastname && (
                          <div className="invalid-feedback d-block">{formik.errors.lastname}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">State</label>
                        <select
                          className={`form-select form-control-lg ${formik.touched.state && formik.errors.state ? 'is-invalid' : ''}`}
                          name="state"
                          value={formik.values.state}
                          onChange={formik.handleChange("state")}
                          onBlur={formik.handleBlur("state")}
                        >
                          <option value="" disabled>Select State</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                        </select>
                        {formik.touched.state && formik.errors.state && (
                          <div className="invalid-feedback d-block">{formik.errors.state}</div>
                        )}
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Address</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${formik.touched.address && formik.errors.address ? 'is-invalid' : ''}`}
                          placeholder="Street address, apartment, suite, etc."
                          name="address"
                          value={formik.values.address}
                          onChange={formik.handleChange("address")}
                          onBlur={formik.handleBlur("address")}
                        />
                        {formik.touched.address && formik.errors.address && (
                          <div className="invalid-feedback d-block">{formik.errors.address}</div>
                        )}
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Apartment, Suite, etc. (Optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          placeholder="Apartment, suite, unit, building, floor, etc."
                          name="other"
                          value={formik.values.other}
                          onChange={formik.handleChange("other")}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">City</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${formik.touched.city && formik.errors.city ? 'is-invalid' : ''}`}
                          placeholder="City"
                          name="city"
                          value={formik.values.city}
                          onChange={formik.handleChange("city")}
                          onBlur={formik.handleBlur("city")}
                        />
                        {formik.touched.city && formik.errors.city && (
                          <div className="invalid-feedback d-block">{formik.errors.city}</div>
                        )}
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Pincode</label>
                        <input
                          type="text"
                          className={`form-control form-control-lg ${formik.touched.pincode && formik.errors.pincode ? 'is-invalid' : ''}`}
                          placeholder="Pincode"
                          name="pincode"
                          value={formik.values.pincode}
                          onChange={formik.handleChange("pincode")}
                          onBlur={formik.handleBlur("pincode")}
                        />
                        {formik.touched.pincode && formik.errors.pincode && (
                          <div className="invalid-feedback d-block">{formik.errors.pincode}</div>
                        )}
                      </div>
                    </div>

                    <div className="form-actions mt-4 d-flex justify-content-between align-items-center">
                      <Link to="/cart" className="btn btn-outline-secondary btn-lg px-4">
                        <BiArrowBack className="me-2" />
                        Return to Cart
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg px-5"
                        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', border: 'none' }}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Payment Processing */}
              {currentStep === 2 && (
                <motion.div
                  className="checkout-step payment-step text-center"
                  key="payment-step"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div className="payment-processing p-5">
                    <div className="processing-icon mb-4">
                      {isProcessing ? (
                        <FaSpinner className="fa-spin" size={60} style={{ color: '#667eea' }} />
                      ) : (
                        <BiCreditCard size={60} style={{ color: '#667eea' }} />
                      )}
                    </div>
                    <h3 className="fw-bold text-dark mb-3">
                      {isProcessing ? 'Processing Payment...' : 'Secure Payment'}
                    </h3>
                    <p className="text-muted mb-4">
                      {isProcessing
                        ? 'Please wait while we process your payment securely...'
                        : 'You will be redirected to our secure payment gateway'
                      }
                    </p>
                    {isProcessing && (
                      <div className="progress mt-4">
                        <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary" style={{ width: '70%' }}></div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Order Confirmation */}
              {currentStep === 3 && (
                <motion.div
                  className="checkout-step confirmation-step text-center"
                  key="confirmation-step"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <div className="order-confirmation p-5">
                    <div className="confirmation-icon mb-4">
                      <div className="success-circle">
                        <BiCheck size={40} className="text-white" />
                      </div>
                    </div>
                    <h3 className="fw-bold text-success mb-3">Order Confirmed!</h3>
                    <p className="text-muted mb-4">
                      Thank you for your purchase. Your order has been successfully placed.
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                      <Link to="/my-orders" className="btn btn-primary btn-lg px-4">
                        View Orders
                      </Link>
                      <Link to="/product" className="btn btn-outline-primary btn-lg px-4">
                        Continue Shopping
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="col-lg-5">
            <motion.div
              className="order-summary-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
            >
              <div className="summary-header">
                <div className="summary-header-top">
                  <div>
                    <div className="summary-kicker">Secure Checkout</div>
                    <h4 className="mb-0">Order Summary</h4>
                  </div>
                  <div className="summary-badge">
                    <FaShieldAlt />
                    Protected
                  </div>
                </div>
                <div className="summary-header-meta">
                  <div className="summary-meta-card">
                    <span className="summary-meta-label">Items</span>
                    <span className="summary-meta-value">{cartProductState?.length || 0}</span>
                  </div>
                  <div className="summary-meta-card">
                    <span className="summary-meta-label">Payable</span>
                    <span className="summary-meta-value">₹{finalAmount}</span>
                  </div>
                </div>
              </div>
              <div className="summary-body">
                {/* Cart Items */}
                <div className="summary-items-list">
                {cartProductState && cartProductState?.map((item, index) => (
                  <div key={index} className={`cart-item ${item?.isBundle ? "bundle-summary-item" : ""}`}>
                    <div className="item-image">
                      {item?.isBundle ? (
                        <div className="bundle-image-badge">
                          <BiPackage size={24} />
                        </div>
                      ) : (
                        <img
                          src={item?.productId?.images?.[0]?.url}
                          alt={item?.productId?.title}
                          className="img-fluid"
                        />
                      )}
                    </div>
                    <div className="item-details">
                      <div className="item-title-row">
                        <div className="item-title">{item?.isBundle ? item?.bundleTitle : item?.productId?.title}</div>
                        {item?.isBundle && <span className="item-pill">Bundle</span>}
                      </div>
                      {item?.isBundle ? (
                        <div className="item-meta" style={{ marginTop: 6 }}>
                          {(item?.bundleProducts || []).map((bp, bpIndex) => (
                            <div key={bpIndex} className="bundle-subitem">
                              <div className="bundle-subitem-title">{bp.title} x {bp.quantity}</div>
                              <div className="bundle-subitem-meta">
                                {bp.selectedColorLabel && (
                                  <span className="bundle-meta-chip">
                                    <span className="bundle-meta-dot" style={{ background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel) }} />
                                    Color selected
                                  </span>
                                )}
                                {bp.selectedSize && <span className="bundle-meta-chip">Size {bp.selectedSize}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="item-meta">
                          {item?.color && (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(item.color), border: "1px solid #cbd5e1", display: "inline-block" }} />
                              Color: {getReadableColorName(item.color)}
                            </span>
                          )}
                          {item?.color && item?.size && ' | '}
                          {item?.size && `Size: ${item?.size}`}
                        </div>
                      )}
                    </div>
                    <div className="item-price">
                      <span className="item-price-label">{item?.quantity} x</span>
                      <span className="item-price-value">₹{item?.price * item?.quantity}</span>
                    </div>
                  </div>
                ))}
                </div>

                {/* Summary Breakdown */}
                <div className="summary-breakdown">
                  <div className="summary-row subtotal">
                    <span>Subtotal</span>
                    <span>₹{totalAmount}</span>
                  </div>
                  <div className="summary-row shipping">
                    <span>Shipping</span>
                    <span>₹100</span>
                  </div>

                  {/* Coin Discount Section */}
                  {useCoins && coinDiscount > 0 && (
                    <div className="coin-discount-section">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                          <label className="form-check-label mb-2">
                            <FaCoins className="me-2" />
                            Use coins for discount (1 coin = ₹1)
                          </label>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: "13px", color: "#92400e" }}>Coins to use:</span>
                          <input
                            type="number"
                            min={0}
                            max={maxCoinDiscount}
                            value={coinAmount}
                            onChange={(e) => setCoinAmount(Math.min(parseInt(e.target.value) || 0, maxCoinDiscount))}
                            className="coin-input"
                          />
                          <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>
                            -₹{coinDiscount}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="summary-row total">
                    <span>Total</span>
                    <span>₹{finalAmount}</span>
                  </div>
                  <div className="summary-assurance">
                    <FaShippingFast />
                    <span>Fast dispatch with secure payment protection</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Checkout;
