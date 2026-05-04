import { useEffect, useState, useRef } from "react";
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
import { motion, useInView, AnimatePresence } from "framer-motion";
import Marquee from "react-fast-marquee";
import { BsArrowRight, BsPlay, BsArrowUpRight, BsHeart, BsStarFill } from "react-icons/bs";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FiPackage, FiTruck, FiShield, FiAward } from "react-icons/fi";
import { HiSparkles } from "react-icons/hi";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";
import { toast } from "react-toastify";
import { productUrl, categoryUrl } from "../utils/seoUrl";
import GoogleReviewSection from "../components/GoogleReviewSection";
import { getOfferDisplay } from "../components/ProductCard";

/* ─── All styles in one block ─── */
const premiumStyles = `
  /* ── Keyframes ── */
  @keyframes shimmerPremium {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 18px rgba(212,175,55,0.28); }
    50%       { box-shadow: 0 0 36px rgba(212,175,55,0.65); }
  }
  @keyframes diagonalFloat {
    0%,100% { transform: translate(0,0) rotate(0deg); }
    25%     { transform: translate(6px,-10px) rotate(3deg); }
    50%     { transform: translate(12px,-5px) rotate(-2deg); }
    75%     { transform: translate(3px,-15px) rotate(1deg); }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes bounceY {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(7px); }
  }

  /* ── Utility ── */
  .skeleton-shimmer {
    background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmerPremium 1.4s infinite;
    border-radius: 12px;
  }
  .section-divider {
    width: 44px; height: 3px;
    background: linear-gradient(90deg,#d4af37,#f0c94d);
    border-radius: 2px; margin: 10px 0 0;
  }
  .tag-badge {
    padding: 4px 10px; border-radius: 6px;
    font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* ── Hero ── */
  .hero-wrap   { display: flex; min-height: 100vh; max-height: 940px; overflow: hidden; }
  .hero-left   {
    flex: 0 0 52%; background: #F7F3EE;
    display: flex; flex-direction: column; justify-content: center;
    padding: 64px clamp(28px,5vw,80px);
    position: relative; z-index: 2; overflow: hidden;
  }
  .hero-right  { flex: 1; position: relative; background: #1a1a1a; overflow: hidden; }
  .hero-btn-primary {
    background: linear-gradient(135deg,#d4af37 0%,#f0c94d 50%,#c9962a 100%);
    background-size: 200% auto;
    color: #1a1a1a; border: none;
    padding: 14px 32px; border-radius: 4px;
    font-size: 12px; font-weight: 800; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    text-transform: uppercase; letter-spacing: 2px;
    transition: all 0.4s ease; white-space: nowrap;
  }
  .hero-btn-primary:hover  { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(212,175,55,0.45); }
  .hero-btn-secondary {
    background: transparent; color: #1a1a1a;
    border: 1.5px solid rgba(26,26,26,0.45);
    padding: 12px 26px; border-radius: 4px;
    font-size: 12px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    text-transform: uppercase; letter-spacing: 2px;
    transition: all 0.35s ease; white-space: nowrap;
  }
  .hero-btn-secondary:hover { background: #1a1a1a; color: #fff; }

  /* Mobile hero — full-screen image */
  .hero-mobile { display: none; position: relative; height: 100svh; min-height: 580px; overflow: hidden; }

  /* ── Product card ── */
  .premium-card {
    background: #fff; border-radius: 16px; overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06); cursor: pointer;
    transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94); height: 100%;
  }
  .premium-card:hover { transform: translateY(-6px); box-shadow: 0 18px 44px rgba(0,0,0,0.12); }
  .premium-card:hover .card-img { transform: scale(1.07); }
  .card-img { transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); width:100%; height:100%; object-fit:cover; display:block; }
  .wishlist-btn {
    position: absolute; top: 10px; right: 10px;
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(255,255,255,0.92); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.13);
  }

  /* ── Category carousel ── */
  .cat-scroll-track {
    display: flex; gap: 14px; overflow-x: auto; padding-bottom: 6px;
    scrollbar-width: none; -ms-overflow-style: none;
    scroll-snap-type: x mandatory;
  }
  .cat-scroll-track::-webkit-scrollbar { display: none; }
  .cat-scroll-item { scroll-snap-align: start; flex-shrink: 0; }
  .cat-card-wrap {
    position: relative; border-radius: 14px; overflow: hidden;
    cursor: pointer; width: 100%; height: 100%;
  }
  .cat-card-wrap:hover .cat-zoom { transform: scale(1.07); }
  .cat-zoom { transition: transform 0.6s ease; width:100%; height:100%; object-fit:cover; display:block; }
  .cat-grad {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 55%, transparent 100%);
  }
  .cat-name-row {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 16px 14px; z-index: 2;
  }
  .cat-shop-btn {
    display: inline-flex; align-items: center; gap: 5px;
    background: #d4af37; color: #1a1a1a; border: none;
    padding: 6px 14px; border-radius: 3px; font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer;
    margin-top: 6px;
  }

  /* ── Services scroll ── */
  .services-scroll {
    display: flex; gap: 10px; overflow-x: auto; padding: 16px 0;
    scrollbar-width: none; -ms-overflow-style: none;
  }
  .services-scroll::-webkit-scrollbar { display: none; }
  .service-pill {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 18px; border-radius: 12px;
    background: #faf9f7; border: 1px solid #f0ece4;
    white-space: nowrap; flex-shrink: 0;
  }

  /* ── Stat card ── */
  .stat-card {
    text-align: center; padding: 28px 16px; background: #fff;
    border-radius: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    transition: all 0.35s ease;
  }
  .stat-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(0,0,0,0.1); }

  /* ──────────────────────────────────────────────
     MOBILE  ≤ 767px
  ────────────────────────────────────────────── */
  @media (max-width: 767px) {
    /* Hero: hide desktop split, show mobile full-screen */
    .hero-wrap   { display: none !important; }
    .hero-mobile { display: block !important; }

    /* Section padding */
    .home-section { padding: 44px 0 !important; }

    /* Product grids: 2 columns on mobile */
    .prod-grid .col-12 { flex: 0 0 50%; max-width: 50%; }

    /* Wishlist always visible on touch */
    .wishlist-btn { opacity: 1 !important; }

    /* Category cards: 2.4 visible = peek effect */
    .cat-scroll-item { width: min(42vw, 170px) !important; }
    .cat-card-wrap   { height: 200px !important; }

    /* stat cards: 2-up */
    .stat-card { padding: 20px 10px; }

    /* Newsletter */
    .newsletter-row { flex-direction: column !important; }
    .newsletter-input { min-width: unset !important; width: 100% !important; }

    /* Section header font */
    .sec-h2 { font-size: 1.35rem !important; }

    /* Services: horizontal scroll already, just ensure padding */
    .services-scroll { padding-left: 16px; padding-right: 16px; }
    .services-outer  { padding: 0 !important; }

    /* Hero mobile adjustments */
    .hero-mobile-content { padding: 0 20px 40px !important; }
    .hero-mobile-h1 { font-size: clamp(1.9rem,8vw,2.6rem) !important; }
    .hero-mobile-p  { font-size: 13px !important; }
  }

  /* Tablet tweaks */
  @media (min-width: 768px) and (max-width: 991px) {
    .home-section { padding: 60px 0 !important; }
    .cat-scroll-item { width: 200px !important; }
    .cat-card-wrap   { height: 260px !important; }
  }
`;

/* ─── Skeleton ─── */
const ProductSkeleton = () => (
  <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", height: "100%" }}>
    <div className="skeleton-shimmer" style={{ height: "clamp(160px,28vw,240px)" }} />
    <div style={{ padding: "12px 14px 16px" }}>
      <div className="skeleton-shimmer" style={{ height: "11px", width: "55px", marginBottom: "7px" }} />
      <div className="skeleton-shimmer" style={{ height: "16px", width: "80%", marginBottom: "7px" }} />
      <div className="skeleton-shimmer" style={{ height: "20px", width: "42%", marginBottom: "6px" }} />
    </div>
  </div>
);

/* ─── Product image placeholder ─── */
const ProductPlaceholder = () => (
  <div style={{
    width: "100%", height: "100%",
    background: "linear-gradient(135deg, #f7f3ee 0%, #ede4d8 50%, #f0e8da 100%)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 8, position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.2)", pointerEvents: "none" }} />
    <div style={{ position: "absolute", bottom: -16, left: -16, width: 60, height: 60, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.15)", pointerEvents: "none" }} />
    {/* Dress hanger icon */}
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 18H3.62a1 1 0 0 1-.7-1.71L12 8l9.08 8.29A1 1 0 0 1 20.38 18z" />
      <path d="M12 8V5" /><circle cx="12" cy="4" r="1" />
    </svg>
    <p style={{ color: "rgba(180,140,60,0.8)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", margin: 0 }}>No Image</p>
  </div>
);

/* ─── Product Card ─── */
const HomeProductCard = ({ item, navigate, offer, index = 0 }) => {
  const [imgError, setImgError] = useState(false);
  const offerDisplay = getOfferDisplay(offer, item?.price);
  const showDiscount = offerDisplay?.discountedPrice && offerDisplay.discountedPrice < item?.price;
  const showPlaceholder = !item?.images?.[0]?.url || imgError;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      className="premium-card"
      onClick={() => navigate(productUrl(item))}
    >
      <div style={{ position: "relative", height: "clamp(160px,28vw,240px)", overflow: "hidden", background: "#f8f6f3" }}>
        {showPlaceholder
          ? <ProductPlaceholder />
          : <img src={item.images[0].url} alt={item.title} loading="lazy" className="card-img" style={{ width: "100%", height: "100%" }} onError={() => setImgError(true)} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.07) 0%,transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 3 }}>
          {item?.tags === "special" && <span className="tag-badge" style={{ background: "#ef4444", color: "#fff" }}>SALE</span>}
          {item?.tags === "new"     && <span className="tag-badge" style={{ background: "#1a1a1a", color: "#d4af37" }}>NEW</span>}
          {offerDisplay && <span className="tag-badge" style={{ background: offerDisplay.isFree ? "#16a34a" : "#ff6b35", color: "#fff" }}>{offerDisplay.label}</span>}
        </div>
        <button className="wishlist-btn" onClick={e => e.stopPropagation()}>
          <BsHeart style={{ fontSize: "13px", color: "#e11d48" }} />
        </button>
      </div>
      <div style={{ padding: "10px 13px 14px" }}>
        {item?.brand && <p style={{ color: "#d4af37", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "3px" }}>{item.brand}</p>}
        <h5 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(12px,2vw,14px)", fontWeight: 600, marginBottom: "8px", lineHeight: 1.35, color: "#1a1a1a" }}>
          {item?.title?.length > 40 ? item.title.slice(0, 40) + "…" : item?.title}
        </h5>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: "clamp(14px,2.5vw,18px)", fontWeight: 800, color: "#1a1a1a" }}>
              ₹{(showDiscount ? offerDisplay.discountedPrice : item?.price)?.toLocaleString()}
            </span>
            {showDiscount && <span style={{ fontSize: "11px", color: "#bbb", textDecoration: "line-through" }}>₹{item?.price?.toLocaleString()}</span>}
          </div>
          <span style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "20px", fontWeight: 700, background: item?.quantity > 0 ? "#dcfce7" : "#fee2e2", color: item?.quantity > 0 ? "#166534" : "#dc2626" }}>
            {item?.quantity > 0 ? "In Stock" : "Sold Out"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Section Header ─── */
const SectionHeader = ({ title, subtitle, linkTo, linkText, center = false, light = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    style={{ marginBottom: "28px", textAlign: center ? "center" : "left" }}
  >
    {subtitle && <p style={{ color: "#d4af37", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", marginBottom: "6px" }}>{subtitle}</p>}
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: center ? "center" : "space-between", gap: 10, flexWrap: "wrap" }}>
      <div>
        <h2 className="sec-h2" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.3rem,3.5vw,2rem)", fontWeight: 700, color: light ? "#fff" : "#1a1a1a", marginBottom: 0, lineHeight: 1.2 }}>
          {title}
        </h2>
        <div className="section-divider" style={{ margin: center ? "10px auto 0" : "10px 0 0" }} />
      </div>
      {linkTo && (
        <Link to={linkTo} style={{ color: light ? "rgba(255,255,255,0.8)" : "#1a1a1a", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", textDecoration: "none", paddingBottom: "3px", borderBottom: `1.5px solid ${light ? "rgba(255,255,255,0.5)" : "#1a1a1a"}` }}>
          {linkText || "View All"} <BsArrowUpRight style={{ fontSize: "10px" }} />
        </Link>
      )}
    </div>
  </motion.div>
);

/* ─── Special offer card image (with error handling) ─── */
const SpecialOfferImage = ({ item }) => {
  const [err, setErr] = useState(false);
  const offerDisplay = getOfferDisplay(item?.offer, item?.price);
  const showDiscounted = offerDisplay?.discountedPrice && offerDisplay.discountedPrice < item?.price;
  const pct = showDiscounted ? Math.round(((item.price - offerDisplay.discountedPrice) / item.price) * 100) : 0;
  return (
    <div style={{ position: "relative", height: "clamp(160px,28vw,220px)", overflow: "hidden", background: "#f8f6f3" }}>
      {(!item?.images?.[0]?.url || err)
        ? <ProductPlaceholder />
        : <img src={item.images[0].url} alt={item.title} loading="lazy" className="card-img" style={{ width: "100%", height: "100%" }} onError={() => setErr(true)} />
      }
      <div style={{ position: "absolute", top: 10, left: 10 }}>
        <span className="tag-badge" style={{ background: "#ef4444", color: "#fff" }}>SALE</span>
      </div>
      {pct > 0 && <span className="tag-badge" style={{ position: "absolute", top: 34, left: 10, background: "#d4af37", color: "#1a1a1a" }}>{pct}% OFF</span>}
      <button className="wishlist-btn" onClick={e => e.stopPropagation()}><BsHeart style={{ fontSize: 13, color: "#e11d48" }} /></button>
    </div>
  );
};

/* ─── Animated Counter ─── */
const AnimatedNumber = ({ end, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = (end / 1600) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

/* ─── Main ─── */
const Home = () => {
  const blogState   = useSelector(s => s?.blog?.blog);
  const productState = useSelector(s => s?.product?.product);
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [activeBundles, setActiveBundles] = useState([]);
  const [addingBundle, setAddingBundle] = useState(null);
  const [bundleSizeModal, setBundleSizeModal] = useState(null);
  const [bundleSelections, setBundleSelections] = useState({});

  /* helpers */
  const hasProductStock = (p) => {
    if (!p) return false;
    let t = p.quantity || 0;
    (p.variants || []).forEach(v => (v.sizeStock || []).forEach(s => { t += s.quantity || 0; }));
    (p.sizeStock || []).forEach(s => { t += s.quantity || 0; });
    return t > 0;
  };
  const isBundleAvailable   = b => (b?.products || []).every(i => hasProductStock(i.product));
  const bundleNeedsSelection = b => (b?.products || []).some(i => {
    const p = i.product; if (!p) return false;
    return (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0))
      || (p.sizeStock || []).some(s => s.quantity > 0);
  });
  const getColorSwatch = c => c?.hex || c?.title || "#d1d5db";

  /* Track when we last successfully loaded data */
  const lastFetchRef = useRef(0);

  const loadData = useRef(async () => {});

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(getAllBlogs()),
          dispatch(getAllProducts({ limit: 20 })),
        ]);
        lastFetchRef.current = Date.now();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData.current = load;

    axios.get(`${base_url}bundles/active`).then(r => setActiveBundles(r.data || [])).catch(() => {});
    load();
  }, [dispatch]);

  /* ── Re-fetch when the user returns to this tab after ≥ 5 minutes ──
     This fixes the "all APIs pending" issue caused by the backend server
     sleeping on free-tier hosting while the tab was in the background.
  ── */
  useEffect(() => {
    const STALE_MS = 5 * 60 * 1000; // 5 minutes

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const stale = Date.now() - lastFetchRef.current > STALE_MS;
        if (stale) {
          loadData.current();
          axios.get(`${base_url}bundles/active`).then(r => setActiveBundles(r.data || [])).catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const products        = productState || [];
  const featuredProducts = products.filter(p => p?.tags === "featured");
  const specialProducts  = products.filter(p => p?.tags === "special");
  const popularProducts  = products.filter(p => p?.tags === "popular");
  const newArrivals      = products.filter(p => p?.tags === "new");
  const categories       = [...new Set(products.map(p => p.category))].filter(Boolean).slice(0, 8);

  const categoryGradients = [
    "linear-gradient(135deg,#2C1654,#6B2F8A)",
    "linear-gradient(135deg,#1a1a2e,#0f3460)",
    "linear-gradient(135deg,#3d0c02,#8B1A1A)",
    "linear-gradient(135deg,#1a2a1a,#2d5a27)",
    "linear-gradient(135deg,#2a1a0a,#8B4513)",
    "linear-gradient(135deg,#0a0a2a,#1a1a5a)",
    "linear-gradient(135deg,#1a0a0a,#5a1a1a)",
    "linear-gradient(135deg,#0a1a2a,#1a4a5a)",
  ];

  const stats = [
    { icon: <BsStarFill />, number: 50000, suffix: "+", label: "Happy Customers", color: "#d4af37" },
    { icon: <FiTruck />,    number: 100,   suffix: "%", label: "Free Shipping",   color: "#22c55e" },
    { icon: <FiAward />,    number: 500,   suffix: "+", label: "Premium Styles",  color: "#a855f7" },
    { icon: <FiShield />,   number: 100,   suffix: "%", label: "Authentic",       color: "#ef4444" },
  ];

  const handleAddBundle = (e, bundle) => {
    e.stopPropagation();
    if (!localStorage.getItem("customer")) { toast.error("Please login to add items to cart"); navigate("/login"); return; }
    if (bundleNeedsSelection(bundle)) { setBundleSelections({}); setBundleSizeModal(bundle); }
    else confirmAddBundle(bundle, {});
  };
  const confirmAddBundle = async (bundle, selectedOptions) => {
    setBundleSizeModal(null); setAddingBundle(bundle._id);
    try {
      await dispatch(addBundleToCart({ bundleId: bundle._id, selectedOptions })).unwrap();
      toast.success(`🛒 ${bundle.title} added at ₹${bundle.bundlePrice}!`);
      navigate("/cart");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed to add bundle"); }
    finally { setAddingBundle(null); }
  };

  return (
    <>
      <style>{premiumStyles}</style>
      <Meta
        title="Yashoda Fashion – Premium Women's Clothing"
        description="Shop the latest premium women's fashion – sarees, suits, dresses, kurtis, and more."
        keywords="women fashion, saree, kurti, suits, dresses, premium clothing, online shopping india"
        url="/" breadcrumbs={[]}
      />

      {/* ════════════════════════════════════════
          DESKTOP HERO — split screen
      ════════════════════════════════════════ */}
      <div className="hero-wrap">
        {/* Left */}
        <div className="hero-left">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <div style={{ width: 38, height: 1.5, background: "#d4af37" }} />
            <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3.5px", color: "#d4af37" }}>New Season 2024</span>
          </motion.div>

          {[{ text: "Wear Your", italic: true, delay: 0.2 }, { text: "Confidence", italic: false, delay: 0.33 }, { text: "Every Day.", italic: true, delay: 0.46 }].map(({ text, italic, delay }) => (
            <div key={text} style={{ overflow: "hidden", marginBottom: 4 }}>
              <motion.h1 initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2.6rem,5.5vw,5.2rem)", fontWeight: italic ? 400 : 700, fontStyle: italic ? "italic" : "normal", color: "#1a1a1a", lineHeight: 1.04, margin: 0 }}>
                {text}
              </motion.h1>
            </div>
          ))}

          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.62 }}
            style={{ fontSize: "clamp(13px,1.4vw,15px)", color: "#777", maxWidth: 420, marginBottom: 32, lineHeight: 1.8, marginTop: 20 }}>
            Premium ethnic &amp; western wear for the modern Indian woman. Handpicked styles, exclusive collections.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.76 }}
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
            <button className="hero-btn-primary" onClick={() => navigate("/product")}>Shop Collection <BsArrowRight /></button>
            <button className="hero-btn-secondary" onClick={() => navigate("/reels")}><BsPlay style={{ fontSize: 14 }} /> View Lookbook</button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 1.0 }}
            style={{ display: "flex", borderTop: "1px solid #e8e0d6" }}>
            {[["50K+", "Customers"], ["500+", "Styles"], ["4.9★", "Rating"]].map(([num, label], i) => (
              <div key={label} style={{ flex: 1, paddingTop: 18, paddingRight: 18, paddingLeft: i > 0 ? 18 : 0, borderRight: i < 2 ? "1px solid #e8e0d6" : "none" }}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.1rem,2.4vw,1.5rem)", fontWeight: 700, color: "#1a1a1a", margin: "0 0 2px" }}>{num}</p>
                <p style={{ fontSize: "9px", color: "#aaa", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "1.5px" }}>{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Dot grid decoration */}
          <div style={{ position: "absolute", bottom: 36, left: "clamp(20px,4vw,56px)", display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, opacity: 0.15, pointerEvents: "none" }}>
            {Array.from({ length: 25 }).map((_, i) => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#1a1a1a" }} />)}
          </div>
        </div>

        {/* Right — full image */}
        <div className="hero-right">
          <div style={{ position: "absolute", inset: 0, backgroundImage: "url(images/main-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center top" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(247,243,238,0.2) 0%,transparent 15%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.4) 0%,transparent 48%)", pointerEvents: "none" }} />

          {/* NEW IN badge */}
          <motion.div initial={{ opacity: 0, scale: 0.7, rotate: 10 }} animate={{ opacity: 1, scale: 1, rotate: 6 }} transition={{ duration: 0.7, delay: 1.0 }}
            style={{ position: "absolute", top: "10%", right: "8%", background: "#d4af37", color: "#1a1a1a", width: 84, height: 84, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 900, textAlign: "center", boxShadow: "0 8px 28px rgba(0,0,0,0.22)", animation: "diagonalFloat 6s ease-in-out infinite" }}>
            <span style={{ fontSize: 18, lineHeight: 1, fontFamily: "'Playfair Display',serif" }}>NEW</span>
            <span style={{ fontSize: "8px", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: 2 }}>IN</span>
          </motion.div>

          {/* Glass info card */}
          <motion.div initial={{ opacity: 0, x: -36 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 1.2 }}
            style={{ position: "absolute", bottom: "12%", left: "6%", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(16px)", borderRadius: 14, padding: "14px 18px", boxShadow: "0 12px 36px rgba(0,0,0,0.22)", minWidth: 170 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "1px" }}>In Stock</span>
            </div>
            <p style={{ margin: 0, fontFamily: "'Playfair Display',serif", fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>Latest Arrivals</p>
            <p style={{ margin: "3px 0 9px", fontSize: "10px", color: "#888" }}>500+ new styles this week</p>
            <button onClick={() => navigate("/product")} style={{ background: "#1a1a1a", color: "#d4af37", border: "none", padding: "7px 14px", borderRadius: 5, fontSize: "10px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}>Shop Now →</button>
          </motion.div>

          {/* Free shipping pill */}
          <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.4 }}
            style={{ position: "absolute", top: "8%", left: "6%", background: "rgba(26,26,26,0.82)", backdropFilter: "blur(10px)", color: "#d4af37", padding: "9px 14px", borderRadius: 50, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px", display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 18px rgba(0,0,0,0.28)" }}>
            <FiTruck style={{ fontSize: 13 }} /> Free Shipping
          </motion.div>

          {/* Scroll dot */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}
            style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)" }}>
            <motion.div animate={{ y: [0, 7, 0] }} transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              style={{ width: 21, height: 34, border: "1.5px solid rgba(255,255,255,0.38)", borderRadius: 11, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 4 }}>
              <div style={{ width: 3, height: 6, background: "#d4af37", borderRadius: 2 }} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MOBILE HERO — full-screen image
      ════════════════════════════════════════ */}
      <div className="hero-mobile">
        {/* Background */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url(images/main-banner.jpg)", backgroundSize: "cover", backgroundPosition: "center 20%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.45) 45%, rgba(5,5,5,0.1) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(5,5,5,0.5) 0%, transparent 30%)" }} />

        {/* Top label */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          style={{ position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          <HiSparkles style={{ color: "#d4af37", fontSize: 13 }} />
          <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", color: "#d4af37" }}>New Season 2024</span>
          <HiSparkles style={{ color: "#d4af37", fontSize: 13 }} />
        </motion.div>

        {/* Bottom content */}
        <div className="hero-mobile-content" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 20px 36px" }}>
          <motion.h1 className="hero-mobile-h1" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: "#fff", lineHeight: 1.08, marginBottom: 6 }}>
            Wear Your<br />
            <span style={{ fontStyle: "italic", fontWeight: 400 }}>Confidence</span><br />
            Every Day.
          </motion.h1>

          <motion.p className="hero-mobile-p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.55 }}
            style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24, lineHeight: 1.7, maxWidth: 320 }}>
            Premium ethnic &amp; western wear. Handpicked for the modern Indian woman.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.7 }}
            style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate("/product")} style={{ flex: 1, background: "linear-gradient(135deg,#d4af37,#f0c94d,#c9962a)", color: "#1a1a1a", border: "none", padding: "15px 12px", borderRadius: 6, fontSize: "12px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1.5px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              Shop Now <BsArrowRight />
            </button>
            <button onClick={() => navigate("/reels")} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1.5px solid rgba(255,255,255,0.35)", padding: "15px 16px", borderRadius: 6, fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, backdropFilter: "blur(8px)", whiteSpace: "nowrap" }}>
              <BsPlay style={{ fontSize: 14 }} /> Lookbook
            </button>
          </motion.div>

          {/* Mobile mini stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.18)", marginTop: 24 }}>
            {[["50K+", "Customers"], ["500+", "Styles"], ["4.9★", "Rating"]].map(([num, label], i) => (
              <div key={label} style={{ flex: 1, paddingTop: 14, paddingLeft: i > 0 ? 14 : 0, paddingRight: 14, borderRight: i < 2 ? "1px solid rgba(255,255,255,0.18)" : "none" }}>
                <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 700, color: "#d4af37", margin: "0 0 2px" }}>{num}</p>
                <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.5)", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          MARQUEE
      ════════════════════════════════════════ */}
      <div style={{ background: "#1a1a1a", padding: "12px 0" }}>
        <Marquee speed={46} gradient={false}>
          {["New Arrivals", "Free Shipping", "Premium Quality", "Exclusive Deals", "Easy Returns", "100% Authentic", "New Collection 2024", "Shop The Look"].map((text, i) => (
            <span key={i} style={{ margin: "0 28px", fontSize: "10px", fontWeight: 800, color: i % 2 === 0 ? "#d4af37" : "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "2.5px", display: "inline-flex", alignItems: "center", gap: 9 }}>
              <span style={{ color: "#d4af37", fontSize: 7 }}>✦</span> {text}
            </span>
          ))}
        </Marquee>
      </div>

      {/* ════════════════════════════════════════
          SERVICES — horizontal scroll on all sizes
      ════════════════════════════════════════ */}
      <div className="services-outer" style={{ background: "#fff", borderBottom: "1px solid #f0ece4", padding: "0 0" }}>
        <div className="services-scroll" style={{ padding: "16px 20px" }}>
          {services?.map((item, j) => (
            <motion.div key={j} className="service-pill"
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: j * 0.08 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#1a1a1a,#333)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={item.image} alt={item.title} style={{ width: 20, height: 20, objectFit: "contain", filter: "brightness(0) invert(1)" }} />
              </div>
              <div>
                <h6 style={{ fontSize: "12px", fontWeight: 700, marginBottom: 1, color: "#1a1a1a" }}>{item.title}</h6>
                <p style={{ marginBottom: 0, fontSize: "10px", color: "#999", lineHeight: 1.3 }}>{item.tagline}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      {/* ════════════════════════════════════════
          BUNDLES
      ════════════════════════════════════════ */}
      {activeBundles.length > 0 && (
        <div className="home-section" style={{ background: "#faf9f7", padding: "56px 0" }}>
          <Container class1="">
            <SectionHeader title="Frequently Bought Together" subtitle="Bundle & Save" linkTo="/bundles" linkText="View All" />
            <div className="row g-3">
              {activeBundles.slice(0, 3).map((bundle, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-4">
                  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: index * 0.1 }}
                    style={{ background: "#fff", borderRadius: 20, boxShadow: "0 6px 28px rgba(0,0,0,0.07)", border: "1px solid #f0ece4", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ background: "linear-gradient(135deg,#1a1a1a,#2d2d2d)", padding: "18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{bundle.title}</h4>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{bundle.products?.length} products included</p>
                        </div>
                        <span style={{ background: "#d4af37", color: "#1a1a1a", padding: "3px 9px", borderRadius: 20, fontSize: "10px", fontWeight: 800, whiteSpace: "nowrap", marginLeft: 8 }}>{bundle.discountPercent}% OFF</span>
                      </div>
                    </div>
                    <div style={{ padding: 14, flex: 1 }}>
                      {bundle.products?.slice(0, 3).map((item, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: 9, background: "#faf9f7", borderRadius: 10, border: "1px solid #f0ece4" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#f0ece4" }}>
                            {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><FiPackage style={{ color: "#ccc" }} /></div>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#1a1a1a" }}>{item.product?.title}</p>
                            <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#999" }}>Qty {item.quantity} · ₹{item.price?.toLocaleString()}</p>
                          </div>
                          {!hasProductStock(item.product) && <span style={{ background: "#fee2e2", color: "#dc2626", padding: "2px 7px", borderRadius: 10, fontSize: "9px", fontWeight: 700, whiteSpace: "nowrap" }}>OOS</span>}
                        </div>
                      ))}
                      {bundle.products?.length > 3 && <p style={{ fontSize: "10px", color: "#999", margin: "3px 0 0", textAlign: "center" }}>+{bundle.products.length - 3} more</p>}
                      <div style={{ background: "linear-gradient(135deg,#faf9f7,#f5f0e8)", borderRadius: 12, padding: "12px 14px", marginTop: 12, border: "1px solid #e8dfc8" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: "11px", color: "#bbb", textDecoration: "line-through" }}>₹{bundle.originalPrice?.toLocaleString()}</span>
                          <span style={{ fontSize: "10px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Save ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1a1a1a", fontFamily: "'Playfair Display',serif" }}>₹{bundle.bundlePrice?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ padding: "0 14px 14px" }}>
                      {!isBundleAvailable(bundle) && <div style={{ marginBottom: 8, padding: 9, background: "#fee2e2", color: "#dc2626", borderRadius: 8, textAlign: "center", fontWeight: 600, fontSize: 11 }}>Contains out-of-stock items</div>}
                      <button onClick={e => handleAddBundle(e, bundle)} disabled={addingBundle === bundle._id || !isBundleAvailable(bundle)}
                        style={{ width: "100%", padding: "13px 10px", background: (addingBundle === bundle._id || !isBundleAvailable(bundle)) ? "#e5e7eb" : "linear-gradient(135deg,#1a1a1a,#333)", color: (addingBundle === bundle._id || !isBundleAvailable(bundle)) ? "#999" : "#d4af37", border: "none", borderRadius: 10, fontWeight: 800, cursor: (addingBundle === bundle._id || !isBundleAvailable(bundle)) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                        <AiOutlineShoppingCart style={{ fontSize: 15 }} />
                        {addingBundle === bundle._id ? "Adding…" : !isBundleAvailable(bundle) ? "Out of Stock" : bundleNeedsSelection(bundle) ? "Select & Add" : "Add to Cart"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}
      {/* ════════════════════════════════════════
          SHOP BY CATEGORY
      ════════════════════════════════════════ */}
      {(isLoading || categories.length > 0) && (
        <div className="home-section" style={{ background: "#fff", padding: "56px 0 48px" }}>
          <Container class1="">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p style={{ color: "#d4af37", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", marginBottom: 5 }}>Browse Collections</p>
                <h2 className="sec-h2" style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.3rem,3.5vw,2rem)", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Shop by Category</h2>
                <div className="section-divider" />
              </motion.div>
              <Link to="/product" style={{ color: "#1a1a1a", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", textDecoration: "none", paddingBottom: 3, borderBottom: "1.5px solid #1a1a1a" }}>
                View All <BsArrowUpRight style={{ fontSize: 10 }} />
              </Link>
            </div>

            {/* Horizontal scroll */}
            <div className="cat-scroll-track">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="cat-scroll-item" style={{ width: "clamp(150px,20vw,230px)" }}>
                      <div className="skeleton-shimmer" style={{ height: "clamp(200px,26vw,300px)", borderRadius: 14 }} />
                      <div className="skeleton-shimmer" style={{ height: 13, width: "65%", marginTop: 10, borderRadius: 6 }} />
                      <div className="skeleton-shimmer" style={{ height: 10, width: "44%", marginTop: 5, borderRadius: 6 }} />
                    </div>
                  ))
                : categories.map((cat, index) => {
                    const catProds = products.filter(p => p?.category === cat);
                    const catImg   = catProds.find(p => p?.images?.[0]?.url)?.images?.[0]?.url;
                    return (
                      <motion.div key={index} className="cat-scroll-item"
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.45, delay: index * 0.05 }}
                        style={{ width: "clamp(150px,20vw,230px)", cursor: "pointer" }}
                        onClick={() => navigate(categoryUrl(cat))}>
                        {/* Card */}
                        <div className="cat-card-wrap" style={{ height: "clamp(200px,26vw,300px)" }}>
                          {catImg
                            ? <img src={catImg} alt={cat} className="cat-zoom" style={{ width: "100%", height: "100%" }} />
                            : <div style={{ width: "100%", height: "100%", background: categoryGradients[index % 8] }} />
                          }
                          <div className="cat-grad" />
                          <div className="cat-name-row">
                            <h4 style={{ fontFamily: "'Playfair Display',serif", color: "#fff", fontSize: "clamp(13px,2vw,16px)", fontWeight: 600, margin: 0, textTransform: "capitalize" }}>{cat}</h4>
                            <button className="cat-shop-btn">Shop <BsArrowRight style={{ fontSize: 9 }} /></button>
                          </div>
                          {catProds.length > 0 && (
                            <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "#fff", padding: "3px 9px", borderRadius: 20, fontSize: "9px", fontWeight: 700 }}>
                              {catProds.length} items
                            </div>
                          )}
                        </div>
                        {/* Below card */}
                        <div style={{ marginTop: 10, paddingLeft: 2 }}>
                          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(12px,1.8vw,15px)", fontWeight: 600, color: "#1a1a1a", margin: "0 0 2px", textTransform: "capitalize" }}>{cat}</p>
                          <p style={{ fontSize: "10px", color: "#bbb", margin: 0 }}>{catProds.length} styles</p>
                        </div>
                      </motion.div>
                    );
                  })
              }
            </div>
          </Container>
        </div>
      )}

      {/* ════════════════════════════════════════
          NEW ARRIVALS
      ════════════════════════════════════════ */}
      {(isLoading || newArrivals.length > 0) && (
        <div className="home-section" style={{ background: "#faf9f7", padding: "56px 0" }}>
          <Container class1="">
            <SectionHeader title="New Arrivals" subtitle="Just Dropped" linkTo="/product" linkText="View All" />
            <div className="row g-3 prod-grid">
              {(isLoading ? Array.from({ length: 4 }) : newArrivals.slice(0, 4)).map((item, i) => (
                <div key={i} className="col-6 col-lg-3">
                  {isLoading ? <ProductSkeleton /> : <HomeProductCard item={item} navigate={navigate} offer={item?.offer} index={i} />}
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ════════════════════════════════════════
          SHOP THE LOOK
      ════════════════════════════════════════ */}
      <div className="home-section" style={{ background: "#0d0b0d", padding: "56px 0" }}>
        <Container class1="">
          <SectionHeader title="Shop The Look" subtitle="Style Inspiration" linkTo="/reels" linkText="View All" light />
          {isLoading
            ? <div style={{ display: "flex", gap: 14, overflow: "hidden" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ minWidth: 240, height: 360, borderRadius: 16, flexShrink: 0, background: "linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%)", backgroundSize: "200% 100%", animation: "shimmerPremium 1.4s infinite" }} />
                ))}
              </div>
            : <ShopTheLook navigate={navigate} />
          }
        </Container>
      </div>

      {/* ════════════════════════════════════════
          FEATURED
      ════════════════════════════════════════ */}
      {(isLoading || featuredProducts.length > 0) && (
        <div className="home-section" style={{ background: "#fff", padding: "56px 0" }}>
          <Container class1="">
            <SectionHeader title="Featured Collection" subtitle="Editor's Pick" linkTo="/product" linkText="View All" />
            <div className="row g-3 prod-grid">
              {(isLoading ? Array.from({ length: 4 }) : featuredProducts.slice(0, 4)).map((item, i) => (
                <div key={i} className="col-6 col-lg-3">
                  {isLoading ? <ProductSkeleton /> : <HomeProductCard item={item} navigate={navigate} offer={item?.offer} index={i} />}
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ════════════════════════════════════════
          SPECIAL OFFERS
      ════════════════════════════════════════ */}
      {(isLoading || specialProducts.length > 0) && (
        <div className="home-section" style={{ background: "linear-gradient(135deg,#1C0A0A,#2d0d0d,#1C0A0A)", padding: "56px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%,rgba(212,175,55,0.06) 0%,transparent 50%)", pointerEvents: "none" }} />
          <Container class1="">
            <SectionHeader title="Special Offers" subtitle="Exclusive Deals" linkTo="/product" linkText="Shop Deals" light />
            <div className="row g-3 prod-grid">
              {(isLoading ? Array.from({ length: 4 }) : specialProducts.slice(0, 4)).map((item, i) => (
                <div key={i} className="col-6 col-lg-3">
                  {isLoading
                    ? <div className="skeleton-shimmer" style={{ height: "clamp(280px,40vw,340px)", background: "linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%)", backgroundSize: "200% 100%" }} />
                    : <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}
                        className="premium-card" onClick={() => navigate(productUrl(item))}>
                        <SpecialOfferImage item={item} />
                        <div style={{ padding: "10px 12px 14px" }}>
                          <h5 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(11px,2vw,14px)", fontWeight: 600, marginBottom: 8, lineHeight: 1.35, color: "#1a1a1a" }}>{item?.title?.length > 38 ? item.title.slice(0, 38) + "…" : item?.title}</h5>
                          {(() => { const od = getOfferDisplay(item?.offer, item?.price); const sd = od?.discountedPrice && od.discountedPrice < item?.price; return (<div style={{ display: "flex", alignItems: "baseline", gap: 6 }}><span style={{ fontSize: "clamp(14px,2.5vw,18px)", fontWeight: 800, color: "#1a1a1a" }}>₹{(sd ? od.discountedPrice : item?.price)?.toLocaleString()}</span>{sd && <span style={{ fontSize: "11px", color: "#bbb", textDecoration: "line-through" }}>₹{item?.price?.toLocaleString()}</span>}</div>); })()}
                        </div>
                      </motion.div>
                  }
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ════════════════════════════════════════
          STATS
      ════════════════════════════════════════ */}
      <div className="home-section" style={{ background: "#faf9f7", padding: "56px 0" }}>
        <Container class1="">
          <SectionHeader title="Why Women Love Us" subtitle="Our Promise" center />
          <div className="row g-3">
            {stats.map((s, i) => (
              <div key={i} className="col-6 col-lg-3">
                <motion.div className="stat-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.09 }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22, color: s.color }}>{s.icon}</div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.4rem,3.5vw,2rem)", fontWeight: 800, color: "#1a1a1a", marginBottom: 5, lineHeight: 1 }}><AnimatedNumber end={s.number} suffix={s.suffix} /></h3>
                  <p style={{ fontSize: "clamp(10px,1.5vw,12px)", color: "#888", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ════════════════════════════════════════
          POPULAR
      ════════════════════════════════════════ */}
      {(isLoading || popularProducts.length > 0) && (
        <div className="home-section" style={{ background: "#fff", padding: "56px 0" }}>
          <Container class1="">
            <SectionHeader title="Trending Now" subtitle="Most Popular" linkTo="/product" linkText="View All" />
            <div className="row g-3 prod-grid">
              {(isLoading ? Array.from({ length: 4 }) : popularProducts.slice(0, 4)).map((item, i) => (
                <div key={i} className="col-6 col-lg-3">
                  {isLoading ? <ProductSkeleton /> : <HomeProductCard item={item} navigate={navigate} offer={item?.offer} index={i} />}
                </div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ════════════════════════════════════════
          BLOGS
      ════════════════════════════════════════ */}
      {blogState && blogState.length > 0 && (
        <div className="home-section" style={{ background: "#faf9f7", padding: "56px 0" }}>
          <Container class1="">
            <SectionHeader title="Style Journal" subtitle="Fashion & Tips" linkTo="/blog" linkText="Read All" />
            <div className="row g-3">
              {blogState.slice(0, 4).map((item, i) => (
                <motion.div key={i} className="col-12 col-md-6 col-lg-3" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.08 }}>
                  <BlogCard id={item?._id} title={item?.title} description={item?.description} image={item?.images?.[0]?.url || "/images/placeholder.png"} date={new Date(item?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
                </motion.div>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ════════════════════════════════════════
          GOOGLE REVIEW
      ════════════════════════════════════════ */}
      <GoogleReviewSection />

      {/* ════════════════════════════════════════
          NEWSLETTER
      ════════════════════════════════════════ */}
      <div style={{ position: "relative", overflow: "hidden", background: "#0d0b0d", padding: "64px 20px", textAlign: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 30% 50%,rgba(212,175,55,0.08) 0%,transparent 60%),radial-gradient(ellipse at 70% 50%,rgba(212,175,55,0.05) 0%,transparent 60%)", pointerEvents: "none", animation: "gradientShift 8s ease infinite", backgroundSize: "200% 200%" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 500, height: 500, border: "1px solid rgba(212,175,55,0.06)", borderRadius: "50%", pointerEvents: "none" }} />
        <Container>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.65 }} style={{ position: "relative" }}>
            <p style={{ color: "#d4af37", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", marginBottom: 14 }}>✦ Stay In The Loop ✦</p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.5rem,5vw,2.6rem)", color: "#fff", marginBottom: 12, fontWeight: 700, lineHeight: 1.1 }}>
              Your Style, Our <span style={{ color: "#d4af37" }}>Inspiration</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(13px,2vw,15px)", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.75, fontWeight: 300 }}>
              Subscribe for exclusive offers, new arrivals first-look, and curated style inspiration.
            </p>
            <div className="newsletter-row" style={{ display: "flex", maxWidth: 480, margin: "0 auto", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <input type="email" placeholder="Your email address" className="newsletter-input"
                style={{ flex: 1, minWidth: 220, padding: "15px 20px", borderRadius: 6, border: "1.5px solid rgba(212,175,55,0.3)", fontSize: "14px", background: "rgba(255,255,255,0.06)", color: "#fff", backdropFilter: "blur(10px)", outline: "none" }}
                onFocus={e => (e.target.style.borderColor = "rgba(212,175,55,0.7)")}
                onBlur={e  => (e.target.style.borderColor = "rgba(212,175,55,0.3)")}
              />
              <button style={{ background: "linear-gradient(135deg,#d4af37,#f0c94d,#c9962a)", color: "#1a1a1a", border: "none", padding: "15px 24px", borderRadius: 6, fontSize: "12px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>
                Subscribe
              </button>
            </div>
            <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.28)", marginTop: 12 }}>No spam. Unsubscribe anytime.</p>
          </motion.div>
        </Container>
      </div>

      {/* ════════════════════════════════════════
          BUNDLE SIZE MODAL
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {bundleSizeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setBundleSizeModal(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0", touchAction: "none" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 340 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#fff", borderRadius: "22px 22px 0 0", width: "100%", maxWidth: 640, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 -8px 40px rgba(0,0,0,0.35)", overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>{bundleSizeModal.title}</h3>
                  <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: "#64748b" }}>Configure {bundleSizeModal.products?.length || 0} products</p>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {(() => {
                    const withOpts = bundleSizeModal.products?.filter(i => { const p = i.product; if (!p) return false; return (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0)) || (p.sizeStock || []).some(s => s.quantity > 0); }).length || 0;
                    const done = Object.values(bundleSelections).filter(s => s.color && s.size).length;
                    const pct = withOpts > 0 ? Math.round((done / withOpts) * 100) : 0;
                    return (<div style={{ minWidth: 80 }}><div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: 3 }}>{done}/{withOpts} done</div><div style={{ height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", background: "linear-gradient(90deg,#10b981,#059669)", width: `${pct}%`, transition: "width 0.3s" }} /></div></div>);
                  })()}
                  <button onClick={() => setBundleSizeModal(null)} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "#f1f5f9", color: "#64748b", fontSize: "1.2rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: "16px 20px", flex: 1, overflowY: "auto" }}>
                {(bundleSizeModal.products || []).map((item, index) => {
                  const product = item.product;
                  const pid = product?._id?.toString() || `h-${index}`;
                  if (!product) return <div key={pid} style={{ padding: 14, marginBottom: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}><p style={{ margin: 0, color: "#dc2626", fontWeight: 600, fontSize: 13 }}>⚠️ Product not found</p></div>;
                  const varColors = (product.variants || []).filter(v => (v.sizeStock || []).some(s => s.quantity > 0)).map(v => v.color).filter(Boolean);
                  const hasColors = varColors.length > 0;
                  const selColor = bundleSelections[pid]?.color;
                  const sizes = hasColors ? ((product.variants || []).find(v => { const cid = v.color?._id || v.color; return cid?.toString() === selColor; })?.sizeStock || []) : (product.sizeStock || []);
                  const hasStock = sizes.some(s => s.quantity > 0) || hasColors;
                  const isOk = !hasStock || (bundleSelections[pid]?.color && bundleSelections[pid]?.size);
                  const dotColor = isOk ? "#10b981" : "#f59e0b";
                  return (
                    <div key={pid} style={{ marginBottom: 16, padding: 14, borderRadius: 14, border: `2px solid ${isOk ? "#d1fae5" : "#fef3c7"}`, background: isOk ? "#f0fdf4" : "#fffbeb" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                        {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.title} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} /> : <div style={{ width: 52, height: 52, background: "#f3f4f6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, color: "#9ca3af" }}>No img</span></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: "0 0 3px", fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>{product.title}</h4>
                          <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            <div style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
                            <span style={{ fontSize: "0.7rem", color: dotColor, fontWeight: 600 }}>{isOk ? "✓ Configured" : "⚠️ Needs selection"}</span>
                          </div>
                        </div>
                      </div>
                      {hasStock ? (
                        <>
                          {hasColors && (<div style={{ marginBottom: 12 }}><label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Color</label><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{varColors.map((co, ci) => { const cid = (co?._id || co)?.toString(); const sel = bundleSelections[pid]?.color === cid; return (<button key={cid || ci} onClick={() => setBundleSelections(p => ({ ...p, [pid]: { ...p[pid], color: cid, size: null } }))} style={{ width: 42, height: 42, borderRadius: "50%", border: sel ? "3px solid #eab308" : "2px solid #e5e7eb", background: sel ? "#fef3c7" : getColorSwatch(co), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title={co?.name || co?.title || ""}>{sel && <span style={{ fontSize: 11, color: "#92400e", fontWeight: 700 }}>✓</span>}</button>); })}</div></div>)}
                          {sizes.length > 0 && (<div><label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>Size</label><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{sizes.map(so => { const sel = bundleSelections[pid]?.size === so.size; const can = so.quantity > 0 && (!hasColors || selColor); return (<button key={so.size} disabled={!can} onClick={() => can && setBundleSelections(p => ({ ...p, [pid]: { ...p[pid], size: so.size } }))} style={{ padding: "10px 14px", minWidth: 60, borderRadius: 10, fontWeight: 600, fontSize: "0.8rem", border: sel ? "2px solid #1a1a1a" : "1px solid #d1d5db", background: sel ? "#1a1a1a" : !can ? "#f3f4f6" : "#fff", color: sel ? "#d4af37" : !can ? "#9ca3af" : "#374151", cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.6, whiteSpace: "nowrap" }}>{so.size}<div style={{ fontSize: "0.6rem", opacity: 0.75, marginTop: 2 }}>{so.quantity === 0 ? "OOS" : `${so.quantity} left`}</div></button>); })}</div></div>)}
                        </>
                      ) : (
                        <div style={{ padding: 10, textAlign: "center", background: "#ecfdf5", borderRadius: 10, border: "1px solid #bbf7d0" }}><p style={{ margin: 0, fontSize: "0.8rem", color: "#166534", fontWeight: 500 }}>✓ Fixed quantity – no selection needed</p></div>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Footer */}
              <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#fff", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setBundleSizeModal(null)} style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  <button onClick={() => {
                    const incomplete = (bundleSizeModal.products || []).filter(i => {
                      const p = i.product; if (!p) return true;
                      const pid2 = p._id?.toString();
                      const hasAny = (p.sizeStock || []).some(s => s.quantity > 0) || (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0));
                      if (!hasAny) return false;
                      const sel = bundleSelections[pid2] || {};
                      return !sel.color || !sel.size;
                    });
                    if (incomplete.length > 0) { toast.error(`Complete selections for ${incomplete.length} product(s)`); return; }
                    confirmAddBundle(bundleSizeModal, bundleSelections);
                  }} style={{ flex: 2, padding: "13px 16px", borderRadius: 10, background: "linear-gradient(135deg,#1a1a1a,#333)", color: "#d4af37", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                    ✓ Add Bundle to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Home;
