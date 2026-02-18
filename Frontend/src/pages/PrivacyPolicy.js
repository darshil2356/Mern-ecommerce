import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  return (
    <>
      <Meta title={"Privacy Policy"} />
      <BreadCrumb title="Privacy Policy" />
      
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
              Privacy <span style={{ color: '#d4af37' }}>Policy</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
              Your privacy is important to us
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
                1. Introduction
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                2. Collection of Information
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We may collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                3. Use of Your Information
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                4. Sharing Your Information
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We only share information with the following third parties: payment processors, advertising networks, data brokers, and other service providers. We may also share your information in response to subpoenas, court orders, or other governmental requests.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                5. Security of Your Information
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                6. Contact Us
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                If you have questions or comments about this policy, you may email us at support@example.com or contact us through our contact page.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default PrivacyPolicy;

