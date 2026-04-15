import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/axiosconfig";

/* ─── tiny helpers ─── */
const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

const demandColor = { High: "#22c55e", Medium: "#f59e0b", Low: "#ef4444" };
const sizeColor   = { Large: "#6366f1", Medium: "#f59e0b", Small: "#94a3b8" };
const trendColor  = { Rising: "#22c55e", Stable: "#6366f1", Declining: "#ef4444" };
const compColor   = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444" };

const Chip = ({ label, color = "#6366f1", bg }) => (
  <span style={{
    display: "inline-block", padding: "3px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
    background: bg || color + "22", color,
  }}>{label}</span>
);

const Card = ({ children, style = {} }) => (
  <motion.div variants={fadeUp} style={{
    background: "#fff", borderRadius: 20, padding: 28,
    boxShadow: "0 4px 32px rgba(99,102,241,.08)", marginBottom: 28, ...style,
  }}>{children}</motion.div>
);

const SectionTitle = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>{title}</h3>
    </div>
    {sub && <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", paddingLeft: 32 }}>{sub}</p>}
  </div>
);

/* ─── Loading screen ─── */
const STEPS = [
  "📦 Reading your products from database...",
  "🛒 Analysing your orders & revenue...",
  "👥 Checking your customer data...",
  "📊 Researching Indian market trends...",
  "💡 Building personalised strategies...",
  "✅ Finalising your report...",
];

const LoadingScreen = () => {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ textAlign: "center", padding: "80px 20px" }}>
      {/* pulsing brain */}
      <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
        style={{ fontSize: 72, marginBottom: 24 }}>🤖</motion.div>
      <h3 style={{ color: "#1e1b4b", fontWeight: 800, marginBottom: 8 }}>AI is working for you…</h3>
      <AnimatePresence mode="wait">
        <motion.p key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          style={{ color: "#6366f1", fontWeight: 600, fontSize: 15, marginBottom: 32 }}>
          {STEPS[step]}
        </motion.p>
      </AnimatePresence>
      {/* progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {STEPS.map((_, i) => (
          <motion.div key={i} animate={{ scale: i === step ? 1.4 : 1, background: i <= step ? "#6366f1" : "#e2e8f0" }}
            style={{ width: 10, height: 10, borderRadius: "50%", background: "#e2e8f0" }} />
        ))}
      </div>
      <p style={{ marginTop: 24, fontSize: 12, color: "#cbd5e1" }}>This usually takes 15–30 seconds</p>
    </motion.div>
  );
};

/* ─── Hero / empty state ─── */
const HeroEmpty = ({ onGenerate, loading }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
    style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{
      width: 100, height: 100, borderRadius: "50%", margin: "0 auto 24px",
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44,
      boxShadow: "0 12px 40px rgba(99,102,241,.35)",
    }}>🚀</div>
    <h2 style={{ fontWeight: 900, fontSize: 28, color: "#1e1b4b", marginBottom: 10 }}>AI Growth Report</h2>
    <p style={{ color: "#64748b", fontSize: 15, maxWidth: 480, margin: "0 auto 12px" }}>
      AI reads your <b>real products, orders, and customers</b> from the database, then generates a growth report specific to your store — not generic advice.
    </p>
    <div style={{ display: "flex", justifyContent: "center", gap: 24, margin: "28px 0", flexWrap: "wrap" }}>
      {[["📦","Your Products"],["📊","Market Research"],["🏆","Top Picks"],["💡","Growth Ideas"]].map(([icon, label]) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>{label}</div>
        </div>
      ))}
    </div>
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={onGenerate} disabled={loading}
      style={{
        background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff",
        border: "none", borderRadius: 14, padding: "16px 44px",
        fontWeight: 800, fontSize: 16, cursor: "pointer",
        boxShadow: "0 8px 28px rgba(99,102,241,.4)", letterSpacing: .3,
      }}>
      ✨ Generate My Report
    </motion.button>
    <p style={{ marginTop: 14, fontSize: 12, color: "#cbd5e1" }}>Free · Powered by Gemini AI · Takes ~20 sec</p>
  </motion.div>
);

/* ══════════════════════════════════════════
   SECTION 1 — Market Research
══════════════════════════════════════════ */
const MarketResearch = ({ items }) => {
  const [expanded, setExpanded] = useState(null);
  return (
    <Card>
      <SectionTitle icon="📊" title="Market Research" sub="5 trending products — with states, keywords, pricing & upload tips specific to your store" />
      <div style={{ display: "grid", gap: 16 }}>
        {items.map((item, i) => (
          <motion.div key={i} variants={fadeUp}
            style={{ border: `2px solid ${expanded === i ? "#6366f1" : "#f1f5f9"}`, borderRadius: 16, overflow: "hidden", transition: "border-color .2s" }}>

            {/* ── Row header ── */}
            <div
              onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ padding: "16px 20px", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", background: expanded === i ? "#f8faff" : "#fff" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b" }}>{item.product}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{item.peak_season} · {item.trend_source}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                <Chip label={`📈 ${item.google_trend_direction}`} color={trendColor[item.google_trend_direction] || "#6366f1"} />
                <Chip label={`Demand: ${item.demand_level}`} color={demandColor[item.demand_level] || "#6366f1"} />
                <Chip label={`Competition: ${item.competition_level}`} color={compColor[item.competition_level] || "#6366f1"} />
                <Chip label={item.should_add === "Yes" ? "✅ Add This" : "⏭ Skip"} color={item.should_add === "Yes" ? "#22c55e" : "#ef4444"} />
              </div>
              <span style={{ color: "#6366f1", fontSize: 18, flexShrink: 0 }}>{expanded === i ? "▲" : "▼"}</span>
            </div>

            {/* ── Expanded detail ── */}
            <AnimatePresence>
              {expanded === i && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                  <div style={{ padding: "0 20px 20px", display: "grid", gap: 16 }}>

                    {/* Why trending + relevance */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div style={{ background: "#f8faff", borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>WHY TRENDING</div>
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{item.why_trending}</div>
                      </div>
                      <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>RELEVANCE TO YOUR STORE</div>
                        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{item.relevance_to_my_store}</div>
                      </div>
                    </div>

                    {/* Geography */}
                    <div style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 10 }}>📍 WHERE IT SELLS MOST IN INDIA</div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#6366f1", marginBottom: 6 }}>Top States</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {item.top_states?.map((s, j) => <span key={j} style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{s}</span>)}
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 140 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#8b5cf6", marginBottom: 6 }}>Top Cities</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {item.top_cities?.map((c, j) => <span key={j} style={{ background: "#ede9fe", color: "#6d28d9", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{c}</span>)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Keywords */}
                    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>🔍 TOP SEARCH KEYWORDS (Google / Meesho / Flipkart)</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {item.top_search_keywords?.map((kw, j) => (
                          <span key={j} style={{ background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid #fde68a" }}>🔍 {kw}</span>
                        ))}
                      </div>
                    </div>

                    {/* Pricing + Audience */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12 }}>
                      {[
                        { label: "Retail Price", value: item.estimated_price_range, icon: "💰" },
                        { label: "Wholesale Price", value: item.wholesale_price_range, icon: "🏭" },
                        { label: "Min Wholesale Qty", value: item.wholesale_min_order, icon: "📦" },
                        { label: "Profit Margin", value: item.profit_margin, icon: "📈" },
                        { label: "Target Age", value: item.age_group, icon: "👤" },
                        { label: "Gender", value: item.gender, icon: "👗" },
                      ].map((d, j) => (
                        <div key={j} style={{ background: "#f8faff", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{d.icon}</div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b" }}>{d.value || "—"}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{d.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Platforms */}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>SELLING WELL ON:</div>
                      {item.platforms_selling_well?.map((p, j) => (
                        <span key={j} style={{ background: "#f1f5f9", color: "#374151", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{p}</span>
                      ))}
                    </div>

                    {/* Upload suggestion */}
                    <div style={{ background: "linear-gradient(135deg,#6366f122,#8b5cf622)", border: "1px solid #c7d2fe", borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 6 }}>💡 HOW TO LIST THIS ON YOUR STORE</div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{item.upload_suggestion}</div>
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

/* ══════════════════════════════════════════
   SECTION 0 — Business Snapshot
══════════════════════════════════════════ */
const BusinessSnapshot = ({ snapshot, context }) => {
  const scoreColor = snapshot.health_score >= 75 ? "#22c55e" : snapshot.health_score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <Card>
      <SectionTitle icon="📈" title="Your Business Snapshot" sub={`Based on real data from ${context?.storeName || "your store"} · Generated ${new Date(context?.generatedAt).toLocaleString("en-IN")}`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Products", value: context?.totalProducts, icon: "📦" },
          { label: "Orders (30d)", value: context?.totalOrders30d, icon: "🛒" },
          { label: "Revenue (30d)", value: `₹${(context?.totalRevenue30d || 0).toLocaleString("en-IN")}`, icon: "💰" },
          { label: "Customers", value: context?.totalCustomers, icon: "👥" },
          { label: "New (30d)", value: context?.newCustomers30d, icon: "🆕" },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} style={{ background: "#f8faff", borderRadius: 14, padding: "16px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e1b4b" }}>{s.value ?? "—"}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, background: "#f0fdf4", borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 800, color: "#22c55e", marginBottom: 10, fontSize: 13 }}>💪 Key Strengths</div>
          {snapshot.key_strengths?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 6, display: "flex", gap: 8 }}><span style={{ color: "#22c55e" }}>✓</span>{s}</div>)}
        </div>
        <div style={{ flex: 1, minWidth: 200, background: "#fff5f5", borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 800, color: "#ef4444", marginBottom: 10, fontSize: 13 }}>⚠️ Urgent Issues</div>
          {snapshot.urgent_issues?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 6, display: "flex", gap: 8 }}><span style={{ color: "#ef4444" }}>!</span>{s}</div>)}
        </div>
        <div style={{ minWidth: 120, background: "#f8faff", borderRadius: 14, padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 8 }}>HEALTH SCORE</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: scoreColor }}>{snapshot.health_score}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor }}>{snapshot.health_label}</div>
        </div>
      </div>
    </Card>
  );
};

/* ══════════════════════════════════════════
   SECTION 2 — Top 2 Products
══════════════════════════════════════════ */
const TopProducts = ({ products }) => (
  <Card>
    <SectionTitle icon="🏆" title="Top 2 Products to Add Now" sub="AI recommends adding these based on your store's actual categories" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {products.map((p, i) => (
        <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }}
          style={{
            borderRadius: 16, padding: "24px 20px",
            background: i === 0 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#f59e0b,#ef4444)",
            color: "#fff", boxShadow: i === 0 ? "0 8px 28px rgba(99,102,241,.35)" : "0 8px 28px rgba(245,158,11,.35)",
          }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>{i === 0 ? "🥇" : "🥈"}</div>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .8, letterSpacing: 1, marginBottom: 6 }}>RANK #{i + 1}</div>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{p.name || p}</div>
          {p.reason && <div style={{ marginTop: 8, fontSize: 12, opacity: .9, lineHeight: 1.5 }}>{p.reason}</div>}
          {p.expected_monthly_sales && <div style={{ marginTop: 8, fontSize: 11, opacity: .8 }}>Est. {p.expected_monthly_sales}/month</div>}
        </motion.div>
      ))}
    </div>
  </Card>
);

/* ══════════════════════════════════════════
   SECTION 3 — SEO Blogs
══════════════════════════════════════════ */
const BlogSection = ({ blogs, savedBlogs }) => {
  const [open, setOpen] = useState(null);
  return (
    <Card>
      <SectionTitle icon="📝" title="AI-Generated SEO Blogs" sub="Ready-to-publish blog posts saved to your website automatically" />
      <div style={{ display: "grid", gap: 16 }}>
        {blogs.map((blog, i) => {
          const saved = savedBlogs?.find(s => s.title === blog.title);
          return (
            <motion.div key={i} variants={fadeUp}
              style={{ border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
              {/* header */}
              <div style={{ padding: "18px 20px", background: "#fafbff", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <Chip label={`Blog ${i + 1}`} color="#6366f1" />
                    {saved && <Chip label="✅ Published to Website" color="#22c55e" />}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b", marginBottom: 4 }}>{blog.title}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>/{blog.slug}</div>
                </div>
                <motion.button whileTap={{ scale: .95 }} onClick={() => setOpen(open === i ? null : i)}
                  style={{ background: open === i ? "#6366f1" : "#f1f5f9", color: open === i ? "#fff" : "#6366f1", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
                  {open === i ? "Hide ▲" : "Preview ▼"}
                </motion.button>
              </div>
              {/* SEO meta */}
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 3 }}>META TITLE</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{blog.meta_title}</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 3 }}>META DESCRIPTION</div>
                  <div style={{ fontSize: 13, color: "#374151" }}>{blog.meta_description}</div>
                </div>
              </div>
              {/* expandable content */}
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: "hidden" }}>
                    <div style={{ padding: "20px", borderTop: "1px solid #f1f5f9", fontSize: 14, lineHeight: 1.9, color: "#374151", whiteSpace: "pre-wrap", maxHeight: 400, overflowY: "auto", background: "#fafbff" }}>
                      {blog.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

/* ══════════════════════════════════════════
   SECTION — Category Analysis
══════════════════════════════════════════ */
const CategoryAnalysis = ({ items }) => (
  <Card>
    <SectionTitle icon="🏷️" title="Your Category Performance" sub="AI analysis of your actual product categories" />
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, i) => (
        <motion.div key={i} variants={fadeUp}
          style={{ border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1e1b4b", marginBottom: 4 }}>{item.category}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{item.performance}</div>
          </div>
          <div style={{ fontSize: 13, color: "#374151", flex: 2, minWidth: 200, background: "#f8faff", borderRadius: 8, padding: "8px 12px" }}>
            💡 {item.suggestion}
          </div>
        </motion.div>
      ))}
    </div>
  </Card>
);

/* ══════════════════════════════════════════
   SECTION 4 — Business Improvement
══════════════════════════════════════════ */
const BusinessImprovement = ({ data }) => (
  <Card>
    <SectionTitle icon="🔧" title="Business Improvement" sub="Based on your actual store data — not generic advice" />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
      <div style={{ background: "#fff5f5", borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 800, color: "#ef4444", marginBottom: 14, fontSize: 13 }}>🚨 Fix Immediately</div>
        {data.fix_immediately?.map((item, i) => (
          <motion.div key={i} variants={fadeUp} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ color: "#ef4444", fontWeight: 700, flexShrink: 0 }}>!</span>
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item}</span>
          </motion.div>
        ))}
      </div>
      <div style={{ background: "#fffbeb", borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 800, color: "#f59e0b", marginBottom: 14, fontSize: 13 }}>❌ Currently Missing</div>
        {data.missing?.map((item, i) => (
          <motion.div key={i} variants={fadeUp} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ color: "#f59e0b", fontWeight: 700, flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item}</span>
          </motion.div>
        ))}
      </div>
      <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 20 }}>
        <div style={{ fontWeight: 800, color: "#22c55e", marginBottom: 14, fontSize: 13 }}>✅ Build Next</div>
        {data.build_next?.map((item, i) => (
          <motion.div key={i} variants={fadeUp} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}>→</span>
            <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </Card>
);

/* ══════════════════════════════════════════
   SECTION 5 — Growth Ideas
══════════════════════════════════════════ */
const IdeaList = ({ items, color, bg, border }) => (
  <>
    {items?.map((item, i) => (
      <motion.div key={i} variants={fadeUp} whileHover={{ x: 4 }}
        style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
        <span style={{ background: color, color: "#fff", borderRadius: 8, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
        <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{item}</span>
      </motion.div>
    ))}
  </>
);

const GrowthIdeas = ({ data }) => (
  <Card>
    <SectionTitle icon="💡" title="Growth Ideas" sub="Specific to your store's categories and real performance data" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
      <div>
        <div style={{ fontWeight: 800, color: "#6366f1", marginBottom: 14, fontSize: 14 }}>📣 Marketing Strategies</div>
        <IdeaList items={data.marketing_strategies} color="#6366f1" bg="#f8faff" border="#e0e7ff" />
      </div>
      <div>
        <div style={{ fontWeight: 800, color: "#8b5cf6", marginBottom: 14, fontSize: 14 }}>🛍️ Product Ideas</div>
        <IdeaList items={data.product_ideas} color="#8b5cf6" bg="#faf5ff" border="#ede9fe" />
      </div>
    </div>
    {data.pricing_strategies?.length > 0 && (
      <div>
        <div style={{ fontWeight: 800, color: "#22c55e", marginBottom: 14, fontSize: 14 }}>💰 Pricing Strategies</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
          <IdeaList items={data.pricing_strategies} color="#22c55e" bg="#f0fdf4" border="#bbf7d0" />
        </div>
      </div>
    )}
  </Card>
);

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function AiGrowthReport() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [lastLoad, setLastLoad] = useState(false);
  const [error, setError]       = useState("");

  // Load last saved report on mount
  useEffect(() => {
    const loadLast = async () => {
      setLastLoad(true);
      try {
        const res = await api.get("/ai/growth/last");
        if (res.data) setData(res.data);
      } catch (_) {}
      finally { setLastLoad(false); }
    };
    loadLast();
  }, []);

  const fetchReport = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await api.get("/ai/growth/report");
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top bar (only when data exists) ── */}
      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: 22, color: "#1e1b4b" }}>🚀 AI Growth Report</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              Based on your real store data · {data._context?.storeName}
              {data._context?.generatedAt && (
                <span style={{ marginLeft: 8, background: "#f1f5f9", padding: "2px 10px", borderRadius: 20, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  🕒 Last generated: {new Date(data._context.generatedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }} onClick={fetchReport}
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 18px rgba(99,102,241,.35)" }}>
            🔄 Regenerate
          </motion.button>
        </motion.div>
      )}

      {/* ── Error ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 14, padding: "16px 20px", color: "#dc2626", marginBottom: 24, fontWeight: 600, fontSize: 14 }}>
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Initial load skeleton ── */}
      {lastLoad && (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }} style={{ fontSize: 40, marginBottom: 12 }}>📋</motion.div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading last report...</div>
        </div>
      )}

      {/* ── States ── */}
      {loading && <LoadingScreen />}
      {!loading && !lastLoad && !data && <HeroEmpty onGenerate={fetchReport} loading={loading} />}

      {/* ── Report ── */}
      <AnimatePresence>
        {data && !loading && (
          <motion.div variants={stagger} initial="hidden" animate="show">
            {data.business_snapshot && <BusinessSnapshot snapshot={data.business_snapshot} context={data._context} />}
            <MarketResearch items={data.market_research || []} />
            <TopProducts products={data.top_2_products || []} />
            {data.category_analysis?.length > 0 && <CategoryAnalysis items={data.category_analysis} />}
            <BusinessImprovement data={data.business_improvement || {}} />
            <GrowthIdeas data={data.growth_ideas || {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
