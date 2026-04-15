const axios = require("axios");
const Blog = require("../models/blogModel");

const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
];

const BLOG_PROMPT = `
You are an SEO content expert for an Indian retail + wholesale clothing brand.

Generate exactly 2 unique, trending SEO blog posts for today.
Each blog must be 1000+ words, optimized for Google India search.

Return ONLY valid JSON (no markdown) with this structure:
{
  "blogs": [
    {
      "title": "",
      "slug": "",
      "meta_title": "",
      "meta_description": "",
      "keywords": "",
      "content": "",
      "category": "Fashion & Trends",
      "product": ""
    }
  ]
}

Rules:
- Blogs must be about current Indian clothing trends
- Include H2/H3 headings in content using markdown (## and ###)
- Include buying tips, styling advice, and product recommendations
- slug must be lowercase hyphenated
- meta_description must be under 160 characters
- keywords must be comma-separated, India-focused
`;

const runDailyBlogCron = async () => {
  console.log("[BlogCron] Starting daily AI blog generation...");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return console.error("[BlogCron] GEMINI_API_KEY missing");

  const modelList = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...GEMINI_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : GEMINI_MODELS;

  const body = {
    contents: [{ parts: [{ text: BLOG_PROMPT }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 8192 },
  };

  let geminiRes = null;
  for (const model of modelList) {
    try {
      geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        body
      );
      break;
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 404) continue;
      return console.error("[BlogCron] Gemini error:", err.message);
    }
  }

  if (!geminiRes) return console.error("[BlogCron] All models quota exceeded");

  const rawText = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return console.error("[BlogCron] Non-parseable JSON:", cleaned.slice(0, 200));
  }

  let saved = 0;
  for (const blog of parsed.blogs || []) {
    try {
      const slug = `${blog.slug || "blog"}-${Date.now()}`;
      const wordCount = (blog.content || "").split(/\s+/).length;
      const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

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
        author: "AI Growth Expert",
      });
      saved++;
      console.log(`[BlogCron] Saved: ${blog.title}`);
    } catch (err) {
      console.error("[BlogCron] Save failed:", err.message);
    }
  }
  console.log(`[BlogCron] Done — ${saved} blogs saved`);
};

const startDailyBlogCron = () => {
  // Run once at startup after 5s delay, then every 24 hours
  setTimeout(async () => {
    const now = new Date();
    // Only auto-run at startup if it's between 6-8 AM IST
    const istHour = (now.getUTCHours() + 5.5) % 24;
    if (istHour >= 6 && istHour < 8) {
      await runDailyBlogCron();
    }
  }, 5000);

  // Schedule every 24 hours
  setInterval(runDailyBlogCron, 24 * 60 * 60 * 1000);
  console.log("[BlogCron] Scheduled — runs every 24 hours");
};

module.exports = { startDailyBlogCron, runDailyBlogCron };
