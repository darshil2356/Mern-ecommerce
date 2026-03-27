const express = require("express");
const router = express.Router();
const {
  getSpinConfig,
  updateSpinConfig,
  addSegment,
  updateSegment,
  deleteSegment,
  playSpin,
  playSpinPOS,
  getSpinHistory,
} = require("../controller/spinCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.get("/config", getSpinConfig);
router.put("/config", authMiddleware, isAdmin, updateSpinConfig);
router.post("/segment", authMiddleware, isAdmin, addSegment);
router.put("/segment/:segmentId", authMiddleware, isAdmin, updateSegment);
router.delete("/segment/:segmentId", authMiddleware, isAdmin, deleteSegment);
router.post("/play", authMiddleware, playSpin);
router.post("/play-pos", authMiddleware, isAdmin, playSpinPOS); // POS: admin token, customer mobile in body
router.get("/history", authMiddleware, getSpinHistory);

module.exports = router;
