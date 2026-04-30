// ─── COMMON PUSH NOTIFICATION CONFIGURATION ───────────────────────────────────
// All notification templates are defined here dynamically.
// Use {variable} placeholders — they get replaced at send time.

const NOTIFICATION_EVENTS = {
  // ── Order Events ──────────────────────────────────────────────────────────────
  ORDER_PLACED: {
    event: "ORDER_PLACED",
    title: "🛍️ Order Placed Successfully!",
    body: "Your order #{orderId} for ₹{amount} has been placed. We'll start processing it soon.",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  ORDER_CONFIRMED: {
    event: "ORDER_CONFIRMED",
    title: "✅ Order Confirmed",
    body: "Great news! Your order #{orderId} has been confirmed and is being prepared.",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  ORDER_PACKED: {
    event: "ORDER_PACKED",
    title: "📦 Order Packed",
    body: "Your order #{orderId} is packed and ready for pickup by the courier.",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  ORDER_SHIPPED: {
    event: "ORDER_SHIPPED",
    title: "🚚 Order Shipped!",
    body: "Your order #{orderId} is on its way! Track it with {courierName}.",
    data: { screen: "order-details", orderId: "{orderId}", trackingUrl: "{trackingUrl}" },
  },
  OUT_FOR_DELIVERY: {
    event: "OUT_FOR_DELIVERY",
    title: "🏃 Out for Delivery",
    body: "Your order #{orderId} is out for delivery. Expect it today!",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  ORDER_DELIVERED: {
    event: "ORDER_DELIVERED",
    title: "🎉 Order Delivered!",
    body: "Your order #{orderId} has been delivered. Enjoy your purchase!",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  ORDER_CANCELLED: {
    event: "ORDER_CANCELLED",
    title: "❌ Order Cancelled",
    body: "Your order #{orderId} has been cancelled. Refund will be processed within 5-7 days.",
    data: { screen: "my-orders", orderId: "{orderId}" },
  },

  // ── Payment Events ────────────────────────────────────────────────────────────
  PAYMENT_SUCCESS: {
    event: "PAYMENT_SUCCESS",
    title: "💳 Payment Successful",
    body: "Payment of ₹{amount} received for order #{orderId}. Thank you!",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  PAYMENT_FAILED: {
    event: "PAYMENT_FAILED",
    title: "⚠️ Payment Failed",
    body: "Payment for order #{orderId} failed. Please retry or use a different method.",
    data: { screen: "checkout", orderId: "{orderId}" },
  },

  // ── Coin / Reward Events ──────────────────────────────────────────────────────
  COINS_EARNED: {
    event: "COINS_EARNED",
    title: "🪙 Coins Earned!",
    body: "You earned {coins} coins on your order #{orderId}. Total: {totalCoins} coins.",
    data: { screen: "profile", tab: "coins" },
  },
  COINS_REDEEMED: {
    event: "COINS_REDEEMED",
    title: "🎁 Coins Redeemed",
    body: "You redeemed {coins} coins (₹{amount} discount) on order #{orderId}.",
    data: { screen: "order-details", orderId: "{orderId}" },
  },
  REFERRAL_BONUS: {
    event: "REFERRAL_BONUS",
    title: "🤝 Referral Bonus!",
    body: "{referredName} made a purchase using your referral. You earned {coins} coins!",
    data: { screen: "profile", tab: "referrals" },
  },

  // ── Offer / Promo Events ──────────────────────────────────────────────────────
  NEW_OFFER: {
    event: "NEW_OFFER",
    title: "🔥 Special Offer for You!",
    body: "You have a {discount}% {offerType} discount on your next order. Shop now!",
    data: { screen: "store" },
  },
  SPIN_WIN: {
    event: "SPIN_WIN",
    title: "🎡 You Won!",
    body: "Congratulations! You won {prize} on the spin wheel. Use it on your next order.",
    data: { screen: "store" },
  },

  // ── Stock / Inquiry Events ─────────────────────────────────────────────────────
  PRODUCT_RESTOCKED: {
    event: "PRODUCT_RESTOCKED",
    title: "🎉 Back in Stock!",
    body: "{productName} is back in stock! Grab it before it sells out again.",
    data: { screen: "product", productId: "{productId}" },
  },

  // ── Account Events ────────────────────────────────────────────────────────────
  WELCOME: {
    event: "WELCOME",
    title: "👋 Welcome to {storeName}!",
    body: "Hi {name}! Your account is ready. Start shopping and earn coins on every order.",
    data: { screen: "home" },
  },
  PASSWORD_CHANGED: {
    event: "PASSWORD_CHANGED",
    title: "🔐 Password Changed",
    body: "Your account password was changed successfully. Contact us if this wasn't you.",
    data: { screen: "profile" },
  },
};

// Map order status strings → notification event keys
const ORDER_STATUS_EVENT_MAP = {
  Ordered: "ORDER_PLACED",
  Confirmed: "ORDER_CONFIRMED",
  Packed: "ORDER_PACKED",
  Shipped: "ORDER_SHIPPED",
  "Out for Delivery": "OUT_FOR_DELIVERY",
  Delivered: "ORDER_DELIVERED",
  Cancelled: "ORDER_CANCELLED",
};

/**
 * Build a notification payload by replacing {variable} placeholders.
 * @param {string} eventKey - Key from NOTIFICATION_EVENTS
 * @param {Object} vars - Variables to inject e.g. { orderId, amount, name }
 * @returns {{ title, body, data }}
 */
const buildNotification = (eventKey, vars = {}) => {
  const template = NOTIFICATION_EVENTS[eventKey];
  if (!template) throw new Error(`Unknown notification event: ${eventKey}`);

  const replace = (str) =>
    str.replace(/\{(\w+)\}/g, (_, key) => (vars[key] !== undefined ? vars[key] : `{${key}}`));

  const data = {};
  Object.entries(template.data || {}).forEach(([k, v]) => {
    data[k] = replace(String(v));
  });
  // Also inject all vars into data so service worker can interpolate if needed
  Object.entries(vars).forEach(([k, v]) => {
    if (data[k] === undefined) data[k] = String(v);
  });
  data.eventKey = eventKey;

  return {
    title: replace(template.title),
    body: replace(template.body),
    data,
  };
};

module.exports = { NOTIFICATION_EVENTS, ORDER_STATUS_EVENT_MAP, buildNotification };
