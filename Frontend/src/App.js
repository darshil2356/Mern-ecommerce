import React, { useEffect, Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import "./utils/axiosSetup";
import usePushNotification from "./utils/usePushNotification";
import trackingService from "./utils/trackingService";
import { PrivateRoutes } from "./routing/PrivateRoutes";
import { OpenRoutes } from "./routing/OpenRoutes";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const OurStore = lazy(() => import("./pages/OurStore"));
const Blog = lazy(() => import("./pages/Blog"));
const CompareProduct = lazy(() => import("./pages/CompareProduct"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Login = lazy(() => import("./pages/Login"));
const Forgotpassword = lazy(() => import("./pages/Forgotpassword"));
const Signup = lazy(() => import("./pages/Signup"));
const Resetpassword = lazy(() => import("./pages/Resetpassword"));
const SingleBlog = lazy(() => import("./pages/SingleBlog"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPloicy = lazy(() => import("./pages/RefundPloicy"));
const ShippingPolicy = lazy(() => import("./pages/ShippingPolicy"));
const TermAndContions = lazy(() => import("./pages/TermAndContions"));
const SingleProduct = lazy(() => import("./pages/SingleProduct"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Reels = lazy(() => import("./pages/Reels"));
const Bundles = lazy(() => import("./pages/Bundles"));

function App() {
  const user = useSelector((state) => state.auth?.user);
  usePushNotification(user?._id);

  useEffect(() => {
    trackingService.init(user?._id);
    return () => trackingService.destroy();
  }, [user]);

  return (
    <>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#999" }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="product" element={<OurStore />} />
            <Route path="product/:id" element={<SingleProduct />} />
            <Route path="blogs" element={<Blog />} />
            <Route path="blog/:id" element={<SingleBlog />} />
            
            {/* Reels Page - Full Screen Reel-Based Shopping */}
            <Route path="reels" element={<Reels />} />
            <Route path="bundles" element={<Bundles />} />
            
            <Route
              path="cart"
              element={
                <PrivateRoutes>
                  <Cart />
                </PrivateRoutes>
              }
            />
            <Route
              path="my-orders"
              element={
                <PrivateRoutes>
                  <Orders />
                </PrivateRoutes>
              }
            />
            <Route
              path="my-orders/:id"
              element={
                <PrivateRoutes>
                  <OrderDetails />
                </PrivateRoutes>
              }
            />
            <Route
              path="my-profile"
              element={
                <PrivateRoutes>
                  <Profile />
                </PrivateRoutes>
              }
            />
            <Route
              path="checkout"
              element={
                <PrivateRoutes>
                  <Checkout />
                </PrivateRoutes>
              }
            />
            <Route path="compare-product" element={<CompareProduct />} />
            <Route
              path="wishlist"
              element={
                <PrivateRoutes>
                  <Wishlist />
                </PrivateRoutes>
              }
            />
            <Route
              path="login"
              element={
                <OpenRoutes>
                  <Login />
                </OpenRoutes>
              }
            />
            <Route path="forgot-password" element={<Forgotpassword />} />
            <Route
              path="signup"
              element={
                <OpenRoutes>
                  <Signup />
                </OpenRoutes>
              }
            />
            <Route path="reset-password/:token" element={<Resetpassword />} />
            <Route path="privacy-policy" element={<PrivacyPolicy />} />
            <Route path="refund-policy" element={<RefundPloicy />} />
            <Route path="shipping-policy" element={<ShippingPolicy />} />
            <Route path="term-conditions" element={<TermAndContions />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export default App;

