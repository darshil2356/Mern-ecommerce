import React, { useState, useEffect, useMemo } from "react";
import {
  Row, Col, Card, Select, Button, Input, Table, Tag, DatePicker,
  Spin, Empty, message, Tooltip, Badge, Progress, Statistic, Tabs
} from "antd";
import {
  BsCurrencyRupee, BsPercent, BsCart4, BsGraphUp, BsBoxSeam,
  BsPeople, BsArrowUpRight, BsActivity, BsArrowDownRight,
  BsDownload, BsPrinter, BsSearch, BsFilter, BsArrowRepeat,
  BsQuestionCircle, BsCheckCircle, BsExclamationTriangle
} from "react-icons/bs";
import api from "../utils/axiosconfig";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const FILTERS = {
  TODAY: "today",
  YESTERDAY: "yesterday",
  WEEK: "7days",
  MONTH: "month",
  LAST_MONTH: "lastMonth",
  YEAR: "year",
  CUSTOM: "custom"
};

const BusinessAnalytics = () => {
  const [filter, setFilter] = useState("30days");
  const [customRange, setCustomRange] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);

  // Filters Options lists
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [productsList, setProductsList] = useState([]);

  // Selected Filters
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedSubcategory, setSelectedSubcategory] = useState(undefined);
  const [selectedProduct, setSelectedProduct] = useState(undefined);
  const [selectedBrand, setSelectedBrand] = useState(undefined);
  const [selectedSize, setSelectedSize] = useState(undefined);
  const [selectedChannel, setSelectedChannel] = useState(undefined);
  const [selectedPaymentType, setSelectedPaymentType] = useState(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [productSortBy, setProductSortBy] = useState("unitsSold");
  const [productSortOrder, setProductSortOrder] = useState("desc");

  // Load dropdown options
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [catRes, brandRes, sizeRes, prodRes] = await Promise.all([
          api.get("/category").catch(() => ({ data: [] })),
          api.get("/brand").catch(() => ({ data: [] })),
          api.get("/size").catch(() => ({ data: [] })),
          api.get("/product").catch(() => ({ data: [] }))
        ]);

        if (Array.isArray(catRes.data)) setCategories(catRes.data);
        else if (catRes.data && Array.isArray(catRes.data.categories)) setCategories(catRes.data.categories);

        if (Array.isArray(brandRes.data)) setBrands(brandRes.data);
        if (Array.isArray(sizeRes.data)) setSizes(sizeRes.data);
        
        // Products
        const prodData = prodRes.data?.products || prodRes.data || [];
        if (Array.isArray(prodData)) setProductsList(prodData);
      } catch (err) {
        // silently handle loading failures
      }
    };
    loadDropdowns();
  }, []);

  // Fetch report data
  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("filter", filter);
      if (filter === "custom" && customRange && customRange[0] && customRange[1]) {
        params.append("startDate", customRange[0].toISOString());
        params.append("endDate", customRange[1].toISOString());
      }
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedSubcategory) params.append("subcategory", selectedSubcategory);
      if (selectedProduct) params.append("product", selectedProduct);
      if (selectedBrand) params.append("brand", selectedBrand);
      if (selectedSize) params.append("size", selectedSize);
      if (selectedChannel) params.append("salesChannel", selectedChannel);
      if (selectedPaymentType) params.append("paymentType", selectedPaymentType);
      if (searchTerm) params.append("search", searchTerm);

      const res = await api.get(`/reports/business-analytics?${params.toString()}`);
      if (res.data && res.data.success) {
        setData(res.data);
      } else {
        message.error("Failed to parse analytics payload");
      }
    } catch (error) {
      message.error("Failed to fetch business analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [
    filter, customRange, selectedCategory, selectedSubcategory,
    selectedProduct, selectedBrand, selectedSize, selectedChannel,
    selectedPaymentType
  ]);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchAnalytics();
    }
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setSelectedProduct(undefined);
    setSelectedBrand(undefined);
    setSelectedSize(undefined);
    setSelectedChannel(undefined);
    setSelectedPaymentType(undefined);
    setSearchTerm("");
    setFilter("30days");
    setCustomRange(null);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Summary
    csvContent += "BUSINESS KPI SUMMARY\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Sales,INR ${data.kpi.totalSales}\n`;
    csvContent += `Total Orders,${data.kpi.totalOrders}\n`;
    csvContent += `Total Units Sold,${data.kpi.totalUnitsSold}\n`;
    csvContent += `Total Purchase Cost,INR ${data.kpi.totalPurchaseCost}\n`;
    csvContent += `Gross Profit,INR ${data.kpi.grossProfit}\n`;
    csvContent += `Profit Margin,${data.kpi.profitMargin}%\n`;
    csvContent += `Average Order Value,INR ${data.kpi.aov}\n`;
    csvContent += `Average Profit Per Order,INR ${data.kpi.avgProfitPerOrder}\n`;
    csvContent += `Repeat Customers Count,${data.kpi.repeatCustomersCount}\n\n`;

    // Categories
    csvContent += "CATEGORY PERFORMANCE ANALYSIS\n";
    csvContent += "Category,Orders,Units Sold,Revenue (INR),Purchase Cost (INR),Profit (INR),Profit Margin %,Repeat Purchase Rate %,Unique Customers,Repeat Customers,Avg Days Between Purchases\n";
    data.categoryAnalytics.forEach(c => {
      csvContent += `"${c.category}",${c.orders},${c.unitsSold},${c.revenue},${c.purchaseCost},${c.profit},${c.profitMargin}%,${c.repeatPurchaseRate}%,${c.uniqueCustomers},${c.repeatCustomers},${c.avgDaysBetweenPurchases}\n`;
    });
    csvContent += "\n";

    // Products
    csvContent += "PRODUCT PERFORMANCE ANALYSIS\n";
    csvContent += "Product Name,Category,Units Sold,Orders,Revenue (INR),Purchase Cost (INR),Profit (INR),Profit Per Unit (INR),Profit Margin %,Repeat Purchases,Stock\n";
    data.productAnalytics.forEach(p => {
      csvContent += `"${p.title.replace(/"/g, '""')}","${p.category}",${p.unitsSold},${p.orders},${p.revenue},${p.purchaseCost},${p.profit},${p.profitPerUnit},${p.profitMargin}%,${p.repeatPurchases},${p.stock}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Deep_Business_Analytics_Report_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success("CSV report exported successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Sort and filter products locally based on Sort filter
  const sortedProducts = useMemo(() => {
    if (!data || !data.productAnalytics) return [];
    return [...data.productAnalytics].sort((a, b) => {
      let valA = a[productSortBy];
      let valB = b[productSortBy];
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return productSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return productSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, productSortBy, productSortOrder]);

  if (isLoading && !data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <Spin size="large" tip="Aggregating Deep Profitability Metrics..." />
      </div>
    );
  }

  const kpi = data?.kpi || {
    totalSales: 0,
    totalOrders: 0,
    totalUnitsSold: 0,
    totalPurchaseCost: 0,
    grossProfit: 0,
    profitMargin: 0,
    aov: 0,
    avgProfitPerOrder: 0,
    repeatCustomersCount: 0
  };

  const businessSummary = data?.businessSummary || "No transaction data available for this filter period.";

  return (
    <div className="analytics-root">
      
      {/* ── Header & Action Bars ──────────────────────────────────────── */}
      <div className="analytics-header animate-down">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="premium-badge">PRO EDITION</span>
            <h1 className="analytics-title">Business Analytics & Profitability</h1>
            <p className="analytics-subtitle">Real-time calculations, category performance, cohorts, and restocking insights</p>
          </div>
          <div className="action-buttons">
            <Button icon={<BsDownload />} onClick={handleExportCSV} type="primary" className="btn-export">Export CSV</Button>
            <Button icon={<BsPrinter />} onClick={handlePrint} className="btn-print">Print Report</Button>
          </div>
        </div>
      </div>

      {/* ── Filters Panel ─────────────────────────────────────────── */}
      <Card className="filter-card animate-up">
        <Row gutter={[16, 16]}>
          
          {/* Date range presets */}
          <Col xs={24} md={12} lg={8}>
            <div className="filter-label">Filter Period</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }} className="filter-buttons">
              {[{f:FILTERS.TODAY,l:"Today"}, {f:"7days",l:"7 Days"}, {f:"30days",l:"30 Days"}, {f:"month",l:"Month"}, {f:"lastMonth",l:"Last Month"}, {f:"year",l:"Year"}].map(({f,l}) => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setCustomRange(null); }}
                  className={`filter-btn ${filter === f ? "active" : ""}`}
                >
                  {l}
                </button>
              ))}
              <button
                onClick={() => setFilter(FILTERS.CUSTOM)}
                className={`filter-btn ${filter === FILTERS.CUSTOM ? "active" : ""}`}
              >
                Custom Date
              </button>
            </div>
            {filter === FILTERS.CUSTOM && (
              <RangePicker
                style={{ marginTop: 8, width: "100%" }}
                value={customRange}
                onChange={(range) => setCustomRange(range)}
              />
            )}
          </Col>

          {/* Context selects */}
          <Col xs={12} sm={8} lg={4}>
            <div className="filter-label">Category</div>
            <Select
              allowClear
              placeholder="Select Category"
              style={{ width: "100%" }}
              value={selectedCategory}
              onChange={setSelectedCategory}
            >
              {categories.map((c, i) => (
                <Option key={i} value={c.title || c}>{c.title || c}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <div className="filter-label">Brand</div>
            <Select
              allowClear
              placeholder="Select Brand"
              style={{ width: "100%" }}
              value={selectedBrand}
              onChange={setSelectedBrand}
            >
              {brands.map((b, i) => (
                <Option key={i} value={b.title || b}>{b.title || b}</Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <div className="filter-label">Sales Channel</div>
            <Select
              allowClear
              placeholder="All Channels"
              style={{ width: "100%" }}
              value={selectedChannel}
              onChange={setSelectedChannel}
            >
              <Option value="ONLINE">Online Store</Option>
              <Option value="OFFLINE">Offline Store / POS</Option>
            </Select>
          </Col>

          <Col xs={12} sm={8} lg={4}>
            <div className="filter-label">Payment Type</div>
            <Select
              allowClear
              placeholder="All Payments"
              style={{ width: "100%" }}
              value={selectedPaymentType}
              onChange={setSelectedPaymentType}
            >
              <Option value="CASH">Cash</Option>
              <Option value="CURRENT_ACCOUNT">Current Account</Option>
              <Option value="OTHER_ACCOUNT">Other Account</Option>
            </Select>
          </Col>

          {/* Additional controls */}
          <Col xs={24} sm={16} lg={12}>
            <div className="filter-label">Search products, categories, or customer phone/name</div>
            <Input
              prefix={<BsSearch />}
              placeholder="Type search keyword and press Enter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              suffix={
                <Button size="small" type="primary" onClick={fetchAnalytics}>Search</Button>
              }
            />
          </Col>

          <Col xs={24} sm={8} lg={12} style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end" }}>
            <Button icon={<BsArrowRepeat />} onClick={handleClearFilters} className="clear-btn">
              Reset Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ── AI Executive Summary ────────────────────────────────────── */}
      <Card className="summary-card animate-up" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div className="summary-icon">💡</div>
          <div>
            <h3 style={{ margin: 0, fontWeight: 700, color: "#1e1b4b" }}>📊 Business Executive Insights</h3>
            <p style={{ margin: "6px 0 0", color: "#4f46e5", fontSize: 14, fontWeight: 500, lineHeight: 1.6 }}>
              {businessSummary}
            </p>
          </div>
        </div>
      </Card>

      {/* ── KPI cards grid ────────────────────────────────────────── */}
      <Row gutter={[20, 20]} className="kpi-grid animate-up">
        
        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card purple">
            <div className="kpi-icon"><BsCurrencyRupee /></div>
            <div className="kpi-content">
              <span className="kpi-title">Total Sales</span>
              <h2 className="kpi-value">₹{kpi.totalSales.toLocaleString("en-IN")}</h2>
              <span className="kpi-sub">
                <strong>{kpi.totalOrders}</strong> orders • <strong>{kpi.totalUnitsSold}</strong> units
              </span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card orange">
            <div className="kpi-icon"><BsCart4 /></div>
            <div className="kpi-content">
              <span className="kpi-title">Total Cost price (COGS)</span>
              <h2 className="kpi-value">₹{kpi.totalPurchaseCost.toLocaleString("en-IN")}</h2>
              <span className="kpi-sub">Sum of purchase costs</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card green">
            <div className="kpi-icon"><BsGraphUp /></div>
            <div className="kpi-content">
              <span className="kpi-title">Gross Profit</span>
              <h2 className="kpi-value">₹{kpi.grossProfit.toLocaleString("en-IN")}</h2>
              <span className="kpi-sub">Sales minus Cost price</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card teal">
            <div className="kpi-icon"><BsPercent /></div>
            <div className="kpi-content">
              <span className="kpi-title">Profit Margin</span>
              <h2 className="kpi-value">{kpi.profitMargin.toFixed(2)}%</h2>
              <span className="kpi-sub">Average profit ratio</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card indigo">
            <div className="kpi-icon"><BsBoxSeam /></div>
            <div className="kpi-content">
              <span className="kpi-title">Avg Order Value (AOV)</span>
              <h2 className="kpi-value">₹{kpi.aov.toLocaleString("en-IN")}</h2>
              <span className="kpi-sub">Average net basket size</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card blue">
            <div className="kpi-icon"><BsActivity /></div>
            <div className="kpi-content">
              <span className="kpi-title">Avg Profit / Order</span>
              <h2 className="kpi-value">₹{kpi.avgProfitPerOrder.toLocaleString("en-IN")}</h2>
              <span className="kpi-sub">Average order profitability</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card pink">
            <div className="kpi-icon"><BsPeople /></div>
            <div className="kpi-content">
              <span className="kpi-title">Repeat Customers</span>
              <h2 className="kpi-value">{kpi.repeatCustomersCount}</h2>
              <span className="kpi-sub">Customers with &gt;1 orders</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={12} lg={6}>
          <div className="kpi-card rose">
            <div className="kpi-icon"><BsArrowRepeat /></div>
            <div className="kpi-content">
              <span className="kpi-title">Retention Rate</span>
              <h2 className="kpi-value">
                {data?.customerRetention?.repeatCustomerPercentage || 0}%
              </h2>
              <span className="kpi-sub">Repeat customers share</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* ── Tabs for different views ────────────────────────────────────── */}
      <Tabs defaultActiveKey="products" className="analytics-tabs animate-up" style={{ marginTop: 24 }}>
        
        {/* TAB 1: PRODUCT PERFORMANCE TABLE */}
        <TabPane tab="📦 Product Performance" key="products">
          <Card className="dash-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Product Sales, Margins & Stock</h3>
              
              {/* Product sorting */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Sort By:</span>
                <Select
                  value={productSortBy}
                  onChange={setProductSortBy}
                  style={{ width: 160 }}
                  size="small"
                >
                  <Option value="unitsSold">Units Sold (Demand)</Option>
                  <Option value="revenue">Revenue</Option>
                  <Option value="profit">Highest Profit</Option>
                  <Option value="profitMargin">Profit Margin %</Option>
                  <Option value="stock">Stock Available</Option>
                  <Option value="repeatPurchaseRate">Repeat Purchase %</Option>
                </Select>
                <Select
                  value={productSortOrder}
                  onChange={setProductSortOrder}
                  style={{ width: 100 }}
                  size="small"
                >
                  <Option value="desc">High-Low</Option>
                  <Option value="asc">Low-High</Option>
                </Select>
              </div>
            </div>

            <Table
              dataSource={sortedProducts}
              rowKey="productId"
              pagination={{ pageSize: 10 }}
              className="premium-table"
              scroll={{ x: 900 }}
              columns={[
                {
                  title: "Product",
                  dataIndex: "title",
                  key: "title",
                  render: (text) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{text}</span>
                },
                {
                  title: "Category",
                  dataIndex: "category",
                  key: "category",
                  render: (cat) => <Tag color="blue">{cat}</Tag>
                },
                {
                  title: "Units Sold",
                  dataIndex: "unitsSold",
                  key: "unitsSold",
                  sorter: true,
                  render: (qty) => <span style={{ fontWeight: 700 }}>{qty}</span>
                },
                {
                  title: "Orders",
                  dataIndex: "orders",
                  key: "orders"
                },
                {
                  title: "Revenue",
                  dataIndex: "revenue",
                  key: "revenue",
                  render: (val) => `₹${val.toLocaleString()}`
                },
                {
                  title: "Purchase Cost",
                  dataIndex: "purchaseCost",
                  key: "purchaseCost",
                  render: (val) => `₹${val.toLocaleString()}`
                },
                {
                  title: "Profit",
                  dataIndex: "profit",
                  key: "profit",
                  render: (val) => (
                    <span style={{ color: val >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                      ₹{val.toLocaleString()}
                    </span>
                  )
                },
                {
                  title: "Margin %",
                  dataIndex: "profitMargin",
                  key: "profitMargin",
                  render: (val) => (
                    <span style={{ fontWeight: 600 }}>{val}%</span>
                  )
                },
                {
                  title: "Profit/Unit",
                  dataIndex: "profitPerUnit",
                  key: "profitPerUnit",
                  render: (val) => `₹${val}`
                },
                {
                  title: "Repeat Buyer %",
                  dataIndex: "repeatPurchaseRate",
                  key: "repeatPurchaseRate",
                  render: (val) => `${val}%`
                },
                {
                  title: "Stock Status",
                  dataIndex: "stock",
                  key: "stock",
                  render: (stock, record) => {
                    const low = stock <= record.min_stock_alert;
                    return (
                      <Badge
                        status={low ? "error" : "success"}
                        text={
                          <span style={{ color: low ? "#ef4444" : "#10b981", fontWeight: 600 }}>
                            {stock} {low && "(Restock)"}
                          </span>
                        }
                      />
                    );
                  }
                }
              ]}
            />
          </Card>
        </TabPane>

        {/* TAB 2: CATEGORY PERFORMANCE */}
        <TabPane tab="📁 Category Analytics" key="categories">
          <Card className="dash-card">
            <h3 style={{ margin: "0 0 16px", fontWeight: 700 }}>Category performance breakdown</h3>
            
            <Table
              dataSource={data?.categoryAnalytics || []}
              rowKey="category"
              pagination={false}
              className="premium-table"
              columns={[
                {
                  title: "Category",
                  dataIndex: "category",
                  key: "category",
                  render: (txt) => <span style={{ fontWeight: 600 }}>{txt}</span>
                },
                {
                  title: "Orders",
                  dataIndex: "orders",
                  key: "orders"
                },
                {
                  title: "Units Sold",
                  dataIndex: "unitsSold",
                  key: "unitsSold"
                },
                {
                  title: "Revenue",
                  dataIndex: "revenue",
                  key: "revenue",
                  render: (val) => `₹${val.toLocaleString()}`
                },
                {
                  title: "Purchase Cost",
                  dataIndex: "purchaseCost",
                  key: "purchaseCost",
                  render: (val) => `₹${val.toLocaleString()}`
                },
                {
                  title: "Net Profit",
                  dataIndex: "profit",
                  key: "profit",
                  render: (val) => (
                    <span style={{ color: "#10b981", fontWeight: 700 }}>
                      ₹{val.toLocaleString()}
                    </span>
                  )
                },
                {
                  title: "Profit Margin",
                  dataIndex: "profitMargin",
                  key: "profitMargin",
                  render: (val) => <strong>{val}%</strong>
                },
                {
                  title: "Repeat purchases Rate",
                  dataIndex: "repeatPurchaseRate",
                  key: "repeatPurchaseRate",
                  render: (val) => `${val}%`
                },
                {
                  title: "Avg Days between buy",
                  dataIndex: "avgDaysBetweenPurchases",
                  key: "avgDaysBetweenPurchases",
                  render: (val) => `${val} days`
                }
              ]}
            />

            {/* Custom visual bars for categories */}
            <div style={{ marginTop: 32 }}>
              <h4 style={{ fontWeight: 700, margin: "0 0 12px" }}>Revenue & Profit Contribution by Category</h4>
              {(data?.categoryAnalytics || []).map((cat, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, fontWeight: 600 }}>
                    <span>{cat.category}</span>
                    <span>Revenue: ₹{cat.revenue.toLocaleString()} | Profit: ₹{cat.profit.toLocaleString()} ({cat.profitMargin}%)</span>
                  </div>
                  <Progress
                    percent={cat.shareOfTotalSales}
                    success={{ percent: (cat.profit / (cat.revenue || 1)) * cat.shareOfTotalSales }}
                    strokeColor="#6366f1"
                    trailColor="#e2e8f0"
                    showInfo={true}
                    format={() => `${cat.shareOfTotalSales}% share`}
                  />
                </div>
              ))}
            </div>
          </Card>
        </TabPane>

        {/* TAB 3: MATRIX & STRATEGIES */}
        <TabPane tab="⚖️ High/Low Performance Matrix" key="matrix">
          <Row gutter={[20, 20]}>
            
            {/* BEST PRODUCTS */}
            <Col xs={24} md={12}>
              <Card
                className="matrix-box"
                style={{ borderTop: "4px solid #10b981" }}
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#065f46" }}>🔥 High Sales + High Profit (Best Sellers)</span>
                    <Tag color="success">Scale & Stock</Tag>
                  </div>
                }
              >
                <div className="matrix-list">
                  {data?.businessMatrix?.bestProducts?.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="matrix-item">
                      <div className="title">{p.title}</div>
                      <div className="details">{p.unitsSold} sold • Margin: {p.profitMargin}% • Stock: {p.stock}</div>
                    </div>
                  ))}
                  {(!data?.businessMatrix?.bestProducts || data.businessMatrix.bestProducts.length === 0) && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No products qualified" />
                  )}
                </div>
              </Card>
            </Col>

            {/* NEED PRICING REVIEW */}
            <Col xs={24} md={12}>
              <Card
                className="matrix-box"
                style={{ borderTop: "4px solid #eab308" }}
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#854d0e" }}>🟡 High Sales + Low Profit (Review Price)</span>
                    <Tag color="warning">Raise Margin</Tag>
                  </div>
                }
              >
                <div className="matrix-list">
                  {data?.businessMatrix?.needPricingReview?.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="matrix-item">
                      <div className="title">{p.title}</div>
                      <div className="details">{p.unitsSold} sold • Margin: {p.profitMargin}% • Stock: {p.stock}</div>
                    </div>
                  ))}
                  {(!data?.businessMatrix?.needPricingReview || data.businessMatrix.needPricingReview.length === 0) && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No products qualified" />
                  )}
                </div>
              </Card>
            </Col>

            {/* NEED MARKETING */}
            <Col xs={24} md={12}>
              <Card
                className="matrix-box"
                style={{ borderTop: "4px solid #6366f1" }}
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#3730a3" }}>🟢 Low Sales + High Profit (Marketing push)</span>
                    <Tag color="processing">Promote</Tag>
                  </div>
                }
              >
                <div className="matrix-list">
                  {data?.businessMatrix?.needMarketing?.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="matrix-item">
                      <div className="title">{p.title}</div>
                      <div className="details">{p.unitsSold} sold • Margin: {p.profitMargin}% • Stock: {p.stock}</div>
                    </div>
                  ))}
                  {(!data?.businessMatrix?.needMarketing || data.businessMatrix.needMarketing.length === 0) && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No products qualified" />
                  )}
                </div>
              </Card>
            </Col>

            {/* CONSIDER DISCOUNT */}
            <Col xs={24} md={12}>
              <Card
                className="matrix-box"
                style={{ borderTop: "4px solid #ef4444" }}
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#991b1b" }}>🔴 Low Sales + Low Profit (Liquidate)</span>
                    <Tag color="error">Discount / Stop</Tag>
                  </div>
                }
              >
                <div className="matrix-list">
                  {data?.businessMatrix?.stopRestocking?.slice(0, 5).map((p, idx) => (
                    <div key={idx} className="matrix-item">
                      <div className="title">{p.title}</div>
                      <div className="details">{p.unitsSold} sold • Margin: {p.profitMargin}% • Stock: {p.stock}</div>
                    </div>
                  ))}
                  {(!data?.businessMatrix?.stopRestocking || data.businessMatrix.stopRestocking.length === 0) && (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No products qualified" />
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* TAB 4: ACTIONABLE STRATEGIES & RECOMMENDATIONS */}
        <TabPane tab="🟢 Smart Action Recommendations" key="actions">
          <Card className="dash-card">
            <h3 style={{ margin: "0 0 20px", fontWeight: 700 }}>AI Business Actions Recommendations</h3>
            
            <Row gutter={[20, 20]}>
              
              <Col xs={24} lg={12}>
                <div className="recommendation-block alert-success">
                  <h4 className="title">📈 Restock Recommended (High Sales, Low Stock)</h4>
                  <ul>
                    {(data?.recommendations?.increaseStock || []).slice(0, 8).map((p, i) => (
                      <li key={i}>{p.title} — Stock remaining: <strong>{p.stock}</strong> (Units sold: {p.unitsSold})</li>
                    ))}
                    {(!data?.recommendations?.increaseStock || data.recommendations.increaseStock.length === 0) && (
                      <li>No restock alerts active. Stock levels sufficient.</li>
                    )}
                  </ul>
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div className="recommendation-block alert-indigo">
                  <h4 className="title">📢 Increase Marketing (High Margin, Low Sales)</h4>
                  <ul>
                    {(data?.recommendations?.increaseMarketing || []).slice(0, 8).map((p, i) => (
                      <li key={i}>{p.title} — Margin: <strong>{p.margin}%</strong> (Sold: {p.unitsSold})</li>
                    ))}
                    {(!data?.recommendations?.increaseMarketing || data.recommendations.increaseMarketing.length === 0) && (
                      <li>No marketing push suggestions available.</li>
                    )}
                  </ul>
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div className="recommendation-block alert-warning">
                  <h4 className="title">⚠️ Review Pricing Structure (High Sales, Low Margin)</h4>
                  <ul>
                    {(data?.recommendations?.reviewPrice || []).slice(0, 8).map((p, i) => (
                      <li key={i}>{p.title} — Margin: <strong>{p.margin}%</strong> (Units sold: {p.unitsSold})</li>
                    ))}
                    {(!data?.recommendations?.reviewPrice || data.recommendations.reviewPrice.length === 0) && (
                      <li>No pricing anomalies found. Profit levels look stable.</li>
                    )}
                  </ul>
                </div>
              </Col>

              <Col xs={24} lg={12}>
                <div className="recommendation-block alert-error">
                  <h4 className="title">🛑 Stop Restocking / Apply Clearance (Low Sales, Low Profit)</h4>
                  <ul>
                    {(data?.recommendations?.reduceStopStock || []).slice(0, 8).map((p, i) => (
                      <li key={i}>{p.title} — Stock: <strong>{p.stock}</strong> (Units sold: {p.unitsSold})</li>
                    ))}
                    {(!data?.recommendations?.reduceStopStock || data.recommendations.reduceStopStock.length === 0) && (
                      <li>No clearout recommendations needed.</li>
                    )}
                  </ul>
                </div>
              </Col>

              <Col xs={24}>
                <div className="recommendation-block alert-purple" style={{ background: "#f5f3ff", borderLeftColor: "#7c3aed" }}>
                  <h4 className="title" style={{ color: "#6d28d9" }}>🔥 Featured Products (High Profit, Strong Customer Repeat Purchases)</h4>
                  <ul>
                    {(data?.recommendations?.promote || []).slice(0, 8).map((p, i) => (
                      <li key={i}>{p.title} — Profit generated: <strong>₹{p.profit.toLocaleString()}</strong> (Customer repeat rate: {p.repeatRate}%)</li>
                    ))}
                    {(!data?.recommendations?.promote || data.recommendations.promote.length === 0) && (
                      <li>No products qualified yet for features tag.</li>
                    )}
                  </ul>
                </div>
              </Col>
            </Row>
          </Card>
        </TabPane>

        {/* TAB 5: CUSTOMER COHORTS AND RETENTION */}
        <TabPane tab="🔄 Customer Cohorts & Retention" key="retention">
          <Row gutter={[20, 20]}>
            
            <Col xs={24} lg={12}>
              <Card className="dash-card" title="Customer Retention Metrics">
                <div className="retention-list">
                  <div className="retention-item">
                    <span className="label">Total Unique Buyers:</span>
                    <strong className="val">{data?.customerRetention?.totalCustomers} customers</strong>
                  </div>
                  <div className="retention-item">
                    <span className="label">New Customer acquisition:</span>
                    <strong className="val">{data?.customerRetention?.newCustomers} customers</strong>
                  </div>
                  <div className="retention-item">
                    <span className="label">Returning / Repeat buyers:</span>
                    <strong className="val">{data?.customerRetention?.returningCustomers} customers</strong>
                  </div>
                  <div className="retention-item">
                    <span className="label">Average Orders per Customer:</span>
                    <strong className="val">{data?.customerRetention?.averageOrdersPerCustomer} orders</strong>
                  </div>
                  <div className="retention-item">
                    <span className="label">Average customer spend:</span>
                    <strong className="val">₹{data?.customerRetention?.averageCustomerSpending?.toLocaleString()}</strong>
                  </div>
                  <div className="retention-item">
                    <span className="label">Total Repeat customer revenue:</span>
                    <strong className="val" style={{ color: "#4f46e5" }}>₹{data?.customerRetention?.revenueFromRepeatCustomers?.toLocaleString()}</strong>
                  </div>
                  <div className="retention-item">
                    <span className="label">Net profit from repeat customers:</span>
                    <strong className="val" style={{ color: "#10b981" }}>₹{data?.customerRetention?.profitFromRepeatCustomers?.toLocaleString()}</strong>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="dash-card" title="Most Loyal Products (Repeat purchases)">
                <Table
                  dataSource={data?.repeatPurchaseProducts || []}
                  rowKey="productId"
                  pagination={{ pageSize: 5 }}
                  size="small"
                  columns={[
                    {
                      title: "Product Name",
                      dataIndex: "title",
                      key: "title",
                      render: (txt) => <span style={{ fontWeight: 600 }}>{txt}</span>
                    },
                    {
                      title: "Unique Buyers",
                      dataIndex: "uniqueBuyers",
                      key: "uniqueBuyers"
                    },
                    {
                      title: "Repeat Rate",
                      dataIndex: "repeatPurchaseRate",
                      key: "repeatPurchaseRate",
                      render: (val) => <strong>{val}%</strong>
                    },
                    {
                      title: "Repeat profit",
                      dataIndex: "repeatProfit",
                      key: "repeatProfit",
                      render: (val) => `₹${val.toLocaleString()}`
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* TAB 6: INVENTORY & RUN-RATE */}
        <TabPane tab="⏳ Inventory Run-Rate Connection" key="inventory">
          <Card className="dash-card">
            <h3 style={{ margin: "0 0 8px", fontWeight: 700 }}>Inventory Run-rate & Stock Out Projection</h3>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Based on transaction trends in the selected period</p>
            
            <Table
              dataSource={data?.inventoryProfitConnection || []}
              rowKey="productId"
              pagination={{ pageSize: 15 }}
              className="premium-table"
              columns={[
                {
                  title: "Product Name",
                  dataIndex: "title",
                  key: "title",
                  render: (txt) => <span style={{ fontWeight: 600 }}>{txt}</span>
                },
                {
                  title: "Current Stock",
                  dataIndex: "stock",
                  key: "stock",
                  render: (val) => <strong>{val} units</strong>
                },
                {
                  title: "Units Sold",
                  dataIndex: "unitsSold",
                  key: "unitsSold"
                },
                {
                  title: "Avg Daily Sales",
                  dataIndex: "avgDailySales",
                  key: "avgDailySales",
                  render: (val) => `${val} units/day`
                },
                {
                  title: "Est. Stock Days Remaining",
                  dataIndex: "estimatedDaysRemaining",
                  key: "estimatedDaysRemaining",
                  render: (val) => (
                    <span style={{ fontWeight: 700, color: val === "∞" ? "#64748b" : (val <= 7 ? "#ef4444" : "#10b981") }}>
                      {val === "∞" ? "No demand (No sales)" : `${val} Days`}
                    </span>
                  )
                },
                {
                  title: "Reorder Recommendation",
                  dataIndex: "restockRecommended",
                  key: "restockRecommended",
                  render: (restock) => (
                    restock ? (
                      <span className="badge-critical">⚠️ RESTOCK RECOMMENDED</span>
                    ) : (
                      <span className="badge-safe">✅ Sufficient Stock</span>
                    )
                  )
                }
              ]}
            />
          </Card>
        </TabPane>

        {/* TAB 7: TRENDS & CHART LOGS */}
        <TabPane tab="📈 Sales & Profit Trends" key="trends">
          <Row gutter={[20, 20]}>
            
            <Col xs={24}>
              <Card className="dash-card" title="Daily sales transaction values log">
                <Table
                  dataSource={data?.salesTrends?.daily || []}
                  rowKey="date"
                  pagination={{ pageSize: 10 }}
                  size="small"
                  columns={[
                    {
                      title: "Date",
                      dataIndex: "date",
                      key: "date",
                      render: (d) => dayjs(d).format("DD MMMM YYYY")
                    },
                    {
                      title: "Orders Count",
                      dataIndex: "orders",
                      key: "orders"
                    },
                    {
                      title: "Total Units Sold",
                      dataIndex: "units",
                      key: "units"
                    },
                    {
                      title: "Revenue Received",
                      dataIndex: "revenue",
                      key: "revenue",
                      render: (v) => `₹${v.toLocaleString()}`
                    },
                    {
                      title: "Profit Earned",
                      dataIndex: "profit",
                      key: "profit",
                      render: (v) => (
                        <span style={{ color: "#10b981", fontWeight: 700 }}>
                          ₹{v.toLocaleString()}
                        </span>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* ── Page Styles ───────────────────────────────────────────── */}
      <style>{`
        .analytics-root {
          background: #f8fafc;
          padding: 24px;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        }

        .analytics-header {
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
          border-radius: 20px;
          padding: 24px 32px;
          color: #fff;
          margin-bottom: 24px;
          box-shadow: 0 10px 30px rgba(30, 27, 75, 0.2);
        }

        .premium-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 20px;
          letter-spacing: 0.8px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .analytics-title {
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 850;
          color: #fff;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .analytics-subtitle {
          color: #c7d2fe;
          font-size: 13px;
          margin: 4px 0 0;
          font-weight: 500;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .btn-export {
          background: #10b981 !important;
          border-color: #10b981 !important;
          border-radius: 10px !important;
          height: 38px !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4) !important;
        }

        .btn-print {
          border-radius: 10px !important;
          height: 38px !important;
          font-weight: 600 !important;
          border: 1px solid #cbd5e1 !important;
        }

        /* Filters Card */
        .filter-card {
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
          margin-bottom: 24px;
          background: #fff;
        }

        .filter-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }

        .filter-btn {
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 6px 12px;
          font-size: 12px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          color: #475569;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          background: #f1f5f9;
          color: #1e1b4b;
        }

        .filter-btn.active {
          background: #1e1b4b;
          color: #fff;
          border-color: #1e1b4b;
        }

        .clear-btn {
          border-radius: 8px !important;
          font-weight: 600 !important;
          border-color: #e2e8f0 !important;
          color: #64748b !important;
        }

        /* Summary Card */
        .summary-card {
          background: #eef2ff !important;
          border: 1px solid #c7d2fe !important;
          border-radius: 16px !important;
        }

        .summary-icon {
          font-size: 24px;
          background: #fff;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(99,102,241,0.1);
        }

        /* KPI cards */
        .kpi-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02);
          border: 1px solid #f1f5f9;
          transition: transform 0.25s ease;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }

        .kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .kpi-content {
          flex: 1;
        }

        .kpi-title {
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.5px;
          display: block;
        }

        .kpi-value {
          font-size: 22px;
          font-weight: 800;
          margin: 2px 0;
          color: #0f172a;
          line-height: 1;
        }

        .kpi-sub {
          font-size: 11px;
          color: #64748b;
        }

        /* KPI card variations */
        .kpi-card.purple .kpi-icon { background: #e0e7ff; color: #4f46e5; }
        .kpi-card.orange .kpi-icon { background: #ffedd5; color: #ea580c; }
        .kpi-card.green .kpi-icon { background: #d1fae5; color: #10b981; }
        .kpi-card.teal .kpi-icon { background: #ccfbf1; color: #0d9488; }
        .kpi-card.indigo .kpi-icon { background: #e0e7ff; color: #4338ca; }
        .kpi-card.blue .kpi-icon { background: #dbeafe; color: #2563eb; }
        .kpi-card.pink .kpi-icon { background: #fce7f3; color: #db2777; }
        .kpi-card.rose .kpi-icon { background: #ffe4e6; color: #e11d48; }

        /* Tables & Cards */
        .dash-card {
          border-radius: 16px !important;
          border: none !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03) !important;
          background: #fff;
        }

        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          font-weight: 700 !important;
          color: #475569 !important;
          font-size: 12px !important;
        }

        .premium-table .ant-table-tbody > tr > td {
          font-size: 13px !important;
        }

        /* Matrix 2x2 box */
        .matrix-box {
          border-radius: 16px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.02) !important;
          border: 1px solid #f1f5f9;
        }

        .matrix-box .ant-card-head {
          border-bottom: 1px solid #f1f5f9 !important;
          background: #fafafa;
        }

        .matrix-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .matrix-item {
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 10px;
          border-left: 3px solid #cbd5e1;
        }

        .matrix-item .title {
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
        }

        .matrix-item .details {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        /* Recommendations */
        .recommendation-block {
          padding: 18px;
          border-radius: 14px;
          height: 100%;
          border-left: 4px solid #cbd5e1;
        }

        .recommendation-block.alert-success { background: #f0fdf4; border-left-color: #22c55e; }
        .recommendation-block.alert-success .title { color: #15803d; }
        .recommendation-block.alert-indigo { background: #eef2ff; border-left-color: #6366f1; }
        .recommendation-block.alert-indigo .title { color: #4338ca; }
        .recommendation-block.alert-warning { background: #fefce8; border-left-color: #eab308; }
        .recommendation-block.alert-warning .title { color: #a16207; }
        .recommendation-block.alert-error { background: #fef2f2; border-left-color: #ef4444; }
        .recommendation-block.alert-error .title { color: #b91c1c; }

        .recommendation-block .title {
          font-weight: 700;
          font-size: 13px;
          margin-top: 0;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .recommendation-block ul {
          padding-left: 18px;
          margin: 0;
          font-size: 12px;
          color: #475569;
          line-height: 1.8;
        }

        /* Retention List */
        .retention-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .retention-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }

        .retention-item .label {
          color: #64748b;
          font-weight: 500;
        }

        .retention-item .val {
          color: #0f172a;
          font-weight: 700;
        }

        /* Badges */
        .badge-critical {
          background: #fee2e2;
          color: #ef4444;
          font-size: 9px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 12px;
        }

        .badge-safe {
          background: #d1fae5;
          color: #10b981;
          font-size: 9px;
          font-weight: 850;
          padding: 3px 8px;
          border-radius: 12px;
        }

        /* Print Media Styles */
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .main-header, .main-sider, .ant-layout-sider, .mobile-drawer,
          .filter-card, .action-buttons, .analytics-tabs .ant-tabs-nav,
          .clear-btn {
            display: none !important;
            visibility: hidden !important;
          }
          .site-layout {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          .analytics-root {
            padding: 0 !important;
            background: #fff !important;
          }
          .analytics-header {
            background: none !important;
            color: #000 !important;
            padding: 0 !important;
            border-bottom: 2px solid #000;
            margin-bottom: 20px;
          }
          .analytics-title { color: #000 !important; }
          .analytics-subtitle { color: #64748b !important; }
          .kpi-card {
            border: 1px solid #000 !important;
            box-shadow: none !important;
          }
          .kpi-card.purple .kpi-icon, .kpi-card.orange .kpi-icon,
          .kpi-card.green .kpi-icon, .kpi-card.teal .kpi-icon {
            background: none !important;
            color: #000 !important;
          }
          .dash-card {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default BusinessAnalytics;
