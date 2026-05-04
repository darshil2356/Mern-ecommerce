import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <>
      <Meta
        title="Privacy Policy"
        description="Read Yashoda Fashion's privacy policy to understand how we collect, use, and protect your personal information."
        keywords="privacy policy, data protection, Yashoda Fashion privacy"
        url="/privacy-policy"
      />
      <BreadCrumb title="Privacy Policy" />

      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "60px 0", marginTop: "-1px" }}>
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#fff", marginBottom: "10px" }}>
              Privacy <span style={{ color: "#d4af37" }}>Policy</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>Your privacy is important to us</p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Last updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                1. About Us
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Yashoda Fashion is an online fashion store based atShop no. 1-2 Greendhara apartment, Near bhagawati school, India Colony, Bapunagar, Ahmedabad, Gujarat 382350, Gujarat, India. We operate this website to provide you with a seamless online shopping experience.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                2. Information We Collect
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                When you register or place an order on our website, we collect the following information:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li>Full name and mobile number (required for account creation)</li>
                <li>Email address (optional, for order updates)</li>
                <li>Delivery address including city, state, and pincode</li>
                <li>Order history and transaction details</li>
                <li>Coin balance and coin transaction history</li>
                <li>Referral code and referral activity</li>
                <li>Device push notification tokens (FCM) for order alerts</li>
              </ul>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                3. How We Use Your Information
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We use your information to:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li>Process and deliver your orders via our shipping partner (Shiprocket)</li>
                <li>Manage your coin wallet — coins earned through purchases, referrals, and spin wheel</li>
                <li>Send order status notifications and updates</li>
                <li>Apply coupon codes, offers, and loyalty discounts at checkout</li>
                <li>Maintain your account and order history</li>
                <li>Improve our website and customer experience</li>
              </ul>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                4. Coin & Reward Data
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Our platform operates a coin-based reward system. Your coin balance, transaction history (credits and debits), referral earnings, and spin wheel activity are stored securely in your account. This data is used solely to manage your rewards and cannot be transferred or withdrawn as cash.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                5. Sharing Your Information
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We share your information only with trusted third parties required to operate our business:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li><strong>Shiprocket</strong> – for order shipping and tracking</li>
                <li><strong>Razorpay</strong> – for secure payment processing</li>
                <li><strong>Cloudinary</strong> – for image storage</li>
                <li><strong>Firebase</strong> – for push notifications</li>
              </ul>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We do not sell, rent, or trade your personal information to any third party for marketing purposes.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                6. Data Security
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We implement appropriate technical and organizational security measures to protect your personal data. Passwords are encrypted using bcrypt. Payment transactions are handled securely by Razorpay and are never stored on our servers.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                7. Your Rights
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                You have the right to access, update, or delete your personal information at any time by contacting us. You may also opt out of push notifications from your device settings.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                8. Contact Us
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                For any privacy-related queries, contact us at:<br />
                📧 <a href="mailto:info@yashodafashion.com" style={{ color: "#d4af37" }}>info@yashodafashion.com</a><br />
                📞 <a href="tel:+917046252356" style={{ color: "#d4af37" }}>+91 70462 52356</a><br />
                📍Shop no. 1-2 Greendhara apartment, Near bhagawati school, India Colony, Bapunagar, Ahmedabad, Gujarat 382350
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default PrivacyPolicy;
