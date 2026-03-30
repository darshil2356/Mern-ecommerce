import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BlogCard from "../components/BlogCard";
import Container from "../components/Container";
import { services } from "../utils/Data";
import { useDispatch, useSelector } from "react-redux";
import { getAllBlogs } from "../features/blogs/blogSlice";
import { getAllProducts } from "../features/products/productSlilce";
import { addProdToCart, addBundleToCart } from "../features/user/userSlice";
import ShopTheLook from "../components/ShopTheLook";
import { motion } from "framer-motion";
import { BsArrowRight, BsPlay } from "react-icons/bs";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FiTag, FiStar, FiTrendingUp, FiPackage } from "react-icons/fi";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";
import { toast } from "react-toastify";

// Reusable product card for home page sections
const HomeProductCard = ({ item, navigate }) => (
  <motion.div
    whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
    onClick={() => navigate("/product/" + item?._id)}
    style={{
      background: "#fff",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      cursor: "pointer",
      height: "100%",
      transition: "all 0.3s ease",
    }}
  >
    <div style={{ position: "relative", height: "260px", overflow: "hidden", background: "#f8f8f8" }}>
      {item?.images?.[0]?.url ? (
        <img
          src={item.images[0].url}
          alt={item.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FiPackage style={{ fontSize: "48px", color: "#ddd" }} />
        </div>
      )}
      {item?.tags && (
        <span style={{
          position: "absolute", top: "12px", left: "12px",
          background: item.tags === "special" ? "#ef4444" : item.tags === "new" ? "#1a1a1a" : "#d4af37",
          color: "#fff", padding: "4px 10px", fontSize: "10px", fontWeight: 700,
          borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.5px",
        }}>
          {item.tags === "special" ? "SALE" : item.tags === "new" ? "NEW" : item.tags}
        </span>
      )}
    </div>
    <div style={{ padding: "16px 20px 20px" }}>
      <p style={{ color: "#d4af37", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
        {item?.brand}
      </p>
      <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", marginBottom: "10px", lineHeight: 1.4, color: "#1a1a1a" }}>
        {item?.title?.length > 45 ? item.title.slice(0, 45) + "…" : item?.title}
      </h5>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a" }}>
          ₹{item?.price?.toLocaleString()}
        </span>
        <span style={{
          fontSize: "11px", padding: "3px 10px", borderRadius: "20px", fontWeight: 600,
          background: item?.quantity > 0 ? "#dcfce7" : "#fee2e2",
          color: item?.quantity > 0 ? "#166534" : "#dc2626",
        }}>
          {item?.quantity > 0 ? "In Stock" : "Out of Stock"}
        </span>
      </div>
    </div>
  </motion.div>
);

// Section header component
const SectionHeader = ({ icon, title, linkTo, linkText }) => (
  <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", marginBottom: 0, display: "flex", alignItems: "center", gap: "10px" }}>
      {icon}
      {title}
    </h2>
    {linkTo && (
      <Link to={linkTo} style={{ color: "#d4af37", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
        {linkText || "View All"} <BsArrowRight />
      </Link>
    )}
  </div>
);

const Home = () => {
  const blogState = useSelector((state) => state?.blog?.blog);
  const productState = useSelector((state) => state?.product?.product);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeBundles, setActiveBundles] = useState([]);
  const [addingBundle, setAddingBundle] = useState(null);
  const [bundleSizeModal, setBundleSizeModal] = useState(null);
  const [bundleSelectedSizes, setBundleSelectedSizes] = useState({});

  useEffect(() => {
    dispatch(getAllBlogs());
    dispatch(getAllProducts());
    axios.get(`${base_url}bundles/active`)
      .then(res => setActiveBundles(res.data || []))
      .catch(() => setActiveBundles([]));
  }, [dispatch]);

  const products = productState || [];
  const featuredProducts = products.filter(p => p?.tags === "featured");
  const specialProducts = products.filter(p => p?.tags === "special");
  const popularProducts = products.filter(p => p?.tags === "popular");
  const newArrivals = products.filter(p => p?.tags === "new");
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean).slice(0, 6);

  // Open size modal or add directly
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
      confirmAddBundleToCart(bundle, {});
    }
  };

  const confirmAddBundleToCart = async (bundle, selectedSizes) => {
    setBundleSizeModal(null);
    setAddingBundle(bundle._id);
    try {
      await dispatch(addBundleToCart({ bundleId: bundle._id, selectedSizes })).unwrap();
      toast.success(`🛒 ${bundle.title} added to cart at ₹${bundle.bundlePrice}!`);
      navigate("/cart");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add bundle to cart");
    } finally {
      setAddingBundle(null);
    }
  };

  return (
    <>
      {/* ── HERO ── */}
      <div style={{ position: "relative", height: "88vh", minHeight: "580px", overflow: "hidden", background: "#111" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(images/main-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.45 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.25) 100%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
          <Container class1="">
            <div className="row">
              <div className="col-12 col-lg-7">
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                  <span style={{ display: "inline-block", background: "#d4af37", color: "#1a1a1a", padding: "7px 20px", borderRadius: "30px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", marginBottom: "22px" }}>
                    New Collection 2024
                  </span>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 5vw, 4.2rem)", fontWeight: 700, color: "#fff", lineHeight: 1.1, marginBottom: "20px" }}>
                    Discover Your <br /><span style={{ color: "#d4af37" }}>Style</span> Statement
                  </h1>
                  <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.75)", maxWidth: "480px", marginBottom: "32px", lineHeight: 1.8 }}>
                    Explore our premium collection of contemporary fashion and discover your perfect look.
                  </p>
                  <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                    <button onClick={() => navigate("/product")} style={{ background: "#d4af37", color: "#1a1a1a", border: "none", padding: "15px 34px", borderRadius: "50px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                      Shop Now <BsArrowRight />
                    </button>
                    <button onClick={() => navigate("/reels")} style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.35)", padding: "13px 32px", borderRadius: "50px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
                      <BsPlay /> Watch Reels
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* ── SERVICES ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0" }}>
        <Container class1="py-4">
          <div className="d-flex align-items-center justify-content-center flex-wrap gap-4">
            {services?.map((i, j) => (
              <div key={j} className="d-flex align-items-center gap-3" style={{ padding: "12px 20px" }}>
                <img src={i.image} alt={i.title} style={{ width: "42px", height: "42px", objectFit: "contain" }} />
                <div>
                  <h6 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px" }}>{i.title}</h6>
                  <p className="mb-0" style={{ fontSize: "11px", color: "#999" }}>{i.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ── FREQUENTLY BOUGHT TOGETHER (BUNDLES) ── */}
      {activeBundles.length > 0 && (
        <div style={{ background: "#f0f0ff", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader
              icon={<span style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>BUNDLE</span>}
              title="Frequently Bought Together"
              linkTo="/bundles"
              linkText="View All Bundles"
            />
            <div className="row g-4">
              {activeBundles.slice(0, 4).map((bundle, index) => (
                <div key={index} className="col-12 col-sm-6 col-lg-3">
                  <motion.div
                    whileHover={{ y: -6 }}
                    style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "2px solid #667eea", height: "100%", display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", padding: "14px 18px", color: "#fff" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{bundle.title}</h4>
                      <p style={{ margin: "3px 0 0", fontSize: "11px", opacity: 0.85 }}>{bundle.products?.length} products included</p>
                    </div>
                    <div style={{ padding: "14px", flex: 1 }}>
                      {bundle.products?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="d-flex align-items-start gap-2 mb-2">
                          <div style={{ width: "38px", height: "38px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#f5f5f5" }}>
                            {item.product?.images?.[0]?.url
                              ? <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FiPackage style={{ color: "#ccc" }} /></div>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product?.title}</p>
                            <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "#888" }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                            {item.product?.sizeStock?.length > 0 && (
                              <div className="d-flex gap-1 flex-wrap">
                                {item.product.sizeStock.map(s => (
                                  <span key={s.size} style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "5px", border: s.quantity > 0 ? "1.5px solid #667eea" : "1.5px solid #e5e5e5", color: s.quantity > 0 ? "#667eea" : "#bbb", background: s.quantity > 0 ? "#f0f0ff" : "#f5f5f5", textDecoration: s.quantity > 0 ? "none" : "line-through" }}>{s.size}{s.quantity === 0 && " ✕"}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {bundle.products?.length > 3 && <p style={{ fontSize: "11px", color: "#888", margin: "4px 0 0" }}>+{bundle.products.length - 3} more items</p>}
                      <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "10px 12px", marginTop: "10px" }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: "12px", color: "#999", textDecoration: "line-through" }}>₹{bundle.originalPrice?.toLocaleString()}</span>
                          <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>{bundle.discountPercent}% OFF</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#667eea" }}>₹{bundle.bundlePrice?.toLocaleString()}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#22c55e", fontWeight: 600 }}>You save ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ padding: "0 14px 14px" }}>
                      {(bundle.products || []).some(i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0) && (
                        <p style={{ margin: "0 0 5px", fontSize: "11px", color: "#667eea", fontWeight: 600, textAlign: "center" }}>⚠️ You’ll choose a size for each product</p>
                      )}
                      <button
                        onClick={(e) => handleAddBundleToCart(e, bundle)}
                        disabled={addingBundle === bundle._id}
                        style={{ width: "100%", padding: "11px", background: addingBundle === bundle._id ? "#a5b4fc" : "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: addingBundle === bundle._id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px" }}
                      >
                        <AiOutlineShoppingCart />
                        {addingBundle === bundle._id ? "Adding…" : (bundle.products || []).some(i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0) ? "Select Size & Add to Cart" : "Add Bundle to Cart"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ── SHOP THE LOOK ── */}
      <Container class1="py-5">
        <SectionHeader icon="🎬" title="Shop The Look" linkTo="/reels" linkText="View All Reels" />
        <ShopTheLook navigate={navigate} />
      </Container>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader icon={<FiTag style={{ color: "#d4af37" }} />} title="Shop by Category" />
            <div className="row g-3">
              {categories.map((cat, index) => {
                const colors = ["#1a1a1a", "#2d2d2d", "#3a3a3a", "#4a4a4a", "#5a5a5a", "#6a6a6a"];
                return (
                  <div key={index} className="col-6 col-md-4 col-lg-2">
                    <motion.div
                      whileHover={{ y: -6, scale: 1.02 }}
                      onClick={() => navigate("/product", { state: { category: cat } })}
                      style={{ height: "120px", borderRadius: "14px", background: colors[index % 6], display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}
                    >
                      <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1rem", textTransform: "capitalize", textAlign: "center", padding: "0 10px", margin: 0 }}>
                        {cat}
                      </h3>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </Container>
        </div>
      )}

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <Container class1="py-5">
          <SectionHeader icon={<FiStar style={{ color: "#d4af37" }} />} title="New Arrivals" linkTo="/product" />
          <div className="row g-4">
            {newArrivals.slice(0, 4).map((item, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-3">
                <HomeProductCard item={item} navigate={navigate} />
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* ── FEATURED PRODUCTS ── */}
      {featuredProducts.length > 0 && (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader icon={<FiStar style={{ color: "#d4af37" }} />} title="Featured Products" linkTo="/product" />
            <div className="row g-4">
              {featuredProducts.slice(0, 4).map((item, i) => (
                <div key={i} className="col-12 col-sm-6 col-lg-3">
                  <HomeProductCard item={item} navigate={navigate} />
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ── SPECIAL OFFERS ── */}
      {specialProducts.length > 0 && (
        <Container class1="py-5">
          <SectionHeader icon={<FiTag style={{ color: "#ef4444" }} />} title="Special Offers" linkTo="/product" />
          <div className="row g-4">
            {specialProducts.slice(0, 4).map((item, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-3">
                <HomeProductCard item={item} navigate={navigate} />
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* ── POPULAR PRODUCTS ── */}
      {popularProducts.length > 0 && (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader icon={<FiTrendingUp style={{ color: "#d4af37" }} />} title="Popular Products" linkTo="/product" />
            <div className="row g-4">
              {popularProducts.slice(0, 4).map((item, i) => (
                <div key={i} className="col-12 col-sm-6 col-lg-3">
                  <HomeProductCard item={item} navigate={navigate} />
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ── BLOGS ── */}
      {blogState && blogState.length > 0 && (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader title="Latest Blogs" linkTo="/blog" linkText="View All" />
            <div className="row g-4">
              {blogState.slice(0, 4).map((item, i) => (
                <div key={i} className="col-12 col-md-6 col-lg-3">
                  <BlogCard
                    id={item?._id}
                    title={item?.title}
                    description={item?.description}
                    image={item?.images?.[0]?.url || "/images/placeholder.png"}
                    date={new Date(item?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  />
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ── NEWSLETTER ── */}
      <div style={{ background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", padding: "80px 20px", textAlign: "center" }}>
        <Container>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.4rem", color: "#fff", marginBottom: "14px" }}>Stay in Style</h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", maxWidth: "460px", margin: "0 auto 30px" }}>
              Subscribe for exclusive offers, new arrivals, and style inspiration.
            </p>
            <div style={{ display: "flex", maxWidth: "480px", margin: "0 auto", gap: "10px" }}>
              <input type="email" placeholder="Enter your email" style={{ flex: 1, padding: "14px 22px", borderRadius: "50px", border: "none", fontSize: "15px" }} />
              <button style={{ background: "#d4af37", color: "#1a1a1a", border: "none", padding: "14px 28px", borderRadius: "50px", fontSize: "13px", fontWeight: 700, cursor: "pointer", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Subscribe
              </button>
            </div>
          </motion.div>
        </Container>
      </div>

      {/* Bundle Size Selection Modal */}
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
                        style={{ padding: "8px 16px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: s.quantity === 0 ? "not-allowed" : "pointer", border: bundleSelectedSizes[pid] === s.size ? "2px solid #667eea" : "2px solid #e5e5e5", background: bundleSelectedSizes[pid] === s.size ? "#667eea" : s.quantity === 0 ? "#f5f5f5" : "#fff", color: bundleSelectedSizes[pid] === s.size ? "#fff" : s.quantity === 0 ? "#bbb" : "#333", opacity: s.quantity === 0 ? 0.6 : 1 }}
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
              <button onClick={() => setBundleSizeModal(null)} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "2px solid #e5e5e5", background: "#fff", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => {
                  const missing = (bundleSizeModal.products || []).find(item => {
                    const p = item.product;
                    if (!p) return false;
                    return (p.sizeStock || []).some(s => s.quantity > 0) && !bundleSelectedSizes[p._id?.toString()];
                  });
                  if (missing) { toast.error(`Please select a size for ${missing.product.title}`); return; }
                  confirmAddBundleToCart(bundleSizeModal, bundleSelectedSizes);
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

export default Home;
