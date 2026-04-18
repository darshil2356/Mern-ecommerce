import React, { useEffect, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import { AiFillDelete } from "react-icons/ai";
import { FiPackage, FiPlus, FiMinus, FiShoppingBag, FiArrowRight, FiTag, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { deleteCartProduct, getUserCart, updateCartProduct } from "../features/user/userSlice";
import { getConfig } from "../utils/axiosConfig";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";
import trackingService from "../utils/trackingService";
import { toast } from "react-toastify";

const Cart = () => {
  const dispatch = useDispatch();
  const [productupdateDetail, setProductupdateDetail] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingItems, setDeletingItems] = useState(new Set());
  const userCartState = useSelector((state) => state.auth.cartProducts);

  useEffect(() => { dispatch(getUserCart(getConfig())); }, [dispatch]);

  useEffect(() => {
    if (productupdateDetail !== null) {
      setLoading(true);
      dispatch(updateCartProduct({ cartItemId: productupdateDetail?.cartItemId, quantity: productupdateDetail?.quantity }));
      setTimeout(() => {
        dispatch(getUserCart(getConfig()));
        setLoading(false);
        setProductupdateDetail(null);
      }, 500);
    }
  }, [productupdateDetail, dispatch]);

  const deleteACartProduct = (id) => {
    // Find the product being removed for tracking
    const productToRemove = userCartState.find(item => item._id === id);
    if (productToRemove) {
      trackingService.trackRemoveFromCart(
        productToRemove.productId?._id || productToRemove.productId,
        productToRemove.productId?.title || productToRemove.title,
        productToRemove.quantity
      );
    }

    setDeletingItems(prev => new Set([...prev, id]));
    dispatch(deleteCartProduct({ id, config2: getConfig() }));
    setTimeout(() => {
      dispatch(getUserCart(getConfig()));
      setDeletingItems(prev => { const s = new Set(prev); s.delete(id); return s; });
    }, 300);
  };

  useEffect(() => {
    if (!userCartState?.length) { setTotalAmount(0); return; }
    // Exclude free items from total
    setTotalAmount(userCartState.reduce((acc, item) => {
      if (item.isFreeItem) return acc;
      return acc + Number(item.quantity) * Number(item.price);
    }, 0));
  }, [userCartState]);

  const offerSavings = userCartState?.reduce((acc, item) => {
    if (item.isFreeItem) return acc + Number(item.originalPrice || 0) * Number(item.quantity);
    if (item.offerLabel && item.originalPrice && item.originalPrice > item.price)
      return acc + (item.originalPrice - item.price) * item.quantity;
    return acc;
  }, 0) || 0;

  // Per-offer savings breakdown for the summary panel
  const offerBreakdown = userCartState?.reduce((acc, item) => {
    const label = item.offerLabel;
    if (!label) return acc;
    let saving = 0;
    if (item.isFreeItem) saving = Number(item.originalPrice || 0) * Number(item.quantity);
    else if (item.originalPrice && item.originalPrice > item.price)
      saving = (item.originalPrice - item.price) * item.quantity;
    if (saving <= 0) return acc;
    acc[label] = (acc[label] || 0) + saving;
    return acc;
  }, {}) || {};

  const updateQuantity = (cartItemId, newQuantity, maxStock) => {
    if (newQuantity < 1) return;
    if (maxStock !== undefined && newQuantity > maxStock) {
      toast.error(`Only ${maxStock} in stock`);
      return;
    }
    setProductupdateDetail({ cartItemId, quantity: newQuantity });
  };

  // Get available stock for a cart item (checks variant+size or top-level)
  const getItemStock = (item) => {
    const product = item?.productId;
    if (!product) return Infinity;
    const colorId = (item?.color?._id || item?.color)?.toString();
    const size = item?.size;
    if (product.variants?.length > 0 && colorId) {
      const variant = product.variants.find(v =>
        (v.color?._id || v.color)?.toString() === colorId
      );
      if (variant && size) {
        return variant.sizeStock?.find(s => s.size === size)?.quantity ?? 0;
      }
      if (variant) return variant.sizeStock?.reduce((s, e) => s + (e.quantity || 0), 0) ?? 0;
    }
    if (product.sizeStock?.length > 0 && size) {
      return product.sizeStock.find(s => s.size === size)?.quantity ?? 0;
    }
    return product.quantity ?? Infinity;
  };

  const hasItems = userCartState && userCartState.length > 0;

  return (
    <>
      <Meta title="Shopping Cart" />
      <BreadCrumb title="Cart" />

      {/* Page background */}
      <div style={{ background: '#f7f8fa', minHeight: '100vh', paddingBottom: hasItems ? 100 : 24 }}>
        <Container class1="cart-wrapper py-3 py-md-5">

          {/* ── Header ── */}
          <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4">
            <div className="d-flex align-items-center gap-2">
              <div style={s.iconBox}>
                <FiShoppingBag size={18} color="#6366f1" />
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ color: '#111827', fontSize: 17 }}>My Cart</h5>
                <p className="mb-0" style={{ color: '#9ca3af', fontSize: 12 }}>{userCartState?.length || 0} items</p>
              </div>
            </div>
            <Link to="/product" style={s.ghostBtn}>
              + Add more
            </Link>
          </div>

          {hasItems ? (
            <div className="row g-3 g-md-4">

              {/* ── Cart Items Column ── */}
              <div className="col-12 col-lg-8">
                <div className="d-flex flex-column gap-3">
                  {userCartState.map((item, index) => {
                    const isDeleting = deletingItems.has(item._id);

                    /* ── BUNDLE CARD ── */
                    if (item?.isBundle) {
                      return (
                        <div key={index} style={{ ...s.bundleCard, opacity: isDeleting ? 0.4 : 1, transform: isDeleting ? 'scale(0.97)' : 'scale(1)' }}>
                          {/* Top row */}
                          <div className="d-flex gap-3 align-items-start">
                            <div style={s.bundleThumb}>
                              {item?.bundleProducts?.[0]?.image
                                ? <img src={item.bundleProducts[0].image} alt="bundle" style={s.thumbImg} />
                                : <div style={s.thumbPlaceholder}><FiPackage size={22} color="rgba(255,255,255,0.6)" /></div>
                              }
                              <span style={s.bundlePill}>Bundle</span>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="d-flex align-items-start justify-content-between gap-2">
                                <h6 style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4, lineHeight: 1.3 }}>{item?.bundleTitle}</h6>
                                <button style={s.deleteBtnDark} onClick={() => deleteACartProduct(item?._id)} disabled={isDeleting}>
                                  <AiFillDelete size={14} />
                                </button>
                              </div>
                              <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
                                ₹{(item?.quantity * item?.price)?.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Bundle products */}
                          <div className="d-flex flex-column gap-2 mt-3">
                            {item?.bundleProducts?.map((bp, i) => (
                              <div key={i} style={s.bundleRow}>
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-1">
                                  <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 12 }}>{bp.title}</span>
                                  <span style={s.bundleTag}>×{bp.quantity}</span>
                                </div>
                                <div className="d-flex gap-2 mt-1 flex-wrap">
                                  {bp.selectedColorLabel && (
                                    <span style={s.bundleTag}>
                                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel), display: 'inline-block', flexShrink: 0 }} />
                                      {bp.selectedColorLabel}
                                    </span>
                                  )}
                                  {bp.selectedSize && <span style={s.bundleTag}>Size {bp.selectedSize}</span>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Qty row */}
                          <div className="d-flex align-items-center justify-content-between mt-3">
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>₹{item?.price} per bundle</span>
                            <div style={s.qtyPill}>
                              <button style={s.qtyBtnDark} onClick={() => updateQuantity(item._id, item.quantity - 1)} disabled={loading}><FiMinus size={12} /></button>
                              <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center' }}>{item?.quantity}</span>
                              <button style={s.qtyBtnDark} onClick={() => updateQuantity(item._id, item.quantity + 1, getItemStock(item))} disabled={loading}><FiPlus size={12} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    /* ── REGULAR PRODUCT CARD ── */
                    return (
                      <div key={index} style={{ ...s.card, opacity: isDeleting ? 0.4 : 1, transform: isDeleting ? 'scale(0.97)' : 'scale(1)', border: item.isFreeItem ? '1.5px solid #22c55e' : '1px solid #f3f4f6' }}>
                        {/* Free item banner */}
                        {item.isFreeItem && (
                          <div style={s.freeBanner}>
                            🎁 FREE ITEM — {item.offerLabel || 'Offer Applied'}
                            {item.originalPrice > 0 && (
                              <span style={{ marginLeft: 6, background: '#15803d', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>
                                Worth ₹{(item.originalPrice * item.quantity).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Offer price-reduction banner */}
                        {!item.isFreeItem && item.offerLabel && (
                          <div style={s.offerBanner}>
                            🏷️ {item.offerLabel}
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span style={{ marginLeft: 6, background: '#c2410c', color: '#fff', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>
                                Save ₹{((item.originalPrice - item.price) * item.quantity).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="d-flex gap-3">
                          {/* Image */}
                          <div style={s.productThumb}>
                            <img src={item?.productId?.images?.[0]?.url} alt="product" style={s.thumbImg} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="d-flex align-items-start justify-content-between gap-2">
                              <h6 style={{ color: '#111827', fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {item?.productId?.title}
                              </h6>
                              {/* Only allow delete on non-free items */}
                              {!item.isFreeItem && (
                                <button style={s.deleteBtn} onClick={() => deleteACartProduct(item?._id)} disabled={isDeleting}>
                                  <AiFillDelete size={14} />
                                </button>
                              )}
                            </div>

                            {/* Color + Size */}
                            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 12, height: 12, borderRadius: '50%', background: getColorSwatch(item?.color), border: '1.5px solid #e5e7eb', flexShrink: 0 }} />
                                <span style={{ fontSize: 12, color: '#6b7280' }}>{getReadableColorName(item?.color)}</span>
                              </div>
                              {item?.size && <span style={s.sizePill}>{item.size}</span>}
                            </div>

                            {/* Price + Qty */}
                            <div className="d-flex align-items-center justify-content-between mt-1">
                              <div>
                                {item.isFreeItem ? (
                                  <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 16 }}>FREE</span>
                                ) : (
                                  <>
                                    <span style={{ color: '#6366f1', fontWeight: 800, fontSize: 16 }}>
                                      ₹{(item?.quantity * item?.price)?.toLocaleString()}
                                    </span>
                                    {item.offerLabel && item.originalPrice && item.originalPrice > item.price ? (
                                      <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 5, textDecoration: 'line-through' }}>
                                        ₹{(item?.quantity * item.originalPrice)?.toLocaleString()}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#9ca3af', fontSize: 11, marginLeft: 5 }}>
                                        ₹{item?.price} each
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              {/* Qty controls only for non-free items */}
                              {!item.isFreeItem && (
                                <div style={s.qtyPillLight}>
                                  <button style={s.qtyBtnLight} onClick={() => updateQuantity(item._id, item.quantity - 1)} disabled={loading}><FiMinus size={12} /></button>
                                  <span style={{ color: '#111827', fontWeight: 700, fontSize: 14, minWidth: 22, textAlign: 'center' }}>{item?.quantity}</span>
                                  <button
                                    style={{
                                      ...s.qtyBtnLight,
                                      opacity: item.quantity >= getItemStock(item) ? 0.4 : 1,
                                      cursor: item.quantity >= getItemStock(item) ? 'not-allowed' : 'pointer',
                                    }}
                                    onClick={() => updateQuantity(item._id, item.quantity + 1, getItemStock(item))}
                                    disabled={loading || item.quantity >= getItemStock(item)}
                                  >
                                    <FiPlus size={12} />
                                  </button>
                                </div>
                              )}
                              {item.isFreeItem && (
                                <span style={s.freeQtyBadge}>×{item.quantity}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon hint — visible on mobile below items */}
                <div style={{ ...s.couponBox, marginTop: 16 }} className="d-lg-none">
                  <FiTag size={14} color="#6366f1" />
                  <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>Have a coupon? Apply at checkout</span>
                  <FiChevronRight size={14} color="#6366f1" style={{ marginLeft: 'auto' }} />
                </div>
              </div>

              {/* ── Order Summary — Desktop sidebar ── */}
              <div className="col-12 col-lg-4 d-none d-lg-block">
                <div style={s.summaryCard}>
                  <h6 style={{ fontWeight: 700, color: '#111827', marginBottom: 20, fontSize: 16 }}>Order Summary</h6>

                  <div className="d-flex flex-column gap-3 mb-3">
                    <div style={s.summaryRow}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>MRP ({userCartState.length} items)</span>
                      <span style={{ fontWeight: 600, color: offerSavings > 0 ? '#9ca3af' : '#111827', textDecoration: offerSavings > 0 ? 'line-through' : 'none' }}>₹{(totalAmount + offerSavings)?.toLocaleString()}</span>
                    </div>
                    {/* Offer savings breakdown */}
                    {offerSavings > 0 && (
                      <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', border: '1px dashed #86efac' }}>
                        <div style={{ ...s.summaryRow, marginBottom: Object.keys(offerBreakdown).length > 0 ? 6 : 0 }}>
                          <span style={{ color: '#16a34a', fontSize: 13, fontWeight: 700 }}>🎁 Total Offer Savings</span>
                          <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 14 }}>-₹{offerSavings.toLocaleString()}</span>
                        </div>
                        {Object.entries(offerBreakdown).map(([label, amt]) => (
                          <div key={label} style={{ ...s.summaryRow, marginTop: 4 }}>
                            <span style={{ color: '#15803d', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                              {label}
                            </span>
                            <span style={{ color: '#15803d', fontSize: 11, fontWeight: 700 }}>-₹{amt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={s.summaryRow}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Subtotal</span>
                      <span style={{ fontWeight: 600, color: '#111827' }}>₹{totalAmount?.toLocaleString()}</span>
                    </div>
                    <div style={s.summaryRow}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Shipping</span>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>Calculated at checkout</span>
                    </div>
                    <div style={s.summaryRow}>
                      <span style={{ color: '#6b7280', fontSize: 14 }}>Taxes</span>
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>At checkout</span>
                    </div>
                  </div>

                  <div style={s.divider} />

                  <div style={{ ...s.summaryRow, margin: '16px 0 20px' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Total</span>
                    <span style={{ fontWeight: 800, fontSize: 22, color: '#6366f1' }}>₹{totalAmount?.toLocaleString()}</span>
                  </div>

                  <Link to="/checkout" style={s.checkoutBtn}>
                    Proceed to Checkout <FiArrowRight size={16} style={{ marginLeft: 8 }} />
                  </Link>

                  <div style={{ ...s.couponBox, marginTop: 14 }}>
                    <FiTag size={14} color="#6366f1" />
                    <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 500 }}>Have a coupon? Apply at checkout</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* ── Empty State ── */
            <div style={s.emptyWrap}>
              <div style={s.emptyIconCircle}>
                <FiShoppingBag size={40} color="#d1d5db" />
              </div>
              <h5 style={{ color: '#374151', fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h5>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 28 }}>Browse our collection and add items you love!</p>
              <Link to="/product" style={s.checkoutBtn}>
                Start Shopping <FiArrowRight size={16} style={{ marginLeft: 8 }} />
              </Link>
            </div>
          )}

        </Container>
      </div>

      {/* ── Sticky Bottom Bar — Mobile only ── */}
      {hasItems && (
        <div style={s.stickyBar} className="d-lg-none">
          <div style={s.stickyInner}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', lineHeight: 1 }}>Total</p>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>₹{totalAmount?.toLocaleString()}</p>
              {offerSavings > 0 && (
                <p style={{ margin: 0, fontSize: 10, color: '#16a34a', fontWeight: 700, lineHeight: 1.2 }}>🎁 Saving ₹{offerSavings.toLocaleString()}</p>
              )}
            </div>
            <Link to="/checkout" style={s.stickyCheckoutBtn}>
              Checkout <FiArrowRight size={16} style={{ marginLeft: 6 }} />
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 480px) {
          .cart-wrapper { padding-left: 12px !important; padding-right: 12px !important; }
        }
        button:active { transform: scale(0.93) !important; }
      `}</style>
    </>
  );
};

/* ── Styles ── */
const s = {
  iconBox: {
    width: 38, height: 38,
    background: '#eef2ff', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  ghostBtn: {
    fontSize: 13, color: '#6366f1', fontWeight: 600,
    textDecoration: 'none', padding: '7px 14px',
    borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe',
    whiteSpace: 'nowrap',
  },

  /* Product card */
  card: {
    background: '#fff', borderRadius: 16, padding: 16,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6',
    transition: 'all 0.25s ease',
  },
  productThumb: {
    width: 88, height: 88, borderRadius: 12, overflow: 'hidden',
    flexShrink: 0, background: '#f9fafb', border: '1px solid #f3f4f6',
  },
  thumbImg: { width: '100%', height: '100%', objectFit: 'cover' },

  deleteBtn: {
    background: '#fff0f0', border: '1px solid #fecaca', borderRadius: '50%',
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#ef4444', flexShrink: 0, padding: 0,
  },
  deleteBtnDark: {
    background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#fca5a5', flexShrink: 0, padding: 0,
  },

  sizePill: {
    background: '#f3f4f6', color: '#374151', fontSize: 11,
    fontWeight: 700, padding: '2px 9px', borderRadius: 20,
  },
  freeBanner: {
    background: 'linear-gradient(90deg, #dcfce7, #bbf7d0)',
    color: '#15803d', fontSize: 11, fontWeight: 700,
    padding: '5px 12px', borderRadius: '8px 8px 0 0',
    marginBottom: 10, letterSpacing: '0.3px',
  },
  offerBanner: {
    background: 'linear-gradient(90deg, #fff7ed, #ffedd5)',
    color: '#c2410c', fontSize: 11, fontWeight: 700,
    padding: '5px 12px', borderRadius: '8px 8px 0 0',
    marginBottom: 10, letterSpacing: '0.3px',
    border: '1px dashed #fb923c',
  },
  freeQtyBadge: {
    background: '#dcfce7', color: '#15803d',
    fontWeight: 700, fontSize: 13, padding: '4px 12px', borderRadius: 20,
  },

  qtyPillLight: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: '#f9fafb', borderRadius: 30, padding: '3px 6px',
    border: '1px solid #e5e7eb',
  },
  qtyBtnLight: {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%',
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#374151', padding: 0,
  },

  /* Bundle card */
  bundleCard: {
    background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
    borderRadius: 16, padding: 16,
    boxShadow: '0 4px 20px rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.3)',
    transition: 'all 0.25s ease',
  },
  bundleThumb: {
    width: 72, height: 72, borderRadius: 12, overflow: 'hidden',
    flexShrink: 0, position: 'relative',
  },
  thumbPlaceholder: {
    width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12,
  },
  bundlePill: {
    position: 'absolute', bottom: 5, left: 5,
    background: '#fbbf24', color: '#1e1b4b',
    fontSize: 8, fontWeight: 800, padding: '2px 6px',
    borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  bundleRow: {
    background: 'rgba(255,255,255,0.07)', borderRadius: 10,
    padding: '8px 10px', border: '1px solid rgba(255,255,255,0.1)',
  },
  bundleTag: {
    background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)',
    fontSize: 11, padding: '2px 8px', borderRadius: 20,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  },
  qtyPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.1)', borderRadius: 30, padding: '3px 6px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  qtyBtnDark: {
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#fff', padding: 0,
  },

  /* Summary */
  summaryCard: {
    background: '#fff', borderRadius: 20, padding: '24px 20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6',
    position: 'sticky', top: 20,
  },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, background: '#f3f4f6', margin: '4px 0' },

  checkoutBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    padding: '14px 20px', borderRadius: 14, textDecoration: 'none',
    boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
  },
  couponBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#eef2ff', borderRadius: 10, padding: '10px 14px',
    border: '1px dashed #c7d2fe', cursor: 'pointer',
  },

  /* Empty */
  emptyWrap: {
    textAlign: 'center', padding: '60px 20px',
    background: '#fff', borderRadius: 20, border: '1px solid #f3f4f6',
  },
  emptyIconCircle: {
    width: 88, height: 88, background: '#f9fafb', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
  },

  /* Sticky bottom bar */
  stickyBar: {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
    background: '#fff', borderTop: '1px solid #f3f4f6',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
    padding: '12px 16px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  },
  stickyInner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    maxWidth: 480, margin: '0 auto',
  },
  stickyCheckoutBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    padding: '13px 28px', borderRadius: 14, textDecoration: 'none',
    boxShadow: '0 4px 15px rgba(99,102,241,0.35)', flex: 1,
    whiteSpace: 'nowrap',
  },
};

export default Cart;
