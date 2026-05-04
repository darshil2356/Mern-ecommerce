/**
 * Transforms a Cloudinary image URL to include auto format + quality optimization.
 * Inserts f_auto,q_auto (and optional w_ resize) after /upload/
 * Falls back to original URL if not a Cloudinary URL.
 *
 * Usage:
 *   cloudImg(url)           → f_auto,q_auto (full size, best format)
 *   cloudImg(url, 800)      → f_auto,q_auto,w_800 (resized to 800px wide)
 *   cloudImg(url, 400, 400) → f_auto,q_auto,w_400,h_400,c_fill
 */
export const cloudImg = (url, width, height) => {
  if (!url || !url.includes("res.cloudinary.com")) return url || "";

  const transforms = ["f_auto", "q_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`, "c_fill");

  // Insert transforms right after /upload/
  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
};
