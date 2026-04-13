import React, { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  BsSearch, BsPlay, BsCoin, BsList, BsX,
  BsChevronDown, BsPersonCircle, BsHeart, BsCart3,
} from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { getAProduct, getAllProducts } from "../features/products/productSlilce";
import { getUserCart, getMyReferrals } from "../features/user/userSlice";
import { resetFirebaseMessaging } from "../utils/firebase";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/product", label: "Shop" },
  { to: "/reels", label: "Reels" },
  { to: "/my-orders", label: "My Orders" },
  { to: "/blogs", label: "Blogs" },
  { to: "/contact", label: "Contact" },
];

const Header = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((s) => s?.auth?.cartProducts);
  const authState = useSelector((s) => s?.auth);
  const coinsState = useSelector((s) => s?.auth?.coins);
  const productState = useSelector((s) => s?.product?.product);
  const navigate = useNavigate();

  const [total, setTotal] = useState(0);
  const [productOpt, setProductOpt] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const customerToken = (() => {
    try { return JSON.parse(localStorage.getItem("customer"))?.token; }
    catch { return null; }
  })();

  const config2 = {
    headers: { Authorization: `Bearer ${customerToken || ""}`, Accept: "application/json" },
  };

  useEffect(() => { if (!productState?.length) dispatch(getAllProducts()); }, []);
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

  const handleLogout = () => { resetFirebaseMessaging(); localStorage.clear(); window.location.reload(); };
  const closeMobile = () => setMobileOpen(false);
  const isLoggedIn = authState?.user !== null;
  const categories = productState?.length ? [...new Set(productState.map(p => p.category))].slice(0, 8) : [];

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
          display:flex;
          align-items:center;
          padding:0 20px;
          height:60px;
          max-width:1320px;
          margin:0 auto;
          width:100%;
          overflow:hidden;
        }

        /* HAMBURGER */
        .h-burger {
          display:none;
          background:none;
          border:none;
          font-size:26px;
          color:#1a1a1a;
          cursor:pointer;
          padding:0;
          margin-right:10px;
          flex-shrink:0;
          line-height:1;
        }

        /* LOGO */
        .h-logo {
          font-family:'Playfair Display',serif;
          font-size:22px;
          font-weight:700;
          color:#1a1a1a;
          text-decoration:none;
          white-space:nowrap;
          flex-shrink:0;
          line-height:1;
        }
        .h-logo em { color:#d4af37; font-style:normal; }

        /* SEARCH — desktop */
        .h-search {
          flex:1;
          display:flex;
          align-items:center;
          margin:0 16px;
          min-width:0;
        }
        .h-search .rbt { flex:1; min-width:0; }
        .h-search .rbt-input-main {
          border-radius:6px 0 0 6px !important;
          border-right:none !important;
          height:40px;
          font-size:14px;
        }
        .h-sbtn {
          height:40px;
          padding:0 14px;
          background:#d4af37;
          border:none;
          border-radius:0 6px 6px 0;
          cursor:pointer;
          display:flex;
          align-items:center;
          flex-shrink:0;
        }

        /* DESKTOP EXTRAS */
        .h-reels {
          display:flex;
          align-items:center;
          gap:5px;
          background:#1a1a1a;
          color:#fff;
          border-radius:30px;
          padding:7px 14px;
          font-size:13px;
          font-weight:600;
          text-decoration:none;
          white-space:nowrap;
          flex-shrink:0;
          margin-right:10px;
        }
        .h-reels:hover { background:#333; color:#fff; }

        .h-coins {
          display:flex;
          align-items:center;
          gap:4px;
          background:rgba(212,175,55,0.13);
          color:#b8960c;
          border-radius:20px;
          padding:5px 10px;
          font-size:12px;
          font-weight:700;
          text-decoration:none;
          white-space:nowrap;
          flex-shrink:0;
          margin-right:8px;
        }
        .h-coins:hover { background:rgba(212,175,55,0.25); color:#b8960c; }

        /* ICON BUTTONS */
        .h-icons { display:flex; align-items:center; gap:0; flex-shrink:0; }
        .h-icon {
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:2px;
          padding:6px 9px;
          color:#444;
          text-decoration:none;
          background:none;
          border:none;
          cursor:pointer;
          position:relative;
          font-size:21px;
          line-height:1;
          flex-shrink:0;
          white-space:nowrap;
        }
        .h-icon:hover { color:#d4af37; }
        .h-icon-lbl { font-size:10px; color:#777; line-height:1; }
        .h-icon:hover .h-icon-lbl { color:#d4af37; }
        .h-badge {
          position:absolute;
          top:2px; right:2px;
          background:#d4af37;
          color:#1a1a1a;
          border-radius:50%;
          width:15px; height:15px;
          font-size:9px; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* MOBILE COINS BAR — shown only on mobile when logged in */
        .h-mob-coins {
          display:none;
          align-items:center;
          justify-content:flex-end;
          gap:5px;
          padding:4px 20px;
          background:#fffbf0;
          border-top:1px solid #f0e8c8;
          font-size:12px;
          font-weight:700;
          color:#b8960c;
          text-decoration:none;
        }

        /* MOBILE SEARCH BAR */
        .h-mob-search {
          display:none;
          padding:10px 16px;
          background:#f7f7f7;
          border-top:1px solid #e8e8e8;
        }
        .h-mob-search .rbt { flex:1; min-width:0; }
        .h-mob-search .rbt-input-main {
          border-radius:6px 0 0 6px !important;
          border-right:none !important;
          height:40px;
        }
        .h-mob-search-inner { display:flex; width:100%; }

        /* DESKTOP NAV */
        .h-nav { background:#1a1a1a; }
        .h-nav-inner {
          max-width:1320px; margin:0 auto; padding:0 20px;
          display:flex; align-items:center; justify-content:space-between; height:46px;
        }
        .h-navlink { color:#bbb; text-decoration:none; font-size:14px; font-weight:500; white-space:nowrap; transition:color 0.2s; }
        .h-navlink:hover, .h-navlink-active { color:#d4af37 !important; }
        .h-cat-btn {
          background:none; border:none; color:#fff; font-size:14px;
          display:flex; align-items:center; gap:6px; cursor:pointer; white-space:nowrap; padding:0;
        }
        .h-cat-menu {
          position:absolute; top:calc(100% + 6px); left:0;
          background:#222; border-radius:8px; min-width:200px;
          z-index:300; box-shadow:0 8px 24px rgba(0,0,0,0.35); overflow:hidden;
        }
        .h-cat-item { display:block; padding:11px 20px; color:#ddd; text-decoration:none; font-size:14px; transition:background 0.15s,color 0.15s; }
        .h-cat-item:hover { background:#2d2d2d; color:#d4af37; }

        /* DRAWER */
        .h-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:2000; }
        .h-drawer {
          position:fixed; top:0; left:0; height:100%; width:280px;
          background:#1a1a1a; z-index:2001; overflow-y:auto;
          padding:16px 0; transition:transform 0.3s ease;
        }
        .h-drawer-close { background:none; border:none; color:#fff; font-size:26px; cursor:pointer; padding:0 20px 12px; display:block; }
        .h-drawer-link { display:block; padding:13px 24px; color:#ccc; text-decoration:none; font-size:15px; border-bottom:1px solid #2a2a2a; transition:color 0.2s; }
        .h-drawer-link:hover { color:#d4af37; }
        .h-drawer-logout { background:none; border:none; width:100%; text-align:left; padding:13px 24px; color:#ff6b6b; font-size:15px; cursor:pointer; margin-top:8px; }

        /* ── MOBILE ── */
        @media (max-width: 991px) {
          .h-strip    { display:none; }
          .h-nav      { display:none; }
          .h-burger   { display:flex; }
          .h-search   { display:none; }
          .h-reels    { display:none; }
          .h-coins    { display:none; }
          .h-icon-lbl { display:none; }
          .h-icon     { padding:6px 10px; font-size:22px; }
          .h-logo     { font-size:19px; flex:1; text-align:center; }
          .h-mob-coins.logged { display:flex; }
          .h-mob-search.open  { display:flex; }
        }

        @media (max-width: 400px) {
          .h-icon  { padding:6px 7px; font-size:20px; }
          .h-logo  { font-size:17px; }
          .h-row   { padding:0 10px; }
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

          {/* Hamburger */}
          <button className="h-burger" onClick={() => setMobileOpen(true)} aria-label="Menu">
            <BsList />
          </button>

          {/* Logo */}
          <Link to="/" className="h-logo">
            Vogue<em>Craft</em>
          </Link>

          {/* Desktop Search */}
          <div className="h-search">
            <Typeahead
              id="search-desktop"
              onChange={(sel) => { if (sel?.[0]?.prod) { navigate(`/product/${sel[0].prod}`); dispatch(getAProduct(sel[0].prod)); } }}
              options={productOpt} labelKey="name" placeholder="Search products..."
            />
            <button className="h-sbtn"><BsSearch color="#1a1a1a" size={15} /></button>
          </div>

          {/* Reels — desktop */}
          <Link to="/reels" className="h-reels"><BsPlay /> Reels</Link>

          {/* Coins — desktop */}
          {isLoggedIn && (
            <Link to="/my-profile" className="h-coins">
              <BsCoin size={13} />
              {coinsState ? coinsState.toLocaleString() : "0"} coins
            </Link>
          )}

          {/* Icons — always visible */}
          <div className="h-icons">
            {/* Search toggle — mobile only (visible via CSS) */}
            <button
              className="h-icon"
              onClick={() => setSearchOpen(v => !v)}
              aria-label="Search"
              style={{ display: "none" }}
              id="mob-search-toggle"
            >
              {searchOpen ? <BsX /> : <BsSearch />}
            </button>

            {/* Profile */}
            <Link to={isLoggedIn ? "/my-profile" : "/login"} className="h-icon" title="Profile">
              <BsPersonCircle />
              <span className="h-icon-lbl">{isLoggedIn ? (authState?.user?.firstname?.slice(0, 7) || "Profile") : "Login"}</span>
            </Link>

            {/* Wishlist */}
            <Link to="/wishlist" className="h-icon" title="Wishlist">
              <BsHeart />
              <span className="h-icon-lbl">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="h-icon" title="Cart">
              <span style={{ position: "relative", display: "inline-flex" }}>
                <BsCart3 />
                {cartState?.length > 0 && <span className="h-badge">{cartState.length}</span>}
              </span>
              <span className="h-icon-lbl">{total > 0 ? `₹${total.toLocaleString()}` : "Cart"}</span>
            </Link>
          </div>
        </div>

        {/* Mobile Coins Bar */}
        {isLoggedIn && (
          <Link to="/my-profile" className={`h-mob-coins${isLoggedIn ? " logged" : ""}`}>
            <BsCoin size={13} />
            {coinsState ? coinsState.toLocaleString() : "0"} coins
          </Link>
        )}

        {/* Mobile Search Bar */}
        <div className={`h-mob-search${searchOpen ? " open" : ""}`}>
          <div className="h-mob-search-inner">
            <Typeahead
              id="search-mobile"
              onChange={(sel) => { if (sel?.[0]?.prod) { navigate(`/product/${sel[0].prod}`); dispatch(getAProduct(sel[0].prod)); setSearchOpen(false); } }}
              options={productOpt} labelKey="name" placeholder="Search products..."
            />
            <button className="h-sbtn"><BsSearch color="#1a1a1a" size={15} /></button>
          </div>
        </div>
      </header>

      {/* DESKTOP NAV */}
      <nav className="h-nav">
        <div className="h-nav-inner">
          <div style={{ position: "relative" }}>
            <button className="h-cat-btn" onClick={() => setCatOpen(v => !v)}>
              <BsList size={18} /> Shop Categories
              <BsChevronDown size={11} style={{ transition: "transform 0.2s", transform: catOpen ? "rotate(180deg)" : "none" }} />
            </button>
            {catOpen && categories.length > 0 && (
              <div className="h-cat-menu">
                {categories.map((cat, i) => (
                  <Link key={i} to="/product" className="h-cat-item" onClick={() => setCatOpen(false)}>{cat}</Link>
                ))}
              </div>
            )}
          </div>
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
      </nav>

      {/* OVERLAY */}
      {mobileOpen && <div className="h-overlay" onClick={closeMobile} />}

      {/* DRAWER */}
      <div className="h-drawer" style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <button className="h-drawer-close" onClick={closeMobile}><BsX /></button>

        <div style={{ padding: "0 24px 14px", borderBottom: "1px solid #2a2a2a", marginBottom: 4 }}>
          {isLoggedIn ? (
            <>
              <p style={{ color: "#d4af37", margin: 0, fontWeight: 700, fontSize: 15 }}>Hi, {authState?.user?.firstname}</p>
              <p style={{ color: "#aaa", margin: "5px 0 0", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
                <BsCoin color="#d4af37" size={13} />
                {coinsState ? coinsState.toLocaleString() : "0"} coins
              </p>
            </>
          ) : (
            <Link to="/login" className="h-drawer-link" style={{ padding: 0, color: "#d4af37" }} onClick={closeMobile}>Login / Register →</Link>
          )}
        </div>

        {NAV_LINKS.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `h-drawer-link${isActive ? " h-navlink-active" : ""}`} onClick={closeMobile}>
            {label}
          </NavLink>
        ))}
        <Link to="/wishlist" className="h-drawer-link" onClick={closeMobile}>❤️ Wishlist</Link>
        <Link to="/cart" className="h-drawer-link" onClick={closeMobile}>
          🛒 Cart {cartState?.length > 0 && `(${cartState.length})`}
        </Link>
        {isLoggedIn && (
          <>
            <Link to="/my-profile" className="h-drawer-link" onClick={closeMobile}>👤 My Profile</Link>
            <button className="h-drawer-logout" onClick={handleLogout}>🚪 Logout</button>
          </>
        )}
      </div>

      {/* Mobile search toggle — injected via CSS display trick */}
      <style>{`
        @media (max-width: 991px) {
          #mob-search-toggle { display:flex !important; }
        }
      `}</style>
    </>
  );
};

export default Header;
