import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { base_url } from "../utils/baseUrl";
import { config } from "../utils/axiosconfig";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const toRad = (deg) => (deg * Math.PI) / 180;

const slicePath = (cx, cy, r, startDeg, endDeg) => {
  const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const e = { x: cx + r * Math.cos(toRad(endDeg)),   y: cy + r * Math.sin(toRad(endDeg)) };
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${cx},${cy} L${s.x},${s.y} A${r},${r},0,${large},1,${e.x},${e.y} Z`;
};

const darken = (hex = "#888888", amt = 40) => {
  const clean = hex.replace("#", "").padEnd(6, "0");
  const n = parseInt(clean, 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};

const ICONS   = { COINS: "🪙", DISCOUNT: "🎁", FREE_PRODUCT: "🎀", NONE: "😔" };
const COLORS  = ["#FF6B6B","#4ECDC4","#45B7D1","#96CEB4","#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F"];

const rewardColor = (type) =>
  ({ COINS: "#f59e0b", DISCOUNT: "#10b981", FREE_PRODUCT: "#8b5cf6", NONE: "#6b7280" }[type] || "#6b7280");

const rewardTitle = (seg) => {
  if (!seg) return "";
  if (seg.rewardType === "NONE")         return "Better Luck Next Time!";
  if (seg.rewardType === "COINS")        return `${seg.rewardValue} Coins Won! 🪙`;
  if (seg.rewardType === "DISCOUNT")     return `${seg.rewardValue}% Discount Won! 🎁`;
  if (seg.rewardType === "FREE_PRODUCT") return "Free Product Won! 🎀";
  return seg.label;
};

const rewardSubtitle = (seg) => {
  if (!seg || seg.rewardType === "NONE") return "No reward this time. Try again tomorrow!";
  if (seg.rewardType === "COINS")        return `${seg.rewardValue} coins have been added to the customer's wallet instantly.`;
  if (seg.rewardType === "DISCOUNT")     return `A ${seg.rewardValue}% discount offer has been saved to the customer's account. It will be auto-applied on the next purchase.`;
  if (seg.rewardType === "FREE_PRODUCT") return "A free product reward has been saved to the customer's account.";
  return "";
};

/* ─── confetti ────────────────────────────────────────────────────────────── */
const Confetti = () => {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    color: ["#FFD700","#FF6B6B","#4ECDC4","#A29BFE","#FD79A8","#00CEC9","#fdba74"][i % 7],
    left: `${(i / 40) * 100}%`,
    delay: `${(i % 8) * 0.08}s`,
    size: `${5 + (i % 5) * 2}px`,
    dur: `${0.9 + (i % 4) * 0.15}s`,
    shape: i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%",
  }));
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:30 }}>
      {pieces.map((p) => (
        <div key={p.id} style={{
          position:"absolute", left:p.left, top:"-12px",
          width:p.size, height:p.size,
          background:p.color, borderRadius:p.shape,
          animation:`cfFall ${p.dur} ${p.delay} ease-in forwards`,
        }} />
      ))}
      <style>{`@keyframes cfFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(500px) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
};

/* ─── main ────────────────────────────────────────────────────────────────── */
/**
 * Props:
 *   isOpen, onClose, onSpinComplete(segment)
 *   customerMobile  → POS mode (admin token)
 *   userId / orderId → online mode (user token)
 *
 * IMPORTANT: onSpinComplete is called only when user clicks "Claim & Continue".
 * This gives the user time to read the result before the sale finalizes.
 */
const SpinWheel = ({ isOpen, onClose, onSpinComplete, customerMobile, userId, orderId }) => {
  const [segments,   setSegments]   = useState([]);
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation,   setRotation]   = useState(0);
  const [result,     setResult]     = useState(null);   // segment object from server
  const [canSpin,    setCanSpin]    = useState(true);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [phase,      setPhase]      = useState("idle"); // idle | spinning | result
  const [confetti,   setConfetti]   = useState(false);
  const pendingResult = useRef(null); // store result until user clicks Claim

  useEffect(() => {
    if (!isOpen) return;
    setResult(null); setErrorMsg(""); setPhase("idle");
    setConfetti(false); pendingResult.current = null;
    loadConfig();
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setLoadingCfg(true);
      const res = await axios.get(`${base_url}spin/config`, config);
      const active = (res.data.segments || []).filter((s) => s.isActive);
      setSegments(active);
      setCanSpin(res.data.isEnabled && active.length > 0);
      if (!res.data.isEnabled) setErrorMsg("Spin wheel is currently disabled.");
    } catch {
      setCanSpin(false);
      setErrorMsg("Failed to load spin wheel. Please try again.");
    } finally {
      setLoadingCfg(false);
    }
  };

  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;
    setIsSpinning(true);
    setPhase("spinning");
    setResult(null);
    setErrorMsg("");

    // Step 1: Call backend FIRST to get the winning segment index
    let serverResult = null;
    try {
      let res;
      if (customerMobile) {
        res = await axios.post(`${base_url}spin/play-pos`, { customerMobile, orderId }, config);
      } else {
        res = await axios.post(`${base_url}spin/play`, { orderId }, config);
      }
      serverResult = res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Spin failed. Please try again.";
      setErrorMsg(msg);
      setPhase("idle");
      setIsSpinning(false);
      return;
    }

    // Step 2: Calculate the exact final rotation so the pointer lands on the winning segment.
    //
    // HOW THE WHEEL IS DRAWN:
    //   Segment i occupies angles from (i * anglePer - 90) to ((i+1) * anglePer - 90) degrees.
    //   So segment i's CENTER in the SVG (before any CSS rotation) is at:
    //     segCenterInSVG = i * anglePer - 90 + anglePer / 2
    //
    // THE POINTER is fixed at the TOP of the wheel container (CSS top:-4px, centered).
    // In SVG coordinates, "top" = -90 degrees (or equivalently 270 degrees).
    //
    // When we apply CSS `rotate(R deg)` to the wheel, every point on the wheel rotates by R.
    // So the winning segment's center ends up at screen angle:
    //     screenAngle = segCenterInSVG + R
    //
    // For the pointer to point at the winning segment, we need screenAngle ≡ -90 (mod 360),
    // i.e., the segment center must be at the top after rotation.
    //
    //   segCenterInSVG + R ≡ -90  (mod 360)
    //   R ≡ -90 - segCenterInSVG  (mod 360)
    //   R ≡ -(segCenterInSVG + 90)  (mod 360)
    //
    // We add enough full 360° spins (minimum 5) so the wheel spins visually,
    // and we keep R always increasing from the current rotation value.

    const n = segments.length;
    const anglePer = 360 / n;
    const winIndex = serverResult.segmentIndex ?? 0;

    const segCenterInSVG = winIndex * anglePer - 90 + anglePer / 2;
    // target final rotation mod 360
    const targetMod = ((-segCenterInSVG - 90) % 360 + 360) % 360;

    // current rotation mod 360
    const currentMod = ((rotation % 360) + 360) % 360;

    // how many extra degrees needed beyond current position
    let delta = (targetMod - currentMod + 360) % 360;
    if (delta === 0) delta = 360; // ensure at least one full spin worth of delta

    // add 5 full spins minimum for visual effect
    const newRot = rotation + 5 * 360 + delta;
    setRotation(newRot);

    // Step 3: Show result after animation completes (5s matches CSS transition)
    setTimeout(() => {
      const seg = serverResult.segment;
      pendingResult.current = seg;
      setResult(seg);
      setCanSpin((serverResult.spinsRemaining || 0) > 0);
      setPhase("result");
      if (seg.rewardType !== "NONE") setConfetti(true);
      setIsSpinning(false);
    }, 5200);
  };

  // Called when user clicks "Claim & Continue" — fire onSpinComplete, parent handles finalizeSale
  const handleClaim = () => {
    const seg = pendingResult.current;
    if (onSpinComplete && seg) {
      onSpinComplete(seg); // parent's onSpinComplete closes wheel + finalizes sale
    } else {
      onClose(); // fallback: parent's onClose finalizes sale
    }
  };

  // Called when user clicks X button or backdrop (no spin result)
  const handleClose = () => {
    if (!isSpinning) {
      onClose(); // parent's onClose handles finalizeSale
    }
  };

  if (!isOpen) return null;

  /* SVG geometry */
  const CX = 160, CY = 160, R = 148, HUB = 32;
  const n = segments.length || 1;
  const anglePer = 360 / n;

  const isWin = result && result.rewardType !== "NONE";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}>
      {/* backdrop */}
      <div
        style={{ position:"absolute", inset:0, background:"rgba(5,5,20,0.88)", backdropFilter:"blur(8px)" }}
        onClick={handleClose}
      />

      {/* modal card */}
      <div style={{
        position:"relative", width:"100%", maxWidth:500,
        borderRadius:28, overflow:"hidden",
        background:"linear-gradient(160deg,#12122a 0%,#0d0d22 55%,#180d2e 100%)",
        boxShadow:"0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)",
      }}>
        {confetti && <Confetti />}

        {/* rainbow top bar */}
        <div style={{
          height:4,
          background:"linear-gradient(90deg,#f59e0b,#ec4899,#8b5cf6,#06b6d4,#10b981,#f59e0b)",
          backgroundSize:"300% 100%",
          animation:"barSlide 3s linear infinite",
        }} />

        {/* close button */}
        <button
          onClick={handleClose}
          disabled={isSpinning}
          style={{
            position:"absolute", top:14, right:14, zIndex:20,
            width:34, height:34, borderRadius:"50%",
            background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)",
            color:"rgba(255,255,255,0.6)", fontSize:16, cursor: isSpinning ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            opacity: isSpinning ? 0.3 : 1, transition:"opacity .2s",
          }}
        >✕</button>

        <div style={{ padding:"24px 24px 28px" }}>

          {/* ── HEADER ── */}
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              background:"linear-gradient(135deg,#f59e0b,#ec4899)",
              borderRadius:50, padding:"5px 18px", marginBottom:10,
            }}>
              <span style={{ fontSize:16 }}>🎰</span>
              <span style={{ color:"#fff", fontWeight:800, fontSize:12, letterSpacing:2, textTransform:"uppercase" }}>
                Spin & Win
              </span>
            </div>
            <h2 style={{ color:"#fff", fontSize:24, fontWeight:800, margin:0 }}>
              {phase === "result" ? (isWin ? "🎉 Congratulations!" : "😔 No Luck This Time") : "Try Your Luck!"}
            </h2>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginTop:4, marginBottom:0 }}>
              {customerMobile ? `Customer: ${customerMobile}` : "Spin the wheel to win a reward"}
            </p>
          </div>

          {/* ── LOADING ── */}
          {loadingCfg && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 0", gap:16 }}>
              <div style={{
                width:44, height:44, borderRadius:"50%",
                border:"3px solid rgba(255,255,255,0.08)", borderTopColor:"#f59e0b",
                animation:"spinAnim 0.8s linear infinite",
              }} />
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13 }}>Loading wheel…</p>
            </div>
          )}

          {/* ── NO SEGMENTS ── */}
          {!loadingCfg && segments.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎡</div>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14 }}>
                {errorMsg || "No spin offers configured yet."}
              </p>
            </div>
          )}

          {/* ── WHEEL + CONTROLS ── */}
          {!loadingCfg && segments.length > 0 && (
            <>
              {/* wheel area */}
              <div style={{ position:"relative", display:"flex", justifyContent:"center", marginBottom:20 }}>
                {/* ambient glow */}
                <div style={{
                  position:"absolute", top:"50%", left:"50%",
                  transform:"translate(-50%,-50%)",
                  width:360, height:360, borderRadius:"50%",
                  background:"radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 65%)",
                  pointerEvents:"none",
                }} />

                {/* pointer arrow */}
                <div style={{
                  position:"absolute", top:-4, left:"50%", transform:"translateX(-50%)",
                  zIndex:10, filter:"drop-shadow(0 3px 6px rgba(0,0,0,0.7))",
                }}>
                  <svg width="26" height="38" viewBox="0 0 26 38">
                    <defs>
                      <linearGradient id="ptrG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                    </defs>
                    <polygon points="13,36 1,5 25,5" fill="url(#ptrG)" />
                    <circle cx="13" cy="7" r="5" fill="#fff" />
                    <circle cx="13" cy="7" r="3" fill="#f59e0b" />
                  </svg>
                </div>

                {/* spinning wheel */}
                <div style={{
                  transform:`rotate(${rotation}deg)`,
                  transition: isSpinning
                    ? "transform 5s cubic-bezier(0.05,0.85,0.15,1)"
                    : "none",
                  borderRadius:"50%",
                  boxShadow:"0 0 0 5px rgba(255,255,255,0.05), 0 16px 48px rgba(0,0,0,0.6)",
                }}>
                  <svg width="320" height="320" viewBox="0 0 320 320">
                    <defs>
                      {segments.map((seg, i) => (
                        <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={seg.color || COLORS[i % COLORS.length]} />
                          <stop offset="100%" stopColor={darken(seg.color || COLORS[i % COLORS.length])} />
                        </radialGradient>
                      ))}
                      <radialGradient id="hubG" cx="40%" cy="35%" r="60%">
                        <stop offset="0%" stopColor="#fde68a" />
                        <stop offset="100%" stopColor="#b45309" />
                      </radialGradient>
                    </defs>

                    {segments.map((seg, i) => {
                      const start = i * anglePer - 90;
                      const end   = start + anglePer;
                      const mid   = start + anglePer / 2;
                      const lr    = R * 0.60;
                      const ir    = R * 0.83;
                      const lx = CX + lr * Math.cos(toRad(mid));
                      const ly = CY + lr * Math.sin(toRad(mid));
                      const ix = CX + ir * Math.cos(toRad(mid));
                      const iy = CY + ir * Math.sin(toRad(mid));
                      const rot = `rotate(${mid + 90},${lx},${ly})`;
                      const irot = `rotate(${mid + 90},${ix},${iy})`;
                      const fs = anglePer > 55 ? 11 : anglePer > 38 ? 9 : 7.5;

                      return (
                        <g key={seg._id || i}>
                          <path d={slicePath(CX,CY,R,start,end)} fill={`url(#rg${i})`} />
                          <path d={slicePath(CX,CY,R,start,end)} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                          <text x={ix} y={iy} textAnchor="middle" dominantBaseline="middle"
                            fontSize={anglePer > 45 ? 17 : 13} transform={irot}>
                            {ICONS[seg.rewardType] || "🎁"}
                          </text>
                          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                            fill="#fff" fontSize={fs} fontWeight="700"
                            fontFamily="system-ui,sans-serif" transform={rot}>
                            {seg.label.length > 9 ? seg.label.slice(0,8)+"…" : seg.label}
                          </text>
                        </g>
                      );
                    })}

                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                    <circle cx={CX} cy={CY} r={HUB+10} fill="rgba(0,0,0,0.55)" />
                    <circle cx={CX} cy={CY} r={HUB+6}  fill="url(#hubG)" />
                    <circle cx={CX} cy={CY} r={HUB+6}  fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                    <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="20">⭐</text>
                  </svg>
                </div>
              </div>

              {/* ── SPINNING DOTS ── */}
              {phase === "spinning" && (
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"center", gap:7, marginBottom:8 }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{
                        width:9, height:9, borderRadius:"50%", background:"#f59e0b",
                        animation:`dotBounce 0.55s ${i*0.14}s ease-in-out infinite alternate`,
                      }} />
                    ))}
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>Spinning the wheel…</p>
                </div>
              )}

              {/* ── ERROR ── */}
              {errorMsg && phase === "idle" && (
                <div style={{
                  background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.3)",
                  borderRadius:12, padding:"10px 16px", marginBottom:16,
                  color:"#fca5a5", fontSize:13, textAlign:"center",
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* ── RESULT CARD ── */}
              {phase === "result" && result && (
                <div style={{
                  borderRadius:20, padding:"20px 22px", marginBottom:18,
                  textAlign:"center",
                  background: isWin
                    ? `linear-gradient(135deg,${rewardColor(result.rewardType)}25,${rewardColor(result.rewardType)}10)`
                    : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${isWin ? rewardColor(result.rewardType)+"55" : "rgba(255,255,255,0.08)"}`,
                  animation:"popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards",
                }}>
                  {/* big icon */}
                  <div style={{ fontSize:52, marginBottom:8, lineHeight:1 }}>
                    {ICONS[result.rewardType] || "🎁"}
                  </div>

                  {/* reward type badge */}
                  <div style={{
                    display:"inline-block",
                    background: isWin ? rewardColor(result.rewardType) : "rgba(255,255,255,0.1)",
                    borderRadius:20, padding:"3px 14px", marginBottom:10,
                    fontSize:11, fontWeight:700, color:"#fff",
                    textTransform:"uppercase", letterSpacing:1.5,
                  }}>
                    {result.rewardType === "NONE" ? "No Reward" : result.rewardType.replace("_"," ")}
                  </div>

                  {/* main reward text */}
                  <p style={{
                    color:"#fff", fontSize:30, fontWeight:900, margin:"0 0 8px",
                    textShadow: isWin ? `0 0 30px ${rewardColor(result.rewardType)}88` : "none",
                  }}>
                    {rewardTitle(result)}
                  </p>

                  {/* subtitle / explanation */}
                  <p style={{
                    color: isWin ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                    fontSize:13, margin:0, lineHeight:1.5,
                  }}>
                    {rewardSubtitle(result)}
                  </p>

                  {/* DISCOUNT — show what was saved */}
                  {result.rewardType === "DISCOUNT" && result.rewardValue > 0 && (
                    <div style={{
                      marginTop:12, padding:"8px 14px",
                      background:"rgba(16,185,129,0.15)", borderRadius:10,
                      border:"1px solid rgba(16,185,129,0.3)",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    }}>
                      <span style={{ fontSize:16 }}>✅</span>
                      <span style={{ color:"#6ee7b7", fontSize:13, fontWeight:600 }}>
                        {result.rewardValue}% discount saved to customer account
                      </span>
                    </div>
                  )}

                  {/* COINS — show what was credited */}
                  {result.rewardType === "COINS" && result.rewardValue > 0 && (
                    <div style={{
                      marginTop:12, padding:"8px 14px",
                      background:"rgba(245,158,11,0.15)", borderRadius:10,
                      border:"1px solid rgba(245,158,11,0.3)",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    }}>
                      <span style={{ fontSize:16 }}>✅</span>
                      <span style={{ color:"#fcd34d", fontSize:13, fontWeight:600 }}>
                        {result.rewardValue} coins added to wallet
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── BUTTONS ── */}
              {phase !== "result" ? (
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || !canSpin}
                  style={{
                    width:"100%", padding:"15px 0", borderRadius:16, border:"none",
                    fontSize:17, fontWeight:800, letterSpacing:0.5, color:"#fff",
                    cursor: isSpinning || !canSpin ? "not-allowed" : "pointer",
                    background: isSpinning || !canSpin
                      ? "rgba(255,255,255,0.08)"
                      : "linear-gradient(135deg,#f59e0b,#ec4899,#8b5cf6)",
                    backgroundSize:"200% 100%",
                    animation: !isSpinning && canSpin ? "btnShimmer 2.5s linear infinite" : "none",
                    boxShadow: !isSpinning && canSpin ? "0 8px 28px rgba(245,158,11,0.35)" : "none",
                    opacity: isSpinning || !canSpin ? 0.45 : 1,
                    transition:"all .25s",
                  }}
                >
                  {isSpinning ? "🎰  Spinning…" : canSpin ? "🎰  SPIN NOW!" : "No Spins Left Today"}
                </button>
              ) : (
                <div style={{ display:"flex", gap:10 }}>
                  {/* Close without action (only for NONE) */}
                  {!isWin && (
                    <button
                      onClick={handleClose}
                      style={{
                        flex:1, padding:"13px 0", borderRadius:14,
                        border:"1px solid rgba(255,255,255,0.12)",
                        background:"rgba(255,255,255,0.06)",
                        color:"rgba(255,255,255,0.6)", fontSize:14, fontWeight:600, cursor:"pointer",
                      }}
                    >
                      Close
                    </button>
                  )}
                  {/* Claim button */}
                  <button
                    onClick={handleClaim}
                    style={{
                      flex: isWin ? 1 : 2, padding:"13px 0", borderRadius:14, border:"none",
                      background: isWin
                        ? `linear-gradient(135deg,${rewardColor(result.rewardType)},${darken(rewardColor(result.rewardType),20)})`
                        : "linear-gradient(135deg,#374151,#1f2937)",
                      color:"#fff", fontSize:15, fontWeight:800, cursor:"pointer",
                      boxShadow: isWin ? `0 6px 20px ${rewardColor(result.rewardType)}55` : "none",
                    }}
                  >
                    {isWin ? "✓  Claim & Continue" : "Continue →"}
                  </button>
                </div>
              )}

              {/* ── LEGEND (idle only) ── */}
              {phase === "idle" && (
                <div style={{ marginTop:18, display:"flex", flexWrap:"wrap", gap:6, justifyContent:"center" }}>
                  {segments.map((seg, i) => (
                    <div key={i} style={{
                      display:"flex", alignItems:"center", gap:5,
                      background:"rgba(255,255,255,0.05)", borderRadius:20,
                      padding:"3px 10px", fontSize:11, color:"rgba(255,255,255,0.55)",
                    }}>
                      <div style={{
                        width:7, height:7, borderRadius:"50%", flexShrink:0,
                        background: seg.color || COLORS[i % COLORS.length],
                      }} />
                      {seg.label}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes barSlide  { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
        @keyframes spinAnim  { to{transform:rotate(360deg)} }
        @keyframes dotBounce { from{transform:translateY(0)} to{transform:translateY(-9px)} }
        @keyframes popIn     { 0%{opacity:0;transform:scale(0.75)} 100%{opacity:1;transform:scale(1)} }
        @keyframes btnShimmer{ 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
      `}</style>
    </div>
  );
};

export default SpinWheel;
