import { useEffect, useState, useRef } from "react";
import ReactStars from "react-rating-stars-component";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import ProductCard from "../components/ProductCard";
import Color from "../components/Color";
import { AiOutlineHeart, AiFillHeart, AiOutlinePlayCircle, AiOutlineZoomIn, AiOutlineShoppingCart, AiOutlineUpload, AiFillCheckCircle, AiOutlineLike } from "react-icons/ai";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { addRating, getAProduct, getAllProducts, resetSingleProduct } from "../features/products/productSlilce";
import { toast } from "react-toastify";
import { addProdToCart, addBundleToCart, getUserCart } from "../features/user/userSlice";
import { addToWishlist } from "../features/products/productSlilce";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";

const SingleProduct = () => {
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [productBundles, setProductBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [addingBundle, setAddingBundle] = useState(null);
  const [bundleSizeModal, setBundleSizeModal] = useState(null); // holds the bundle being configured
  const [bundleSelections, setBundleSelections] = useState({});
  // Review state
  const [reviewImages, setReviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const location = useLocation();
  const navigate = useNavigate();
  const getProductId = location.pathname.split("/")[2];
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  
  const productState = useSelector((state) => state?.product?.singleproduct);
  const productsState = useSelector((state) => state?.product?.product);
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);

  const [isFilled, setIsFilled] = useState(false);

  // Get available colors from variants or fallback to old color
  const availableColors = productState?.variants?.length > 0 
    ? productState.variants.map(v => v.color).filter(Boolean)
    : (productState?.color ? [productState.color] : []);

  // Get available sizes for selected color
  const availableSizes = color 
    ? (productState?.variants?.find(v => v.color?._id === color || v.color === color)?.sizeStock || [])
        .filter(s => s.quantity > 0)
        .map(s => ({ size: s.size, quantity: s.quantity }))
    : (productState?.sizeStock?.filter(s => s.quantity > 0) || []).map(s => ({ size: s.size, quantity: s.quantity }));

  // Get max quantity for selected size
  const maxQuantity = size 
    ? availableSizes.find(s => s.size === size)?.quantity || 0
    : productState?.quantity || 0;

  // Check if product is in wishlist
  useEffect(() => {
    if (wishlistState && productState?._id) {
      const isInWishlist = wishlistState.some(item => item._id === productState._id);
      setIsFilled(isInWishlist);
    }
  }, [wishlistState, productState?._id]);

  useEffect(() => {
    dispatch(resetSingleProduct());
    if (getProductId) {
      dispatch(getAProduct(getProductId));
      dispatch(getUserCart());
      dispatch(getAllProducts());
    }
  }, [dispatch, getProductId]);

  // Fetch bundles for this product
  useEffect(() => {
    const fetchBundles = async () => {
      if (getProductId) {
        setLoadingBundles(true);
        try {
          const response = await axios.get(`${base_url}bundles/product/${getProductId}`);
          if (response.data) {
            setProductBundles(response.data);
          }
        } catch (error) {
          console.log("No bundles found for this product");
        } finally {
          setLoadingBundles(false);
        }
      }
    };

    fetchBundles();
  }, [getProductId]);

  useEffect(() => {
    if (cartState && getProductId) {
      const isAdded = cartState.some(item => item.productId?._id === getProductId || item.productId === getProductId);
      setAlreadyAdded(isAdded);
    }
  }, [cartState, getProductId]);

  const uploadCart = () => {
    if (color === null) {
      toast.error("Please choose Color");
    } else if (availableSizes.length > 0 && size === null) {
      toast.error("Please choose Size");
    } else {
      dispatch(
        addProdToCart({
          productId: productState?._id,
          quantity,
          color,
          size,
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

  // Handle image upload for reviews
  const handleReviewImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploadingImages(true);
    try {
      const uploadedImages = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        
        const response = await axios.post(`${base_url}upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        if (response.data) {
          uploadedImages.push({
            public_id: response.data._id,
            url: response.data.url,
          });
        }
      }
      setReviewImages([...reviewImages, ...uploadedImages]);
      toast.success("Image(s) uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image from review
  const removeReviewImage = (index) => {
    const newImages = [...reviewImages];
    newImages.splice(index, 1);
    setReviewImages(newImages);
  };

  // Mark review as helpful
  const handleMarkHelpful = async (reviewId, productId) => {
    try {
      await axios.put(`${base_url}product/reviews/helpful`, {
        reviewId,
        prodId: productId,
      });
      toast.success("Marked as helpful!");
      dispatch(getAProduct(getProductId));
    } catch (error) {
      toast.error("Failed to mark as helpful");
    }
  };

  const addRatingToProduct = () => {
    if (star === null) {
      toast.error("Please add star rating");
      return false;
    } else if (comment === null) {
      toast.error("Please Write Review About the Product");
      return false;
    } else {
      dispatch(
        addRating({ star: star, comment: comment, prodId: getProductId, images: reviewImages })
      );
      setTimeout(() => {
        dispatch(getAProduct(getProductId));
      }, 100);
      // Reset review form
      setStar(null);
      setComment(null);
      setReviewImages([]);
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

  const bundleNeedsSelection = (bundle) =>
    (bundle?.products || []).some((item) => {
      const product = item.product;
      if (!product) return false;
      const hasVariantStock = (product.variants || []).some(
        (variant) => (variant.sizeStock || []).some((sizeEntry) => sizeEntry.quantity > 0)
      );
      const hasTopLevelSizes = (product.sizeStock || []).some((sizeEntry) => sizeEntry.quantity > 0);
      return hasVariantStock || hasTopLevelSizes;
    });

  const getBundleColorSwatch = (colorOption) =>
    colorOption?.hex || colorOption?.title || "#d1d5db";

  // Open size selection modal for bundle
  const handleAddBundleToCart = (e, bundle) => {
    e.stopPropagation();
    const customer = localStorage.getItem("customer");
    if (!customer) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (bundleNeedsSelection(bundle)) {
      setBundleSelections({});
      setBundleSizeModal(bundle);
    } else {
      confirmAddBundleToCart(bundle, {});
    }
  };

  const confirmAddBundleToCart = async (bundle) => {
    setBundleSizeModal(null);
    setAddingBundle(bundle._id);
    try {
      await dispatch(addBundleToCart({ bundleId: bundle._id, selectedVariants: bundleSelections })).unwrap();
      toast.success(`🛒 ${bundle.title} added to cart at ₹${bundle.bundlePrice}!`);
      navigate("/cart");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add bundle to cart");
    } finally {
      setAddingBundle(null);
    }
  };

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
      <Meta
        title={productState?.title}
        description={productState?.description?.replace(/<[^>]+>/g, "").slice(0, 160)}
        keywords={`${productState?.title}, ${productState?.brand}, ${productState?.category}, buy online, Yashoda Fashion`}
        image={productState?.images?.[0]?.url}
        url={`/product/${productState?._id}`}
        type="product"
        price={productState?.price}
        brand={productState?.brand}
        availability={productState?.quantity > 0}
      />
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
                  background: maxQuantity > 0 ? '#e0e7ff' : '#fee2e2',
                  color: maxQuantity > 0 ? '#4338ca' : '#dc2626',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600
                }}>
                  {maxQuantity > 0 ? `✓ ${maxQuantity} in stock` : '✕ Out of Stock'}
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
                      colorData={availableColors}
                    />
                  </div>
                )}

                {alreadyAdded === false && productState?.quantity > 0 && color && availableSizes.length > 0 && (
                  <div className="mb-3">
                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Size:</h3>
                    <div className="d-flex gap-2 flex-wrap">
                      {availableSizes.map((sizeOption) => (
                        <button
                          key={sizeOption.size}
                          onClick={() => setSize(sizeOption.size)}
                          style={{
                            padding: '8px 16px',
                            border: `2px solid ${size === sizeOption.size ? '#d4af37' : '#e5e5e5'}`,
                            backgroundColor: size === sizeOption.size ? '#d4af37' : '#fff',
                            color: size === sizeOption.size ? '#fff' : '#333',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            if (size !== sizeOption.size) {
                              e.target.style.borderColor = '#d4af37';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (size !== sizeOption.size) {
                              e.target.style.borderColor = '#e5e5e5';
                            }
                          }}
                        >
                          {sizeOption.size} ({sizeOption.quantity})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="d-flex align-items-center gap-3 mb-4">
                {alreadyAdded === false && maxQuantity > 0 && (
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
                        max={maxQuantity}
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

      {/* Bundle Section - Frequently Bought Together */}
      {(productBundles && productBundles.length > 0) && (
        <Container className="py-5">
          <div className="row">
            <div className="col-12">
              <h3 style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '28px', 
                marginBottom: '25px',
                paddingBottom: '15px',
                borderBottom: '2px solid #d4af37',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}>
                  <AiOutlineShoppingCart style={{ marginRight: '8px' }} />
                  BUNDLE DEAL
                </span>
                Frequently Bought Together
              </h3>
              
              <div className="row g-4">
                {productBundles.map((bundle, index) => (
                  <div className="col-12 col-md-6 col-lg-4" key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -8 }}
                      style={{
                        background: '#fff',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        border: '2px solid #667eea'
                      }}
                    >
                      {/* Bundle Header */}
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '15px 20px',
                        color: '#fff'
                      }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                          {bundle.title}
                        </h4>
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                          {bundle.products?.length} products included
                        </p>
                      </div>

                      {/* Bundle Products */}
                      <div style={{ padding: '15px' }}>
                        {bundle.products && bundle.products.map((item, idx) => (
                          <div key={idx} className="d-flex align-items-start gap-2 mb-3">
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {item.product?.images?.[0]?.url ? (
                                <img 
                                  src={item.product.images[0].url} 
                                  alt={item.product.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  background: '#f5f5f5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <span style={{ fontSize: '10px', color: '#999' }}>No Img</span>
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ 
                                margin: 0, 
                                fontSize: '12px', 
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {item.product?.title}
                              </p>
                              <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#666' }}>
                                Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                              </p>
                              {(item.product?.variants || []).length > 0 && (
                                <div className="d-flex gap-1 flex-wrap mb-1">
                                  {(item.product.variants || []).map((variant, vIndex) => (
                                    <span
                                      key={`${variant.color?._id || variant.color || vIndex}`}
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: getBundleColorSwatch(variant.color),
                                        border: '1px solid rgba(15,23,42,0.15)',
                                        display: 'inline-block'
                                      }}
                                      title={variant.color?.name || variant.color?.title || ""}
                                    />
                                  ))}
                                </div>
                              )}
                              {/* Show all sizes with stock status */}
                              {item.product?.sizeStock?.length > 0 && (
                                <div className="d-flex gap-1 flex-wrap">
                                  {item.product.sizeStock.map(s => (
                                    <span key={s.size} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px', border: s.quantity > 0 ? '1.5px solid #667eea' : '1.5px solid #e5e5e5', color: s.quantity > 0 ? '#667eea' : '#bbb', background: s.quantity > 0 ? '#f0f0ff' : '#f5f5f5', textDecoration: s.quantity > 0 ? 'none' : 'line-through' }}>
                                      {s.size}{s.quantity === 0 && ' ✕'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        <div style={{ 
                          padding: '12px', 
                          background: '#f9f9f9', 
                          borderRadius: '8px',
                          marginTop: '10px'
                        }}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span style={{ fontSize: '12px', color: '#666' }}>Original:</span>
                            <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                              ₹{bundle.originalPrice?.toLocaleString()}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Bundle Price:</span>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#667eea' }}>
                              ₹{bundle.bundlePrice?.toLocaleString()}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 500 }}>
                              You Save:
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#22c55e' }}>
                              ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()} ({bundle.discountPercent}% OFF)
                            </span>
                          </div>
                        </div>

                        {(bundle.products || []).some(i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0) && (
                          <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#667eea', fontWeight: 600, textAlign: 'center' }}>
                            ⚠️ You’ll choose a size for each product
                          </p>
                        )}
                        <button
                          onClick={(e) => handleAddBundleToCart(e, bundle)}
                          disabled={addingBundle === bundle._id}
                          style={{
                            width: '100%',
                            marginTop: '12px',
                            padding: '12px',
                            background: addingBundle === bundle._id ? '#a5b4fc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: addingBundle === bundle._id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          <AiOutlineShoppingCart />
                          {addingBundle === bundle._id
                            ? 'Adding…'
                            : (bundle.products || []).some(i => i.product?.sizeStock?.filter(s => s.quantity > 0).length > 0)
                              ? 'Select Options & Add to Cart'
                              : 'Add Bundle to Cart'
                          }
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      )}

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
              {/* Rating Summary with Stats */}
              <div className="d-flex align-items-start gap-4 mb-4 pb-4" style={{ borderBottom: '1px solid #eee' }}>
                <div className="text-center" style={{ minWidth: '120px' }}>
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
                
                {/* Rating Stats Bars */}
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = productState?.ratingStats?.[star] || 0;
                    const total = productState?.ratings?.length || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={star} className="d-flex align-items-center gap-2 mb-2">
                        <span style={{ fontSize: '13px', width: '50px' }}>{star} star</span>
                        <div style={{ flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: star === 5 ? '#22c55e' : star === 4 ? '#84cc16' : star === 3 ? '#eab308' : star === 2 ? '#f97316' : '#ef4444',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#999', width: '30px' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Sort Reviews */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Write a Review</h4>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    border: '2px solid #eee',
                    fontSize: '14px'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>
              
              {/* Write Review */}
              <div className="py-4">
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
                    value={comment || ''}
                    style={{ 
                      borderRadius: '12px', 
                      padding: '15px',
                      border: '2px solid #eee',
                      fontSize: '15px'
                    }}
                  ></textarea>
                </div>
                
                {/* Image Upload */}
                <div className="mb-4">
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                    Add Photos (optional)
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleReviewImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="d-flex gap-2 flex-wrap">
                    {reviewImages.map((img, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img 
                          src={img.url} 
                          alt={`Review ${index + 1}`}
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid #eee'
                          }} 
                        />
                        <button
                          onClick={() => removeReviewImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      style={{
                        width: '80px',
                        height: '80px',
                        border: '2px dashed #ddd',
                        borderRadius: '8px',
                        background: '#f9f9f9',
                        cursor: uploadingImages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#999',
                        fontSize: '12px'
                      }}
                    >
                      {uploadingImages ? (
                        <div className="spinner-border spinner-border-sm" />
                      ) : (
                        <>
                          <AiOutlineUpload style={{ fontSize: '24px' }} />
                          Upload
                        </>
                      )}
                    </button>
                  </div>
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
                {(() => {
                  // Sort reviews
                  let sortedReviews = [...(productState?.ratings || [])];
                  switch (sortBy) {
                    case 'newest':
                      sortedReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                      break;
                    case 'oldest':
                      sortedReviews.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                      break;
                    case 'highest':
                      sortedReviews.sort((a, b) => (b.star || 0) - (a.star || 0));
                      break;
                    case 'lowest':
                      sortedReviews.sort((a, b) => (a.star || 0) - (b.star || 0));
                      break;
                    case 'helpful':
                      sortedReviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
                      break;
                    default:
                      break;
                  }
                  return sortedReviews.length > 0 ? (
                    sortedReviews.map((item, index) => (
                      <div 
                        key={index} 
                        className="review pb-4 mb-4" 
                        style={{ 
                          borderBottom: index < sortedReviews.length - 1 ? '1px solid #eee' : 'none'
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
                            {(item.postedby?.firstname || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="d-flex align-items-center gap-2">
                              <ReactStars
                                count={5}
                                size={16}
                                value={item?.star || 0}
                                edit={false}
                                activeColor="#ffd700"
                              />
                              {item?.isVerifiedPurchase && (
                                <span style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  background: '#dcfce7', 
                                  color: '#166534',
                                  padding: '2px 8px',
                                  borderRadius: '12px',
                                  fontSize: '11px',
                                  fontWeight: 500
                                }}>
                                  <AiFillCheckCircle style={{ fontSize: '12px' }} />
                                  Verified Purchase
                                </span>
                              )}
                            </div>
                            <span style={{ color: '#999', fontSize: '12px' }}>
                              {item.postedby?.firstname || "Unknown"} {item.postedby?.lastname || ""} • {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <p style={{ color: '#555', lineHeight: 1.7 }}>{item?.comment}</p>
                        
                        {/* Review Images */}
                        {item?.images && item.images.length > 0 && (
                          <div className="d-flex gap-2 mb-3 flex-wrap">
                            {item.images.map((img, idx) => (
                              <img 
                                key={idx}
                                src={img.url} 
                                alt={`Review image ${idx + 1}`}
                                style={{ 
                                  width: '100px', 
                                  height: '100px', 
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => window.open(img.url, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Helpful Button */}
                        <button
                          onClick={() => handleMarkHelpful(item._id, productState._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'transparent',
                            border: '1px solid #eee',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            cursor: 'pointer',
                            color: '#666',
                            fontSize: '13px'
                          }}
                        >
                          <AiOutlineLike />
                          Helpful ({item?.helpful || 0})
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-5">
                      <p style={{ color: '#999', fontSize: '16px' }}>No reviews yet. Be the first to review this product!</p>
                    </div>
                  );
                })()}
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
      {/* Bundle Size Selection Modal */}
      {bundleSizeModal && (
        <div
          onClick={() => setBundleSizeModal(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '16px', padding: '30px',
              maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto'
            }}
          >
            <h4 style={{ marginBottom: '6px', fontWeight: 700 }}>{bundleSizeModal.title}</h4>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Select the correct color and size for each product in this bundle
            </p>

            {(bundleSizeModal.products || []).map((item) => {
              const product = item.product;
              if (!product) return null;
              const productId = product._id?.toString();
              const variantColors = (product.variants || [])
                .filter((variant) => (variant.sizeStock || []).some((s) => s.quantity > 0))
                .map((variant) => variant.color)
                .filter(Boolean);
              const hasVariantColors = variantColors.length > 0;
              const selectedColor = bundleSelections[productId]?.color || null;
              const sizes = hasVariantColors
                ? ((product.variants || []).find((variant) => {
                    const variantColorId = variant.color?._id || variant.color;
                    return variantColorId?.toString() === selectedColor;
                  })?.sizeStock || [])
                : (product.sizeStock || []);
              const needsAnySelection = hasVariantColors || sizes.length > 0;
              if (!needsAnySelection) return null;
              return (
                <div key={productId} style={{ marginBottom: '20px', padding: '16px', borderRadius: '16px', border: '1px solid #e5e7eb', background: '#fff' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    {product.images?.[0]?.url && (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '14px', display: 'block' }}>{product.title}</span>
                      {hasVariantColors && (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Choose color first, then size</span>
                      )}
                    </div>
                  </div>
                  {hasVariantColors && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Color</div>
                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {variantColors.map((colorOption, index) => {
                          const colorId = (colorOption?._id || colorOption)?.toString();
                          const isSelected = bundleSelections[productId]?.color === colorId;
                          return (
                            <div
                              key={colorId || index}
                              onClick={() => setBundleSelections((prev) => ({
                                ...prev,
                                [productId]: { ...prev[productId], color: colorId, size: null },
                              }))}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: getBundleColorSwatch(colorOption),
                                border: isSelected ? '3px solid #d4af37' : '2px solid #e5e5e5',
                                boxShadow: isSelected ? '0 0 0 3px rgba(212,175,55,0.22)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              title={colorOption?.name || colorOption?.title || ""}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {sizes.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Size</div>
                      <div className="d-flex gap-2 flex-wrap">
                        {sizes.map((s) => (
                          <button
                            key={s.size}
                            disabled={s.quantity === 0 || (hasVariantColors && !selectedColor)}
                            onClick={() => s.quantity > 0 && (!hasVariantColors || selectedColor) && setBundleSelections((prev) => ({ ...prev, [productId]: { ...prev[productId], size: s.size } }))}
                            style={{
                              padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                              cursor: s.quantity === 0 || (hasVariantColors && !selectedColor) ? 'not-allowed' : 'pointer',
                              border: bundleSelections[productId]?.size === s.size ? '2px solid #0f172a' : '1px solid #cbd5e1',
                              background: bundleSelections[productId]?.size === s.size ? '#0f172a' : s.quantity === 0 ? '#f5f5f5' : '#fff',
                              color: bundleSelections[productId]?.size === s.size ? '#fff' : s.quantity === 0 ? '#bbb' : '#333',
                              opacity: s.quantity === 0 || (hasVariantColors && !selectedColor) ? 0.6 : 1,
                            }}
                          >
                            <span style={{ textDecoration: s.quantity === 0 ? 'line-through' : 'none' }}>{s.size}</span>
                            {s.quantity === 0
                              ? <span style={{ display: 'block', fontSize: '9px', color: '#ef4444', fontWeight: 700, lineHeight: 1 }}>Out of Stock</span>
                              : <span style={{ display: 'block', fontSize: '9px', color: bundleSelections[productId]?.size === s.size ? '#fff' : '#22c55e', fontWeight: 700, lineHeight: 1 }}>{s.quantity} left</span>
                            }
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="d-flex gap-3 mt-3">
              <button
                onClick={() => setBundleSizeModal(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '2px solid #e5e5e5', background: '#fff',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Validate all products with sizes have a selection
                  const missing = (bundleSizeModal.products || []).find((item) => {
                    const p = item.product;
                    if (!p) return false;
                    const pid = p._id?.toString();
                    const hasVariantStock = (p.variants || []).some((variant) => (variant.sizeStock || []).some((s) => s.quantity > 0));
                    const hasTopLevelSizes = (p.sizeStock || []).some((s) => s.quantity > 0);
                    const selection = bundleSelections[pid] || {};
                    if (hasVariantStock) return !selection.color || !selection.size;
                    if (hasTopLevelSizes) return !selection.size;
                    return false;
                  });
                  if (missing) {
                    const p = missing.product;
                    const hasVariantStock = (p.variants || []).some((variant) => (variant.sizeStock || []).some((s) => s.quantity > 0));
                    toast.error(hasVariantStock ? `Please select color and size for ${p.title}` : `Please select a size for ${p.title}`);
                    return;
                  }
                  confirmAddBundleToCart(bundleSizeModal, bundleSelections);
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Add Bundle to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleProduct;
