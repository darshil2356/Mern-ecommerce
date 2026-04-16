import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Meta from "../components/Meta";
import axios from "axios";
import { base_url, getConfig } from "../utils/axiosConfig";
import { productUrl } from "../utils/seoUrl";
import {
  BsHeart,
  BsHeartFill,
  BsShare,
  BsArrowLeft,
  BsPlay,
  BsGrid,
  BsList,
  BsX,
} from "react-icons/bs";

const LIMIT = 10;

const Reels = () => {
  const navigate = useNavigate();
  const [reels, setReels] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // start muted so autoplay works
  const [viewMode, setViewMode] = useState("fullscreen");
  const [likes, setLikes] = useState({});
  const [shareItem, setShareItem] = useState(null); // item to share — shows bottom sheet
  const [copyDone, setCopyDone] = useState(false);
  const videoRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const loadingRef = useRef(false);
  const observerRef = useRef(null);

  const fetchReels = useCallback(async (cursor = null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = { limit: LIMIT };
      if (cursor) params.cursor = cursor;
      const cfg = getConfig();
      const { data } = await axios.get(`${base_url}product/reels`, {
        params,
        headers: cfg.headers,
      });
      setReels((prev) => (cursor ? [...prev, ...data.reels] : data.reels));
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
      setLikes((prev) => {
        const map = { ...prev };
        data.reels.forEach((r) => {
          if (!map[r._id])
            map[r._id] = { liked: r.liked || false, count: r.reelLikes || 0 };
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

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // ── IntersectionObserver: autoplay whichever reel is in view ─────────────────
  useEffect(() => {
    if (viewMode !== "fullscreen") return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const idx = parseInt(video.dataset.index, 10);
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setCurrentIndex(idx);
            setIsPlaying(true);
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 },
    );

    // Observe all current video elements
    Object.values(videoRefs.current).forEach((v) => {
      if (v) observerRef.current.observe(v);
    });

    return () => observerRef.current?.disconnect();
  }, [reels, viewMode]);

  // Auto-load more when near end
  useEffect(() => {
    if (currentIndex >= reels.length - 3 && hasMore && !loading) {
      fetchReels(nextCursor);
    }
  }, [currentIndex, reels.length, hasMore, loading, nextCursor, fetchReels]);

  // Sync play/pause state changes (tap to pause/resume)
  useEffect(() => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;
    if (isPlaying) video.play().catch(() => {});
    else video.pause();
  }, [isPlaying, currentIndex]);

  const scrollToReel = useCallback((index) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: index * scrollContainerRef.current.clientHeight,
      behavior: "smooth",
    });
    setCurrentIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || viewMode !== "fullscreen") return;
    const { scrollTop, clientHeight } = scrollContainerRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  }, [viewMode, currentIndex]);

  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => {
    // Don't track touches that start on interactive elements
    if (e.target.closest("button, a, [data-interactive]")) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    // Only treat as vertical swipe if mostly vertical and large enough
    if (Math.abs(dy) > 60 && Math.abs(dy) > dx * 1.5) {
      if (dy > 0 && currentIndex < reels.length - 1)
        scrollToReel(currentIndex + 1);
      else if (dy < 0 && currentIndex > 0) scrollToReel(currentIndex - 1);
    }
    touchStartY.current = null;
    touchStartX.current = null;
  };

  useEffect(() => {
    if (viewMode !== "fullscreen") return;
    const onKey = (e) => {
      if (e.key === "ArrowDown" && currentIndex < reels.length - 1)
        scrollToReel(currentIndex + 1);
      if (e.key === "ArrowUp" && currentIndex > 0)
        scrollToReel(currentIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewMode, currentIndex, reels.length, scrollToReel]);

  const handleLike = async (e, productId) => {
    e.stopPropagation();
    const customer = localStorage.getItem("customer")
      ? JSON.parse(localStorage.getItem("customer"))
      : null;
    if (!customer?.token) {
      navigate("/login");
      return;
    }

    const prev = likes[productId] || { liked: false, count: 0 };
    setLikes((s) => ({
      ...s,
      [productId]: {
        liked: !prev.liked,
        count: prev.liked ? prev.count - 1 : prev.count + 1,
      },
    }));

    try {
      const { data } = await axios.put(
        `${base_url}product/reels/${productId}/like`,
        {},
        getConfig(),
      );
      setLikes((s) => ({
        ...s,
        [productId]: { liked: data.liked, count: data.reelLikes },
      }));
    } catch {
      setLikes((s) => ({ ...s, [productId]: prev }));
    }
  };

  // Opens share bottom sheet — does NOT touch video playback
  const handleShareOpen = (e, item) => {
    e.stopPropagation();
    setShareItem(item);
  };

  const handleWhatsAppShare = () => {
    if (!shareItem) return;
    const url = `${window.location.origin}${productUrl(shareItem)}`;
    const text = encodeURIComponent(
      `Check out ${shareItem.title} - ₹${shareItem.price?.toLocaleString()}\n${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShareItem(null);
  };

  const handleCopyLink = () => {
    if (!shareItem) return;
    const url = `${window.location.origin}${productUrl(shareItem)}`;
    const el = document.createElement("textarea");
    el.value = url;
    el.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
    } catch {}
    document.body.removeChild(el);
    setCopyDone(true);
    setTimeout(() => {
      setCopyDone(false);
      setShareItem(null);
    }, 1500);
  };

  if (!loading && reels.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          color: "#fff",
          flexDirection: "column",
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2rem",
            marginBottom: "16px",
          }}
        >
          🎬 No Reels Yet
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "24px" }}>
          Upload videos to products to see them here.
        </p>
        <button
          onClick={() => navigate("/our-store")}
          style={{
            background: "#d4af37",
            color: "#000",
            border: "none",
            padding: "14px 32px",
            borderRadius: "50px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Browse Products
        </button>
      </div>
    );
  }

  // ── Grid View ─────────────────────────────────────────────────────────────────
  if (viewMode === "grid") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#000",
          paddingTop: "70px",
          paddingBottom: "20px",
        }}
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            padding: "12px 16px",
            background: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button onClick={() => navigate(-1)} style={iconBtn}>
            <BsArrowLeft />
          </button>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "18px",
              color: "#fff",
              margin: 0,
            }}
          >
            🎬 All Reels ({reels.length})
          </h3>
          <button
            onClick={() => {
              setViewMode("fullscreen");
              setCurrentIndex(0);
            }}
            style={iconBtn}
          >
            <BsList />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: "8px",
            padding: "8px",
          }}
        >
          {reels.map((item, index) => (
            <div
              key={item._id}
              onClick={() => {
                setCurrentIndex(index);
                setViewMode("fullscreen");
              }}
              style={{
                aspectRatio: "9/16",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <video
                src={item.videos[0].url}
                muted
                loop
                playsInline
                preload="metadata"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)",
                }}
              />
              <div
                style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}
              >
                <p
                  style={{
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    color: "#d4af37",
                    fontSize: "14px",
                    fontWeight: 700,
                    margin: 0,
                  }}
                >
                  ₹{item.price?.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <button
              onClick={() => fetchReels(nextCursor)}
              disabled={loading}
              style={{
                background: "#d4af37",
                color: "#000",
                border: "none",
                padding: "12px 30px",
                borderRadius: "50px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Fullscreen View ───────────────────────────────────────────────────────────
  return (
    <>
      <Meta
        title="Shop Reels – Video Shopping"
        description="Watch fashion reels and shop the look instantly at Yashoda Fashion. Discover trending outfits through short videos."
        keywords="fashion reels, video shopping, shop the look, trending fashion India, Yashoda Fashion reels"
        url="/reels"
      />
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "#000",
        zIndex: 9999,
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`.reels-scroll::-webkit-scrollbar{display:none} @media(min-width:768px){.reels-inner{width:30%!important}}`}</style>
      <div
        className="reels-inner"
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {/* Header */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: "12px 16px",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button onClick={() => navigate(-1)} style={iconBtn}>
            <BsArrowLeft />
          </button>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "18px",
              color: "#fff",
              margin: 0,
            }}
          >
            🎬 Shop Reels
          </h3>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setViewMode("grid")} style={iconBtn}>
              <BsGrid />
            </button>
            <button onClick={() => setIsMuted((m) => !m)} style={iconBtn}>
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>
        </div>

        {/* Scrollable Reels */}
        <div
          ref={scrollContainerRef}
          className="reels-scroll"
          onScroll={handleScroll}
          style={{
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
          }}
        >
          {reels.map((item, index) => {
            const likeState = likes[item._id] || {
              liked: item.liked || false,
              count: item.reelLikes || 0,
            };
            return (
              <div
                key={item._id}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                style={{
                  height: "100vh",
                  width: "100%",
                  position: "relative",
                  scrollSnapAlign: "start",
                }}
              >
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                    if (el) {
                      el.dataset.index = index;
                      if (observerRef.current) observerRef.current.observe(el);
                    }
                  }}
                  src={item.videos?.[0]?.url}
                  muted={isMuted}
                  loop={false}
                  playsInline
                  preload={
                    Math.abs(index - currentIndex) <= 1 ? "auto" : "metadata"
                  }
                  onEnded={() => {
                    if (currentIndex < reels.length - 1)
                      scrollToReel(currentIndex + 1);
                  }}
                  onClick={() => setIsPlaying((p) => !p)}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    cursor: "pointer",
                    display: "block",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.3) 100%)",
                    pointerEvents: "none",
                  }}
                />

                {!isPlaying && index === currentIndex && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      background: "rgba(0,0,0,0.5)",
                      borderRadius: "50%",
                      width: "70px",
                      height: "70px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "28px",
                      pointerEvents: "none",
                    }}
                  >
                    <BsPlay />
                  </div>
                )}

                {/* Right side actions */}
                <div
                  data-interactive
                  style={{
                    position: "absolute",
                    right: "12px",
                    bottom: "120px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      border: "2px solid #fff",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={item.images?.[0]?.url || "/images/placeholder.png"}
                      alt="profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  {/* Like */}
                  <div
                    onClick={(e) => handleLike(e, item._id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                      }}
                    >
                      {likeState.liked ? (
                        <BsHeartFill style={{ color: "#ff4d6d" }} />
                      ) : (
                        <BsHeart />
                      )}
                    </div>
                    <span style={{ fontSize: "12px" }}>
                      {likeState.count > 999
                        ? `${(likeState.count / 1000).toFixed(1)}k`
                        : likeState.count}
                    </span>
                  </div>

                  {/* Share — opens bottom sheet, does NOT affect video */}
                  <div
                    onClick={(e) => handleShareOpen(e, item)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                      }}
                    >
                      <BsShare />
                    </div>
                    <span style={{ fontSize: "12px" }}>Share</span>
                  </div>
                </div>

                {/* Bottom content */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "16px",
                    paddingBottom: "30px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#fff",
                        fontSize: "15px",
                      }}
                    >
                      @yashodafashion
                    </span>
                    <span
                      style={{
                        background: "rgba(212,175,55,0.8)",
                        color: "#000",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}
                    >
                      FOLLOW
                    </span>
                  </div>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "14px",
                      lineHeight: 1.4,
                      marginBottom: "12px",
                    }}
                  >
                    {item.title}
                  </p>

                  <div
                    data-interactive
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(productUrl(item));
                    }}
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "10px",
                      padding: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "6px",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={item.images?.[0]?.url || "/images/placeholder.png"}
                        alt="product"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          marginBottom: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          color: "#d4af37",
                          fontSize: "15px",
                          fontWeight: 700,
                          margin: 0,
                        }}
                      >
                        ₹{item.price?.toLocaleString()}
                      </p>
                    </div>
                    <button
                      style={{
                        background: "#d4af37",
                        color: "#000",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Shop
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                height: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid rgba(255,255,255,0.2)",
                  borderTop: "3px solid #d4af37",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}
        </div>

        {/* ── Share Bottom Sheet ─────────────────────────────────────────────── */}
        {shareItem && (
          <>
            {/* Backdrop */}
            <div
              data-interactive
              onClick={() => setShareItem(null)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 50,
              }}
            />
            {/* Sheet */}
            <div
              data-interactive
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 51,
                background: "#1a1a1a",
                borderRadius: "20px 20px 0 0",
                padding: "20px 20px 36px",
              }}
            >
              {/* Handle */}
              <div
                style={{
                  width: "40px",
                  height: "4px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "2px",
                  margin: "0 auto 16px",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{ color: "#fff", fontWeight: 600, fontSize: "16px" }}
                >
                  Share
                </span>
                <button
                  onClick={() => setShareItem(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <BsX />
                </button>
              </div>

              {/* Product preview */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  padding: "10px",
                  marginBottom: "20px",
                }}
              >
                <img
                  src={shareItem.images?.[0]?.url || "/images/placeholder.png"}
                  alt=""
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: "13px",
                      fontWeight: 600,
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {shareItem.title}
                  </p>
                  <p
                    style={{
                      color: "#d4af37",
                      fontSize: "13px",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    ₹{shareItem.price?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Share buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  style={{
                    flex: 1,
                    background:
                      "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                    color: "#fff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  style={{
                    flex: 1,
                    background: copyDone
                      ? "linear-gradient(135deg, #22c55e, #16a34a)"
                      : "rgba(255,255,255,0.12)",
                    color: "#fff",
                    border: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background 0.3s",
                  }}
                >
                  {copyDone ? (
                    "✓ Copied!"
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      Copy Link
                    </>
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

const iconBtn = {
  background: "rgba(255,255,255,0.2)",
  border: "none",
  borderRadius: "50%",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "#fff",
  fontSize: "18px",
};

export default Reels;
