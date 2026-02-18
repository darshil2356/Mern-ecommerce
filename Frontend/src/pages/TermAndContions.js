import React from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { motion } from "framer-motion";

const TermAndContions = () => {
  return (
    <>
      <Meta title={"Terms & Conditions"} />
      <BreadCrumb title="Terms & Conditions" />
      
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
              Terms & <span style={{ color: '#d4af37' }}>Conditions</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px' }}>
              Rules and regulations for using our website
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
                1. Acceptance of Terms
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this website.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                2. Use License
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                Permission is granted to temporarily use this website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials, use the materials for any commercial purpose or public display, attempt to reverse engineer any software contained on the website, or transfer the materials to another person or entity.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                3. Product Information
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We strive to provide accurate product descriptions and pricing. However, we do not warrant that product descriptions, pricing, or other content on this website is accurate, complete, reliable, current, or error-free. If a product is listed at an incorrect price, we reserve the right to refuse or cancel orders placed at the incorrect price.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                4. User Account
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account or password. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                5. Ordering & Payment
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                By placing an order, you agree to purchase the product(s) at the price shown. We accept all major credit/debit cards and other payment methods as shown at checkout. All payments are processed securely. We reserve the right to limit quantities, refuse orders, or cancel orders at our sole discretion.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                6. Intellectual Property
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance, and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                7. Limitation of Liability
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                In no event shall we be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the website.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                8. Governing Law
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                9. Changes to Terms
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                We reserve the right, at our sole discretion, to modify or replace these terms at any time. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our website after those revisions become effective, you agree to be bound by the revised terms.
              </p>

              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', marginBottom: '15px', marginTop: '30px' }}>
                10. Contact Us
              </h4>
              <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '20px' }}>
                If you have any questions about these Terms & Conditions, please contact us through our contact page or email us at support@example.com.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </>
  );
};

export default TermAndContions;

