import React, { useEffect, useRef, useCallback } from "react";
import Container from "../components/Container";
import BreadCrumb from "../components/BreadCrumb";
import { useDispatch, useSelector } from "react-redux";
import { getOrders } from "../features/user/userSlice";
import { FiPackage, FiShoppingBag, FiChevronRight } from "react-icons/fi";
import { Link } from "react-router-dom";

const LIMIT = 10;

const TIMELINE_STEPS = ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

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

const Orders = () => {
  const dispatch    = useDispatch();
  const isLoading   = useSelector((s) => s?.auth?.isLoading);
  const ordersData  = useSelector((s) => s?.auth?.getorderedProduct);
  const orders      = ordersData?.orders  || [];
  const hasMore     = ordersData?.hasMore ?? false;
  const currentPage = ordersData?.page    || 0;
  const sentinelRef = useRef(null);

  useEffect(() => { dispatch(getOrders({ page: 1, limit: LIMIT })); }, [dispatch]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) dispatch(getOrders({ page: currentPage + 1, limit: LIMIT }));
  }, [dispatch, isLoading, hasMore, currentPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  const fmt     = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const renderOrder = (order) => {
    const paid       = order.totalPriceAfterDiscount || 0;
    const sc         = statusStyle(order.orderStatus);
    const currentIdx = TIMELINE_STEPS.indexOf(order.orderStatus);
    const firstItem  = order.orderItems?.[0];
    const displayImage = firstItem?.isBundle ? null : firstItem?.product?.images?.[0]?.url;
    const displayTitle = firstItem?.isBundle
      ? (firstItem.bundleTitle || "Bundle")
      : (firstItem?.product?.title || "Product");

    return (
      <Link
        key={order._id}
        to={`/my-orders/${order._id}`}
        style={{ textDecoration: "none", display: "block", marginBottom: 12 }}
      >
        <div style={s.card}>
          {/* ── Top row ── */}
          <div style={s.cardTop}>
            {/* Thumbnail */}
            <div style={s.thumb}>
              {displayImage
                ? <img src={displayImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <FiPackage style={{ color: "#ccc", fontSize: 22 }} />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.orderId}>#{order._id?.slice(-8).toUpperCase()}</p>
              <p style={s.title}>{displayTitle.length > 36 ? displayTitle.slice(0, 36) + "…" : displayTitle}</p>
              <p style={s.meta}>
                {order.orderItems?.length} item{order.orderItems?.length !== 1 ? "s" : ""} · {fmtDate(order.createdAt)}
              </p>
            </div>

            {/* Right: price + status + arrow */}
            <div style={s.right}>
              <p style={s.price}>{fmt(paid)}</p>
              <span style={{ ...s.badge, background: sc.bg, color: sc.color }}>{order.orderStatus}</span>
              <FiChevronRight size={16} color="#9ca3af" style={{ marginTop: 4 }} />
            </div>
          </div>

          {/* ── Mini progress bar ── */}
          <div style={s.progressWrap}>
            {TIMELINE_STEPS.map((_, idx) => {
              const done = idx <= currentIdx;
              const isLast = idx === TIMELINE_STEPS.length - 1;
              return (
                <React.Fragment key={idx}>
                  <div style={{ ...s.dot, background: done ? "#16a34a" : "#e5e7eb" }} />
                  {!isLast && <div style={{ ...s.line, background: idx < currentIdx ? "#16a34a" : "#e5e7eb" }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      <BreadCrumb title="My Orders" />
      <div style={{ background: "#f7f8fa", minHeight: "100vh", paddingBottom: 32 }}>
        <Container class1="py-3 py-md-4">

          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.headerIcon}><FiShoppingBag size={18} color="#6366f1" /></div>
              <div>
                <h5 style={s.headerTitle}>My Orders</h5>
                {ordersData?.total > 0 && (
                  <p style={s.headerSub}>{orders.length} of {ordersData.total} orders</p>
                )}
              </div>
            </div>
          </div>

          {/* Empty */}
          {!isLoading && orders.length === 0 && (
            <div style={s.empty}>
              <FiShoppingBag style={{ fontSize: 52, color: "#d1d5db", marginBottom: 14 }} />
              <h6 style={{ color: "#374151", fontWeight: 700, marginBottom: 6 }}>No Orders Yet</h6>
              <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20 }}>You haven't placed any orders yet.</p>
              <Link to="/product" style={s.shopBtn}>Start Shopping</Link>
            </div>
          )}

          {/* List */}
          {orders.map(renderOrder)}

          {/* Sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} />

          {/* Loading more */}
          {isLoading && orders.length > 0 && (
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "12px 0" }}>Loading more…</p>
          )}

          {/* End */}
          {!hasMore && orders.length > 0 && (
            <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 12, padding: "12px 0" }}>— All orders loaded —</p>
          )}
        </Container>
      </div>

      <style>{`
        @media (max-width: 400px) {
          .ord-title { font-size: 13px !important; }
        }
      `}</style>
    </>
  );
};

const s = {
  card: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
  },
  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 14px 10px",
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    background: "#f5f5f5",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  orderId: {
    margin: 0,
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: 2,
  },
  title: {
    margin: 0,
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.3,
    marginBottom: 3,
  },
  meta: {
    margin: 0,
    fontSize: 12,
    color: "#9ca3af",
  },
  right: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 4,
  },
  price: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  progressWrap: {
    display: "flex",
    alignItems: "center",
    padding: "8px 14px 10px",
    borderTop: "1px solid #f9fafb",
    background: "#fafafa",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  line: {
    flex: 1,
    height: 2,
    minWidth: 8,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    background: "#eef2ff",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    margin: 0,
    fontWeight: 700,
    color: "#111827",
    fontSize: 17,
  },
  headerSub: {
    margin: 0,
    fontSize: 12,
    color: "#9ca3af",
  },
  empty: {
    textAlign: "center",
    padding: "48px 20px",
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #f3f4f6",
  },
  shopBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: 12,
    textDecoration: "none",
  },
};

export default Orders;
