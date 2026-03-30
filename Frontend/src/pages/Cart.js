import React, { useEffect, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import { AiFillDelete } from "react-icons/ai";
import { FiPackage } from "react-icons/fi";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCartProduct,
  getUserCart,
  updateCartProduct,
} from "../features/user/userSlice";
import { getConfig } from "../utils/axiosConfig";

const Cart = () => {
  const dispatch = useDispatch();
  const [productupdateDetail, setProductupdateDetail] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const userCartState = useSelector((state) => state.auth.cartProducts);

  useEffect(() => {
    dispatch(getUserCart(getConfig()));
  }, []);

  useEffect(() => {
    if (productupdateDetail !== null) {
      dispatch(updateCartProduct({
        cartItemId: productupdateDetail?.cartItemId,
        quantity: productupdateDetail?.quantity,
      }));
      setTimeout(() => dispatch(getUserCart(getConfig())), 200);
    }
  }, [productupdateDetail]);

  const deleteACartProduct = (id) => {
    dispatch(deleteCartProduct({ id, config2: getConfig() }));
    setTimeout(() => dispatch(getUserCart(getConfig())), 200);
  };

  useEffect(() => {
    if (!userCartState?.length) { setTotalAmount(0); return; }
    const sum = userCartState.reduce((acc, item) => acc + Number(item.quantity) * Number(item.price), 0);
    setTotalAmount(sum);
  }, [userCartState]);

  return (
    <>
      <Meta title="Cart" />
      <BreadCrumb title="Cart" />
      <Container class1="cart-wrapper home-wrapper-2 py-5">
        <div className="row">
          <div className="col-12">
            {/* Header */}
            <div className="cart-header py-3 d-flex justify-content-between align-items-center">
              <h4 className="cart-col-1">Product</h4>
              <h4 className="cart-col-2">Price</h4>
              <h4 className="cart-col-3">Quantity</h4>
              <h4 className="cart-col-4">Total</h4>
            </div>

            {userCartState && userCartState.map((item, index) => {
              // ── BUNDLE ITEM ──
              if (item?.isBundle) {
                return (
                  <div key={index} className="cart-data py-3 mb-2 d-flex justify-content-between align-items-center">
                    <div className="cart-col-1 gap-15 d-flex align-items-center">
                      {/* Bundle icon / first product image */}
                      <div className="w-25" style={{ position: "relative" }}>
                        {item?.bundleProducts?.[0]?.image ? (
                          <img
                            src={item.bundleProducts[0].image}
                            className="img-fluid"
                            alt="bundle"
                            style={{ borderRadius: "8px" }}
                          />
                        ) : (
                          <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg,#667eea,#764ba2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FiPackage style={{ color: "#fff", fontSize: "28px" }} />
                          </div>
                        )}
                        {/* Bundle badge */}
                        <span style={{ position: "absolute", top: "-6px", left: "-6px", background: "#667eea", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                          BUNDLE
                        </span>
                      </div>
                      <div className="w-75">
                        <p style={{ fontWeight: 600, marginBottom: "4px" }}>{item?.bundleTitle}</p>
                        {/* Show included products */}
                        {item?.bundleProducts?.map((bp, i) => (
                          <p key={i} style={{ fontSize: "12px", color: "#666", marginBottom: "2px" }}>
                            • {bp.title} × {bp.quantity}
                          </p>
                        ))}
                        <span style={{ fontSize: "11px", background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                          Bundle Deal
                        </span>
                      </div>
                    </div>
                    <div className="cart-col-2">
                      <h5 className="price">Rs. {item?.price}</h5>
                      {/* Show original vs bundle saving */}
                      {item?.bundleProducts && (
                        <p style={{ fontSize: "11px", color: "#22c55e", margin: 0, fontWeight: 600 }}>
                          Bundle Price
                        </p>
                      )}
                    </div>
                    <div className="cart-col-3 d-flex align-items-center gap-15">
                      <div>
                        <input
                          className="form-control"
                          type="number"
                          min={1}
                          max={10}
                          value={item?.quantity}
                          onChange={(e) => setProductupdateDetail({ cartItemId: item?._id, quantity: e.target.value })}
                        />
                      </div>
                      <div>
                        <AiFillDelete onClick={() => deleteACartProduct(item?._id)} className="text-danger" style={{ cursor: "pointer", fontSize: "18px" }} />
                      </div>
                    </div>
                    <div className="cart-col-4">
                      <h5 className="price">Rs. {item?.quantity * item?.price}</h5>
                    </div>
                  </div>
                );
              }

              // ── REGULAR PRODUCT ITEM ──
              return (
                <div key={index} className="cart-data py-3 mb-2 d-flex justify-content-between align-items-center">
                  <div className="cart-col-1 gap-15 d-flex align-items-center">
                    <div className="w-25">
                      <img
                        src={item?.productId?.images?.[0]?.url}
                        className="img-fluid"
                        alt="product"
                      />
                    </div>
                    <div className="w-75">
                      <p>{item?.productId?.title}</p>
                      <p className="d-flex gap-3">
                        Color:
                        <ul className="colors ps-0">
                          <li style={{ backgroundColor: item?.color?.title }}></li>
                        </ul>
                      </p>
                    </div>
                  </div>
                  <div className="cart-col-2">
                    <h5 className="price">Rs. {item?.price}</h5>
                  </div>
                  <div className="cart-col-3 d-flex align-items-center gap-15">
                    <div>
                      <input
                        className="form-control"
                        type="number"
                        name={"quantity" + item?._id}
                        min={1}
                        max={10}
                        id={"card" + item?._id}
                        value={item?.quantity}
                        onChange={(e) => setProductupdateDetail({ cartItemId: item?._id, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <AiFillDelete onClick={() => deleteACartProduct(item?._id)} className="text-danger" style={{ cursor: "pointer", fontSize: "18px" }} />
                    </div>
                  </div>
                  <div className="cart-col-4">
                    <h5 className="price">Rs. {item?.quantity * item?.price}</h5>
                  </div>
                </div>
              );
            })}

            {(!userCartState || userCartState.length === 0) && (
              <div className="text-center py-5">
                <FiPackage style={{ fontSize: "60px", color: "#ddd", marginBottom: "16px" }} />
                <p style={{ color: "#999", fontSize: "16px" }}>Your cart is empty</p>
                <Link to="/product" className="button">Continue Shopping</Link>
              </div>
            )}
          </div>

          {userCartState && userCartState.length > 0 && (
            <div className="col-12 py-2 mt-4">
              <div className="d-flex justify-content-between align-items-baseline">
                <Link to="/product" className="button">Continue To Shopping</Link>
                <div className="d-flex flex-column align-items-end">
                  <h4>SubTotal: Rs. {totalAmount}</h4>
                  <p>Taxes and shipping calculated at checkout</p>
                  <Link to="/checkout" className="button">Checkout</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export default Cart;
