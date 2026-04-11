const Order = require("../models/orderModel");
const shiprocket = require("../services/shiprocket.service");

const STATUS_MAP = {
  "DELIVERED": "Delivered",
  "OUT FOR DELIVERY": "Out for Delivery",
  "SHIPPED": "Shipped",
  "PICKED UP": "Shipped",
};

const runTrackingSync = async () => {
  console.log("[TrackingCron] Starting sync...");
  try {
    const orders = await Order.find({
      shipmentId: { $ne: null },
      orderStatus: { $in: ["Shipped", "Out for Delivery"] },
    }).select("_id shipmentId orderStatus");

    console.log(`[TrackingCron] Checking ${orders.length} in-transit orders`);

    for (const order of orders) {
      try {
        const data = await shiprocket.getTracking(order.shipmentId);
        const srStatus = (
          data?.tracking_data?.shipment_track?.[0]?.current_status ||
          data?.tracking_data?.track_activities?.[0]?.activity ||
          ""
        ).toUpperCase();

        const newStatus = STATUS_MAP[srStatus];
        if (!newStatus || order.orderStatus === newStatus) continue;

        const update = {
          orderStatus: newStatus,
          $push: { statusHistory: { status: newStatus, date: new Date() } },
        };
        if (newStatus === "Delivered") update.deliveredAt = new Date();

        await Order.findByIdAndUpdate(order._id, update);
        console.log(`[TrackingCron] Order ${order._id} → ${newStatus}`);
      } catch (err) {
        console.error(`[TrackingCron] Failed for order ${order._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[TrackingCron] Fatal error:", err.message);
  }
};

const startTrackingCron = () => {
  const INTERVAL_MS = 30 * 60 * 1000;
  console.log("[TrackingCron] Scheduled — runs every 30 minutes");
  setInterval(runTrackingSync, INTERVAL_MS);
};

module.exports = { startTrackingCron };
