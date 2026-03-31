import { Helmet } from "react-helmet";
import React from "react";

const Meta = ({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  price,
  brand,
  availability,
  schema,
}) => {
  const siteUrl = "https://yashodafashion.in"; // ← change to your domain
  const siteName = "Yashoda Fashion";
  const defaultDesc =
    "Yashoda Fashion – Premium Fashion & Clothing Brand. Shop the latest trends, new arrivals, and exclusive deals online.";
  const defaultImage = `${siteUrl}/logo512.png`;

  const metaTitle = title ? `${title} | ${siteName}` : `${siteName} – Premium Fashion`;
  const metaDesc = description || defaultDesc;
  const metaImage = image || defaultImage;
  const metaUrl = url ? `${siteUrl}${url}` : siteUrl;
  const metaKeywords =
    keywords ||
    "fashion, clothing, online shopping, premium fashion, Yashoda Fashion, trendy clothes, new arrivals";

  // Product structured data (JSON-LD) for product pages
  const productSchema =
    schema ||
    (price
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: title,
          description: metaDesc,
          image: metaImage,
          brand: { "@type": "Brand", name: brand || siteName },
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: price,
            availability:
              availability === false
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: metaUrl,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteName,
          url: siteUrl,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl}/product?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        });

  return (
    <Helmet>
      <html lang="en" />
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{metaTitle}</title>
      <meta name="description" content={metaDesc} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={metaUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage} />

      {/* Product-specific OG tags */}
      {price && <meta property="product:price:amount" content={price} />}
      {price && <meta property="product:price:currency" content="INR" />}

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
    </Helmet>
  );
};

export default Meta;
