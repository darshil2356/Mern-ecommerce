import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { getAllProducts } from "../features/products/productSlilce";
import { motion } from "framer-motion";
import { BsPlay, BsHeart, BsHeartFill, BsBag } from "react-icons/bs";
import axios from "axios";
import { base_url, getConfig } from "../utils/axiosConfig";

const getYtId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

const ShopTheLook = ({ navigate }) => {
  const dispatch = useDispatch();
  const videoRefs = useRef([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [likes, setLikes] = useState({});

  useEffect(() => {
    dispatch(getAllProducts());
  }, [dispatch]);

  const productState = useSelector((state) => state?.product?.product || []);

  const dynamicVideos = productState
    .filter((p) => {
      if (!p) return false;
      const hasUploadedVideo = Array.isArray(p.videos) && p.videos.length > 0 && p.videos[0]?.url;
      const hasYtReel = !!getYtId(p.reelUrl);
      return hasUploadedVideo || hasYtReel;
    })
    .map((p) => {
      const ytId = getYtId(p.reelUrl);
      const hasUploadedVideo = Array.isArray(p.videos) && p.videos.length > 0 && p.videos[0]?.url;
      return {
        src: hasUploadedVideo ? p.videos[0].url : null,
        ytId: hasUploadedVideo ? null : ytId,
        productId: p._id,
        name: p.title,
        price: p.price,
        image: p.images?.[0]?.url,
        reelLikes: p.reelLikes || 0,
      };
    });

  // Seed likes state when videos load
  useEffect(() => {
    if (!dynamicVideos.length) return;
    setLikes((prev) => {
      const next = { ...prev };
      dynamicVideos.forEach((v) => {
        if (!next[v.productId]) {
          next[v.productId] = { liked: false, count: v.reelLikes };
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dynamicVideos.length]);

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
      [productId]: { liked: !prev.liked, count: prev.liked ? prev.count - 1 : prev.count + 1 },
    }));
    try {
      const { data } = await axios.put(
        `${base_url}product/reels/${productId}/like`,
        {},
        getConfig()
      );
      setLikes((s) => ({ ...s, [productId]: { liked: data.liked, count: data.reelLikes } }));
    } catch {
      setLikes((s) => ({ ...s, [productId]: prev }));
    }
  };

  // Auto-cycle active video
  useEffect(() => {
    if (!dynamicVideos.length) return;
    const interval = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % dynamicVideos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [dynamicVideos.length]);

  useEffect(() => {
    if (!dynamicVideos.length) return;
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      try {
        if (index === activeVideo) {
          video.muted = true;
          video.currentTime = 0;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      } catch (e) {}
    });
  }, [activeVideo, dynamicVideos.length]);

  if (dynamicVideos.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Scroll Container */}
      <div
        className="shop-the-look-container d-flex gap-4 overflow-auto pb-4"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '16px'
        }}
      >
        {dynamicVideos.map((item, index) => {
          const likeState = likes[item.productId] || { liked: false, count: item.reelLikes };
          return (
            <motion.div
              key={`${item.productId}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.1, 0.3) }}
              className="shop-the-look-item"
              style={{
                minWidth: '280px',
                aspectRatio: '9/16',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                boxShadow: index === activeVideo
                  ? '0 20px 50px rgba(212, 175, 55, 0.3)'
                  : '0 8px 30px rgba(0,0,0,0.2)',
                transform: index === activeVideo ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.4s ease'
              }}
              onClick={() => navigate(`/product/${item.productId}`)}
            >
              {/* Video / YouTube */}
              {item.ytId ? (
                index === activeVideo ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${item.ytId}?autoplay=1&mute=1&loop=1&playlist=${item.ytId}&playsinline=1&controls=0&rel=0`}
                    title={item.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    style={{ width: "100%", height: "100%", display: "block", border: "none" }}
                  />
                ) : (
                  <img
                    src={`https://img.youtube.com/vi/${item.ytId}/hqdefault.jpg`}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )
              ) : (
                <video
                  ref={(el) => {
                    videoRefs.current[index] = el;
                    if (el) el.muted = true;
                  }}
                  src={item.src}
                  loop
                  playsInline
                  preload="auto"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.5s ease'
                  }}
                />
              )}

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 60%, rgba(0,0,0,0.5) 100%)',
                pointerEvents: 'none'
              }} />

              {/* Play Icon (if not active) */}
              {index !== activeVideo && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '24px'
                }}>
                  <BsPlay />
                </div>
              )}

              {/* Active Indicator */}
              {index === activeVideo && (
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: '#d4af37',
                  color: '#1a1a1a',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    background: '#1a1a1a',
                    borderRadius: '50%'
                  }} />
                  Playing
                </div>
              )}

              {/* Product Info */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div>
                  <h4 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '18px',
                    color: '#ffffff',
                    marginBottom: '6px',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.name}
                  </h4>
                  <p style={{
                    color: '#d4af37',
                    fontSize: '20px',
                    fontWeight: 700,
                    margin: 0
                  }}>
                    ₹{item.price?.toLocaleString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/product/${item.productId}`);
                    }}
                    style={{
                      flex: 1,
                      background: '#d4af37',
                      color: '#1a1a1a',
                      border: 'none',
                      borderRadius: '30px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <BsBag /> Shop Now
                  </button>
                </div>
              </div>

              {/* Side Stats — Like Button */}
              <div style={{
                position: 'absolute',
                right: '12px',
                bottom: '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div
                  data-interactive="true"
                  onClick={(e) => handleLike(e, item.productId)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: likeState.liked ? '#ff4d6d' : '#fff',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  {likeState.liked
                    ? <BsHeartFill style={{ fontSize: '22px', color: '#ff4d6d' }} />
                    : <BsHeart style={{ fontSize: '22px' }} />
                  }
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>{likeState.count}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View All Button */}
      {dynamicVideos.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={() => navigate('/reels')}
            style={{
              background: 'transparent',
              color: '#d4af37',
              border: '2px solid #d4af37',
              borderRadius: '30px',
              padding: '14px 36px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#d4af37';
              e.target.style.color = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#d4af37';
            }}
          >
            View All Reels
          </button>
        </div>
      )}

      <style jsx>{`
        .d-flex.gap-4.overflow-auto::-webkit-scrollbar {
          display: none;
        }

        @media (min-width: 768px) {
          .shop-the-look-container {
            height: 400px !important;
          }

          .shop-the-look-item {
            height: 400px !important;
            width: 300px !important;
            min-width: 300px !important;
          }

          .shop-the-look-item video {
            object-fit: cover !important;
          }

          .shop-the-look-item h4 {
            font-size: 14px !important;
          }

          .shop-the-look-item p {
            font-size: 16px !important;
          }

          .shop-the-look-item button {
            padding: 8px 12px !important;
            font-size: 11px !important;
          }

          .shop-the-look-item div[style*="position: absolute"][style*="bottom: 0"] {
            padding: 12px !important;
            gap: 8px !important;
          }

          .shop-the-look-item div[style*="position: absolute"][style*="right: 12px"] {
            bottom: 100px !important;
          }
        }

        @media (max-width: 767px) {
          .shop-the-look-item {
            min-width: 280px !important;
          }

          .shop-the-look-item h4 {
            font-size: 18px !important;
          }

          .shop-the-look-item p {
            font-size: 20px !important;
          }

          .shop-the-look-item button {
            padding: 12px 20px !important;
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ShopTheLook;
