import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import Container from "../components/Container";
import BreadCrumb from "../components/BreadCrumb";
import { getSingleOrder, cancelOrder } from "../features/user/userSlice";
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiXCircle, FiChevronLeft } from "react-icons/fi";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const TIMELINE_STEPS = ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];

const statusStyle = (s) => {
  const m = {
    Delivered: { bg: "#dcfce7", color: "#166534", icon: FiCheckCircle },
    Shipped:   { bg: "#dbeafe", color: "#1e40af", icon: FiTruck },
    Ordered:   { bg: "#fef9c3", color: "#854d0e", icon: FiClock },
    Processed: { bg: "#e0e7ff", color: "#3730a3", icon: FiPackage },
    Cancelled: { bg: "#fee2e2", color: "#991b1b", icon: FiXCircle },
  };
  return m[s] || { bg: "#f3f4f6", color: "#374151", icon: FiPackage };
};

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { singleOrder, isLoading } = useSelector((s) => s?.auth);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => { if (id) dispatch(getSingleOrder(id)); }, [dispatch, id]);

  const order = singleOrder?.orders;

  if (!isLoading && !order) {
    return (
      <>
        <BreadCrumb title="Order Details" />
        <Container class1="py-5">
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <FiPackage style={{ fontSize: 52, color: "#d1d5db", marginBottom: 14 }} />
            <h6 style={{ color: "#374151", fontWeight: 700, marginBottom: 6 }}>Order Not Found</h6>
            <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 20 }}>This order doesn't exist or you don't have access.</p>
            <Link to="/my-orders" style={s.btn}>← My Orders</Link>
          </div>
        </Container>
      </>
    );
  }

  if (!order) return null;

  const fmt     = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const sc          = statusStyle(order.orderStatus);
  const StatusIcon  = sc.icon;
  const currentIdx  = TIMELINE_STEPS.indexOf(order.orderStatus);
  const paid        = order.totalPriceAfterDiscount || 0;
  const subtotal    = order.totalPrice || 0;
  const b           = order.discountBreakdown || {};
  const coinDiscount    = b.coinDiscount   || order.coinAmount || 0;
  const offerDiscount   = b.offerDiscount  || 0;
  const directDiscount  = b.directDiscount || 0;
  const originalSubtotal = subtotal + offerDiscount;
  const totalDiscount    = originalSubtotal - paid;

  const handleCancelConfirm = () => {
    dispatch(cancelOrder({ id: order._id, cancelReason: cancelReason || "Cancelled by customer" }));
    setShowCancelModal(false);
    setCancelReason("");
  };

  return (
    <>
      <BreadCrumb title={`Order #${order._id?.slice(-8).toUpperCase()}`} />
      <div style={{ background: "#f7f8fa", minHeight: "100vh", paddingBottom: 40 }}>
        <Container class1="py-3 py-md-4">

          {/* ── Back link ── */}
          <Link to="/my-orders" style={s.backLink}>
            <FiChevronLeft size={16} /> My Orders
          </Link>

          {/* ── Order Header Card ── */}
          <div style={s.card}>
            {/* Status banner */}
            <div style={{ ...s.statusBanner, background: sc.bg }}>
              <StatusIcon size={18} color={sc.color} />
              <span style={{ color: sc.color, fontWeight: 700, fontSize: 14 }}>{order.orderStatus}</span>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
              {/* Order ID + date */}
              <div style={s.row}>
                <div>
                  <p style={s.label}>Order ID</p>
                  <p style={s.value}>#{order._id?.slice(-10).toUpperCase()}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={s.label}>Placed on</p>
                  <p style={s.value}>{fmtDate(order.createdAt)}</p>
                </div>
              </div>

              {/* Payment + Total */}
              <div style={{ ...s.row, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                <div>
                  <p style={s.label}>Payment</p>
                  <p style={s.value}>{order.mode === "OFFLINE" ? "Cash on Delivery" : "Online Payment"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={s.label}>Total Paid</p>
                  <p style={{ ...s.value, color: "#16a34a", fontSize: 18 }}>{fmt(paid)}</p>
                </div>
              </div>
            </div>

            {/* ── Timeline ── */}
            <div style={{ padding: "16px 16px 16px", borderTop: "1px solid #f3f4f6", marginTop: 12 }}>
              <p style={{ ...s.label, marginBottom: 12 }}>Order Progress</p>
              <div style={{ overflowX: "auto", paddingBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "flex-start", minWidth: 360 }}>
                  {TIMELINE_STEPS.map((step, idx) => {
                    const done   = idx <= currentIdx;
                    const active = idx === currentIdx;
                    return (
                      <React.Fragment key={step}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%",
                            background: done ? "#16a34a" : "#e5e7eb",
                            border: active ? "3px solid #16a34a" : "none",
                            boxShadow: active ? "0 0 0 3px #bbf7d0" : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: done ? "#fff" : "#9ca3af", fontSize: 11, fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {done ? "✓" : idx + 1}
                          </div>
                          <span style={{
                            fontSize: 9, marginTop: 5,
                            color: done ? "#16a34a" : "#9ca3af",
                            fontWeight: active ? 700 : 400,
                            textAlign: "center", lineHeight: 1.2,
                            maxWidth: 48,
                          }}>
                            {step}
                          </span>
                        </div>
                        {idx < TIMELINE_STEPS.length - 1 && (
                          <div style={{
                            flex: 1, height: 3, marginTop: 13,
                            background: idx < currentIdx ? "#16a34a" : "#e5e7eb",
                            borderRadius: 2, minWidth: 12,
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Shipping + Tracking ── */}
          {(order.shippingAddress || order.trackingId || order.courierName) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {order.shippingAddress && (
                <div style={s.card}>
                  <div style={s.cardHead}>
                    <FiMapPin size={15} color="#6366f1" />
                    <span style={s.cardHeadText}>Delivery Address</span>
                  </div>
                  <div style={{ padding: "0 16px 14px", fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
                    <strong style={{ color: "#111827" }}>
                      {order.shippingAddress.firstname} {order.shippingAddress.lastname}
                    </strong><br />
                    {order.shippingAddress.address}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}<br />
                    {order.shippingAddress.country}
                  </div>
                </div>
              )}

              {(order.trackingId || order.courierName) && (
                <div style={s.card}>
                  <div style={s.cardHead}>
                    <FiTruck size={15} color="#6366f1" />
                    <span style={s.cardHeadText}>Shipping Details</span>
                  </div>
                  <div style={{ padding: "0 16px 14px" }}>
                    {order.courierName && (
                      <div style={s.infoRow}>
                        <span style={s.label}>Courier</span>
                        <span style={s.value}>{order.courierName}</span>
                      </div>
                    )}
                    {order.trackingId && order.trackingId !== "—" && (
                      <div style={s.infoRow}>
                        <span style={s.label}>Tracking ID</span>
                        <span style={{ ...s.value, fontFamily: "monospace" }}>{order.trackingId}</span>
                      </div>
                    )}
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noreferrer" style={s.trackBtn}>
                        <FiTruck size={13} /> Track Order
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Order Items ── */}
          <div style={{ ...s.card, marginBottom: 12 }}>
            <div style={s.cardHead}>
              <FiPackage size={15} color="#6366f1" />
              <span style={s.cardHeadText}>Order Items ({order.orderItems?.length})</span>
            </div>
            <div>
              {order.orderItems?.map((item, idx) => {
                const isLast = idx === order.orderItems.length - 1;

                if (item?.isBundle) {
                  return (
                    <div key={idx} style={{ ...s.itemRow, borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                      <div style={{ ...s.itemThumb, background: "linear-gradient(135deg,#1e1b4b,#3730a3)" }}>
                        <FiPackage style={{ color: "#fff", fontSize: 20 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={s.bundleBadge}>BUNDLE</span>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                            {item.bundleTitle || "Bundle"}
                          </span>
                        </div>
                        {item.bundleProducts?.map((bp, i) => (
                          <div key={i} style={s.bundleProduct}>
                            <span style={{ fontSize: 12, color: "#374151", fontWeight: 600 }}>{bp.title} ×{bp.quantity}</span>
                            {bp.selectedSize && <span style={s.tag}>Size {bp.selectedSize}</span>}
                          </div>
                        ))}
                        <p style={{ margin: "6px 0 0", fontSize: 12, color: "#9ca3af" }}>Qty: {item.quantity}</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={s.itemPrice}>{fmt(item.price * item.quantity)}</p>
                        <p style={s.itemEach}>{fmt(item.price)} each</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} style={{ ...s.itemRow, borderBottom: isLast ? "none" : "1px solid #f3f4f6" }}>
                    <div style={s.itemThumb}>
                      {item?.product?.images?.[0]?.url
                        ? <img src={item.product.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <FiPackage style={{ color: "#ccc", fontSize: 20 }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                        {item?.product?.title || "Product"}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                        {item?.color && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b" }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorSwatch(item.color), border: "1px solid #ddd", flexShrink: 0 }} />
                            {getReadableColorName(item.color)}
                          </span>
                        )}
                        {item?.size && <span style={s.tag}>Size {item.size}</span>}
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>Qty: {item.quantity}</span>
                      </div>
                      {item?.isFreeItem && <span style={s.freeBadge}>🎁 FREE</span>}
                      {item?.offerLabel && !item?.isFreeItem && <span style={s.offerBadge}>🏷️ {item.offerLabel}</span>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {item?.isFreeItem
                        ? <p style={{ ...s.itemPrice, color: "#16a34a" }}>FREE</p>
                        : <p style={s.itemPrice}>{fmt(item.price * item.quantity)}</p>
                      }
                      {!item?.isFreeItem && <p style={s.itemEach}>{fmt(item.price)} each</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Price Summary ── */}
          <div style={{ ...s.card, marginBottom: 16 }}>
            <div style={s.cardHead}>
              <span style={s.cardHeadText}>Price Details</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Subtotal (MRP)</span>
                <span style={{ ...s.summaryVal, textDecoration: offerDiscount > 0 ? "line-through" : "none", color: offerDiscount > 0 ? "#9ca3af" : "#111827" }}>
                  {fmt(originalSubtotal)}
                </span>
              </div>
              {offerDiscount > 0 && (
                <div style={s.summaryRow}>
                  <span style={{ ...s.summaryLabel, color: "#f97316" }}>🎁 Offer Discount</span>
                  <span style={{ ...s.summaryVal, color: "#f97316" }}>−{fmt(offerDiscount)}</span>
                </div>
              )}
              {directDiscount > 0 && (
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>🏷️ Direct Discount</span>
                  <span style={{ ...s.summaryVal, color: "#22c55e" }}>−{fmt(directDiscount)}</span>
                </div>
              )}
              <div style={s.summaryRow}>
                <span style={s.summaryLabel}>Shipping</span>
                <span style={s.summaryVal}>₹{order.gstBreakdown?.shippingCharge ?? (order.mode === "OFFLINE" ? 0 : 100)}</span>
              </div>
              {coinDiscount > 0 && (
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>🪙 Coins ({order.coinsUsed || coinDiscount})</span>
                  <span style={{ ...s.summaryVal, color: "#7c3aed" }}>−{fmt(coinDiscount)}</span>
                </div>
              )}
              {!directDiscount && !offerDiscount && !coinDiscount && totalDiscount > 0 && (
                <div style={s.summaryRow}>
                  <span style={s.summaryLabel}>Discount</span>
                  <span style={{ ...s.summaryVal, color: "#22c55e" }}>−{fmt(totalDiscount)}</span>
                </div>
              )}
              <div style={{ height: 1, background: "#f3f4f6", margin: "12px 0" }} />
              <div style={s.summaryRow}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Total Paid</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#16a34a" }}>{fmt(paid)}</span>
              </div>
            </div>
          </div>

          {/* ── Back button ── */}
          <Link to="/my-orders" style={s.btn}>← Back to My Orders</Link>

        </Container>
      </div>

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <FiXCircle size={24} color="#dc2626" />
              <h6 style={{ margin: 0, fontWeight: 700, color: "#111827" }}>Cancel Order?</h6>
            </div>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 14 }}>
              Are you sure? Stock will be restored.
              {order.coinsUsed > 0 && ` Your ${order.coinsUsed} coins will be refunded.`}
            </p>
            <textarea
              placeholder="Reason (optional)"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              rows={3}
              style={s.textarea}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }} style={s.cancelKeepBtn}>Keep Order</button>
              <button onClick={handleCancelConfirm} style={s.cancelConfirmBtn}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
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
    marginBottom: 12,
  },
  statusBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  label: {
    margin: 0,
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: 2,
  },
  value: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },
  cardHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
  },
  cardHeadText: {
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  trackBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "#16a34a",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: "none",
    marginTop: 8,
  },
  itemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: "hidden",
    background: "#f5f5f5",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  itemPrice: {
    margin: 0,
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
  },
  itemEach: {
    margin: "2px 0 0",
    fontSize: 11,
    color: "#9ca3af",
  },
  tag: {
    background: "#f3f4f6",
    color: "#374151",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },
  freeBadge: {
    display: "inline-block",
    marginTop: 4,
    background: "#dcfce7",
    color: "#15803d",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
  },
  offerBadge: {
    display: "inline-block",
    marginTop: 4,
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 20,
    border: "1px dashed #fb923c",
  },
  bundleBadge: {
    background: "#1e1b4b",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 6,
    letterSpacing: "0.5px",
  },
  bundleProduct: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "6px 10px",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: 600,
    color: "#111827",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: 13,
    color: "#6366f1",
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: 14,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    padding: "12px 24px",
    borderRadius: 12,
    textDecoration: "none",
  },
  modalOverlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 9999,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    padding: "0 0 0",
  },
  modal: {
    background: "#fff",
    borderRadius: "20px 20px 0 0",
    padding: "24px 20px 32px",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
  },
  textarea: {
    width: "100%", borderRadius: 10,
    border: "1.5px solid #e2e8f0",
    padding: "10px 12px", fontSize: 14,
    marginBottom: 16, resize: "none",
    outline: "none", boxSizing: "border-box",
  },
  cancelKeepBtn: {
    flex: 1, padding: "13px", borderRadius: 10,
    border: "1.5px solid #e2e8f0", background: "#f8fafc",
    fontWeight: 600, cursor: "pointer", fontSize: 14,
  },
  cancelConfirmBtn: {
    flex: 1, padding: "13px", borderRadius: 10,
    border: "none", background: "#dc2626", color: "#fff",
    fontWeight: 700, cursor: "pointer", fontSize: 14,
  },
};

export default OrderDetails;
