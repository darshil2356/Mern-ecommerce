const express = require("express");
const { shiprocketWebhook, bulkCreateShipment } = require("../controller/shiprocketCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { testConnection, getToken } = require("../services/shiprocket.service");
const axios = require("axios");

const router = express.Router();

// ── Webhook (no auth — Shiprocket calls this) ──────────────────────────────
router.post("/webhooks/shiprocket", shiprocketWebhook);

// ── Admin fallback bulk shipment ───────────────────────────────────────────
router.put("/orders/bulk-create-shipment", authMiddleware, isAdmin, bulkCreateShipment);

// ── Fetch pickup address for invoice ─────────────────────────────────────
// GET /api/shiprocket/pickup-address  (admin only)
router.get("/shiprocket/pickup-address", authMiddleware, isAdmin, async (req, res) => {
  try {
    const token = await getToken();
    const { data } = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/settings/company/pickup",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const locations = data.data?.shipping_address || [];
    const pickupName = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
    const match = locations.find((l) => l.pickup_location === pickupName) || locations[0];
    if (!match) return res.json({ address: null });
    res.json({
      address: {
        name: match.pickup_location,
        address: match.address,
        address2: match.address_2 || "",
        city: match.city,
        state: match.state,
        pincode: match.pin_code,
        phone: match.phone,
        email: match.email || "",
      },
    });
  } catch (err) {
    res.status(500).json({ address: null, error: err.message });
  }
});

// ── Bulk status update ─────────────────────────────────────────────────────
// PUT /api/orders/bulk-update-status  (admin only)
router.put("/orders/bulk-update-status", authMiddleware, isAdmin, async (req, res) => {
  const { orderIds, status } = req.body;
  const Order = require("../models/orderModel");
  const allowedStatuses = ["Ordered", "Processed", "Packed"];
  if (!Array.isArray(orderIds) || !orderIds.length || !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid request" });
  }
  const results = [];
  for (const orderId of orderIds) {
    try {
      const order = await Order.findById(orderId);
      if (!order) { results.push({ orderId, success: false, error: "Not found" }); continue; }
      const locked = ["Shipped", "Out for Delivery", "Delivered", "Cancelled"];
      if (locked.includes(order.orderStatus)) { results.push({ orderId, success: false, error: "Locked" }); continue; }
      order.orderStatus = status;
      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({ status, date: new Date() });
      await order.save();
      // Auto-trigger Shiprocket when Packed
      if (status === "Packed" && !order.shipmentId) {
        setImmediate(async () => {
          try {
            const shiprocket = require("../services/shiprocket.service");
            const populatedOrder = await Order.findById(orderId).populate("user").populate("orderItems.product");
            const result = await shiprocket.createShipment(populatedOrder, populatedOrder.user);
            await Order.findByIdAndUpdate(orderId, {
              shippingProvider: "Shiprocket", shipmentId: result.shipmentId,
              trackingId: result.trackingId, trackingUrl: result.trackingUrl,
              courierName: result.courierName, orderStatus: "Shipped", shippedAt: new Date(),
              $push: { statusHistory: { status: "Shipped", date: new Date() } },
            });
          } catch (e) { console.error("[Bulk Packed→Shiprocket]", e.message); }
        });
      }
      results.push({ orderId, success: true });
    } catch (err) {
      results.push({ orderId, success: false, error: err.message });
    }
  }
  res.json({ results });
});

// ── Diagnostic: test login + fetch pickup locations ───────────────────────
// GET /api/shiprocket/diagnose  (admin only)
// Call this from browser/Postman to see exactly what's wrong
router.get("/shiprocket/diagnose", authMiddleware, isAdmin, async (req, res) => {
  const result = {};
  try {
    // Step 1: test login
    const conn = await testConnection();
    result.login = conn;

    // Step 2: fetch pickup locations from Shiprocket
    const token = await getToken();
    const { data } = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/settings/company/pickup",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    result.pickupLocations = (data.data?.shipping_address || []).map((loc) => ({
      id: loc.id,
      name: loc.pickup_location,
      city: loc.city,
      pincode: loc.pin_code,
      status: loc.status,
    }));

    result.envPickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
    result.match = result.pickupLocations.some(
      (l) => l.name === result.envPickupLocation
    );

    if (!result.match) {
      result.warning =
        `SHIPROCKET_PICKUP_LOCATION="${result.envPickupLocation}" does NOT match any pickup location. ` +
        `Available names: ${result.pickupLocations.map((l) => l.name).join(", ")}`;
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message, partial: result });
  }
});

module.exports = router;
