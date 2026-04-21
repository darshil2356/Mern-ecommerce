import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { submitProductInquiry, resetInquiryState } from "../features/productInquiry/productInquirySlice";

const StockInquiryModal = ({ isOpen, onClose, product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isSuccess, isError, message } = useSelector((s) => s.productInquiry);
  const user = useSelector((s) => s.auth?.user);

  const [form, setForm] = useState({ color: "", colorName: "", colorHex: "", size: "", quantity: 1, note: "" });

  useEffect(() => {
    if (isSuccess) {
      toast.success("✅ Request sent! Shop owner will check and contact you.");
      dispatch(resetInquiryState());
      onClose();
    }
    if (isError) {
      toast.error(message || "Failed to submit inquiry");
      dispatch(resetInquiryState());
    }
  }, [isSuccess, isError]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) setForm({ color: "", colorName: "", colorHex: "", size: "", quantity: 1, note: "" });
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(submitProductInquiry({
      productId: product._id,
      name: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
      mobile: user.mobile || "",
      email: user.email || "",
      color: form.colorName,
      colorHex: form.colorHex,
      size: form.size,
      quantity: form.quantity,
      note: form.note,
    }));
  };

  // Build unique color list from variants or single color
  const availableColors = (() => {
    if (product?.variants?.length > 0) {
      const seen = new Set();
      return product.variants
        .filter((v) => v.color?._id)
        .map((v) => v.color)
        .filter((c) => {
          const id = c._id?.toString();
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
    }
    return product?.color ? [product.color] : [];
  })();

  // Build sizes from product only — variants sizeStock or top-level sizeStock
  const availableSizes = (() => {
    const sizeSet = new Set();
    if (product?.variants?.length > 0) {
      product.variants.forEach((v) =>
        (v.sizeStock || []).forEach((s) => { if (s.size) sizeSet.add(s.size); })
      );
    }
    if (product?.sizeStock?.length > 0) {
      product.sizeStock.forEach((s) => { if (s.size) sizeSet.add(s.size); });
    }
    // Preserve standard order
    const ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
    return ORDER.filter((s) => sizeSet.has(s));
  })();

  if (!isOpen) return null;

  // Not logged in — show login prompt instead of form
  if (!user) {
    return (
      <AnimatePresence>
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            style={{ background: "#fff", borderRadius: 20, padding: 36, maxWidth: 380, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Login Required</h3>
            <p style={{ margin: "0 0 24px", color: "#666", fontSize: 14, lineHeight: 1.6 }}>
              Please login to request this product. The shop owner will check availability and contact you directly.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: "12px", border: "2px solid #e5e5e5", borderRadius: 10, background: "#fff", color: "#555", fontWeight: 600, cursor: "pointer", fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onClose(); navigate("/login"); }}
                style={{ flex: 1, padding: "12px", border: "none", borderRadius: 10, background: "#1a1a1a", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
              >
                Login Now
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "520px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}
        >
          {/* Header */}
          <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {product?.images?.[0]?.url && (
                <img src={product.images[0].url} alt={product.title}
                  style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid #eee" }} />
              )}
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fee2e2", color: "#dc2626", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
                  CURRENTLY UNAVAILABLE
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{product?.title}</h3>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#888" }}>
                  Shop owner will contact you on <strong>{user.mobile}</strong>
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>×</button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: "20px 24px 28px" }}>

            {/* Color */}
            {availableColors.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Preferred Color</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                  {availableColors.map((c) => {
                    const id = c?._id?.toString();
                    // Ensure hex has # prefix; fallback to title (CSS color name) or grey
                    const rawHex = c?.hex || "";
                    const hex = rawHex
                      ? (rawHex.startsWith("#") ? rawHex : `#${rawHex}`)
                      : (c?.title || "#cccccc");
                    const colorLabel = c?.title || c?.name || "Color";
                    const isSelected = form.color === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setForm({ ...form, color: isSelected ? "" : id, colorName: isSelected ? "" : colorLabel, colorHex: isSelected ? "" : hex })}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "7px 14px 7px 8px", borderRadius: 24,
                          border: `2px solid ${isSelected ? "#d4af37" : "#e5e5e5"}`,
                          background: isSelected ? "#fef9ec" : "#fff",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: hex,
                          border: "1px solid rgba(0,0,0,0.12)",
                          display: "inline-block", flexShrink: 0,
                        }} />
                        {isSelected && <span style={{ fontSize: 12, color: "#d4af37" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size — only product's own sizes */}
            {availableSizes.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Preferred Size</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {availableSizes.map((s) => {
                    const isSelected = form.size === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, size: isSelected ? "" : s })}
                        style={{
                          padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                          border: `2px solid ${isSelected ? "#d4af37" : "#e5e5e5"}`,
                          background: isSelected ? "#d4af37" : "#fff",
                          color: isSelected ? "#fff" : "#555",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                      >{s}</button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Quantity Needed</label>
              <div style={{ display: "flex", alignItems: "center", border: "2px solid #e5e5e5", borderRadius: 10, overflow: "hidden", width: "fit-content", marginTop: 8 }}>
                <button type="button" onClick={() => setForm({ ...form, quantity: Math.max(1, form.quantity - 1) })}
                  style={{ background: "#f5f5f5", border: "none", padding: "10px 18px", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>−</button>
                <span style={{ padding: "10px 22px", fontWeight: 700, fontSize: 16, minWidth: 50, textAlign: "center" }}>{form.quantity}</span>
                <button type="button" onClick={() => setForm({ ...form, quantity: form.quantity + 1 })}
                  style={{ background: "#f5f5f5", border: "none", padding: "10px 18px", cursor: "pointer", fontSize: 18, fontWeight: 700 }}>+</button>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Additional Note <span style={{ fontWeight: 400, color: "#aaa" }}>(optional)</span></label>
              <textarea
                style={{ ...inputStyle, resize: "none", height: 70, marginTop: 8 }}
                placeholder="Any specific requirements..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%", padding: "15px",
                background: isLoading ? "#ccc" : "linear-gradient(135deg, #1a1a1a 0%, #333 100%)",
                color: "#fff", border: "none", borderRadius: 12,
                fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {isLoading
                ? <><span className="spinner-border spinner-border-sm" /> Sending...</>
                : <>📩 Send Request to Shop Owner</>
              }
            </motion.button>

            <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 10, marginBottom: 0 }}>
              Shop owner will check availability and contact you directly.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const labelStyle = { display: "block", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.6px" };
const inputStyle = { width: "100%", padding: "10px 14px", border: "2px solid #e5e5e5", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" };

export default StockInquiryModal;
