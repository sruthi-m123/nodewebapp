const Razorpay = require("razorpay");
const RazorpayHelper=require('../../helper/razorpay');
const crypto = require("crypto");

exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};


exports.verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
  
      return res.json({ success: true });
    } else {
      // Payment Failed ❌
      return res.json({ success: false });
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false });
  }
};

