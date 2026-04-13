// ─── FRONTEND COMMON NOTIFICATION CONFIGURATION ──────────────────────────────
// Mirrors Backend/config/notificationConfig.js
// Used for in-app toast/banner display when app is in foreground.

export const NOTIFICATION_EVENTS = {
  ORDER_PLACED:      { title: "🛍️ Order Placed!", body: "Order #{orderId} placed for ₹{amount}." },
  ORDER_CONFIRMED:   { title: "✅ Order Confirmed", body: "Order #{orderId} confirmed and being prepared." },
  ORDER_PACKED:      { title: "📦 Order Packed", body: "Order #{orderId} is packed and ready for dispatch." },
  ORDER_SHIPPED:     { title: "🚚 Order Shipped!", body: "Order #{orderId} shipped via {courierName}." },
  OUT_FOR_DELIVERY:  { title: "🏃 Out for Delivery", body: "Order #{orderId} is out for delivery today!" },
  ORDER_DELIVERED:   { title: "🎉 Order Delivered!", body: "Order #{orderId} delivered. Enjoy your purchase!" },
  ORDER_CANCELLED:   { title: "❌ Order Cancelled", body: "Order #{orderId} has been cancelled." },
  PAYMENT_SUCCESS:   { title: "💳 Payment Successful", body: "₹{amount} received for order #{orderId}." },
  PAYMENT_FAILED:    { title: "⚠️ Payment Failed", body: "Payment for order #{orderId} failed. Please retry." },
  COINS_EARNED:      { title: "🪙 Coins Earned!", body: "You earned {coins} coins on order #{orderId}." },
  COINS_REDEEMED:    { title: "🎁 Coins Redeemed", body: "Redeemed {coins} coins (₹{amount}) on order #{orderId}." },
  REFERRAL_BONUS:    { title: "🤝 Referral Bonus!", body: "{referredName} purchased using your referral. +{coins} coins!" },
  NEW_OFFER:         { title: "🔥 Special Offer!", body: "{discount}% {offerType} discount on your next order." },
  SPIN_WIN:          { title: "🎡 You Won!", body: "You won {prize} on the spin wheel!" },
  WELCOME:           { title: "👋 Welcome!", body: "Hi {name}! Welcome to {storeName}. Start shopping!" },
  PASSWORD_CHANGED:  { title: "🔐 Password Changed", body: "Your password was changed successfully." },
};

/**
 * Replace {variable} placeholders in a string.
 */
export const interpolate = (str = "", vars = {}) =>
  str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));

/**
 * Build a display-ready notification from an FCM payload.
 * @param {Object} payload - FCM message payload (notification + data)
 * @returns {{ title, body }}
 */
export const buildForegroundNotification = (payload) => {
  const { notification, data } = payload;
  const eventKey = data?.eventKey;
  const template = NOTIFICATION_EVENTS[eventKey];

  if (template) {
    return {
      title: interpolate(template.title, data),
      body: interpolate(template.body, data),
    };
  }

  // Fallback to raw FCM notification fields
  return {
    title: notification?.title || "Notification",
    body: notification?.body || "",
  };
};
