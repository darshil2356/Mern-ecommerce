import { useEffect, useState } from "react";
import ReactStars from "react-rating-stars-component";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import ProductCard from "../components/ProductCard";
import Color from "../components/Color";
import { AiOutlineHeart, AiFillHeart, AiOutlinePlayCircle, AiOutlineZoomIn } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { addRating, getAProduct, getAllProducts } from "../features/products/productSlilce";
import { toast } from "react-toastify";
import { addProdToCart, getUserCart } from "../features/user/userSlice";
import { addToWishlist } from "../features/products/productSlilce";
import { motion, AnimatePresence } from "framer-motion";

const SingleProduct = () => {
  const [color, setColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const getProductId = location.pathname.split("/")[2];
  const dispatch = useDispatch();
  
  const productState = useSelector((state) => state?.product?.singleproduct);
  const productsState = useSelector((state) => state?.product?.product);
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);

  const [isFilled, setIsFilled] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    if (wishlistState && productState?._id) {
      const isInWishlist = wishlistState.some(item => item._id === productState._id);
      setIsFilled(isInWishlist);
    }
  }, [wishlistState, productState?._id]);

  useEffect(() => {
    if (getProductId) {
      dispatch(getAProduct(getProductId));
      dispatch(getUserCart());
      dispatch(getAllProducts());
    }
  }, [dispatch, getProductId]);

  useEffect(() => {
    if (cartState && getProductId) {
      const isAdded = cartState.some(item => item.productId?._id === getProductId || item.productId === getProductId);
      setAlreadyAdded(isAdded);
    }
  }, [cartState, getProductId]);

  const uploadCart = () => {
    if (color === null) {
      toast.error("Please choose Color");
    } else {
      dispatch(
        addProdToCart({
          productId: productState?._id,
          quantity,
          color,
          price: productState?.price,
        })
      );
      setTimeout(() => {
        navigate("/cart");
      }, 500);
    }
  };

  const handleAddToWishlist = () => {
    dispatch(addToWishlist(productState?._id));
    setIsFilled(!isFilled);
    toast.success(isFilled ? "Removed from wishlist" : "Added to wishlist");
  };

  const copyToClipboard = (text) => {
    const textField = document.createElement("textarea");
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
    toast.success("Link copied to clipboard!");
  };

  const [popularProduct, setPopularProduct] = useState([]);

  useEffect(() => {
    if (productsState && productsState.length > 0) {
      const data = productsState.filter(element => element.tags === "popular");
      setPopularProduct(data);
    }
  }, [productsState]);

  const [star, setStar] = useState(null);
  const [comment, setComment] = useState(null);

  const addRatingToProduct = () => {
    if (star === null) {
      toast.error("Please add star rating");
      return false;
    } else if (comment === null) {
      toast.error("Please Write Review About the Product");
      return false;
    } else {
      dispatch(
        addRating({ star: star, comment: comment, prodId: getProductId })
      );
      setTimeout(() => {
        dispatch(getAProduct(getProductId));
      }, 100);
      toast.success("Review submitted!");
    }
    return false;
  };

  // Build media array with images and videos
  const media = [
    ...(productState?.images || []).map((i) => ({
      type: "image",
      url: i.url,
    })),
    ...(productState?.videos || []).map((v) => ({
      type: "video",
      url: v.url,
    })),
  ];

  // Get active media
  const activeMedia = media[activeMediaIndex];

  if (!productState) {
    return (
      <Container class1="py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading product...</p>
        </div>
      </Container>
    );
  }

  return (
    <>
      <Meta title={productState?.title || "Product Details"} />
      <BreadCrumb title={productState?.title} />

      {/* Product Gallery & Details Section */}
      <Container className="py-5">
        <div className="row g-4">
          {/* Left Side - Image/Video Gallery */}
          <div className="col-12 col-lg-6">
            {/* Main Media Display */}
            <motion.div 
              key={activeMediaIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="main-media-container mb-4"
              style={{
                background: '#f8f8f8',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '1/1',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }}
            >
              <AnimatePresence mode="wait">
                {activeMedia?.type === "video" ? (
                  <motion.video
                    key={`video-${activeMediaIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    src={activeMedia.url}
                    controls
                    autoPlay
                    loop
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <motion.img
                    key={`image-${activeMediaIndex}`}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    src={activeMedia?.url || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg"}
                    alt={productState?.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      cursor: 'zoom-in'
                    }}
                    onClick={() => setIsZoomed(true)}
                  />
                )}
              </AnimatePresence>

              {/* Video Play Icon Overlay */}
              {activeMedia?.type === "video" && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none'
                }}>
                  <AiOutlinePlayCircle style={{ fontSize: '80px', color: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}

              {/* Zoom Icon */}
              {activeMedia?.type === "image" && (
                <button
                  onClick={() => setIsZoomed(true)}
                  style={{
                    position: 'absolute',
                    bottom: '15px',
                    right: '15px',
                    background: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '45px',
                    height: '45px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  <AiOutlineZoomIn style={{ fontSize: '22px', color: '#333' }} />
                </button>
              )}

              {/* Media Type Badge */}
              {activeMedia?.type === "video" && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '15px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AiOutlinePlayCircle /> Video
                </div>
              )}
            </motion.div>

            {/* Thumbnail Gallery */}
            {media.length > 1 && (
              <div className="thumbnail-gallery" style={{
                display: 'flex',
                gap: '12px',
                overflowX: 'auto',
                paddingBottom: '10px'
              }}>
                {media.map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveMediaIndex(index)}
                    style={{
                      cursor: 'pointer',
                      flexShrink: 0,
                      width: '90px',
                      height: '90px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: activeMediaIndex === index ? '3px solid #d4af37' : '3px solid transparent',
                      opacity: activeMediaIndex === index ? 1 : 0.7,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {item.type === "video" ? (
                      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video
                          src={item.url}
                          muted
                          preload="metadata"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AiOutlinePlayCircle style={{ color: '#fff', fontSize: '16px' }} />
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Thumbnail ${index + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Details */}
          <div className="col-12 col-lg-6">
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              {/* Brand & Tags */}
              <div className="d-flex gap-2 mb-3 flex-wrap">
                <span style={{
                  background: '#f5f5f5',
                  color: '#666',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {productState?.brand}
                </span>
                <span style={{
                  background: '#d4af37',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  {productState?.tags}
                </span>
              </div>

              {/* Title */}
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '32px',
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: '15px',
                lineHeight: 1.2
              }}>
                {productState?.title}
              </h1>
              
              {/* Price & Rating */}
              <div className="d-flex align-items-center justify-content-between mb-4 pb-4" style={{ borderBottom: '1px solid #eee' }}>
                <div>
                  <span style={{ 
                    fontSize: '36px', 
                    fontWeight: 700, 
                    color: '#d4af37'
                  }}>
                    ₹{productState?.price?.toLocaleString()}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <ReactStars
                    count={5}
                    size={24}
                    value={Number(productState?.totalrating) || 0}
                    edit={false}
                    activeColor="#ffd700"
                  />
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    ({productState?.ratings?.length || 0} reviews)
                  </span>
                </div>
              </div>

              {/* Inventory Status */}
              <div className="d-flex gap-2 mb-4 flex-wrap">
                {productState?.inventory?.online && productState?.quantity > 0 && (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '13px',
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}>
                    ✓ Available Online
                  </span>
                )}
                {productState?.inventory?.offline && (
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '13px',
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}>
                    ✓ In Store
                  </span>
                )}
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontSize: '13px',
                  background: productState?.quantity > 0 ? '#e0e7ff' : '#fee2e2',
                  color: productState?.quantity > 0 ? '#4338ca' : '#dc2626',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600
                }}>
                  {productState?.quantity > 0 ? `✓ ${productState?.quantity} in stock` : '✕ Out of Stock'}
                </span>
              </div>

              {/* Product Info */}
              <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #eee' }}>
                <div className="d-flex gap-3 align-items-center mb-3">
                  <h3 style={{ fontSize: '14px', fontWeight: 600, minWidth: '90px', marginBottom: 0 }}>Category:</h3>
                  <span style={{ color: '#666' }}>{productState?.category}</span>
                </div>
                
                {alreadyAdded === false && productState?.quantity > 0 && (
                  <div className="mb-3">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Color:</h3>
                    <Color
                      setColor={setColor}
                      colorData={productState?.color}
                    />
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="d-flex align-items-center gap-3 mb-4">
                {alreadyAdded === false && productState?.quantity > 0 && (
                  <>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      border: '2px solid #e5e5e5',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        style={{
                          background: '#f5f5f5',
                          border: 'none',
                          padding: '12px 18px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 600
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={productState?.quantity || 10}
                        className="form-control"
                        style={{ 
                          width: '60px', 
                          textAlign: 'center',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '16px'
                        }}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        value={quantity}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(productState?.quantity || 10, quantity + 1))}
                        style={{
                          background: '#f5f5f5',
                          border: 'none',
                          padding: '12px 18px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          fontWeight: 600
                        }}
                      >
                        +
                      </button>
                    </div>
                  </>
                )}
                
                <button
                  className="button border-0"
                  type="button"
                  onClick={() => {
                    alreadyAdded ? navigate("/cart") : uploadCart();
                  }}
                  disabled={productState?.quantity === 0}
                  style={{
                    background: alreadyAdded ? '#1a1a1a' : '#d4af37',
                    color: alreadyAdded ? '#fff' : '#1a1a1a',
                    padding: '14px 40px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '15px',
                    flex: 1,
                    opacity: productState?.quantity === 0 ? 0.5 : 1,
                    cursor: productState?.quantity === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  {alreadyAdded ? "✓ Added to Cart" : productState?.quantity === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleAddToWishlist}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  background: isFilled ? '#fef2f2' : 'transparent',
                  border: `2px solid ${isFilled ? '#ef4444' : '#e5e5e5'}`,
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: isFilled ? '#ef4444' : '#666',
                  fontWeight: 600,
                  marginBottom: '20px'
                }}
              >
                {isFilled ? (
                  <AiFillHeart style={{ fontSize: '22px' }} />
                ) : (
                  <AiOutlineHeart style={{ fontSize: '22px' }} />
                )}
                {isFilled ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>

              {/* Shipping Info */}
              <div style={{
                background: '#f9f9f9',
                borderRadius: '12px',
                padding: '20px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Shipping & Returns</h4>
                <ul style={{ marginBottom: 0, paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: 1.8 }}>
                  <li>Free shipping on orders above ₹999</li>
                  <li>Delivery within 5-10 business days</li>
                  <li>Easy 7-day return policy</li>
                </ul>
              </div>

              {/* Share */}
              <div className="d-flex align-items-center gap-3 mt-4">
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Share:</span>
                <button
                  onClick={() => copyToClipboard(window.location.href)}
                  style={{
                    background: '#f5f5f5',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Description Section */}
      <Container className="py-5">
        <div className="row">
          <div className="col-12">
            <h3 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '28px', 
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #d4af37'
            }}>
              Product Description
            </h3>
            <div style={{ 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '30px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              lineHeight: 1.9,
              color: '#555'
            }}>
              <p dangerouslySetInnerHTML={{ __html: productState?.description }}></p>
            </div>
          </div>
        </div>
      </Container>

      {/* Reviews Section */}
      <Container className="pb-5">
        <div className="row">
          <div className="col-12">
            <h3 id="review" style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '28px', 
              marginBottom: '25px',
              paddingBottom: '15px',
              borderBottom: '2px solid #d4af37'
            }}>
              Customer Reviews
            </h3>
            
            <div style={{ 
              background: '#fff', 
              borderRadius: '16px', 
              padding: '30px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              marginBottom: '30px'
            }}>
              {/* Rating Summary */}
              <div className="d-flex align-items-center gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid #eee' }}>
                <div className="text-center">
                  <span style={{ fontSize: '48px', fontWeight: 700, color: '#d4af37' }}>
                    {Number(productState?.totalrating || 0).toFixed(1)}
                  </span>
                  <div className="d-flex justify-content-center my-2">
                    <ReactStars
                      count={5}
                      size={20}
                      value={Number(productState?.totalrating) || 0}
                      edit={false}
                      activeColor="#ffd700"
                    />
                  </div>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    {productState?.ratings?.length || 0} Reviews
                  </span>
                </div>
              </div>
              
              {/* Write Review */}
              <div className="py-4">
                <h4 className="mb-4">Write a Review</h4>
                <div className="mb-4">
                  <ReactStars
                    count={5}
                    size={32}
                    value={star || 0}
                    edit={true}
                    activeColor="#ffd700"
                    onChange={(e) => setStar(e)}
                  />
                </div>
                <div className="mb-4">
                  <textarea
                    className="w-100 form-control"
                    cols="30"
                    rows="4"
                    placeholder="Share your experience with this product..."
                    onChange={(e) => setComment(e.target.value)}
                    style={{ 
                      borderRadius: '12px', 
                      padding: '15px',
                      border: '2px solid #eee',
                      fontSize: '15px'
                    }}
                  ></textarea>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addRatingToProduct}
                  style={{
                    background: '#1a1a1a',
                    color: '#fff',
                    border: 'none',
                    padding: '14px 36px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Submit Review
                </motion.button>
              </div>
              
              {/* Reviews List */}
              <div className="reviews mt-4 pt-4" style={{ borderTop: '1px solid #eee' }}>
                {productState?.ratings?.length > 0 ? (
                  productState.ratings.map((item, index) => (
                    <div 
                      key={index} 
                      className="review pb-4 mb-4" 
                      style={{ 
                        borderBottom: index < productState.ratings.length - 1 ? '1px solid #eee' : 'none'
                      }}
                    >
                      <div className="d-flex gap-3 align-items-center mb-3">
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '18px'
                        }}>
                          {(item.postedby?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <ReactStars
                            count={5}
                            size={16}
                            value={item?.star || 0}
                            edit={false}
                            activeColor="#ffd700"
                          />
                          <span style={{ color: '#999', fontSize: '12px' }}>
                            {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p style={{ color: '#555', lineHeight: 1.7 }}>{item?.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <p style={{ color: '#999', fontSize: '16px' }}>No reviews yet. Be the first to review this product!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Related Products */}
      <Container className="pb-5">
        <div className="row mb-4">
          <div className="col-12">
            <h3 style={{ 
              fontFamily: "'Playfair Display', serif", 
              fontSize: '28px', 
              marginBottom: '0'
            }}>
              You May Also Like
            </h3>
          </div>
        </div>
        {popularProduct && popularProduct.length > 0 ? (
          <div className="row g-4">
            {popularProduct.slice(0, 4).map((item, index) => (
              <div className="col-12 col-sm-6 col-lg-3" key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
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
                  <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
                    {item?.images?.[0]?.url ? (
                      <img
                        src={item.images[0].url}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#999' }}>No Image</span>
                      </div>
                    )}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      {item?.tags === 'new' && (
                        <span style={{ background: '#1a1a1a', color: '#fff', padding: '6px 12px', fontSize: '10px', fontWeight: 600, borderRadius: '4px' }}>
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h6 style={{ color: '#d4af37', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                      {item?.brand}
                    </h6>
                    <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', marginBottom: '8px', lineHeight: 1.4 }}>
                      {item?.title?.slice(0, 40)}...
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', marginBottom: 0 }}>
                        ₹{item?.price?.toLocaleString()}
                      </p>
                      <span style={{ 
                        fontSize: '11px',
                        background: item?.quantity > 0 ? '#dcfce7' : '#fee2e2',
                        color: item?.quantity > 0 ? '#166534' : '#dc2626',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: 500
                      }}>
                        {item?.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <p style={{ color: '#999', fontSize: '16px' }}>No related products found</p>
          </div>
        )}
      </Container>

      {/* Zoom Modal */}
      {isZoomed && activeMedia?.type === "image" && (
        <div 
          onClick={() => setIsZoomed(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
        >
          <img
            src={activeMedia?.url}
            alt={productState?.title}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
          <button
            onClick={() => setIsZoomed(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              fontSize: '30px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default SingleProduct;

