const asyncHandler = require("express-async-handler");
const axios = require("axios");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const GrowthReport = require("../models/growthReportModel");

const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

// ── Call Gemini with fallback model chain ──────────────────────────────
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const modelList = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...GEMINI_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : GEMINI_MODELS;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  };

  let lastErrMsg = "";
  for (const model of modelList) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        body
      );
      return res;
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error?.message || err.message;
      lastErrMsg = `[${model}] ${msg}`;
      if (status === 429 || status === 404) continue;
      throw new Error(`Gemini API error: ${JSON.stringify(msg)}`);
    }
  }
  throw new Error(`All Gemini models quota exceeded. Last: ${lastErrMsg}`);
};

// ── Parse Gemini JSON response ─────────────────────────────────────────
const parseGeminiJSON = (geminiRes) => {
  const rawText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned non-parseable JSON: " + cleaned.slice(0, 200));
  }
};

// ── Read real business data from DB ───────────────────────────────────
const getRealBusinessContext = async (adminUser) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);

  // Products
  const allProducts = await Product.find()
    .select("title category brand price sold quantity tags attributes seo")
    .lean();

  const totalProducts = allProducts.length;
  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))];
  const topSelling = [...allProducts]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 10)
    .map((p) => `${p.title} (sold: ${p.sold || 0}, category: ${p.category})`);
  const lowStock = allProducts
    .filter((p) => (p.quantity || 0) <= (p.min_stock_alert || 5))
    .slice(0, 5)
    .map((p) => p.title);
  const zeroSales = allProducts.filter((p) => !p.sold || p.sold === 0).length;

  // Orders last 30 days
  const recentOrders = await Order.find({
    createdAt: { $gte: thirtyDaysAgo },
    orderStatus: { $ne: "Cancelled" },
  })
    .select("totalPriceAfterDiscount mode orderItems createdAt orderStatus")
    .lean();

  const totalRevenue30d = recentOrders.reduce((s, o) => s + (o.totalPriceAfterDiscount || 0), 0);
  const totalOrders30d = recentOrders.length;
  const onlineOrders = recentOrders.filter((o) => o.mode === "ONLINE").length;
  const offlineOrders = recentOrders.filter((o) => o.mode === "OFFLINE").length;
  const avgOrderValue = totalOrders30d > 0 ? (totalRevenue30d / totalOrders30d).toFixed(0) : 0;

  // Orders last 90 days for category performance
  const orders90d = await Order.find({
    createdAt: { $gte: ninetyDaysAgo },
    orderStatus: { $ne: "Cancelled" },
  })
    .populate({ path: "orderItems.product", select: "category title" })
    .lean();

  const categoryRevenue = {};
  orders90d.forEach((order) => {
    order.orderItems.forEach((item) => {
      const cat = item.product?.category || "Unknown";
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price || 0) * (item.quantity || 1);
    });
  });
  const topCategories = Object.entries(categoryRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, rev]) => `${cat} (₹${Math.round(rev)})`);

  // Customers
  const totalCustomers = await User.countDocuments({ role: "user" });
  const newCustomers30d = await User.countDocuments({
    role: "user",
    createdAt: { $gte: thirtyDaysAgo },
  });

  return {
    storeName: adminUser?.storeName || "My Store",
    storeState: adminUser?.storeState || "India",
    totalProducts,
    categories,
    brands,
    topSelling,
    lowStock,
    zeroSales,
    totalRevenue30d: Math.round(totalRevenue30d),
    totalOrders30d,
    onlineOrders,
    offlineOrders,
    avgOrderValue,
    topCategories,
    totalCustomers,
    newCustomers30d,
  };
};

// ── Build the dynamic prompt from real data ────────────────────────────
const buildPrompt = (ctx) => `
You are an AI ecommerce growth expert analyzing a REAL Indian clothing store.

=== REAL BUSINESS DATA (from live database) ===
Store Name: ${ctx.storeName}
Store Location: ${ctx.storeState}, India
Total Products: ${ctx.totalProducts}
Product Categories: ${ctx.categories.join(", ") || "Not set"}
Brands: ${ctx.brands.slice(0, 10).join(", ") || "Not set"}

Sales Performance (Last 30 Days):
- Total Revenue: ₹${ctx.totalRevenue30d.toLocaleString()}
- Total Orders: ${ctx.totalOrders30d}
- Online Orders: ${ctx.onlineOrders} | Offline Orders: ${ctx.offlineOrders}
- Average Order Value: ₹${ctx.avgOrderValue}

Top Selling Products: ${ctx.topSelling.join(" | ") || "No sales yet"}
Top Revenue Categories (90 days): ${ctx.topCategories.join(" | ") || "No data"}
Low Stock Products: ${ctx.lowStock.join(", ") || "None"}
Products with Zero Sales: ${ctx.zeroSales}

Customer Base:
- Total Customers: ${ctx.totalCustomers}
- New Customers (30 days): ${ctx.newCustomers30d}
=== END OF REAL DATA ===

Based on THIS SPECIFIC store's real data above, provide a growth report.
Do NOT give generic advice — every suggestion must reference the actual categories, products, and numbers above.

Return ONLY valid JSON (no markdown, no explanation):
{
  "business_snapshot": {
    "health_score": 0,
    "health_label": "",
    "key_strengths": [],
    "urgent_issues": []
  },
  "market_research": [
    {
      "product": "",
      "why_trending": "",
      "trend_source": "",
      "relevance_to_my_store": "",
      "demand_level": "",
      "market_size": "",
      "should_add": "",
      "target_audience": "",
      "age_group": "",
      "gender": "",
      "top_states": [],
      "top_cities": [],
      "peak_season": "",
      "wholesale_potential": "",
      "wholesale_min_order": "",
      "estimated_price_range": "",
      "wholesale_price_range": "",
      "profit_margin": "",
      "top_search_keywords": [],
      "google_trend_direction": "",
      "competition_level": "",
      "platforms_selling_well": [],
      "upload_suggestion": ""
    }
  ],
  "top_2_products": [
    { "name": "", "reason": "", "expected_monthly_sales": "" }
  ],
  "category_analysis": [
    { "category": "", "performance": "", "suggestion": "" }
  ],
  "business_improvement": {
    "missing": [],
    "build_next": [],
    "fix_immediately": []
  },
  "growth_ideas": {
    "marketing_strategies": [],
    "product_ideas": [],
    "pricing_strategies": []
  }
}

Rules:
- health_score: 0-100 based on real data
- health_label: "Needs Attention" / "Growing" / "Healthy" / "Excellent"
- Every suggestion must be specific to this store's categories and data
- If zero sales, address that directly
- If low stock, mention restocking urgency
- top_states: list 3-5 Indian states where this product sells most (e.g. Gujarat, Maharashtra, Delhi)
- top_cities: list 3-5 Indian cities with highest demand
- top_search_keywords: 5-8 actual keywords Indians search on Google/Meesho/Flipkart for this product
- google_trend_direction: "Rising" / "Stable" / "Declining"
- competition_level: "Low" / "Medium" / "High"
- platforms_selling_well: list platforms like Meesho, Amazon, Flipkart, Instagram, Myntra where this sells well
- peak_season: months or festivals when demand peaks (e.g. "Oct-Jan, Diwali, Wedding Season")
- profit_margin: estimated retail profit margin percentage
- upload_suggestion: specific advice on how this store should photograph, title, and list this product
- wholesale_min_order: minimum order quantity for wholesale
`;

// ── Main controller ────────────────────────────────────────────────────
const aiGrowthReport = asyncHandler(async (req, res) => {
  // Get admin user for store settings
  const adminUser = await User.findOne({ role: "admin" })
    .select("storeName storeState storeTagline")
    .lean();

  // Read real business data
  let ctx;
  try {
    ctx = await getRealBusinessContext(adminUser);
  } catch (err) {
    res.status(500);
    throw new Error("Failed to read business data: " + err.message);
  }

  // Build prompt from real data
  const prompt = buildPrompt(ctx);

  // Call Gemini
  let geminiRes;
  try {
    geminiRes = await callGemini(prompt);
  } catch (err) {
    res.status(502);
    throw new Error(err.message);
  }

  // Parse response
  let parsed;
  try {
    parsed = parseGeminiJSON(geminiRes);
  } catch (err) {
    res.status(422);
    throw new Error(err.message);
  }

  // Save/replace report in DB (always keep only 1 — the latest)
  const context = {
    storeName: ctx.storeName,
    totalProducts: ctx.totalProducts,
    totalOrders30d: ctx.totalOrders30d,
    totalRevenue30d: ctx.totalRevenue30d,
    totalCustomers: ctx.totalCustomers,
    newCustomers30d: ctx.newCustomers30d,
    categories: ctx.categories,
    generatedAt: new Date().toISOString(),
  };

  await GrowthReport.findOneAndUpdate(
    {},
    { report: parsed, context, generatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ ...parsed, _context: context });
});

// ── Get last saved report ──────────────────────────────────────────────
const getLastGrowthReport = asyncHandler(async (req, res) => {
  const saved = await GrowthReport.findOne().lean();
  if (!saved) return res.json(null);
  res.json({ ...saved.report, _context: saved.context });
});

module.exports = { aiGrowthReport, getLastGrowthReport };
