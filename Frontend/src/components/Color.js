import React from "react";

const Color = ({ colorData, setColor, selectedColor }) => {
  const colors = Array.isArray(colorData) ? colorData : (colorData ? [colorData] : []);

  // Deduplicate by _id
  const uniqueColors = colors.filter(
    (item, idx, self) => item?._id && self.findIndex(c => c?._id === item._id) === idx
  );

  if (uniqueColors.length === 0) return null;

  return (
    <ul className="colors ps-0 d-flex flex-wrap gap-2" style={{ listStyle: 'none', margin: 0 }}>
      {uniqueColors.map((item, index) => {
        const colorId = item?._id;
        const isSelected = selectedColor === colorId;
        return (
          <li
            key={colorId || index}
            onClick={() => setColor(colorId)}
            title={item?.title || item?.name}
            style={{
              backgroundColor: item?.title || item?.name || '#ccc',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              border: isSelected ? '3px solid #d4af37' : '2px solid #e5e5e5',
              boxShadow: isSelected ? '0 0 0 2px #fff, 0 0 0 4px #d4af37' : 'none',
              transform: isSelected ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s ease',
            }}
          />
        );
      })}
    </ul>
  );
};

export default Color;

