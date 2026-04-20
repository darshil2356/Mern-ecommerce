import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Meta from "../components/Meta";
import axios from "axios";
import { base_url, getConfig } from "../utils/axiosConfig";
import { productUrl } from "../utils/seoUrl";
import {
  BsHeart, BsHeartFill, BsShare, BsArrowLeft,
  BsPlay, BsGrid, BsList, BsX, BsVolumeUp, BsVolumeMute,
} from "react-icons/bs";

const LIMIT = 10;

const getYtId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

const Reels = () => {
  const navigate = useNavigate();

  // ─── state ──────────────────────────────────────────────────────────────────
  const [reels, setReels]             = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted]         = useState(false);
  const [paused, setPaused]           = useState(false);
  const [progress, setProgress]       = useState(0);
  const [likes, setLikes]             = useState({});
  const [shareItem, setShareItem]     = useState(null);
  const [copyDone, setCopyDone]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [nextPage, setNextPage]       = useState(null);
  const [viewMode, setViewMode]       = useState("fullscreen");
  const [heartAnim, setHeartAnim]     = useState(null); // _id of reel showing heart

  // ─── refs (avoid stale closures) ────────────────────────────────────────────
  const containerRef    = useRef(null);
  const videoRefs       = useRef({});
  const loadingRef      = useRef(false);
  const isMutedRef      = useRef(false);
  const currentIdxRef   = useRef(0);
  const reelsRef        = useRef([]);
  const hasMoreRef      = useRef(true);
  const nextPageRef     = useRef(null);
  const loadingStateRef = useRef(false);
  const lastTapRef      = useRef({});

  useEffect(() => { isMutedRef.current   = isMuted;  }, [isMuted]);
  useEffect(() => { reelsRef.current     = reels;    }, [reels]);
  useEffect(() => { hasMoreRef.current   = hasMore;  }, [hasMore]);
  useEffect(() => { nextPageRef.current  = nextPage; }, [nextPage]);
  useEffect(() => { loadingStateRef.current = loading; }, [loading]);

  // ─── fetch ───────────────────────────────────────────────────────────────────
  const fetchReels = useCallback(async (page = null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = { limit: LIMIT };
      if (page) params.page = page;
      const { data } = await axios.get(`${base_url}product/reels`, {
        params,
        headers: getConfig().headers,
      });
      setReels(prev => page ? [...prev, ...data.reels] : data.reels);
      setNextPage(data.nextCursor);
      setHasMore(data.hasMore);
      setLikes(prev => {
        const map = { ...prev };
        data.reels.forEach(r => {
          if (!map[r._id]) map[r._id] = { liked: r.liked || false, count: r.reelLikes || 0 };
        });
        return map;
      });
    } catch (e) {
      console.error("Failed to fetch reels", e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  // ─── play helper ─────────────────────────────────────────────────────────────
  const playAt = useCallback((index) => {
    const v = videoRefs.current[index];
    if (!v) return;
    v.muted = isMutedRef.current;
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, []);

  // ─── when active index changes: pause others, play current ───────────────────
  useEffect(() => {
    currentIdxRef.current = currentIndex;
    setProgress(0);
    setPaused(false);

    Object.entries(videoRefs.current).forEach(([i, v]) => {
      if (parseInt(i) !== currentIndex && v) {
        v.pause();
        v.currentTime = 0;
      }
    });
    playAt(currentIndex);

    // auto-load more
    if (
      currentIndex >= reelsRef.current.length - 3 &&
      hasMoreRef.current &&
      !loadingStateRef.current
    ) {
      fetchReels(nextPageRef.current);
    }
  }, [currentIndex, playAt, fetchReels]);

  // ─── sync muted to all video elements ────────────────────────────────────────
  useEffect(() => {
    Object.values(videoRefs.current).forEach(v => { if (v) v.muted = isMuted; });
  }, [isMuted]);

  // ─── scroll handler ───────────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    if (idx !== currentIdxRef.current && idx >= 0 && idx < reelsRef.current.length) {
      setCurrentIndex(idx);
    }
  }, []);

  const scrollToIndex = useCallback((index) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * el.clientHeight, behavior: "smooth" });
  }, []);

  // ─── tap: single = play/pause, double = like ──────────────────────────────────
  const handleTap = useCallback((e, item, index) => {
    if (e.target.closest("[data-interactive]")) return;
    const now = Date.now();
    const last = lastTapRef.current[index] || 0;

    if (now - last < 320) {
      // double tap → like
      lastTapRef.current[index] = 0;
      const customer = localStorage.getItem("customer")
        ? JSON.parse(localStorage.getItem("customer")) : null;
      if (!customer?.token) return;
      const prev = likes[item._id] || { liked: false, count: 0 };
      if (!prev.liked) {
        setLikes(s => ({ ...s, [item._id]: { liked: true, count: prev.count + 1 } }));
        setHeartAnim(item._id);
        setTimeout(() => setHeartAnim(null), 900);
        axios.put(`${base_url}product/reels/${item._id}/like`, {}, getConfig())
          .then(({ data }) => setLikes(s => ({ ...s, [item._id]: { liked: data.liked, count: data.reelLikes } })))
          .catch(() => setLikes(s => ({ ...s, [item._id]: prev })));
      }
    } else {
      lastTapRef.current[index] = now;
      setTimeout(() => {
        if (lastTapRef.current[index] !== now) return; // was a double-tap
        const v = videoRefs.current[index];
        if (!v) return; // YouTube reels have no video ref — skip play/pause
        if (v.paused) { v.play().catch(() => {}); setPaused(false); }
        else { v.pause(); setPaused(true); }
      }, 330);
    }
  }, [likes]);

  // ─── like button ─────────────────────────────────────────────────────────────
  const handleLike = async (e, productId) => {
    e.stopPropagation();
    const customer = localStorage.getItem("customer")
      ? JSON.parse(localStorage.getItem("customer")) : null;
    if (!customer?.token) { navigate("/login"); return; }
    const prev = likes[productId] || { liked: false, count: 0 };
    setLikes(s => ({ ...s, [productId]: { liked: !prev.liked, count: prev.liked ? prev.count - 1 : prev.count + 1 } }));
    try {
      const { data } = await axios.put(`${base_url}product/reels/${productId}/like`, {}, getConfig());
      setLikes(s => ({ ...s, [productId]: { liked: data.liked, count: data.reelLikes } }));
    } catch {
      setLikes(s => ({ ...s, [productId]: prev }));
    }
  };

  // ─── share ────────────────────────────────────────────────────────────────────
  const handleShareOpen = (e, item) => { e.stopPropagation(); setShareItem(item); };

  const handleWhatsAppShare = () => {
    if (!shareItem) return;
    const url = `${window.location.origin}${productUrl(shareItem)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareItem.title} - ₹${shareItem.price?.toLocaleString()}\n${url}`)}`, "_blank");
    setShareItem(null);
  };

  const handleCopyLink = () => {
    if (!shareItem) return;
    const url = `${window.location.origin}${productUrl(shareItem)}`;
    (navigator.clipboard?.writeText(url) || Promise.reject()).catch(() => {
      const el = document.createElement("textarea");
      el.value = url; el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el); el.focus(); el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
    });
    setCopyDone(true);
    setTimeout(() => { setCopyDone(false); setShareItem(null); }, 1500);
  };

  // ─── keyboard ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowDown" && currentIdxRef.current < reelsRef.current.length - 1)
        scrollToIndex(currentIdxRef.current + 1);
      if (e.key === "ArrowUp" && currentIdxRef.current > 0)
        scrollToIndex(currentIdxRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scrollToIndex]);

  // ─── empty state ─────────────────────────────────────────────────────────────
  if (!loading && reels.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff", gap: "16px" }}>
        <div style={{ fontSize: "52px" }}>🎬</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", margin: 0 }}>No Reels Yet</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>Upload product videos to see them here.</p>
        <button onClick={() => navigate("/our-store")} style={{ background: "#d4af37", color: "#000", border: "none", padding: "12px 28px", borderRadius: "50px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>
          Browse Products
        </button>
      </div>
    );
  }

  // ─── grid view ───────────────────────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <div style={{ minHeight: "100vh", background: "#000", paddingTop: "60px", paddingBottom: "16px" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "12px 16px", background: "rgba(0,0,0,0.97)", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={() => navigate(-1)} style={btn}><BsArrowLeft /></button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "16px" }}>Reels</span>
          <button onClick={() => setViewMode("fullscreen")} style={btn}><BsList /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px" }}>
          {reels.map((item, index) => {
            const ytId = getYtId(item.reelUrl);
            const isYt = !item.videos?.length && !!ytId;
            return (
            <div key={item._id} onClick={() => { setCurrentIndex(index); setViewMode("fullscreen"); }}
              style={{ aspectRatio: "9/16", overflow: "hidden", position: "relative", cursor: "pointer", background: "#111" }}>
              {isYt ? (
                <img
                  src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
              <video src={item.videos?.[0]?.url} muted loop playsInline preload="metadata"
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
              <div style={{ position: "absolute", bottom: 6, left: 8, right: 8 }}>
                <p style={{ color: "#fff", fontSize: "11px", fontWeight: 600, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                <p style={{ color: "#d4af37", fontSize: "12px", fontWeight: 700, margin: 0 }}>₹{item.price?.toLocaleString()}</p>
              </div>
              <div style={{ position: "absolute", top: 6, right: 6 }}>
                <BsPlay style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }} />
              </div>
            </div>
            );
          })}
        </div>
        {hasMore && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <button onClick={() => fetchReels(nextPage)} disabled={loading}
              style={{ background: "#d4af37", color: "#000", border: "none", padding: "10px 28px", borderRadius: "50px", fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── fullscreen view ─────────────────────────────────────────────────────────
  return (
    <>
      <Meta title="Shop Reels – Yashoda Fashion" description="Watch fashion reels and shop instantly." url="/reels" />

      <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999, display: "flex", justifyContent: "center" }}>
        <style>{`
          .rl-wrap  { width:100%; max-width:430px; height:100%; position:relative; }
          .rl-scroll{ height:100%; overflow-y:scroll; overflow-x:hidden;
                      scroll-snap-type:y mandatory; scrollbar-width:none; }
          .rl-scroll::-webkit-scrollbar { display:none }
          .rl-item  { height:100vh; height:100svh; scroll-snap-align:start;
                      position:relative; overflow:hidden; flex-shrink:0; }
          @keyframes heartPop {
            0%   { transform:translate(-50%,-50%) scale(0);   opacity:1 }
            40%  { transform:translate(-50%,-50%) scale(1.5); opacity:1 }
            100% { transform:translate(-50%,-50%) scale(1.1); opacity:0 }
          }
          @keyframes rl-spin { to { transform:rotate(360deg) } }
        `}</style>

        <div className="rl-wrap">

          {/* ── fixed header ─────────────────────────────────────────────── */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
            padding: "12px 16px",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <button onClick={() => navigate(-1)} style={btn}><BsArrowLeft /></button>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px", letterSpacing: 0.3 }}>Reels</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setViewMode("grid")} style={btn}><BsGrid /></button>
              <button onClick={() => setIsMuted(m => !m)} style={btn}>
                {isMuted ? <BsVolumeMute /> : <BsVolumeUp />}
              </button>
            </div>
          </div>

          {/* ── scroll container ─────────────────────────────────────────── */}
          <div ref={containerRef} className="rl-scroll" onScroll={handleScroll}>

            {reels.map((item, index) => {
              const likeState = likes[item._id] || { liked: false, count: 0 };
              const isActive  = index === currentIndex;
              const ytId      = getYtId(item.reelUrl);
              const isYt      = !item.videos?.length && !!ytId;
              return (
                <div key={item._id} className="rl-item" onClick={(e) => handleTap(e, item, index)}>

                  {/* ── YouTube reel ── */}
                  {isYt ? (
                    isActive ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&playsinline=1&rel=0&modestbranding=1`}
                        title={item.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: "100%", height: "100%", display: "block", border: "none" }}
                      />
                    ) : (
                      /* thumbnail when not active — stops playback without destroying DOM */
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    )
                  ) : (
                  /* ── uploaded video reel ── */
                  <video
                    ref={(el) => {
                      if (!el) return;
                      videoRefs.current[index] = el;
                      el.muted = isMutedRef.current;
                    }}
                    src={item.videos?.[0]?.url}
                    playsInline
                    loop={false}
                    preload={Math.abs(index - currentIndex) <= 1 ? "auto" : "metadata"}
                    onTimeUpdate={() => {
                      if (!isActive) return;
                      const v = videoRefs.current[index];
                      if (v?.duration) setProgress((v.currentTime / v.duration) * 100);
                    }}
                    onEnded={() => {
                      if (index < reels.length - 1) scrollToIndex(index + 1);
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  )}

                  {/* gradient overlay */}
                  <div style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.15) 100%)",
                  }} />

                  {/* progress bar — only for uploaded videos */}
                  {isActive && !isYt && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.18)", zIndex: 5, pointerEvents: "none" }}>
                      <div style={{ height: "100%", background: "#fff", width: `${progress}%`, transition: "width 0.15s linear" }} />
                    </div>
                  )}

                  {/* pause overlay — only for uploaded videos */}
                  {!isYt && paused && isActive && (
                    <div style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      background: "rgba(0,0,0,0.45)", borderRadius: "50%",
                      width: "72px", height: "72px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none",
                    }}>
                      <BsPlay style={{ color: "#fff", fontSize: "30px", marginLeft: "4px" }} />
                    </div>
                  )}

                  {/* double-tap heart */}
                  {heartAnim === item._id && (
                    <div style={{
                      position: "absolute", top: "50%", left: "50%",
                      pointerEvents: "none",
                      animation: "heartPop 0.85s ease forwards",
                      fontSize: "90px", lineHeight: 1,
                    }}>❤️</div>
                  )}

                  {/* ── right action strip ──────────────────────────────── */}
                  <div data-interactive style={{
                    position: "absolute", right: "12px", bottom: "150px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", zIndex: 10,
                  }}>
                    {/* product avatar */}
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.9)", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
                      <img src={item.images?.[0]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>

                    {/* like */}
                    <div onClick={(e) => handleLike(e, item._id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                        {likeState.liked
                          ? <BsHeartFill style={{ color: "#ff3b5c" }} />
                          : <BsHeart style={{ color: "#fff" }} />
                        }
                      </div>
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                        {likeState.count > 999 ? `${(likeState.count / 1000).toFixed(1)}k` : likeState.count}
                      </span>
                    </div>

                    {/* share */}
                    <div onClick={(e) => handleShareOpen(e, item)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                      <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                        <BsShare style={{ color: "#fff" }} />
                      </div>
                      <span style={{ color: "#fff", fontSize: "12px", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>Share</span>
                    </div>
                  </div>

                  {/* ── bottom info ─────────────────────────────────────── */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: "72px", padding: "16px 16px 36px", zIndex: 10 }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: "0 0 6px" }}>@yashodafashion</p>
                    <p style={{
                      color: "rgba(255,255,255,0.88)", fontSize: "14px", lineHeight: 1.5,
                      margin: "0 0 12px",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {item.title}
                    </p>

                    {/* shop card */}
                    <div
                      data-interactive
                      onClick={(e) => { e.stopPropagation(); navigate(productUrl(item)); }}
                      style={{
                        background: "rgba(255,255,255,0.1)", backdropFilter: "blur(14px)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        borderRadius: "14px", padding: "10px 12px",
                        display: "flex", alignItems: "center", gap: "10px", cursor: "pointer",
                      }}
                    >
                      <div style={{ width: "42px", height: "42px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                        <img src={item.images?.[0]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "#fff", fontSize: "12px", fontWeight: 600, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                        <p style={{ color: "#d4af37", fontSize: "14px", fontWeight: 700, margin: 0 }}>₹{item.price?.toLocaleString()}</p>
                      </div>
                      <div style={{ background: "#d4af37", color: "#000", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                        Shop
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}

            {/* loading spinner */}
            {loading && (
              <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
                <div style={{ width: "38px", height: "38px", border: "3px solid rgba(255,255,255,0.15)", borderTop: "3px solid #d4af37", borderRadius: "50%", animation: "rl-spin 0.8s linear infinite" }} />
              </div>
            )}
          </div>

          {/* ── share bottom sheet ───────────────────────────────────────── */}
          {shareItem && (
            <>
              <div data-interactive onClick={() => setShareItem(null)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50 }} />
              <div data-interactive style={{
                position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 51,
                background: "#1c1c1e", borderRadius: "20px 20px 0 0",
                padding: "20px 20px calc(env(safe-area-inset-bottom, 0px) + 28px)",
              }}>
                <div style={{ width: "36px", height: "4px", background: "rgba(255,255,255,0.18)", borderRadius: "2px", margin: "0 auto 20px" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: "17px" }}>Share</span>
                  <button onClick={() => setShareItem(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer" }}>
                    <BsX size={18} />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "10px", marginBottom: "18px" }}>
                  <img src={shareItem.images?.[0]?.url} alt="" style={{ width: "46px", height: "46px", borderRadius: "8px", objectFit: "cover" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareItem.title}</p>
                    <p style={{ color: "#d4af37", fontSize: "13px", fontWeight: 700, margin: 0 }}>₹{shareItem.price?.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={handleWhatsAppShare} style={{ flex: 1, background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button onClick={handleCopyLink} style={{ flex: 1, background: copyDone ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.1)", color: "#fff", border: "none", padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {copyDone ? "✓ Copied!" : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>Copy Link</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  );
};

const btn = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(8px)",
  border: "none",
  borderRadius: "50%",
  width: "38px",
  height: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#fff",
  fontSize: "17px",
};

export default Reels;
