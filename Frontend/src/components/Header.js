import React, { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { BsSearch, BsPlay, BsCoin } from "react-icons/bs";
import compare from "../images/compare.svg";
import wishlist from "../images/wishlist.svg";
import user from "../images/user.svg";
import cart from "../images/cart.svg";
import menu from "../images/menu.svg";
import { useDispatch, useSelector } from "react-redux";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import { getAProduct, getAllProducts } from "../features/products/productSlilce";
import { getUserCart, getMyReferrals } from "../features/user/userSlice";

const Header = () => {
  const dispatch = useDispatch();
  const cartState = useSelector((state) => state?.auth?.cartProducts);
  const authState = useSelector((state) => state?.auth);
  const coinsState = useSelector((state) => state?.auth?.coins);
  const [total, setTotal] = useState(0);
  const productState = useSelector((state) => state?.product?.product);
  const navigate = useNavigate();

  // Ensure products are loaded for search - only runs once on mount
  useEffect(() => {
    if (!productState || productState.length === 0) {
      dispatch(getAllProducts());
    }
  }, []);

  const customerFromLocalStorage = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;
  const customerToken = customerFromLocalStorage?.token;

  const config2 = {
    headers: {
      Authorization: `Bearer ${
        customerToken || ""
      }`,
      Accept: "application/json",
    },
  };

  useEffect(() => {
    dispatch(getUserCart(config2));
  }, [dispatch]);

  // Fetch user's coins when logged in
  useEffect(() => {
    if (customerToken) {
      dispatch(getMyReferrals());
    }
  }, [dispatch, customerToken]);

  const [productOpt, setProductOpt] = useState([]);
  
  useEffect(() => {
    if (cartState && cartState.length > 0) {
      let sum = 0;
      for (let index = 0; index < cartState.length; index++) {
        sum = sum + Number(cartState[index].quantity) * cartState[index].price;
      }
      setTotal(sum);
    } else {
      setTotal(0);
    }
  }, [cartState]);

  useEffect(() => {
    if (productState && productState.length > 0) {
      let data = [];
      for (let index = 0; index < productState.length; index++) {
        const element = productState[index];
        if (element && element._id && element.title) {
          data.push({ id: index, prod: element._id, name: element.title });
        }
      }
      setProductOpt(data);
    }
  }, [productState]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {/* Top Strip */}
      <header className="header-top-strip py-2">
        <div className="container-xxl">
          <div className="row align-items-center">
            <div className="col-6">
              <p className="text-white mb-0" style={{ fontSize: '13px' }}>
                Welcome to Yashoda Fashion - Premium Clothing Brand
              </p>
            </div>
            <div className="col-6">
              <p className="text-end text-white mb-0" style={{ fontSize: '13px' }}>
                Hotline: 
                <a className="text-white ms-2" href="tel:+91 8264954234" style={{ textDecoration: 'none' }}>
                  +91 8264954234
                </a>
              </p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Header */}
      <header className="header-upper py-3" style={{ 
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 15px rgba(0,0,0,0.05)'
      }}>
        <div className="container-xxl">
          <div className="row align-items-center g-3">
            {/* Logo */}
            <div className="col-auto">
              <Link to="/" style={{ textDecoration: 'none' }}>
                <h2 style={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  marginBottom: 0,
                  letterSpacing: '-0.5px'
                }}>
                  Vogue<span style={{ color: '#d4af37' }}>Craft</span>
                </h2>
              </Link>
            </div>
            
            {/* Search */}
            <div className="col flex-grow-1 px-4">
              <div className="input-group" style={{ maxWidth: '600px' }}>
                <Typeahead
                  id="pagination-example"
                  onPaginate={() => console.log("Results paginated")}
                  onChange={(selected) => {
                    if (selected && selected[0]?.prod) {
                      navigate(`/product/${selected[0].prod}`);
                      dispatch(getAProduct(selected[0].prod));
                    }
                  }}
                  options={productOpt}
                  paginate={true}
                  labelKey={"name"}
                  placeholder="Search for products..."
                  className="flex-grow-1"
                />
                <span 
                  className="input-group-text" 
                  style={{ 
                    background: '#d4af37', 
                    border: 'none', 
                    cursor: 'pointer',
                    padding: '0 20px'
                  }}
                >
                  <BsSearch style={{ color: '#1a1a1a' }} />
                </span>
              </div>
            </div>
            
            {/* Right Icons */}
            <div className="col-auto">
              <div className="d-flex align-items-center gap-3">
                {/* Reels Button */}
                <Link 
                  to="/reels" 
                  className="d-flex align-items-center gap-2 text-decoration-none"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <BsPlay /> <span className="d-none d-lg-inline">Reels</span>
                </Link>
                
                {/* Wishlist */}
                <Link 
                  to="/wishlist" 
                  className="d-flex align-items-center gap-2 text-decoration-none"
                  style={{ color: '#666' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={wishlist} alt="wishlist" style={{ width: '24px', height: '24px' }} />
                  </div>
                  <span className="d-none d-lg-inline" style={{ fontSize: '13px' }}>Wishlist</span>
                </Link>
                
                {/* Coins */}
                {authState?.user !== null && (
                  <Link 
                    to="/my-profile" 
                    className="d-flex align-items-center gap-2 text-decoration-none"
                    style={{ 
                      color: '#d4af37',
                      background: 'rgba(212, 175, 55, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '20px'
                    }}
                  >
                    <BsCoin style={{ fontSize: '20px' }} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                      {coinsState ? coinsState.toLocaleString() : 0}
                    </span>
                  </Link>
                )}
                
                {/* User */}
                <Link 
                  to={authState?.user === null ? "/login" : "/my-profile"}
                  className="d-flex align-items-center gap-2 text-decoration-none"
                  style={{ color: '#666' }}
                >
                  <img src={user} alt="user" style={{ width: '24px', height: '24px' }} />
                  <span className="d-none d-lg-inline" style={{ fontSize: '13px' }}>
                    {authState?.user === null ? 'Login' : authState?.user?.firstname}
                  </span>
                </Link>
                
                {/* Cart */}
                <Link 
                  to="/cart" 
                  className="d-flex align-items-center gap-2 text-decoration-none"
                  style={{ color: '#666' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={cart} alt="cart" style={{ width: '24px', height: '24px' }} />
                    {cartState && cartState.length > 0 && (
                      <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#d4af37',
                        color: '#1a1a1a',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {cartState.length}
                      </span>
                    )}
                  </div>
                  <span className="d-none d-lg-inline" style={{ fontSize: '13px' }}>
                    ₹{total ? total.toLocaleString() : 0}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <header className="header-bottom py-3" style={{ background: '#1a1a1a' }}>
        <div className="container-xxl">
          <div className="row">
            <div className="col-12">
              <div className="menu-bottom d-flex align-items-center justify-content-between">
                {/* Categories Dropdown */}
                <div>
                  <div className="dropdown">
                    <button
                      className="btn btn-secondary dropdown-toggle bg-transparent border-0 gap-2 d-flex align-items-center text-white fw-normal"
                      type="button"
                      id="dropdownMenuButton1"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ fontSize: '14px' }}
                    >
                      <img src={menu} alt="" style={{ width: '20px' }} />
                      <span>Shop Categories</span>
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton1" style={{
                      background: '#1a1a1a',
                      border: 'none',
                      padding: '10px 0',
                      minWidth: '200px'
                    }}>
                      {productState && productState.length > 0 && [...new Set(productState.map(p => p.category))].slice(0, 8).map((category, index) => (
                        <li key={index}>
                          <Link 
                            className="dropdown-item" 
                            to={`/product`}
                            style={{ 
                              color: '#fff', 
                              padding: '12px 20px',
                              fontSize: '14px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#d4af37';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.color = '#fff';
                            }}
                          >
                            {category}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Menu Links */}
                <div className="d-flex align-items-center gap-4">
                  <NavLink 
                    to="/" 
                    className="text-white text-decoration-none"
                    style={{ fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                    onMouseLeave={(e) => e.target.style.color = '#fff'}
                  >
                    Home
                  </NavLink>
                  <NavLink 
                    to="/product" 
                    className="text-white text-decoration-none"
                    style={{ fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                    onMouseLeave={(e) => e.target.style.color = '#fff'}
                  >
                    Shop
                  </NavLink>
                  <NavLink 
                    to="/reels" 
                    className="text-white text-decoration-none"
                    style={{ fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                    onMouseLeave={(e) => e.target.style.color = '#fff'}
                  >
                    Reels
                  </NavLink>
                  <NavLink 
                    to="/my-orders" 
                    className="text-white text-decoration-none"
                    style={{ fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                    onMouseLeave={(e) => e.target.style.color = '#fff'}
                  >
                    My Orders
                  </NavLink>
                  <NavLink 
                    to="/blogs" 
                    className="text-white text-decoration-none"
                    style={{ fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                    onMouseLeave={(e) => e.target.style.color = '#fff'}
                  >
                    Blogs
                  </NavLink>
                  <NavLink 
                    to="/contact" 
                    className="text-white text-decoration-none"
                    style={{ fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={(e) => e.target.style.color = '#d4af37'}
                    onMouseLeave={(e) => e.target.style.color = '#fff'}
                  >
                    Contact
                  </NavLink>
                  
                  {authState?.user !== null && (
                    <button
                      className="border-0 bg-transparent text-white text-uppercase px-3 py-1 rounded"
                      type="button"
                      onClick={handleLogout}
                      style={{ fontSize: '13px', fontWeight: 600 }}
                    >
                      LogOut
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
