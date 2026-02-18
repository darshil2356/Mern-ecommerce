import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "../features/products/productSlilce";
import { AiFillHeart, AiOutlineHeart, AiOutlineEye } from "react-icons/ai";
import { motion } from "framer-motion";

const ProductCard = (props) => {
  const navigate = useNavigate();
  const { grid, data } = props;
  const dispatch = useDispatch();
  const location = useLocation();
  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);
  const [wishlist, setWishlist] = useState([]);
  const [autoPlayIndexes, setAutoPlayIndexes] = useState([]);

  useEffect(() => {
    if (data?.length > 0) {
      const shuffled = [...data.keys()].sort(() => 0.5 - Math.random());
      const randomCount = Math.floor(data.length * 0.3);
      setAutoPlayIndexes(shuffled.slice(0, randomCount));
    }
  }, [data]);

  useEffect(() => {
    setWishlist(wishlistState || []);
  }, [wishlistState]);

  const isProductInWishlist = (productId) => {
    if (!wishlist || !productId) return false;
    return wishlist.some((item) => item && item._id === productId);
  };

  const addToWish = (productId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (!productId) return;
    
    // Check if already in wishlist
    const isAlreadyInWishlist = isProductInWishlist(productId);
    
    dispatch(addToWishlist(productId));
    
    // Optimistic UI update
    if (isAlreadyInWishlist) {
      const updatedWishlist = wishlist.filter((item) => item && item._id !== productId);
      setWishlist(updatedWishlist);
    } else {
      const product = data.find((item) => item && item._id === productId);
      if (product) {
        setWishlist([...wishlist, product]);
      }
    }
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <>
      {data.map((item, index) => {
        if (!item) return null;
        
        const isWishlist = isProductInWishlist(item._id);
        
        return (
          <motion.div
            key={item._id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.3) }}
            onClick={() => navigate("/product/" + item?._id)}
            style={{ 
              cursor: 'pointer',
              gridColumn: `span ${Math.min(grid, 12)}`
            }}
          >
            <div 
              className="product-card position-relative"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'all 0.3s ease',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                const card = e.currentTarget;
                if (card) {
                  card.style.transform = 'translateY(-8px)';
                  card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                const card = e.currentTarget;
                if (card) {
                  card.style.transform = 'translateY(0)';
                  card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                }
              }}
            >
              {/* Badges */}
              <div style={{ 
                position: 'absolute', 
                top: '12px', 
                left: '12px', 
                zIndex: 10, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px' 
              }}>
                {item?.tags === 'new' && (
                  <span style={{ 
                    background: '#1a1a1a', 
                    color: '#fff', 
                    padding: '6px 12px', 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    borderRadius: '4px'
                  }}>New</span>
                )}
                {item?.tags === 'sale' && (
                  <span style={{ 
                    background: '#ef4444', 
                    color: '#fff', 
                    padding: '6px 12px', 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    borderRadius: '4px'
                  }}>Sale</span>
                )}
              </div>

              {/* Wishlist Icon */}
              <div 
                className="wishlist-icon position-absolute"
                style={{ 
                  top: '12px', 
                  right: '12px', 
                  zIndex: 10,
                  background: '#fff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}
              >
                <button
                  className="border-0 bg-transparent"
                  onClick={(e) => addToWish(item?._id, e)}
                  style={{ padding: '8px', cursor: 'pointer', background: 'transparent' }}
                >
                  {isWishlist ? (
                    <AiFillHeart style={{ fontSize: '20px', color: '#ef4444' }} />
                  ) : (
                    <AiOutlineHeart style={{ fontSize: '20px', color: '#666' }} />
                  )}
                </button>
              </div>

              {/* Product Image */}
              <div 
                className="product-image"
                style={{
                  height: '280px',
                  overflow: 'hidden',
                  background: '#f5f5f5',
                  position: 'relative'
                }}
              >
                {item?.videos?.[0]?.url ? (
                  <video
                    src={item.videos[0].url}
                    muted
                    loop
                    playsInline
                    autoPlay={autoPlayIndexes.includes(index)}
                    preload="metadata"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: 'transform 0.5s ease'
                    }}
                  />
                ) : item?.images?.[0]?.url ? (
                  <>
                    <img
                      src={item.images[0].url}
                      alt={item?.title || "product"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: 'transform 0.5s ease'
                      }}
                    />
                    {item?.images?.[1]?.url && (
                      <img
                        src={item.images[1].url}
                        alt={item?.title || "product"}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        }}
                        className="hover-image"
                      />
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#f5f5f5",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: "14px",
                      color: "#999",
                    }}
                  >
                    No Media Available
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="product-details" style={{ padding: '20px' }}>
                {/* Brand */}
                <h6 
                  className="brand" 
                  style={{ 
                    color: '#d4af37', 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    marginBottom: '8px'
                  }}
                >
                  {item?.brand}
                </h6>

                {/* Title */}
                <h5 
                  className="product-title"
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '16px',
                    fontWeight: 500,
                    marginBottom: '12px',
                    color: '#1a1a1a',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {grid === 12 || grid === 6
                    ? item?.title
                    : item?.title?.length > 50
                      ? item.title.slice(0, 50) + "..."
                      : item?.title}
                </h5>

                {/* Inventory Indicators */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {item?.inventory?.online && item?.quantity > 0 && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '11px',
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontWeight: 500
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#166534' }}></span>
                      Online
                    </span>
                  )}
                  {item?.inventory?.offline && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '11px',
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontWeight: 500
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#92400e' }}></span>
                      In Store
                    </span>
                  )}
                  {item?.quantity <= 0 && (
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      fontSize: '11px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontWeight: 500
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#991b1b' }}></span>
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: '#1a1a1a' 
                  }}>
                    ₹{item?.price?.toLocaleString()}
                  </span>
                  {item?.priceOriginal && (
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#999',
                      textDecoration: 'line-through' 
                    }}>
                      ₹{item.priceOriginal?.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
};

export default ProductCard;

