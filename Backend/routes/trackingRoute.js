const express = require("express");
const {
  getTrackingConfig,
  updateTrackingConfig,
  createSession,
  trackEvent,
  getActiveSessions,
  getUserActivity,
  getIssues,
  upgradeSession,
  resolveIssue,
  sendFollowUp,
  getAnalytics,
} = require("../controller/trackingCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Config routes
router.get("/config", getTrackingConfig);                                    // frontend checks this
router.put("/config", authMiddleware, isAdmin, updateTrackingConfig);        // admin toggles this

// Public routes (for frontend tracking)
router.post("/session", createSession);
router.post("/event", trackEvent);
router.patch("/session/:sessionId/upgrade", upgradeSession);

// Admin routes
router.get("/sessions/active", authMiddleware, isAdmin, getActiveSessions);
router.get("/activity", authMiddleware, isAdmin, getUserActivity);
router.get("/issues", authMiddleware, isAdmin, getIssues);
router.put("/issues/:issueId/resolve", authMiddleware, isAdmin, resolveIssue);
router.post("/followup", authMiddleware, isAdmin, sendFollowUp);
router.get("/analytics", authMiddleware, isAdmin, getAnalytics);

module.exports = router;