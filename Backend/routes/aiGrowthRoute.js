const express = require("express");
const { aiGrowthReport, getLastGrowthReport } = require("../controller/aiGrowthCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/report", authMiddleware, isAdmin, aiGrowthReport);
router.get("/last", authMiddleware, isAdmin, getLastGrowthReport);

module.exports = router;
