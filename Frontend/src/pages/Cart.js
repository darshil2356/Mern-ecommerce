import React, { useEffect, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import { AiFillDelete, AiOutlineShoppingCart } from "react-icons/ai";
import { FiPackage, FiPlus, FiMinus } from "react-icons/fi";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCartProduct,
  getUserCart,
  updateCartProduct,
} from "../features/user/userSlice";
import { getConfig } from "../utils/axiosConfig";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const Cart = () => {
  const dispatch = useDispatch();
  const [productupdateDetail, setProductupdateDetail] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingItems, setDeletingItems] = useState(new Set());
  const userCartState = useSelector((state) => state.auth.cartProducts);

  useEffect(() => {
    dispatch(getUserCart(getConfig()));
  }, [dispatch]);

  useEffect(() => {
    if (productupdateDetail !== null) {
      setLoading(true);
      dispatch(updateCartProduct({
        cartItemId: productupdateDetail?.cartItemId,
        quantity: productupdateDetail?.quantity,
      }));
      setTimeout(() => {
        dispatch(getUserCart(getConfig()));
        setLoading(false);
        setProductupdateDetail(null);
      }, 500);
    }
  }, [productupdateDetail, dispatch]);

  const deleteACartProduct = (id) => {
    setDeletingItems(prev => new Set([...prev, id]));
    dispatch(deleteCartProduct({ id, config2: getConfig() }));
    setTimeout(() => {
      dispatch(getUserCart(getConfig()));
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 300);
  };

  useEffect(() => {
    if (!userCartState?.length) { setTotalAmount(0); return; }
    const sum = userCartState.reduce((acc, item) => acc + Number(item.quantity) * Number(item.price), 0);
    setTotalAmount(sum);
  }, [userCartState]);

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    setProductupdateDetail({ cartItemId, quantity: newQuantity });
  };

  return (
    <>
      <Meta title="Shopping Cart" />
      <BreadCrumb title="Shopping Cart" />

      <Container class1="cart-wrapper py-5">
        <div className="row">
          <div className="col-12">
            {/* Cart Header */}
            <div className="cart-header mb-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <AiOutlineShoppingCart size={28} className="text-primary" />
                <h2 className="mb-0 fw-bold text-dark">Your Shopping Cart</h2>
                <span className="badge bg-primary rounded-pill fs-6">
                  {userCartState?.length || 0} items
                </span>
              </div>
            </div>

            {userCartState && userCartState.length > 0 ? (
              <>
                {/* Cart Items */}
                <div className="cart-items">
                  {userCartState.map((item, index) => {
                    const isDeleting = deletingItems.has(item._id);

                    // ── BUNDLE ITEM ──
                    if (item?.isBundle) {
                      return (
                        <div
                          key={index}
                          className={`cart-item-card bundle-item mb-3 p-4 border rounded-3 shadow-sm ${
                            isDeleting ? 'deleting' : ''
                          }`}
                          style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                            color: 'white',
                            transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                            opacity: isDeleting ? 0.5 : 1,
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div className="row align-items-center">
                            <div className="col-md-2 text-center">
                              <div className="position-relative">
                                {item?.bundleProducts?.[0]?.image ? (
                                  <img
                                    src={item.bundleProducts[0].image}
                                    className="img-fluid rounded-3"
                                    alt="bundle"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    className="d-flex align-items-center justify-content-center rounded-3"
                                    style={{
                                      width: '80px',
                                      height: '80px',
                                      background: 'rgba(255,255,255,0.2)',
                                      backdropFilter: 'blur(10px)'
                                    }}
                                  >
                                    <FiPackage size={32} />
                                  </div>
                                )}
                                <span className="badge bg-warning text-dark position-absolute top-0 start-0 rounded-pill">
                                  BUNDLE
                                </span>
                              </div>
                            </div>

                            <div className="col-md-4">
                              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                                <h5 className="fw-bold mb-0">{item?.bundleTitle}</h5>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "rgba(250,204,21,0.18)", color: "#fde68a", border: "1px solid rgba(250,204,21,0.28)" }}>
                                  Curated Bundle
                                </span>
                              </div>
                              <div className="bundle-products d-flex flex-column gap-2">
                                {item?.bundleProducts?.map((bp, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      padding: "10px 12px",
                                      borderRadius: 12,
                                      background: "rgba(255,255,255,0.1)",
                                      border: "1px solid rgba(255,255,255,0.12)"
                                    }}
                                  >
                                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                                      <span style={{ fontWeight: 700, fontSize: 13 }}>{bp.title}</span>
                                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: "rgba(255,255,255,0.15)" }}>
                                        Qty {bp.quantity}
                                      </span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                                      {bp.selectedColorLabel && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.92)" }}>
                                          <span style={{ width: 12, height: 12, borderRadius: "50%", background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel), border: "1px solid rgba(255,255,255,0.35)" }} />
                                          Selected color
                                        </span>
                                      )}
                                      {bp.selectedSize && (
                                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.92)" }}>
                                          Size {bp.selectedSize}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="col-md-2 text-center">
                              <div className="price-display">
                                <h4 className="text-warning fw-bold mb-0">₹{item?.price}</h4>
                                <small className="text-light">per bundle</small>
                              </div>
                            </div>

                            <div className="col-md-2 text-center">
                              <div className="quantity-controls d-flex align-items-center justify-content-center gap-2">
                                <button
                                  className="btn btn-outline-light btn-sm rounded-circle"
                                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                  disabled={loading}
                                >
                                  <FiMinus size={16} />
                                </button>
                                <span className="fw-bold px-3">{item?.quantity}</span>
                                <button
                                  className="btn btn-outline-light btn-sm rounded-circle"
                                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                  disabled={loading}
                                >
                                  <FiPlus size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="col-md-1 text-center">
                              <h5 className="text-warning fw-bold mb-0">₹{item?.quantity * item?.price}</h5>
                            </div>

                            <div className="col-md-1 text-center">
                              <button
                                className="btn btn-outline-light btn-sm rounded-circle"
                                onClick={() => deleteACartProduct(item?._id)}
                                disabled={isDeleting}
                              >
                                <AiFillDelete size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // ── REGULAR PRODUCT ITEM ──
                    return (
                      <div
                        key={index}
                        className={`cart-item-card regular-item mb-3 p-4 border rounded-3 shadow-sm bg-white ${
                          isDeleting ? 'deleting' : ''
                        }`}
                        style={{
                          transform: isDeleting ? 'scale(0.95)' : 'scale(1)',
                          opacity: isDeleting ? 0.5 : 1,
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div className="row align-items-center">
                          <div className="col-md-2 text-center">
                            <div className="position-relative">
                              <img
                                src={item?.productId?.images?.[0]?.url}
                                className="img-fluid rounded-3"
                                alt="product"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                              <span className="badge bg-primary position-absolute top-0 end-0 rounded-circle">
                                {item?.quantity}
                              </span>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <h5 className="fw-bold text-dark mb-2">{item?.productId?.title}</h5>
                            <div className="product-details">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <span className="text-muted">Color:</span>
                                <div
                                  className="color-indicator rounded-circle border"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: getColorSwatch(item?.color),
                                    border: '2px solid #dee2e6'
                                  }}
                                ></div>
                                <span className="fw-medium">{getReadableColorName(item?.color)}</span>
                              </div>
                              {item?.size && (
                                <div className="d-flex align-items-center gap-2">
                                  <span className="text-muted">Size:</span>
                                  <span className="badge bg-secondary rounded-pill px-3 py-1">
                                    {item.size}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="col-md-2 text-center">
                            <div className="price-display">
                              <h5 className="text-primary fw-bold mb-0">₹{item?.price}</h5>
                              <small className="text-muted">per item</small>
                            </div>
                          </div>

                          <div className="col-md-2 text-center">
                            <div className="quantity-controls d-flex align-items-center justify-content-center gap-2">
                              <button
                                className="btn btn-outline-primary btn-sm rounded-circle"
                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                disabled={loading}
                              >
                                <FiMinus size={16} />
                              </button>
                              <input
                                type="number"
                                className="form-control text-center"
                                style={{ width: '60px', fontWeight: 'bold' }}
                                value={item?.quantity}
                                onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                                min="1"
                                max="10"
                                disabled={loading}
                              />
                              <button
                                className="btn btn-outline-primary btn-sm rounded-circle"
                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                disabled={loading}
                              >
                                <FiPlus size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="col-md-1 text-center">
                            <h5 className="text-success fw-bold mb-0">₹{item?.quantity * item?.price}</h5>
                          </div>

                          <div className="col-md-1 text-center">
                            <button
                              className="btn btn-outline-danger btn-sm rounded-circle"
                              onClick={() => deleteACartProduct(item?._id)}
                              disabled={isDeleting}
                            >
                              <AiFillDelete size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cart Summary */}
                <div className="cart-summary mt-5 p-4 bg-light rounded-3 shadow-sm">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <Link to="/product" className="btn btn-outline-primary btn-lg px-4 py-3 rounded-pill">
                        <FiPlus className="me-2" />
                        Continue Shopping
                      </Link>
                    </div>
                    <div className="col-md-6 text-end">
                      <div className="summary-details mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted fs-5">Subtotal ({userCartState.length} items):</span>
                          <span className="fw-bold fs-4 text-primary">₹{totalAmount}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted">Shipping:</span>
                          <span className="text-success">Calculated at checkout</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted">Taxes:</span>
                          <span className="text-success">Calculated at checkout</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold fs-5">Estimated Total:</span>
                          <span className="fw-bold fs-3 text-success">₹{totalAmount}</span>
                        </div>
                      </div>
                      <Link
                        to="/checkout"
                        className="btn btn-primary btn-lg px-5 py-3 rounded-pill w-100"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                      >
                        Proceed to Checkout
                        <AiOutlineShoppingCart className="ms-2" size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Empty Cart State */
              <div className="empty-cart text-center py-5">
                <div className="empty-cart-icon mb-4">
                  <AiOutlineShoppingCart size={80} className="text-muted" />
                </div>
                <h3 className="text-muted mb-3">Your cart is empty</h3>
                <p className="text-muted mb-4">Looks like you haven't added anything to your cart yet.</p>
                <Link
                  to="/product"
                  className="btn btn-primary btn-lg px-5 py-3 rounded-pill"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Start Shopping
                </Link>
              </div>
            )}
          </div>
        </div>
      </Container>

      <style jsx>{`
        .cart-item-card {
          transition: all 0.3s ease;
        }

        .cart-item-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }

        .cart-item-card.deleting {
          animation: fadeOut 0.3s ease forwards;
        }

        .quantity-controls button {
          transition: all 0.2s ease;
        }

        .quantity-controls button:hover {
          transform: scale(1.1);
        }

        .empty-cart-icon {
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }

        .cart-summary {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 1px solid #dee2e6;
        }

        .bundle-item {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
        }

        .bundle-item .badge {
          background: rgba(255,255,255,0.9) !important;
          color: #667eea !important;
        }
      `}</style>
    </>
  );
};

export default Cart;
