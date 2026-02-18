import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { getAllProducts } from "../features/products/productSlilce";
import { motion } from "framer-motion";
import { BsPlay, BsHeart, BsBag } from "react-icons/bs";

const ShopTheLook = ({ navigate }) => {
  const dispatch = useDispatch();
  const videoRefs = useRef([]);
  const [activeVideo, setActiveVideo] = useState(0);

  useEffect(() => {
    dispatch(getAllProducts());
  }, [dispatch]);

  const productState = useSelector((state) => state?.product?.product || []);

  // Build video list from products with videos
  const dynamicVideos = productState
    .filter(
      (p) =>
        p &&
        Array.isArray(p?.videos) &&
        p.videos.length > 0 &&
        p.videos[0]?.url
    )
    .map((p) => ({
      src: p.videos[0].url,
      productId: p._id,
      name: p.title,
      price: p.price,
      image: p.images?.[0]?.url
    }));

  // Auto-play management - handle Promise rejections
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
          video.currentTime = 0;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Ignore play interruption errors
            });
          }
        } else {
          video.pause();
        }
      } catch (e) {
        // Ignore errors
      }
    });
  }, [activeVideo, dynamicVideos.length]);

  if (dynamicVideos.length === 0) {
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Scroll Container */}
      <div 
        className="d-flex gap-4 overflow-auto pb-4"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          paddingBottom: '16px'
        }}
      >
        {dynamicVideos.map((item, index) => (
          <motion.div
            key={`${item.productId}-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: Math.min(index * 0.1, 0.3) }}
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
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={item.src}
              muted
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

            {/* Side Stats */}
            <div style={{
              position: 'absolute',
              right: '12px',
              bottom: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#fff',
                gap: '4px'
              }}>
                <BsHeart style={{ fontSize: '22px' }} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>0</span>
              </div>
            </div>
          </motion.div>
        ))}
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
      `}</style>
    </div>
  );
};

export default ShopTheLook;

