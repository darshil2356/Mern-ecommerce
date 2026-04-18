import React from "react";
import { Link } from "react-router-dom";

const BreadCrumb = ({ title, crumbs }) => {
  // crumbs: optional array of { name, url } for multi-level breadcrumbs
  return (
    <nav
      aria-label="breadcrumb"
      className="breadcrumb mb-0 py-4"
      style={{
        background: '#fafafa',
        borderBottom: '1px solid #f0f0f0'
      }}
    >
      <div className="container-xxl">
        <div className="row">
          <div className="col-12">
            <ol
              className="text-center mb-0"
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '4px',
                fontSize: '14px',
              }}
            >
              <li>
                <Link
                  to="/"
                  style={{ color: '#666', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.target.style.color = '#d4af37')}
                  onMouseLeave={(e) => (e.target.style.color = '#666')}
                >
                  Home
                </Link>
              </li>
              {crumbs && crumbs.map((crumb, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#999', margin: '0 6px' }}>/</span>
                  {i < crumbs.length - 1 ? (
                    <Link
                      to={crumb.url}
                      style={{ color: '#666', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.target.style.color = '#d4af37')}
                      onMouseLeave={(e) => (e.target.style.color = '#666')}
                    >
                      {crumb.name}
                    </Link>
                  ) : (
                    <span style={{ color: '#1a1a1a', fontWeight: 600 }} aria-current="page">{crumb.name}</span>
                  )}
                </li>
              ))}
              {!crumbs && title && (
                <li style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#999', margin: '0 10px' }}>/</span>
                  <span style={{ color: '#1a1a1a', fontWeight: 600 }} aria-current="page">{title}</span>
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BreadCrumb;

