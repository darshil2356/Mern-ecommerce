import React, { useEffect } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "../features/products/productSlilce";
import { getuserProductWishlist } from "../features/user/userSlice";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AiOutlineHeart, AiOutlineShoppingCart, AiOutlineEye } from "react-icons/ai";
import { IoIosClose } from "react-icons/io";
import { toast } from "react-toastify";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    getWishlistFromDb();
  }, []);

  const getWishlistFromDb = () => {
    dispatch(getuserProductWishlist());
  };

  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);

  const removeFromWishlist = (id) => {
    dispatch(addToWishlist(id));
    toast.info("Removed from wishlist");
    setTimeout(() => {
      dispatch(getuserProductWishlist());
    }, 300);
  };

  const addToCart = (product) => {
    toast.success("Added to cart");
  };

  return (
    <>
      <Meta title={"Wishlist"} />
      <BreadCrumb title="Wishlist" />
      
      {/* Hero Section */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '60px 0',
          marginTop: '-1px'
        }}
      >
        <Container>
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '3rem',
                color: '#fff',
                marginBottom: '10px'
              }}
            >
              My <span style={{ color: '#d4af37' }}>Wishlist</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '16px'
              }}
            >
              {wishlistState?.length || 0} items saved for later
            </motion.p>
          </div>
        </Container>
      </div>

      <Container class1="wishlist-wrapper py-5">
        {/* Empty State */}
        {(!wishlistState || wishlistState.length === 0) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-5"
          >
            <div 
              style={{
                width: '150px',
                height: '150px',
                margin: '0 auto 30px',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AiOutlineHeart style={{ fontSize: '60px', color: '#ccc' }} />
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '15px' }}>
              Your wishlist is empty
            </h3>
            <p style={{ color: '#666', marginBottom: '30px', maxWidth: '400px', margin: '0 auto 30px' }}>
              Save your favorite items to your wishlist and they'll appear here for easy access later.
            </p>
            <Link 
              to="/product"
              style={{
                background: '#d4af37',
                color: '#1a1a1a',
                padding: '14px 36px',
                borderRadius: '50px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              Continue Shopping
            </Link>
          </motion.div>
        )}

        {/* Wishlist Grid */}
        {wishlistState && wishlistState.length > 0 && (
          <>
            {/* Quick Actions */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <p style={{ marginBottom: 0, color: '#666' }}>
                Showing {wishlistState.length} {wishlistState.length === 1 ? 'item' : 'items'}
              </p>
              <Link 
                to="/product"
                style={{
                  color: '#d4af37',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                + Add More Items
              </Link>
            </div>

            <div className="row g-4">
              {wishlistState?.map((item, index) => (
                <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    style={{
                      background: '#fff',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                      height: '100%'
                    }}
                  >
                    {/* Image Section */}
                    <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                      {item?.images?.[0]?.url ? (
                        <img
                          src={item.images[0].url}
                          alt={item.title}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          className="product-image"
                        />
                      ) : (
                        <div 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <span style={{ color: '#999' }}>No Image</span>
                        </div>
                      )}
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromWishlist(item?._id)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '36px',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          transition: 'all 0.2s ease'
                        }}
                        title="Remove from wishlist"
                      >
                        <IoIosClose style={{ fontSize: '18px', color: '#666' }} />
                      </button>

                      {/* Badges */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                        {item?.tags === 'new' && (
                          <span style={{ 
                            background: '#1a1a1a', 
                            color: '#fff', 
                            padding: '6px 12px', 
                            fontSize: '10px', 
                            fontWeight: 600, 
                            borderRadius: '4px' 
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '20px' }}>
                      <h6 style={{ 
                        color: '#d4af37', 
                        fontSize: '12px', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        marginBottom: '8px' 
                      }}>
                        {item?.brand}
                      </h6>
                      <h5 
                        onClick={() => navigate("/product/" + item?._id)}
                        style={{ 
                          fontFamily: "'Playfair Display', serif", 
                          fontSize: '16px', 
                          marginBottom: '12px', 
                          lineHeight: 1.4,
                          cursor: 'pointer',
                          transition: 'color 0.2s ease'
                        }}
                        className="product-title"
                      >
                        {item?.title?.slice(0, 50)}
                        {item?.title?.length > 50 && '...'}
                      </h5>
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <p style={{ 
                          fontSize: '20px', 
                          fontWeight: 700, 
                          color: '#1a1a1a',
                          marginBottom: 0
                        }}>
                          ₹{item?.price?.toLocaleString()}
                        </p>
                        {item?.color && item?.color?.title && (
                          <div 
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: getColorSwatch(item.color),
                              border: '1px solid #ddd'
                            }}
                            title={getReadableColorName(item.color)}
                          />
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => addToCart(item)}
                          style={{
                            flex: 1,
                            background: '#d4af37',
                            color: '#1a1a1a',
                            border: 'none',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <AiOutlineShoppingCart /> Add to Cart
                        </button>
                        <button
                          onClick={() => navigate("/product/" + item?._id)}
                          style={{
                            background: 'transparent',
                            color: '#1a1a1a',
                            border: '1px solid #ddd',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          title="View Product"
                        >
                          <AiOutlineEye />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>

            {/* Share Wishlist Section */}
            <div 
              className="mt-5 p-4"
              style={{
                background: '#f9f9f9',
                borderRadius: '16px',
                textAlign: 'center'
              }}
            >
              <h5 style={{ marginBottom: '10px' }}>Share your wishlist</h5>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Share your favorite items with friends and family
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  style={{
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Copy Link
                </button>
                <Link 
                  to="/product"
                  style={{
                    background: 'transparent',
                    color: '#1a1a1a',
                    border: '1px solid #ddd',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: 500
                  }}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </Container>

      {/* Global Styles for hover effects */}
      <style>{`
        .product-image:hover {
          transform: scale(1.05);
        }
        .product-title:hover {
          color: #d4af37;
        }
      `}</style>
    </>
  );
};

export default Wishlist;
