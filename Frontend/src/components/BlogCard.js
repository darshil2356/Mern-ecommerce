import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const BlogCard = (props) => {
  const { id, title, description, image, date } = props;
  
  // Clean up description - remove HTML tags and limit length
  const cleanDescription = description 
    ? description.replace(/<[^>]*>/g, '').substring(0, 100) + "..."
    : "No description available";

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Image */}
      <div style={{ 
        height: '200px', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        <img
          src={image || "images/blog-1.jpg"}
          alt={title || "blog"}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        />
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

