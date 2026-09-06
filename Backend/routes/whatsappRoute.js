const express = require("express");
const router = express.Router();
const {
  getRecipients,
  createCampaign,
  sendBulkWhatsApp,
  updateCampaignProgress,
  getCampaigns,
  getCampaignDetails,
  deleteCampaign,
} = require("../controller/whatsappCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

router.get("/recipients", authMiddleware, isAdmin, getRecipients);
router.post("/campaign", authMiddleware, isAdmin, createCampaign);
router.post("/send-bulk", authMiddleware, isAdmin, sendBulkWhatsApp);
router.put("/campaign-progress", authMiddleware, isAdmin, updateCampaignProgress);
router.get("/campaigns", authMiddleware, isAdmin, getCampaigns);
router.get("/campaign/:id", authMiddleware, isAdmin, getCampaignDetails);
router.delete("/campaign/:id", authMiddleware, isAdmin, deleteCampaign);

module.exports = router;
