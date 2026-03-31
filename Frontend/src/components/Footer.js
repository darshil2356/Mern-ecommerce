import React from "react";
import { Link } from "react-router-dom";
import { BsInstagram, BsFacebook, BsTwitter, BsYoutube, BsArrowRight, BsEnvelope, BsTelephone, BsPinMap } from "react-icons/bs";
import { motion } from "framer-motion";

const Footer = () => {
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
                  <input
                    type="email"
                    className="newsletter-input"
                    placeholder="Enter your email address"
                  />
                  <button type="submit" className="newsletter-btn">
                    Subscribe
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer style={{ background: '#1a1a1a', paddingTop: '80px' }}>
        <div className="container-xxl">
          <div className="row gy-5">
            {/* Brand Column */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="footer-brand">
                <Link to="/" style={{ textDecoration: 'none' }}>
                  <h2 
                    className="footer-logo"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '32px',
                      color: '#ffffff'
                    }}
                  >
                    <span style={{ color: '#d4af37' }}>YASHODA</span>
                    <span style={{ color: '#ffffff' }}> FASHION</span>
                  </h2>
                </Link>
                <p className="footer-description" style={{ marginTop: '20px', lineHeight: 1.8 }}>
                  Discover the latest trends in fashion at Yashoda Fashion. We bring you premium quality clothing with style that speaks volumes.
                </p>
                <div className="social-links">
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-icon"
                    style={{ color: '#ffffff' }}
                  >
                    <BsInstagram />
                  </a>
                  <a 
                    href="https://facebook.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-icon"
                    style={{ color: '#ffffff' }}
                  >
                    <BsFacebook />
                  </a>
                  <a 
                    href="https://twitter.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-icon"
                    style={{ color: '#ffffff' }}
                  >
                    <BsTwitter />
                  </a>
                  <a 
                    href="https://youtube.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-icon"
                    style={{ color: '#ffffff' }}
                  >
                    <BsYoutube />
                  </a>
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
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 2 }}>
                <div className="d-flex align-items-start gap-3 mb-3">
                  <BsPinMap style={{ fontSize: '18px', color: '#d4af37', marginTop: '4px' }} />
                  <span>
                    Daiict College, Reliance Cross Rd,<br />
                    Gandhinagar, Gujarat 382007
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <BsTelephone style={{ fontSize: '16px', color: '#d4af37' }} />
                  <a href="tel:+918264954234" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    +91 8264954234
                  </a>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <BsEnvelope style={{ fontSize: '16px', color: '#d4af37' }} />
                  <a href="mailto:devjariwala8444@gmail.com" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    devjariwala8444@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="footer-bottom" style={{ 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            paddingTop: '30px',
            marginTop: '60px',
            paddingBottom: '30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <p className="copyright" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
              © {new Date().getFullYear()} <span style={{ color: '#d4af37' }}>Yashoda Fashion</span>. All rights reserved.
            </p>
            <div className="payment-methods">
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginRight: '10px' }}>We Accept:</span>
              <div className="d-flex gap-2">
                <span style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '6px 12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#fff'
                }}>Visa</span>
                <span style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '6px 12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#fff'
                }}>MasterCard</span>
                <span style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '6px 12px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#fff'
                }}>UPI</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 12px;
        }
        
        .footer-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .footer-links a::before {
          content: '';
          width: 0;
          height: 2px;
          background: #d4af37;
          transition: width 0.3s ease;
        }
        
        .footer-links a:hover {
          color: #d4af37;
          padding-left: 5px;
        }
        
        .footer-links a:hover::before {
          width: 6px;
        }
        
        .social-links {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .social-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
        }
        
        .social-icon:hover {
          background: #d4af37;
          color: #1a1a1a;
          transform: translateY(-3px);
        }
        
        @media (max-width: 768px) {
          .footer-bottom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
};

export default Footer;

