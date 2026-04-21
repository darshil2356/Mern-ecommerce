import { useEffect, useState, useRef } from "react";
import ReactStars from "react-rating-stars-component";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import Color from "../components/Color";
import { AiOutlineHeart, AiFillHeart, AiOutlinePlayCircle, AiOutlineZoomIn, AiOutlineShoppingCart, AiOutlineUpload, AiFillCheckCircle, AiOutlineLike, AiOutlineShareAlt, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";
import { MdLocalShipping, MdLoop } from "react-icons/md";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { addRating, getAProduct, getAllProducts, resetSingleProduct } from "../features/products/productSlilce";
import { toast } from "react-toastify";
import { addProdToCart, addBundleToCart, getUserCart } from "../features/user/userSlice";
import { addToWishlist } from "../features/products/productSlilce";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { base_url } from "../utils/axiosConfig";
import trackingService from "../utils/trackingService";
import { productUrl } from "../utils/seoUrl";
import StockInquiryModal from "../components/StockInquiryModal";
import { PremiumLoader } from "../components/GlobalLoader";

const SingleProduct = () => {
  const productState = useSelector((state) => state?.product?.singleproduct);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [productBundles, setProductBundles] = useState([]);
  const [loadingBundles, setLoadingBundles] = useState(false);
  const [addingBundle, setAddingBundle] = useState(null);
  const productOffers = productState?.offers || [];
  const [bundleSizeModal, setBundleSizeModal] = useState(null);
  const [bundleSelections, setBundleSelections] = useState({});
  const [reviewImages, setReviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams();
  const getProductId = slug?.match(/[a-f0-9]{24}$/)?.[0] || slug;
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const cartButtonRef = useRef(null);

  const productsState = useSelector((state) => state?.product?.product);
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);

  const [isFilled, setIsFilled] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showStickyCart, setShowStickyCart] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const el = cartButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCart(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [productState]);

  // Get available colors from variants or fallback to old color (deduplicated by _id)
  const availableColors = (() => {
    const raw = productState?.variants?.length > 0
      ? productState.variants
          .filter(v => v.color && v.sizeStock?.some(s => s.quantity > 0))
          .map(v => v.color)
      : (productState?.color ? [productState.color] : []);
    const seen = new Set();
    return raw.filter(c => {
      const id = c?._id?.toString();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  })();

  const availableSizes = color
    ? (productState?.variants?.find(v => v.color?._id?.toString() === color || v.color?.toString() === color)?.sizeStock || [])
        .filter(s => s.quantity > 0)
        .map(s => ({ size: s.size, quantity: s.quantity }))
    : (productState?.sizeStock?.filter(s => s.quantity > 0) || []).map(s => ({ size: s.size, quantity: s.quantity }));

  const maxQuantity = size
    ? availableSizes.find(s => s.size === size)?.quantity || 0
    : productState?.quantity || 0;

  const cartSizesForColor = new Set(
    (cartState || [])
      .filter(item =>
        !item.isFreeItem &&
        (item.productId?._id === getProductId || item.productId === getProductId) &&
        (color === null || (item.color?._id || item.color)?.toString() === color?.toString()) &&
        item.size
      )
      .map(item => item.size)
  );

  const hasAnyStock = (() => {
    if (productState?.variants?.length > 0) {
      return productState.variants.some(v => v.sizeStock?.some(s => s.quantity > 0));
    }
    if (productState?.sizeStock?.length > 0) {
      return productState.sizeStock.some(s => s.quantity > 0);
    }
    return (productState?.quantity || 0) > 0;
  })();

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

  useEffect(() => {
    if (productState?._id && productState?.title) {
      trackingService.trackProductView(
        productState._id,
        productState.title,
        productState.category || 'uncategorized'
      );
    }
  }, [productState?._id, productState?.title]);

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
      const isAdded = cartState.some(
        item =>
          !item.isFreeItem &&
          (item.productId?._id === getProductId || item.productId === getProductId) &&
          (color === null || (item.color?._id || item.color)?.toString() === color?.toString()) &&
          (size === null || item.size === size)
      );
      setAlreadyAdded(isAdded);
    }
  }, [cartState, getProductId, color, size]);

  const uploadCart = () => {
    if (availableColors.length > 0 && color === null) {
      toast.error("Please choose Color");
    } else if (availableSizes.length > 0 && size === null) {
      toast.error("Please choose Size");
    } else {
      trackingService.trackAddToCart(
        productState?._id,
        productState?.title,
        quantity,
        productState?.price
      );
      dispatch(
        addProdToCart({
          productId: productState?._id,
          quantity,
          color,
          size,
          price: productState?.price,
        })
      );
      setTimeout(() => { navigate("/cart"); }, 500);
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
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data) {
          uploadedImages.push({ public_id: response.data._id, url: response.data.url });
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

  const removeReviewImage = (index) => {
    const newImages = [...reviewImages];
    newImages.splice(index, 1);
    setReviewImages(newImages);
  };

  const handleMarkHelpful = async (reviewId, productId) => {
    try {
      await axios.put(`${base_url}product/reviews/helpful`, { reviewId, prodId: productId });
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
      dispatch(addRating({ star: star, comment: comment, prodId: getProductId, images: reviewImages }));
      setTimeout(() => { dispatch(getAProduct(getProductId)); }, 100);
      setStar(null);
      setComment(null);
      setReviewImages([]);
      toast.success("Review submitted!");
    }
    return false;
  };

  const getYouTubeId = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };
  const ytVideoId = getYouTubeId(productState?.reelUrl);

  const media = [
    ...(productState?.images || []).map((i) => ({ type: "image", url: i.url })),
    ...(productState?.videos || []).map((v) => ({ type: "video", url: v.url })),
    ...(ytVideoId ? [{ type: "youtube", videoId: ytVideoId }] : []),
  ];

  const activeMedia = media[activeMediaIndex];

  const hasProductStock = (product) => {
    if (!product) return false;
    let totalStock = 0;
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach(variant => {
        if (variant.sizeStock) {
          variant.sizeStock.forEach(stock => { totalStock += stock.quantity || 0; });
        }
      });
    }
    if (product.sizeStock) {
      product.sizeStock.forEach(stock => { totalStock += stock.quantity || 0; });
    }
    totalStock += product.quantity || 0;
    return totalStock > 0;
  };

  const isBundleAvailable = (bundle) =>
    (bundle?.products || []).every(item => hasProductStock(item.product));

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

  // Compute display price for sticky bar
  const computeDisplayPrice = () => {
    const origPrice = productState?.price;
    let displayPrice = origPrice;
    for (const offer of productOffers) {
      if (offer.offerType === 'PERCENT_OFF') {
        displayPrice = Math.round(origPrice * (1 - offer.discountPercent / 100)); break;
      }
      if (offer.offerType === 'FLAT_OFF') {
        displayPrice = Math.max(0, origPrice - offer.discountAmount); break;
      }
      if (offer.offerType === 'BUY_X_FOR_PRICE' && quantity >= offer.buyQty) {
        displayPrice = Math.round(offer.fixedPrice / offer.buyQty); break;
      }
      if (offer.offerType === 'MIN_QTY_DISCOUNT' && quantity >= offer.minQty) {
        displayPrice = Math.round(origPrice * (1 - offer.discountPercent / 100)); break;
      }
    }
    return displayPrice;
  };

  if (!productState) {
    return <PremiumLoader message="Loading product…" />;
  }

  return (
    <>
      <Meta
        title={productState?.seo?.meta_title || productState?.title}
        description={productState?.seo?.meta_description || productState?.description?.replace(/<[^>]+>/g, "").slice(0, 160)}
        keywords={productState?.seo?.meta_keywords?.join(", ") || `${productState?.title}, ${productState?.brand}, ${productState?.category}, buy online, Yashoda Fashion`}
        image={productState?.images?.[0]?.url}
        url={productUrl(productState)}
        type="product"
        price={productState?.price}
        brand={productState?.brand}
        availability={productState?.quantity > 0}
        aggregateRating={
          productState?.ratings?.length > 0
            ? { ratingValue: Number(productState.totalrating) || 0, reviewCount: productState.ratings.length }
            : null
        }
        breadcrumbs={[
          { name: "Shop", url: "/product" },
          ...(productState?.category ? [{ name: productState.category, url: `/product/category/${encodeURIComponent(productState.category.toLowerCase())}` }] : []),
          { name: productState?.title || "Product", url: productUrl(productState) },
        ]}
      />
      <BreadCrumb
        crumbs={[
          { name: "Shop", url: "/product" },
          ...(productState?.category ? [{ name: productState.category, url: `/product/category/${encodeURIComponent(productState.category.toLowerCase())}` }] : []),
          { name: productState?.title || "Product", url: productUrl(productState) },
        ]}
      />

      {/* ── MAIN PRODUCT SECTION ── */}
      <div style={{ paddingTop: isMobile ? '0' : '32px', paddingBottom: isMobile ? '100px' : '48px' }}>
        <div className="container-xxl">
          <div className="row g-0 g-lg-5">

            {/* ── GALLERY ── */}
            <div className="col-12 col-lg-6">
              {/* Main Media */}
              <div style={{ position: 'relative' }}>
                <motion.div
                  key={activeMediaIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: '#f5f5f5',
                    borderRadius: isMobile ? '0' : '20px',
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: '1/1',
                    boxShadow: isMobile ? 'none' : '0 8px 30px rgba(0,0,0,0.1)',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {activeMedia?.type === "youtube" ? (
                      <motion.div
                        key={`yt-${activeMediaIndex}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ width: "100%", height: "100%", background: "#000" }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${activeMedia.videoId}?autoplay=1&mute=1&loop=1&playlist=${activeMedia.videoId}`}
                          title="Product Reel"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ width: "100%", height: "100%", display: "block" }}
                        />
                      </motion.div>
                    ) : activeMedia?.type === "video" ? (
                      <motion.video
                        key={`vid-${activeMediaIndex}`}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        src={activeMedia.url}
                        controls autoPlay loop muted
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <motion.img
                        key={`img-${activeMediaIndex}`}
                        initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        src={activeMedia?.url || "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg"}
                        alt={productState?.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: 'zoom-in' }}
                        onClick={() => setIsZoomed(true)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Video badge */}
                  {(activeMedia?.type === "video" || activeMedia?.type === "youtube") && (
                    <div style={{
                      position: 'absolute', top: '12px', left: '12px',
                      background: activeMedia?.type === "youtube" ? 'rgba(220,38,38,0.9)' : 'rgba(0,0,0,0.7)',
                      color: '#fff', padding: '5px 12px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '5px', pointerEvents: 'none'
                    }}>
                      <AiOutlinePlayCircle /> {activeMedia?.type === "youtube" ? "Reel" : "Video"}
                    </div>
                  )}

                  {/* Zoom button */}
                  {activeMedia?.type === "image" && (
                    <button
                      onClick={() => setIsZoomed(true)}
                      style={{
                        position: 'absolute', bottom: '12px', right: '12px',
                        background: 'rgba(255,255,255,0.92)', border: 'none',
                        borderRadius: '50%', width: '42px', height: '42px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}
                    >
                      <AiOutlineZoomIn style={{ fontSize: '20px', color: '#333' }} />
                    </button>
                  )}

                  {/* Image count badge on mobile */}
                  {isMobile && media.length > 1 && (
                    <div style={{
                      position: 'absolute', bottom: '12px', left: '12px',
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>
                      {activeMediaIndex + 1}/{media.length}
                    </div>
                  )}

                  {/* Arrow navigation on mobile */}
                  {isMobile && media.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveMediaIndex(i => Math.max(0, i - 1))}
                        disabled={activeMediaIndex === 0}
                        style={{
                          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', opacity: activeMediaIndex === 0 ? 0.3 : 1
                        }}
                      >
                        <AiOutlineLeft style={{ fontSize: '16px' }} />
                      </button>
                      <button
                        onClick={() => setActiveMediaIndex(i => Math.min(media.length - 1, i + 1))}
                        disabled={activeMediaIndex === media.length - 1}
                        style={{
                          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '50%',
                          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', opacity: activeMediaIndex === media.length - 1 ? 0.3 : 1
                        }}
                      >
                        <AiOutlineRight style={{ fontSize: '16px' }} />
                      </button>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Thumbnails */}
              {media.length > 1 && (
                <div style={{
                  display: 'flex', gap: isMobile ? '8px' : '10px',
                  overflowX: 'auto', padding: isMobile ? '10px 16px' : '12px 0',
                  scrollbarWidth: 'none',
                }}>
                  {media.map((item, index) => (
                    <motion.div
                      key={index}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveMediaIndex(index)}
                      style={{
                        cursor: 'pointer', flexShrink: 0,
                        width: isMobile ? '68px' : '82px',
                        height: isMobile ? '68px' : '82px',
                        borderRadius: '10px', overflow: 'hidden',
                        border: activeMediaIndex === index ? '2.5px solid #d4af37' : '2.5px solid transparent',
                        opacity: activeMediaIndex === index ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        background: '#f0f0f0',
                      }}
                    >
                      {item.type === "youtube" ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <img src={`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`} alt="Reel"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: 'rgba(220,38,38,0.5)'
                          }}>
                            <AiOutlinePlayCircle style={{ color: '#fff', fontSize: '22px' }} />
                          </div>
                        </div>
                      ) : item.type === "video" ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video src={item.url} muted preload="metadata"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', background: 'rgba(0,0,0,0.4)'
                          }}>
                            <AiOutlinePlayCircle style={{ color: '#fff', fontSize: '22px' }} />
                          </div>
                        </div>
                      ) : (
                        <img src={item.url} alt={`View ${index + 1}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* ── PRODUCT DETAILS ── */}
            <div className="col-12 col-lg-6">
              <div style={{
                background: '#fff',
                borderRadius: isMobile ? '20px 20px 0 0' : '20px',
                padding: isMobile ? '20px 16px 24px' : '32px',
                boxShadow: isMobile ? '0 -4px 20px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.06)',
                marginTop: isMobile ? '-16px' : '0',
                position: 'relative',
                zIndex: 2,
              }}>

                {/* Brand + Tags row */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {productState?.brand && (
                    <span style={{
                      background: '#f5f5f5', color: '#555',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>
                      {productState.brand}
                    </span>
                  )}
                  {productState?.tags && (
                    <span style={{
                      background: '#d4af37', color: '#fff',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>
                      {productState.tags}
                    </span>
                  )}
                  {productState?.category && (
                    <span style={{
                      background: '#f0f4ff', color: '#4338ca',
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600
                    }}>
                      {productState.category}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? '22px' : '30px',
                  fontWeight: 700, color: '#1a1a1a',
                  marginBottom: '14px', lineHeight: 1.25
                }}>
                  {productState?.title}
                </h1>

                {/* Price + Rating */}
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                  {/* Price row */}
                  {(() => {
                    const origPrice = productState?.price;
                    let displayPrice = origPrice;
                    let offerApplied = null;
                    for (const offer of productOffers) {
                      if (offer.offerType === 'PERCENT_OFF') {
                        displayPrice = Math.round(origPrice * (1 - offer.discountPercent / 100));
                        offerApplied = offer; break;
                      }
                      if (offer.offerType === 'FLAT_OFF') {
                        displayPrice = Math.max(0, origPrice - offer.discountAmount);
                        offerApplied = offer; break;
                      }
                      if (offer.offerType === 'BUY_X_FOR_PRICE' && quantity >= offer.buyQty) {
                        displayPrice = Math.round(offer.fixedPrice / offer.buyQty);
                        offerApplied = offer; break;
                      }
                      if (offer.offerType === 'MIN_QTY_DISCOUNT' && quantity >= offer.minQty) {
                        displayPrice = Math.round(origPrice * (1 - offer.discountPercent / 100));
                        offerApplied = offer; break;
                      }
                    }
                    const badgeText =
                      !offerApplied ? null :
                      offerApplied.offerType === 'PERCENT_OFF' ? `${offerApplied.discountPercent}% OFF` :
                      offerApplied.offerType === 'FLAT_OFF' ? `₹${offerApplied.discountAmount} OFF` :
                      offerApplied.offerType === 'BUY_X_FOR_PRICE' ? `Buy ${offerApplied.buyQty} for ₹${offerApplied.fixedPrice}` :
                      offerApplied.offerType === 'MIN_QTY_DISCOUNT' ? `${offerApplied.discountPercent}% OFF` : null;
                    return (
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        <span style={{ fontSize: isMobile ? '28px' : '34px', fontWeight: 700, color: '#d4af37', lineHeight: 1 }}>
                          ₹{displayPrice?.toLocaleString()}
                        </span>
                        {offerApplied && displayPrice < origPrice && (
                          <span style={{ fontSize: isMobile ? '16px' : '18px', color: '#bbb', textDecoration: 'line-through' }}>
                            ₹{origPrice?.toLocaleString()}
                          </span>
                        )}
                        {badgeText && (
                          <span style={{
                            fontSize: '12px', background: '#dcfce7', color: '#15803d',
                            padding: '3px 10px', borderRadius: '20px', fontWeight: 700
                          }}>
                            {badgeText}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  {/* Rating row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ReactStars count={5} size={18} value={Number(productState?.totalrating) || 0} edit={false} activeColor="#ffd700" />
                    <span style={{ color: '#888', fontSize: '13px' }}>
                      ({productState?.ratings?.length || 0} reviews)
                    </span>
                  </div>
                </div>

                {/* Stock status badges */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px',
                    background: !hasAnyStock ? '#fee2e2' : maxQuantity > 0 && maxQuantity <= 5 ? '#fff7ed' : '#dcfce7',
                    color: !hasAnyStock ? '#dc2626' : maxQuantity > 0 && maxQuantity <= 5 ? '#c2410c' : '#166534',
                  }}>
                    {!hasAnyStock ? '✕ Out of Stock' : maxQuantity > 0 && maxQuantity <= 5 ? `🔥 Only ${maxQuantity} left!` : '✓ In Stock'}
                  </span>
                  {productState?.inventory?.online && productState?.quantity > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px',
                      background: '#e0e7ff', color: '#4338ca'
                    }}>
                      ✓ Online
                    </span>
                  )}
                  {productState?.inventory?.offline && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px',
                      background: '#fef3c7', color: '#92400e'
                    }}>
                      ✓ In Store
                    </span>
                  )}
                </div>

                {/* Offer banners */}
                {productOffers.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {productOffers.map((offer, i) => {
                      const needsQty = (offer.offerType === 'MIN_QTY_DISCOUNT' && quantity < offer.minQty);
                      const needsQtyBuy = (offer.offerType === 'BUY_X_FOR_PRICE' && quantity < offer.buyQty);
                      const needsQtyFree = (offer.offerType === 'BUY_X_GET_Y_FREE' && quantity < offer.buyQty);
                      const isUnlocked = !needsQty && !needsQtyBuy && !needsQtyFree;
                      const offerDesc = offer.description || (
                        offer.offerType === 'BUY_X_GET_Y_FREE' ? `Buy ${offer.buyQty} Get ${offer.getFreeQty} Free` :
                        offer.offerType === 'BUY_X_FOR_PRICE' ? `Buy ${offer.buyQty} for ₹${offer.fixedPrice}` :
                        offer.offerType === 'FLAT_OFF' ? `Flat ₹${offer.discountAmount} off` :
                        offer.offerType === 'PERCENT_OFF' ? `${offer.discountPercent}% off` :
                        offer.offerType === 'MIN_QTY_DISCOUNT' ? `Buy ${offer.minQty}+ get ${offer.discountPercent}% off` : ''
                      );
                      const hint =
                        needsQty ? `Add ${offer.minQty - quantity} more to unlock ${offer.discountPercent}% off` :
                        needsQtyBuy ? `Add ${offer.buyQty - quantity} more to unlock` :
                        needsQtyFree ? `Add ${offer.buyQty - quantity} more to get ${offer.getFreeQty} free` : null;
                      return (
                        <div key={i} style={{
                          background: isUnlocked ? '#fff7ed' : '#f9fafb',
                          border: `1.5px dashed ${isUnlocked ? '#fb923c' : '#d1d5db'}`,
                          borderRadius: '10px', padding: '10px 14px',
                          display: 'flex', alignItems: 'flex-start', gap: '10px',
                        }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>{isUnlocked ? '🎁' : '🔒'}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700, color: isUnlocked ? '#c2410c' : '#6b7280', fontSize: '13px' }}>{offer.title}</span>
                            <p style={{ margin: 0, fontSize: '12px', color: isUnlocked ? '#9a3412' : '#9ca3af' }}>{offerDesc}</p>
                            {hint && <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>⚠️ {hint}</p>}
                          </div>
                          {isUnlocked && (
                            <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '20px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>ACTIVE</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Color selection */}
                {hasAnyStock && availableColors.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#333' }}>
                      Color {color && <span style={{ color: '#d4af37' }}>✓</span>}
                    </p>
                    <Color setColor={setColor} colorData={availableColors} selectedColor={color} />
                    {!color && (
                      <p style={{ fontSize: '12px', color: '#e67e22', marginTop: '6px', marginBottom: 0 }}>
                        Please select a color
                      </p>
                    )}
                  </div>
                )}

                {/* Size selection */}
                {hasAnyStock && color && availableSizes.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#333' }}>
                      Size {size && <span style={{ color: '#d4af37' }}>✓</span>}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {availableSizes.map((sizeOption) => {
                        const isSelected = size === sizeOption.size;
                        const isInCart = cartSizesForColor.has(sizeOption.size);
                        return (
                          <button
                            key={sizeOption.size}
                            onClick={() => setSize(sizeOption.size)}
                            style={{
                              minWidth: '52px', minHeight: '48px',
                              padding: '8px 14px',
                              border: `2px solid ${isSelected ? '#d4af37' : isInCart ? '#22c55e' : '#e5e5e5'}`,
                              backgroundColor: isSelected ? '#d4af37' : isInCart ? '#f0fdf4' : '#fff',
                              color: isSelected ? '#fff' : isInCart ? '#15803d' : '#333',
                              borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
                              fontSize: '14px', transition: 'all 0.2s', position: 'relative',
                            }}
                          >
                            {sizeOption.size}
                            {isSelected && sizeOption.quantity <= 5 && (
                              <span style={{ display: 'block', fontSize: '9px', opacity: 0.85 }}>{sizeOption.quantity} left</span>
                            )}
                            {isInCart && !isSelected && (
                              <span style={{
                                position: 'absolute', top: '-7px', right: '-7px',
                                background: '#22c55e', color: '#fff',
                                fontSize: '8px', fontWeight: 700, padding: '1px 5px',
                                borderRadius: '10px', whiteSpace: 'nowrap',
                              }}>In Cart</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity + Add to Cart */}
                <div ref={cartButtonRef} style={{ marginBottom: '12px' }}>
                  {/* Quantity row (only when in stock) */}
                  {hasAnyStock && (
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>Quantity</p>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        border: '2px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          style={{
                            background: '#f5f5f5', border: 'none',
                            padding: '12px 18px', cursor: 'pointer', fontSize: '18px', fontWeight: 600,
                            minWidth: '48px', minHeight: '48px'
                          }}
                        >−</button>
                        <input
                          type="number" min={1} max={maxQuantity}
                          className="form-control"
                          style={{ width: '56px', textAlign: 'center', border: 'none', fontWeight: 600, fontSize: '16px' }}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          value={quantity}
                        />
                        <button
                          onClick={() => setQuantity(Math.min(maxQuantity || 10, quantity + 1))}
                          style={{
                            background: '#f5f5f5', border: 'none',
                            padding: '12px 18px', cursor: 'pointer', fontSize: '18px', fontWeight: 600,
                            minWidth: '48px', minHeight: '48px'
                          }}
                        >+</button>
                      </div>
                    </div>
                  )}

                  {/* Cart button row */}
                  <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <button
                      type="button"
                      onClick={() => alreadyAdded ? navigate("/cart") : uploadCart()}
                      disabled={!hasAnyStock}
                      style={{
                        flex: 1, background: alreadyAdded ? '#1a1a1a' : '#d4af37',
                        color: alreadyAdded ? '#fff' : '#1a1a1a',
                        padding: '15px 32px', border: 'none', borderRadius: '12px',
                        fontWeight: 700, fontSize: '15px',
                        opacity: !hasAnyStock ? 0.45 : 1,
                        cursor: !hasAnyStock ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        minHeight: '52px',
                      }}
                    >
                      <AiOutlineShoppingCart style={{ fontSize: '18px' }} />
                      {alreadyAdded ? "Go to Cart" : !hasAnyStock ? "Out of Stock" : "Add to Cart"}
                    </button>

                    {!hasAnyStock && (
                      <button
                        type="button"
                        onClick={() => setShowInquiryModal(true)}
                        style={{
                          background: '#1a1a1a', color: '#fff',
                          padding: '15px 20px', borderRadius: '12px',
                          fontWeight: 700, fontSize: '14px', border: 'none',
                          cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '52px',
                        }}
                      >
                        🛍️ I Want This
                      </button>
                    )}
                  </div>
                </div>

                {/* Wishlist */}
                <button
                  onClick={handleAddToWishlist}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: isFilled ? '#fef2f2' : 'transparent',
                    border: `2px solid ${isFilled ? '#ef4444' : '#e5e5e5'}`,
                    borderRadius: '12px', padding: '13px',
                    cursor: 'pointer', transition: 'all 0.25s',
                    color: isFilled ? '#ef4444' : '#666', fontWeight: 600,
                    fontSize: '14px', marginBottom: '16px', minHeight: '50px',
                  }}
                >
                  {isFilled ? <AiFillHeart style={{ fontSize: '20px' }} /> : <AiOutlineHeart style={{ fontSize: '20px' }} />}
                  {isFilled ? "Remove from Wishlist" : "Add to Wishlist"}
                </button>

                {/* Shipping info */}
                <div style={{
                  background: '#f9f9f9', borderRadius: '12px', padding: '16px', marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MdLocalShipping style={{ fontSize: '20px', color: '#d4af37', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#333' }}>Free Shipping</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>On orders above ₹999 · Delivered in 5-10 days</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <MdLoop style={{ fontSize: '20px', color: '#d4af37', flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#333' }}>Easy Returns</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>7-day hassle-free return policy</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#555' }}>Share:</span>
                  <button
                    onClick={() => copyToClipboard(window.location.href)}
                    style={{
                      background: '#f5f5f5', border: 'none', borderRadius: '8px',
                      padding: '9px 16px', cursor: 'pointer', color: '#666',
                      fontSize: '13px', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <AiOutlineShareAlt /> Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY BOTTOM BAR (mobile only) ── */}
      <AnimatePresence>
        {showStickyCart && isMobile && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
              background: '#fff', borderTop: '1px solid #eee',
              padding: '10px 16px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
              display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#999' }}>Price</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#d4af37', lineHeight: 1 }}>
                ₹{computeDisplayPrice()?.toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => alreadyAdded ? navigate('/cart') : uploadCart()}
              disabled={!hasAnyStock}
              style={{
                flex: 1, minHeight: '48px',
                background: alreadyAdded ? '#1a1a1a' : '#d4af37',
                color: alreadyAdded ? '#fff' : '#1a1a1a',
                border: 'none', borderRadius: '12px',
                fontWeight: 700, fontSize: '15px', cursor: !hasAnyStock ? 'not-allowed' : 'pointer',
                opacity: !hasAnyStock ? 0.45 : 1,
              }}
            >
              {alreadyAdded ? "✓ Go to Cart" : !hasAnyStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={handleAddToWishlist}
              style={{
                width: '48px', height: '48px', border: `2px solid ${isFilled ? '#ef4444' : '#e5e5e5'}`,
                borderRadius: '12px', background: isFilled ? '#fef2f2' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              {isFilled
                ? <AiFillHeart style={{ fontSize: '22px', color: '#ef4444' }} />
                : <AiOutlineHeart style={{ fontSize: '22px', color: '#999' }} />
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BUNDLE SECTION ── */}
      {loadingBundles && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}
      {productBundles && productBundles.length > 0 && (
        <Container className="py-5">
          <div className="row">
            <div className="col-12">
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '22px' : '26px',
                marginBottom: '20px', paddingBottom: '14px',
                borderBottom: '2px solid #d4af37',
                display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <AiOutlineShoppingCart /> BUNDLE DEAL
                </span>
                Frequently Bought Together
              </h3>
              <div className="row g-3">
                {productBundles.map((bundle, index) => (
                  <div className="col-12 col-md-6 col-lg-4" key={index}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -6, boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}
                      style={{
                        background: '#fff', borderRadius: '16px', overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb',
                        height: '100%', display: 'flex', flexDirection: 'column'
                      }}
                    >
                      <div style={{
                        background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)',
                        padding: '14px 16px', color: '#fff'
                      }}>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>{bundle.title}</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.85 }}>
                          {bundle.products?.length} products included
                        </p>
                      </div>
                      <div style={{ padding: '14px', flex: 1 }}>
                        {bundle.products && bundle.products.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                              {item.product?.images?.[0]?.url ? (
                                <img src={item.product.images[0].url} alt={item.product.title}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: '10px', color: '#aaa' }}>No img</span>
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.product?.title}
                              </p>
                              <p style={{ margin: '2px 0', fontSize: '11px', color: '#666' }}>
                                Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                              </p>
                              {!hasProductStock(item.product) && (
                                <span style={{ background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>
                                  Out of Stock
                                </span>
                              )}
                              {item.product?.sizeStock?.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  {item.product.sizeStock.map(s => (
                                    <span key={s.size} style={{
                                      fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '5px',
                                      border: s.quantity > 0 ? '1.5px solid #667eea' : '1.5px solid #e5e5e5',
                                      color: s.quantity > 0 ? '#667eea' : '#bbb',
                                      background: s.quantity > 0 ? '#f0f0ff' : '#f5f5f5',
                                      textDecoration: s.quantity > 0 ? 'none' : 'line-through'
                                    }}>
                                      {s.size}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', marginTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#888' }}>Original</span>
                            <span style={{ fontSize: '12px', color: '#bbb', textDecoration: 'line-through' }}>₹{bundle.originalPrice?.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Bundle Price</span>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#667eea' }}>₹{bundle.bundlePrice?.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>You Save</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#22c55e' }}>
                              ₹{(bundle.originalPrice - bundle.bundlePrice)?.toLocaleString()} ({bundle.discountPercent}% OFF)
                            </span>
                          </div>
                        </div>
                        {!isBundleAvailable(bundle) && (
                          <div style={{ marginTop: '10px', padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                            Contains out-of-stock items
                          </div>
                        )}
                        <button
                          onClick={(e) => handleAddBundleToCart(e, bundle)}
                          disabled={addingBundle === bundle._id || !isBundleAvailable(bundle)}
                          style={{
                            width: '100%', marginTop: '10px', padding: '12px', border: 'none',
                            borderRadius: '10px', fontWeight: 600, cursor: (!isBundleAvailable(bundle) || addingBundle === bundle._id) ? 'not-allowed' : 'pointer',
                            background: (!isBundleAvailable(bundle) || addingBundle === bundle._id) ? '#a5b4fc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            opacity: !isBundleAvailable(bundle) ? 0.6 : 1,
                            minHeight: '46px',
                          }}
                        >
                          <AiOutlineShoppingCart />
                          {addingBundle === bundle._id ? 'Adding…' : !isBundleAvailable(bundle) ? 'Out of Stock' : 'Add Bundle to Cart'}
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

      {/* ── DESCRIPTION ── */}
      <Container className="py-4 py-lg-5">
        <div className="row">
          <div className="col-12">
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? '22px' : '26px',
              marginBottom: '20px', paddingBottom: '12px',
              borderBottom: '2px solid #d4af37'
            }}>
              Product Description
            </h3>
            <div style={{
              background: '#fff', borderRadius: '16px',
              padding: isMobile ? '18px 16px' : '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              lineHeight: 1.9, color: '#555', fontSize: isMobile ? '14px' : '15px'
            }}>
              <p dangerouslySetInnerHTML={{ __html: productState?.description }}></p>
            </div>
          </div>
        </div>
      </Container>

      {/* ── REVIEWS ── */}
      <Container className="pb-5">
        <div className="row">
          <div className="col-12">
            <h3 id="review" style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? '22px' : '26px',
              marginBottom: '20px', paddingBottom: '12px',
              borderBottom: '2px solid #d4af37'
            }}>
              Customer Reviews
            </h3>

            <div style={{
              background: '#fff', borderRadius: '16px',
              padding: isMobile ? '16px' : '28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '24px'
            }}>
              {/* Rating summary */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'flex-start',
                gap: isMobile ? '16px' : '28px',
                marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #eee'
              }}>
                <div style={{ textAlign: 'center', minWidth: isMobile ? 'auto' : '110px' }}>
                  <span style={{ fontSize: isMobile ? '44px' : '52px', fontWeight: 700, color: '#d4af37', lineHeight: 1 }}>
                    {Number(productState?.totalrating || 0).toFixed(1)}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 4px' }}>
                    <ReactStars count={5} size={18} value={Number(productState?.totalrating) || 0} edit={false} activeColor="#ffd700" />
                  </div>
                  <span style={{ color: '#888', fontSize: '13px' }}>
                    {productState?.ratings?.length || 0} Reviews
                  </span>
                </div>
                <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
                  {[5, 4, 3, 2, 1].map(s => {
                    const count = productState?.ratingStats?.[s] || 0;
                    const total = productState?.ratings?.length || 1;
                    const pct = (count / total) * 100;
                    return (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                        <span style={{ fontSize: '12px', color: '#888', width: '44px', flexShrink: 0 }}>{s} star</span>
                        <div style={{ flex: 1, height: '7px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${pct}%`, height: '100%', borderRadius: '4px',
                            background: s === 5 ? '#22c55e' : s === 4 ? '#84cc16' : s === 3 ? '#eab308' : s === 2 ? '#f97316' : '#ef4444'
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#bbb', width: '24px', textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sort + Write Review header */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: '12px', marginBottom: '20px'
              }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Write a Review</h4>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: '2px solid #eee',
                    fontSize: '13px', background: '#fff', minWidth: isMobile ? '100%' : 'auto'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                  <option value="helpful">Most Helpful</option>
                </select>
              </div>

              {/* Write review form */}
              <div style={{ paddingBottom: '24px', borderBottom: '1px solid #eee', marginBottom: '24px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#555' }}>Your Rating</p>
                  <ReactStars count={5} size={isMobile ? 36 : 32} value={star || 0} edit={true} activeColor="#ffd700" onChange={(e) => setStar(e)} />
                </div>
                <textarea
                  className="w-100 form-control"
                  rows="4"
                  placeholder="Share your experience with this product..."
                  onChange={(e) => setComment(e.target.value)}
                  value={comment || ''}
                  style={{
                    borderRadius: '12px', padding: '14px', border: '2px solid #eee',
                    fontSize: '14px', marginBottom: '14px', resize: 'vertical'
                  }}
                />
                {/* Image upload */}
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '10px' }}>Add Photos (optional)</p>
                <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleReviewImageUpload} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {reviewImages.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img src={img.url} alt={`Review ${index + 1}`} style={{ width: '76px', height: '76px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #eee' }} />
                      <button onClick={() => removeReviewImage(index)} style={{
                        position: 'absolute', top: '-7px', right: '-7px',
                        background: '#ef4444', color: '#fff', border: 'none',
                        borderRadius: '50%', width: '20px', height: '20px',
                        fontSize: '12px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>×</button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    style={{
                      width: '76px', height: '76px', border: '2px dashed #ddd',
                      borderRadius: '8px', background: '#fafafa',
                      cursor: uploadingImages ? 'not-allowed' : 'pointer',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      color: '#aaa', fontSize: '11px', gap: '4px'
                    }}
                  >
                    {uploadingImages ? <div className="spinner-border spinner-border-sm" /> : <><AiOutlineUpload style={{ fontSize: '22px' }} />Upload</>}
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={addRatingToProduct}
                  style={{
                    background: '#1a1a1a', color: '#fff', border: 'none',
                    padding: '13px 32px', borderRadius: '10px', fontWeight: 600,
                    cursor: 'pointer', fontSize: '14px',
                    width: isMobile ? '100%' : 'auto', minHeight: '48px',
                  }}
                >
                  Submit Review
                </motion.button>
              </div>

              {/* Reviews list */}
              <div>
                {(() => {
                  let sortedReviews = [...(productState?.ratings || [])];
                  switch (sortBy) {
                    case 'newest': sortedReviews.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
                    case 'oldest': sortedReviews.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)); break;
                    case 'highest': sortedReviews.sort((a, b) => (b.star || 0) - (a.star || 0)); break;
                    case 'lowest': sortedReviews.sort((a, b) => (a.star || 0) - (b.star || 0)); break;
                    case 'helpful': sortedReviews.sort((a, b) => (b.helpful || 0) - (a.helpful || 0)); break;
                    default: break;
                  }
                  return sortedReviews.length > 0 ? sortedReviews.map((item, index) => (
                    <div key={index} style={{ paddingBottom: '20px', marginBottom: '20px', borderBottom: index < sortedReviews.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '16px'
                        }}>
                          {(item.postedby?.firstname || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <ReactStars count={5} size={14} value={item?.star || 0} edit={false} activeColor="#ffd700" />
                            {item?.isVerifiedPurchase && (
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: '3px',
                                background: '#dcfce7', color: '#166534',
                                padding: '2px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: 600
                              }}>
                                <AiFillCheckCircle /> Verified
                              </span>
                            )}
                          </div>
                          <span style={{ color: '#aaa', fontSize: '12px' }}>
                            {item.postedby?.firstname || "Customer"} {item.postedby?.lastname || ""} · {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p style={{ color: '#555', lineHeight: 1.7, fontSize: '14px', marginBottom: '10px' }}>{item?.comment}</p>
                      {item?.images && item.images.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {item.images.map((img, idx) => (
                            <img key={idx} src={img.url} alt={`review-${idx}`}
                              style={{ width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }}
                              onClick={() => window.open(img.url, '_blank')} />
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleMarkHelpful(item._id, productState._id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          background: 'transparent', border: '1px solid #eee',
                          borderRadius: '20px', padding: '6px 12px',
                          cursor: 'pointer', color: '#888', fontSize: '12px'
                        }}
                      >
                        <AiOutlineLike /> Helpful ({item?.helpful || 0})
                      </button>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ color: '#bbb', fontSize: '15px' }}>No reviews yet. Be the first to review!</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ── RELATED PRODUCTS ── */}
      <Container className="pb-5">
        <div className="row mb-4">
          <div className="col-12">
            <h3 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? '22px' : '26px'
            }}>
              You May Also Like
            </h3>
          </div>
        </div>
        {popularProduct && popularProduct.length > 0 ? (
          <div className="row g-3">
            {popularProduct.slice(0, 4).map((item, index) => (
              <div className="col-6 col-sm-6 col-lg-3" key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(productUrl(item))}
                  style={{
                    background: '#fff', borderRadius: '14px', overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.07)', cursor: 'pointer', height: '100%'
                  }}
                >
                  <div style={{ position: 'relative', height: isMobile ? '180px' : '240px', overflow: 'hidden' }}>
                    {item?.images?.[0]?.url ? (
                      <img src={item.images[0].url} alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#ccc' }}>No Image</span>
                      </div>
                    )}
                    {item?.tags === 'new' && (
                      <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#1a1a1a', color: '#fff', padding: '4px 10px', fontSize: '10px', fontWeight: 600, borderRadius: '4px' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ padding: isMobile ? '10px 12px' : '14px 16px' }}>
                    <p style={{ color: '#d4af37', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                      {item?.brand}
                    </p>
                    <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '13px' : '14px', marginBottom: '8px', lineHeight: 1.35 }}>
                      {item?.title?.slice(0, isMobile ? 30 : 40)}{item?.title?.length > (isMobile ? 30 : 40) ? '…' : ''}
                    </h5>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <p style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 700, color: '#1a1a1a', marginBottom: 0 }}>
                        ₹{item?.price?.toLocaleString()}
                      </p>
                      <span style={{
                        fontSize: '10px',
                        background: item?.quantity > 0 ? '#dcfce7' : '#fee2e2',
                        color: item?.quantity > 0 ? '#166534' : '#dc2626',
                        padding: '3px 8px', borderRadius: '20px', fontWeight: 600
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
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#ccc' }}>No related products found</p>
          </div>
        )}
      </Container>

      <StockInquiryModal
        isOpen={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
        product={productState}
      />

      {/* ── ZOOM MODAL ── */}
      {isZoomed && activeMedia?.type === "image" && (
        <div
          onClick={() => setIsZoomed(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out'
          }}
        >
          <img
            src={activeMedia?.url} alt={productState?.title}
            style={{ maxWidth: '92%', maxHeight: '92%', objectFit: 'contain', borderRadius: '8px' }}
          />
          <button
            onClick={() => setIsZoomed(false)}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
              fontSize: '26px', width: '46px', height: '46px', borderRadius: '50%', cursor: 'pointer'
            }}
          >✕</button>
        </div>
      )}

      {/* ── BUNDLE SIZE SELECTION MODAL ── */}
      {bundleSizeModal && (
        <div
          onClick={() => setBundleSizeModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.64)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0.5rem', touchAction: 'none'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px 24px 0 0',
              width: '100%', maxWidth: '620px', maxHeight: '88vh',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.35)', overflow: 'hidden'
            }}
          >
            <div style={{
              padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>
                  {bundleSizeModal.title}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Configure options for {bundleSizeModal.products?.length || 0} products
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {(() => {
                  const productsWithOptions = bundleSizeModal.products?.filter(item => {
                    const p = item.product;
                    if (!p) return false;
                    return (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0)) ||
                      (p.sizeStock || []).some(s => s.quantity > 0);
                  }).length || 0;
                  const configuredCount = Object.values(bundleSelections).filter(s => s.color && s.size).length;
                  const progress = productsWithOptions > 0 ? Math.round((configuredCount / productsWithOptions) * 100) : 0;
                  return (
                    <div style={{ minWidth: '90px' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '3px' }}>
                        {configuredCount}/{productsWithOptions} done
                      </div>
                      <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#10b981', width: `${progress}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })()}
                <button
                  onClick={() => setBundleSizeModal(null)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                    background: '#f1f5f9', color: '#64748b', fontSize: '1.2rem', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >×</button>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', flex: 1, overflowY: 'auto' }}>
              {(bundleSizeModal.products || []).map((item, index) => {
                const product = item.product;
                const productId = product?._id?.toString();
                if (!productId) return (
                  <div key={`missing-${index}`} style={{ padding: '1rem', marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
                    <p style={{ margin: 0, color: '#dc2626', fontWeight: 600 }}>⚠️ Product not found</p>
                  </div>
                );

                const variantColors = (product.variants || [])
                  .filter(variant => (variant.sizeStock || []).some(s => s.quantity > 0))
                  .map(variant => variant.color).filter(Boolean);
                const hasVariantColors = variantColors.length > 0;
                const selectedColor = bundleSelections[productId]?.color;
                const sizes = hasVariantColors
                  ? ((product.variants || []).find(variant => {
                      const variantColorId = variant.color?._id || variant.color;
                      return variantColorId?.toString() === selectedColor;
                    })?.sizeStock || [])
                  : (product.sizeStock || []);
                const hasAvailableStock = sizes.some(s => s.quantity > 0) || hasVariantColors;
                const isConfigured = !hasAvailableStock || (bundleSelections[productId]?.color && bundleSelections[productId]?.size);

                return (
                  <div key={productId} data-product-id={productId} style={{
                    marginBottom: '1.25rem', padding: '1rem',
                    borderRadius: '14px', border: `2px solid ${isConfigured ? '#d1fae5' : '#fef3c7'}`,
                    background: isConfigured ? '#f0fdf4' : '#fffbeb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {product.images?.[0]?.url ? (
                        <img src={product.images[0].url} alt={product.title}
                          style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', background: '#f3f4f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>No Img</span>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.2rem', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>
                          {product.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                          Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                        </p>
                        <span style={{ fontSize: '0.7rem', color: isConfigured ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                          {isConfigured ? '✓ Configured' : '⚠️ Needs selection'}
                        </span>
                      </div>
                    </div>

                    {hasAvailableStock ? (
                      <>
                        {hasVariantColors && (
                          <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Color</label>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                              {variantColors.map((colorOption, cIndex) => {
                                const colorId = (colorOption?._id || colorOption)?.toString();
                                const isSelected = bundleSelections[productId]?.color === colorId;
                                return (
                                  <button
                                    key={colorId || cIndex}
                                    onClick={() => setBundleSelections(prev => ({ ...prev, [productId]: { ...prev[productId], color: colorId, size: null } }))}
                                    style={{
                                      width: '40px', height: '40px', borderRadius: '50%',
                                      border: isSelected ? '3px solid #eab308' : '2px solid #e5e7eb',
                                      backgroundColor: getBundleColorSwatch(colorOption),
                                      cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
                                    }}
                                    title={colorOption?.name || colorOption?.title || 'Select color'}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {sizes.length > 0 && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Size</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {sizes.map((sizeOption) => {
                                const isSelected = bundleSelections[productId]?.size === sizeOption.size;
                                const canSelect = sizeOption.quantity > 0 && (!hasVariantColors || selectedColor);
                                return (
                                  <button
                                    key={sizeOption.size}
                                    disabled={!canSelect}
                                    onClick={() => canSelect && setBundleSelections(prev => ({ ...prev, [productId]: { ...prev[productId], size: sizeOption.size } }))}
                                    style={{
                                      padding: '0.6rem 1rem', minWidth: '60px', borderRadius: '10px',
                                      fontWeight: 600, fontSize: '0.8rem',
                                      border: isSelected ? '2px solid #1e40af' : '1px solid #d1d5db',
                                      backgroundColor: isSelected ? '#1e40af' : !canSelect ? '#f3f4f6' : 'white',
                                      color: isSelected ? 'white' : !canSelect ? '#9ca3af' : '#374151',
                                      cursor: canSelect ? 'pointer' : 'not-allowed',
                                      opacity: canSelect ? 1 : 0.6, transition: 'all 0.2s'
                                    }}
                                  >
                                    {sizeOption.size}
                                    <div style={{ fontSize: '0.6rem', opacity: 0.75, marginTop: '1px' }}>
                                      {sizeOption.quantity === 0 ? 'Out of Stock' : `${sizeOption.quantity} left`}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ padding: '0.75rem', textAlign: 'center', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#166534', fontWeight: 500 }}>✓ Fixed quantity — no selection needed</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{
              padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9', background: '#fff',
              display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setBundleSizeModal(null)}
                style={{
                  padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid #d1d5db',
                  background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const incomplete = (bundleSizeModal.products || []).filter(item => {
                    const p = item.product;
                    if (!p) return true;
                    const pid = p._id?.toString();
                    const hasSizes = (p.sizeStock || []).some(s => s.quantity > 0);
                    const hasVariant = (p.variants || []).some(v => (v.sizeStock || []).some(s => s.quantity > 0));
                    if (!hasSizes && !hasVariant) return false;
                    const sel = bundleSelections[pid] || {};
                    return !sel.color || !sel.size;
                  });
                  if (incomplete.length > 0) {
                    toast.error(`Please complete selections for ${incomplete.length} product(s)`);
                    return;
                  }
                  confirmAddBundleToCart(bundleSizeModal, bundleSelections);
                }}
                style={{
                  padding: '0.8rem 1.5rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer'
                }}
              >
                ✓ Add Bundle to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleProduct;
