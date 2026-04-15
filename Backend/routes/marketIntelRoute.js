const express = require("express");
const { generateMarketIntel, getLastMarketIntel } = require("../controller/marketIntelCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/generate", authMiddleware, isAdmin, generateMarketIntel);
router.get("/last", authMiddleware, isAdmin, getLastMarketIntel);

module.exports = router;
