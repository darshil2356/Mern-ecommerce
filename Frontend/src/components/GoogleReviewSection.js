import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BsStarFill, BsClipboard, BsClipboardCheck, BsArrowUpRight, BsArrowRepeat } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";
import { getPublicSettings } from "../utils/publicSettings";

const generateRandomReview = (specialty = "") => {
  const openings = [
    "Yashoda Fashion has an amazing collection of ethnic wear.",
    "I had a wonderful shopping experience at Yashoda Fashion.",
    "Yashoda Fashion is definitely the best place for women's clothing.",
    "If you are looking for premium quality ethnic wear, Yashoda Fashion is the place.",
    "Bahut hi sundar collection hai Yashoda Fashion par.",
    "I am absolutely in love with the clothes from Yashoda Fashion.",
    "Yashoda Fashion never disappoints with their designs.",
    "Best shopping store for ladies wear, highly satisfied with Yashoda Fashion.",
    "Yashoda Fashion has become my go-to store for all family functions.",
    "My experience at Yashoda Fashion has been extremely good."
  ];

  const specialtyOpenings = [
    "Yashoda Fashion has an excellent collection of bottoms and pants.",
    "I bought bottom-wear from Yashoda Fashion and it is outstanding.",
    "For good quality ladies bottoms and trousers, Yashoda Fashion is perfect.",
    "Yashoda Fashion's self-manufactured bottoms are really impressive.",
    "Bahut acchi fitting wale bottoms milte hain Yashoda Fashion par."
  ];

  const middleProduct = [
    "I recently bought a beautiful suit set and got so many compliments.",
    "Their kurtis, sarees, and suits have the latest patterns.",
    "The range of traditional and casual outfits they offer is huge.",
    "I purchased a designer saree and a heavy dupatta set from them.",
    "Bought 2 sets of ethnic wear and both look elegant and stylish.",
    "Their collections of kurtas and designer wear are outstanding.",
    "Every piece in their collection looks unique and well-designed.",
    "Bought a kurti set for a family gathering and it looked beautiful.",
    "From daily wear to heavy festive wear, they have everything.",
    "I picked up a festive outfit and it fits me like a dream."
  ];

  const specialtyProduct = [
    "Their bottom-wear designs are very neat and comfortable.",
    "I purchased a pair of pants and they look very smart.",
    "The stitching and fit of their pants and salwars is perfect.",
    "Their collection of manufactured trousers and leggings is amazing.",
    "I bought cotton bottoms and they are extremely comfortable for daily use."
  ];

  const middleQuality = [
    "The fabric quality is super soft and premium.",
    "Stitching is very neat, and the finish is highly professional.",
    "The material feels durable and retains its shine after washing.",
    "Quality wise the clothing is extremely high-grade.",
    "Kapde ka kapda bahut hi soft aur comfortable hai.",
    "The dress material is of very fine quality and comfortable to wear.",
    "Stitching aur finish ekdum perfect aur neat hai.",
    "Even after multiple washes, the quality remains exactly the same.",
    "You can feel the premium quality of the material just by touching it.",
    "Very comfortable fabric that is perfect for all day wear."
  ];

  const middlePriceService = [
    "Prices are very reasonable and totally worth it.",
    "Staff members are very polite, cooperative, and help you select the best.",
    "The pricing is highly competitive for this level of quality.",
    "Excellent customer support and friendly staff behavior.",
    "Saste aur acche damon par premium collection milta hai yahan.",
    "They offer great value for money and discount options.",
    "The staff went out of their way to find my size.",
    "Pricing is fair and they have options for all budgets.",
    "Customer service is quick and they explain the details very well.",
    "It is a budget-friendly store without compromising on look or feel."
  ];

  const closings = [
    "Highly recommend Yashoda Fashion to all ladies!",
    "Will definitely come back for more shopping soon.",
    "Highly recommend this store to friends and family.",
    "Ek baar zaroor visit karein shopping ke liye, you will love it.",
    "I will give them a 5-star rating for their wonderful items.",
    "A must-visit boutique for women's fashion in the city.",
    "Highly recommended to everyone looking for quality outfits.",
    "I am a very happy customer and will shop again soon.",
    "Do visit them for festive wear shopping, highly recommended.",
    "Overall, a fantastic shopping destination for women."
  ];

  const spec = (specialty || "").toLowerCase();
  const isSpecialty = spec.includes("bottom") || spec.includes("bottomwear") || spec.includes("bottom-wear");

  const selectedOpenings = isSpecialty ? specialtyOpenings : openings;
  const selectedProducts = isSpecialty ? specialtyProduct : middleProduct;

  const o = selectedOpenings[Math.floor(Math.random() * selectedOpenings.length)];
  const p = selectedProducts[Math.floor(Math.random() * selectedProducts.length)];
  const q = middleQuality[Math.floor(Math.random() * middleQuality.length)];
  const s = middlePriceService[Math.floor(Math.random() * middlePriceService.length)];
  const c = closings[Math.floor(Math.random() * closings.length)];

  return `${o} ${p} ${q} ${s} ${c}`;
};

const GoogleReviewSection = ({ prodId, specialty } = {}) => {
  const [storeSettings, setStoreSettings] = useState(null);
  useEffect(() => {
    getPublicSettings().then(setStoreSettings);
  }, []);

  const [review, setReview] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    setCopied(false);
    try {
      // build query string when product or specialty provided
      const params = [];
      if (prodId) params.push(`prodId=${encodeURIComponent(prodId)}`);
      if (specialty) params.push(`specialty=${encodeURIComponent(specialty)}`);
      const url = `${base_url}google-review/generate${params.length ? "?" + params.join("&") : ""}`;
      const { data } = await axios.get(url);
      setReview(data.review);
    } catch {
      setReview(generateRandomReview(specialty));
    } finally {
      setLoading(false);
    }
  }, [prodId, specialty]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const handleCopy = () => {
    if (!review) return;
    try {
      navigator.clipboard.writeText(review);
    } catch {
      const el = document.createElement("textarea");
      el.value = review;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWriteReview = () => {
    // Copy text first (sync — browser won't block window.open)
    if (review) {
      try {
        navigator.clipboard.writeText(review);
      } catch {
        const el = document.createElement("textarea");
        el.value = review;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    const reviewUrl = storeSettings?.googleReviewUrl || "https://search.google.com/local/writereview?placeid=ChIJP-z0FraHXjkRP-xoeP6FaF0";
    window.open(reviewUrl, "_blank");
  };

  return (
    <div style={{ background: "linear-gradient(135deg,#faf9f7 0%,#f5f0e8 100%)", padding: "64px 20px" }}>
      <div style={{ maxWidth: 660, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <FcGoogle style={{ fontSize: 26 }} />
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: "#d4af37" }}>
              Share Your Experience
            </span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>
            Love Yashoda Fashion?
          </h2>
          <p style={{ color: "#888", fontSize: "14px", lineHeight: 1.7, maxWidth: 440, margin: "0 auto" }}>
            {storeSettings?.googleReviewRequestMessage || "Copy the review below and share it on Google — it takes just 30 seconds!"}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
            {[1,2,3,4,5].map(s => <BsStarFill key={s} style={{ fontSize: 20, color: "#faad14" }} />)}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={{ background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #f0ece4", overflow: "hidden" }}
        >
          {/* Review text box */}
          <div style={{ padding: "24px 24px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "13px", color: "#1a1a1a" }}>
                ✦ Your ready-to-post review
              </p>
              <button
                onClick={fetchReview}
                disabled={loading}
                title="Get a different review"
                style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", color: "#d4af37", display: "flex", alignItems: "center", gap: 5, fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: 6, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#faf9f7")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <BsArrowRepeat style={{ fontSize: 13, animation: loading ? "spin 0.7s linear infinite" : "none" }} />
                Try another
              </button>
            </div>

            {loading ? (
              <div style={{ padding: "20px 0" }}>
                {[100, 85, 70].map((w, i) => (
                  <div key={i} style={{ height: 14, width: `${w}%`, background: "linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", borderRadius: 6, marginBottom: 10 }} />
                ))}
              </div>
            ) : (
              <textarea
                value={review}
                onChange={e => setReview(e.target.value)}
                rows={5}
                style={{
                  width: "100%", padding: "14px 16px",
                  borderRadius: 12, border: "1.5px solid #e8dfc8",
                  fontSize: "14px", lineHeight: 1.8, color: "#333",
                  background: "#faf9f7", resize: "none",
                  fontFamily: "inherit", outline: "none",
                  boxSizing: "border-box", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#d4af37")}
                onBlur={e => (e.target.style.borderColor = "#e8dfc8")}
              />
            )}
            <p style={{ fontSize: "11px", color: "#bbb", margin: "6px 0 0", textAlign: "right" }}>
              You can edit before copying
            </p>
          </div>

          {/* How it works steps */}
          <div style={{ padding: "16px 24px", display: "flex", gap: 0, borderTop: "1px solid #f5f0e8", marginTop: 16 }}>
            {[
              { n: "1", text: "Copy the review" },
              { n: "2", text: "Click Write on Google" },
              { n: "3", text: "Paste & Submit ✓" },
            ].map((step, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "0 8px", borderRight: i < 2 ? "1px solid #f0ece4" : "none" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#1a1a1a", color: "#d4af37", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>{step.n}</div>
                <p style={{ margin: 0, fontSize: "11px", color: "#888", fontWeight: 600 }}>{step.text}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ padding: "16px 24px 24px", display: "flex", gap: 10, flexDirection: "column" }}>
            {/* Copy button */}
            <button
              onClick={handleCopy}
              disabled={loading}
              style={{
                width: "100%", padding: "13px 20px", borderRadius: 10,
                background: copied
                  ? "linear-gradient(135deg,#16a34a,#15803d)"
                  : "linear-gradient(135deg,#d4af37,#f0c94d,#c9962a)",
                color: copied ? "#fff" : "#1a1a1a",
                border: "none", fontWeight: 800, fontSize: "13px",
                cursor: loading ? "not-allowed" : "pointer",
                textTransform: "uppercase", letterSpacing: "1px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.3s ease",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {copied ? <BsClipboardCheck style={{ fontSize: 15 }} /> : <BsClipboard style={{ fontSize: 15 }} />}
              {copied ? "Copied! Now click Write on Google →" : "Copy Review Text"}
            </button>

            {/* Google redirect button */}
            <button
              onClick={handleWriteReview}
              style={{
                width: "100%", padding: "15px 20px", borderRadius: 10,
                background: "#fff",
                color: "#1a1a1a",
                border: "2px solid #e8e8e8",
                fontWeight: 800, fontSize: "13px",
                cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.25s ease",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4285F4"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(66,133,244,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e8e8"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
            >
              <FcGoogle style={{ fontSize: 20 }} />
              Write on Google Reviews
              <BsArrowUpRight style={{ fontSize: 13, color: "#4285F4" }} />
            </button>

            <p style={{ fontSize: "11px", color: "#bbb", textAlign: "center", margin: 0 }}>
              Opens Google in a new tab — just paste (Ctrl+V / ⌘V) and hit Post
            </p>
          </div>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20, flexWrap: "wrap" }}
        >
          {["50,000+ Happy Customers", "4.9★ Avg Rating", "100% Authentic"].map(text => (
            <span key={text} style={{ fontSize: "11px", color: "#aaa", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <BsStarFill style={{ color: "#faad14", fontSize: 9 }} /> {text}
            </span>
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>
    </div>
  );
};

export default GoogleReviewSection;
