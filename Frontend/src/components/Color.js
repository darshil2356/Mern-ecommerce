import React from "react";

const Color = (props) => {
  const { colorData, setColor } = props;
  
  // Handle case where colorData might be a single object or null
  const colors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : []);
  
  return (
    <>
      <ul className="colors ps-0 d-flex flex-wrap gap-2">
        {colors.length > 0 ? (
          colors.map((item, index) => {
            return (
              <li
                onClick={() => setColor(item?._id || item?._id)}
                style={{ 
                  backgroundColor: item?.title || item?.name || '#ccc',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: '2px solid #e5e5e5',
                  transition: 'all 0.2s ease'
                }}
                key={index}
                title={item?.title || item?.name}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.borderColor = '#d4af37';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.borderColor = '#e5e5e5';
                }}
              ></li>
            );
          })
        ) : (
          <li style={{ 
            backgroundColor: '#666', 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%',
            cursor: 'not-allowed',
            opacity: 0.5
          }}></li>
        )}
      </ul>
    </>
  );
};

export default Color;

