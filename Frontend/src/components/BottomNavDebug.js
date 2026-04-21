import React, { useState, useEffect } from 'react';

const BottomNavDebug = () => {
  const [windowWidth, setWindowWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(window.innerWidth <= 991);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      Width: {windowWidth}px | Mobile: {isMobile ? 'YES' : 'NO'}
    </div>
  );
};

export default BottomNavDebug;