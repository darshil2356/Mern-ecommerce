import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const ShippingPolicy = () => {
  return (
    <>
      <Meta
        title="Shipping Policy"
        description="Yashoda Fashion shipping policy – shipping charges based on order and location, delivered via Shiprocket across India."
        keywords="shipping policy, delivery time, Shiprocket, order tracking, Yashoda Fashion shipping"
        url="/shipping-policy"
      />
      <BreadCrumb title="Shipping Policy" />

      <div style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)", padding: "60px 0", marginTop: "-1px" }}>
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#fff", marginBottom: "10px" }}>
              Shipping <span style={{ color: "#d4af37" }}>Policy</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px" }}>
              Delivery information and schedules
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
                1. Shipping Partner
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                All orders at Yashoda Fashion are shipped through <strong>Shiprocket</strong>, one of India's leading logistics platforms. Shiprocket automatically assigns the best available courier partner based on your delivery location and order details to ensure timely and safe delivery.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                2. Shipping Charges
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Shipping charges are <strong>not fixed</strong> and are calculated based on your order value, product weight, and delivery location. The applicable shipping charge will be clearly displayed at checkout before you complete your payment. We do not add any hidden charges.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                3. Free Shipping Offers
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We occasionally run <strong>free shipping promotions</strong> on select orders or during special events. These offers are time-limited and will be communicated via our website banners, notifications, or social media. Free shipping is not a permanent policy and is subject to change without prior notice.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                4. Order Processing Time
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                All orders are processed within <strong>1–2 business days</strong> after payment confirmation (excluding Sundays and public holidays). Orders placed after business hours will be processed the next working day. You will receive a notification once your order is dispatched.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                5. Estimated Delivery Time
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Delivery timelines depend on your location and the courier assigned by Shiprocket:
              </p>
              <ul style={{ color: "#666", lineHeight: 2, paddingLeft: "20px", marginBottom: "20px" }}>
                <li>Within Gujarat: <strong>2–4 business days</strong></li>
                <li>Other metro cities: <strong>3–6 business days</strong></li>
                <li>Remote or rural areas: <strong>5–10 business days</strong></li>
              </ul>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Delivery times are estimates and may vary due to weather conditions, courier delays, or public holidays.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                6. Order Tracking
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Once your order is shipped, you will receive a tracking ID and tracking link via notification or email. You can also track your order directly from the <strong>My Orders</strong> section in your account on our website.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                7. Shipping Address
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                Please ensure your delivery address, pincode, and contact number are accurate at the time of placing the order. We are not responsible for failed deliveries due to incorrect or incomplete address information provided by the customer. Address changes after dispatch are not possible.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                8. Shipping Coverage
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                We currently ship across India only. International shipping is not available at this time.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", marginBottom: "15px", marginTop: "30px" }}>
                9. Contact Us
              </h4>
              <p style={{ color: "#666", lineHeight: 1.8, marginBottom: "20px" }}>
                For any shipping-related queries, reach out to us:<br />
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

export default ShippingPolicy;
