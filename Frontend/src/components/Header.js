import React, { useEffect, useState, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  BsSearch, BsPlay, BsCoin, BsList, BsX,
  BsChevronDown, BsPersonCircle, BsHeart, BsCart3, BsChevronRight,
} from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { getAProduct, getAllProducts, getCategoryTree } from "../features/products/productSlilce";
import { getUserCart, getMyReferrals } from "../features/user/userSlice";
import { resetFirebaseMessaging } from "../utils/firebase";
import { productUrl, categoryUrl } from "../utils/seoUrl";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/product", label: "Shop" },
  { to: "/reels", label: "Reels" },
  { to: "/my-orders", label: "My Orders" },
  { to: "/blogs", label: "Blogs" },
  { to: "/contact", label: "Contact" },
];

// Category icons map (emoji by keyword)
const catIcon = (title = "") => {
  const t = title.toLowerCase();
  if (t.includes("saree") || t.includes("sari")) return "🥻";
  if (t.includes("kurti") || t.includes("kurta")) return "👘";
  if (t.includes("lehenga")) return "👗";
  if (t.includes("men") || t.includes("gents")) return "👔";
  if (t.includes("women") || t.includes("ladies")) return "👚";
  if (t.includes("kid") || t.includes("child")) return "🧒";
  if (t.includes("jewel") || t.includes("necklace") || t.includes("earring")) return "💍";
  if (t.includes("bag") || t.includes("purse")) return "👜";
  if (t.includes("shoe") || t.includes("sandal") || t.includes("footwear")) return "👠";
  if (t.includes("dupatta") || t.includes("stole")) return "🧣";
  if (t.includes("winter") || t.includes("jacket") || t.includes("sweater")) return "🧥";
  if (t.includes("cotton")) return "🌿";
  if (t.includes("silk")) return "✨";
  return "🏷️";
};

const Header = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((s) => s?.auth?.cartProducts);
  const authState = useSelector((s) => s?.auth);
  const coinsState = useSelector((s) => s?.auth?.coins);
  const productState = useSelector((s) => s?.product?.product);
  const categoryTree = useSelector((s) => s?.product?.categoryTree || []);
  const navigate = useNavigate();

  const [total, setTotal] = useState(0);
  const [productOpt, setProductOpt] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [hoveredParent, setHoveredParent] = useState(null);
  const [expandedDrawerCats, setExpandedDrawerCats] = useState(new Set());
  const [mobCatOpen, setMobCatOpen] = useState(false);
  const [mobCatParent, setMobCatParent] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const megaRef = useRef(null);
  const catBtnRef = useRef(null);

  const customerToken = (() => {
    try { return JSON.parse(localStorage.getItem("customer"))?.token; }
    catch { return null; }
  })();

  const config2 = {
    headers: { Authorization: `Bearer ${customerToken || ""}`, Accept: "application/json" },
  };

  // Handle mobile detection and window resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 991;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Fetch lightweight product list for search typeahead only if not already loaded
    if (!productState?.length) dispatch(getAllProducts({ limit: 60 }));
    dispatch(getCategoryTree());
  }, []);
  useEffect(() => { dispatch(getUserCart(config2)); }, [dispatch]);
  useEffect(() => { if (customerToken) dispatch(getMyReferrals()); }, [dispatch, customerToken]);

  useEffect(() => {
    setTotal(cartState?.length
      ? cartState.reduce((s, i) => s + Number(i.quantity) * i.price, 0) : 0);
  }, [cartState]);

  useEffect(() => {
    if (productState?.length)
      setProductOpt(productState.filter(p => p?._id && p?.title).map((p, i) => ({ id: i, prod: p._id, name: p.title })));
  }, [productState]);

  // Close mega menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (catOpen && megaRef.current && !megaRef.current.contains(e.target) && !catBtnRef.current?.contains(e.target)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [catOpen]);

  const handleLogout = () => { resetFirebaseMessaging(); localStorage.clear(); window.location.reload(); };
  const closeMobile = () => setMobileOpen(false);
  const isLoggedIn = authState?.user !== null;

  // Use category tree; fallback to product-derived list
  const hasTree = categoryTree && categoryTree.length > 0;
  const fallbackCats = productState?.length
    ? [...new Set(productState.map(p => p.category))].filter(Boolean).slice(0, 8)
    : [];

  // Set first parent as default hovered when mega menu opens
  useEffect(() => {
    if (catOpen && hasTree && !hoveredParent) {
      setHoveredParent(categoryTree[0]?._id || null);
    }
    if (!catOpen) setHoveredParent(null);
  }, [catOpen, hasTree, categoryTree]);

  const toggleDrawerCat = (id) => {
    setExpandedDrawerCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeParent = categoryTree.find(c => c._id === hoveredParent);
  const subCategories = activeParent?.children || [];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* TOP STRIP */
        .h-strip { background:#1a1a1a; padding:7px 20px; display:flex; justify-content:space-between; align-items:center; }
        .h-strip p { color:#aaa; font-size:12px; margin:0; }
        .h-strip a { color:#d4af37; text-decoration:none; margin-left:5px; }

        /* HEADER WRAPPER */
        .h-wrap {
          background:#fff;
          border-bottom:1px solid #e8e8e8;
          position:sticky;
          top:0;
          z-index:1050;
          box-shadow:0 2px 8px rgba(0,0,0,0.08);
        }

        /* MAIN ROW */
        .h-row {
          display:flex; align-items:center; padding:0 20px; height:150px;
          max-width:1320px; margin:0 auto; width:100%; overflow:hidden;
        }

        /* HAMBURGER */
        .h-burger {
          display:none; background:none; border:none; font-size:26px; color:#1a1a1a;
          cursor:pointer; padding:0; margin-right:10px; flex-shrink:0; line-height:1;
        }

        /* LOGO */
        .h-logo {
          text-decoration:none; flex-shrink:0; display:flex; align-items:center; line-height:1;
        }
        .h-logo-img { height:125px; width:125px; object-fit:contain; display:block; }

        /* SEARCH */
        .h-search { flex:1; display:flex; align-items:center; margin:0 16px; min-width:0; }
        .h-search .rbt { flex:1; min-width:0; }
        .h-search .rbt-input-main { border-radius:6px 0 0 6px !important; border-right:none !important; height:40px; font-size:14px; }
        .h-sbtn { height:40px; padding:0 14px; background:#d4af37; border:none; border-radius:0 6px 6px 0; cursor:pointer; display:flex; align-items:center; flex-shrink:0; }

        /* DESKTOP EXTRAS */
        .h-reels {
          display:flex; align-items:center; gap:5px; background:#1a1a1a; color:#fff;
          border-radius:30px; padding:7px 14px; font-size:13px; font-weight:600;
          text-decoration:none; white-space:nowrap; flex-shrink:0; margin-right:10px;
        }
        .h-reels:hover { background:#333; color:#fff; }
        .h-coins {
          display:flex; align-items:center; gap:4px; background:rgba(212,175,55,0.13);
          color:#b8960c; border-radius:20px; padding:5px 10px; font-size:12px; font-weight:700;
          text-decoration:none; white-space:nowrap; flex-shrink:0; margin-right:8px;
        }
        .h-coins:hover { background:rgba(212,175,55,0.25); color:#b8960c; }

        /* ICON BUTTONS */
        .h-icons { display:flex; align-items:center; gap:0; flex-shrink:0; }
        .h-icon {
          display:flex; flex-direction:column; align-items:center; gap:2px;
          padding:6px 9px; color:#444; text-decoration:none; background:none;
          border:none; cursor:pointer; position:relative; font-size:21px; line-height:1; flex-shrink:0;
        }
        .h-icon:hover { color:#d4af37; }
        .h-icon-lbl { font-size:10px; color:#777; line-height:1; }
        .h-icon:hover .h-icon-lbl { color:#d4af37; }
        .h-badge {
          position:absolute; top:2px; right:2px; background:#d4af37; color:#1a1a1a;
          border-radius:50%; width:15px; height:15px; font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* MOBILE COINS */
        .h-mob-coins {
          display:none; align-items:center; justify-content:flex-end; gap:5px;
          padding:4px 20px; background:#fffbf0; border-top:1px solid #f0e8c8;
          font-size:12px; font-weight:700; color:#b8960c; text-decoration:none;
        }

        /* MOBILE SEARCH */
        .h-mob-search { display:none; padding:10px 16px; background:#f7f7f7; border-top:1px solid #e8e8e8; }
        .h-mob-search .rbt { flex:1; min-width:0; }
        .h-mob-search .rbt-input-main { border-radius:6px 0 0 6px !important; border-right:none !important; height:40px; }
        .h-mob-search-inner { display:flex; width:100%; }

        /* DESKTOP NAV */
        .h-nav { background:#1a1a1a; position:sticky; top:60px; z-index:1040; }
        .h-nav-inner {
          max-width:1320px; margin:0 auto; padding:0 20px;
          display:flex; align-items:center; justify-content:space-between; height:46px;
        }
        .h-navlink { color:#bbb; text-decoration:none; font-size:14px; font-weight:500; white-space:nowrap; transition:color 0.2s; }
        .h-navlink:hover, .h-navlink-active { color:#d4af37 !important; }

        /* CATEGORY BUTTON */
        .h-cat-btn {
          background:none; border:none; color:#fff; font-size:14px;
          display:flex; align-items:center; gap:6px; cursor:pointer; white-space:nowrap;
          padding:0; height:46px; font-weight:600; letter-spacing:0.2px;
        }
        .h-cat-btn:hover { color:#d4af37; }

        /* ── MEGA MENU ── */
        .h-mega {
          position:absolute;
          top:100%;
          left:0; right:0;
          background:#fff;
          box-shadow:0 16px 48px rgba(0,0,0,0.18);
          z-index:1045;
          border-top:3px solid #d4af37;
          animation:megaSlideIn 0.22s cubic-bezier(0.16,1,0.3,1) both;
          display:flex;
          min-height:320px;
          max-height:70vh;
          transform-origin:top center;
        }
        @keyframes megaSlideIn {
          from { opacity:0; transform:translateY(-14px) scaleY(0.97); }
          to   { opacity:1; transform:translateY(0) scaleY(1); }
        }

        /* Left panel — parent categories */
        .h-mega-left {
          width:240px;
          flex-shrink:0;
          background:#1a1a1a;
          overflow-y:auto;
          padding:8px 0;
        }
        .h-mega-parent {
          display:flex; align-items:center; gap:10px;
          padding:13px 20px; cursor:pointer;
          color:#ccc; font-size:14px; font-weight:500;
          transition:background 0.18s, color 0.18s, border-color 0.18s;
          border-left:3px solid transparent;
          text-decoration:none;
          animation:parentFadeIn 0.3s ease both;
        }
        @keyframes parentFadeIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .h-mega-parent:hover, .h-mega-parent.active {
          background:#2a2a2a; color:#d4af37;
          border-left-color:#d4af37;
        }
        .h-mega-parent-icon { font-size:18px; width:24px; text-align:center; flex-shrink:0; }
        .h-mega-parent-arrow { margin-left:auto; opacity:0.4; font-size:11px; }
        .h-mega-parent:hover .h-mega-parent-arrow,
        .h-mega-parent.active .h-mega-parent-arrow { opacity:1; color:#d4af37; }

        /* Right panel — subcategories */
        .h-mega-right {
          flex:1;
          padding:24px 32px;
          overflow-y:auto;
          background:#fff;
          animation:rightFadeIn 0.28s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes rightFadeIn {
          from { opacity:0; transform:translateX(10px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .h-mega-right-title {
          font-size:13px; font-weight:700; color:#999; text-transform:uppercase;
          letter-spacing:1px; margin-bottom:16px;
          display:flex; align-items:center; gap:8px;
        }
        .h-mega-right-title::after {
          content:''; flex:1; height:1px; background:#f0f0f0;
        }
        .h-mega-subs {
          display:grid;
          grid-template-columns:repeat(auto-fill, minmax(160px, 1fr));
          gap:8px;
        }
        .h-mega-sub {
          display:flex; align-items:center; gap:8px;
          padding:10px 14px; border-radius:10px;
          color:#333; text-decoration:none; font-size:14px; font-weight:500;
          transition:background 0.18s, color 0.18s, border-color 0.18s, transform 0.18s, box-shadow 0.18s;
          border:1.5px solid transparent;
          background:#fafafa;
          animation:subFadeIn 0.25s ease both;
        }
        @keyframes subFadeIn {
          from { opacity:0; transform:translateY(6px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .h-mega-sub:nth-child(1)  { animation-delay:0.03s; }
        .h-mega-sub:nth-child(2)  { animation-delay:0.06s; }
        .h-mega-sub:nth-child(3)  { animation-delay:0.09s; }
        .h-mega-sub:nth-child(4)  { animation-delay:0.12s; }
        .h-mega-sub:nth-child(5)  { animation-delay:0.15s; }
        .h-mega-sub:nth-child(6)  { animation-delay:0.18s; }
        .h-mega-sub:nth-child(n+7){ animation-delay:0.21s; }
        .h-mega-sub:hover {
          background:#fff7e6; color:#d4af37;
          border-color:#d4af3755; transform:translateY(-2px);
          box-shadow:0 4px 12px rgba(212,175,55,0.15);
        }
        .h-mega-sub-icon { font-size:18px; }
        .h-mega-allcat {
          display:inline-flex; align-items:center; gap:6px;
          margin-top:20px; padding:9px 18px; border-radius:20px;
          background:#1a1a1a; color:#d4af37; font-size:13px; font-weight:600;
          text-decoration:none;
          transition:background 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .h-mega-allcat:hover {
          background:#333; color:#d4af37;
          transform:translateY(-2px);
          box-shadow:0 6px 16px rgba(0,0,0,0.2);
        }

        /* Fallback simple dropdown */
        .h-cat-menu {
          position:absolute; top:calc(100% + 6px); left:0;
          background:#222; border-radius:8px; min-width:200px;
          z-index:300; box-shadow:0 8px 24px rgba(0,0,0,0.35); overflow:hidden;
          animation:megaSlideIn 0.15s ease;
        }
        .h-cat-item { display:block; padding:11px 20px; color:#ddd; text-decoration:none; font-size:14px; transition:background 0.15s,color 0.15s; }
        .h-cat-item:hover { background:#2d2d2d; color:#d4af37; }

        /* DRAWER */
        .h-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; }
        .h-drawer {
          position:fixed; top:0; left:0; height:100%; width:82vw; max-width:320px;
          background:#fff; z-index:2001; overflow-y:auto;
          padding:0; transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);
          display:flex; flex-direction:column;
        }
        .h-drawer-head {
          background:#1a1a1a; padding:20px 20px 16px;
          display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
        }
        .h-drawer-close { background:none; border:none; color:#fff; font-size:24px; cursor:pointer; padding:0; line-height:1; }
        .h-drawer-link {
          display:flex; align-items:center; gap:12px;
          padding:14px 20px; color:#333; text-decoration:none;
          font-size:15px; border-bottom:1px solid #f0f0f0; transition:color 0.2s;
          font-weight:500;
        }
        .h-drawer-link:hover { color:#d4af37; background:#fffbf0; }
        .h-drawer-logout { background:none; border:none; width:100%; text-align:left; padding:14px 20px; color:#ff4444; font-size:15px; cursor:pointer; font-weight:500; border-top:1px solid #f0f0f0; margin-top:auto; }

        /* Mobile Category Bottom Sheet */
        .h-mobcat-sheet {
          position:fixed; bottom:0; left:0; right:0;
          background:#fff; border-radius:20px 20px 0 0;
          z-index:2100; max-height:88vh;
          display:flex; flex-direction:column;
          box-shadow:0 -8px 40px rgba(0,0,0,0.18);
          transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);
        }
        .h-mobcat-sheet.open  { transform:translateY(0); }
        .h-mobcat-sheet.closed { transform:translateY(100%); }
        .h-mobcat-handle { width:40px; height:4px; background:#e0e0e0; border-radius:2px; margin:12px auto 0; flex-shrink:0; }
        .h-mobcat-head {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 20px 12px; border-bottom:1px solid #f0f0f0; flex-shrink:0;
        }
        .h-mobcat-title { font-size:17px; font-weight:700; color:#1a1a1a; }
        .h-mobcat-back {
          background:none; border:none; color:#d4af37; font-size:14px;
          font-weight:600; cursor:pointer; display:flex; align-items:center; gap:4px; padding:0;
        }
        .h-mobcat-body { overflow-y:auto; flex:1; padding:8px 0 24px; }

        /* Parent category cards */
        .h-mobcat-card {
          display:flex; align-items:center; gap:14px;
          padding:16px 20px; border-bottom:1px solid #f5f5f5;
          cursor:pointer; transition:background 0.15s;
          text-decoration:none;
        }
        .h-mobcat-card:active { background:#fffbf0; }
        .h-mobcat-card-icon { font-size:26px; width:44px; height:44px; background:#f7f7f7; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .h-mobcat-card-info { flex:1; min-width:0; }
        .h-mobcat-card-name { font-size:15px; font-weight:600; color:#1a1a1a; }
        .h-mobcat-card-sub { font-size:12px; color:#999; margin-top:2px; }
        .h-mobcat-card-arrow { color:#ccc; flex-shrink:0; }

        /* Sub category chips */
        .h-mobcat-subs { padding:12px 16px; display:flex; flex-wrap:wrap; gap:10px; }
        .h-mobcat-sub-chip {
          display:flex; align-items:center; gap:8px;
          padding:10px 16px; border-radius:12px;
          background:#f7f7f7; border:1.5px solid transparent;
          font-size:14px; font-weight:500; color:#333;
          cursor:pointer; transition:all 0.15s; text-decoration:none;
          width:calc(50% - 5px);
        }
        .h-mobcat-sub-chip:active { background:#fff7e6; border-color:#d4af37; color:#d4af37; }
        .h-mobcat-allbtn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          margin:8px 16px 0; padding:14px; border-radius:14px;
          background:#1a1a1a; color:#d4af37; font-size:15px; font-weight:700;
          text-decoration:none; transition:background 0.2s;
        }
        .h-mobcat-allbtn:active { background:#333; color:#d4af37; }

        /* Bottom nav bar */
        .h-bottomnav {
          position:fixed; bottom:0; left:0; right:0;
          background:#fff; border-top:1px solid #ececec;
          z-index:1200;
          height:calc(56px + env(safe-area-inset-bottom));
          padding-bottom:env(safe-area-inset-bottom);
          box-shadow:0 -2px 16px rgba(0,0,0,0.07);
        }
        .h-bottomnav-inner {
          display:flex; height:56px; align-items:stretch;
        }
        .h-bn-item, .h-bn-cat {
          flex:1; display:flex; flex-direction:column; align-items:center;
          justify-content:center; gap:2px;
          text-decoration:none; border:none; background:none;
          cursor:pointer; color:#999;
          font-size:9px; font-weight:600; letter-spacing:0.2px;
          line-height:1; padding:0 2px; min-width:0;
          -webkit-tap-highlight-color:transparent;
          transition:color 0.15s, transform 0.12s;
        }
        .h-bn-item.active { color:#d4af37; }
        .h-bn-item:active, .h-bn-cat:active { color:#d4af37; transform:scale(0.9); }
        .h-bn-lbl {
          display:block; width:100%; text-align:center;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          font-size:9px; line-height:1;
        }
        .h-bn-icon {
          width:24px; height:24px; display:flex;
          align-items:center; justify-content:center;
          flex-shrink:0; position:relative;
        }

        /* ── MOBILE ── */
        @media (max-width:991px) {
          .h-strip  { display:none; }
          .h-nav    { display:none; }
          .h-mega   { display:none; }
          .h-burger { display:flex; }
          .h-search { display:none; }
          .h-reels  { display:none; }
          .h-coins  { display:none; }
          .h-icon-lbl { display:none; }
          .h-icon   { padding:6px 10px; font-size:22px; }
          .h-logo   { flex:1; justify-content:center; }
          .h-logo-img { height:56px; width:56px; }
          .h-mob-coins.logged { display:flex; }
          .h-mob-search.open  { display:flex; }
          /* Show search toggle on mobile */
          #mob-search-toggle { display:flex !important; }
        }
        @media (max-width:360px) {
          .h-bn-lbl { display:none; }
          .h-bn-item, .h-bn-cat { justify-content:center; }
          .h-bn-icon { width:26px; height:26px; }
        }
        @media (max-width:400px) {
          .h-icon  { padding:6px 7px; font-size:20px; }
          .h-logo-img { height:48px; width:48px; }
          .h-row   { padding:0 10px; }
        }
        /* Hide search toggle on desktop */
        @media (min-width:992px) {
          #mob-search-toggle { display:none !important; }
        }
      `}</style>

      {/* TOP STRIP */}
      <div className="h-strip">
        <p>Welcome to Yashoda Fashion</p>
        <p>Hotline:<a href="tel:+918264954234">+91 8264954234</a></p>
      </div>

      {/* HEADER */}
      <header className="h-wrap">
        <div className="h-row">
          <button className="h-burger" onClick={() => setMobileOpen(true)} aria-label="Menu"><BsList /></button>

          <Link to="/" className="h-logo"><img src="/yashoda-logo.png" alt="Yashoda Fashion" className="h-logo-img" /></Link>

          <div className="h-search">
            <Typeahead
              id="search-desktop"
              onChange={(sel) => {
                if (sel?.[0]?.prod) {
                  const p = productState?.find(x => x._id === sel[0].prod);
                  navigate(productUrl(p || { _id: sel[0].prod, title: sel[0].name }));
                  dispatch(getAProduct(sel[0].prod));
                }
              }}
              options={productOpt} labelKey="name" placeholder="Search products..."
            />
            <button className="h-sbtn"><BsSearch color="#1a1a1a" size={15} /></button>
          </div>

          <Link to="/reels" className="h-reels"><BsPlay /> Reels</Link>

          {isLoggedIn && (
            <Link to="/my-profile" className="h-coins">
              <BsCoin size={13} />
              {coinsState ? coinsState.toLocaleString() : "0"} coins
            </Link>
          )}

          <div className="h-icons">
            <button className="h-icon" onClick={() => setSearchOpen(v => !v)} aria-label="Search"
              id="mob-search-toggle">
              {searchOpen ? <BsX /> : <BsSearch />}
            </button>
            <Link to={isLoggedIn ? "/my-profile" : "/login"} className="h-icon" title="Profile">
              <BsPersonCircle />
              <span className="h-icon-lbl">{isLoggedIn ? (authState?.user?.firstname?.slice(0, 7) || "Profile") : "Login"}</span>
            </Link>
            <Link to="/wishlist" className="h-icon" title="Wishlist">
              <BsHeart /><span className="h-icon-lbl">Wishlist</span>
            </Link>
            <Link to="/cart" className="h-icon" title="Cart">
              <span style={{ position: "relative", display: "inline-flex" }}>
                <BsCart3 />
                {cartState?.length > 0 && <span className="h-badge">{cartState.length}</span>}
              </span>
              <span className="h-icon-lbl">{total > 0 ? `₹${total.toLocaleString()}` : "Cart"}</span>
            </Link>
          </div>
        </div>

        {isLoggedIn && (
          <Link to="/my-profile" className={`h-mob-coins${isLoggedIn ? " logged" : ""}`}>
            <BsCoin size={13} />{coinsState ? coinsState.toLocaleString() : "0"} coins
          </Link>
        )}

        <div className={`h-mob-search${searchOpen ? " open" : ""}`}>
          <div className="h-mob-search-inner">
            <Typeahead
              id="search-mobile"
              onChange={(sel) => {
                if (sel?.[0]?.prod) {
                  const p = productState?.find(x => x._id === sel[0].prod);
                  navigate(productUrl(p || { _id: sel[0].prod, title: sel[0].name }));
                  dispatch(getAProduct(sel[0].prod));
                  setSearchOpen(false);
                }
              }}
              options={productOpt} labelKey="name" placeholder="Search products..."
            />
            <button className="h-sbtn"><BsSearch color="#1a1a1a" size={15} /></button>
          </div>
        </div>
      </header>

      {/* DESKTOP NAV */}
      <nav className="h-nav">
        <div className="h-nav-inner">
          {/* Category button */}
          <div style={{ position: "relative", height: "46px", display: "flex", alignItems: "center" }}>
            <button
              ref={catBtnRef}
              className="h-cat-btn"
              onClick={() => setCatOpen(v => !v)}
            >
              <BsList size={18} /> All Categories
              <BsChevronDown size={11} style={{ transition: "transform 0.25s", transform: catOpen ? "rotate(180deg)" : "none" }} />
            </button>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `h-navlink${isActive ? " h-navlink-active" : ""}`}>
                {label}
              </NavLink>
            ))}
            {isLoggedIn && (
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Logout
              </button>
            )}
          </div>
        </div>

        {/* ── MEGA MENU (desktop) ── */}
        {catOpen && (
          <div ref={megaRef} className="h-mega">
            {hasTree ? (
              <>
                {/* Left: parent categories */}
                <div className="h-mega-left">
                  {categoryTree.map((cat) => (
                    <Link
                      key={cat._id}
                      to={categoryUrl(cat.title)}
                      className={`h-mega-parent${hoveredParent === cat._id ? " active" : ""}`}
                      onMouseEnter={() => setHoveredParent(cat._id)}
                      onClick={() => setCatOpen(false)}
                    >
                      <span className="h-mega-parent-icon">{catIcon(cat.title)}</span>
                      <span style={{ flex: 1 }}>{cat.title}</span>
                      {cat.children?.length > 0 && <BsChevronRight className="h-mega-parent-arrow" size={11} />}
                    </Link>
                  ))}
                </div>

                {/* Right: subcategories of hovered parent */}
                <div className="h-mega-right">
                  {activeParent && (
                    <>
                      <div className="h-mega-right-title">
                        {catIcon(activeParent.title)} {activeParent.title}
                      </div>

                      {subCategories.length > 0 ? (
                        <div className="h-mega-subs">
                          {subCategories.map((sub) => (
                            <Link
                              key={sub._id}
                              to={categoryUrl(sub.title)}
                              className="h-mega-sub"
                              onClick={() => setCatOpen(false)}
                            >
                              <span className="h-mega-sub-icon">{catIcon(sub.title)}</span>
                              <span>{sub.title}</span>
                              {sub.children?.length > 0 && (
                                <span style={{ marginLeft: "auto", fontSize: 10, color: "#bbb" }}>
                                  {sub.children.length}+
                                </span>
                              )}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: "#bbb", fontSize: 14 }}>No subcategories.</p>
                      )}

                      <Link to={categoryUrl(activeParent.title)} className="h-mega-allcat" onClick={() => setCatOpen(false)}>
                        Shop All {activeParent.title} →
                      </Link>
                    </>
                  )}

                  {!activeParent && (
                    <div className="h-mega-subs">
                      {categoryTree.map((cat) => (
                        <Link key={cat._id} to={categoryUrl(cat.title)} className="h-mega-sub" onClick={() => setCatOpen(false)}>
                          <span className="h-mega-sub-icon">{catIcon(cat.title)}</span>
                          <span>{cat.title}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: "12px 0", minWidth: 200 }}>
                {fallbackCats.map((cat, i) => (
                  <Link key={i} to={categoryUrl(cat)} className="h-cat-item" onClick={() => setCatOpen(false)}>{cat}</Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* OVERLAY — drawer + category sheet */}
      {(mobileOpen || mobCatOpen) && (
        <div className="h-overlay" onClick={() => { closeMobile(); setMobCatOpen(false); setMobCatParent(null); }} />
      )}

      {/* MOBILE DRAWER */}
      <div className="h-drawer" style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}>
        {/* Drawer header */}
        <div className="h-drawer-head">
          <div>
            {isLoggedIn ? (
              <>
                <p style={{ color: "#d4af37", margin: 0, fontWeight: 700, fontSize: 15 }}>Hi, {authState?.user?.firstname} 👋</p>
                <p style={{ color: "#aaa", margin: "4px 0 0", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <BsCoin color="#d4af37" size={12} /> {coinsState ? coinsState.toLocaleString() : "0"} coins
                </p>
              </>
            ) : (
              <Link to="/login" style={{ color: "#d4af37", fontWeight: 700, fontSize: 15, textDecoration: "none" }} onClick={closeMobile}>
                Login / Register →
              </Link>
            )}
          </div>
          <button className="h-drawer-close" onClick={closeMobile}><BsX /></button>
        </div>

        {/* Nav links */}
        {NAV_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) => `h-drawer-link${isActive ? " h-navlink-active" : ""}`}
            onClick={closeMobile}>
            {label}
          </NavLink>
        ))}

        <Link to="/wishlist" className="h-drawer-link" onClick={closeMobile}><BsHeart /> Wishlist</Link>
        <Link to="/cart" className="h-drawer-link" onClick={closeMobile}>
          <BsCart3 /> Cart {cartState?.length > 0 && `(${cartState.length})`}
        </Link>
        {isLoggedIn && (
          <>
            <Link to="/my-profile" className="h-drawer-link" onClick={closeMobile}><BsPersonCircle /> My Profile</Link>
            <button className="h-drawer-logout" onClick={handleLogout}>🚪 Logout</button>
          </>
        )}
      </div>

      {/* ── MOBILE CATEGORY BOTTOM SHEET ── */}
      <div className={`h-mobcat-sheet ${mobCatOpen ? "open" : "closed"}`}>
        <div className="h-mobcat-handle" />
        <div className="h-mobcat-head">
          {mobCatParent ? (
            <button className="h-mobcat-back" onClick={() => setMobCatParent(null)}>
              ← Back
            </button>
          ) : <span />}
          <span className="h-mobcat-title">
            {mobCatParent ? `${catIcon(mobCatParent.title)} ${mobCatParent.title}` : "Shop by Category"}
          </span>
          <button className="h-drawer-close" style={{ color: "#333" }}
            onClick={() => { setMobCatOpen(false); setMobCatParent(null); }}>
            <BsX />
          </button>
        </div>

        <div className="h-mobcat-body">
          {!mobCatParent ? (
            /* Level 1 — parent categories as cards */
            (hasTree ? categoryTree : fallbackCats.map(t => ({ _id: t, title: t, children: [] }))).map((cat) => (
              <div
                key={cat._id}
                className="h-mobcat-card"
                onClick={() => {
                  if (cat.children?.length > 0) {
                    setMobCatParent(cat);
                  } else {
                    navigate(categoryUrl(cat.title));
                    setMobCatOpen(false);
                  }
                }}
              >
                <div className="h-mobcat-card-icon">{catIcon(cat.title)}</div>
                <div className="h-mobcat-card-info">
                  <div className="h-mobcat-card-name">{cat.title}</div>
                  {cat.children?.length > 0 && (
                    <div className="h-mobcat-card-sub">{cat.children.length} subcategories</div>
                  )}
                </div>
                <BsChevronRight className="h-mobcat-card-arrow" size={16} />
              </div>
            ))
          ) : (
            /* Level 2 — subcategory chips */
            <>
              <Link
                to={categoryUrl(mobCatParent.title)}
                className="h-mobcat-allbtn"
                onClick={() => { setMobCatOpen(false); setMobCatParent(null); }}
              >
                Shop All {mobCatParent.title} →
              </Link>
              <div className="h-mobcat-subs">
                {mobCatParent.children.map((sub) => (
                  <Link
                    key={sub._id}
                    to={categoryUrl(sub.title)}
                    className="h-mobcat-sub-chip"
                    onClick={() => { setMobCatOpen(false); setMobCatParent(null); }}
                  >
                    <span style={{ fontSize: 18 }}>{catIcon(sub.title)}</span>
                    <span>{sub.title}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV BAR ── */}
      {isMobile && (
        <nav className="h-bottomnav" style={{ display: 'block', visibility: 'visible' }}>
          <div className="h-bottomnav-inner">

            <NavLink to="/" end className={({ isActive }) => `h-bn-item${isActive ? " active" : ""}`}>
              <span className="h-bn-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
              </span>
              <span className="h-bn-lbl">Home</span>
            </NavLink>

            <button className="h-bn-cat" onClick={() => { setMobCatOpen(true); setMobCatParent(null); }}>
              <span className="h-bn-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
              </span>
              <span className="h-bn-lbl">Categories</span>
            </button>

            <NavLink to="/product" className={({ isActive }) => `h-bn-item${isActive ? " active" : ""}`}>
              <span className="h-bn-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm0 10c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1s1-.45 1-1h2c0 1.66-1.34 3-3 3z"/></svg>
              </span>
              <span className="h-bn-lbl">Shop</span>
            </NavLink>

            <NavLink to="/wishlist" className={({ isActive }) => `h-bn-item${isActive ? " active" : ""}`}>
              <span className="h-bn-icon"><BsHeart size={20} /></span>
              <span className="h-bn-lbl">Wishlist</span>
            </NavLink>

            <NavLink to="/cart" className={({ isActive }) => `h-bn-item${isActive ? " active" : ""}`}>
              <span className="h-bn-icon">
                <BsCart3 size={20} />
                {cartState?.length > 0 && (
                  <span style={{
                    position:"absolute", top:-5, right:-6,
                    background:"#d4af37", color:"#1a1a1a",
                    borderRadius:"50%", width:15, height:15,
                    fontSize:8, fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    lineHeight:1,
                  }}>{cartState.length}</span>
                )}
              </span>
              <span className="h-bn-lbl">Cart</span>
            </NavLink>

          </div>
        </nav>
      )}


    </>
  );
};

export default Header;
