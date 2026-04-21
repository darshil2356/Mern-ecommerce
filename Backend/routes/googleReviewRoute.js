const express = require("express");
const router = express.Router();
const { generateGoogleReview } = require("../controller/googleReviewCtrl");

router.get("/generate", generateGoogleReview);

module.exports = router;
