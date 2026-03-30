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
  const [bundleSelectedSizes, setBundleSelectedSizes] = useState({});

  useEffect(() => {
    axios.get(`${base_url}bundles/active`)
      .then(res => setBundles(res.data || []))
      .catch(() => setBundles([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAddBundleToCart = (e, bundle) => {
    e.stopPropagation();
    if (!localStorage.getItem("customer")) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    const needsSizes = (bundle.products || []).some(
      i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0
    );
    if (needsSizes) {
      setBundleSelectedSizes({});
      setBundleSizeModal(bundle);
    } else {
      confirmAddBundle(bundle, {});
    }
  };

  const confirmAddBundle = async (bundle, selectedSizes) => {
    setBundleSizeModal(null);
    setAddingBundle(bundle._id);
    try {
      await dispatch(addBundleToCart({ bundleId: bundle._id, selectedSizes })).unwrap();
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
                  <div style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", padding: "16px 20px", color: "#fff" }}>
                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>{bundle.title}</h4>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", opacity: 0.85 }}>{bundle.products?.length} products included</p>
                  </div>

                  {/* Products */}
                  <div style={{ padding: "16px", flex: 1 }}>
                    {bundle.products?.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-start gap-2 mb-3">
                        <div style={{ width: "42px", height: "42px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#f5f5f5" }}>
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
                          {/* All sizes with stock status */}
                          {item.product?.sizeStock?.length > 0 && (
                            <div className="d-flex gap-1 flex-wrap">
                              <span style={{ fontSize: "10px", color: "#888", marginRight: "2px" }}>Sizes:</span>
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
                    <div style={{ background: "#f9f9f9", borderRadius: "10px", padding: "12px 14px", marginTop: "8px" }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: "12px", color: "#999" }}>Original Price:</span>
                        <span style={{ fontSize: "12px", color: "#999", textDecoration: "line-through" }}>₹{bundle.originalPrice?.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span style={{ fontSize: "15px", fontWeight: 700 }}>Bundle Price:</span>
                        <span style={{ fontSize: "22px", fontWeight: 700, color: "#667eea" }}>₹{bundle.bundlePrice?.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 600 }}>You Save:</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#22c55e" }}>
                          ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()} ({bundle.discountPercent}% OFF)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Button */}
                  <div style={{ padding: "0 16px 16px" }}>
                    {(bundle.products || []).some(i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0) && (
                      <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#667eea", fontWeight: 600, textAlign: "center" }}>
                        ⚠️ You'll choose a size for each product
                      </p>
                    )}
                    <button
                      onClick={(e) => handleAddBundleToCart(e, bundle)}
                      disabled={addingBundle === bundle._id}
                      style={{
                        width: "100%", padding: "12px",
                        background: addingBundle === bundle._id ? "#a5b4fc" : "linear-gradient(135deg,#667eea,#764ba2)",
                        color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700,
                        cursor: addingBundle === bundle._id ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "14px",
                      }}
                    >
                      <AiOutlineShoppingCart />
                      {addingBundle === bundle._id
                        ? "Adding…"
                        : (bundle.products || []).some(i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0)
                          ? "Select Size & Add to Cart"
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
            style={{ background: "#fff", borderRadius: "16px", padding: "30px", maxWidth: "480px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}
          >
            <h4 style={{ marginBottom: "6px", fontWeight: 700 }}>{bundleSizeModal.title}</h4>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>Select a size for each product</p>

            {(bundleSizeModal.products || []).map((item) => {
              const product = item.product;
              if (!product) return null;
              const sizes = product.sizeStock || [];
              if (sizes.length === 0) return null;
              const pid = product._id?.toString();
              return (
                <div key={pid} style={{ marginBottom: "20px" }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    {product.images?.[0]?.url && (
                      <img src={product.images[0].url} alt={product.title} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }} />
                    )}
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{product.title}</span>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {sizes.map(s => (
                      <button
                        key={s.size}
                        disabled={s.quantity === 0}
                        onClick={() => s.quantity > 0 && setBundleSelectedSizes(prev => ({ ...prev, [pid]: s.size }))}
                        style={{
                          padding: "8px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "13px",
                          cursor: s.quantity === 0 ? "not-allowed" : "pointer",
                          border: bundleSelectedSizes[pid] === s.size ? "2px solid #667eea" : s.quantity === 0 ? "2px solid #e5e5e5" : "2px solid #e5e5e5",
                          background: bundleSelectedSizes[pid] === s.size ? "#667eea" : s.quantity === 0 ? "#f5f5f5" : "#fff",
                          color: bundleSelectedSizes[pid] === s.size ? "#fff" : s.quantity === 0 ? "#bbb" : "#333",
                          position: "relative", opacity: s.quantity === 0 ? 0.6 : 1,
                        }}
                      >
                        <span style={{ textDecoration: s.quantity === 0 ? "line-through" : "none" }}>{s.size}</span>
                        {s.quantity === 0
                          ? <span style={{ display: "block", fontSize: "9px", color: "#ef4444", fontWeight: 700, lineHeight: 1 }}>Out of Stock</span>
                          : <span style={{ display: "block", fontSize: "9px", color: "#22c55e", fontWeight: 700, lineHeight: 1 }}>{s.quantity} left</span>
                        }
                      </button>
                    ))}
                  </div>
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
                    return (p.sizeStock || []).some(s => s.quantity > 0) && !bundleSelectedSizes[p._id?.toString()];
                  });
                  if (missing) { toast.error(`Please select a size for ${missing.product.title}`); return; }
                  confirmAddBundle(bundleSizeModal, bundleSelectedSizes);
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
