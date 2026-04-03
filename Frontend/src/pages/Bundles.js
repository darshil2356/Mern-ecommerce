import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { useDispatch } from "react-redux";
import { addBundleToCart } from "../features/user/userSlice";
import { motion } from "framer-motion";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FiPackage } from "react-icons/fi";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";
import { toast } from "react-toastify";

const Bundles = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingBundle, setAddingBundle] = useState(null);
  const [bundleSizeModal, setBundleSizeModal] = useState(null);
  const [bundleSelections, setBundleSelections] = useState({});

  const getColorSwatch = (colorOption) => {
    return colorOption?.hex || colorOption?.title || "#d1d5db";
  };

  useEffect(() => {
    axios.get(`${base_url}bundles/active`)
      .then(res => setBundles(res.data || []))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false));
  }, []);

  const bundleNeedsSelection = (bundle) =>
    (bundle?.products || []).some((item) => {
      const product = item.product;
      if (!product) return false;
      const hasVariantStock = (product.variants || []).some(
        (variant) => (variant.sizeStock || []).some((sizeEntry) => sizeEntry.quantity > 0)
      );
      const hasTopLevelSizes = (product.sizeStock || []).some((sizeEntry) => sizeEntry.quantity > 0);
      return hasVariantStock || hasTopLevelSizes;
    });

  const handleAddBundleToCart = (e, bundle) => {
    e.stopPropagation();
    if (!localStorage.getItem("customer")) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (bundleNeedsSelection(bundle)) {
      setBundleSelections({});
      setBundleSizeModal(bundle);
    } else {
      confirmAddBundle(bundle, {});
    }
  };

  const confirmAddBundle = async (bundle, selectedOptions) => {
    setBundleSizeModal(null);
    setAddingBundle(bundle._id);
    try {
      await dispatch(addBundleToCart({ bundleId: bundle._id, selectedOptions })).unwrap();
      toast.success(`🛒 ${bundle.title} added to cart!`);
      navigate("/cart");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add bundle");
    } finally {
      setAddingBundle(null);
    }
  };

  return (
    <>
      <Meta title="Bundle Deals" />
      <BreadCrumb title="Bundle Deals" />
      <Container class1="py-5">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", marginBottom: 0 }}>
            <span style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", padding: "4px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, marginRight: "12px" }}>
              BUNDLE DEALS
            </span>
            All Bundle Offers
          </h2>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: 0 }}>{bundles.length} bundles available</p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status" />
            <p className="mt-3">Loading bundles...</p>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-5">
            <FiPackage style={{ fontSize: "60px", color: "#ddd", marginBottom: "16px" }} />
            <p style={{ color: "#999", fontSize: "16px" }}>No bundle deals available right now.</p>
          </div>
        ) : (
          <div className="row g-4">
            {bundles.map((bundle, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -6 }}
                  style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "2px solid #667eea", height: "100%", display: "flex", flexDirection: "column" }}
                >
                  {/* Header */}
                  <div style={{ background: "linear-gradient(135deg,#0f172a,#334155)", padding: "18px 20px", color: "#fff" }}>
                    <div className="d-flex align-items-start justify-content-between gap-2">
                      <div>
                        <h4 style={{ margin: 0, fontSize: "17px", fontWeight: 700 }}>{bundle.title}</h4>
                        <p style={{ margin: "6px 0 0", fontSize: "12px", opacity: 0.8 }}>{bundle.products?.length} products included</p>
                      </div>
                      <span style={{ background: "#f59e0b", color: "#111827", padding: "6px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 800, letterSpacing: "0.04em" }}>
                        SAVE {bundle.discountPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Products */}
                  <div style={{ padding: "16px", flex: 1 }}>
                    {bundle.products?.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-3 mb-3" style={{ padding: "12px", borderRadius: "14px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "12px", overflow: "hidden", flexShrink: 0, background: "#e5e7eb" }}>
                          {item.product?.images?.[0]?.url
                            ? <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FiPackage style={{ color: "#ccc" }} /></div>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.product?.title}
                          </p>
                          <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "#888" }}>
                            Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                          </p>
                          {(item.product?.variants || []).length > 0 && (
                            <div className="d-flex gap-1 flex-wrap mb-1">
                              <span style={{ fontSize: "10px", color: "#64748b", marginRight: "4px" }}>Colors:</span>
                              {(item.product.variants || []).map((variant, vIndex) => (
                                <span
                                  key={`${variant.color?._id || variant.color || vIndex}`}
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    borderRadius: "50%",
                                    background: getColorSwatch(variant.color),
                                    border: "1px solid rgba(15,23,42,0.15)",
                                    display: "inline-block",
                                  }}
                                  title={variant.color?.name || variant.color?.title || ""}
                                />
                              ))}
                            </div>
                          )}
                          {/* All sizes with stock status */}
                          {item.product?.sizeStock?.length > 0 && (
                            <div className="d-flex gap-1 flex-wrap">
                              <span style={{ fontSize: "10px", color: "#64748b", marginRight: "2px" }}>Sizes:</span>
                              {item.product.sizeStock.map(s => (
                                <span key={s.size} style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "6px", border: s.quantity > 0 ? "1.5px solid #667eea" : "1.5px solid #e5e5e5", color: s.quantity > 0 ? "#667eea" : "#bbb", background: s.quantity > 0 ? "#f0f0ff" : "#f5f5f5", textDecoration: s.quantity > 0 ? "none" : "line-through" }}>
                                  {s.size}{s.quantity === 0 && " ✕"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pricing */}
                    <div style={{ background: "linear-gradient(180deg,#fff7ed,#ffffff)", borderRadius: "14px", padding: "14px 16px", marginTop: "8px", border: "1px solid #fed7aa" }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: "12px", color: "#9a3412" }}>Original Price:</span>
                        <span style={{ fontSize: "12px", color: "#9a3412", textDecoration: "line-through" }}>₹{bundle.originalPrice?.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Bundle Price:</span>
                        <span style={{ fontSize: "24px", fontWeight: 800, color: "#ea580c" }}>₹{bundle.bundlePrice?.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 700 }}>You Save:</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#15803d" }}>
                          ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()} ({bundle.discountPercent}% OFF)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <div style={{ padding: "0 16px 16px" }}>
                    {bundleNeedsSelection(bundle) && (
                      <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#475569", fontWeight: 700, textAlign: "center" }}>
                        ⚠️ You'll choose the required options for each product
                      </p>
                    )}
                    <button
                      onClick={(e) => handleAddBundleToCart(e, bundle)}
                      disabled={addingBundle === bundle._id}
                      style={{
                        width: "100%", padding: "12px",
                        background: addingBundle === bundle._id ? "#94a3b8" : "linear-gradient(135deg,#111827,#334155)",
                        color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700,
                        cursor: addingBundle === bundle._id ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px",
                      }}
                    >
                      <AiOutlineShoppingCart />
                      {addingBundle === bundle._id
                        ? "Adding…"
                        : bundleNeedsSelection(bundle)
                          ? "Select Options & Add to Cart"
                          : "Add Bundle to Cart"
                      }
                    </button>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Size Selection Modal */}
      {bundleSizeModal && (
        <div
          onClick={() => setBundleSizeModal(null)}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "linear-gradient(180deg,#ffffff,#f8fafc)", borderRadius: "24px", padding: "28px", maxWidth: "560px", width: "100%", maxHeight: "82vh", overflowY: "auto", border: "1px solid #e2e8f0", boxShadow: "0 24px 80px rgba(15,23,42,0.28)" }}
          >
            <div style={{ marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #e2e8f0" }}>
              <h4 style={{ marginBottom: "6px", fontWeight: 800, color: "#0f172a" }}>{bundleSizeModal.title}</h4>
              <p style={{ color: "#475569", fontSize: "14px", marginBottom: "10px" }}>Select the correct color and size for each product before adding this bundle.</p>
              <div className="d-flex flex-wrap gap-2">
                <span style={{ fontSize: "11px", fontWeight: 700, background: "#e0f2fe", color: "#0c4a6e", borderRadius: "999px", padding: "6px 10px" }}>Variant-aware bundle</span>
                <span style={{ fontSize: "11px", fontWeight: 700, background: "#fef3c7", color: "#92400e", borderRadius: "999px", padding: "6px 10px" }}>Your selections are saved in cart</span>
              </div>
            </div>

            {(bundleSizeModal.products || []).map((item) => {
              const product = item.product;
              if (!product) return null;
              const pid = product._id?.toString();
              const variantColors = (product.variants || [])
                .filter((variant) => (variant.sizeStock || []).some((s) => s.quantity > 0))
                .map((variant) => variant.color)
                .filter(Boolean);
              const hasVariantColors = variantColors.length > 0;
              const selectedColor = bundleSelections[pid]?.color || null;
              const sizes = hasVariantColors
                ? ((product.variants || []).find((variant) => {
                    const variantColorId = variant.color?._id || variant.color;
                    return variantColorId?.toString() === selectedColor;
                  })?.sizeStock || [])
                : (product.sizeStock || []);
              const availableSizes = sizes.filter((s) => s.quantity > 0);
              const needsAnySelection = hasVariantColors || sizes.length > 0;
              if (!needsAnySelection) return null;

              const updateSelection = (updates) => {
                setBundleSelections((prev) => ({
                  ...prev,
                  [pid]: {
                    ...prev[pid],
                    ...updates,
                  },
                }));
              };

              return (
                <div key={pid} style={{ marginBottom: "18px", padding: "16px", borderRadius: "18px", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    {product.images?.[0]?.url && (
                      <img src={product.images[0].url} alt={product.title} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "14px" }} />
                    )}
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "15px", display: "block", color: "#0f172a" }}>{product.title}</span>
                      {hasVariantColors && (
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Choose color first, then size</span>
                      )}
                    </div>
                  </div>
                  {hasVariantColors && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "10px", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>Color</div>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {variantColors.map((colorOption, index) => {
                          const colorId = (colorOption?._id || colorOption)?.toString();
                          const isSelected = bundleSelections[pid]?.color === colorId;
                          return (
                            <div
                              key={colorId || index}
                              onClick={() => updateSelection({ color: colorId, size: null })}
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                background: getColorSwatch(colorOption),
                                border: isSelected ? "3px solid #d4af37" : "2px solid #e5e5e5",
                                boxShadow: isSelected ? "0 0 0 3px rgba(212,175,55,0.22)" : "none",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                              title={colorOption?.name || colorOption?.title || ""}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {sizes.length > 0 && (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 700, marginBottom: "10px", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>Size</div>
                      <div className="d-flex gap-2 flex-wrap">
                        {sizes.map((s) => (
                          <button
                            key={s.size}
                            disabled={s.quantity === 0 || (hasVariantColors && !selectedColor)}
                            onClick={() => s.quantity > 0 && (!hasVariantColors || selectedColor) && updateSelection({ size: s.size })}
                            style={{
                              padding: "8px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "13px",
                              cursor: s.quantity === 0 || (hasVariantColors && !selectedColor) ? "not-allowed" : "pointer",
                              border: bundleSelections[pid]?.size === s.size ? "2px solid #0f172a" : "1px solid #cbd5e1",
                              background: bundleSelections[pid]?.size === s.size ? "#0f172a" : s.quantity === 0 ? "#f8fafc" : "#fff",
                              color: bundleSelections[pid]?.size === s.size ? "#fff" : s.quantity === 0 ? "#bbb" : "#333",
                              position: "relative", opacity: s.quantity === 0 || (hasVariantColors && !selectedColor) ? 0.6 : 1,
                            }}
                          >
                            <span style={{ textDecoration: s.quantity === 0 ? "line-through" : "none" }}>{s.size}</span>
                            {s.quantity === 0
                              ? <span style={{ display: "block", fontSize: "9px", color: "#ef4444", fontWeight: 700, lineHeight: 1 }}>Out of Stock</span>
                              : <span style={{ display: "block", fontSize: "9px", color: bundleSelections[pid]?.size === s.size ? "#fff" : "#22c55e", fontWeight: 700, lineHeight: 1 }}>{s.quantity} left</span>
                            }
                          </button>
                        ))}
                      </div>
                      {hasVariantColors && !selectedColor && availableSizes.length === 0 && (
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>Select a color to unlock the available sizes.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="d-flex gap-3 mt-3">
              <button onClick={() => setBundleSizeModal(null)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "2px solid #e5e5e5", background: "#fff", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  const missing = (bundleSizeModal.products || []).find(item => {
                    const p = item.product;
                    if (!p) return false;
                    const pid = p._id?.toString();
                    const hasVariantStock = (p.variants || []).some((variant) => (variant.sizeStock || []).some((s) => s.quantity > 0));
                    const hasTopLevelSizes = (p.sizeStock || []).some((s) => s.quantity > 0);
                    const selection = bundleSelections[pid] || {};
                    if (hasVariantStock) {
                      return !selection.color || !selection.size;
                    }
                    if (hasTopLevelSizes) {
                      return !selection.size;
                    }
                    return false;
                  });
                  if (missing) {
                    const p = missing.product;
                    const hasVariantStock = (p.variants || []).some((variant) => (variant.sizeStock || []).some((s) => s.quantity > 0));
                    toast.error(hasVariantStock ? `Please select color and size for ${p.title}` : `Please select a size for ${p.title}`);
                    return;
                  }
                  confirmAddBundle(bundleSizeModal, bundleSelections);
                }}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}
              >
                Add Bundle to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Bundles;
