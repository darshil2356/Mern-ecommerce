import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const TermAndContions = () => {
  return (
    <>
      <Meta
        title="Terms & Conditions"
        description="Read Yashoda Fashion's terms and conditions governing the use of our website, purchases, coin system, and services."
        keywords="terms and conditions, terms of service, Yashoda Fashion terms, user agreement"
        url="/term-conditions"
      />
      <BreadCrumb title="Terms & Conditions" />

      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "60px 0", marginTop: "-1px" }}>
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#fff", marginBottom: "10px" }}>
              Terms & <span style={{ color: "#d4af37" }}>Conditions</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>
              Rules and regulations for using our website
            </p>
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
                1. Acceptance of Terms
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                By accessing and using the Yashoda Fashion website, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use this website. These terms apply to all visitors, registered users, and customers.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                2. User Account
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                To place an order, you must register with a valid mobile number. You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account. Each mobile number can be registered only once.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                3. Ordering & Payment
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                All orders are subject to product availability. Prices displayed on the website are inclusive of applicable GST. Payments are processed securely via <strong>Razorpay</strong>. We accept UPI, credit/debit cards, net banking, and other methods available at checkout. We reserve the right to cancel any order in case of pricing errors or stock unavailability.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                4. Coin System (Yashoda Coins)
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Yashoda Fashion operates a coin-based loyalty system. Coins can be earned through:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li>Referrals – when a referred user makes a purchase</li>
                <li>Spin Wheel – by spinning the reward wheel (when enabled)</li>
                <li>Admin-credited adjustments</li>
                <li>Approved refunds or cancellations</li>
              </ul>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Coins can be redeemed at checkout to reduce the payable amount on your next purchase. Coins have <strong>no monetary value</strong>, cannot be transferred to another account, and cannot be withdrawn as cash. Yashoda Fashion reserves the right to modify, expire, or cancel coins at any time.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                5. Referral Program
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Each registered user receives a unique referral code. When a new user registers and makes a purchase using your referral code, you earn coins as per the active referral configuration. Referral coins are credited after the referred user's order is confirmed. Misuse of the referral system (e.g., self-referrals or fake accounts) will result in account suspension and forfeiture of all coins.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                6. Coupons & Offers
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Coupon codes and promotional offers are time-limited and subject to specific terms. Only one coupon can be applied per order. Offers including free shipping promotions are available occasionally and are not guaranteed on every order. We reserve the right to withdraw any offer at any time without prior notice.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                7. Shipping & Delivery
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Orders are shipped via Shiprocket. Shipping charges are calculated at checkout based on your location and order. Delivery timelines are estimates and may vary. Please refer to our <strong>Shipping Policy</strong> for full details.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                8. Refund & Cancellation
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We do not offer cash refunds. All approved refunds are issued as Yashoda Coins to your wallet. Orders can only be cancelled before dispatch. Please refer to our <strong>Refund Policy</strong> for complete details.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                9. Product Information
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We strive to display accurate product images, descriptions, and pricing. However, actual product colors may slightly vary due to screen settings. We reserve the right to correct any pricing or description errors and cancel orders placed at incorrect prices.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                10. Intellectual Property
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                All content on this website including images, logos, product descriptions, and design is the property of Yashoda Fashion. Reproduction, redistribution, or commercial use of any content without written permission is strictly prohibited.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                11. Limitation of Liability
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Yashoda Fashion shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our liability is limited to the value of the order placed by the customer.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                12. Governing Law
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Ahmedabad, Gujarat.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                13. Changes to Terms
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We reserve the right to update these terms at any time. Continued use of the website after changes are posted constitutes your acceptance of the revised terms.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                14. Contact Us
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                For any questions about these Terms & Conditions:<br />
                📧 <a href="mailto:darshilbavishi2356@gmail.com" style={{ color: "#d4af37" }}>darshilbavishi2356@gmail.com</a><br />
                📞 <a href="tel:+917046252356" style={{ color: "#d4af37" }}>+91 70462 52356</a><br />
                📍 B-204 Gajanan Flora, Opp Uma School, Nikol Naroda, Ahmedabad – 382350
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default TermAndContions;
