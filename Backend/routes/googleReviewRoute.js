const express = require("express");
const router = express.Router();
const { generateGoogleReview, generateGbpPost } = require("../controller/googleReviewCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.get("/generate", generateGoogleReview);
router.get("/generate-gbp", authMiddleware, isAdmin, generateGbpPost);

module.exports = router;
