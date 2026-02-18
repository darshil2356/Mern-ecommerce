import { Helmet } from "react-helmet";
import React from "react";

const Meta = (props) => {
  return (
    <Helmet>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="VogueCraft - Premium Clothing Brand. Shop the latest fashion trends with our reel-based shopping experience." />
      <meta name="keywords" content="clothing, fashion, online shopping, reels shopping, trendy clothes" />
      <meta property="og:title" content={props.title || "VogueCraft"} />
      <meta property="og:description" content="Premium Clothing Brand - Shop the latest fashion trends" />
      <meta property="og:type" content="website" />
      <title>{props.title ? `${props.title} | VogueCraft` : "VogueCraft - Premium Clothing Brand"}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default Meta;

