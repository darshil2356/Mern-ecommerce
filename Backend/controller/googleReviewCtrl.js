const axios = require("axios");
const Product = require("../models/productModel");

const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 512 },
  };
  for (const model of GEMINI_MODELS) {
    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        body
      );
      return res.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 404) continue;
      throw err;
    }
  }
  throw new Error("All Gemini models failed");
};

// 6 different review angles — rotated so every call feels fresh
const reviewAngles = [
  "fabric quality and feel of the clothing",
  "variety of categories and collection",
  "value for money and pricing",
  "in-store shopping experience and staff behaviour",
  "festive and occasion wear selection",
  "overall brand trust and repeat purchase",
];

const generateGoogleReview = async (req, res) => {
  try {
    // Pull real data from DB
    const products = await Product.find()
      .select("title category brand attributes sold")
      .lean();

    const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
    const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
    const topSold = [...products]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 5)
      .map((p) => p.title);
    const occasions = [...new Set(products.map((p) => p.attributes?.occasion).filter(Boolean))];
    const materials = [...new Set(products.map((p) => p.attributes?.material).filter(Boolean))];

    const angle = reviewAngles[Math.floor(Math.random() * reviewAngles.length)];

    const prompt = `You are writing a genuine Google review for "Yashoda Fashion" — a real women's clothing store.

REAL STORE DATA:
- Categories they sell: ${categories.slice(0, 8).join(", ") || "sarees, kurtis, suits, ethnic wear"}
- Brands available: ${brands.slice(0, 6).join(", ") || "various brands"}
- Popular products: ${topSold.slice(0, 4).join(", ") || "sarees, kurtis"}
- Occasions covered: ${occasions.slice(0, 5).join(", ") || "casual, festive, wedding"}
- Materials: ${materials.slice(0, 5).join(", ") || "cotton, silk, georgette"}

Write a Google review focused on: ${angle}

Rules:
- 3-5 sentences, natural Indian customer tone (Hindi-English mix is fine e.g. "bahut accha", "ekdum sahi")
- Mention 1-2 real category/product names from the store data above
- Sound personal and genuine — not like marketing copy
- Must include "Yashoda Fashion" at least once
- No emojis, no hashtags, no star ratings text
- End with a recommendation to friends/family

Return ONLY the review text. Nothing else.`;

    const reviewText = await callGemini(prompt);

    if (!reviewText) throw new Error("Empty response");

    res.json({ review: reviewText });
  } catch (error) {
    // Fallback reviews using real business context
    const fallbacks = [
      "Yashoda Fashion has an amazing collection of ethnic wear — I bought a beautiful suit for my cousin's wedding and got so many compliments. The fabric quality is really good and the fitting was perfect. Bahut accha experience raha, will definitely come back for more shopping. Highly recommend to all ladies!",
      "I've been shopping at Yashoda Fashion for over a year now and the collection just keeps getting better. Their sarees and kurtis are always on trend and the quality is top notch. Staff is very helpful in choosing the right outfit for every occasion. Ekdum sahi jagah hai shopping ke liye!",
      "Yashoda Fashion is my go-to store for all festive and casual wear. The variety of categories they have — from daily wear kurtis to heavy occasion wear — is impressive. Prices are very reasonable for the quality you get. Strongly recommend to every woman looking for good clothing.",
    ];
    res.json({ review: fallbacks[Math.floor(Math.random() * fallbacks.length)] });
  }
};

module.exports = { generateGoogleReview };
