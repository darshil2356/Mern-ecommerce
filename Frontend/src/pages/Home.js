import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Meta from "../components/Meta";
import BlogCard from "../components/BlogCard";
import Container from "../components/Container";
import { services } from "../utils/Data";
import { useDispatch, useSelector } from "react-redux";
import { getAllBlogs } from "../features/blogs/blogSlice";
import { getAllProducts } from "../features/products/productSlilce";
import { addBundleToCart } from "../features/user/userSlice";
import ShopTheLook from "../components/ShopTheLook";
import { motion } from "framer-motion";
import { BsArrowRight, BsPlay } from "react-icons/bs";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FiTag, FiStar, FiTrendingUp, FiPackage } from "react-icons/fi";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";
import { toast } from "react-toastify";

// Reusable product card for home page sections
  const ProductSkeleton = () => (
    <motion.div
      className="animate-scale-in"
      style={{
        background: "#fff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        height: "100%",
        animation: "shimmer 0.8s linear infinite"
      }}
    >
      {/* Image area */}
      <div style={{ 
        position: "relative", 
        height: "260px", 
        overflow: "hidden", 
        background: "var(--surface-2, #f8fafc)"
      }}>
        <div 
          className="skeleton-block"
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            width: "60px",
            height: "20px",
            borderRadius: "4px"
          }}
        />
        <div 
          className="skeleton-block"
          style={{
            width: "100%",
            height: "100%",
            animation: "shimmer 1s linear infinite"
          }}
        />
      </div>
      
      {/* Content area */}
      <div style={{ padding: "16px 20px 20px" }}>
        {/* Brand */}
        <div 
          className="skeleton-block"
          style={{
            width: "80px",
            height: "12px",
            marginBottom: "6px",
            borderRadius: "2px"
          }}
        />
        {/* Title */}
        <div 
          className="skeleton-block"
          style={{
            width: "100%",
            height: "18px",
            marginBottom: "10px",
            borderRadius: "2px"
          }}
        />
        <div 
          className="skeleton-block"
          style={{
            width: "60px",
            height: "12px",
            marginBottom: "10px",
            borderRadius: "20px",
            float: "right"
          }}
        />
        {/* Price */}
        <div 
          className="skeleton-block"
          style={{
            width: "90px",
            height: "24px",
            marginBottom: "4px",
            borderRadius: "2px"
          }}
        />
      </div>
    </motion.div>
  );

  const HomeProductCard = ({ item, navigate }) => (
    <motion.div
      whileHover={{ y: -6, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
      className="animate-fade-in"
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
  const [isLoading, setIsLoading] = useState(true);
  const [activeBundles, setActiveBundles] = useState([]);
  const [addingBundle, setAddingBundle] = useState(null);
  const [bundleSizeModal, setBundleSizeModal] = useState(null);
  const [bundleSelections, setBundleSelections] = useState({});

  const hasProductStock = (product) => {
    if (!product) return false;
    // Sum all sizeStock across variants and top-level
    let totalStock = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.sizeStock) {
          variant.sizeStock.forEach(stock => {
            totalStock += stock.quantity || 0;
          });
        }
      });
    }
    if (product.sizeStock) {
      product.sizeStock.forEach(stock => {
        totalStock += stock.quantity || 0;
      });
    }
    totalStock += product.quantity || 0;
    return totalStock > 0;
  };

  const isBundleAvailable = (bundle) => {
    return (bundle?.products || []).every(item => hasProductStock(item.product));
  };

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

  const getColorSwatch = (colorOption) =>
    colorOption?.hex || colorOption?.title || "#d1d5db";

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(getAllBlogs()),
          dispatch(getAllProducts())
        ]);
        const bundlesRes = await axios.get(`${base_url}bundles/active`);
        setActiveBundles(bundlesRes.data || []);
      } catch (error) {
        console.error('Data load error:', error);
        setActiveBundles([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
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
    if (bundleNeedsSelection(bundle)) {
      setBundleSelections({});
      setBundleSizeModal(bundle);
    } else {
      confirmAddBundleToCart(bundle, {});
    }
  };

  const confirmAddBundleToCart = async (bundle, selectedOptions) => {
    setBundleSizeModal(null);
    setAddingBundle(bundle._id);
    try {
      await dispatch(addBundleToCart({ bundleId: bundle._id, selectedOptions })).unwrap();
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
      <Meta
        title="Premium Fashion & Clothing"
        description="Yashoda Fashion – Shop the latest fashion trends, new arrivals, bundles, and exclusive deals online in India."
        keywords="fashion, clothing, online shopping, new arrivals, premium fashion, Yashoda Fashion, India"
        url="/"
      />
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
            <div className="row g-3">
              {activeBundles.slice(0, 4).map((bundle, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <motion.div
                    whileHover={{ y: -5, boxShadow: "0 12px 32px rgba(0,0,0,0.16)" }}
                    style={{ background: "#fff", borderRadius: "18px", overflow: "hidden", boxShadow: "0 6px 24px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb", height: "100%", display: "flex", flexDirection: "column" }}
                  >
                    <div style={{ background: "linear-gradient(135deg,#334155,#0f172a)", padding: "16px 18px", color: "#fff" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 800, lineHeight: 1.2 }}>{bundle.title}</h4>
                      <p style={{ margin: "6px 0 0", fontSize: "12px", opacity: 0.85 }}>{bundle.products?.length} products included</p>
                    </div>
                    <div style={{ padding: "16px", flex: 1 }}>
                      {bundle.products?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="d-flex align-items-start gap-3 mb-2" style={{ borderRadius: "12px", padding: "8px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#f5f5f5" }}>
                            {item.product?.images?.[0]?.url
                              ? <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FiPackage style={{ color: "#ccc" }} /></div>
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product?.title}</p>
                            <p style={{ margin: "2px 0 4px", fontSize: "11px", color: "#888" }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                            {!hasProductStock(item.product) && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                background: '#fee2e2', color: '#dc2626', padding: '2px 6px',
                                borderRadius: '10px', fontSize: '10px', fontWeight: 600,
                                marginTop: '2px'
                              }}>
                                ⚠️ Out of Stock
                              </span>
                            )}
                            {(item.product?.variants || []).length > 0 && (
                              <div className="d-flex gap-1 flex-wrap mb-1">
                                {(item.product.variants || []).map((variant, vIndex) => (
                                  <span
                                    key={`${variant.color?._id || variant.color || vIndex}`}
                                    style={{
                                      width: "14px",
                                      height: "14px",
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
                      <div style={{ background: "linear-gradient(180deg,#f0f9ff,#f8fafc)", borderRadius: "10px", padding: "12px 14px", marginTop: "12px", border: "1px solid #dbeafe" }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span style={{ fontSize: "12px", color: "#64748b", textDecoration: "line-through" }}>₹{bundle.originalPrice?.toLocaleString()}</span>
                          <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "3px 9px", borderRadius: "10px", fontWeight: 700 }}>{bundle.discountPercent}% OFF</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1e293b" }}>₹{bundle.bundlePrice?.toLocaleString()}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#10b981", fontWeight: 700 }}>You save ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ padding: "0 16px 16px" }}>
                      {bundleNeedsSelection(bundle) && (
                        <p style={{ margin: "0 0 5px", fontSize: "11px", color: "#667eea", fontWeight: 600, textAlign: "center" }}>⚠️ You’ll choose options for each product</p>
                      )}
                      {!isBundleAvailable(bundle) && (
                        <div style={{
                          width: '100%',
                          marginTop: '12px',
                          padding: '12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          borderRadius: '8px',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '13px'
                        }}>
                          ❌ Contains out-of-stock items
                        </div>
                      )}
                      <button
                        onClick={(e) => handleAddBundleToCart(e, bundle)}
                        disabled={addingBundle === bundle._id || !isBundleAvailable(bundle)}
                        style={{
                          width: "100%",
                          padding: "11px",
                          background: (addingBundle === bundle._id || !isBundleAvailable(bundle))
                            ? "#a5b4fc"
                            : "linear-gradient(135deg,#667eea,#764ba2)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          fontWeight: 700,
                          cursor: (addingBundle === bundle._id || !isBundleAvailable(bundle)) ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          fontSize: "13px",
                          opacity: !isBundleAvailable(bundle) ? 0.6 : 1
                        }}
                      >
                        <AiOutlineShoppingCart />
                        {addingBundle === bundle._id
                          ? "Adding…"
                          : !isBundleAvailable(bundle)
                            ? "Out of Stock"
                            : bundleNeedsSelection(bundle)
                              ? "Select Options & Add to Cart"
                              : "Add Bundle to Cart"}
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
        {isLoading ? (
          <div className="shop-the-look-container d-flex gap-4 overflow-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingBottom: '16px', height: '450px' }}>
            {Array.from({length: 3}).map((_, i) => (
              <div key={`look-skel-${i}`} className="shop-the-look-item" style={{
                minWidth: '300px',
                height: '400px',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                marginRight: '16px',
                flexShrink: 0,
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
              }}>
                <div className="skeleton-block" style={{width: '100%', height: '100%', animation: 'shimmer 0.8s linear infinite'}} />
                <div className="skeleton-block" style={{
                  position: 'absolute', top: '16px', left: '16px',
                  width: '80px', height: '20px', borderRadius: '20px'
                }} />
                <div className="skeleton-block" style={{
                  position: 'absolute', bottom: '20px', left: '20px', right: '20px',
                  height: '120px'
                }}>
                  <div style={{height: '24px', marginBottom: '8px', borderRadius: '4px'}} />
                  <div style={{width: '120px', height: '28px', borderRadius: '4px', marginBottom: '16px'}} />
                  <div style={{width: '140px', height: '40px', borderRadius: '30px'}} />
                </div>
                <div className="skeleton-block" style={{
                  position: 'absolute', right: '12px', bottom: '140px',
                  width: '40px', height: '60px'
                }} />
              </div>
            ))}
          </div>
        ) : (
          <ShopTheLook navigate={navigate} />
        )}
      </Container>

      {/* ── CATEGORIES ── */}
      {categories.length > 0 && (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader icon={<FiTag style={{ color: "#d4af37" }} />} title="Shop by Category" />
            <div className="row g-3">
              {isLoading || categories.length === 0 ? (
                Array.from({length: 12}).map((_, i) => (
                  <div key={`cat-skel-${i}`} className="col-6 col-md-4 col-lg-3">
                    <div 
                      className="skeleton-block"
                      style={{
                        height: "120px", 
                        borderRadius: "14px", 
                        animation: "shimmer 1s linear infinite"
                      }}
                    />
                  </div>
                ))
              ) : (
                categories.map((cat, index) => {
                  const colors = ["#1a1a1a", "#2d2d2d", "#3a3a3a", "#4a4a4a", "#5a5a5a", "#6a6a6a"];
                  return (
                    <div key={index} className="col-6 col-md-4 col-lg-2">
                      <motion.div
                        whileHover={{ y: "-6", scale: 1.02 }}
                        onClick={() => navigate("/product", { state: { category: cat } })}
                        style={{ height: "120px", borderRadius: "14px", background: colors[index % 6], display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.15)" }}
                      >
                        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1rem", textTransform: "capitalize", textAlign: "center", padding: "0 10px", margin: 0 }}>
                          {cat}
                        </h3>
                      </motion.div>
                    </div>
                  );
                })
              )}
            </div>
          </Container>
        </div>
      )}

      {/* ── NEW ARRIVALS ── */}
{isLoading || newArrivals.length > 0 ? (
        <Container class1="py-5">
          <SectionHeader icon={<FiStar style={{ color: "#d4af37" }} />} title="New Arrivals" linkTo="/product" />
          <div className="row g-4">
            {isLoading ? Array.from({length: 8}).map((_, i) => (
              <div key={`new-skel-${i}`} className="col-12 col-sm-6 col-lg-3">
                <ProductSkeleton />
              </div>
            )) : newArrivals.slice(0, 4).map((item, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-3">
                <HomeProductCard item={item} navigate={navigate} />
              </div>
            ))}
          </div>
        </Container>
      ) : null}

      {/* ── FEATURED PRODUCTS ── */}
{isLoading || featuredProducts.length > 0 ? (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader icon={<FiStar style={{ color: "#d4af37" }} />} title="Featured Products" linkTo="/product" />
            <div className="row g-4">
              {isLoading ? Array.from({length: 8}).map((_, i) => (
                <div key={`feat-skel-${i}`} className="col-12 col-sm-6 col-lg-3">
                  <ProductSkeleton />
                </div>
              )) : featuredProducts.slice(0, 4).map((item, i) => (
                <div key={i} className="col-12 col-sm-6 col-lg-3">
                  <HomeProductCard item={item} navigate={navigate} />
                </div>
              ))}
            </div>
          </Container>
        </div>
      ) : null}

      {/* ── SPECIAL OFFERS ── */}
{isLoading || specialProducts.length > 0 ? (
        <Container class1="py-5">
          <SectionHeader icon={<FiTag style={{ color: "#ef4444" }} />} title="Special Offers" linkTo="/product" />
          <div className="row g-4">
            {isLoading ? Array.from({length: 8}).map((_, i) => (
              <div key={`special-skel-${i}`} className="col-12 col-sm-6 col-lg-3">
                <ProductSkeleton />
              </div>
            )) : specialProducts.slice(0, 4).map((item, i) => (
              <div key={i} className="col-12 col-sm-6 col-lg-3">
                <HomeProductCard item={item} navigate={navigate} />
              </div>
            ))}
          </div>
        </Container>
      ) : null}

      {/* ── POPULAR PRODUCTS ── */}
{isLoading || popularProducts.length > 0 ? (
        <div style={{ background: "#f9f9f9", padding: "60px 0" }}>
          <Container class1="">
            <SectionHeader icon={<FiTrendingUp style={{ color: "#d4af37" }} />} title="Popular Products" linkTo="/product" />
            <div className="row g-4">
              {isLoading ? Array.from({length: 8}).map((_, i) => (
                <div key={`pop-skel-${i}`} className="col-12 col-sm-6 col-lg-3">
                  <ProductSkeleton />
                </div>
              )) : popularProducts.slice(0, 4).map((item, i) => (
                <div key={i} className="col-12 col-sm-6 col-lg-3">
                  <HomeProductCard item={item} navigate={navigate} />
                </div>
              ))}
            </div>
          </Container>
        </div>
      ) : null}

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
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.64)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0.5rem',
            touchAction: 'none'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px 24px 0 0',
              width: '100%', maxWidth: '620px',
              maxHeight: '88vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.35)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
          >
            {/* Sticky Header */}
            <div style={{
              padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9',
              position: 'sticky', top: 0, background: '#fff', zIndex: 10,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  {bundleSizeModal.title}
                </h3>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                  Configure options for {bundleSizeModal.products?.length || 0} products
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Progress Indicator */}
                {(() => {
                  const productsWithOptions = bundleSizeModal.products?.filter(item => {
                    const p = item.product;
                    if (!p) return false;
                    const hasVariantStock = (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0));
                    const hasTopLevelSizes = (p.sizeStock || []).some(s => s.quantity > 0);
                    return hasVariantStock || hasTopLevelSizes;
                  }).length || 0;

                  const configuredCount = Object.values(bundleSelections).filter(s => s.color && s.size).length;
                  const progress = productsWithOptions > 0 ? Math.round((configuredCount / productsWithOptions) * 100) : 0;

                  return (
                    <div style={{ minWidth: '100px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        {configuredCount}/{productsWithOptions} configured
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', background: `linear-gradient(90deg, #10b981 0%, #059669 100%)`,
                          width: `${progress}%`, transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={() => setBundleSizeModal(null)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: 'none', background: '#f1f5f9', color: '#64748b',
                    fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
              {(bundleSizeModal.products || []).map((item, index) => {
                const product = item.product;
                const productId = product?._id?.toString() || `home-${index}`;
                if (!product) {
                  return (
                    <div key={`missing-${index}`} style={{
                      padding: '1.5rem', marginBottom: '1rem',
                      background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px'
                    }}>
                      <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>⚠️ Product not found</p>
                    </div>
                  );
                }

                const variantColors = (product.variants || [])
                  .filter(variant => (variant.sizeStock || []).some(s => s.quantity > 0))
                  .map(variant => variant.color).filter(Boolean);
                const hasVariantColors = variantColors.length > 0;
                const selectedColor = bundleSelections[productId]?.color;
                const sizes = hasVariantColors
                  ? ((product.variants || []).find(variant => {
                    const variantColorId = variant.color?._id || variant.color;
                    return variantColorId?.toString() === selectedColor;
                  })?.sizeStock || [])
                  : (product.sizeStock || []);

                // Fix: needsSelection = has ANY available stock to select from
                const hasAvailableStock = sizes.some(s => s.quantity > 0) || hasVariantColors;
                const needsSelection = hasAvailableStock;
                const isConfigured = !needsSelection || (bundleSelections[productId]?.color && bundleSelections[productId]?.size);
                const statusColor = isConfigured ? '#10b981' : '#f59e0b';

                return (
                  <div key={productId} style={{
                    marginBottom: '1.5rem', padding: '1.25rem',
                    borderRadius: '16px', border: `2px solid ${isConfigured ? '#d1fae5' : '#fef3c7'}`,
                    background: isConfigured ? '#f0fdf4' : '#fffbeb'
                  }}>
                    {/* Product Header */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem'
                    }}>
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.title}
                          style={{
                            width: '56px', height: '56px', objectFit: 'cover',
                            borderRadius: '12px', flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '56px', height: '56px', background: '#f3f4f6',
                          borderRadius: '12px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0
                        }}>
                          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>No Img</span>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600,
                          color: '#1e293b'
                        }}>
                          {product.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                        </p>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          marginTop: '0.25rem'
                        }}>
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            backgroundColor: statusColor
                          }} />
                          <span style={{ fontSize: '0.75rem', color: statusColor, fontWeight: 500 }}>
                            {isConfigured ? '✓ Configured' : '⚠️ Needs selection'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    {hasAvailableStock ? (
                      <>
                        {hasVariantColors && (
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                              Color
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              {variantColors.map((colorOption, cIndex) => {
                                const colorId = (colorOption?._id || colorOption)?.toString();
                                const isSelected = bundleSelections[productId]?.color === colorId;
                                return (
                                  <button
                                    key={colorId || cIndex}
                                    onClick={() => setBundleSelections(prev => ({
                                      ...prev,
                                      [productId]: { ...prev[productId], color: colorId, size: null }
                                    }))}
                                    style={{
                                      width: '44px', height: '44px', borderRadius: '50%',
                                      border: isSelected ? '3px solid #eab308' : '2px solid #e5e7eb',
                                      backgroundColor: isSelected ? '#fef3c7' : getColorSwatch(colorOption),
                                      cursor: 'pointer', flexShrink: 0,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'all 0.2s ease', minWidth: '44px'
                                    }}
                                    title={colorOption?.name || colorOption?.title || 'Select color'}
                                  >
                                    {isSelected && (
                                      <span style={{
                                        fontSize: '0.75rem', color: '#92400e', fontWeight: 700
                                      }}>
                                        ✓
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {sizes.length > 0 && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                              Size
                            </label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                              {sizes.map((sizeOption) => {
                                const isSelected = bundleSelections[productId]?.size === sizeOption.size;
                                const canSelect = sizeOption.quantity > 0 && (!hasVariantColors || selectedColor);
                                return (
                                  <button
                                    key={sizeOption.size}
                                    disabled={!canSelect}
                                    onClick={() => canSelect && setBundleSelections(prev => ({
                                      ...prev,
                                      [productId]: { ...prev[productId], size: sizeOption.size }
                                    }))}
                                    style={{
                                      padding: '0.75rem 1.25rem', minWidth: '72px',
                                      borderRadius: '12px', fontWeight: 600, fontSize: '0.875rem',
                                      border: isSelected ? '2px solid #1e40af' : '1px solid #d1d5db',
                                      backgroundColor: isSelected ? '#1e40af' :
                                        !canSelect ? '#f3f4f6' : 'white',
                                      color: isSelected ? 'white' : !canSelect ? '#9ca3af' : '#374151',
                                      cursor: canSelect ? 'pointer' : 'not-allowed',
                                      opacity: canSelect ? 1 : 0.6,
                                      transition: 'all 0.2s ease',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {sizeOption.size}
                                    <div style={{ fontSize: '0.6875rem', opacity: 0.8, marginTop: '0.125rem' }}>
                                      {sizeOption.quantity === 0 ? 'Out of Stock' : `${sizeOption.quantity} left`}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{
                        padding: '1rem', textAlign: 'center',
                        background: hasAvailableStock ? '#ecfdf5' : '#fef2f2',
                        borderRadius: '12px',
                        border: hasAvailableStock ? '1px solid #bbf7d0' : '1px solid #fecaca'
                      }}>
                        <p style={{
                          margin: 0, fontSize: '0.875rem',
                          color: hasAvailableStock ? '#166534' : '#dc2626', fontWeight: 500
                        }}>
                          {hasAvailableStock ? '✓ Fixed quantity - no selection needed' : '⚠️ Out of stock - cannot select'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fixed Footer */}
            <div style={{
              padding: '1.5rem 2rem', borderTop: '1px solid #f1f5f9',
              background: '#fff', borderRadius: '0 0 20px 20px'
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  All selections must be made before adding to cart
                </div>
                <div style={{ display: 'flex', gap: '1rem', flex: '1', minWidth: '280px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setBundleSizeModal(null)}
                    style={{
                      flex: '1', maxWidth: '140px', padding: '0.875rem 1.5rem',
                      borderRadius: '12px', border: '1px solid #d1d5db',
                      background: 'white', color: '#374151', fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const incompleteProducts = (bundleSizeModal.products || [])
                        .filter(item => {
                          const p = item.product;
                          if (!p) return true;
                          const pid = p._id?.toString();
                          const sizes = (p.sizeStock || []);
                          const hasAvailableSizes = sizes.some(s => s.quantity > 0);
                          const hasVariantStock = (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0));
                          const hasAnyAvailableStock = hasAvailableSizes || hasVariantStock;
                          const selection = bundleSelections[pid] || {};
                          if (!hasAnyAvailableStock) return false; // Fixed qty OK
                          return (!selection.color || !selection.size);
                        });

                      if (incompleteProducts.length > 0) {
                        toast.error(`Please complete selections for ${incompleteProducts.length} product(s)`);
                        return;
                      }
                      confirmAddBundleToCart(bundleSizeModal, bundleSelections);
                    }}
                    style={{
                      flex: '1', maxWidth: '200px', padding: '0.875rem 1.5rem',
                      borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white', border: 'none', fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.2s ease'
                    }}
                  >
                    ✓ Add Bundle to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
