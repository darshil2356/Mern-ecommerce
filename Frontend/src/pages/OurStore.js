import React, { useEffect, useRef, useState } from "react";
import BreadCrumb from "../components/BreadCrumb";
import Meta from "../components/Meta";
import ProductCard from "../components/ProductCard";
import Container from "../components/Container";
import { useDispatch, useSelector } from "react-redux";
import { getAllProducts } from "../features/products/productSlilce";
import { useLocation } from "react-router-dom";
import { AiOutlineFilter, AiOutlineClose } from "react-icons/ai";

const OurStore = () => {
  const productState = useSelector((state) => state?.product?.product);
  const isLoading = useSelector((state) => state?.product?.isLoading);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [showFilter, setShowFilter] = useState(false);

  const [tag, setTag] = useState(null);
  const [category, setCategory] = useState(null);
  const [brand, setBrand] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [sort, setSort] = useState(null);
  const [filterState, setFilterState] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef(null);

  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    const incomingCategory = location.state?.category || null;
    if (incomingCategory) {
      setCategory(incomingCategory);
      const fs = { category: incomingCategory };
      setFilterState(fs);
      dispatch(getAllProducts(fs));
    } else {
      dispatch(getAllProducts({}));
    }
  }, [dispatch]); // eslint-disable-line

  useEffect(() => {
    if (productState?.length > 0) {
      setBrands([...new Set(productState.map((p) => p.brand).filter(Boolean))]);
      setCategories([...new Set(productState.map((p) => p.category).filter(Boolean))]);
      setTags([...new Set(productState.map((p) => p.tags).filter(Boolean))]);
    }
  }, [productState]);

  const applyFilter = (newFilters) => {
    setFilterState((prev) => {
      const updated = { ...prev, ...newFilters };
      dispatch(getAllProducts(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setTag(null); setCategory(null); setBrand(null);
    setMinPrice(null); setMaxPrice(null); setSort(null);
    setFilterState({});
    setVisibleCount(20);
    dispatch(getAllProducts({}));
    setShowFilter(false);
  };

  useEffect(() => {
    setVisibleCount(20);
  }, [productState]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisibleCount((c) => c + 20);
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [productState]);

  const hasFilters = tag || category || brand || minPrice || maxPrice || sort;
  const activeCount = [tag, category, brand, minPrice || maxPrice, sort].filter(Boolean).length;

  const FilterContent = () => (
    <div style={{ padding: "0 0 80px" }}>
      {/* Categories */}
      <div style={{ marginBottom: 28 }}>
        <p style={sectionLabel}>Categories</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Chip
            label="All"
            active={!category}
            onClick={() => { setCategory(null); applyFilter({ category: null }); }}
          />
          {categories.map((item, i) => (
            <Chip
              key={i}
              label={item}
              active={category === item}
              onClick={() => { setCategory(item); applyFilter({ category: item }); }}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={sectionLabel}>Tags</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tags.map((item, i) => (
              <Chip
                key={i}
                label={item}
                active={tag === item}
                onClick={() => { const v = tag === item ? null : item; setTag(v); applyFilter({ tag: v }); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={sectionLabel}>Brands</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {brands.map((item, i) => (
              <Chip
                key={i}
                label={item}
                active={brand === item}
                onClick={() => { const v = brand === item ? null : item; setBrand(v); applyFilter({ brand: v }); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div style={{ marginBottom: 28 }}>
        <p style={sectionLabel}>Price Range (₹)</p>
        <div style={{ display: "flex",flexWrap : "wrap" , gap: 12 }}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice || ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setMinPrice(v);
              applyFilter({ minPrice: v, maxPrice });
            }}
            style={priceInput}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice || ""}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : null;
              setMaxPrice(v);
              applyFilter({ minPrice, maxPrice: v });
            }}
            style={priceInput}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Meta
        title="Shop All Products"
        description="Browse our full collection of premium fashion, clothing, and accessories."
        keywords="shop fashion online, buy clothes, premium clothing"
        url="/product"
      />
      <BreadCrumb title="Our Store" />

      <div style={{ background: "#f7f7f7", minHeight: "100vh" }}>
        <Container class1="store-wrapper py-4">

          {/* ── Sticky Top Bar ── */}
          <div style={topBar}>
            {/* Filter Button */}
            <button onClick={() => setShowFilter(true)} style={filterBtn}>
              <AiOutlineFilter size={18} />
              <span>Filter</span>
              {activeCount > 0 && (
                <span style={badge}>{activeCount}</span>
              )}
            </button>

            {/* Sort */}
            <select
              value={sort || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setSort(v);
                applyFilter({ sort: v });
              }}
              style={sortSelect}
            >
              <option value="">Sort: Featured</option>
              <option value="price">Price: Low → High</option>
              <option value="-price">Price: High → Low</option>
              <option value="-createdAt">Newest First</option>
              <option value="title">A → Z</option>
              <option value="-title">Z → A</option>
            </select>

            {/* Count */}
            <span style={{ fontSize: 13, color: "#888", whiteSpace: "nowrap" }}>
              {productState?.length || 0} items
            </span>
          </div>

          {/* ── Active Filter Pills ── */}
          {hasFilters && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {category && <ActivePill label={`Cat: ${category}`} onRemove={() => { setCategory(null); applyFilter({ category: null }); }} />}
              {brand && <ActivePill label={`Brand: ${brand}`} onRemove={() => { setBrand(null); applyFilter({ brand: null }); }} />}
              {tag && <ActivePill label={`Tag: ${tag}`} onRemove={() => { setTag(null); applyFilter({ tag: null }); }} />}
              {(minPrice || maxPrice) && <ActivePill label={`₹${minPrice || 0} - ₹${maxPrice || "∞"}`} onRemove={() => { setMinPrice(null); setMaxPrice(null); applyFilter({ minPrice: null, maxPrice: null }); }} />}
              <button onClick={clearAll} style={clearAllBtn}>Clear All</button>
            </div>
          )}

          {/* ── Desktop Layout ── */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

            {/* Sidebar — desktop only */}
            <div style={sidebar}>
              <div style={sidebarCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a" }}>Filters</h3>
                  {hasFilters && (
                    <button onClick={clearAll} style={{ background: "none", border: "none", color: "#d4af37", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Clear All
                    </button>
                  )}
                </div>
                <FilterContent />
              </div>
            </div>

            {/* Products Grid */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {isLoading ? (
                <div style={loadingBox}>
                  <div style={spinner} />
                  <p style={{ color: "#888", marginTop: 12, fontSize: 14 }}>Loading products...</p>
                </div>
              ) : productState?.length > 0 ? (
                <div style={productsGrid}>
                  <ProductCard data={productState.slice(0, visibleCount)} grid={4} />
                  {visibleCount < productState.length && (
                    <div ref={sentinelRef} style={{ gridColumn: "1 / -1", height: 40 }} />
                  )}
                </div>
              ) : (
                <div style={emptyBox}>
                  <p style={{ fontSize: 40, marginBottom: 8 }}>🛍️</p>
                  <p style={{ color: "#888", fontSize: 16, marginBottom: 16 }}>No products found</p>
                  {hasFilters && (
                    <button onClick={clearAll} style={clearFiltersBtn}>Clear Filters</button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* ── Mobile Filter Bottom Sheet ── */}
      {showFilter && (
        <>
          <div onClick={() => setShowFilter(false)} style={overlay} />
          <div style={bottomSheet}>
            <div style={sheetHandle} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Filters</h3>
              <button onClick={() => setShowFilter(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <AiOutlineClose size={22} />
              </button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              <FilterContent />
            </div>
            <div style={sheetFooter}>
              <button onClick={clearAll} style={sheetClearBtn}>Clear All</button>
              <button onClick={() => setShowFilter(false)} style={sheetApplyBtn}>
                Show {productState?.length || 0} Results
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

/* ── Small Components ── */
const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "7px 14px",
      borderRadius: 20,
      border: active ? "none" : "1.5px solid #e0e0e0",
      background: active ? "#1a1a1a" : "#fff",
      color: active ? "#fff" : "#555",
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      cursor: "pointer",
      transition: "all 0.2s",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </button>
);

const ActivePill = ({ label, onRemove }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 6,
    background: "#1a1a1a", color: "#fff",
    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
  }}>
    {label}
    <AiOutlineClose size={12} style={{ cursor: "pointer" }} onClick={onRemove} />
  </span>
);

/* ── Styles ── */
const sectionLabel = {
  fontSize: 13, fontWeight: 700, color: "#1a1a1a",
  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12,
};

const priceInput = {
  flex: 1, padding: "10px 14px", border: "1.5px solid #e0e0e0",
  borderRadius: 10, fontSize: 14, outline: "none", background: "#fafafa",
};

const topBar = {
  display: "flex", alignItems: "center", gap: 12,
  background: "#fff", borderRadius: 14, padding: "12px 16px",
  marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  position: "sticky", top: 70, zIndex: 50,
};

const filterBtn = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "8px 16px", borderRadius: 20,
  border: "1.5px solid #1a1a1a", background: "#fff",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
  position: "relative", whiteSpace: "nowrap",
};

const badge = {
  position: "absolute", top: -6, right: -6,
  background: "#d4af37", color: "#fff",
  width: 18, height: 18, borderRadius: "50%",
  fontSize: 10, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center",
};

const sortSelect = {
  flex: 1, padding: "8px 12px", border: "1.5px solid #e0e0e0",
  borderRadius: 20, fontSize: 13, background: "#fff",
  outline: "none", cursor: "pointer", maxWidth: 200,
};

const clearAllBtn = {
  background: "none", border: "1.5px solid #d4af37",
  color: "#d4af37", padding: "4px 12px", borderRadius: 20,
  fontSize: 12, fontWeight: 600, cursor: "pointer",
};

const sidebar = {
  width: 260, flexShrink: 0,
  display: "none",
  // shown via media query in CSS
};

const sidebarCard = {
  background: "#fff", borderRadius: 16,
  padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  position: "sticky", top: 130,
};

const productsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 10,
};

const loadingBox = {
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  minHeight: 300,
};

const spinner = {
  width: 36, height: 36, border: "3px solid #f0f0f0",
  borderTop: "3px solid #d4af37", borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

const emptyBox = {
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  minHeight: 300, background: "#fff",
  borderRadius: 16, padding: 40,
};

const clearFiltersBtn = {
  background: "#1a1a1a", color: "#fff",
  border: "none", padding: "12px 28px",
  borderRadius: 25, cursor: "pointer",
  fontSize: 14, fontWeight: 600,
};

/* Bottom Sheet */
const overlay = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.5)", zIndex: 200,
};

const bottomSheet = {
  position: "fixed", bottom: 0, left: 0, right: 0,
  background: "#fff", borderRadius: "20px 20px 0 0",
  padding: "16px 20px 0",
  zIndex: 201, maxHeight: "85vh",
  display: "flex", flexDirection: "column",
  boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
};

const sheetHandle = {
  width: 40, height: 4, background: "#e0e0e0",
  borderRadius: 2, margin: "0 auto 16px",
};

const sheetFooter = {
  display: "flex", gap: 12,
  padding: "16px 0 24px",
  borderTop: "1px solid #f0f0f0",
  background: "#fff",
};

const sheetClearBtn = {
  flex: 1, padding: "14px", border: "1.5px solid #1a1a1a",
  background: "#fff", borderRadius: 12,
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};

const sheetApplyBtn = {
  flex: 2, padding: "14px", border: "none",
  background: "#1a1a1a", color: "#fff",
  borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer",
};

export default OurStore;
