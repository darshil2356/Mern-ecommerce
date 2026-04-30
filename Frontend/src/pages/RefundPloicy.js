import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const RefundPloicy = () => {
  return (
    <>
      <Meta
        title="Refund Policy"
        description="Yashoda Fashion refund policy – we offer coin-based refunds. Coins can be used to purchase products on our store."
        keywords="refund policy, coin refund, Yashoda Fashion refund, store credit"
        url="/refund-policy"
      />
      <BreadCrumb title="Refund Policy" />

      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "60px 0", marginTop: "-1px" }}>
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#fff", marginBottom: "10px" }}>
              Refund <span style={{ color: "#d4af37" }}>Policy</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>
              Coin-based refunds — shop again with your coins
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
                1. No Cash Refunds
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                At Yashoda Fashion, we do not offer cash refunds or bank transfers for any orders. All eligible refunds are processed as <strong>Yashoda Coins</strong> credited directly to your account wallet. This applies to all payment methods including online payments (Razorpay) and other modes.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                2. Coin-Based Refund
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                If your return or cancellation is approved, the refund amount will be converted into <strong>Yashoda Coins</strong> and added to your coin wallet. You can use these coins to purchase any product on our website at your convenience. Coins have no expiry and remain in your account until used.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                3. How to Use Coins
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Your coin balance is visible in your account dashboard. At checkout, you can apply your available coins to reduce the payable amount on your next order. Coins can be combined with coupon codes and active offers.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                4. Eligibility for Refund
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                To be eligible for a coin refund, the following conditions must be met:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li>The issue must be reported within <strong>7 days</strong> of delivery</li>
                <li>The product must be unused, unwashed, and in its original condition with tags intact</li>
                <li>Proof of purchase (order ID) must be provided</li>
                <li>The item must not fall under non-returnable categories (see below)</li>
              </ul>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                5. Non-Returnable Items
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                The following items are not eligible for return or coin refund:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li>Items that have been worn, washed, or altered</li>
                <li>Items purchased during special sale events (unless defective)</li>
                <li>Free items received as part of an offer or bundle</li>
                <li>Items without original tags or packaging</li>
              </ul>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                6. Cancellation Policy
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Orders can be cancelled before they are dispatched. Once an order is shipped via Shiprocket, cancellation is not possible. If a cancellation is approved before dispatch, the full order amount will be refunded as Yashoda Coins to your wallet.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                7. How to Request a Refund
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                To raise a refund request, contact us with your order ID and reason:
              </p>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                📧 <a href="mailto:info@yashodafashion.com" style={{ color: "#d4af37" }}>info@yashodafashion.com</a><br />
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

export default RefundPloicy;
