import React, { useEffect, useRef, useCallback } from "react";
import Container from "../components/Container";
import BreadCrumb from "../components/BreadCrumb";
import { useDispatch, useSelector } from "react-redux";
import { getOrders } from "../features/user/userSlice";
import { FiPackage, FiShoppingBag } from "react-icons/fi";
import { Link } from "react-router-dom";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const LIMIT = 10;

const Orders = () => {
  const dispatch = useDispatch();
  const isLoading   = useSelector((state) => state?.auth?.isLoading);
  const ordersData  = useSelector((state) => state?.auth?.getorderedProduct);
  const orders      = ordersData?.orders  || [];
  const hasMore     = ordersData?.hasMore ?? false;
  const currentPage = ordersData?.page    || 0;

  // Sentinel ref for IntersectionObserver
  const sentinelRef = useRef(null);

  // Load page 1 on mount
  useEffect(() => {
    dispatch(getOrders({ page: 1, limit: LIMIT }));
  }, [dispatch]);

  // IntersectionObserver — fires when sentinel enters viewport
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      dispatch(getOrders({ page: currentPage + 1, limit: LIMIT }));
    }
  }, [dispatch, isLoading, hasMore, currentPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── helpers ──
  const fmt = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const statusStyle = (s) => {
    const m = {
      Delivered: { bg: "#dcfce7", color: "#166534" },
      Shipped:   { bg: "#dbeafe", color: "#1e40af" },
      Ordered:   { bg: "#fef9c3", color: "#854d0e" },
      Processed: { bg: "#e0e7ff", color: "#3730a3" },
      Cancelled: { bg: "#fee2e2", color: "#991b1b" },
    };
    return m[s] || { bg: "#f3f4f6", color: "#374151" };
  };

  const TIMELINE_STEPS = ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

  const renderTimeline = (order) => {
    const currentIdx = TIMELINE_STEPS.indexOf(order.orderStatus);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "12px 0 4px" }}>
        {TIMELINE_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <React.Fragment key={step}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 72 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: done ? "#16a34a" : "#e5e7eb",
                  border: active ? "3px solid #16a34a" : "2px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: done ? "#fff" : "#9ca3af", fontSize: 13, fontWeight: 700,
                  boxShadow: active ? "0 0 0 4px #bbf7d0" : "none",
                  transition: "all 0.3s",
                }}>
                  {done ? "✓" : idx + 1}
                </div>
                <span style={{ fontSize: 10, marginTop: 4, color: done ? "#16a34a" : "#9ca3af", fontWeight: active ? 700 : 400, textAlign: "center", lineHeight: 1.2 }}>
                  {step}
                </span>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div style={{ flex: 1, height: 3, background: idx < currentIdx ? "#16a34a" : "#e5e7eb", minWidth: 16, marginBottom: 18 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ── render one order card ──
  const renderOrder = (order) => {
    const subtotal     = order.totalPrice || 0;
    const paid         = order.totalPriceAfterDiscount || 0;
    const b            = order.discountBreakdown || {};
    const coinDiscount = b.coinDiscount   || order.coinAmount || 0;
    const offerDiscount= b.offerDiscount  || 0;
    const directDiscount = b.directDiscount || 0;
    const totalDiscount  = subtotal - paid;
    const sc = statusStyle(order.orderStatus);

    return (
      <div
        key={order._id}
        className="card mb-4 border-0"
        style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}
      >
        {/* Header */}
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3"
          style={{ background: "#f8f9fa", borderBottom: "1px solid #eee" }}
        >
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>Order ID</div>
            <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>
              #{order._id?.slice(-10).toUpperCase()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>Placed On</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(order.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1 }}>Total Paid</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#16a34a" }}>{fmt(paid)}</div>
          </div>
          <span style={{ background: sc.bg, color: sc.color, padding: "5px 16px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {order.orderStatus}
          </span>
        </div>

        {/* Tracking Timeline */}
        <div className="px-4 pt-3 pb-0">
          {renderTimeline(order)}
        </div>

        {/* Shiprocket Tracking Info */}
        {(order.trackingId || order.courierName) && (
          <div className="px-4 pb-3 pt-2 d-flex align-items-center gap-3 flex-wrap"
            style={{ background: "#f0fdf4", borderTop: "1px solid #dcfce7" }}>
            {order.courierName && (
              <span style={{ fontSize: 13, color: "#166534" }}>
                🚚 <strong>{order.courierName}</strong>
              </span>
            )}
            {order.trackingId && order.trackingId !== "—" && (
              <span style={{ fontSize: 12, color: "#555", fontFamily: "monospace" }}>
                Tracking: {order.trackingId}
              </span>
            )}
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "#16a34a", color: "#fff", padding: "5px 14px",
                  borderRadius: 20, fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}
              >
                📦 Track Order
              </a>
            )}
          </div>
        )}

        {/* Items */}
        <div className="card-body px-4 py-3">
          {order.orderItems?.map((item, idx) => {
            const isLast = idx === order.orderItems.length - 1;
            const border = isLast ? "none" : "1px solid #f0f0f0";

            if (item?.isBundle) {
              return (
                <div key={idx} className="d-flex align-items-start gap-3 mb-3 pb-3" style={{ borderBottom: border, padding: "10px 12px", borderRadius: 14, background: "#f8fafc" }}>
                  <div style={{ width: 64, height: 64, background: "linear-gradient(135deg,#0f172a,#334155)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FiPackage style={{ color: "#fff", fontSize: 26 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span style={{ background: "#0f172a", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>BUNDLE</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{item?.bundleTitle || "Bundle"}</span>
                    </div>
                    <div className="d-flex flex-column gap-2 mt-2">
                      {item?.bundleProducts?.map((bp, i) => (
                        <div key={i} style={{ padding: "8px 10px", borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
                          <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{bp.title} ×{bp.quantity}</div>
                          <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                            {bp.selectedColorLabel && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel), border: "1px solid #cbd5e1" }} />
                                Color selected
                              </span>
                            )}
                            {bp.selectedSize && <span style={{ fontSize: 12, color: "#64748b" }}>Size {bp.selectedSize}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Qty: {item.quantity}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(item.price * item.quantity)}</div>
                    <div style={{ fontSize: 11, color: "#0f766e", fontWeight: 700 }}>Bundle Price</div>
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} className="d-flex align-items-center gap-3 mb-3 pb-3" style={{ borderBottom: border }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f5f5f5" }}>
                  {item?.product?.images?.[0]?.url ? (
                    <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FiPackage style={{ color: "#ccc", fontSize: 24 }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item?.product?.title || "Product"}</div>
                  <div className="d-flex align-items-center gap-2">
                    {item?.color && (
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: getColorSwatch(item.color), border: "1px solid #ddd", flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 12, color: "#999" }}>
                      {item?.color ? `${getReadableColorName(item.color)} • ` : ""}Qty: {item.quantity}
                    </span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>• {fmt(item.price)} each</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(item.price * item.quantity)}</div>
                </div>
              </div>
            );
          })}

          {/* Price summary */}
          <div className="mt-2 pt-3" style={{ borderTop: "2px solid #f0f0f0" }}>
            <div className="d-flex justify-content-between mb-1">
              <span style={{ color: "#666", fontSize: 14 }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
            </div>
            {order.mode !== "OFFLINE" && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>Shipping</span>
                <span style={{ fontWeight: 600 }}>₹100</span>
              </div>
            )}
            {directDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>🏷️ Direct Discount</span>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>-{fmt(directDiscount)}</span>
              </div>
            )}
            {offerDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>🎁 Offer Discount</span>
                <span style={{ color: "#f97316", fontWeight: 600 }}>-{fmt(offerDiscount)}</span>
              </div>
            )}
            {coinDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>🪙 Coins Redeemed ({order.coinsUsed || coinDiscount} coins)</span>
                <span style={{ color: "#7c3aed", fontWeight: 600 }}>-{fmt(coinDiscount)}</span>
              </div>
            )}
            {!directDiscount && !offerDiscount && !coinDiscount && totalDiscount > 0 && (
              <div className="d-flex justify-content-between mb-1">
                <span style={{ color: "#666", fontSize: 14 }}>Discount</span>
                <span style={{ color: "#22c55e", fontWeight: 600 }}>-{fmt(totalDiscount)}</span>
              </div>
            )}
            <div className="d-flex justify-content-between mt-2 pt-2" style={{ borderTop: "1px solid #eee" }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Total Paid</span>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>{fmt(paid)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <BreadCrumb title="My Orders" />
      <Container class1="home-wrapper-2 py-5">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h3 className="fw-bold mb-0" style={{ fontFamily: "'Playfair Display', serif" }}>
                My Orders
              </h3>
              {ordersData?.total > 0 && (
                <span style={{ fontSize: 13, color: "#999" }}>
                  Showing {orders.length} of {ordersData.total} orders
                </span>
              )}
            </div>

            {/* Initial loading */}
            {isLoading && orders.length === 0 && (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status" />
                <p className="mt-3" style={{ color: "#999" }}>Loading your orders...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && orders.length === 0 && (
              <div className="text-center py-5">
                <FiShoppingBag style={{ fontSize: 64, color: "#ddd", marginBottom: 16 }} />
                <h5 style={{ color: "#999", marginBottom: 8 }}>No Orders Found</h5>
                <p style={{ color: "#bbb", marginBottom: 24 }}>You haven't placed any orders yet.</p>
                <Link to="/product" className="button">Start Shopping</Link>
              </div>
            )}

            {/* Orders list */}
            {orders.map(renderOrder)}

            {/* Sentinel — IntersectionObserver watches this */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* Loading more spinner */}
            {isLoading && orders.length > 0 && (
              <div className="text-center py-4">
                <div className="spinner-border text-warning spinner-border-sm" role="status" />
                <span className="ms-2" style={{ color: "#999", fontSize: 14 }}>Loading more orders...</span>
              </div>
            )}

            {/* End of list */}
            {!hasMore && orders.length > 0 && (
              <div className="text-center py-3">
                <span style={{ fontSize: 13, color: "#bbb" }}>— You've seen all your orders —</span>
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default Orders;
