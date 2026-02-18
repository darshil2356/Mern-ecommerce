import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const ShippingPolicy = () => {
  return (
    <>
      <Meta title={"Shipping Policy"} />
      <BreadCrumb title="Shipping Policy" />
      
      {/* Hero Section */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '60px 0',
          marginTop: '-1px'
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '3rem',
              color: '#fff',
              marginBottom: '10px'
            }}>
              Shipping <span style={{ color: '#d4af37' }}>Policy</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
              Delivery information and schedules
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ 
            background: '#fff', 
            borderRadius: '16px', 
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                1. Shipping Methods
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We offer multiple shipping options to meet your needs. Standard shipping typically takes 5-10 business days. Express shipping takes 2-5 business days. Overnight shipping is available for select locations. Shipping costs are calculated at checkout based on your location and selected shipping method.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                2. Free Shipping
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We offer free standard shipping on all orders above ₹999. This discount is automatically applied at checkout. Free shipping typically takes 5-10 business days. For orders below ₹999, a flat shipping fee of ₹99 will be charged.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                3. Order Processing Time
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                All orders are processed within 1-2 business days (excluding weekends and holidays). Orders placed after 12 PM IST will be processed the next business day. You will receive a confirmation email with tracking information once your order has been shipped.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                4. Delivery Time
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Delivery times are estimates and begin from the date of shipping. Standard shipping: 5-10 business days. Express shipping: 2-5 business days. Overnight shipping: 1-2 business days. Delivery times may vary due to factors beyond our control such as weather conditions or carrier delays.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                5. International Shipping
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Currently, we ship within India only. We are working on expanding our shipping destinations. Stay tuned for updates on international shipping availability.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                6. Order Tracking
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Once your order has been shipped, you will receive an email with tracking information. You can track your order by clicking the tracking link in the shipping confirmation email or by logging into your account on our website.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                7. Shipping Address
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Please ensure your shipping address is complete and accurate. We are not responsible for packages delivered to incorrect addresses provided by the customer. If you need to change your shipping address after placing an order, please contact us immediately.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                8. Contact Us
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                If you have any questions about our Shipping Policy, please contact us through our contact page or email us at support@example.com.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default ShippingPolicy;

