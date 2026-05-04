const express = require("express");
const router = express.Router();
const { cache, generateFeeds } = require("../jobs/feedCron");

/** Serve cached XML feed; regenerate on-demand if cache is empty */
router.get("/feed.xml", async (req, res) => {
  if (!cache.xml) await generateFeeds();
  if (!cache.xml) return res.status(503).send("Feed not available yet. Try again shortly.");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600"); // browsers/CDN cache 1 hr
  res.setHeader("X-Feed-Built-At", cache.builtAt?.toISOString() || "");
  res.send(cache.xml);
});

/** Serve cached JSON feed */
router.get("/feed.json", async (req, res) => {
  if (!cache.json) await generateFeeds();
  if (!cache.json) return res.status(503).json({ error: "Feed not available yet." });

  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("X-Feed-Built-At", cache.builtAt?.toISOString() || "");
  res.json({ builtAt: cache.builtAt, count: cache.json.length, products: cache.json });
});

/** Admin-only manual refresh — requires X-Feed-Secret header matching FEED_REFRESH_SECRET env var */
router.post("/feed/refresh", async (req, res) => {
  const secret = process.env.FEED_REFRESH_SECRET;
  if (secret && req.headers["x-feed-secret"] !== secret)
    return res.status(401).json({ error: "Unauthorized" });
  await generateFeeds();
  res.json({ ok: true, builtAt: cache.builtAt, count: cache.json?.length });
});

module.exports = router;
