const asyncHandler = require("express-async-handler");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const MarketIntel = require("../models/marketIntelModel");

const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelList = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...GEMINI_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : GEMINI_MODELS;

  let lastErr = "";
  for (const modelName of modelList) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const msg = err.message || String(err);
      lastErr = `[${modelName}] ${msg}`;
      // Extract retry delay if present (e.g. "retry in 54s")
      const retryMatch = msg.match(/retry.*?(\d+(\.\d+)?)s/i);
      if (retryMatch) {
        const waitMs = Math.min(parseFloat(retryMatch[1]) * 1000, 10000);
        await sleep(waitMs);
      }
      // Continue to next model on quota/rate/server errors
      if (/quota|rate|429|503|500|404|not found|overloaded|demand/i.test(msg)) continue;
      throw new Error(`Gemini error: ${msg}`);
    }
  }
  throw new Error(`All models quota exceeded. Last: ${lastErr}`);
};

const parseJSON = (text) => {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); }
  catch { throw new Error("Non-parseable JSON: " + cleaned.slice(0, 200)); }
};

const buildPrompt = (segment) => `
You are a market intelligence expert for Indian clothing retail and wholesale.
Your job is to give REAL, DATA-DRIVEN insights about what Indian consumers are searching and buying RIGHT NOW.

Segment requested: ${segment.toUpperCase()} WEAR (Indian market)

Think like a market researcher who has access to:
- Google Trends India data
- Meesho, Amazon India, Flipkart, Myntra sales data
- Instagram & YouTube trending fashion content
- Wholesale market data from Surat, Delhi, Mumbai, Jaipur

Return ONLY valid JSON (no markdown):
{
  "segment": "${segment}",
  "summary": "",
  "trending_products": [
    {
      "rank": 1,
      "product_name": "",
      "category": "",
      "monthly_search_volume": "",
      "search_volume_number": 0,
      "trend_direction": "",
      "trend_score": 0,
      "why_trending": "",
      "target_age": "",
      "target_gender": "",
      "top_states": [],
      "top_cities": [],
      "peak_months": [],
      "peak_festivals": [],
      "top_keywords": [
        { "keyword": "", "monthly_searches": "", "competition": "" }
      ],
      "platforms": [
        { "name": "", "daily_units_sold": "", "avg_price": "", "top_sellers": "" }
      ],
      "pricing": {
        "retail_low": "",
        "retail_high": "",
        "wholesale_low": "",
        "wholesale_high": "",
        "profit_margin": "",
        "min_wholesale_qty": ""
      },
      "manufacturing": {
        "fabric": "",
        "popular_colors": [],
        "popular_sizes": [],
        "design_tips": "",
        "quality_expectation": ""
      },
      "competition": {
        "level": "",
        "main_competitors": [],
        "gap_opportunity": ""
      },
      "add_to_store_score": 0,
      "add_to_store_reason": "",
      "photo_tips": "",
      "title_formula": "",
      "description_keywords": []
    }
  ],
  "keyword_universe": [
    { "keyword": "", "monthly_searches": "", "trend": "", "category": "", "buying_intent": "" }
  ],
  "market_gaps": [],
  "avoid_products": [
    { "product": "", "reason": "" }
  ],
  "manufacturing_advice": {
    "hot_fabrics": [],
    "hot_colors": [],
    "hot_styles": [],
    "avoid_fabrics": [],
    "upcoming_trends": []
  },
  "platform_strategy": [
    { "platform": "", "best_products": [], "pricing_tip": "", "volume_potential": "" }
  ],
  "action_plan": []
}

RULES — be very specific with numbers:
- monthly_search_volume: real estimate like "1.2 Lakh/month" or "85,000/month"
- search_volume_number: numeric value in thousands (e.g. 120 for 1.2 lakh)
- trend_score: 0-100 (100 = hottest)
- add_to_store_score: 0-100 (how strongly to add this product)
- daily_units_sold: estimate like "5,000-8,000 units/day on Meesho"
- top_keywords: 5-8 keywords with real monthly search estimates
- keyword_universe: top 15 keywords across the whole segment
- market_gaps: 3-5 products that are in demand but undersupplied
- avoid_products: 2-3 products that are oversaturated
- action_plan: 5 specific steps this store owner should take this month
- title_formula: exact formula like "Plazo Pant for Women | [Color] | [Fabric] | [Size]"
- description_keywords: 8-10 keywords to use in product description
- popular_colors: actual trending colors with hex codes if possible
`;

// ── Generate new report ────────────────────────────────────────────────
const generateMarketIntel = asyncHandler(async (req, res) => {
  const segment = (req.query.segment || "women").toLowerCase();

  const text = await callGemini(buildPrompt(segment));
  const parsed = parseJSON(text);

  // Save/replace for this segment
  await MarketIntel.findOneAndUpdate(
    { segment },
    { report: parsed, generatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json({ ...parsed, _generatedAt: new Date().toISOString() });
});

// ── Get last saved report ──────────────────────────────────────────────
const getLastMarketIntel = asyncHandler(async (req, res) => {
  const segment = (req.query.segment || "women").toLowerCase();
  const saved = await MarketIntel.findOne({ segment }).lean();
  if (!saved) return res.json(null);
  res.json({ ...saved.report, _generatedAt: saved.generatedAt });
});

module.exports = { generateMarketIntel, getLastMarketIntel };
