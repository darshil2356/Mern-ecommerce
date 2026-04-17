const Razorpay = require("razorpay");
const crypto = require("crypto");
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const checkout = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400);
      throw new Error("Invalid amount for checkout");
    }

    const option = {
      amount: Math.round(amount * 100),
      currency: "INR",
    };
    const order = await instance.orders.create(option);
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    const err = new Error(error?.error?.description || error?.message || "Checkout failed");
    next(err);
  }
};

const paymentVerification = async (req, res, next) => {
  try {
    const { orderCreationId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const orderId = orderCreationId || razorpayOrderId;

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "sRO0YkBxvgMg0PvWHJN16Uf7")
      .update(`${orderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      res.status(400);
      throw new Error("Payment verification failed: invalid signature");
    }

    res.json({
      razorpayOrderId: orderId,
      razorpayPaymentId,
      razorpaySignature,
      method: "razorpay",
      status: "Paid",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  paymentVerification,
};
