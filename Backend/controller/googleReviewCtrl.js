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

const bottomAngles = [
  "fit and waist comfort of bottom-wear",
  "stitching quality and durability of bottoms",
  "fabric weight and comfort for everyday wear",
  "tailoring and finish — how well the bottoms hold shape",
  "size accuracy and ease of movement in bottom-wear",
  "value for money for manufactured bottom-wear",
];

const generateRandomReview = (specialty = "") => {
  const openings = [
    "Yashoda Fashion has an amazing collection of ethnic wear.",
    "I had a wonderful shopping experience at Yashoda Fashion.",
    "Yashoda Fashion is definitely the best place for women's clothing.",
    "If you are looking for premium quality ethnic wear, Yashoda Fashion is the place.",
    "Bahut hi sundar collection hai Yashoda Fashion par.",
    "I am absolutely in love with the clothes from Yashoda Fashion.",
    "Yashoda Fashion never disappoints with their designs.",
    "Best shopping store for ladies wear, highly satisfied with Yashoda Fashion.",
    "Yashoda Fashion has become my go-to store for all family functions.",
    "My experience at Yashoda Fashion has been extremely good."
  ];

  const specialtyOpenings = [
    "Yashoda Fashion has an excellent collection of bottoms and pants.",
    "I bought bottom-wear from Yashoda Fashion and it is outstanding.",
    "For good quality ladies bottoms and trousers, Yashoda Fashion is perfect.",
    "Yashoda Fashion's self-manufactured bottoms are really impressive.",
    "Bahut acchi fitting wale bottoms milte hain Yashoda Fashion par."
  ];

  const middleProduct = [
    "I recently bought a beautiful suit set and got so many compliments.",
    "Their kurtis, sarees, and suits have the latest patterns.",
    "The range of traditional and casual outfits they offer is huge.",
    "I purchased a designer saree and a heavy dupatta set from them.",
    "Bought 2 sets of ethnic wear and both look elegant and stylish.",
    "Their collections of kurtas and designer wear are outstanding.",
    "Every piece in their collection looks unique and well-designed.",
    "Bought a kurti set for a family gathering and it looked beautiful.",
    "From daily wear to heavy festive wear, they have everything.",
    "I picked up a festive outfit and it fits me like a dream."
  ];

  const specialtyProduct = [
    "Their bottom-wear designs are very neat and comfortable.",
    "I purchased a pair of pants and they look very smart.",
    "The stitching and fit of their pants and salwars is perfect.",
    "Their collection of manufactured trousers and leggings is amazing.",
    "I bought cotton bottoms and they are extremely comfortable for daily use."
  ];

  const middleQuality = [
    "The fabric quality is super soft and premium.",
    "Stitching is very neat, and the finish is highly professional.",
    "The material feels durable and retains its shine after washing.",
    "Quality wise the clothing is extremely high-grade.",
    "Kapde ka kapda bahut hi soft aur comfortable hai.",
    "The dress material is of very fine quality and comfortable to wear.",
    "Stitching aur finish ekdum perfect aur neat hai.",
    "Even after multiple washes, the quality remains exactly the same.",
    "You can feel the premium quality of the material just by touching it.",
    "Very comfortable fabric that is perfect for all day wear."
  ];

  const middlePriceService = [
    "Prices are very reasonable and totally worth it.",
    "Staff members are very polite, cooperative, and help you select the best.",
    "The pricing is highly competitive for this level of quality.",
    "Excellent customer support and friendly staff behavior.",
    "Saste aur acche damon par premium collection milta hai yahan.",
    "They offer great value for money and discount options.",
    "The staff went out of their way to find my size.",
    "Pricing is fair and they have options for all budgets.",
    "Customer service is quick and they explain the details very well.",
    "It is a budget-friendly store without compromising on look or feel."
  ];

  const closings = [
    "Highly recommend Yashoda Fashion to all ladies!",
    "Will definitely come back for more shopping soon.",
    "Highly recommend this store to friends and family.",
    "Ek baar zaroor visit karein shopping ke liye, you will love it.",
    "I will give them a 5-star rating for their wonderful items.",
    "A must-visit boutique for women's fashion in the city.",
    "Highly recommended to everyone looking for quality outfits.",
    "I am a very happy customer and will shop again soon.",
    "Do visit them for festive wear shopping, highly recommended.",
    "Overall, a fantastic shopping destination for women."
  ];

  const spec = (specialty || "").toLowerCase();
  const isSpecialty = spec.includes("bottom") || spec.includes("bottomwear") || spec.includes("bottom-wear");

  const selectedOpenings = isSpecialty ? specialtyOpenings : openings;
  const selectedProducts = isSpecialty ? specialtyProduct : middleProduct;

  const o = selectedOpenings[Math.floor(Math.random() * selectedOpenings.length)];
  const p = selectedProducts[Math.floor(Math.random() * selectedProducts.length)];
  const q = middleQuality[Math.floor(Math.random() * middleQuality.length)];
  const s = middlePriceService[Math.floor(Math.random() * middlePriceService.length)];
  const c = closings[Math.floor(Math.random() * closings.length)];

  return `${o} ${p} ${q} ${s} ${c}`;
};

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

    // allow product-specific or specialty hints from query params
    const prodId = req.query.prodId;
    const specialty = (req.query.specialty || "").toLowerCase();

    let angle = reviewAngles[Math.floor(Math.random() * reviewAngles.length)];
    if (specialty.includes("bottom") || specialty.includes("bottomwear") || specialty.includes("bottom-wear")) {
      angle = bottomAngles[Math.floor(Math.random() * bottomAngles.length)];
    }

    // If a specific product is requested, fetch it and bias the prompt
    let productHint = "";
    if (prodId) {
      try {
        const prod = await Product.findById(prodId).select("title category brand attributes").lean();
        if (prod) {
          productHint = `\nPRODUCT CONTEXT: The review should mention the product: ${prod.title}${prod.category ? ` (category: ${prod.category})` : ""}${prod.brand ? `, brand: ${prod.brand}` : ""}${prod.attributes?.material ? `, material: ${prod.attributes.material}` : ""}`;
          // bias angle to mention product specifics
          angle = `${angle} (talk about the product ${prod.title} specifically)`;
        }
      } catch (e) {
        // ignore product fetch failures and continue
      }
    }

    const prompt = `You are writing a genuine Google review for "Yashoda Fashion" — a real women's clothing store.\n\nREAL STORE DATA:\n- Categories they sell: ${categories.slice(0, 8).join(", ") || "sarees, kurtis, suits, ethnic wear"}\n- Brands available: ${brands.slice(0, 6).join(", ") || "various brands"}\n- Popular products: ${topSold.slice(0, 4).join(", ") || "sarees, kurtis"}\n- Occasions covered: ${occasions.slice(0, 5).join(", ") || "casual, festive, wedding"}\n- Materials: ${materials.slice(0, 5).join(", ") || "cotton, silk, georgette"}${productHint}\n\nWrite a Google review focused on: ${angle}\n\nAdditional context:\n${specialty.includes("bottom") ? "The store manufactures bottom-wear and you can mention fit, stitching, and durability in relation to their manufacturing expertise." : ""}\n\nRules:\n- 3-5 sentences, natural Indian customer tone (Hindi-English mix is fine e.g. \\\"bahut accha\\\", \\\"ekdum sahi\\\")\n- Mention 1-2 real category/product names from the store data above\n- Sound personal and genuine — not like marketing copy\n- Must include \\\"Yashoda Fashion\\\" at least once\n- No emojis, no hashtags, no star ratings text\n- End with a recommendation to friends/family\n\nReturn ONLY the review text. Nothing else.`;

    const reviewText = await callGemini(prompt);

    if (!reviewText) throw new Error("Empty response");

    res.json({ review: reviewText });
  } catch (error) {
    // Generate dynamic fallback review
    const specialty = req.query.specialty || "";
    const fallbackText = generateRandomReview(specialty);
    res.json({ review: fallbackText });
  }
};

const generateGbpPost = async (req, res) => {
  try {
    const { template, productId, offerId, aiPolish } = req.query;
    const Offer = require("../models/offerModel");

    let postTitle = "";
    let postBody = "";
    let postLink = "https://yashodafashion.com";
    let productDetails = null;
    let offerDetails = null;

    if (productId) {
      productDetails = await Product.findById(productId).lean();
    }
    if (offerId) {
      offerDetails = await Offer.findById(offerId).lean();
    }

    // Fallback: If no productId but template needs one, find a representative product
    if (!productDetails && template !== "Offer") {
      let filter = { "inventory.online": true };
      let sort = { createdAt: -1 };
      if (template === "Saree Collection") {
        filter.$or = [{ category: /saree/i }, { title: /saree/i }];
      } else if (template === "Kurti Collection") {
        filter.$or = [{ category: /kurti|suit/i }, { title: /kurti|suit/i }];
      } else if (template === "Western Wear") {
        filter.$or = [{ category: /western|top|t-shirt|shirt/i }, { title: /western|top|t-shirt|shirt/i }];
      } else if (template === "Pants") {
        filter.$or = [{ category: /pant|bottom|trouser/i }, { title: /pant|bottom|trouser/i }];
      } else if (template === "Festive Collection") {
        filter.$or = [{ category: /festive|wedding|special/i }, { title: /festive|wedding|special/i }, { tags: "special" }];
      } else if (template === "Best Seller") {
        sort = { sold: -1 };
      } else if (template === "Premium Collection") {
        filter.price = { $gte: 1500 };
        sort = { price: -1 };
      }
      productDetails = await Product.findOne(filter).sort(sort).lean();
    }

    // Default Offer fallback
    if (!offerDetails && template === "Offer") {
      offerDetails = await Offer.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
    }

    // Let's create beautiful local template text first
    if (template === "Offer" && offerDetails) {
      postTitle = `🎉 Special Offer: ${offerDetails.title}!`;
      postBody = `${offerDetails.description || "Limited time sale at Yashoda Fashion!"}\n\nDon't miss out on these exclusive savings. Visit Yashoda Fashion in Bapunagar, Ahmedabad to check out the collection or order online.\n\nValidity: Active until ${new Date(offerDetails.endDate).toLocaleDateString()}`;
      postLink = "https://yashodafashion.com/product";
    } else if (productDetails) {
      const prodUrl = `https://yashodafashion.com/product/${productDetails.slug}-${productDetails._id}`;
      postLink = prodUrl;
      const priceText = productDetails.price ? `₹${productDetails.price}` : "";
      const mrpText = productDetails.mrp ? ` (MRP: ₹${productDetails.mrp})` : "";
      
      switch (template) {
        case "New Arrival":
          postTitle = `✨ New Arrival: ${productDetails.title}!`;
          postBody = `Introducing our latest design addition to Yashoda Fashion!\n\nFeatured Product: ${productDetails.title}\nPrice: ${priceText}${mrpText}\nCategory: ${productDetails.category || "Women's Wear"}\n\n${productDetails.short_description || productDetails.description || "Check out the newest styles of kurtis, sarees, and suits now in store."}\n\nVisit Yashoda Fashion in Bapunagar, Ahmedabad or shop online at the link below!`;
          break;
        case "Best Seller":
          postTitle = `🔥 Best Seller: ${productDetails.title}!`;
          postBody = `See why everyone is loving this piece! Our customers can't get enough of this gorgeous outfit.\n\nProduct: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Premium fabric, perfect stitching, and ultimate comfort."}\n\nGet yours today at Yashoda Fashion, Shop No. 1-2, Greendhara Apartment, Bapunagar, Ahmedabad.`;
          break;
        case "Festive Collection":
          postTitle = `🥻 Festive Collection Feature: ${productDetails.title}`;
          postBody = `Get festival-ready with Yashoda Fashion's beautiful ethnic wear. Make every occasion special with our curated festive sets.\n\nOutfit: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Elegant embroidery and premium fabric for that perfect festive look."}\n\nCheck it out at Yashoda Fashion, Ahmedabad. Shop now!`;
          break;
        case "Saree Collection":
          postTitle = `🥻 Elegant Sarees at Yashoda Fashion`;
          postBody = `Wrap yourself in elegance with our premium saree collection. Perfect for weddings, festivals, and parties.\n\nFeatured Saree: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Beautiful patterns, soft fabric, and premium borders."}\n\nShop the collection at Yashoda Fashion, Bapunagar, Ahmedabad.`;
          break;
        case "Kurti Collection":
          postTitle = `👚 Trendy Kurtis & Suit Sets`;
          postBody = `Discover comfortable and stylish kurtis and suits for daily wear or celebrations.\n\nFeatured Design: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Breathable premium fabrics in the latest patterns."}\n\nVisit Yashoda Fashion or click below to explore.`;
          break;
        case "Western Wear":
          postTitle = `👗 Chic Western Wear Collection`;
          postBody = `Upgrade your wardrobe with stylish tops, t-shirts, and western outfits from Yashoda Fashion.\n\nFeatured Outfit: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Trendy cuts, high comfort, and premium fabrics."}\n\nShop now at Yashoda Fashion, Ahmedabad.`;
          break;
        case "Pants":
          postTitle = `👖 Premium Bottom Wear & Pants`;
          postBody = `Perfect fit bottom wear manufactured with care. Comfort and style combined!\n\nFeatured Pants: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Soft cotton, stretchable fit, and durable stitching."}\n\nAvailable in multiple colors and sizes at Yashoda Fashion.`;
          break;
        case "Premium Collection":
          postTitle = `💎 Yashoda Premium Collection`;
          postBody = `Indulge in our premium luxury apparel collection. Exquisite embroidery and finest fabrics for unmatched style.\n\nFeatured Luxury piece: ${productDetails.title}\nPrice: ${priceText}${mrpText}\n\n${productDetails.short_description || productDetails.description || "Exquisite detailing and exclusive design."}\n\nExplore premium fashion at Yashoda Fashion, Bapunagar, Ahmedabad.`;
          break;
        default:
          postTitle = `✨ Feature: ${productDetails.title}`;
          postBody = `${productDetails.title} is now available at Yashoda Fashion!\nPrice: ${priceText}\n\n${productDetails.short_description || productDetails.description || "Check out our premium women's clothing collection."}`;
          break;
      }
    } else {
      // General Fallback
      postTitle = `✨ Yashoda Fashion Ahmedabad`;
      postBody = `Explore the latest collections of kurtis, sarees, suit sets, bottom wear, and western wear at Yashoda Fashion in Bapunagar, Ahmedabad. Premium quality ladies clothing at affordable prices!`;
    }

    if (aiPolish === "true" && process.env.GEMINI_API_KEY) {
      const prompt = `You are a senior social media copywriter and local SEO specialist for "Yashoda Fashion" — a ladies boutique in Bapunagar, Ahmedabad.\n\nWe need to write a Google Business Profile (GBP) update post based on this draft copy:\n\nPOST TITLE: ${postTitle}\nDRAFT POST BODY: ${postBody}\nPRODUCT/OFFER URL: ${postLink}\n\nRules:\n- Write a catchy update post (3-5 sentences maximum)\n- Keep it highly professional, premium, and fashion-focused\n- Sound warm and inviting for ladies shopping in Ahmedabad\n- Include 2-3 relevant hashtags (e.g. #YashodaFashion #AhmedabadBoutique #KurtisInAhmedabad)\n- Keep the call to action clear (e.g. shop online or visit our store at Shop No. 1-2, Greendhara Apartment, Near Bhagawati School, India Colony, Bapunagar, Ahmedabad)\n- Return ONLY the post text (do NOT include title or link in the polished text, as the link will be added separately as a CTA button).\n\nPolished Post:`;
      const polishedText = await callGemini(prompt);
      if (polishedText) {
        postBody = polishedText;
      }
    }

    res.json({
      title: postTitle,
      body: postBody,
      link: postLink,
      image: productDetails?.images?.[0]?.url || ""
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { generateGoogleReview, generateGbpPost };
