import React, { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { BsSearch } from "react-icons/bs";
import compare from "../images/compare.svg";
import wishlist from "../images/wishlist.svg";
import user from "../images/user.svg";
import cart from "../images/cart.svg";
import menu from "../images/menu.svg";
import { useDispatch, useSelector } from "react-redux";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { getAProduct } from "../features/products/productSlilce";
import { getUserCart } from "../features/user/userSlice";

const Header = () => {
  // ... your exact same state/effects/logic (no changes)
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const authState = useSelector((state) => state?.auth);
  const [total, setTotal] = useState(null);
  const [paginate, setPaginate] = useState(true);
  const productState = useSelector((state) => state?.product?.product);
  const navigate = useNavigate();

  const getTokenFromLocalStorage = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;

  const config2 = {
    headers: {
      Authorization: `Bearer ${
        getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""
      }`,
      Accept: "application/json",
    },
  };

  useEffect(() => {
    dispatch(getUserCart(config2));
  }, []);

  const [productOpt, setProductOpt] = useState([]);
  useEffect(() => {
    let sum = 0;
    for (let index = 0; index < cartState?.length; index++) {
      sum = sum + Number(cartState[index].quantity) * cartState[index].price;
      setTotal(sum);
    }
  }, [cartState]);

  useEffect(() => {
    let data = [];
    for (let index = 0; index < productState?.length; index++) {
      const element = productState[index];
      data.push({ id: index, prod: element?._id, name: element?.title });
    }
    setProductOpt(data);
  }, [productState]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <header className="header-top-strip py-3">
        <div className="container-xxl">
          <div className="row">
            <div className="col-6">
              <p className="text-white mb-0">Free Shipping Over Rs.100</p>
            </div>
            <div className="col-6">
              <p className="text-end text-white mb-0">
                Hotline:
                <a className="text-white" href="tel:+91 8264954234">
                  +91 8264954234
                </a>
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <header className="header-upper py-3">
        <div className="container-xxl">
          <div className="row align-items-center gx-1 gx-sm-2 gx-md-3 g-0"> {/* Tight gutters, no row gap */}
            <div className="col-auto pe-1 pe-sm-2"> {/* Logo auto-shrink first */}
              <h2 className="mb-0">
                <Link className="text-white text-decoration-none fs-4 fs-md-3" to="/">
                  Cart Corner
                </Link>
              </h2>
            </div>
            <div className="col flex-grow-1 px-1 px-sm-2"> {/* Search grows, fills space */}
              <div className="input-group flex-nowrap w-100">
                <Typeahead
                  id="pagination-example"
                  onPaginate={() => console.log("Results paginated")}
                  onChange={(selected) => {
                    navigate(`/product/${selected[0]?.prod}`);
                    dispatch(getAProduct(selected[0]?.prod));
                  }}
                  options={productOpt}
                  paginate={paginate}
                  labelKey={"name"}
                  placeholder="Search for Products here"
                />
                <span className="input-group-text p-2 p-md-3 border-0 flex-shrink-0" id="basic-addon2">
                  <BsSearch className="fs-6" />
                </span>
              </div>
            </div>
            <div className="col-auto ps-1 ps-sm-2"> {/* Right links auto-shrink, tight padding */}
              <div className="header-upper-links d-flex align-items-center gap-1 gap-sm-2 gap-md-3 justify-content-end flex-nowrap"> {/* No wrap, tight gaps */}
                {/* Wishlist */}
                <Link to="/wishlist" className="d-flex align-items-center gap-1 gap-sm-2 text-white text-decoration-none flex-shrink-0 header-upper-link">
                  <img src={wishlist} alt="wishlist" className="header-img" />
                  <p className="mb-0 text-nowrap d-none d-md-block link-text">Favourite wishlist</p> {/* Hide text <md, no br */}
                </Link>
                {/* User */}
                <Link
                  to={authState?.user === null ? "/login" : "my-profile"}
                  className="d-flex align-items-center gap-1 gap-sm-2 text-white text-decoration-none flex-shrink-0 header-upper-link"
                >
                  <img src={user} alt="user" className="header-img" />
                  {authState?.user === null ? (
                    <p className="mb-0 text-nowrap d-none d-md-block link-text">Log in My Account</p>
                  ) : (
                    <p className="mb-0 text-nowrap d-none d-md-block link-text small">Welcome {authState?.user?.firstname}</p>
                  )}
                </Link>
                {/* Cart */}
                <Link to="/cart" className="d-flex align-items-center gap-1 gap-sm-2 text-white text-decoration-none flex-shrink-0 header-upper-link">
                  <img src={cart} alt="cart" className="header-img" />
                  <div className="d-flex flex-column gap-1 align-items-end">
                    <span className="badge bg-white text-dark rounded-pill fs-9 fs-sm-8 flex-shrink-0">
                      {cartState?.length ? cartState?.length : 0}
                    </span>
                    <p className="mb-0 d-none d-lg-block link-text very-small">
                      Rs. {!cartState?.length ? 0 : total ? total : 0}
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <header className="header-bottom py-3">
        <div className="container-xxl">
          <div className="row">
            <div className="col-12">
              <div className="menu-bottom d-flex align-items-center gap-15 gap-md-30 justify-content-between flex-wrap">
                <div className="flex-shrink-0">
                  <div className="dropdown">
                    <button
                      className="btn btn-secondary dropdown-toggle bg-transparent border-0 gap-10 gap-md-15 d-flex align-items-center text-white fw-normal"
                      type="button"
                      id="dropdownMenuButton1"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <img src={menu} alt="" className="header-img-sm" />
                      <span className="d-none d-sm-inline me-2 me-md-5">Shop Categories</span>
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                      {productState &&
                        productState.map((item, index) => (
                          <li key={index}>
                            <Link className="dropdown-item" to={`/category/${item.category}`} state={{category: item.category}}>
                              {item?.category}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
                <div className="menu-links d-flex align-items-center gap-10 gap-md-15 flex-grow-1 justify-content-center justify-content-md-end ms-0 ms-md-auto">
                  <NavLink to="/" className="text-white text-decoration-none nav-text">Home</NavLink>
                  <NavLink to="/product" className="text-white text-decoration-none nav-text">Our Store</NavLink>
                  <NavLink to="/my-orders" className="text-white text-decoration-none nav-text">My Orders</NavLink>
                  <NavLink to="/blogs" className="text-white text-decoration-none nav-text">Blogs</NavLink>
                  <NavLink to="/contact" className="text-white text-decoration-none nav-text">Contact</NavLink>
                  {authState?.user !== null ? (
                    <button
                      className="border border-0 bg-transparent text-white text-uppercase px-2 py-1 rounded fw-bold logout-btn ms-2"
                      type="button"
                      onClick={handleLogout}
                    >
                      LogOut
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        /* Pure responsive squeezes, no colors changed */
        .header-img { width: 22px; height: 22px; flex-shrink: 0; }
        .header-img-sm { width: 20px; height: 20px; }
        .link-text { font-size: 0.8rem; }
        .very-small { font-size: 0.7rem; }
        .nav-text { font-size: 0.9rem; white-space: nowrap; }
        .header-upper-link:hover { opacity: 0.8; }
        @media (max-width: 991.98px) {
          .header-upper-links { gap: 0.25rem !important; }
          .gap-1 { gap: 0.125rem !important; }
          .header-img { width: 20px; height: 20px; }
        }
        @media (max-width: 767.98px) {
          .link-text { display: none !important; } /* Icons only */
          .header-upper-links { gap: 0.1rem !important; }
          .badge { font-size: 0.65rem; width: 16px; height: 16px; min-width: auto; }
          .menu-bottom { gap: 1rem !important; flex-direction: column-reverse; align-items: stretch; }
          .menu-links { order: -1; justify-content: center; }
        }
        @media (max-width: 575.98px) {
          .header-img { width: 18px; height: 18px; }
          .input-group-text { padding: 0.5rem 0.75rem !important; }
        }
        .logout-btn:hover { background: rgba(255,255,255,0.1) !important; }
      `}</style>
    </>
  );
};

export default Header;
