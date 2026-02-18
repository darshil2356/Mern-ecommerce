import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const RefundPloicy = () => {
  return (
    <>
      <Meta title={"Refund Policy"} />
      <BreadCrumb title="Refund Policy" />
      
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
              Refund <span style={{ color: '#d4af37' }}>Policy</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
              Our return and refund policy
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
                1. Return Policy
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We offer a 7-day return policy for most items. To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging. You will need to provide proof of purchase.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                2. Non-Returnable Items
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Certain types of items cannot be returned, including perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                3. Refund Process
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item. If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within a certain amount of days, depending on your card issuer's policies.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                4. Shipping Returns
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                5. Exchanges
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                6. Contact Us
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                If you have any questions about our Refund Policy, please contact us through our contact page or email us at support@example.com.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default RefundPloicy;

