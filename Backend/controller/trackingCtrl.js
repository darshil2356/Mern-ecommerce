const asyncHandler = require("express-async-handler");
const Session = require("../models/sessionModel");
const Event = require("../models/eventModel");
const Issue = require("../models/issueModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const { v4: uuidv4 } = require("uuid");

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
};

const getRequestUserAgent = (req) => req.headers["user-agent"] || "unknown";

// Create or update session
const createSession = asyncHandler(async (req, res) => {
  const {
    userId,
    guestId,
    sessionId,
    ipAddress,
    userAgent,
    device,
    location,
    currentPage,
  } = req.body;

  const resolvedIp = ipAddress || getRequestIp(req);
  const resolvedUserAgent = userAgent || getRequestUserAgent(req);

  let session;

  if (sessionId) {
    // Update existing session
    session = await Session.findOneAndUpdate(
      { sessionId },
      {
        lastActivity: new Date(),
        currentPage,
        isActive: true,
        $setOnInsert: {
          userId,
          guestId,
          ipAddress: resolvedIp,
          userAgent: resolvedUserAgent,
          device,
          location,
          startTime: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } else {
    // Create new session
    const newSessionId = uuidv4();
    session = await Session.create({
      userId,
      guestId: guestId || uuidv4(),
      sessionId: newSessionId,
      ipAddress: resolvedIp,
      userAgent: resolvedUserAgent,
      device,
      location,
      currentPage,
    });
  }

  res.json({
    success: true,
    session: {
      sessionId: session.sessionId,
      guestId: session.guestId,
    },
  });
});

// Track user event
const trackEvent = asyncHandler(async (req, res) => {
  const {
    sessionId,
    userId,
    guestId,
    eventType,
    page,
    metadata = {},
    ipAddress,
    userAgent,
    device,
    location,
  } = req.body;

  // Create event
  const event = await Event.create({
    sessionId,
    userId,
    guestId,
    eventType,
    page,
    metadata,
    ipAddress,
    userAgent,
    device,
    location,
  });

  // Update session last activity
  await Session.findOneAndUpdate(
    { sessionId },
    { lastActivity: new Date(), currentPage: page }
  );

  // Check for issues based on event
  await checkForIssues(sessionId, userId, guestId, eventType, metadata);

  res.json({ success: true, eventId: event._id });
});

// Get active sessions for admin dashboard
const getActiveSessions = asyncHandler(async (req, res) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const sessions = await Session.find({
    isActive: true,
    lastActivity: { $gte: fiveMinutesAgo },
  })
    .populate("userId", "firstname lastname email")
    .sort({ lastActivity: -1 })
    .limit(100);

  res.json({
    success: true,
    sessions,
    count: sessions.length,
  });
});

// Get user activity timeline
const getUserActivity = asyncHandler(async (req, res) => {
  const { userId, guestId, sessionId, limit = 50 } = req.query;

  let query = {};
  if (userId) query.userId = userId;
  if (guestId) query.guestId = guestId;
  if (sessionId) query.sessionId = sessionId;

  const events = await Event.find(query)
    .sort({ timestamp: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    events,
  });
});

// Get issues
const getIssues = asyncHandler(async (req, res) => {
  const { resolved = false, severity, limit = 50 } = req.query;

  let query = { resolved };
  if (severity) query.severity = severity;

  const issues = await Issue.find(query)
    .populate("userId", "firstname lastname email")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    issues,
  });
});
// Resolve issue
const resolveIssue = asyncHandler(async (req, res) => {
  const { issueId } = req.params;
  const { resolvedBy } = req.body;

  const issue = await Issue.findByIdAndUpdate(
    issueId,
    {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
    },
    { new: true }
  );

  if (!issue) {
    return res.status(404).json({ success: false, message: "Issue not found" });
  }

  res.json({ success: true, issue });
});

// Send follow-up notification
const sendFollowUp = asyncHandler(async (req, res) => {
  const { userId, guestId, type, title, message, metadata = {} } = req.body;

  const notification = await Notification.create({
    userId,
    guestId,
    type,
    title,
    message,
    metadata,
    createdBy: req.user?._id,
    isAutomated: false,
  });

  // Here you would integrate with actual notification services
  // (Firebase, WhatsApp, Email, etc.)

  res.json({ success: true, notification });
});

// Analytics data
const getAnalytics = asyncHandler(async (req, res) => {
  const { period = "24h" } = req.query;

  let startDate;
  switch (period) {
    case "1h":
      startDate = new Date(Date.now() - 60 * 60 * 1000);
      break;
    case "24h":
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  const [
    totalSessions,
    activeUsers,
    totalEvents,
    issuesCount,
    topPages,
    eventTypes,
  ] = await Promise.all([
    Session.countDocuments({ createdAt: { $gte: startDate } }),
    Session.countDocuments({
      isActive: true,
      lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    }),
    Event.countDocuments({ timestamp: { $gte: startDate } }),
    Issue.countDocuments({
      createdAt: { $gte: startDate },
      resolved: false,
    }),
    Event.aggregate([
      { $match: { timestamp: { $gte: startDate }, eventType: "page_view" } },
      { $group: { _id: "$page", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Event.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    analytics: {
      totalSessions,
      activeUsers,
      totalEvents,
      issuesCount,
      topPages,
      eventTypes,
    },
  });
});

// Issue detection logic
const checkForIssues = async (sessionId, userId, guestId, eventType, metadata) => {
  try {
    // Check for stuck checkout
    if (eventType === "checkout_started") {
      // Schedule check after 2 minutes
      setTimeout(async () => {
        const recentEvents = await Event.find({
          sessionId,
          eventType: { $in: ["checkout_completed", "payment_success"] },
          timestamp: { $gte: new Date(Date.now() - 2 * 60 * 1000) },
        });

        if (recentEvents.length === 0) {
          await Issue.create({
            sessionId,
            userId,
            guestId,
            issueType: "stuck_checkout",
            severity: "medium",
            title: "User stuck on checkout",
            description: "User started checkout but hasn't completed it in 2 minutes",
            metadata: { checkoutStartedAt: new Date() },
          });
        }
      }, 2 * 60 * 1000);
    }

    // Check for payment failures
    if (eventType === "payment_failed") {
      const recentFailures = await Event.countDocuments({
        sessionId,
        eventType: "payment_failed",
        timestamp: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      });

      if (recentFailures >= 3) {
        await Issue.create({
          sessionId,
          userId,
          guestId,
          issueType: "payment_failure",
          severity: "high",
          title: "Multiple payment failures",
          description: `User has failed ${recentFailures} payments in the last hour`,
          metadata: { failureCount: recentFailures },
        });
      }
    }

    // Check for rage clicks
    if (eventType === "rage_click") {
      await Issue.create({
        sessionId,
        userId,
        guestId,
        issueType: "rage_click",
        severity: "medium",
        title: "Rage clicking detected",
        description: "User is clicking rapidly, indicating frustration",
        metadata,
      });
    }

    // Check for abandoned cart
    if (eventType === "add_to_cart") {
      // Check if cart is abandoned after 30 minutes
      setTimeout(async () => {
        const hasPurchased = await Event.findOne({
          sessionId,
          eventType: "checkout_completed",
          timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        });

        if (!hasPurchased) {
          await Issue.create({
            sessionId,
            userId,
            guestId,
            issueType: "abandoned_cart",
            severity: "low",
            title: "Abandoned cart",
            description: "User added items to cart but hasn't completed purchase",
            metadata: { cartItems: metadata.items },
          });
        }
      }, 30 * 60 * 1000);
    }
  } catch (error) {
    console.error("Error in issue detection:", error);
  }
};

let trackingConfig = { enabled: true };

const getTrackingConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, config: trackingConfig });
});

const updateTrackingConfig = asyncHandler(async (req, res) => {
  trackingConfig = { ...trackingConfig, ...req.body };
  res.json({ success: true, config: trackingConfig });
});

const upgradeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { userId } = req.body;

  const session = await Session.findOneAndUpdate(
    { sessionId },
    { userId, lastActivity: new Date() },
    { new: true }
  );

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  res.json({ success: true, session });
});

const getCheckoutDropoffs = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const issues = await Issue.find({ issueType: "stuck_checkout", resolved: false })
    .populate("userId", "firstname lastname email")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, dropoffs: issues, count: issues.length });
});

const getCartDropoffs = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const issues = await Issue.find({ issueType: "abandoned_cart", resolved: false })
    .populate("userId", "firstname lastname email")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({ success: true, dropoffs: issues, count: issues.length });
});

module.exports = {
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
  getCheckoutDropoffs,
  getCartDropoffs,
};