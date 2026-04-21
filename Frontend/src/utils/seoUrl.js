// Generate SEO-friendly product URL: /product/silk-saree-abc123
export const productUrl = (item) => {
  if (!item?._id) return "/product";
  const slug = item.slug
    || (item.title || "product")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
  return `/product/${slug}-${item._id}`;
};

// Generate SEO-friendly category URL: /product/category/Saree
export const categoryUrl = (cat) =>
  `/product/category/${encodeURIComponent((cat || "").replace(/\s+/g, "-"))}`;
