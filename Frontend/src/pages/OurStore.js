import React, { useEffect, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import ReactStars from "react-rating-stars-component";
import ProductCard from "../components/ProductCard";
import Color from "../components/Color";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { getAllProducts } from "../features/products/productSlilce";
import { Link, useLocation } from "react-router-dom";

const OurStore = () => {
  const [grid, setGrid] = useState(4);
  const productState = useSelector((state) => state?.product?.product);
  const isLoading = useSelector((state) => state?.product?.isLoading);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  //filter state
  const [tag, setTag] = useState(null);
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState(null);
  
  // Track filter state for fetching
  const [filterState, setFilterState] = useState({
    sort: null,
    tag: null,
    brand: null,
    category: null,
    minPrice: null,
    maxPrice: null
  });

  const dispatch = useDispatch();
  const location = useLocation();

  // On mount, check if a category was passed from Home page
  useEffect(() => {
    const incomingCategory = location.state?.category || null;
    if (incomingCategory) {
      setCategory(incomingCategory);
      setFilterState(prev => ({ ...prev, category: incomingCategory }));
      dispatch(getAllProducts({ category: incomingCategory }));
    } else {
      dispatch(getAllProducts({}));
    }
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Extract unique brands, categories, tags from productState
  useEffect(() => {
    if (productState && Array.isArray(productState)) {
      const uniqueBrands = [...new Set(productState.map(p => p.brand).filter(Boolean))];
      const uniqueCategories = [...new Set(productState.map(p => p.category).filter(Boolean))];
      const uniqueTags = [...new Set(productState.map(p => p.tags).filter(Boolean))];
      setBrands(uniqueBrands);
      setCategories(uniqueCategories);
      setTags(uniqueTags);
    }
  }, [productState]);

  // Handle filter changes - only fetch when user explicitly changes filters
  const handleFilterChange = (newFilters) => {
    setFilterState(prev => {
      const updated = { ...prev, ...newFilters };
      dispatch(getAllProducts(updated));
      return updated;
    });
  };

  // Clear individual filters
  const clearCategory = () => {
    setCategory(null);
    handleFilterChange({ category: null });
  };
  
  const clearBrand = () => {
    setBrand(null);
    handleFilterChange({ brand: null });
  };
  
  const clearTag = () => {
    setTag(null);
    handleFilterChange({ tag: null });
  };
  
  const clearPrice = () => {
    setMinPrice(null);
    setMaxPrice(null);
    handleFilterChange({ minPrice: null, maxPrice: null });
  };
  
  const clearAllFilters = () => {
    setTag(null);
    setCategory(null);
    setBrand(null);
    setMinPrice(null);
    setMaxPrice(null);
    setSort(null);
    handleFilterChange({
      tag: null,
      category: null,
      brand: null,
      minPrice: null,
      maxPrice: null,
      sort: null
    });
  };

  // Check if any filter is active
  const hasActiveFilters = tag || category || brand || minPrice || maxPrice || sort;

  return (
    <>
      <Meta
        title="Shop All Products"
        description="Browse Yashoda Fashion's full collection of premium fashion, clothing, and accessories. Filter by category, brand, price, and more."
        keywords="shop fashion online, buy clothes, premium clothing, Yashoda Fashion store"
        url="/product"
      />
      <BreadCrumb title="Our Store" />
      <Container class1="store-wrapper home-wrapper-2 py-5">
        <div className="row">
          {/* Filter Sidebar */}
          <div className="col-12 col-lg-3">
            <div className="filter-card mb-4" style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="filter-title" style={{ 
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: 0
                }}>Shop By</h3>
                {hasActiveFilters && (
                  <button 
                    onClick={clearAllFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d4af37',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {/* Categories */}
              <div className="mb-4">
                <h5 className="sub-title" style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#1a1a1a',
                  marginBottom: '16px'
                }}>Categories</h5>
                <ul className="ps-0" style={{ listStyle: 'none' }}>
                  <li 
                    onClick={() => {
                      setCategory(null);
                      handleFilterChange({ category: null });
                    }}
                    style={{ 
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginBottom: '4px',
                      transition: 'all 0.2s',
                      background: !category ? '#d4af37' : 'transparent',
                      color: !category ? '#fff' : '#666'
                    }}
                  >
                    All Products
                  </li>
                  {categories && categories.map((item, index) => (
                    <li 
                      key={index} 
                      onClick={() => {
                        setCategory(item);
                        handleFilterChange({ category: item });
                      }}
                      style={{ 
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginBottom: '4px',
                        transition: 'all 0.2s',
                        background: category === item ? '#d4af37' : 'transparent',
                        color: category === item ? '#fff' : '#666'
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Filter */}
              <div className="mb-4">
                <h5 className="sub-title" style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#1a1a1a',
                  marginBottom: '16px'
                }}>Price Range</h5>
                <div className="d-flex align-items-center gap-10 mb-3">
                  <div className="form-floating">
                    <input
                      type="number"
                      className="form-control"
                      id="floatingInput"
                      placeholder="From"
                      value={minPrice || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setMinPrice(val);
                        handleFilterChange({ minPrice: val, maxPrice });
                      }}
                      style={{ borderRadius: '12px' }}
                    />
                    <label htmlFor="floatingInput">Min ₹</label>
                  </div>
                  <span style={{ color: '#999' }}>-</span>
                  <div className="form-floating">
                    <input
                      type="number"
                      className="form-control"
                      id="floatingInput1"
                      placeholder="To"
                      value={maxPrice || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        setMaxPrice(val);
                        handleFilterChange({ minPrice, maxPrice: val });
                      }}
                      style={{ borderRadius: '12px' }}
                    />
                    <label htmlFor="floatingInput1">Max ₹</label>
                  </div>
                </div>
                {(minPrice || maxPrice) && (
                  <button 
                    onClick={clearPrice}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#d4af37',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Price
                  </button>
                )}
              </div>

              {/* Product Tags */}
              <div className="mb-4">
                <h5 className="sub-title" style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#1a1a1a',
                  marginBottom: '16px'
                }}>Tags</h5>
                <div className="product-tags d-flex flex-wrap gap-10">
                  {tags && tags.map((item, index) => (
                    <span
                      key={index}
                      onClick={() => {
                        const newTag = tag === item ? null : item;
                        setTag(newTag);
                        handleFilterChange({ tag: newTag });
                      }}
                      className="text-capitalize badge rounded-3 py-2 px-3"
                      style={{
                        background: tag === item ? '#d4af37' : '#f5f5f5',
                        color: tag === item ? '#fff' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product Brands */}
              <div>
                <h5 className="sub-title" style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#1a1a1a',
                  marginBottom: '16px'
                }}>Brands</h5>
                <div className="product-tags d-flex flex-wrap gap-10">
                  {brands && brands.map((item, index) => (
                    <span
                      key={index}
                      onClick={() => {
                        const newBrand = brand === item ? null : item;
                        setBrand(newBrand);
                        handleFilterChange({ brand: newBrand });
                      }}
                      className="text-capitalize badge rounded-3 py-2 px-3"
                      style={{
                        background: brand === item ? '#d4af37' : '#f5f5f5',
                        color: brand === item ? '#fff' : '#666',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '12px',
                        fontWeight: 500
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Product List */}
          <div className="col-12 col-lg-9">
            {/* Sort and Grid Controls */}
            <div className="filter-sort-grid mb-4" style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-10">
                  <p className="mb-0 d-block" style={{ width: "auto", fontWeight: 500, color: '#666' }}>
                    Sort By:
                  </p>
                  <select
                    className="form-control form-select"
                    style={{ borderRadius: '12px', width: '180px' }}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      setSort(val);
                      handleFilterChange({ sort: val });
                    }}
                    value={sort || ""}
                  >
                    <option value="">Featured</option>
                    <option value="title">Alphabetically, A-Z</option>
                    <option value="-title">Alphabetically, Z-A</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="createdAt">Date: Old to New</option>
                    <option value="-createdAt">Date: New to Old</option>
                  </select>
                </div>
                <div className="d-flex align-items-center gap-10">
                  <p className="totalproducts mb-0" style={{ color: '#666', fontWeight: 500 }}>
                    {productState?.length || 0} Products
                  </p>
                  <div className="d-flex gap-10 align-items-center grid">
                    <img
                      onClick={() => setGrid(3)}
                      src="images/gr3.svg"
                      className={`d-block img-fluid ${grid === 3 ? 'active-grid' : ''}`}
                      alt="grid"
                      style={{ 
                        cursor: 'pointer', 
                        opacity: grid === 3 ? 1 : 0.5,
                        transition: 'all 0.2s'
                      }}
                    />
                    <img
                      onClick={() => setGrid(4)}
                      src="images/gr4.svg"
                      className={`d-block img-fluid ${grid === 4 ? 'active-grid' : ''}`}
                      alt="grid"
                      style={{ 
                        cursor: 'pointer', 
                        opacity: grid === 4 ? 1 : 0.5,
                        transition: 'all 0.2s'
                      }}
                    />
                    <img
                      onClick={() => setGrid(6)}
                      src="images/gr2.svg"
                      className={`d-block img-fluid ${grid === 6 ? 'active-grid' : ''}`}
                      alt="grid"
                      style={{ 
                        cursor: 'pointer', 
                        opacity: grid === 6 ? 1 : 0.5,
                        transition: 'all 0.2s'
                      }}
                    />
                    <img
                      onClick={() => setGrid(12)}
                      src="images/gr.svg"
                      className={`d-block img-fluid ${grid === 12 ? 'active-grid' : ''}`}
                      alt="grid"
                      style={{ 
                        cursor: 'pointer', 
                        opacity: grid === 12 ? 1 : 0.5,
                        transition: 'all 0.2s'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3" style={{ color: '#666' }}>Loading products...</p>
              </div>
            ) : (
              <div className="products-list pb-5">
                {productState && productState.length > 0 ? (
                  <div 
                    className="d-flex flex-wrap gap-3"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(auto-fill, minmax(${grid === 12 ? '100%' : grid === 6 ? 'calc(50% - 12px)' : grid === 3 ? 'calc(33.333% - 16px)' : 'calc(25% - 18px)'}, 1fr))`,
                      gap: '20px'
                    }}
                  >
                    <ProductCard data={productState} grid={grid} />
                  </div>
                ) : (
                  <div className="text-center py-5" style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                  }}>
                    <p style={{ color: '#999', fontSize: '16px', marginBottom: '16px' }}>No products found</p>
                    {hasActiveFilters && (
                      <button 
                        onClick={clearAllFilters}
                        style={{
                          background: '#d4af37',
                          color: '#fff',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '25px',
                          cursor: 'pointer',
                          fontWeight: 500
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
};

export default OurStore;
