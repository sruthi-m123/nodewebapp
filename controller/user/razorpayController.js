const Razorpay = require("razorpay");
const RazorpayHelper=require('../../helper/razorpay');
const crypto = require("crypto");
const Order=require('../../models/orderSchema');
exports.createOrder = async (req, res) => {
  try {
    console.log("created order razorpay controller .")
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
console.log("razorpay",razorpay);
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};



exports.verifyPayment = async(req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
console.log("req.body inside the verify payment razor",req.body)
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
      await Order.findOneAndUpdate(
       { razorpayOrderId: razorpay_order_id },
          {
          status: "paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        }
      );
  return res.json({ success: true });
    } else {
      console.log("error happened");
      return res.json({ success: false });
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false });
  }
};

