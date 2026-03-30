import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiArrowBack } from "react-icons/bi";
import { FaCoins } from "react-icons/fa";
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
  const navigate = useNavigate();

  useEffect(() => {
    let sum = 0;
    for (let index = 0; index < cartState?.length; index++) {
      sum = sum + Number(cartState[index].quantity) * cartState[index].price;
    }
    setTotalAmount(sum);
  }, [cartState]);

  useEffect(() => {
    dispatch(getUserCart(getConfig()));
  }, []);

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
    onSubmit: (values) => {
      setShippingInfo(values);
      localStorage.setItem("address", JSON.stringify(values));
      setTimeout(() => {
        checkOutHandler();
      }, 300);
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
    const res = await loadScript(
      "https://checkout.razorpay.com/v1/checkout.js"
    );

    if (!res) {
      alert("Razorpay SDK failed to Load");
      return;
    }
    const result = await axios.post(
      `${base_url}user/order/checkout`,
      { amount: finalAmount },
      getConfig()
    );

    if (!result) {
      alert("Something Went Wrong");
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
        const data = {
          orderCreationId: order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
        };

        const result = await axios.post(
          `${base_url}user/order/paymentVerification`,
          data,
          getConfig()
        );

        // Update localStorage coins before resetState reads it
        if (useCoins && coinDiscount > 0) {
          const stored = localStorage.getItem("customer");
          if (stored) {
            const parsed = JSON.parse(stored);
            const newCoins = Math.max(0, (parsed.coins || 0) - coinAmount);
            localStorage.setItem("customer", JSON.stringify({ ...parsed, coins: newCoins }));
          }
        }

        await dispatch(
          createAnOrder({
            totalPrice: totalAmount,
            totalPriceAfterDiscount: totalAmount + 100 - coinDiscount,
            orderItems: cartProductState,
            paymentInfo: result.data,
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

        await dispatch(deleteUserCart(getConfig()));
        localStorage.removeItem("address");
        // Navigate first, then reset so orders page can fetch fresh
        navigate("/my-orders");
        dispatch(resetState());
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
  };

  return (
    <>
      <Container class1="checkout-wrapper py-5 home-wrapper-2">
        <div className="row">
          <div className="col-7">
            <div className="checkout-left-data">
              <h3 className="website-name">Cart Corner</h3>
              <nav
                style={{ "--bs-breadcrumb-divider": ">" }}
                aria-label="breadcrumb"
              >
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link className="text-dark total-price" to="/cart">
                      Cart
                    </Link>
                  </li>
                  &nbsp; /&nbsp;
                  <li className="breadcrumb-ite total-price active" aria-current="page">
                    Information
                  </li>
                  &nbsp; /
                  <li className="breadcrumb-item total-price active">Shipping</li>
                  &nbsp; /
                  <li className="breadcrumb-item total-price active" aria-current="page">
                    Payment
                  </li>
                </ol>
              </nav>
              <h4 className="title total">Contact Information</h4>
              <p className="user-details total">
                {authState?.user?.firstname} ({authState?.user?.email})
              </p>
              <h4 className="mb-3">Shipping Address</h4>
              <form
                onSubmit={formik.handleSubmit}
                className="d-flex gap-15 flex-wrap justify-content-between"
              >
                <div className="w-100">
                  <select
                    className="form-control form-select"
                    name="country"
                    value={formik.values.country}
                    onChange={formik.handleChange("country")}
                    onBlur={formik.handleChange("country")}
                  >
                    <option value="" disabled>Select Country</option>
                    <option value="India">India</option>
                  </select>
                  <div className="error ms-2 my-1">
                    {formik.touched.country && formik.errors.country}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="First Name"
                    className="form-control"
                    name="firstname"
                    value={formik.values.firstname}
                    onChange={formik.handleChange("firstname")}
                    onBlur={formik.handleBlur("firstname")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.firstname && formik.errors.firstname}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="Last Name"
                    className="form-control"
                    name="lastname"
                    value={formik.values.lastname}
                    onChange={formik.handleChange("lastname")}
                    onBlur={formik.handleBlur("lastname")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.lastname && formik.errors.lastname}
                  </div>
                </div>
                <div className="w-100">
                  <input
                    type="text"
                    placeholder="Address"
                    className="form-control"
                    name="address"
                    value={formik.values.address}
                    onChange={formik.handleChange("address")}
                    onBlur={formik.handleBlur("address")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.address && formik.errors.address}
                  </div>
                </div>
                <div className="w-100">
                  <input
                    type="text"
                    placeholder="Apartment, Suite, etc"
                    className="form-control"
                    name="other"
                    value={formik.values.other}
                    onChange={formik.handleChange("other")}
                    onBlur={formik.handleBlur("other")}
                  />
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="City"
                    className="form-control"
                    name="city"
                    value={formik.values.city}
                    onChange={formik.handleChange("city")}
                    onBlur={formik.handleBlur("city")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.city && formik.errors.city}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <select
                    className="form-control form-select"
                    name="state"
                    value={formik.values.state}
                    onChange={formik.handleChange("state")}
                    onBlur={formik.handleChange("state")}
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
                  <div className="error ms-2 my-1">
                    {formik.touched.state && formik.errors.state}
                  </div>
                </div>
                <div className="flex-grow-1">
                  <input
                    type="text"
                    placeholder="Pincode"
                    className="form-control"
                    name="pincode"
                    value={formik.values.pincode}
                    onChange={formik.handleChange("pincode")}
                    onBlur={formik.handleBlur("pincode")}
                  />
                  <div className="error ms-2 my-1">
                    {formik.touched.pincode && formik.errors.pincode}
                  </div>
                </div>
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-center">
                    <Link to="/cart" className="text-dark">
                      <BiArrowBack className="me-2" />
                      Return to Cart
                    </Link>
                    <button className="button" type="submit">
                      Place Order
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="col-5">
            <div className="border-bottom py-4">
              {cartState && cartState?.map((item, index) => (
                <div key={index} className="d-flex gap-10 mb-2 align-items-center">
                  <div className="w-75 d-flex gap-10">
                    <div className="w-25 position-relative">
                      <span style={{ top: "-10px", right: "2px" }} className="badge bg-secondary text-white rounded-circle p-2 position-absolute">
                        {item?.quantity}
                      </span>
                      {item?.isBundle ? (
                        <div style={{ width: 80, height: 80, background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>BUNDLE</span>
                        </div>
                      ) : (
                        <img src={item?.productId?.images?.[0]?.url} width={80} height={80} alt="product" style={{ objectFit: "cover", borderRadius: 8 }} />
                      )}
                    </div>
                    <div>
                      {item?.isBundle ? (
                        <>
                          <h5 className="total-price" style={{ color: "#667eea" }}>{item?.bundleTitle}</h5>
                          {item?.bundleProducts?.slice(0, 2).map((bp, i) => (
                            <p key={i} className="total-price" style={{ fontSize: 11, margin: 0 }}>• {bp.title} ×{bp.quantity}</p>
                          ))}
                          <span style={{ fontSize: 10, background: "#dcfce7", color: "#166534", padding: "1px 6px", borderRadius: 8, fontWeight: 700 }}>Bundle Deal</span>
                        </>
                      ) : (
                        <>
                          <h5 className="total-price">{item?.productId?.title}</h5>
                          <p className="total-price">{item?.color?.title}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="total">Rs. {item?.price * item?.quantity}</h5>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-bottom py-4">
              <div className="d-flex justify-content-between align-items-center">
                <p className="total">Subtotal</p>
                <p className="total-price">Rs. {totalAmount ? totalAmount : "0"}</p>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <p className="mb-0 total">Shipping</p>
                <p className="mb-0 total-price">Rs. 100</p>
              </div>
            </div>

            {/* Coins Section */}
            {userCoins > 0 && (
              <div className="border-bottom py-4">
                <div
                  style={{
                    background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                    borderRadius: "12px",
                    padding: "16px",
                    border: "1px solid #f59e0b",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <FaCoins style={{ color: "#d97706", fontSize: "20px" }} />
                    <span style={{ fontWeight: 600, color: "#92400e" }}>
                      Your Coins: {userCoins}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="useCoins"
                      checked={useCoins}
                      onChange={(e) => handleUseCoinsToggle(e.target.checked)}
                      style={{ width: "16px", height: "16px", accentColor: "#d97706" }}
                    />
                    <label htmlFor="useCoins" style={{ marginBottom: 0, cursor: "pointer", color: "#92400e", fontWeight: 500 }}>
                      Use coins for discount (1 coin = ₹1)
                    </label>
                  </div>
                  {useCoins && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <span style={{ fontSize: "13px", color: "#92400e" }}>Coins to use:</span>
                      <input
                        type="number"
                        min={0}
                        max={maxCoinDiscount}
                        value={coinAmount}
                        onChange={(e) => setCoinAmount(Math.min(parseInt(e.target.value) || 0, maxCoinDiscount))}
                        style={{
                          width: "80px",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid #f59e0b",
                          textAlign: "center",
                          fontWeight: 600,
                        }}
                      />
                      <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>
                        -₹{coinDiscount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center border-bottom py-4">
              <h4 className="total">Total</h4>
              <h5 className="total-price">Rs. {finalAmount}</h5>
            </div>
            {coinDiscount > 0 && (
              <div className="d-flex justify-content-between align-items-center py-2">
                <span style={{ fontSize: "13px", color: "#22c55e" }}>
                  <FaCoins style={{ marginRight: "4px" }} />
                  Coin Discount ({coinAmount} coins)
                </span>
                <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600 }}>
                  -₹{coinDiscount}
                </span>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default Checkout;
