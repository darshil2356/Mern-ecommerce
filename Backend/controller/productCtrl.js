//Backend/controller/productCtrl.js
const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");

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

    console.log("NORMALIZED INVENTORY:", req.body.inventory);

    const product = await Product.create(req.body);

    const shortId = product._id.toString().slice(-6).toUpperCase();
    product.barcode = `PRD-${shortId}`;
    
    // Generate unique barcodes for each size in sizeStock
    if (product.sizeStock && product.sizeStock.length > 0) {
      for (let i = 0; i < product.sizeStock.length; i++) {
        let sizeBarcode = `PRD-${shortId}-${product.sizeStock[i].size}`;
        
        // Ensure barcode is unique by checking database
        let counter = 1;
        let originalBarcode = sizeBarcode;
        while (await Product.findOne({ "sizeStock.barcode": sizeBarcode })) {
          sizeBarcode = `${originalBarcode}-${counter}`;
          counter++;
        }
        
        product.sizeStock[i].barcode = sizeBarcode;
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

  const existingProduct = await Product.findById(id);
  
  // If sizeStock is being updated, regenerate barcodes for each size
  if (sizeStock && sizeStock.length > 0) {
    const shortId = existingProduct._id.toString().slice(-6).toUpperCase();
    const updatedSizeStock = sizeStock.map(item => ({
      ...item,
      barcode: item.barcode || `PRD-${shortId}-${item.size}`
    }));
    safeBody.sizeStock = updatedSizeStock;
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

    let query = Product.find(JSON.parse(queryStr));

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
  const { star, prodId, comment } = req.body;
  try {
    const product = await Product.findById(prodId);
    let alreadyRated = product.ratings.find(
      (userId) => userId.postedby.toString() === _id.toString()
    );
    if (alreadyRated) {
      const updateRating = await Product.updateOne(
        {
          ratings: { $elemMatch: alreadyRated },
        },
        {
          $set: { "ratings.$.star": star, "ratings.$.comment": comment },
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
            },
          },
        },
        {
          new: true,
        }
      );
    }
    const getallratings = await Product.findById(prodId);
    let totalRating = getallratings.ratings.length;
    let ratingsum = getallratings.ratings
      .map((item) => item.star)
      .reduce((prev, curr) => prev + curr, 0);
    let actualRating = Math.round(ratingsum / totalRating);
    let finalproduct = await Product.findByIdAndUpdate(
      prodId,
      {
        totalrating: actualRating,
      },
      { new: true }
    );
    res.json(finalproduct);
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
};

