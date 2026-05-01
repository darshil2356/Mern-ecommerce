import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsInstagram, BsFacebook, BsTwitter, BsYoutube, BsEnvelope, BsTelephone, BsPinMap } from "react-icons/bs";
import { motion } from "framer-motion";
import { getPublicSettings } from "../utils/publicSettings";

const Footer = () => {
  const [store, setStore] = useState({
    storeName: "Yashoda Fashion",
    storeTagline: "Your One-Stop Shopping Destination",
    storeAddress: "",
    storePhone: "",
    storeEmail: "",
  });

  useEffect(() => {
    getPublicSettings().then((data) => {
      setStore({
        storeName:    data.storeName,
        storeTagline: data.storeTagline,
        storeAddress: data.storeAddress,
        storePhone:   data.storePhone,
        storeEmail:   data.storeEmail,
      });
    });
  }, []);

  return (
    <>
      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container-xxl">
          <div className="row align-items-center">
            <div className="col-12 col-lg-6 mb-4 mb-lg-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="newsletter-title">Join Our Fashion Community</h2>
                <p className="newsletter-description">
                  Subscribe to get special offers, free giveaways, and new arrivals
                </p>
              </motion.div>
            </div>
            <div className="col-12 col-lg-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" className="newsletter-input" placeholder="Enter your email address" />
                  <button type="submit" className="newsletter-btn">Subscribe</button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer style={{ background: "#1a1a1a", paddingTop: "80px" }}>
        <div className="container-xxl">
          <div className="row gy-5">

            {/* Brand Column */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="footer-brand">
                <Link to="/" style={{ textDecoration: "none" }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "32px", color: "#ffffff" }}>
                    <span style={{ color: "#d4af37" }}>{store.storeName.split(" ")[0]}</span>
                    <span style={{ color: "#ffffff" }}> {store.storeName.split(" ").slice(1).join(" ")}</span>
                  </h2>
                </Link>
                <p style={{ marginTop: "20px", lineHeight: 1.8, color: "rgba(255,255,255,0.7)", fontSize: "14px" }}>
                  {store.storeTagline}
                </p>
                <div className="social-links">
                  {[
                    { href: "https://instagram.com", icon: <BsInstagram /> },
                    { href: "https://facebook.com",  icon: <BsFacebook /> },
                    { href: "https://twitter.com",   icon: <BsTwitter /> },
                    { href: "https://youtube.com",   icon: <BsYoutube /> },
                  ].map((s, i) => (
                    <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="social-icon" style={{ color: "#ffffff" }}>
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="col-6 col-md-4 col-lg-2">
              <h4 className="footer-title">Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/product">Shop</Link></li>
                <li><Link to="/reels">Reels</Link></li>
                <li><Link to="/my-orders">My Orders</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="col-6 col-md-4 col-lg-2">
              <h4 className="footer-title">Customer Service</h4>
              <ul className="footer-links">
                <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                <li><Link to="/refund-policy">Refund Policy</Link></li>
                <li><Link to="/shipping-policy">Shipping Policy</Link></li>
                <li><Link to="/term-conditions">Terms & Conditions</Link></li>
                <li><Link to="/blogs">Blog</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="col-12 col-md-4 col-lg-4">
              <h4 className="footer-title">Contact Us</h4>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: 2 }}>
                {store.storeAddress && (
                  <div className="d-flex align-items-start gap-3 mb-3">
                    <BsPinMap style={{ fontSize: "18px", color: "#d4af37", marginTop: "4px", flexShrink: 0 }} />
                    <span>{store.storeAddress}</span>
                  </div>
                )}
                {store.storePhone && (
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <BsTelephone style={{ fontSize: "16px", color: "#d4af37", flexShrink: 0 }} />
                    <a href={`tel:${store.storePhone}`} style={{ color: "rgba(255,255,255,0.7)" }}>
                      {store.storePhone}
                    </a>
                  </div>
                )}
                {store.storeEmail && (
                  <div className="d-flex align-items-center gap-3">
                    <BsEnvelope style={{ fontSize: "16px", color: "#d4af37", flexShrink: 0 }} />
                    <a href={`mailto:${store.storeEmail}`} style={{ color: "rgba(255,255,255,0.7)" }}>
                      {store.storeEmail}
                    </a>
                  </div>
                )}
                {!store.storeAddress && !store.storePhone && !store.storeEmail && (
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    Update contact info in Admin → Settings
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Footer Bottom */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "30px",
            marginTop: "60px",
            paddingBottom: "30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: 0 }}>
              © {new Date().getFullYear()} <span style={{ color: "#d4af37" }}>{store.storeName}</span>. All rights reserved.
            </p>
            <div className="d-flex align-items-center gap-2">
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>We Accept:</span>
              {["Visa", "MasterCard", "UPI"].map(m => (
                <span key={m} style={{ background: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", color: "#fff" }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .footer-links { list-style: none; padding: 0; margin: 0; }
        .footer-links li { margin-bottom: 12px; }
        .footer-links a { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 14px; transition: all 0.3s ease; }
        .footer-links a:hover { color: #d4af37; padding-left: 5px; }
        .social-links { display: flex; gap: 12px; margin-top: 24px; }
        .social-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.3s ease; }
        .social-icon:hover { background: #d4af37; color: #1a1a1a !important; transform: translateY(-3px); }
        @media (max-width: 768px) { .footer-bottom { flex-direction: column; text-align: center; } }
        /* Newsletter section mobile */
        @media (max-width: 575px) {
          .newsletter-section { padding: 40px 16px !important; }
          .newsletter-title { font-size: 1.5rem !important; }
          .newsletter-form { flex-direction: column; }
          .newsletter-input { border-radius: 8px !important; width: 100% !important; }
          .newsletter-btn { border-radius: 8px !important; width: 100%; padding: 14px !important; }
        }
      `}</style>
    </>
  );
};

export default Footer;
