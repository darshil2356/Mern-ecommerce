const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const { initFirebase } = require("../config/firebaseAdmin");
const { buildNotification } = require("../config/notificationConfig");

/**
 * Send a push notification to one or more FCM tokens.
 * @param {string|string[]} tokens - FCM token(s)
 * @param {string} eventKey - Key from NOTIFICATION_EVENTS
 * @param {Object} vars - Dynamic variables for the template
 */
const sendPushNotification = async (tokens, eventKey, vars = {}) => {
  const firebaseAdmin = initFirebase();
  if (!firebaseAdmin) return; // FCM not configured

  const tokenList = Array.isArray(tokens) ? tokens.filter(Boolean) : [tokens].filter(Boolean);
  if (tokenList.length === 0) return;

  const { title, body, data } = buildNotification(eventKey, vars);

  const message = {
    notification: { title, body },
    data: { ...data, eventKey },
    android: { notification: { sound: "default", priority: "high" } },
    apns: { payload: { aps: { sound: "default", badge: 1 } } },
    webpush: {
      notification: { title, body, icon: "/logo192.png", badge: "/logo192.png" },
      fcm_options: { link: data.screen ? `/${data.screen}` : "/" },
    },
  };

  try {
    if (tokenList.length === 1) {
      await firebaseAdmin.messaging().send({ ...message, token: tokenList[0] });
    } else {
      await firebaseAdmin.messaging().sendEachForMulticast({ ...message, tokens: tokenList });
    }
    console.log(`[FCM] Sent "${eventKey}" to ${tokenList.length} device(s)`);
  } catch (err) {
    console.error("[FCM] Send error:", err.message);
  }
};

/**
 * Send notification to a user by their userId.
 */
const notifyUser = async (userId, eventKey, vars = {}) => {
  const user = await User.findById(userId).select("fcmTokens");
  if (!user || !user.fcmTokens?.length) return;
  await sendPushNotification(user.fcmTokens, eventKey, vars);
};

// ── Route Handlers ─────────────────────────────────────────────────────────────

// POST /api/notifications/subscribe  — save FCM token for logged-in user
const subscribeFCM = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("FCM token is required");
  }

  await User.findByIdAndUpdate(
    _id,
    { $addToSet: { fcmTokens: token } }, // avoid duplicates
    { new: true }
  );

  res.json({ success: true, message: "FCM token registered" });
});

// DELETE /api/notifications/unsubscribe  — remove FCM token on logout
const unsubscribeFCM = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { token } = req.body;

  await User.findByIdAndUpdate(_id, { $pull: { fcmTokens: token } });
  res.json({ success: true, message: "FCM token removed" });
});

// POST /api/notifications/send  — admin: send notification to a user
const sendNotificationToUser = asyncHandler(async (req, res) => {
  const { userId, eventKey, vars } = req.body;

  if (!userId || !eventKey) {
    res.status(400);
    throw new Error("userId and eventKey are required");
  }

  await notifyUser(userId, eventKey, vars || {});
  res.json({ success: true, message: `Notification "${eventKey}" sent` });
});

// POST /api/notifications/broadcast  — admin: send to all users
const broadcastNotification = asyncHandler(async (req, res) => {
  const { eventKey, vars } = req.body;

  if (!eventKey) {
    res.status(400);
    throw new Error("eventKey is required");
  }

  const users = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }).select("fcmTokens");
  const allTokens = users.flatMap((u) => u.fcmTokens || []);

  await sendPushNotification(allTokens, eventKey, vars || {});
  res.json({ success: true, message: `Broadcast "${eventKey}" sent to ${allTokens.length} device(s)` });
});

module.exports = {
  subscribeFCM,
  unsubscribeFCM,
  sendNotificationToUser,
  broadcastNotification,
  sendPushNotification,
  notifyUser,
};
