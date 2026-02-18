import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Marquee from "react-fast-marquee";
import BlogCard from "../components/BlogCard";
import Container from "../components/Container";
import { services } from "../utils/Data";
import { useDispatch, useSelector } from "react-redux";
import { getAllBlogs } from "../features/blogs/blogSlice";
import { getAllProducts, addToWishlist } from "../features/products/productSlilce";
import ShopTheLook from "../components/ShopTheLook";
import { motion } from "framer-motion";
import { BsArrowRight, BsPlay } from "react-icons/bs";

const Home = () => {
  const blogState = useSelector((state) => state?.blog?.blog);
  const productState = useSelector((state) => state?.product?.product);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllBlogs());
    dispatch(getAllProducts());
  }, [dispatch]);

  const addToWish = (id) => {
    dispatch(addToWishlist(id));
  };

  // Filter products by tags (with null checks)
  const featuredProducts = (productState || []).filter(item => item?.tags === "featured");
  const specialProducts = (productState || []).filter(item => item?.tags === "special");
  const popularProducts = (productState || []).filter(item => item?.tags === "popular");
  const newArrivals = (productState || []).filter(item => item?.tags === "new");

  // Categories for the category section
  const categories = [...new Set((productState || []).map(p => p.category))].filter(Boolean).slice(0, 6);

  return (
    <>
      {/* Hero Section */}
      <div 
        className="hero-section"
        style={{
          position: 'relative',
          height: '85vh',
          minHeight: '600px',
          overflow: 'hidden',
          background: '#1a1a1a'
        }}
      >
        {/* Background Image with Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(images/main-banner.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.4
        }} />
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(26,26,26,0.3) 100%)'
        }} />

        {/* Content */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Container class1="">
            <div className="row align-items-center">
              <div className="col-12 col-lg-7">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span style={{
                    display: 'inline-block',
                    background: '#d4af37',
                    color: '#1a1a1a',
                    padding: '8px 20px',
                    borderRadius: '30px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    marginBottom: '20px'
                  }}>
                    New Collection 2024
                  </span>
                  
                  <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.1,
                    marginBottom: '20px'
                  }}>
                    Discover Your <br />
                    <span style={{ color: '#d4af37' }}>Style</span> Statement
                  </h1>
                  
                  <p style={{
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.8)',
                    maxWidth: '500px',
                    marginBottom: '30px',
                    lineHeight: 1.7
                  }}>
                    Explore our premium collection of contemporary fashion. 
                    Shop directly through engaging video reels and discover 
                    your perfect look.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate('/product')}
                      style={{
                        background: '#d4af37',
                        color: '#1a1a1a',
                        border: 'none',
                        padding: '16px 36px',
                        borderRadius: '50px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Shop Now <BsArrowRight />
                    </button>
                    
                    <button
                      onClick={() => navigate('/reels')}
                      style={{
                        background: 'transparent',
                        color: '#fff',
                        border: '2px solid rgba(255,255,255,0.3)',
                        padding: '14px 34px',
                        borderRadius: '50px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <BsPlay /> Watch Reels
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Services Section */}
      <Container class1="home-wrapper-2 py-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-4">
              {services?.map((i, j) => {
                return (
                  <div 
                    key={j} 
                    className="d-flex align-items-center gap-3"
                    style={{
                      padding: '16px 24px',
                      background: '#fff',
                      borderRadius: '12px',
                      boxShadow: '0 2px 15px rgba(0,0,0,0.05)'
                    }}
                  >
                    <img 
                      src={i.image} 
                      alt={i.title} 
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }} 
                    />
                    <div>
                      <h6 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>{i.title}</h6>
                      <p className="mb-0" style={{ fontSize: '12px', color: '#999' }}>{i.tagline}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>

      {/* Shop The Look / Reels Section */}
      <Container class1="py-5">
        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '2rem',
              marginBottom: 0
            }}>
              🎬 Shop The Look
            </h2>
            <Link 
              to="/reels" 
              style={{
                color: '#d4af37',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              View All Reels <BsArrowRight />
            </Link>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <ShopTheLook navigate={navigate} />
          </div>
        </div>
      </Container>

      {/* Categories Section */}
      {categories.length > 0 && (
        <Container class1="home-wrapper-2 py-5">
          <div className="row mb-4">
            <div className="col-12">
              <h2 style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '2rem'
              }}>
                Shop by Category
              </h2>
            </div>
          </div>
          <div className="row g-4">
            {categories.slice(0, 6).map((category, index) => (
              <div key={index} className="col-6 col-lg-4">
                <motion.div
                  whileHover={{ y: -8 }}
                  onClick={() => navigate('/product')}
                  style={{
                    position: 'relative',
                    height: '200px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(45deg, #${['1a1a1a', '2d2d2d', '3d3d3d', '4a4a4a', '5a5a5a', '6a6a6a'][index % 6]}, #666)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      color: '#fff',
                      fontSize: '1.5rem',
                      textTransform: 'capitalize'
                    }}>
                      {category}
                    </h3>
                  </div>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.2)'
                  }} />
                </motion.div>
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Featured Products */}
      <Container class1="featured-wrapper py-5">
        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '2rem',
              marginBottom: 0
            }}>
              Featured Products
            </h2>
            <Link 
              to="/product" 
              style={{
                color: '#d4af37',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              View All <BsArrowRight />
            </Link>
          </div>
        </div>
        <div className="row g-4">
          {featuredProducts.slice(0, 4).map((item, index) => (
            <div key={index} className="col-12 col-sm-6 col-lg-3">
              <motion.div
                whileHover={{ y: -8 }}
                onClick={() => navigate("/product/" + item?._id)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                  {item?.images?.[0]?.url ? (
                    <img
                      src={item.images[0].url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }} />
                  )}
                  
                  {/* Badges */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                    {item?.tags === 'new' && (
                      <span style={{ background: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '10px', fontWeight: 600, borderRadius: '4px' }}>
                        NEW
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{ padding: '20px' }}>
                  <h6 style={{ color: '#d4af37', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                    {item?.brand}
                  </h6>
                  <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', marginBottom: '12px', lineHeight: 1.4 }}>
                    {item?.title?.slice(0, 50)}...
                  </h5>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
                    ₹{item?.price?.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
        
        {featuredProducts.length === 0 && (
          <div className="text-center py-5">
            <p style={{ color: '#999' }}>No featured products available</p>
          </div>
        )}
      </Container>

      {/* Special Products */}
      <Container class1="special-wrapper home-wrapper-2 py-5">
        <div className="row mb-4">
          <div className="col-12">
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '2rem'
            }}>
              Special Offers
            </h2>
          </div>
        </div>
        <div className="row g-4">
          {specialProducts.slice(0, 4).map((item, index) => (
            <div key={index} className="col-12 col-sm-6 col-lg-3">
              <motion.div
                whileHover={{ y: -8 }}
                onClick={() => navigate("/product/" + item?._id)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                  {item?.images?.[0]?.url ? (
                    <img
                      src={item.images[0].url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }} />
                  )}
                  <span style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    right: '12px',
                    background: '#ef4444', 
                    color: '#fff', 
                    padding: '6px 12px', 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    borderRadius: '4px' 
                  }}>
                    SALE
                  </span>
                </div>
                <div style={{ padding: '20px' }}>
                  <h6 style={{ color: '#d4af37', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                    {item?.brand}
                  </h6>
                  <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', marginBottom: '12px', lineHeight: 1.4 }}>
                    {item?.title?.slice(0, 50)}...
                  </h5>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
                    ₹{item?.price?.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </Container>

      {/* Popular Products */}
      <Container class1="popular-wrapper py-5">
        <div className="row mb-4">
          <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <h2 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '2rem',
              marginBottom: 0
            }}>
              Popular Products
            </h2>
            <Link 
              to="/product" 
              style={{
                color: '#d4af37',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              View All <BsArrowRight />
            </Link>
          </div>
        </div>
        <div className="row g-4">
          {popularProducts.slice(0, 4).map((item, index) => (
            <div key={index} className="col-12 col-sm-6 col-lg-3">
              <motion.div
                whileHover={{ y: -8 }}
                onClick={() => navigate("/product/" + item?._id)}
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  height: '100%'
                }}
              >
                <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                  {item?.images?.[0]?.url ? (
                    <img
                      src={item.images[0].url}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }} />
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  <h6 style={{ color: '#d4af37', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
                    {item?.brand}
                  </h6>
                  <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', marginBottom: '12px', lineHeight: 1.4 }}>
                    {item?.title?.slice(0, 50)}...
                  </h5>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>
                    ₹{item?.price?.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </Container>

      {/* Blogs Section */}
      {blogState && blogState.length > 0 && (
        <Container class1="blog-wrapper home-wrapper-2 py-5">
          <div className="row mb-4">
            <div className="col-12">
              <h2 style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '2rem'
              }}>
                Latest Blogs
              </h2>
            </div>
          </div>
          <div className="row g-4">
            {(blogState || []).slice(0, 4).map((item, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-3">
                <BlogCard
                  id={item?._id}
                  title={item?.title}
                  description={item?.description}
                  image={item?.images?.[0]?.url || "/images/placeholder.png"}
                  date={new Date(item?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                />
              </div>
            ))}
          </div>
        </Container>
      )}

      {/* Newsletter Section */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          padding: '80px 20px',
          textAlign: 'center'
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '2.5rem',
              color: '#fff',
              marginBottom: '16px'
            }}>
              Stay in Style
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              marginBottom: '30px',
              maxWidth: '500px',
              margin: '0 auto 30px'
            }}>
              Subscribe to our newsletter for exclusive offers, new arrivals, and style inspiration.
            </p>
            <div style={{ 
              display: 'flex', 
              maxWidth: '500px', 
              margin: '0 auto',
              gap: '12px'
            }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: '50px',
                  border: 'none',
                  fontSize: '16px'
                }}
              />
              <button
                style={{
                  background: '#d4af37',
                  color: '#1a1a1a',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                Subscribe
              </button>
            </div>
          </motion.div>
        </Container>
      </div>
    </>
  );
};

export default Home;

