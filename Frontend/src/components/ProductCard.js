import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { productUrl } from "../utils/seoUrl";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist } from "../features/products/productSlilce";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { motion } from "framer-motion";

const ProductCard = ({ data }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlistState = useSelector((state) => state?.auth?.wishlist?.wishlist);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    setWishlist(wishlistState || []);
  }, [wishlistState]);

  const isInWishlist = (id) => wishlist.some((item) => item?._id === id);

  const toggleWish = (id, e) => {
    e.stopPropagation();
    dispatch(addToWishlist(id));
    if (isInWishlist(id)) {
      setWishlist(wishlist.filter((item) => item?._id !== id));
    } else {
      const product = data.find((item) => item?._id === id);
      if (product) setWishlist([...wishlist, product]);
    }
  };

  if (!data?.length) return null;

  return (
    <>
      {data.map((item, index) => {
        if (!item) return null;
        const inWish = isInWishlist(item._id);
        const discount = item.priceOriginal && item.price
          ? Math.round(((item.priceOriginal - item.price) / item.priceOriginal) * 100)
          : null;

        return (
          <motion.div
            key={item._id || index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.25), duration: 0.3 }}
            onClick={() => navigate(productUrl(item))}
            style={{ cursor: "pointer" }}
          >
            <div style={cardStyle}>
              {/* Image Area */}
              <div style={imageWrap}>
                {/* Media */}
                {item?.videos?.[0]?.url ? (
                  <video
                    src={item.videos[0].url}
                    muted loop playsInline autoPlay
                    style={mediaStyle}
                  />
                ) : item?.images?.[0]?.url ? (
                  <img
                    src={item.images[0].url}
                    alt={item.title || "product"}
                    style={mediaStyle}
                    loading="lazy"
                  />
                ) : (
                  <div style={noMediaStyle}>No Image</div>
                )}

                {/* Badges */}
                <div style={badgesWrap}>
                  {item.tags === "new" && <span style={badgeNew}>New</span>}
                  {item.tags === "sale" && <span style={badgeSale}>Sale</span>}
                  {discount >= 5 && item.tags !== "sale" && (
                    <span style={badgeSale}>-{discount}%</span>
                  )}
                </div>

                {/* Wishlist */}
                <button
                  onClick={(e) => toggleWish(item._id, e)}
                  style={wishBtn}
                  aria-label="Add to wishlist"
                >
                  {inWish
                    ? <AiFillHeart size={18} color="#ef4444" />
                    : <AiOutlineHeart size={18} color="#555" />
                  }
                </button>

                {/* Out of Stock overlay */}
                {item.quantity <= 0 && (
                  <div style={outOfStockOverlay}>
                    <span style={outOfStockText}>Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={infoWrap}>
                {item.brand && (
                  <p style={brandText}>{item.brand}</p>
                )}
                <p style={titleText}>{item.title}</p>
                <div style={priceRow}>
                  <span style={priceMain}>₹{item.price?.toLocaleString()}</span>
                  {item.priceOriginal && (
                    <span style={priceOld}>₹{item.priceOriginal?.toLocaleString()}</span>
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

/* ── Styles ── */
const cardStyle = {
  background: "#fff",
  borderRadius: 14,
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const imageWrap = {
  position: "relative",
  aspectRatio: "1/1",
  background: "#f5f5f5",
  overflow: "hidden",
};

const mediaStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const noMediaStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  color: "#bbb",
};

const badgesWrap = {
  position: "absolute",
  top: 8,
  left: 8,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const badgeBase = {
  padding: "3px 8px",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderRadius: 4,
};

const badgeNew = { ...badgeBase, background: "#1a1a1a", color: "#fff" };
const badgeSale = { ...badgeBase, background: "#ef4444", color: "#fff" };

const wishBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.92)",
  border: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  backdropFilter: "blur(4px)",
};

const outOfStockOverlay = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const outOfStockText = {
  background: "rgba(0,0,0,0.7)",
  color: "#fff",
  padding: "6px 14px",
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const infoWrap = {
  padding: "6px 8px 8px",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const brandText = {
  fontSize: 10,
  fontWeight: 700,
  color: "#d4af37",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  margin: 0,
};

const titleText = {
  fontSize: 11,
  fontWeight: 500,
  color: "#1a1a1a",
  lineHeight: 1.3,
  margin: 0,
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const priceRow = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 4,
};

const priceMain = {
  fontSize: 12,
  fontWeight: 700,
  color: "#1a1a1a",
};

const priceOld = {
  fontSize: 10,
  color: "#aaa",
  textDecoration: "line-through",
};

export default ProductCard;
