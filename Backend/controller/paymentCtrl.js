const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: "rzp_test_HSSeDI22muUrLR",
  key_secret: "sRO0YkBxvgMg0PvWHJN16Uf7",
});

const checkout = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      res.status(400);
      throw new Error("Invalid amount for checkout");
    }

    const option = {
      amount: amount * 100,
      currency: "INR",
    };
    const order = await instance.orders.create(option);
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const paymentVerification = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId } = req.body;
    res.json({
      razorpayOrderId,
      razorpayPaymentId,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkout,
  paymentVerification,
};
