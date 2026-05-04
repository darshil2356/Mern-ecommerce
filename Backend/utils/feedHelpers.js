// Shared helpers for Google Merchant Center feed generation

/** Strip HTML tags and decode basic entities */
const stripHtml = (str = "") =>
  str
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Escape special XML characters */
const escapeXml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** Format price as "499.00 INR" */
const formatPrice = (num) => `${Number(num).toFixed(2)} INR`;

/**
 * Map category string → Google product category ID (best-effort).
 * Full taxonomy: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 */
const CATEGORY_MAP = {
  saree:       "1604",   // Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris
  sarees:      "1604",
  kurti:       "212",    // Apparel & Accessories > Clothing > Tops
  kurtis:      "212",
  kurta:       "212",
  lehenga:     "5322",   // Apparel & Accessories > Clothing > Skirts
  salwar:      "211",    // Apparel & Accessories > Clothing > Dresses
  suit:        "211",
  dress:       "211",
  dresses:     "211",
  tops:        "212",
  shirt:       "212",
  shirts:      "212",
  jeans:       "207",    // Apparel & Accessories > Clothing > Pants
  pants:       "207",
  trousers:    "207",
  jacket:      "5335",   // Apparel & Accessories > Clothing > Outerwear
  jackets:     "5335",
  dupatta:     "167",    // Apparel & Accessories > Clothing Accessories > Scarves & Wraps
  stole:       "167",
  accessories: "166",    // Apparel & Accessories > Clothing Accessories
};

const getGoogleCategory = (category = "") => {
  const key = category.toLowerCase().trim();
  return CATEGORY_MAP[key] || "166"; // default: Apparel & Accessories > Clothing Accessories
};

module.exports = { stripHtml, escapeXml, formatPrice, getGoogleCategory };
