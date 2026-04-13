const express = require("express");
const router = express.Router();
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const {
  subscribeFCM,
  unsubscribeFCM,
  sendNotificationToUser,
  broadcastNotification,
} = require("../controller/notificationCtrl");

router.post("/subscribe", authMiddleware, subscribeFCM);
router.delete("/unsubscribe", authMiddleware, unsubscribeFCM);
router.post("/send", authMiddleware, isAdmin, sendNotificationToUser);
router.post("/broadcast", authMiddleware, isAdmin, broadcastNotification);

module.exports = router;
