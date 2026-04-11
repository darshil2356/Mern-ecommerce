const asyncHandler = require("express-async-handler");
const Order = require("../models/orderModel");
const shiprocket = require("../services/shiprocket.service");

// ── Webhook: POST /api/webhooks/shiprocket ─────────────────────────────────
// Shiprocket sends status updates here automatically
const shiprocketWebhook = asyncHandler(async (req, res) => {
  const payload = req.body;
  console.log("[Shiprocket Webhook] Received:", JSON.stringify(payload));

  const awb = payload.awb || payload.awb_code;
  const srStatus = (payload.current_status || payload.status || "").toUpperCase();

  if (!awb) return res.status(200).json({ ok: true }); // ignore malformed

  const order = await Order.findOne({ trackingId: awb });
  if (!order) {
    console.warn("[Shiprocket Webhook] No order found for AWB:", awb);
    return res.status(200).json({ ok: true });
  }

  const statusMap = {
    SHIPPED: "Shipped",
    "PICKED UP": "Shipped",
    "OUT FOR DELIVERY": "Out for Delivery",
    DELIVERED: "Delivered",
  };

  const newStatus = statusMap[srStatus];
  if (!newStatus || order.orderStatus === newStatus) {
    return res.status(200).json({ ok: true });
  }

  const update = {
    orderStatus: newStatus,
    $push: { statusHistory: { status: newStatus, date: new Date() } },
  };

  if (newStatus === "Shipped") update.shippedAt = new Date();
  if (newStatus === "Delivered") update.deliveredAt = new Date();

  await Order.findByIdAndUpdate(order._id, update);
  console.log(`[Shiprocket Webhook] Order ${order._id} → ${newStatus}`);

  res.status(200).json({ ok: true });
});

// ── Bulk fallback: PUT /api/orders/bulk-create-shipment ────────────────────
// Admin can manually trigger shipment for orders that missed auto-trigger
const bulkCreateShipment = asyncHandler(async (req, res) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400);
    throw new Error("orderIds array is required");
  }

  const results = [];

  for (const orderId of orderIds) {
    try {
      const order = await Order.findById(orderId)
        .populate("user")
        .populate("orderItems.product");

      if (!order) {
        results.push({ orderId, success: false, error: "Order not found" });
        continue;
      }

      if (order.shipmentId) {
        results.push({ orderId, success: false, error: "Shipment already exists" });
        continue;
      }

      const result = await shiprocket.createShipment(order, order.user);

      await Order.findByIdAndUpdate(orderId, {
        shippingProvider: "Shiprocket",
        shipmentId: result.shipmentId,
        trackingId: result.trackingId,
        trackingUrl: result.trackingUrl,
        courierName: result.courierName,
        orderStatus: "Shipped",
        shippedAt: new Date(),
        $push: { statusHistory: { status: "Shipped", date: new Date() } },
      });

      results.push({ orderId, success: true, ...result });
    } catch (err) {
      console.error(`[Bulk Shipment] Failed for ${orderId}:`, err.message);
      results.push({ orderId, success: false, error: err.message });
    }
  }

  res.json({ results });
});

module.exports = { shiprocketWebhook, bulkCreateShipment };
