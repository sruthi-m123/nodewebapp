const Razorpay = require("razorpay");
const RazorpayHelper=require('../../helper/razorpay');
const crypto = require("crypto");
const Order=require('../../models/orderSchema');
const Coupon = require('../../models/couponSchema');
const Product=require('../../models/productSchema');
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
  console.log("req.sesssion inside the verify payment ",req.session);
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature,  dborderId} = req.body;
console.log("req.body inside the verify payment razor",req.body)
console.log("re.session:",req.session);
if (!dborderId) {
      return res.status(400).json({ success: false, message: "Order ID required" });
    }
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpay_signature) {
     const order= await Order.findOneAndUpdate(
       {  orderId:  dborderId },
          {
          status: "paid",
          razorpayOrderId:razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        {new:true}
      );
console.log("order inside the controller :",order);
if (!order) { 
        return res.status(404).json({ success: false, message: "Order not found" });
      }
if(order.appliedCoupon){
  await Coupon.findByIdAndUpdate(order.appliedCoupon,{$inc:{usedCount:1}});
}
//stock reduction
await Product.bulkWrite(
        order.items.map(item => ({
          updateOne: {
            filter: { _id: item.productId },
            update: { $inc: { stock: -item.quantity } }
          }
        }))
      );

      console.log("order successfull")
  return res.json({ success: true });
    
     }
     } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false ,message:"Payment verifiation failed"});
  }
};
exports.markPaymentFailed=async(req,res)=>{
  try {
    console.log("entered mark payemnt failed")
    const {dborderId}=req.body;
    console.log("req.body",req.body);
const order = await Order.findOne({ orderId: dborderId });
    console.log("order inside the markpayment in raxorpay:",order);
    if(!order)return res.status(404).json({success:false,message:"Order not found"});
 if (order.status === "payment_pending" || order.status === "processing") {
      order.status = "payment_failed";

      if (order.appliedCoupon && order.appliedCoupon.couponId) {
        await Coupon.findByIdAndUpdate(order.appliedCoupon.couponId, {
          $inc: { usedCount: -1 }
        });
        order.appliedCoupon = null;
      }
      
    }

await order.save();
res.json({success:true,message:"Order marked as payment failed"});
   
}catch (error) {
    console.error(error);
    res.status(500).json({success:false,message:"Something went wrong "});
  }
}
