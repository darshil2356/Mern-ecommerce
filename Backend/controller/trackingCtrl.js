const asyncHandler = require("express-async-handler");
const Session = require("../models/sessionModel");
const Event = require("../models/eventModel");
const Issue = require("../models/issueModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const TrackingConfig = require("../models/trackingConfigModel");
const { v4: uuidv4 } = require("uuid");

// Helper: get config (creates default if not exists)
const getConfig = async () => {
  let config = await TrackingConfig.findOne();
  if (!config) config = await TrackingConfig.create({ isEnabled: true });
  return config;
};

const getRequestIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
};

const getRequestUserAgent = (req) => req.headers["user-agent"] || "unknown";

// Checkout drop-offs: logged-in users who started checkout but never completed
const getCheckoutDropoffs = asyncHandler(async (req, res) => {
  const { period = "24h" } = req.query;
  const periodMap = { "1h": 1, "24h": 24, "7d": 168, "30d": 720 };
  const startDate = new Date(Date.now() - (periodMap[period] || 24) * 60 * 60 * 1000);

  const Cart = require("../models/cartModel");
  const Order = require("../models/orderModel");

  // All users with items in cart
  const cartItems = await Cart.find({})
    .populate("userId", "firstname lastname email mobile")
    .populate("productId", "title")
    .lean();

  const userCartMap = {};
  for (const item of cartItems) {
    if (!item.userId) continue;
    const uid = item.userId._id.toString();
    if (!userCartMap[uid]) {
      userCartMap[uid] = { user: item.userId, items: [], totalValue: 0 };
    }
    const name = item.isBundle ? item.bundleTitle : (item.productId?.title || "Unknown");
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    userCartMap[uid].items.push({ productName: name, quantity: qty, price });
    userCartMap[uid].totalValue += price * qty;
  }

  // Users with non-cancelled order — exclude
  const orderedUserIds = new Set(
    (await Order.find({ orderStatus: { $nin: ["Cancelled"] } }).select("user").lean())
      .map(o => o.user?.toString()).filter(Boolean)
  );

  const dropoffs = [];
  for (const [uid, data] of Object.entries(userCartMap)) {
    if (orderedUserIds.has(uid)) continue;

    // Get user's most recent event
    const lastEvent = await Event.findOne({ userId: uid }).sort({ timestamp: -1 }).lean();
    if (!lastEvent) continue;

    // Only checkout dropoff if their LAST page was /checkout
    const lastPage = lastEvent.page || "";
    if (!lastPage.includes("/checkout")) continue;

    // Must have visited checkout within the selected period
    const checkoutEvent = await Event.findOne({
      userId: uid,
      eventType: "checkout_started",
      timestamp: { $gte: startDate },
    }).sort({ timestamp: -1 }).lean();
    if (!checkoutEvent) continue;

    dropoffs.push({
      userId: data.user,
      items: data.items,
      totalValue: data.totalValue,
      itemCount: data.items.length,
      droppedAt: checkoutEvent.timestamp,
    });
  }

  res.json({ success: true, dropoffs, count: dropoffs.length });
});

// Cart drop-offs: user has items in cart and their last page was NOT /checkout
const getCartDropoffs = asyncHandler(async (req, res) => {
  const { period = "24h" } = req.query;
  const periodMap = { "1h": 1, "24h": 24, "7d": 168, "30d": 720 };
  const startDate = new Date(Date.now() - (periodMap[period] || 24) * 60 * 60 * 1000);

  const Cart = require("../models/cartModel");
  const Order = require("../models/orderModel");

  const cartItems = await Cart.find({})
    .populate("userId", "firstname lastname email mobile")
    .populate("productId", "title")
    .lean();

  const userCartMap = {};
  for (const item of cartItems) {
    if (!item.userId) continue;
    const uid = item.userId._id.toString();
    if (!userCartMap[uid]) {
      userCartMap[uid] = { user: item.userId, items: [], totalValue: 0, lastAdded: item.createdAt };
    }
    const name = item.isBundle ? item.bundleTitle : (item.productId?.title || "Unknown");
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    userCartMap[uid].items.push({ productName: name, quantity: qty, price });
    userCartMap[uid].totalValue += price * qty;
    if (item.createdAt > userCartMap[uid].lastAdded) userCartMap[uid].lastAdded = item.createdAt;
  }

  // Users with non-cancelled order — exclude
  const orderedUserIds = new Set(
    (await Order.find({ orderStatus: { $nin: ["Cancelled"] } }).select("user").lean())
      .map(o => o.user?.toString()).filter(Boolean)
  );

  const dropoffs = [];
  for (const [uid, data] of Object.entries(userCartMap)) {
    if (orderedUserIds.has(uid)) continue;

    // Get user's most recent event
    const lastEvent = await Event.findOne({ userId: uid }).sort({ timestamp: -1 }).lean();

    // If last page was /checkout, they belong in checkout dropoffs
    if (lastEvent && lastEvent.page?.includes("/checkout")) continue;

    dropoffs.push({
      userId: data.user,
      items: data.items,
      totalValue: data.totalValue,
      itemCount: data.items.length,
      lastAddedAt: data.lastAdded,
    });
  }

  res.json({ success: true, dropoffs, count: dropoffs.length });
});

// Get tracking config (public)
const getTrackingConfig = asyncHandler(async (req, res) => {
  const config = await getConfig();
  res.json({ success: true, isEnabled: config.isEnabled });
});

// Update tracking config (admin only)
const updateTrackingConfig = asyncHandler(async (req, res) => {
  const { isEnabled } = req.body;
  const config = await TrackingConfig.findOneAndUpdate(
    {},
    { isEnabled, updatedBy: req.user?._id },
    { upsert: true, new: true }
  );
  // Broadcast to all connected clients via socket
  const io = req.app.get("io");
  if (io) io.emit("tracking_config_changed", { isEnabled });
  res.json({ success: true, isEnabled: config.isEnabled });
});

// Create or update session
const createSession = asyncHandler(async (req, res) => {
  const config = await getConfig();
  if (!config.isEnabled) {
    return res.json({ success: false, disabled: true });
  }
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
    // Update existing session only if it actually exists
    session = await Session.findOneAndUpdate(
      { sessionId },
      {
        lastActivity: new Date(),
        currentPage,
        isActive: true,
        ...(userId && { userId }),
      },
      { new: true }
    );

    // If session not found (e.g. DB was cleared), create a fresh one
    if (!session) {
      session = await Session.create({
        userId,
        guestId: guestId || uuidv4(),
        sessionId,
        ipAddress: resolvedIp,
        userAgent: resolvedUserAgent,
        device,
        location,
        currentPage,
      });
    }
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
  const config = await getConfig();
  if (!config.isEnabled) {
    return res.json({ success: false, disabled: true });
  }
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

  if (!sessionId) {
    return res.status(400).json({ success: false, message: "sessionId is required. Call /api/tracking/session first." });
  }

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

  // Deduplicate: keep only the most recent session per userId (or per guestId for guests)
  const seen = new Set();
  const uniqueSessions = sessions.filter((s) => {
    const key = s.userId ? s.userId._id.toString() : s.guestId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  res.json({
    success: true,
    sessions: uniqueSessions,
    count: uniqueSessions.length,
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
    .populate("userId", "firstname lastname email")
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

// Upgrade guest session to logged-in user
const upgradeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  const session = await Session.findOneAndUpdate(
    { sessionId },
    { userId, lastActivity: new Date() },
    { new: true }
  );

  if (!session) {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  // Also update all events from this session that have no userId
  await Event.updateMany(
    { sessionId, userId: null },
    { userId }
  );

  // Also update all issues from this session that have no userId
  await Issue.updateMany(
    { sessionId, userId: null },
    { userId }
  );

  res.json({ success: true, session });
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

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const activeSessions = await Session.find({
    isActive: true,
    lastActivity: { $gte: fiveMinutesAgo },
  }, "userId guestId");

  // Deduplicate same as getActiveSessions
  const seenUsers = new Set();
  activeSessions.forEach((s) => {
    const key = s.userId ? s.userId.toString() : s.guestId;
    seenUsers.add(key);
  });
  const activeUsers = seenUsers.size;

  const [
    totalSessions,
    totalEvents,
    issuesCount,
    topPages,
    eventTypes,
  ] = await Promise.all([
    Session.countDocuments({ createdAt: { $gte: startDate } }),
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