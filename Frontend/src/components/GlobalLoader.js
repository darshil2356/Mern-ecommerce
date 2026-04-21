import React from "react";
import { useSelector } from "react-redux";

const GlobalLoader = () => {
  const authLoading = useSelector((s) => s.auth.isLoading);
  const productLoading = useSelector((s) => s.product.isLoading);

  if (!authLoading && !productLoading) return null;

  return <PremiumLoader />;
};

export const PremiumLoader = ({ message = "Please wait…" }) => (
  <div style={overlay}>
    <div style={box}>
      <div style={spinnerWrap}>
        <div style={outerRing} />
        <div style={middleRing} />
        <div style={innerDot} />
      </div>
      <p style={text}>{message}</p>
    </div>
    <style>{`
      @keyframes gl-spin  { to { transform: rotate(360deg); } }
      @keyframes gl-spin-r { to { transform: rotate(-360deg); } }
      @keyframes gl-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50%       { transform: scale(0.65); opacity: 0.5; }
      }
    `}</style>
  </div>
);

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 99999,
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const box = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
};

const spinnerWrap = {
  position: "relative",
  width: 64,
  height: 64,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const outerRing = {
  position: "absolute",
  inset: 0,
  borderRadius: "50%",
  border: "3px solid transparent",
  borderTopColor: "#6366f1",
  borderRightColor: "#8b5cf6",
  animation: "gl-spin 0.8s linear infinite",
};

const middleRing = {
  position: "absolute",
  inset: 10,
  borderRadius: "50%",
  border: "2px solid transparent",
  borderBottomColor: "#a78bfa",
  borderLeftColor: "#c4b5fd",
  animation: "gl-spin-r 1.1s linear infinite",
};

const innerDot = {
  width: 12,
  height: 12,
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
