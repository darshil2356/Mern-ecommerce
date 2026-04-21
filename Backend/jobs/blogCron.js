const axios = require("axios");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const Blog = require("../models/blogModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const TOPICS_FILE = path.join(__dirname, "../data/blog_topics.json");

// ── Topic tracking ────────────────────────────────────────────────────────
const loadRecentTopics = () => {
  try {
    if (!fs.existsSync(TOPICS_FILE)) return [];
    return JSON.parse(fs.readFileSync(TOPICS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const saveRecentTopics = (topics) => {
  try {
    const dir = path.dirname(TOPICS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TOPICS_FILE, JSON.stringify(topics.slice(-60), null, 2));
  } catch (err) {
    console.error("[BlogCron] Could not save topics:", err.message);
  }
};

// ── Fetch real business context ───────────────────────────────────────────
const getBusinessContext = async () => {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const adminUser = await User.findOne({ role: "admin" })
    .select("storeName storeState storeTagline storeAddress storePhone")
    .lean();

  const allProducts = await Product.find({ "inventory.online": true })
    .select("title slug category brand price mrp attributes tags highlights search_keywords sold")
    .lean();

  const categories = [...new Set(allProducts.map((p) => p.category).filter(Boolean))];
  const brands = [...new Set(allProducts.map((p) => p.brand).filter(Boolean))];

  const topSelling = [...allProducts]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 15)
    .map((p) => ({
      title: p.title,
      slug: p.slug,
      category: p.category,
      price: p.price,
      mrp: p.mrp,
      material: p.attributes?.material,
      occasion: p.attributes?.occasion,
      gender: p.attributes?.gender,
    }));

  const orders90d = await Order.find({
    createdAt: { $gte: ninetyDaysAgo },
    orderStatus: { $ne: "Cancelled" },
  })
    .populate({ path: "orderItems.product", select: "category" })
    .lean();

  const catRevenue = {};
  orders90d.forEach((order) => {
    order.orderItems.forEach((item) => {
      const cat = item.product?.category;
      if (cat) catRevenue[cat] = (catRevenue[cat] || 0) + (item.price || 0) * (item.quantity || 1);
    });
  });
  const topCategories = Object.entries(catRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  const occasions = [...new Set(allProducts.map((p) => p.attributes?.occasion).filter(Boolean))];
  const materials = [...new Set(allProducts.map((p) => p.attributes?.material).filter(Boolean))];
  const genders = [...new Set(allProducts.map((p) => p.attributes?.gender).filter(Boolean))];

  return {
    storeName: adminUser?.storeName || "Yashoda Fashion",
    storeState: adminUser?.storeState || "Gujarat",
    storeTagline: adminUser?.storeTagline || "Your One-Stop Shopping Destination",
    storeAddress: adminUser?.storeAddress || "",
    storePhone: adminUser?.storePhone || "",
    categories,
    brands,
    topSelling,
    topCategories,
    occasions,
    materials,
    genders,
  };
};

// ── Prompts ───────────────────────────────────────────────────────────────

const catalogSection = (ctx) => {
  const topProductsList = ctx.topSelling
    .map((p) =>
      `- "${p.title}" (slug: ${p.slug}, category: ${p.category}, price: ₹${p.price}` +
      `${p.occasion ? `, occasion: ${p.occasion}` : ""}` +
      `${p.material ? `, material: ${p.material}` : ""}` +
      `${p.gender ? `, for: ${p.gender}` : ""})`
    )
    .join("\n");

  return `
=== STORE INFO ===
Store Name: ${ctx.storeName}
Location: ${ctx.storeState}, India (major Indian textile hub)
Tagline: ${ctx.storeTagline}
Categories: ${ctx.categories.join(", ") || "Various clothing"}
Top Revenue Categories: ${(ctx.topCategories.length ? ctx.topCategories : ctx.categories).join(", ")}
Brands: ${ctx.brands.slice(0, 8).join(", ") || "Multiple brands"}
Occasions: ${ctx.occasions.join(", ") || "All occasions"}
Materials: ${ctx.materials.join(", ") || "Various"}
Gender segments: ${ctx.genders.join(", ") || "Men, Women, Kids"}

Top-selling products (use slugs for internal links):
${topProductsList || "Various clothing products"}
=== END STORE INFO ===`;
};

// Blog type 1 — Retail buyer (end customer discovery & buying guide)
const buildRetailPrompt = (ctx, recentTopics) => {
  const avoid = recentTopics.length
    ? `\nAvoid these recently covered topics:\n${recentTopics.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  return `
You are an SEO expert writing for ${ctx.storeName}, an Indian clothing store in ${ctx.storeState}.
${catalogSection(ctx)}
${avoid}
Write 1 SEO blog post targeting RETAIL BUYERS (people buying clothes for themselves or family).

The blog must:
- Target a high-intent Google search Indians make before buying clothes (e.g. "best cotton kurti for summer", "party wear saree under 1500")
- Be 1000+ words with H2/H3 markdown headings
- Include styling tips, buying guide, size guide, and care tips
- Naturally mention 2–4 of our actual products as recommendations (use their slugs for linking)
- End with a clear call to action to shop at ${ctx.storeName}

Return ONLY valid JSON (no markdown):
{
  "blogs": [
    {
      "blog_type": "retail",
      "title": "",
      "slug": "",
      "meta_title": "",
      "meta_description": "",
      "keywords": "",
      "content": "",
      "category": "",
      "image_query": "",
      "featured_products": ["slug1", "slug2"]
    }
  ]
}

Rules:
- title = a real search query Indians type on Google before buying clothes
- slug = lowercase hyphenated
- meta_description = under 160 chars with a buying hook
- keywords = comma-separated, India + product focused (e.g. "buy kurti online india, cotton kurti women")
- category = must match one of: ${ctx.categories.join(", ") || "Fashion & Trends"}
- image_query = short phrase for Unsplash cover (e.g. "indian women ethnic wear")
- featured_products = 2–4 product slugs from catalog above
`;
};

// Blog type 2 — Wholesale buyer (B2B resellers, boutique owners, dealers)
const buildWholesalePrompt = (ctx, recentTopics) => {
  const avoid = recentTopics.length
    ? `\nAvoid these recently covered topics:\n${recentTopics.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  return `
You are an SEO expert writing for ${ctx.storeName}, a clothing retail & WHOLESALE supplier in ${ctx.storeState}, India.
${ctx.storeState} is one of India's biggest textile manufacturing hubs.
${catalogSection(ctx)}
${avoid}
Write 1 SEO blog post targeting WHOLESALE BUYERS — boutique owners, resellers, clothing retailers, dealers, and small business owners who want to buy clothes in bulk from a reliable supplier.

The blog must:
- Target high-intent B2B Google searches (e.g. "wholesale kurti supplier Gujarat", "bulk ethnic wear manufacturer India", "clothing wholesale supplier for resellers")
- Be 1000+ words with H2/H3 markdown headings
- Explain WHY ${ctx.storeName} in ${ctx.storeState} is a trusted wholesale partner:
  * GST invoice provided on all bulk orders
  * Wide range of categories: ${ctx.categories.join(", ")}
  * Competitive wholesale pricing with high margins for resellers
  * Both online ordering and offline visit welcome
  * Fast dispatch from ${ctx.storeState}
- Include a section: "How to Place a Wholesale Order at ${ctx.storeName}"
- Mention 2–3 of our actual product categories with bulk pricing benefit
- End with a strong CTA: contact us / visit our wholesale catalog / WhatsApp for bulk pricing

Return ONLY valid JSON (no markdown):
{
  "blogs": [
    {
      "blog_type": "wholesale",
      "title": "",
      "slug": "",
      "meta_title": "",
      "meta_description": "",
      "keywords": "",
      "content": "",
      "category": "Wholesale & Bulk",
      "image_query": "",
      "featured_products": []
    }
  ]
}

Rules:
- title = a real Google search a reseller/boutique owner types (must include words like "wholesale", "bulk", "supplier", or "manufacturer")
- slug = lowercase hyphenated
- meta_description = under 160 chars targeting resellers
- keywords = B2B focused (e.g. "wholesale kurti supplier gujarat, bulk ethnic wear india, clothing wholesale for resellers")
- image_query = short phrase for Unsplash cover (e.g. "wholesale clothing india textile")
- featured_products can be empty []
`;
};

// Blog type 3 — Business/trust builder (rotates: loyalty, GST billing, store story, festival guide)
const buildBusinessPrompt = (ctx, recentTopics) => {
  const avoid = recentTopics.length
    ? `\nAvoid these recently covered topics:\n${recentTopics.map((t) => `- ${t}`).join("\n")}\n`
    : "";

  const topics = [
    "our loyalty & referral coin reward program and how customers save money",
    "GST billing and transparent pricing — how we handle taxes for both retail and wholesale buyers",
    "festival shopping guide — which outfits to buy for upcoming Indian festivals",
    "why buying from a ${ctx.storeState} clothing store gives you better prices than big marketplaces",
    "how to style outfits for different occasions using our product range",
    "complete size guide for Indian clothing — how to find your perfect fit",
  ];
  // Pick topic based on current day of month so it rotates
  const todayTopic = topics[new Date().getDate() % topics.length].replace("${ctx.storeState}", ctx.storeState);

  return `
You are an SEO expert writing for ${ctx.storeName}, an Indian clothing store in ${ctx.storeState}.
${catalogSection(ctx)}
${avoid}
Write 1 blog post about: "${todayTopic}"

The blog must:
- Be 900+ words with H2/H3 markdown headings
- Build trust in ${ctx.storeName} as a brand
- Include helpful, genuinely useful information for the reader
- Mention relevant products from our catalog where natural
- End with a CTA to shop at ${ctx.storeName}

Return ONLY valid JSON (no markdown):
{
  "blogs": [
    {
      "blog_type": "business",
      "title": "",
      "slug": "",
      "meta_title": "",
      "meta_description": "",
      "keywords": "",
      "content": "",
      "category": "Store & Tips",
      "image_query": "",
      "featured_products": []
    }
  ]
}

Rules:
- title = engaging, informative, Google-searchable
- slug = lowercase hyphenated
- meta_description = under 160 chars
- keywords = relevant to topic
- image_query = short phrase for Unsplash cover photo
`;
};

// ── Unsplash cover image ──────────────────────────────────────────────────
const fetchUnsplashImage = async (query) => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await axios.get("https://api.unsplash.com/photos/random", {
      params: { query, orientation: "landscape", client_id: key },
    });
    const url = res.data?.urls?.regular;
    const alt = res.data?.alt_description || query;
    return url ? { url, alt } : null;
  } catch {
    return null;
  }
};

// ── Duplicate guard ───────────────────────────────────────────────────────
const todaysBlogsAlreadyExist = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const count = await Blog.countDocuments({
    isAI: true,
    createdAt: { $gte: start, $lte: end },
  });
  return count > 0;
};

// ── Call Gemini with model fallback ──────────────────────────────────────
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const modelList = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...GEMINI_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : GEMINI_MODELS;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
  };

  for (const model of modelList) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        body
      );
      return res;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 404) continue;
      throw new Error(`Gemini error: ${err.message}`);
    }
  }
  throw new Error("All Gemini models quota exceeded");
};

const parseGemini = (res) => {
  const rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Non-parseable JSON: " + cleaned.slice(0, 200));
  }
};

// ── Save blogs to DB ──────────────────────────────────────────────────────
const saveBlogs = async (blogsArray, newTopics) => {
  let saved = 0;
  for (const blog of blogsArray) {
    try {
      const slug = `${blog.slug || "blog"}-${Date.now()}`;
      const wordCount = (blog.content || "").split(/\s+/).length;
      const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
      const image = await fetchUnsplashImage(blog.image_query || "indian fashion clothing");

      await Blog.create({
        title: blog.title,
        slug,
        description: blog.content,
        category: blog.category || "Fashion & Trends",
        metaTitle: blog.meta_title || blog.title,
        metaDescription: blog.meta_description || "",
        keywords: blog.keywords || "",
        readTime,
        isAI: true,
        isPublished: false,
        blogType: blog.blog_type || "retail",
        author: "AI Growth Expert",
        images: image ? [{ url: image.url, alt: image.alt }] : [],
        featuredProducts: blog.featured_products || [],
      });

      newTopics.push(blog.title);
      saved++;
      console.log(`[BlogCron] Saved (${blog.blog_type || "blog"}): ${blog.title}`);
    } catch (err) {
      console.error("[BlogCron] Save failed:", err.message);
    }
  }
  return saved;
};

// ── Main job ──────────────────────────────────────────────────────────────
const runDailyBlogCron = async () => {
  console.log("[BlogCron] Starting daily AI blog generation...");

  const alreadyRan = await todaysBlogsAlreadyExist();
  if (alreadyRan) {
    console.log("[BlogCron] Today's blogs already exist — skipping.");
    return;
  }

  const [ctx, recentTopics] = await Promise.all([
    getBusinessContext(),
    Promise.resolve(loadRecentTopics()),
  ]);

  const prompts = [
    { name: "retail",    prompt: buildRetailPrompt(ctx, recentTopics) },
    { name: "wholesale", prompt: buildWholesalePrompt(ctx, recentTopics) },
    { name: "business",  prompt: buildBusinessPrompt(ctx, recentTopics) },
  ];

  const newTopics = [...recentTopics];
  let totalSaved = 0;

  for (const { name, prompt } of prompts) {
    try {
      const res = await callGemini(prompt);
      const parsed = parseGemini(res);
      const count = await saveBlogs(parsed.blogs || [], newTopics);
      totalSaved += count;
    } catch (err) {
      console.error(`[BlogCron] ${name} blog failed:`, err.message);
    }
  }

  saveRecentTopics(newTopics);
  console.log(`[BlogCron] Done — ${totalSaved} blogs saved (pending review)`);
};

// ── Schedule ──────────────────────────────────────────────────────────────
const startDailyBlogCron = () => {
  setTimeout(runDailyBlogCron, 5000);
  cron.schedule("30 1 * * *", runDailyBlogCron, { timezone: "Asia/Kolkata" });
  console.log("[BlogCron] Scheduled — runs daily at 7:00 AM IST");
};

module.exports = { startDailyBlogCron, runDailyBlogCron };
