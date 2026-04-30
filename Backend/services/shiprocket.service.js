const axios = require("axios");
const validateAddress = require("../utils/validateAddress");

const BASE = "https://apiv2.shiprocket.in/v1/external";

// ── In-memory token cache ──────────────────────────────────────────────────
let _token = null;
let _tokenExpiry = 0;

const getToken = async () => {
  if (_token && Date.now() < _tokenExpiry) return _token;

  try {
    const { data } = await axios.post(`${BASE}/auth/login`, {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    });

    if (!data.token) {
      throw new Error("Login succeeded but no token returned: " + JSON.stringify(data));
    }

    _token = data.token;
    _tokenExpiry = Date.now() + 23.5 * 60 * 60 * 1000;
    console.log("[Shiprocket] Token refreshed successfully");
    return _token;
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("[Shiprocket] LOGIN FAILED:", JSON.stringify(detail));
    throw new Error("Shiprocket login failed: " + JSON.stringify(detail));
  }
};

// ── Axios helper — logs full error body on failure ─────────────────────────
const api = async (method, path, body = null, retry = true) => {
  const token = await getToken();
  try {
    const res = await axios({
      method,
      url: `${BASE}${path}`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: body,
    });
    return res.data;
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data;

    // Log the FULL Shiprocket error response so we can see exactly what's wrong
    console.error(
      `[Shiprocket] ${method.toUpperCase()} ${path} → HTTP ${status}`,
      "\nRequest body:", JSON.stringify(body, null, 2),
      "\nResponse:", JSON.stringify(detail, null, 2)
    );

    if (status === 401 && retry) {
      _token = null;
      return api(method, path, body, false);
    }

    const msg =
      detail?.message ||
      (Array.isArray(detail?.errors) ? detail.errors.join(", ") : null) ||
      err.message;

    throw new Error(`Shiprocket ${status} on ${path}: ${msg}`);
  }
};

// ── Build a unique order_id that won't collide on retry ───────────────────
// Shiprocket rejects duplicate order_ids with 403.
// We suffix with a short timestamp so retries always get a fresh id.
const buildOrderId = (mongoId) => {
  const suffix = Date.now().toString(36).toUpperCase(); // e.g. "LX3K9"
  return `${mongoId.toString().slice(-10).toUpperCase()}-${suffix}`;
};

// ── Create order in Shiprocket ─────────────────────────────────────────────
const createOrder = async (order, user) => {
  const shipping = order.shippingInfo || {};

  // All address fields come from shippingInfo — user is only fallback for phone/name
  const firstname = (shipping.firstname || user?.firstname || "").trim();
  // address = House No./Flat, other = Street/Area/Colony
  // Combine both into billing_address so Shiprocket gets the full address in one line
  const houseNo   = (shipping.address || "").trim();
  const streetArea = (shipping.other  || "").trim();
  const address   = streetArea ? `${houseNo}, ${streetArea}` : houseNo;
  const city      = (shipping.city     || "").trim();
  const state     = (shipping.state    || "").trim();

  // Sanitise phone — Shiprocket requires exactly 10 digits
  // shipping.phone is what customer filled at checkout — always prefer it
  const rawPhone = String(shipping.phone || user?.mobile || "9999999999").replace(/\D/g, "");
  const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone.padEnd(10, "0");

  // Sanitise pincode — must be 6 digits
  const rawPin = String(shipping.pincode || "000000").replace(/\D/g, "");
  const pincode = rawPin.length === 6 ? rawPin : rawPin.padStart(6, "0").slice(-6);

  // Validate address quality before sending to Shiprocket
  const { valid, errors, warnings } = validateAddress({ firstname, address, other: streetArea, city, state, pincode, phone });

  warnings.forEach((w) => console.warn(`[Shiprocket] Address warning for order ${order._id}: ${w}`));

  if (!valid) {
    console.warn(`[Shiprocket] Address issues for order ${order._id}: ${errors.join("; ")} — proceeding anyway`);
  }

  const productSubTotal = order.orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const gst = order.gstBreakdown || {};
  // Total GST amount stored on the order
  const totalTax = gst.taxIncluded
    ? (gst.cgst || 0) + (gst.sgst || 0) + (gst.igst || 0)   // already extracted from price
    : (gst.cgst || 0) + (gst.sgst || 0) + (gst.igst || 0);  // added on top

  const orderItems = order.orderItems.map((item, idx) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    // Distribute total GST proportionally across items
    const itemTax = productSubTotal > 0
      ? Math.round((itemTotal / productSubTotal) * totalTax * 100) / 100
      : 0;
    return {
      name: (item.product?.title || item.bundleTitle || `Item-${idx + 1}`).slice(0, 100),
      sku: (item.product?._id?.toString() || item.bundleId?.toString() || `SKU-${idx}`).slice(0, 50),
      units: item.quantity || 1,
      selling_price: String(item.price || 0),
      discount: "0",
      tax: String(itemTax),
      hsn: item.hsnCode || item.product?.hsnCode || 0,
    };
  });

  const payload = {
    order_id: buildOrderId(order._id),
    order_date: new Date(order.createdAt).toISOString().replace("T", " ").slice(0, 19),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",

    // Billing details - use shipping info with proper validation
    billing_customer_name: firstname || "Customer",
    billing_last_name: (shipping.lastname || user?.lastname || "").trim(),
    billing_address: address.slice(0, 200),
    billing_address_2: "",
    billing_city: city,
    billing_pincode: pincode,
    billing_state: state,
    billing_country: "India",
    billing_email: user?.email || shipping.email || "customer@example.com",
    billing_phone: phone,
    billing_isd_code: "91",

    shipping_is_billing: 1,

    order_items: orderItems,

    payment_method:
      order.paymentInfo?.razorpayPaymentId === "OFFLINE" ? "COD" : "Prepaid",

    // sub_total = product value only (Shiprocket adds shipping_charges on top)
    // totalPriceAfterDiscount includes shipping, so subtract it back out
    shipping_charges: gst.shippingCharge || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: order.discountAmount || 0,
    sub_total: Math.max(
      0,
      (order.totalPriceAfterDiscount || order.totalPrice || 0) - (gst.shippingCharge || 0)
    ),

    // GST breakdown for Shiprocket invoice
    ...(gst.gstType === "CGST_SGST" && {
      cgst: gst.cgstRate || 0,
      sgst: gst.sgstRate || 0,
    }),
    ...(gst.gstType === "IGST" && {
      igst: gst.igstRate || 0,
    }),

    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  // Only send channel_id if explicitly configured (some plans require it)
  if (process.env.SHIPROCKET_CHANNEL_ID) {
    payload.channel_id = process.env.SHIPROCKET_CHANNEL_ID;
  }

  console.log("[Shiprocket] Creating order with payload:", JSON.stringify(payload, null, 2));

  const data = await api("post", "/orders/create/adhoc", payload);
  console.log("[Shiprocket] Order created → order_id:", data.order_id, "| shipment_id:", data.shipment_id);
  return data;
};

// ── Get best available courier for a shipment ────────────────────────────
// Shiprocket requires a valid courier_id before AWB can be assigned.
// This fetches serviceability and picks the cheapest available courier.
const getBestCourierId = async (shipmentId) => {
  try {
    const data = await api("get", `/courier/serviceability/?shipment_id=${shipmentId}`);
    const couriers = data?.data?.available_courier_companies || [];

    if (couriers.length === 0) {
      console.warn("[Shiprocket] No couriers available for shipment:", shipmentId);
      return null;
    }

    // Sort by rate ascending, pick cheapest
    couriers.sort((a, b) => (a.rate || 0) - (b.rate || 0));
    const best = couriers[0];
    console.log(
      `[Shiprocket] Best courier: ${best.courier_name} | Rate: ₹${best.rate} | ID: ${best.courier_company_id}`
    );
    return best.courier_company_id;
  } catch (err) {
    console.warn("[Shiprocket] Serviceability check failed:", err.message);
    return null;
  }
};

// ── Generate AWB ───────────────────────────────────────────────────────────
const generateAWB = async (shipmentId) => {
  // Use env courier_id if set, otherwise auto-select best available
  let courierId = process.env.SHIPROCKET_COURIER_ID || null;

  if (!courierId) {
    courierId = await getBestCourierId(shipmentId);
  }

  const body = { shipment_id: String(shipmentId) };
  if (courierId) body.courier_id = String(courierId);

  const data = await api("post", "/courier/assign/awb", body);

  const awb = data?.response?.data?.awb_code;
  if (!awb) {
    console.warn("[Shiprocket] AWB assign response:", JSON.stringify(data));
    throw new Error("AWB not assigned. Response: " + JSON.stringify(data));
  }

  console.log("[Shiprocket] AWB assigned:", awb);
  return data;
};

// ── Request pickup — only after AWB is confirmed ───────────────────────────
const requestPickup = async (shipmentId) => {
  // Small delay to let Shiprocket register the AWB before pickup request
  await new Promise((r) => setTimeout(r, 2000));

  const data = await api("post", "/courier/generate/pickup", {
    shipment_id: [String(shipmentId)],
  });
  console.log("[Shiprocket] Pickup requested for shipment:", shipmentId);
  return data;
};

// ── Full flow: create → serviceability → AWB → pickup ─────────────────────
const createShipment = async (order, user) => {
  const orderData = await createOrder(order, user);
  const shipmentId = orderData.shipment_id;

  if (!shipmentId) {
    throw new Error(
      "Shiprocket returned no shipment_id. Full response: " + JSON.stringify(orderData)
    );
  }

  // AWB assignment — required before pickup
  let awbData = null;
  let awb = "";
  let courier = "";

  try {
    awbData = await generateAWB(shipmentId);
    awb = awbData?.response?.data?.awb_code || "";
    courier = awbData?.response?.data?.courier_name || "";
  } catch (awbErr) {
    // AWB failed — order is still created in Shiprocket, save shipmentId
    // Admin can manually assign AWB from Shiprocket dashboard
    console.error("[Shiprocket] AWB assignment failed (non-fatal):", awbErr.message);
  }

  // Pickup — only attempt if AWB was successfully assigned
  if (awb) {
    try {
      await requestPickup(shipmentId);
    } catch (pickupErr) {
      console.warn("[Shiprocket] Pickup request failed (non-fatal):", pickupErr.message);
    }
  } else {
    console.warn("[Shiprocket] Skipping pickup request — no AWB assigned yet for shipment:", shipmentId);
  }

  const trackingUrl = awb
    ? `https://shiprocket.co/tracking/${awb}`
    : `https://shiprocket.co/tracking/${shipmentId}`;

  return {
    shipmentId: String(shipmentId),
    trackingId: awb,
    trackingUrl,
    courierName: courier,
  };
};

// ── Fetch tracking ─────────────────────────────────────────────────────────
const getTracking = async (shipmentId) => {
  return api("get", `/courier/track/shipment/${shipmentId}`);
};

// ── Test login (call this from a route to verify credentials) ──────────────
const testConnection = async () => {
  _token = null; // force fresh login
  const token = await getToken();
  return { ok: true, tokenPreview: token.slice(0, 20) + "..." };
};

module.exports = { createShipment, getTracking, getToken, testConnection };
