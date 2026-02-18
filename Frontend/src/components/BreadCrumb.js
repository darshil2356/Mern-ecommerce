import React from "react";
import { Link } from "react-router-dom";

const BreadCrumb = (props) => {
  const { title } = props;
  return (
    <div 
      className="breadcrumb mb-0 py-4"
      style={{ 
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <div className="container-xxl">
        <div className="row">
          <div className="col-12">
            <p className="text-center mb-0" style={{ fontSize: '14px' }}>
              <Link 
                to="/" 
                style={{ 
                  color: '#666',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                onMouseLeave={(e) => e.target.style.color = '#666'}
              >
                Home
              </Link>
              <span style={{ color: '#999', margin: '0 10px' }}>/</span>
              <span style={{ color: '#1a1a1a', fontWeight: 600 }}>{title}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreadCrumb;

