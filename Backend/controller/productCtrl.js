//Backend/controller/productCtrl.js
const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");
const { v4: uuidv4 } = require("uuid");

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

    if (Array.isArray(req.body.sizeStock)) {
      req.body.sizeStock = req.body.sizeStock.map((item) => ({
        ...item,
        quantity: Math.max(0, Number(item.quantity) || 0),
      }));
      req.body.quantity = req.body.sizeStock.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
    }

    console.log("NORMALIZED INVENTORY:", req.body.inventory);

    const product = await Product.create(req.body);

    // Generate unique main barcode using UUID
    product.barcode = await generateUniqueBarcode("PRD");
    
    // Generate unique barcodes for each size in sizeStock
    if (product.sizeStock && product.sizeStock.length > 0) {
      for (let i = 0; i < product.sizeStock.length; i++) {
        // Generate unique barcode for each size using UUID
        product.sizeStock[i].barcode = await generateUniqueBarcode("PRD");
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
  const { barcode, sizeStock, ...safeBody } = req.body;

  if (safeBody.inventory) {
    safeBody.inventory = {
      offline: true,
      online: !!safeBody.inventory.online,
    };
  }

  const hasSizeStock = Object.prototype.hasOwnProperty.call(req.body, "sizeStock");

  // If sizeStock is being updated, regenerate unique barcodes for each new size
  if (hasSizeStock) {
    const updatedSizeStock = [];

    const incomingSizeStock = Array.isArray(sizeStock) ? sizeStock : [];

    for (const item of incomingSizeStock) {
      // Only generate new barcode if it doesn't exist
      let newBarcode = item.barcode;
      
      if (!newBarcode) {
        // Generate new unique barcode for this size
        newBarcode = await generateUniqueBarcode("PRD");
      } else {
        // Check if barcode already exists elsewhere
        const existing = await Product.findOne({
          $or: [
            { barcode: newBarcode },
            { "sizeStock.barcode": newBarcode }
          ],
          _id: { $ne: id } // Exclude current product
        });
        
        if (existing) {
          // Generate new unique barcode
          newBarcode = await generateUniqueBarcode("PRD");
        }
      }
      
      updatedSizeStock.push({
        ...item,
        quantity: Math.max(0, Number(item.quantity) || 0),
        barcode: newBarcode
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
    const findProduct = await Product.findById(id).populate("color");
    
    // Calculate total quantity from sizeStock if it exists
    if (findProduct.sizeStock && findProduct.sizeStock.length > 0) {
      const totalQuantity = findProduct.sizeStock.reduce((sum, item) => sum + (item.quantity || 0), 0);
      findProduct.quantity = totalQuantity;
    }
    
    res.json(findProduct);
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
      
      let query = Product.find(queryObj);

      if (req.query.sort) {
        query = query.sort(req.query.sort.split(",").join(" "));
      } else {
        query = query.sort("-createdAt");
      }

      const products = await query;
      return res.json(products);
    }

    // 👇 everything below is ADMIN / INTERNAL (no store=true)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);

    let query = Product.find(JSON.parse(queryStr)).populate("color");

    if (req.query.sort) {
      query = query.sort(req.query.sort.split(",").join(" "));
    } else {
      query = query.sort("-createdAt");
    }

    const product = await query;
    res.json(product);
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
};
