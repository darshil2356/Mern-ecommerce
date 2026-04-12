import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import Container from "../components/Container";
import BreadCrumb from "../components/BreadCrumb";
import { getSingleOrder } from "../features/user/userSlice";
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { getColorSwatch, getReadableColorName } from "../utils/colorDisplay";

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { singleOrder, isLoading } = useSelector((state) => state?.auth);

  useEffect(() => {
    if (id) {
      dispatch(getSingleOrder(id));
    }
  }, [dispatch, id]);

  const order = singleOrder?.orders;

  if (isLoading) {
    return (
      <>
        <BreadCrumb title="Order Details" />
        <Container class1="home-wrapper-2 py-5">
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status" />
            <p className="mt-3" style={{ color: "#999" }}>Loading order details...</p>
          </div>
        </Container>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <BreadCrumb title="Order Details" />
        <Container class1="home-wrapper-2 py-5">
          <div className="text-center py-5">
            <FiPackage style={{ fontSize: 64, color: "#ddd", marginBottom: 16 }} />
            <h5 style={{ color: "#999", marginBottom: 8 }}>Order Not Found</h5>
            <p style={{ color: "#bbb", marginBottom: 24 }}>The order you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link to="/my-orders" className="button">View My Orders</Link>
          </div>
        </Container>
      </>
    );
  }

  const fmt = (p) => `₹${Number(p || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const statusStyle = (s) => {
    const m = {
      Delivered: { bg: "#dcfce7", color: "#166534", icon: FiCheckCircle },
      Shipped:   { bg: "#dbeafe", color: "#1e40af", icon: FiTruck },
      Ordered:   { bg: "#fef9c3", color: "#854d0e", icon: FiClock },
      Processed: { bg: "#e0e7ff", color: "#3730a3", icon: FiPackage },
      Cancelled: { bg: "#fee2e2", color: "#991b1b", icon: FiPackage },
    };
    return m[s] || { bg: "#f3f4f6", color: "#374151", icon: FiPackage };
  };

  const TIMELINE_STEPS = ["Ordered", "Processed", "Packed", "Shipped", "Out for Delivery", "Delivered"];
  const currentIdx = TIMELINE_STEPS.indexOf(order.orderStatus);

  const subtotal = order.totalPrice || 0;
  const paid = order.totalPriceAfterDiscount || 0;
  const b = order.discountBreakdown || {};
  const coinDiscount = b.coinDiscount || order.coinAmount || 0;
  const offerDiscount = b.offerDiscount || 0;
  const directDiscount = b.directDiscount || 0;
  const totalDiscount = subtotal - paid;

  return (
    <>
      <BreadCrumb title={`Order #${order._id?.slice(-10).toUpperCase()}`} />
      <Container class1="home-wrapper-2 py-5">
        <div className="row">
          <div className="col-12">
            {/* Order Header */}
            <div className="card mb-4 border-0" style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                  <div>
                    <h4 className="mb-2" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      Order #{order._id?.slice(-10).toUpperCase()}
                    </h4>
                    <p className="mb-1" style={{ color: "#666", fontSize: 14 }}>
                      Placed on {fmtDate(order.createdAt)}
                    </p>
                    <p className="mb-0" style={{ color: "#666", fontSize: 14 }}>
                      Payment: {order.mode === "OFFLINE" ? "Cash on Delivery" : "Online Payment"}
                    </p>
                  </div>
                  <div className="text-end">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      {React.createElement(statusStyle(order.orderStatus).icon, { size: 20, color: statusStyle(order.orderStatus).color })}
                      <span style={{ 
                        background: statusStyle(order.orderStatus).bg, 
                        color: statusStyle(order.orderStatus).color, 
                        padding: "6px 16px", 
                        borderRadius: 20, 
                        fontSize: 14, 
                        fontWeight: 600 
                      }}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>
                      {fmt(paid)}
                    </div>
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="mb-4">
                  <h6 className="mb-3" style={{ fontWeight: 600, color: "#374151" }}>Order Progress</h6>
                  <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "12px 0" }}>
                    {TIMELINE_STEPS.map((step, idx) => {
                      const done = idx <= currentIdx;
                      const active = idx === currentIdx;
                      const Icon = statusStyle(step).icon;
                      return (
                        <React.Fragment key={step}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: "50%",
                              background: done ? "#16a34a" : "#e5e7eb",
                              border: active ? "3px solid #16a34a" : "2px solid transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: done ? "#fff" : "#9ca3af", fontSize: 16, fontWeight: 700,
                              boxShadow: active ? "0 0 0 4px #bbf7d0" : "none",
                              transition: "all 0.3s",
                            }}>
                              {done ? <Icon size={18} /> : idx + 1}
                            </div>
                            <span style={{ 
                              fontSize: 11, 
                              marginTop: 6, 
                              color: done ? "#16a34a" : "#9ca3af", 
                              fontWeight: active ? 700 : 400, 
                              textAlign: "center", 
                              lineHeight: 1.3,
                              maxWidth: 70
                            }}>
                              {step}
                            </span>
                          </div>
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <div style={{ 
                              flex: 1, 
                              height: 3, 
                              background: idx < currentIdx ? "#16a34a" : "#e5e7eb", 
                              minWidth: 20, 
                              marginBottom: 24,
                              borderRadius: 2
                            }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Shipping & Tracking Info */}
                {(order.trackingId || order.courierName || order.shippingAddress) && (
                  <div className="row g-3 mb-4">
                    {order.shippingAddress && (
                      <div className="col-md-6">
                        <div style={{ 
                          background: "#f8fafc", 
                          border: "1px solid #e2e8f0", 
                          borderRadius: 12, 
                          padding: 16 
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <FiMapPin size={18} color="#64748b" />
                            <h6 className="mb-0" style={{ fontWeight: 600, color: "#374151" }}>Shipping Address</h6>
                          </div>
                          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
                            {order.shippingAddress?.address}<br />
                            {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
                            {order.shippingAddress?.country}
                          </div>
                        </div>
                      </div>
                    )}
                    {(order.trackingId || order.courierName) && (
                      <div className="col-md-6">
                        <div style={{ 
                          background: "#f8fafc", 
                          border: "1px solid #e2e8f0", 
                          borderRadius: 12, 
                          padding: 16 
                        }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <FiTruck size={18} color="#64748b" />
                            <h6 className="mb-0" style={{ fontWeight: 600, color: "#374151" }}>Shipping Details</h6>
                          </div>
                          {order.courierName && (
                            <div className="mb-2">
                              <span style={{ fontSize: 14, color: "#64748b" }}>Courier: </span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{order.courierName}</span>
                            </div>
                          )}
                          {order.trackingId && order.trackingId !== "—" && (
                            <div className="mb-2">
                              <span style={{ fontSize: 14, color: "#64748b" }}>Tracking ID: </span>
                              <span style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>
                                {order.trackingId}
                              </span>
                            </div>
                          )}
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-sm"
                              style={{
                                background: "#16a34a", 
                                color: "#fff", 
                                border: "none",
                                borderRadius: 8,
                                fontSize: 14,
                                fontWeight: 600,
                                padding: "6px 16px",
                                textDecoration: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6
                              }}
                            >
                              <FiTruck size={14} />
                              Track Order
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card mb-4 border-0" style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div className="card-header" style={{ background: "#f8f9fa", borderBottom: "1px solid #eee", borderRadius: "16px 16px 0 0" }}>
                <h6 className="mb-0" style={{ fontWeight: 600, color: "#374151" }}>Order Items</h6>
              </div>
              <div className="card-body p-0">
                {order.orderItems?.map((item, idx) => {
                  const isLast = idx === order.orderItems.length - 1;
                  const border = isLast ? "none" : "1px solid #f0f0f0";

                  if (item?.isBundle) {
                    return (
                      <div key={idx} style={{ borderBottom: border, padding: "20px" }}>
                        <div className="d-flex align-items-start gap-3">
                          <div style={{ 
                            width: 80, 
                            height: 80, 
                            background: "linear-gradient(135deg,#0f172a,#334155)", 
                            borderRadius: 12, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            flexShrink: 0 
                          }}>
                            <FiPackage style={{ color: "#fff", fontSize: 32 }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                              <span style={{ 
                                background: "#0f172a", 
                                color: "#fff", 
                                fontSize: 10, 
                                fontWeight: 700, 
                                padding: "4px 10px", 
                                borderRadius: 6 
                              }}>
                                BUNDLE
                              </span>
                              <span style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>
                                {item?.bundleTitle || "Bundle"}
                              </span>
                            </div>
                            <div className="d-flex flex-column gap-2 mb-3">
                              {item?.bundleProducts?.map((bp, i) => (
                                <div key={i} style={{ 
                                  padding: "12px 14px", 
                                  borderRadius: 10, 
                                  background: "#f8fafc", 
                                  border: "1px solid #e2e8f0" 
                                }}>
                                  <div style={{ fontSize: 14, color: "#0f172a", fontWeight: 600 }}>
                                    {bp.title} ×{bp.quantity}
                                  </div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                                    {bp.selectedColorLabel && (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
                                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: getColorSwatch(bp.selectedColor || bp.selectedColorLabel), border: "1px solid #cbd5e1" }} />
                                        {getReadableColorName(bp.selectedColor || bp.selectedColorLabel)}
                                      </span>
                                    )}
                                    {bp.selectedSize && (
                                      <span style={{ fontSize: 12, color: "#64748b" }}>
                                        Size: {bp.selectedSize}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 13, color: "#64748b" }}>
                              Quantity: {item.quantity}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>
                              {fmt(item.price * item.quantity)}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {fmt(item.price)} each
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={idx} style={{ borderBottom: border, padding: "20px" }}>
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: 12, 
                          overflow: "hidden", 
                          flexShrink: 0, 
                          background: "#f5f5f5" 
                        }}>
                          {item?.product?.images?.[0]?.url ? (
                            <img 
                              src={item.product.images[0].url} 
                              alt="" 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <FiPackage style={{ color: "#ccc", fontSize: 32 }} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6, color: "#0f172a" }}>
                            {item?.product?.title || "Product"}
                          </div>
                          <div className="d-flex align-items-center gap-3 flex-wrap">
                            {item?.color && (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ width: 14, height: 14, borderRadius: "50%", background: getColorSwatch(item.color), border: "1px solid #ddd", flexShrink: 0 }} />
                                <span style={{ fontSize: 14, color: "#64748b" }}>
                                  {getReadableColorName(item.color)}
                                </span>
                              </div>
                            )}
                            <span style={{ fontSize: 14, color: "#64748b" }}>
                              Qty: {item.quantity}
                            </span>
                            <span style={{ fontSize: 14, color: "#64748b" }}>
                              {fmt(item.price)} each
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 18, color: "#16a34a" }}>
                            {fmt(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Summary */}
            <div className="card border-0" style={{ borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
              <div className="card-header" style={{ background: "#f8f9fa", borderBottom: "1px solid #eee", borderRadius: "16px 16px 0 0" }}>
                <h6 className="mb-0" style={{ fontWeight: 600, color: "#374151" }}>Order Summary</h6>
              </div>
              <div className="card-body p-4">
                <div className="row">
                  <div className="col-md-8">
                    <div className="d-flex justify-content-between mb-2">
                      <span style={{ color: "#64748b", fontSize: 15 }}>Subtotal</span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{fmt(subtotal)}</span>
                    </div>
                    {order.mode !== "OFFLINE" && (
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#64748b", fontSize: 15 }}>Shipping</span>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>₹100</span>
                      </div>
                    )}
                    {directDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#64748b", fontSize: 15 }}>🏷️ Direct Discount</span>
                        <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 15 }}>-{fmt(directDiscount)}</span>
                      </div>
                    )}
                    {offerDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#64748b", fontSize: 15 }}>🎁 Offer Discount</span>
                        <span style={{ color: "#f97316", fontWeight: 600, fontSize: 15 }}>-{fmt(offerDiscount)}</span>
                      </div>
                    )}
                    {coinDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#64748b", fontSize: 15 }}>🪙 Coins Redeemed ({order.coinsUsed || coinDiscount} coins)</span>
                        <span style={{ color: "#7c3aed", fontWeight: 600, fontSize: 15 }}>-{fmt(coinDiscount)}</span>
                      </div>
                    )}
                    {!directDiscount && !offerDiscount && !coinDiscount && totalDiscount > 0 && (
                      <div className="d-flex justify-content-between mb-2">
                        <span style={{ color: "#64748b", fontSize: 15 }}>Discount</span>
                        <span style={{ color: "#22c55e", fontWeight: 600, fontSize: 15 }}>-{fmt(totalDiscount)}</span>
                      </div>
                    )}
                    <hr style={{ borderColor: "#e2e8f0", margin: "16px 0" }} />
                    <div className="d-flex justify-content-between">
                      <span style={{ fontWeight: 700, fontSize: 18, color: "#0f172a" }}>Total Paid</span>
                      <span style={{ fontWeight: 700, fontSize: 20, color: "#16a34a" }}>{fmt(paid)}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div style={{ 
                      background: "#f8fafc", 
                      border: "1px solid #e2e8f0", 
                      borderRadius: 12, 
                      padding: 16,
                      marginTop: 20
                    }}>
                      <h6 style={{ fontWeight: 600, color: "#374151", marginBottom: 12 }}>Need Help?</h6>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <FiPhone size={16} color="#64748b" />
                        <span style={{ fontSize: 14, color: "#64748b" }}>Support: +91-1234567890</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FiMail size={16} color="#64748b" />
                        <span style={{ fontSize: 14, color: "#64748b" }}>support@example.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Orders */}
            <div className="text-center mt-4">
              <Link 
                to="/my-orders" 
                className="btn"
                style={{
                  background: "#0f172a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "12px 24px",
                  fontSize: 16,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                ← Back to My Orders
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default OrderDetails;