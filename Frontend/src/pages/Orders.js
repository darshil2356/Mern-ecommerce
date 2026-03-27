import React, { useEffect } from "react";
import Container from "../components/Container";
import BreadCrumb from "../components/BreadCrumb";
import { useDispatch, useSelector } from "react-redux";
import { getOrders } from "../features/user/userSlice";

const Orders = () => {
  const dispatch = useDispatch();

  const orderState = useSelector(
    (state) => state?.auth?.getorderedProduct?.orders
  );

  const customer = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;

  useEffect(() => {
    if (customer?.token) {
      dispatch(
        getOrders({
          headers: {
            Authorization: `Bearer ${customer.token}`,
          },
        })
      );
    }
  }, [dispatch]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price) => {
    return `₹ ${price?.toLocaleString("en-IN")}`;
  };

  const renderDiscountBreakdown = (order) => {
    const b = order.discountBreakdown || {};
    const hasBreakdown = b.directDiscount > 0 || b.offerDiscount > 0 || b.coinDiscount > 0;
    const totalDiscount = order.discountAmount || (order.totalPrice - order.totalPriceAfterDiscount);

    if (!hasBreakdown && totalDiscount <= 0) return null;

    return (
      <div className="d-flex flex-column align-items-end gap-1 mt-3 pt-3 border-top">
        <div className="d-flex justify-content-between w-100" style={{ maxWidth: 300 }}>
          <span className="text-muted">Subtotal</span>
          <span className="fw-semibold">{formatPrice(order.totalPrice)}</span>
        </div>

        {hasBreakdown ? (
          <>
            {b.directDiscount > 0 && (
              <div className="d-flex justify-content-between w-100" style={{ maxWidth: 300 }}>
                <span className="text-muted">🏷️ Direct Discount</span>
                <span className="text-success">-{formatPrice(b.directDiscount)}</span>
              </div>
            )}
            {b.offerDiscount > 0 && (
              <div className="d-flex justify-content-between w-100" style={{ maxWidth: 300 }}>
                <span className="text-muted">🎁 Your Offer</span>
                <span style={{ color: "#fa8c16" }}>-{formatPrice(b.offerDiscount)}</span>
              </div>
            )}
            {b.coinDiscount > 0 && (
              <div className="d-flex justify-content-between w-100" style={{ maxWidth: 300 }}>
                <span className="text-muted">🪙 Coins Redeemed</span>
                <span style={{ color: "#722ed1" }}>-{formatPrice(b.coinDiscount)}</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div className="d-flex justify-content-between w-100" style={{ maxWidth: 300 }}>
                <span className="fw-semibold text-danger">Total Savings</span>
                <span className="fw-bold text-danger">-{formatPrice(totalDiscount)}</span>
              </div>
            )}
          </>
        ) : (
          totalDiscount > 0 && (
            <div className="d-flex justify-content-between w-100" style={{ maxWidth: 300 }}>
              <span className="text-muted">Discount</span>
              <span className="text-success">-{formatPrice(totalDiscount)}</span>
            </div>
          )
        )}

        <div className="d-flex justify-content-between w-100 border-top pt-2" style={{ maxWidth: 300 }}>
          <span className="fw-bold">Total Paid</span>
          <span className="fw-bold text-success fs-5">{formatPrice(order.totalPriceAfterDiscount)}</span>
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
            <h3 className="mb-4 fw-bold">My Orders</h3>

            {!orderState || orderState.length === 0 ? (
              <div className="text-center py-5">
                <h5>No Orders Found</h5>
              </div>
            ) : (
              orderState.map((order) => (
                <div
                  key={order._id}
                  className="card mb-4 shadow-sm border-0"
                  style={{ borderRadius: "12px" }}
                >
                  {/* Order Header */}
                  <div
                    className="card-header d-flex justify-content-between align-items-center"
                    style={{ background: "#f8f9fa" }}
                  >
                    <div>
                      <small className="text-muted">Order ID</small>
                      <div className="fw-semibold">{order._id}</div>
                    </div>

                    <div>
                      <small className="text-muted">Placed On</small>
                      <div className="fw-semibold">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    <div>
                      <small className="text-muted">Total</small>
                      <div className="fw-bold text-success">
                        {formatPrice(order.totalPriceAfterDiscount)}
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        order.orderStatus === "Delivered"
                          ? "bg-success"
                          : order.orderStatus === "Ordered"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>

                  {/* Order Items */}
                  <div className="card-body">
                    {order.orderItems?.map((item) => (
                      <div
                        key={item._id}
                        className="row align-items-center mb-3 border-bottom pb-3"
                      >
                        {/* Product Image */}
                        <div className="col-md-2">
                          {item?.product?.images?.[0]?.url ? (
                            <img
                              src={item.product.images[0].url}
                              alt="product"
                              className="img-fluid rounded"
                            />
                          ) : (
                            <div
                              style={{
                                height: "80px",
                                background: "#eee",
                                borderRadius: "8px",
                              }}
                            ></div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="col-md-4">
                          <h6 className="mb-1">
                            {item?.product?.title || "Product Not Available"}
                          </h6>
                          <small className="text-muted">
                            Qty: {item.quantity}
                          </small>
                        </div>

                        {/* Price */}
                        <div className="col-md-3 fw-semibold">
                          {formatPrice(item.price)}
                        </div>

                        {/* Color */}
                        <div className="col-md-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              style={{
                                width: "20px",
                                height: "20px",
                                borderRadius: "50%",
                                backgroundColor: item?.color?.title,
                                border: "1px solid #ccc",
                              }}
                            ></div>
                            <small>{item?.color?.title}</small>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Discount Breakdown + Total */}
                    {renderDiscountBreakdown(order)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default Orders;
