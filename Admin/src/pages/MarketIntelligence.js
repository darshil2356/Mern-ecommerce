import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { Button, Select, message } from "antd";
import { 
  FaChartLine, FaSearch, FaMapMarkerAlt, FaDollarSign, FaIndustry, FaExclamationTriangle, 
  FaCheckCircle, FaTimesCircle, FaRocket, FaLightbulb 
} from "react-icons/fa";

import { 
  getMarketIntelLast, generateMarketIntel, clearError, setSegment 
} from "../features/marketIntel/marketIntelSlice";

const { Option } = Select;

/* ─── UI Components (adapted from AiGrowthReport) ─── */
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const Chip = ({ label, color = "#6366f1", bg }) => (
  <span style={{
    display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
    background: bg || `${color}22`, color, border: `1px solid ${color}40`,
  }}>{label}</span>
);

const Card = ({ children, style = {} }) => (
  <motion.div variants={fadeUp} style={{
    background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 32px rgba(99,102,241,.08)",
    border: "1px solid #f1f5f9", marginBottom: 28, ...style,
  }}>{children}</motion.div>
);

const SectionTitle = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 24, background: "#f0f9ff", padding: 8, borderRadius: 12, color: "#0ea5e9" }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{title}</h3>
    </div>
{sub && <p style={{ margin: "8px 0 0 36px", fontSize: 14, color: "#64748b" }}>{sub}</p>}
  </div>
);

const LoadingScreen = ({ segment }) => {
  const STEPS = [
    `🔍 Analyzing ${segment.toUpperCase()} wear trends...`,
    "📈 Fetching Google Trends & eCommerce data...",
    "🛒 Checking Meesho/Flipkart/Amazon sales...",
    "📍 Mapping top states & cities...",
    "💰 Calculating pricing & margins...",
    "✅ Compiling your action plan...",
  ];
  
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "100px 20px" }}>
      <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} 
        style={{ fontSize: 80, marginBottom: 32 }}>🎯</motion.div>
      <h2 style={{ color: "#1e293b", fontWeight: 900, fontSize: 28, marginBottom: 16 }}>Generating Market Intelligence...</h2>
      <AnimatePresence mode="wait">
        <motion.p key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          style={{ color: "#6366f1", fontWeight: 700, fontSize: 16, marginBottom: 40 }}>
          {STEPS[step]}
        </motion.p>
      </AnimatePresence>
      <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
        {STEPS.map((_, i) => (
          <motion.div key={i} animate={{ 
            scale: i === step ? 1.6 : 1, 
            backgroundColor: i <= step ? "#6366f1" : "#e2e8f0" 
          }} transition={{ type: "spring" }}
            style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#e2e8f0" }} 
          />
        ))}
      </div>
    </motion.div>
  );
};

const HeroEmpty = ({ onGenerate, currentSegment, onSegmentChange }) => (
  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
    style={{ textAlign: "center", padding: "80px 40px", maxWidth: 600, margin: "0 auto" }}>
    <div style={{
      width: 140, height: 140, borderRadius: "50%", margin: "0 auto 32px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64, boxShadow: "0 20px 60px rgba(99,102,241,.3)"
    }}>📊</div>
    <h1 style={{ fontWeight: 900, fontSize: 36, background: "linear-gradient(135deg, #1e293b, #334155)", webkitBackgroundClip: "text", webkitTextFillColor: "transparent", marginBottom: 16 }}>
      Market Intelligence
    </h1>
    <p style={{ color: "#64748b", fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
      AI analyzes <strong>real-time Indian fashion trends</strong> from Google Trends, Meesho, Flipkart, Amazon, 
      wholesale markets (Surat/Delhi), Instagram. Get trending products, keywords, pricing, gaps for your store.
    </p>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, maxWidth: 400, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, width: "100%", flexWrap: "wrap", justifyContent: "center" }}>
        <Select value={currentSegment} onChange={onSegmentChange} style={{ width: 200 }} placeholder="Select segment">
          <Option value="women">👗 Women</Option>
          <Option value="men">👔 Men</Option>
          <Option value="kids">👶 Kids</Option>
          <Option value="all">🌐 All</Option>
        </Select>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={onGenerate}
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 16,
            padding: "18px 48px", fontWeight: 800, fontSize: 16, cursor: "pointer",
            boxShadow: "0 12px 40px rgba(99,102,241,.4)", letterSpacing: 0.5,
          }}>
          ✨ Generate Report
        </motion.button>
      </div>
      <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Free • Gemini AI powered • 20-30 seconds</p>
    </div>
  </motion.div>
);

/* ─── DATA SECTIONS ─── */
const SummarySection = ({ data }) => (
  <Card>
    <SectionTitle icon="📈" title="Market Summary" sub={`Latest ${data.segment?.toUpperCase()} wear trends - India`} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20 }}>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#6366f1" }}>{data.trending_products?.length || 0}</div>
        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Hot Products</div>
      </div>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#10b981" }}>{data.keyword_universe?.length || 0}</div>
        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Keywords</div>
      </div>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#f59e0b" }}>{data.market_gaps?.length || 0}</div>
        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Market Gaps</div>
      </div>
      <div style={{ textAlign: "center", padding: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#ef4444" }}>{data.avoid_products?.length || 0}</div>
        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Avoid</div>
      </div>
    </div>
    {data.summary && (
      <div style={{ marginTop: 32, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", padding: 24, borderRadius: 16, borderLeft: "4px solid #6366f1" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>📢 Key Insights</div>
        <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.8 }}>{data.summary}</div>
      </div>
    )}
  </Card>
);

const TrendingProducts = ({ products }) => {
  const [expanded, setExpanded] = useState(null);
  if (!products?.length) return null;

  return (
    <Card>
      <SectionTitle icon="🔥" title="Top Trending Products" sub="Ranked by search volume + trend score. Click to expand details." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {products.map((product, i) => (
          <motion.div key={i} variants={fadeUp}
            style={{ border: `2px solid ${expanded === i ? "#6366f1" : "#e5e7eb"}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
            
            {/* Header */}
            <div onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ padding: "20px 24px", cursor: "pointer", background: expanded === i ? "#f8faff" : "#fff", display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, #6366f1, #8b5cf6)`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900 }}>
                #{product.rank || i+1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{product.product_name}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{product.category}</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Chip label={`${product.monthly_search_volume || 'N/A'}`} color="#10b981" />
                <Chip label={`Trend: ${product.trend_direction || 'N/A'}`} color="#f59e0b" />
                <Chip label={`Score: ${product.add_to_store_score || 0}`} color="#6366f1" />
              </div>
              <span style={{ color: "#9ca3af", fontSize: 20, fontWeight: 600 }}>{expanded === i ? "▲" : "▼"}</span>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expanded === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0 }} 
                  style={{ overflow: "hidden", background: "#fafbff" }}>
                  <div style={{ padding: "24px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 12 }}>📍 TOP REGIONS</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {product.top_states?.slice(0,6).map((state, j) => (
                            <Chip key={j} label={state} color="#3b82f6" bg="#eff6ff" />
                          ))}
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>🏙️ Top Cities</div>
                          {product.top_cities?.slice(0,6).map((city, j) => (
                            <Chip key={j} label={city} color="#8b5cf6" bg="#f5f3ff" />
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 12 }}>🔍 TOP KEYWORDS</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {product.top_keywords?.slice(0,5).map((kw, j) => (
                            <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", padding: 8, borderRadius: 12, border: "1px solid #e5e7eb" }}>
                              <span style={{ color: "#10b981", fontSize: 18 }}>🔍</span>
                              <span style={{ fontWeight: 600 }}>{kw.keyword}</span>
                              <span style={{ fontSize: 12, color: "#6b7280" }}>({kw.monthly_searches})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, marginBottom: 24 }}>
                      {[
                        { label: "Retail ₹", value: `${product.pricing?.retail_low || ''} - ${product.pricing?.retail_high || ''}`, icon: "💰" },
                        { label: "Wholesale ₹", value: `${product.pricing?.wholesale_low || ''} - ${product.pricing?.wholesale_high || ''}`, icon: "🏭" },
                        { label: "Margin", value: product.pricing?.profit_margin || '', icon: "📊" },
                        { label: "Age", value: product.target_age || '', icon: "👤" },
                        { label: "Peak Months", value: product.peak_months?.join(', ') || '', icon: "📅" },
                      ].map((item, j) => (
                        <div key={j} style={{ textAlign: "center", padding: "16px 12px", background: "#fff", borderRadius: 12, border: "1px solid #f3f4f6" }}>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{item.value || "—"}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{item.label}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: "#fef3cd", border: "1px solid #f59e0b40", borderRadius: 12, padding: 20, marginBottom: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 12 }}>💡 Why Add This? ({product.add_to_store_score}/100)</div>
                      <div style={{ fontSize: 15, color: "#78350f", lineHeight: 1.7 }}>{product.add_to_store_reason}</div>
                    </div>

                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 12 }}>🎨 Manufacturing Tips</div>
                        <div style={{ lineHeight: 1.7, color: "#374151" }}>
                          <div><strong>Fabric:</strong> {product.manufacturing?.fabric || ''}</div>
                          <div><strong>Colors:</strong> {product.manufacturing?.popular_colors?.join(', ') || ''}</div>
                          <div><strong>Sizes:</strong> {product.manufacturing?.popular_sizes?.join(', ') || ''}</div>
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 12 }}>📱 Platforms</div>
                        {product.platforms?.map((plat, j) => (
                          <div key={j} style={{ background: "#f0f9ff", padding: 12, borderRadius: 10, marginBottom: 8, border: "1px solid #0ea5e940" }}>
                            <div style={{ fontWeight: 700, color: "#0369a1" }}>{plat.name}</div>
                            <div style={{ fontSize: 13, color: "#0c4a6e" }}>{plat.daily_units_sold} | ₹{plat.avg_price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

const KeywordUniverse = ({ keywords }) => {
  if (!keywords?.length) return null;
  return (
    <Card>
      <SectionTitle icon="🔍" title="Keyword Universe" sub="Top search terms - sorted by monthly searches" />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "16px 12px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Keyword</th>
              <th style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Searches/Mo</th>
              <th style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Trend</th>
              <th style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Intent</th>
            </tr>
          </thead>
          <tbody>
            {keywords.slice(0, 20).map((kw, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 ? "#fafbff" : "#fff" }}>
                <td style={{ padding: "16px 12px", fontWeight: 600, color: "#1e293b" }}>{kw.keyword}</td>
                <td style={{ padding: "16px 12px", textAlign: "right", fontWeight: 700, color: "#10b981" }}>{kw.monthly_searches}</td>
                <td style={{ padding: "16px 12px", textAlign: "right" }}>
                  <Chip label={kw.trend} color={kw.trend === "Rising" ? "#10b981" : kw.trend === "Declining" ? "#ef4444" : "#6b7280"} />
                </td>
                <td style={{ padding: "16px 12px", textAlign: "right" }}>
                  <Chip label={kw.buying_intent || 'Medium'} color="#3b82f6" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const MarketGaps = ({ gaps }) => {
  if (!gaps?.length) return null;
  return (
    <Card>
      <SectionTitle icon="💡" title="Market Gaps" sub="Undersupplied products with high demand" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {gaps.map((gap, i) => (
          <motion.div key={i} variants={fadeUp} style={{ 
            background: "linear-gradient(135deg, #10b98120, #dcfce720)", border: "1px solid #10b98140", 
            borderRadius: 16, padding: 24 
          }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#065f46", marginBottom: 12 }}>{gap.product}</div>
            <div style={{ fontSize: 15, color: "#064e3b", lineHeight: 1.7, marginBottom: 16 }}>{gap.reason}</div>
            <div style={{ fontSize: 14, color: "#047857", fontWeight: 700 }}>Potential: High Demand + Low Supply</div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

const AvoidProducts = ({ avoid }) => {
  if (!avoid?.length) return null;
  return (
    <Card>
      <SectionTitle icon="⛔" title="Avoid These" sub="Oversaturated or declining products" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {avoid.map((item, i) => (
          <motion.div key={i} variants={fadeUp} style={{
            background: "linear-gradient(135deg, #ef444420, #fca5a520)", border: "1px solid #ef444440",
            borderRadius: 16, padding: 20, display: "flex", gap: 16, alignItems: "flex-start"
          }}>
            <div style={{ fontSize: 28, color: "#dc2626" }}>⚠️</div>
            <div>
              <div style={{ fontWeight: 700, color: "#991b1b", marginBottom: 4 }}>{item.product}</div>
              <div style={{ fontSize: 14, color: "#7f1d1d", lineHeight: 1.6 }}>{item.reason}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

const ActionPlan = ({ plan }) => {
  if (!plan?.length) return null;
  return (
    <Card>
      <SectionTitle icon="🚀" title="30-Day Action Plan" sub="Specific steps prioritized for your store" />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {plan.map((step, i) => (
          <motion.div key={i} variants={fadeUp} style={{
            background: "#fff", border: "2px solid #6366f140", borderRadius: 16, padding: 20,
            display: "flex", gap: 16, alignItems: "flex-start"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", borderRadius: 12,
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, flexShrink: 0
            }}>
              {i+1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>{step}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

const MarketIntelligence = () => {
  const dispatch = useDispatch();
  const { data, loading, lastLoading, error, segment } = useSelector((state) => state.marketIntel);
  
  useEffect(() => {
    dispatch(getMarketIntelLast(segment));
  }, [dispatch, segment]);

  const handleGenerate = () => {
    dispatch(generateMarketIntel(segment));
  };

  const handleSegmentChange = (value) => {
    dispatch(setSegment(value));
    dispatch(clearError());
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg, #1e293b, #334155)", webkitBackgroundClip: "text", webkitTextFillColor: "transparent", margin: 0 }}>
            Market Intelligence
          </h1>
<p style={{ margin: 0, fontSize: 16, color: "#64748b" }}>Real-time Indian fashion trends powered by AI</p>
        </div>
        {data && (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Select value={segment} onChange={handleSegmentChange} style={{ width: 140 }} />
            <Button type="primary" onClick={handleGenerate} loading={loading} size="large">
              {loading ? "Generating..." : "🔄 Regenerate"}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#dc2626", fontWeight: 600 }}>
            ⚠️ {error}
            <Button size="small" onClick={() => dispatch(clearError())} style={{ marginLeft: "auto" }}>✕</Button>
          </div>
        </motion.div>
      )}

      {lastLoading && (
        <div style={{ textAlign: "center", padding: 80, color: "#94a3b8" }}>
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} 
            style={{ fontSize: 48, marginBottom: 20 }}>📊</motion.div>
          Loading latest report...
        </div>
      )}

      {loading && <LoadingScreen segment={segment} />}
      {!loading && !data && !lastLoading && <HeroEmpty onGenerate={handleGenerate} currentSegment={segment} onSegmentChange={handleSegmentChange} />}

      <AnimatePresence>
        {data && !loading && (
          <motion.div variants={stagger} initial="hidden" animate="show">
            <SummarySection data={data} />
            <TrendingProducts products={data.trending_products || []} />
            <KeywordUniverse keywords={data.keyword_universe || []} />
            <MarketGaps gaps={data.market_gaps || []} />
            <AvoidProducts avoid={data.avoid_products || []} />
            <ActionPlan plan={data.action_plan || []} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketIntelligence;

