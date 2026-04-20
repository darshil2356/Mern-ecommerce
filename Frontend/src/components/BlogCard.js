import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const BlogPlaceholder = ({ title }) => (
  <div style={{
    width: "100%", height: "100%",
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a0a 50%, #1a1a2e 100%)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 10, position: "relative", overflow: "hidden",
  }}>
    {/* Decorative circles */}
    <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.15)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.1)", pointerEvents: "none" }} />
    {/* Pen/article icon */}
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
    <p style={{ color: "rgba(212,175,55,0.7)", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>Style Journal</p>
    {title && (
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", textAlign: "center", padding: "0 16px", margin: 0, lineHeight: 1.4,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {title}
      </p>
    )}
  </div>
);

const BlogCard = (props) => {
  const { id, title, description, image, date } = props;
  const [imgError, setImgError] = useState(false);

  const cleanDescription = description
    ? description.replace(/<[^>]*>/g, '').substring(0, 100) + "..."
    : "No description available";

  const showPlaceholder = !image || imgError;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#fff', borderRadius: '16px', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {/* Image */}
      <div style={{ height: '200px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        {showPlaceholder ? (
          <BlogPlaceholder title={title} />
        ) : (
          <img
            src={image}
            alt={title || "blog"}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onError={() => setImgError(true)}
            onMouseOver={e => (e.target.style.transform = 'scale(1.08)')}
            onMouseOut={e  => (e.target.style.transform = 'scale(1)')}
          />
        )}
      </div>
      
      {/* Content */}
      <div style={{ 
        padding: '20px', 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <p style={{ 
          fontSize: '12px', 
          color: '#d4af37', 
          fontWeight: 600, 
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {date}
        </p>
        
        <h5 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '12px',
          lineHeight: 1.4,
          color: '#1a1a1a',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {title}
        </h5>
        
        <p style={{
          fontSize: '14px',
          color: '#666',
          lineHeight: 1.6,
          marginBottom: '16px',
          flex: 1
        }}>
          {cleanDescription}
        </p>
        
        <Link 
          to={"/blog/" + id} 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#d4af37',
            fontWeight: 600,
            fontSize: '14px',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.color = '#1a1a1a';
            e.target.style.gap = '12px';
          }}
          onMouseLeave={(e) => {
            e.target.style.color = '#d4af37';
            e.target.style.gap = '8px';
          }}
        >
          Read More →
        </Link>
      </div>
    </motion.div>
  );
};

export default BlogCard;

