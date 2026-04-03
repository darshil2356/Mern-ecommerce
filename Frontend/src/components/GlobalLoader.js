import React from "react";
import { useSelector } from "react-redux";

const GlobalLoader = () => {
  const authLoading = useSelector((s) => s.auth.isLoading);
  const productLoading = useSelector((s) => s.product.isLoading);

  if (!authLoading && !productLoading) return null;

  return (
    <div style={overlay}>
      <div style={box}>
        <div style={spinnerWrap}>
          <div style={ring} />
          <div style={innerDot} />
        </div>
        <p style={text}>Please wait…</p>
      </div>
      <style>{`
        @keyframes gl-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes gl-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.7); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 99999,
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const box = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 14,
};

const spinnerWrap = {
  position: "relative",
  width: 56,
  height: 56,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const ring = {
  position: "absolute",
  inset: 0,
  borderRadius: "50%",
  border: "3px solid transparent",
  borderTopColor: "#6366f1",
  borderRightColor: "#8b5cf6",
  animation: "gl-spin 0.75s linear infinite",
};

const innerDot = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  animation: "gl-pulse 1s ease-in-out infinite",
};

const text = {
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  color: "#6366f1",
  letterSpacing: "0.5px",
};

export default GlobalLoader;
