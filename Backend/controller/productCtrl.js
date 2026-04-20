//Backend/controller/productCtrl.js
const Product = require("../models/productModel");
const User = require("../models/userModel");
const Offer = require("../models/offerModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const { v4: uuidv4 } = require("uuid");

// Fetch all active offers once and attach best matching offer to each product in the list
const attachOffersToProducts = async (products) => {
  if (!products.length) return products;
  const now = new Date();
  const activeOffers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).select("title description offerType buyQty getFreeQty fixedPrice discountAmount discountPercent minQty applicableProducts applicableCategories").lean();

  if (!activeOffers.length) return products;

  const productSpecific = {};
  const categoryOffers = [];
  const globalOffers = [];
  activeOffers.forEach(offer => {
    if (offer.applicableProducts?.length > 0) {
      offer.applicableProducts.forEach(pid => {
        const key = pid.toString();
        if (!productSpecific[key]) productSpecific[key] = offer;
      });
    } else if (offer.applicableCategories?.length > 0) {
      categoryOffers.push(offer);
    } else {
      globalOffers.push(offer);
    }
  });

  return products.map(p => {
    const pid = p._id.toString();
    const offer =
      productSpecific[pid] ||
      categoryOffers.find(o => o.applicableCategories.includes(p.category)) ||
      globalOffers[0] ||
      null;
    return offer ? { ...p, offer } : p;
  });
};

// Attach ALL matching offers to a single product (for detail page)
const attachOffersToProduct = async (productId, category) => {
  const now = new Date();
  return Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { applicableProducts: productId },
      { applicableProducts: { $size: 0 } },
      ...(category ? [{ applicableCategories: category }] : []),
    ],
  }).select("title description offerType buyQty getFreeQty fixedPrice discountAmount discountPercent minQty").lean();
};

// Helper function to generate unique barcode
const generateUniqueBarcode = async (prefix = "PRD") => {
  let barcode;
  let exists = true;
  let counter = 0;
  
  while (exists) {
    // Generate UUID-like unique ID (first 8 characters)
    const uniqueId = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
    barcode = `${prefix}-${uniqueId}`;
    
    // Check if this barcode exists anywhere (main barcode or in any sizeStock)
    exists = await Product.findOne({
      $or: [
        { barcode: barcode },
        { "sizeStock.barcode": barcode }
      ]
    });
    
    counter++;
    // Safety check to prevent infinite loop
    if (counter > 100) {
      // Fallback with random suffix
      barcode = `${prefix}-${uniqueId}-${Math.floor(Math.random() * 1000)}`;
      break;
    }
  }
  
  return barcode;
};

// const createProduct = asyncHandler(async (req, res) => {
//   try {
//     if (req.body.title) {
//       req.body.slug = slugify(req.body.title);
//     }
//     const newProduct = await Product.create(req.body);
//     res.json(newProduct);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

// const createProduct = asyncHandler(async (req, res) => {
//   try {
//     if (req.body.title) {
//       req.body.slug = slugify(req.body.title);
//     }

//     // 1️⃣ Create product first (without barcode)
//     const product = await Product.create(req.body);

//     // 2️⃣ Generate barcode from Mongo _id
//     const shortId = product._id.toString().slice(-6).toUpperCase();
//     const barcode = `PRD-${shortId}`;

//     // 3️⃣ Save barcode once
//     product.barcode = barcode;
//     await product.save();

//     res.json(product);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

const createProduct = asyncHandler(async (req, res) => {
  try {
    console.log("RAW REQ BODY:", req.body);

    if (req.body.title) {
      req.body.slug = slugify(req.body.title);
    }

    // 🔑 NORMALIZE INVENTORY
    req.body.inventory = {
      offline: true,
      online: req.body.inventory?.online === true,
    };

    const normalizeSizeStock = (items) =>
      (Array.isArray(items) ? items : []).map((item) => ({
        ...item,
        quantity: Math.max(0, Number(item.quantity) || 0),
      }));

    if (Array.isArray(req.body.variants) && req.body.variants.length > 0) {
      req.body.variants = req.body.variants.map((variant) => {
        const sizeStock = normalizeSizeStock(variant.sizeStock);
        return {
          ...variant,
          sizeStock,
        };
      });

      req.body.quantity = req.body.variants.reduce((p, variant) => {
        return p + variant.sizeStock.reduce((q, item) => q + (item.quantity || 0), 0);
      }, 0);

      // set fallback top-level color to first variant if missing
      if (!req.body.color && req.body.variants[0]?.color) {
        req.body.color = req.body.variants[0].color;
      }
    } else if (Array.isArray(req.body.sizeStock)) {
      req.body.sizeStock = normalizeSizeStock(req.body.sizeStock);
      req.body.quantity = req.body.sizeStock.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    }

    console.log("NORMALIZED INVENTORY:", req.body.inventory);

    const product = await Product.create(req.body);

    // Generate unique main barcode using UUID
    product.barcode = await generateUniqueBarcode("PRD");

    // Generate unique barcodes for each size in top-level sizeStock
    if (product.sizeStock && product.sizeStock.length > 0) {
      for (let i = 0; i < product.sizeStock.length; i++) {
        if (!product.sizeStock[i].barcode) {
          product.sizeStock[i].barcode = await generateUniqueBarcode("PRD");
        }
      }
    }

    // Generate unique barcodes for each size in variant sizeStock
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        if (!Array.isArray(variant.sizeStock)) continue;
        for (let i = 0; i < variant.sizeStock.length; i++) {
          if (!variant.sizeStock[i].barcode) {
            variant.sizeStock[i].barcode = await generateUniqueBarcode("PRD");
          }
        }
      }
    }
    
    await product.save();

    res.json(product);
  } catch (error) {
    throw new Error(error);
  }
});






// const updateProduct = asyncHandler(async (req, res) => {
//   const { id } = req.params;
//   validateMongoDbId(id);
//   try {
//     if (req.body.title) {
//       req.body.slug = slugify(req.body.title);
//     }
//     // const updateProduct = await Product.findByIdAndUpdate(id, req.body, {
//     //   new: true,
//     // });

//     const { barcode, ...safeBody } = req.body;

// if (safeBody.inventory) {
//   safeBody.inventory = {
//     offline: true,
//     online: !!safeBody.inventory.online,
//   };
// }


//     res.json(updateProduct);
//   } catch (error) {
//     throw new Error(error);
//   }
// });




const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }

  // Don't allow manual barcode updates from frontend
  const { barcode, ...safeBody } = req.body;

  if (safeBody.inventory) {
    safeBody.inventory = {
      offline: true,
      online: !!safeBody.inventory.online,
    };
  }

  const hasSizeStock = Object.prototype.hasOwnProperty.call(req.body, "sizeStock");
  const hasVariants = Object.prototype.hasOwnProperty.call(req.body, "variants");

  if (hasVariants ) {
    const updatedVariants = [];
    const incomingVariants = Array.isArray(req.body.variants) ? req.body.variants : [];

    for (const variant of incomingVariants) {
      if (!variant?.color) continue; // valid variant needs color

      const incomingSizeStock = Array.isArray(variant.sizeStock) ? variant.sizeStock : [];
      const updatedSizeStock = [];

      for (const item of incomingSizeStock) {
        let newBarcode = item.barcode;
        if (!newBarcode) {
          newBarcode = await generateUniqueBarcode("PRD");
        } else {
          const existing = await Product.findOne({
            $or: [
              { barcode: newBarcode },
              { "sizeStock.barcode": newBarcode },
              { "variants.sizeStock.barcode": newBarcode },
            ],
            _id: { $ne: id },
          });

          if (existing) newBarcode = await generateUniqueBarcode("PRD");
        }

        updatedSizeStock.push({
          ...item,
          quantity: Math.max(0, Number(item.quantity) || 0),
          barcode: newBarcode,
        });
      }

      updatedVariants.push({
        color: variant.color,
        sizeStock: updatedSizeStock,
      });
    }

    safeBody.variants = updatedVariants;
    safeBody.quantity = updatedVariants.reduce((sum, variant) => {
      return sum + variant.sizeStock.reduce((q, s) => q + (s.quantity || 0), 0);
    }, 0);
    
    // fallback top-level color
    if (updatedVariants[0]?.color) safeBody.color = updatedVariants[0].color;
  } else if (hasSizeStock) {
    const updatedSizeStock = [];

    const incomingSizeStock = Array.isArray(req.body.sizeStock) ? req.body.sizeStock : [];

    for (const item of incomingSizeStock) {
      let newBarcode = item.barcode;

      if (!newBarcode) {
        newBarcode = await generateUniqueBarcode("PRD");
      } else {
        const existing = await Product.findOne({
          $or: [
            { barcode: newBarcode },
            { "sizeStock.barcode": newBarcode },
            { "variants.sizeStock.barcode": newBarcode },
          ],
          _id: { $ne: id },
        });

        if (existing) {
          newBarcode = await generateUniqueBarcode("PRD");
        }
      }

      updatedSizeStock.push({
        ...item,
        quantity: Math.max(0, Number(item.quantity) || 0),
        barcode: newBarcode,
      });
    }

    safeBody.sizeStock = updatedSizeStock;
    safeBody.quantity = updatedSizeStock.reduce(
      (sum, item) => sum + (item.quantity || 0),
      0
    );
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    safeBody,
    { new: true }
  );

  res.json(updatedProduct);
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedProduct = await Product.findByIdAndDelete(id);

    res.json(deletedProduct);
  } catch (error) {
    throw new Error(error);
  }
});


// const getAllProduct = asyncHandler(async (req, res) => {
//   try {
//     // Filtering
//     const queryObj = { ...req.query };

//       // 🔑 ADD THIS
//     if (queryObj.store === "true") {
//       queryObj["inventory.online"] = true;
//     }
//     const excludeFields = ["page", "sort", "limit", "fields"];
//     excludeFields.forEach((el) => delete queryObj[el]);
//     let queryStr = JSON.stringify(queryObj);
//     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

//     let query = Product.find(JSON.parse(queryStr));

//     // Sorting

//     if (req.query.sort) {
//       const sortBy = req.query.sort.split(",").join(" ");
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort("-createdAt");
//     }

//     // limiting the fields

//     if (req.query.fields) {
//       const fields = req.query.fields.split(",").join(" ");
//       query = query.select(fields);
//     } else {
//       query = query.select("-__v");
//     }

//     // pagination

//     const page = req.query.page;
//     const limit = req.query.limit;
//     const skip = (page - 1) * limit;
//     query = query.skip(skip).limit(limit);
//     if (req.query.page) {
//       const productCount = await Product.countDocuments();
//       if (skip >= productCount) throw new Error("This Page does not exists");
//     }
//     const product = await query;
//     res.json(product);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

const getaProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const findProduct = await Product.findById(id).populate("color").populate("variants.color");
    
    // Calculate total quantity from sizeStock if it exists
    if (findProduct.variants && findProduct.variants.length > 0) {
      const totalQuantity = findProduct.variants.reduce(
        (sum, variant) => sum + variant.sizeStock.reduce((q, item) => q + (item.quantity || 0), 0),
        0
      );
      findProduct.quantity = totalQuantity;
    } else if (findProduct.sizeStock && findProduct.sizeStock.length > 0) {
      const totalQuantity = findProduct.sizeStock.reduce((sum, item) => sum + (item.quantity || 0), 0);
      findProduct.quantity = totalQuantity;
    }
    
    const productObj = findProduct.toObject();
    productObj.offers = await attachOffersToProduct(productObj._id, productObj.category);
    res.json(productObj);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllProduct = asyncHandler(async (req, res) => {
  try {
    const queryObj = { ...req.query };
    
    // Remove helper params
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 🔒 HARD GATE FOR PUBLIC STORE - but allow filters too!
    if (req.query.store === "true") {
      // Start with online products only
      queryObj["inventory.online"] = true;
      
      // Add other filters if provided
      if (req.query.category) {
        queryObj.category = req.query.category;
      }
      if (req.query.brand) {
        queryObj.brand = req.query.brand;
      }
      if (req.query.tags) {
        queryObj.tags = req.query.tags;
      }
      if (req.query["price[gte]"]) {
        queryObj.price = { $gte: parseInt(req.query["price[gte]"]) };
      }
      if (req.query["price[lte]"]) {
        queryObj.price = { ...queryObj.price, $lte: parseInt(req.query["price[lte]"]) };
      }
      
      const limit = parseInt(req.query.limit) || 200;

      if (req.query.sort) {
        const products = await Product.find(queryObj)
          .sort(req.query.sort.split(",").join(" "))
          .limit(limit)
          .lean();
        return res.json(await attachOffersToProducts(products));
      }

      // Instagram-style algorithm: recency + popularity + small random shuffle
      const allProducts = await Product.find(queryObj)
        .select("title price images videos slug category brand tags sold totalrating ratings reelLikes createdAt inventory quantity sizeStock variants color")
        .limit(limit)
        .lean();

      const now = Date.now();
      const scored = allProducts.map((p) => {
        const ageHours = (now - new Date(p.createdAt).getTime()) / 3600000;
        const recencyScore = Math.max(0, 100 - ageHours / 12); // decays over ~50 days
        const popularityScore = Math.log1p(p.sold || 0) * 30 + Math.log1p(p.totalrating || 0) * 20 + Math.log1p(p.reelLikes || 0) * 10;
        const randomScore = Math.random() * 15;
        return { ...p, _score: recencyScore + popularityScore + randomScore };
      });

      scored.sort((a, b) => b._score - a._score);
      const withOffers = await attachOffersToProducts(scored.map(({ _score, ...p }) => p));
      return res.json(withOffers);
    }

    // 👇 everything below is ADMIN / INTERNAL (no store=true)
    const { buildQueryObject, applySorting, applyPagination } = require("../utils/apiFeatures");
    const filter = buildQueryObject(req.query);
    let query = Product.find(filter).populate("color").populate("variants.color");

    query = applySorting(query, req.query.sort);

    if (req.query.page || req.query.limit) {
      query = applyPagination(query, req.query.page, req.query.limit);
    } else {
      query = query.limit(50); // default safety limit
    }

    const product = await query.lean();
    // Ensure quantity is normalized for old products with sizeStock / variants
    const normalizedProducts = product.map((prod) => {
      let quantity;
      if (prod.variants && prod.variants.length > 0) {
        quantity = prod.variants.reduce((total, variant) => total + (variant.sizeStock || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0), 0);
      } else if (prod.sizeStock && prod.sizeStock.length > 0) {
        quantity = prod.sizeStock.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      } else {
        quantity = Number(prod.quantity || 0);
      }
      return { ...prod, quantity };
    });
    res.json(await attachOffersToProducts(normalizedProducts));
  } catch (error) {
    throw new Error(error);
  }
});


const addToWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { prodId } = req.body;
  try {
    const user = await User.findById(_id);
    const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
    if (alreadyadded) {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $pull: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    } else {
      let user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { wishlist: prodId },
        },
        {
          new: true,
        }
      );
      res.json(user);
    }
  } catch (error) {
    throw new Error(error);
  }
});

const rating = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { star, prodId, comment, images } = req.body;
  try {
    const product = await Product.findById(prodId);
    
    // Check if user has purchased this product (verified purchase)
    const Order = require("../models/orderModel");
    const hasPurchased = await Order.findOne({
      user: _id,
      "orderItems.product": prodId,
      orderStatus: { $in: ["Delivered", "Shipped"] }
    });
    
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      const updateRating = await Product.updateOne(
        {
          ratings: { $elemMatch: alreadyRated },
        },
        {
          $set: { 
            "ratings.$.star": star, 
            "ratings.$.comment": comment,
            "ratings.$.images": images || [],
          },
        },
        {
          new: true,
        }
      );
    } else {
      const rateProduct = await Product.findByIdAndUpdate(
        prodId,
        {
          $push: {
            ratings: {
              star: star,
              comment: comment,
              postedby: _id,
              images: images || [],
              isVerifiedPurchase: hasPurchased ? true : false,
            },
          },
        },
        {
          new: true,
        }
      );
    }
    
    // Get all ratings and calculate statistics
    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length;
    let ratingsum = getallratings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round(ratingsum / totalRating);
    
    // Calculate rating statistics
    const ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    getallratings.ratings.forEach((item) => {
      if (ratingStats[item.star] !== undefined) {
        ratingStats[item.star]++;
      }
    });
    
    let finalproduct = await Product.findByIdAndUpdate(
      prodId,
      {
        totalrating: actualRating,
        ratingStats: ratingStats,
      },
      { new: true }
    );
    res.json(finalproduct);
  } catch (error) {
    throw new Error(error);
  }
});

// New: Get all reviews for admin
const getAllReviews = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({}, "title ratings totalrating ratingStats")
      .populate("ratings.postedby", "firstname lastname email");
    
    // Flatten all reviews with product info
    let allReviews = [];
    products.forEach(product => {
      if (product.ratings && product.ratings.length > 0) {
        product.ratings.forEach(rating => {
          allReviews.push({
            _id: rating._id,
            star: rating.star,
            comment: rating.comment,
            images: rating.images,
            isVerifiedPurchase: rating.isVerifiedPurchase,
            helpful: rating.helpful,
            createdAt: rating.createdAt,
            product: {
              _id: product._id,
              title: product.title,
              totalrating: product.totalrating,
            },
            user: rating.postedby,
          });
        });
      }
    });
    
    // Sort by date (newest first)
    allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(allReviews);
  } catch (error) {
    throw new Error(error);
  }
});

// New: Mark review as helpful
const markReviewHelpful = asyncHandler(async (req, res) => {
  const { prodId, reviewId } = req.body;
  try {
    const product = await Product.findById(prodId);
    const review = product.ratings.id(reviewId);
    
    if (review) {
      review.helpful = (review.helpful || 0) + 1;
      await product.save();
      res.json({ success: true, helpful: review.helpful });
    } else {
      res.status(404).json({ message: "Review not found" });
    }
  } catch (error) {
    throw new Error(error);
  }
});

// New: Delete a review (admin or user)
const deleteReview = asyncHandler(async (req, res) => {
  const { prodId, reviewId } = req.params;
  const { _id: userId } = req.user;
  const { isAdmin } = req.body;
  
  try {
    const product = await Product.findById(prodId);
    const review = product.ratings.id(reviewId);
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    
    // Allow deletion if user owns the review or is admin
    if (review.postedby.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }
    
    // Remove the review
    product.ratings.pull({ _id: reviewId });
    
    // Recalculate ratings
    let totalRating = product.ratings.length;
    let ratingsum = product.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = totalRating > 0 ? Math.round(ratingsum / totalRating) : 0;
    
    // Recalculate stats
    const ratingStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    product.ratings.forEach((item) => {
      if (ratingStats[item.star] !== undefined) {
        ratingStats[item.star]++;
      }
    });
    
    product.totalrating = actualRating;
    product.ratingStats = ratingStats;
    await product.save();
    
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    throw new Error(error);
  }
});

// ─── REELS: Instagram-style algorithm feed ────────────────────────────────────
const getReels = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 20);
  const page = Math.max(parseInt(req.query.page) || 1, 1);

  // Optional auth
  let userId = null;
  try {
    const jwt = require("jsonwebtoken");
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded?.id?.toString();
    }
  } catch {}

  const allReels = await Product.find({ "videos.0": { $exists: true } })
    .select("title price images videos reelLikes reelLikedBy slug createdAt")
    .lean();

  const now = Date.now();
  // Score: likes weight + recency weight + small random shuffle
  const scored = allReels.map((r) => {
    const ageHours = (now - new Date(r.createdAt).getTime()) / 3600000;
    const likesScore = Math.log1p(r.reelLikes || 0) * 40;
    const recencyScore = Math.max(0, 100 - ageHours / 24); // decays over days
    const randomScore = Math.random() * 20;
    return { ...r, _score: likesScore + recencyScore + randomScore };
  });

  scored.sort((a, b) => b._score - a._score);

  const total = scored.length;
  const start = (page - 1) * limit;
  const slice = scored.slice(start, start + limit);
  const hasMore = start + limit < total;

  const reelsOut = slice.map(({ _score, ...r }) => ({
    ...r,
    liked: userId ? (r.reelLikedBy || []).map(String).includes(userId) : false,
    reelLikedBy: undefined,
  }));

  res.json({ reels: reelsOut, nextCursor: hasMore ? page + 1 : null, hasMore });
});

// ─── REEL LIKE / UNLIKE ────────────────────────────────────────────────────────
const toggleReelLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  const userId = req.user._id.toString();
  const product = await Product.findById(id).select("reelLikedBy reelLikes");
  if (!product) return res.status(404).json({ message: "Product not found" });

  const alreadyLiked = (product.reelLikedBy || []).map(String).includes(userId);
  const update = alreadyLiked
    ? { $pull: { reelLikedBy: userId }, $inc: { reelLikes: -1 } }
    : { $addToSet: { reelLikedBy: userId }, $inc: { reelLikes: 1 } };

  const updated = await Product.findByIdAndUpdate(id, update, { new: true }).select("reelLikes");
  res.json({ liked: !alreadyLiked, reelLikes: Math.max(0, updated.reelLikes) });
});

module.exports = {
  createProduct,
  getaProduct,
  getAllProduct,
  updateProduct,
  deleteProduct,
  addToWishlist,
  rating,
  getAllReviews,
  markReviewHelpful,
  deleteReview,
  getReels,
  toggleReelLike,
};
