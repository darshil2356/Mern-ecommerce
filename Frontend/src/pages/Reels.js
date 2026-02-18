import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { getAllProducts } from "../features/products/productSlilce";
import { BsHeart, BsShare, BsBag, BsArrowLeft, BsSoundwave, BsGrid, BsList, BsPlay } from "react-icons/bs";
import { motion } from "framer-motion";

const Reels = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const productState = useSelector((state) => state?.product?.product);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState('fullscreen');
  const [visibleReels, setVisibleReels] = useState(10);
  const videoRefs = useRef({});
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    dispatch(getAllProducts());
  }, [dispatch]);

  // Filter products with videos (with null check)
  const reelsData = (productState || []).filter(
    (p) => Array.isArray(p?.videos) && p.videos.length > 0 && p.videos[0]?.url
  );

  // Load more reels
  const loadMore = useCallback(() => {
    setVisibleReels(prev => Math.min(prev + 10, reelsData.length));
  }, [reelsData.length]);

  // Handle scroll to change current reel
  const handleScroll = useCallback((e) => {
    if (viewMode !== 'fullscreen' || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollTop = container.scrollTop;
    const reelHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / reelHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reelsData.length) {
      setCurrentIndex(newIndex);
    }
  }, [viewMode, currentIndex, reelsData.length]);

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState(null);
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientY);
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart || viewMode !== 'fullscreen') return;
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < reelsData.length - 1) {
        scrollToReel(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        scrollToReel(currentIndex - 1);
      }
    }
    setTouchStart(null);
  };

  const scrollToReel = (index) => {
    if (scrollContainerRef.current) {
      const reelHeight = scrollContainerRef.current.clientHeight;
      scrollContainerRef.current.scrollTo({
        top: index * reelHeight,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  // Navigate to product
  const handleShopNow = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Toggle play/pause for current video
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle video end - auto play next
  const handleVideoEnd = () => {
    if (currentIndex < reelsData.length - 1) {
      scrollToReel(currentIndex + 1);
    }
  };

  // Handle video ready - auto play
  const handleVideoReady = (index) => {
    const video = videoRefs.current[index];
    if (video && index === currentIndex && isPlaying) {
      video.play().catch(() => {});
    }
  };

  // Update video play/pause based on currentIndex
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const video = videoRefs.current[key];
      if (video) {
        if (parseInt(key) === currentIndex && isPlaying) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, isPlaying]);

  if (reelsData.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        flexDirection: 'column',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: '16px' }}>
            🎬 No Reels Yet
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', lineHeight: 1.6 }}>
            Products with videos will appear here as reels. Upload videos to your products!
          </p>
          <button
            onClick={() => navigate('/product')}
            style={{
              background: '#d4af37',
              color: '#000',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  // Fullscreen View - Instagram/TikTok style - FULL SCREEN
  if (viewMode === 'fullscreen') {
    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          zIndex: 9999,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '12px 16px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '18px'
            }}
          >
            <BsArrowLeft />
          </button>
          
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '18px',
            color: '#fff',
            margin: 0
          }}>
            🎬 Shop Reels
          </h3>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '16px'
              }}
              title="Grid View"
            >
              <BsGrid />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                fontSize: '16px'
              }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Scrollable Reels Container - FULL HEIGHT */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {reelsData.slice(0, visibleReels).map((item, index) => (
            <div
              key={`reel-${item._id}-${index}`}
              onClick={togglePlay}
              style={{
                height: '100vh',
                width: '100%',
                position: 'relative',
                scrollSnapAlign: 'start',
                cursor: 'pointer'
              }}
            >
              {/* Video - FULL SCREEN */}
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={item.videos?.[0]?.url}
                muted={isMuted}
                loop={false}
                playsInline
                preload="auto"
                onCanPlay={() => handleVideoReady(index)}
                onEnded={handleVideoEnd}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center'
                }}
              />

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 50%, rgba(0,0,0,0.4) 100%)',
                pointerEvents: 'none'
              }} />

              {/* Play/Pause Indicator */}
              {!isPlaying && index === currentIndex && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.5)',
                  borderRadius: '50%',
                  width: '70px',
                  height: '70px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '28px'
                }}>
                  <BsPlay />
                </div>
              )}

              {/* Right Side Actions */}
              <div style={{
                position: 'absolute',
                right: '12px',
                bottom: '100px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}>
                {/* Profile */}
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid #fff',
                  overflow: 'hidden'
                }}>
                  <img
                    src={item.images?.[0]?.url || "/images/placeholder.png"}
                    alt="profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Like */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    <BsHeart />
                  </div>
                  <span style={{ fontSize: '12px' }}>0</span>
                </div>

                {/* Share */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff' }}>
                  <div style={{ width: '44px', height: '44px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    <BsShare />
                  </div>
                  <span style={{ fontSize: '12px' }}>Share</span>
                </div>
              </div>

              {/* Bottom Content */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '16px',
                paddingBottom: '80px'
              }}>
                {/* Username */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>@voguecraft</span>
                  <span style={{ background: 'rgba(212, 175, 55, 0.8)', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>FOLLOW</span>
                </div>

                {/* Description */}
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: 1.4, marginBottom: '12px' }}>
                  {item.title}
                </p>

                {/* Product Card */}
                <div
                  onClick={(e) => { e.stopPropagation(); handleShopNow(item._id); }}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '10px',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={item.images?.[0]?.url || "/images/placeholder.png"} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ color: '#fff', fontSize: '13px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </h4>
                    <p style={{ color: '#d4af37', fontSize: '15px', fontWeight: 700, margin: 0 }}>₹{item.price?.toLocaleString()}</p>
                  </div>
                  <button style={{ background: '#d4af37', color: '#000', border: 'none', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    Shop
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation Dots */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '6px',
          zIndex: 10,
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '20px'
        }}>
          {reelsData.slice(0, Math.min(visibleReels, 5)).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToReel(index)}
              style={{
                width: index === currentIndex ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                border: 'none',
                background: index === currentIndex ? '#d4af37' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0
              }}
            />
          ))}
          {reelsData.length > 5 && (
            <span style={{ color: '#fff', fontSize: '11px', marginLeft: '4px' }}>+{reelsData.length}</span>
          )}
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#000',
        paddingTop: '70px',
        paddingBottom: '20px'
      }}
    >
      {/* Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '12px 16px',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <BsArrowLeft />
        </button>
        
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#fff', margin: 0 }}>
          🎬 All Reels ({reelsData.length})
        </h3>

        <button
          onClick={() => { setViewMode('fullscreen'); setCurrentIndex(0); }}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <BsList />
        </button>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '8px',
        padding: '8px'
      }}>
        {reelsData.slice(0, visibleReels).map((item, index) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { setCurrentIndex(index); setViewMode('fullscreen'); }}
            style={{
              aspectRatio: '9/16',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <video
              src={item.videos[0].url}
              muted
              loop
              playsInline
              preload="auto"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%)' }} />
            <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
              <p style={{ color: '#fff', fontSize: '12px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</p>
              <p style={{ color: '#d4af37', fontSize: '14px', fontWeight: 700 }}>₹{item.price?.toLocaleString()}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {visibleReels < reelsData.length && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button onClick={loadMore} style={{ background: '#d4af37', color: '#000', border: 'none', padding: '12px 30px', borderRadius: '50px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Load More ({reelsData.length - visibleReels})
          </button>
        </div>
      )}
    </div>
  );
};

export default Reels;

