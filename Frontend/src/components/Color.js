import React from "react";

const Color = ({ colorData, setColor, selectedColor }) => {
  const colors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : []);

  // Deduplicate by _id
  const uniqueColors = colors.filter(
    (item, idx, self) => item?._id && self.findIndex(c => c?._id === item._id) === idx
  );

  if (uniqueColors.length === 0) return null;

  return (
    <div className="d-flex flex-wrap gap-3">
      {uniqueColors.map((item, index) => {
        const colorId = item?._id;
        const isSelected = selectedColor === colorId;
        const displayName = item?.name || item?.title || "";
        const bgColor = item?.hex && item.hex.startsWith("#") ? item.hex : '#ccc';
        return (
          <div
            key={colorId || index}
            onClick={() => setColor(colorId)}
            style={{ cursor: 'pointer', textAlign: 'center', width: '48px' }}
          >
            <div
              style={{
                backgroundColor: bgColor,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                margin: '0 auto 4px',
                border: isSelected ? '3px solid #d4af37' : '2px solid #e5e5e5',
                boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px #d4af37' : 'none',
                transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            />
            <span style={{ fontSize: '10px', color: '#555', lineHeight: 1 }}>
              {displayName}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Color;

