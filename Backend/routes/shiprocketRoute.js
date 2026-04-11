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
