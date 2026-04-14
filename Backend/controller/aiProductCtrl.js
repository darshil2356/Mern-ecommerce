const asyncHandler = require("express-async-handler");
const axios = require("axios");

// Models tried in order — all confirmed available for this API key
const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const aiGenerateProduct = asyncHandler(async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body;

  if (!imageBase64) {
    res.status(400);
    throw new Error("imageBase64 is required");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500);
    throw new Error("GEMINI_API_KEY not configured");
  }

  const prompt = `You are an expert e-commerce AI product listing generator for the Indian market.

Analyze this product image and return ONLY valid JSON (no markdown, no explanation) with this exact structure:

{
  "name": "",
  "slug": "",
  "brand": "",
  "category": "",
  "subcategory": "",
  "description": "",
  "short_description": "",
  "highlights": [],
  "tags": [],
  "search_keywords": [],
  "pricing": {
    "mrp": 0,
    "selling_price": 0,
    "discount_percentage": 0
  },
  "inventory": {
    "sku": "",
    "stock": 0,
    "min_stock_alert": 5
  },
  "attributes": {
    "color": "",
    "material": "",
    "pattern": "",
    "fit": "",
    "type": "",
    "occasion": "",
    "gender": "",
    "age_group": ""
  },
  "variants": [
    {
      "size": "",
      "color": "",
      "stock": 0,
      "price": 0
    }
  ],
  "seo": {
    "meta_title": "",
    "meta_description": "",
    "meta_keywords": []
  },
  "shipping": {
    "weight": "",
    "dimensions": "",
    "is_fragile": false
  },
  "ai_confidence_score": 0
}

RULES:
- Return ONLY valid JSON, no extra text
- Optimize for Indian e-commerce market (prices in INR)
- SEO-friendly content
- High conversion descriptions
- slug must be lowercase hyphenated
- ai_confidence_score between 0-100
- tags must be one of: featured, popular, special`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  };

  // Override model via env if needed: GEMINI_MODEL=gemini-1.5-flash-8b
  const modelList = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...GEMINI_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : GEMINI_MODELS;

  let geminiRes = null;
  let lastErrMsg = "";

  for (const model of modelList) {
    try {
      geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        body
      );
      break; // success — stop trying
    } catch (err) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data ||
        err.message;
      lastErrMsg = `[${model}] ${msg}`;

      // Only continue to next model on quota (429) or not-found (404) errors
      if (status === 429 || status === 404) continue;

      // For other errors (401 bad key, 400 bad request) — fail immediately
      res.status(status || 502);
      throw new Error(`Gemini API error: ${JSON.stringify(msg)}`);
    }
  }

  if (!geminiRes) {
    res.status(429);
    throw new Error(`All Gemini models quota exceeded. Last error: ${lastErrMsg}`);
  }

  const rawText =
    geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    res.status(422);
    throw new Error("AI returned non-parseable JSON: " + cleaned.slice(0, 200));
  }

  res.json({ ...parsed, _model_used: geminiRes.config?.url?.match(/models\/([^:]+)/)?.[1] });
});

module.exports = { aiGenerateProduct };
