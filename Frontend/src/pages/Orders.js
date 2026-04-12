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

    // Get first product image or bundle indicator
    const firstItem = order.orderItems?.[0];
    let displayImage = null;
    let displayTitle = "Order Items";
    if (firstItem) {
      if (firstItem.isBundle) {
        displayTitle = firstItem.bundleTitle || "Bundle";
      } else {
        displayImage = firstItem.product?.images?.[0]?.url;
        displayTitle = firstItem.product?.title || "Product";
      }
    }

    return (
      <div
        key={order._id}
        className="card mb-3 border-0"
        style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", cursor: "pointer" }}
        onClick={() => window.location.href = `/my-orders/${order._id}`}
      >
        <div
          className="d-flex justify-content-between align-items-center p-4"
          style={{ background: "#fff" }}
        >
          {/* Left side - Image and basic info */}
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <div style={{ 
              width: 60, 
              height: 60, 
              borderRadius: 12, 
              overflow: "hidden", 
              background: "#f5f5f5",
              flexShrink: 0
            }}>
              {displayImage ? (
                <img src={displayImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FiPackage style={{ color: "#ccc", fontSize: 24 }} />
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>
                Order #{order._id?.slice(-10).toUpperCase()}
              </div>
              <div style={{ fontWeight: 600, fontSize: 16, color: "#0f172a", marginBottom: 2 }}>
                {displayTitle}
              </div>
              <div style={{ fontSize: 14, color: "#64748b" }}>
                {order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''} • {fmtDate(order.createdAt)}
              </div>
            </div>
          </div>

          {/* Right side - Status and price */}
          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <div className="text-end">
              <div style={{ fontWeight: 700, fontSize: 18, color: "#16a34a", marginBottom: 2 }}>
                {fmt(paid)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {order.mode === "OFFLINE" ? "Cash on Delivery" : "Online Payment"}
              </div>
            </div>
            <span style={{ 
              background: sc.bg, 
              color: sc.color, 
              padding: "6px 14px", 
              borderRadius: 20, 
              fontSize: 12, 
              fontWeight: 600,
              whiteSpace: "nowrap"
            }}>
              {order.orderStatus}
            </span>
            <div style={{ color: "#64748b", fontSize: 18 }}>
              →
            </div>
          </div>
        </div>

        {/* Quick timeline preview */}
        <div style={{ background: "#f8fafc", padding: "12px 20px", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "hidden" }}>
            {TIMELINE_STEPS.map((step, idx) => {
              const done = idx <= TIMELINE_STEPS.indexOf(order.orderStatus);
              return (
                <React.Fragment key={step}>
                  <div style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: "50%", 
                    background: done ? "#16a34a" : "#e5e7eb",
                    flexShrink: 0
                  }} />
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div style={{ 
                      flex: 1, 
                      height: 2, 
                      background: idx < TIMELINE_STEPS.indexOf(order.orderStatus) ? "#16a34a" : "#e5e7eb", 
                      minWidth: 12,
                      maxWidth: 24
                    }} />
                  )}
                </React.Fragment>
              );
            })}
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
