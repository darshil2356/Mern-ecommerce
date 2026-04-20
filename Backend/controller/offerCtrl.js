const asyncHandler = require("express-async-handler");
const Offer = require("../models/offerModel");
const validateMongoDbId = require("../utils/validateMongodbId");

// Create offer
const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  res.json(offer);
});

// Get all offers
const getAllOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find().populate("applicableProducts", "title price");
  res.json(offers);
});

// Get single offer
const getOffer = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const offer = await Offer.findById(req.params.id).populate("applicableProducts", "title price");
  if (!offer) return res.status(404).json({ message: "Offer not found" });
  res.json(offer);
});

// Update offer
const updateOffer = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(offer);
});

// Delete offer
const deleteOffer = asyncHandler(async (req, res) => {
  validateMongoDbId(req.params.id);
  await Offer.findByIdAndDelete(req.params.id);
  res.json({ message: "Offer deleted" });
});

/**
 * Apply offers to cart items
 * POST /api/offers/apply
 * Body: { cartItems: [{ productId, categoryName, quantity, price }] }
 * Returns: { cartItems with offerDiscount applied, totalOfferDiscount }
 */
const applyOffers = asyncHandler(async (req, res) => {
  const { cartItems } = req.body;
  if (!cartItems || !cartItems.length) return res.status(400).json({ message: "cartItems required" });

  const now = new Date();
  const activeOffers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  let totalOfferDiscount = 0;

  const result = cartItems.map((item) => {
    const { productId, categoryName, quantity, price } = item;

    // Find best matching offer for this item
      const matchingOffers = activeOffers.filter((offer) => {
        const productMatch =
          !offer.applicableProducts.length ||
          offer.applicableProducts.some((p) => p.toString() === productId?.toString());
        const categoryMatch =
          !offer.applicableCategories.length ||
          offer.applicableCategories.includes(categoryName);
        return productMatch && categoryMatch;
      });

    if (!matchingOffers.length) return { ...item, offerDiscount: 0, appliedOffer: null };

    let bestDiscount = 0;
    let bestOffer = null;

    matchingOffers.forEach((offer) => {
      let discount = 0;

      if (offer.offerType === "BUY_X_FOR_PRICE" && quantity >= offer.buyQty) {
        // e.g. Buy 2 for ₹1800 → original = 2×1000 = 2000, save 200
        const sets = Math.floor(quantity / offer.buyQty);
        const remainder = quantity % offer.buyQty;
        const originalCost = quantity * price;
        const offerCost = sets * offer.fixedPrice + remainder * price;
        discount = originalCost - offerCost;
      }

      if (offer.offerType === "BUY_X_GET_Y_FREE" && quantity >= offer.buyQty) {
        // e.g. Buy 2 get 1 free → every 2 bought, 1 is free
        const sets = Math.floor(quantity / offer.buyQty);
        const freeItems = sets * offer.getFreeQty;
        discount = freeItems * price;
      }

      if (offer.offerType === "FLAT_OFF") {
        discount = offer.discountAmount;
      }

      if (offer.offerType === "PERCENT_OFF") {
        discount = (price * quantity * offer.discountPercent) / 100;
      }

      if (offer.offerType === "MIN_QTY_DISCOUNT" && quantity >= offer.minQty) {
        discount = (price * quantity * offer.discountPercent) / 100;
      }

      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    });

    totalOfferDiscount += bestDiscount;

    return {
      ...item,
      offerDiscount: Math.round(bestDiscount * 100) / 100,
      appliedOffer: bestOffer
        ? { id: bestOffer._id, title: bestOffer.title, offerType: bestOffer.offerType }
        : null,
    };
  });

  res.json({
    cartItems: result,
    totalOfferDiscount: Math.round(totalOfferDiscount * 100) / 100,
  });
});

/**
 * Get active offers for a specific product (for frontend display)
 * GET /api/offers/product/:productId
 */
const getOffersForProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const now = new Date();

  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { applicableProducts: productId },
      { applicableProducts: { $size: 0 } },
    ],
  }).select("title description offerType buyQty getFreeQty fixedPrice discountAmount discountPercent minQty");

  res.json(offers);
});

/**
 * Get all currently active offers (for bulk client-side matching)
 * GET /api/offers/active
 */
const getActiveOffers = asyncHandler(async (req, res) => {
  const now = new Date();
  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).select("title description offerType buyQty getFreeQty fixedPrice discountAmount discountPercent minQty applicableProducts applicableCategories");
  res.json(offers);
});

module.exports = {
  createOffer,
  getAllOffers,
  getOffer,
  updateOffer,
  deleteOffer,
  applyOffers,
  getOffersForProduct,
  getActiveOffers,
};
