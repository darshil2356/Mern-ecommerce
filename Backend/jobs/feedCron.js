const cron = require("node-cron");
const Product = require("../models/productModel");
const { stripHtml, escapeXml, formatPrice, getGoogleCategory } = require("../utils/feedHelpers");

const BASE_URL = "https://yashodafashion.com";
const DEFAULT_BRAND = "Yashoda Fashion";

// In-memory cache — avoids DB hit on every request
const cache = { xml: null, json: null, builtAt: null };

/** Select fields needed for the feed */
// Field names match productModel.js exactly:
// short_description → does NOT exist in model, correct field is: short_description is not in model
// Model has: title, slug, description, price, mrp, images, quantity, category, brand, sku, tags,
//            attributes{material,gender,...}, seo{meta_title,meta_description,meta_keywords},
//            variants[{color,sizeStock}], sizeStock[{size,quantity}]
const FEED_SELECT =
  "title slug description price mrp images quantity " +
  "category brand sku tags attributes seo variants sizeStock inventory";

/** Build a single product's data object (shared between XML and JSON) */
const buildProductData = (p) => {
  const id        = p.sku || String(p._id);
  const title     = p.seo?.meta_title || p.title || "";
  const desc      = stripHtml(p.seo?.meta_description || p.description || "");
  const link      = `${BASE_URL}/product/${p.slug}-${p._id}`;
  const imageLink = p.images?.[0]?.url || null;
  const extraImgs = (p.images || []).slice(1, 11).map((i) => i.url); // up to 10 additional
  // quantity field in model is the stock count
  const inStock     = (p.quantity || 0) > 0;
  const price       = p.price;                        // selling price
  // mrp = original MRP (higher); price = discounted selling price
  // Google: g:price = original/regular price, g:sale_price = discounted price
  const hasDiscount = p.mrp && p.mrp > p.price;

  return {
    id,
    title,
    desc,
    link,
    imageLink,
    extraImgs,
    inStock,
    price: formatPrice(price),           // always the selling price
    salePrice: hasDiscount ? formatPrice(price) : null,   // shown as sale_price when discount exists
    originalPrice: hasDiscount ? formatPrice(p.mrp) : null, // shown as g:price when discount exists
    hasDiscount,                           // ← expose flag so buildXml/buildJson can use it
    brand: p.brand || DEFAULT_BRAND,
    category: p.category || "",
    googleCategory: getGoogleCategory(p.category),
    sku: p.sku || "",
    tags: p.tags || "",
    gender: p.attributes?.gender || "",
    color: "", // resolved below
    size: "",  // resolved below
    material: p.attributes?.material || "",
    itemGroupId: p.sku ? p.sku.replace(/-[^-]+$/, "") : String(p._id), // strip last variant suffix
    keywords: (p.seo?.meta_keywords || []).join(", "),
  };
};

/** Build XML feed string from products array */
const buildXml = (products) => {
  const items = products
    .filter((p) => p.images?.length && p.price)
    .map((p) => {
      const d = buildProductData(p);

      // Collect unique sizes and colors from variants or sizeStock
      const sizes = [];
      const colors = [];

      if (p.variants?.length) {
        p.variants.forEach((v) => {
          if (v.color?.name) colors.push(v.color.name);
          (v.sizeStock || []).forEach((s) => s.size && sizes.push(s.size));
        });
      } else if (p.sizeStock?.length) {
        p.sizeStock.forEach((s) => s.size && sizes.push(s.size));
      }

      const sizeStr  = [...new Set(sizes)].join(", ");
      const colorStr = [...new Set(colors)].join(", ");

      const additionalImages = d.extraImgs
        .map((url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${escapeXml(d.id)}</g:id>
      <g:title>${escapeXml(d.title)}</g:title>
      <g:description>${escapeXml(d.desc)}</g:description>
      <g:link>${escapeXml(d.link)}</g:link>
      <g:image_link>${escapeXml(d.imageLink)}</g:image_link>
${additionalImages ? additionalImages + "\n" : ""}      <g:availability>${d.inStock ? "in stock" : "out of stock"}</g:availability>
      <g:price>${escapeXml(d.hasDiscount ? d.originalPrice : d.price)}</g:price>
${d.hasDiscount ? `      <g:sale_price>${escapeXml(d.salePrice)}</g:sale_price>\n` : ""}      <g:brand>${escapeXml(d.brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${d.googleCategory}</g:google_product_category>
      <g:product_type>${escapeXml(d.category)}</g:product_type>
      <g:item_group_id>${escapeXml(d.itemGroupId)}</g:item_group_id>
${d.sku ? `      <g:mpn>${escapeXml(d.sku)}</g:mpn>\n` : ""}${colorStr ? `      <g:color>${escapeXml(colorStr)}</g:color>\n` : ""}${sizeStr ? `      <g:size>${escapeXml(sizeStr)}</g:size>\n` : ""}${d.gender ? `      <g:gender>${escapeXml(d.gender)}</g:gender>\n` : ""}${d.material ? `      <g:material>${escapeXml(d.material)}</g:material>\n` : ""}${d.tags ? `      <g:custom_label_0>${escapeXml(String(d.tags).slice(0, 100))}</g:custom_label_0>\n` : ""}    </item>`;
    });

  const now = new Date().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Yashoda Fashion — Google Merchant Feed</title>
    <link>${BASE_URL}</link>
    <description>Product feed for Google Merchant Center</description>
    <lastBuildDate>${now}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;
};

/** Build JSON feed array from products */
const buildJson = (products) =>
  products
    .filter((p) => p.images?.length && p.price)
    .map((p) => {
      const d = buildProductData(p);
      const sizes = [];
      const colors = [];

      if (p.variants?.length) {
        p.variants.forEach((v) => {
          if (v.color?.name) colors.push(v.color.name);
          (v.sizeStock || []).forEach((s) => s.size && sizes.push(s.size));
        });
      } else if (p.sizeStock?.length) {
        p.sizeStock.forEach((s) => s.size && sizes.push(s.size));
      }

      return {
        id: d.id,
        title: d.title,
        description: d.desc,
        link: d.link,
        image_link: d.imageLink,
        additional_image_links: d.extraImgs,
        availability: d.inStock ? "in stock" : "out of stock",
        price: d.hasDiscount ? d.originalPrice : d.price,
        sale_price: d.salePrice || undefined,
        brand: d.brand,
        condition: "new",
        google_product_category: d.googleCategory,
        product_type: d.category,
        item_group_id: d.itemGroupId,
        mpn: d.sku || undefined,
        color: [...new Set(colors)].join(", ") || undefined,
        size: [...new Set(sizes)].join(", ") || undefined,
        gender: d.gender || undefined,
        material: d.material || undefined,
        custom_label_0: d.tags ? String(d.tags).slice(0, 100) : undefined,
      };
    });

/** Fetch products and regenerate both feeds; store in cache */
const generateFeeds = async () => {
  console.log("[FeedCron] Generating merchant feeds...");
  try {
    // Populate color name for variants
    const products = await Product.find({ "inventory.online": true })
      .select(FEED_SELECT)
      .populate("variants.color", "name")
      .lean();

    cache.xml     = buildXml(products);
    cache.json    = buildJson(products);
    cache.builtAt = new Date();
    console.log(`[FeedCron] Feeds built — ${products.length} products, at ${cache.builtAt.toISOString()}`);
  } catch (err) {
    console.error("[FeedCron] Feed generation failed:", err.message);
  }
};

/** Schedule daily regeneration at 2:00 AM IST and run once on startup */
const startFeedCron = () => {
  // Run immediately on startup (after a short delay so DB is ready)
  setTimeout(generateFeeds, 8000);
  // Daily at 2:00 AM IST
  cron.schedule("0 2 * * *", generateFeeds, { timezone: "Asia/Kolkata" });
  console.log("[FeedCron] Scheduled — runs daily at 2:00 AM IST");
};

module.exports = { startFeedCron, generateFeeds, cache };
