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
