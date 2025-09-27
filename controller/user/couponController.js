const User=require('../../models/userSchema');
const Coupon=require('../../models/couponSchema');
const Cart=require('../../models/cartSchema');
const{calculateOrder}=require('../../helper/calculateTotal');
const Order=require('../../models/orderSchema');
// const { default: items } = require('razorpay/dist/types/items');

exports.applyCouponByCode = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user.id;

    // Find coupon
    const coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
      validTill: { $gte: new Date() }
    });
    if (!coupon) {
      return res.json({ success: false, message: 'Invalid or expired coupon code' });
    }

    // Get cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    // Prepare cart items for calculation
    const cartItems = cart.items
      .filter(item => item.productId && item.productId.isActive)
      .map(item => ({
        id: item.productId._id,
        name: item.productId.productName,
        price: item.productId.discountedPrice || item.productId.price,
        originalPrice: item.productId.price,
        discountedPrice: item.productId.discountedPrice || null,
        quantity: item.quantity
      }));

    // Check minCartValue
    const subtotal = cartItems.reduce((sum, i) => sum + i.originalPrice * i.quantity, 0);
    if (subtotal < coupon.minCartValue) {
      const amountNeeded = (coupon.minCartValue - subtotal).toFixed(2);
      return res.json({
        success: false,
        message: `Add ₹${amountNeeded} more to apply this coupon`
      });
    }

    // Check if user has already used the coupon
    const hasUsedCoupon = await Order.exists({
      userId,
      'appliedCoupon.couponId': coupon._id,
      status: { $nin: ['cancelled', 'returned'] }
    });
    if (hasUsedCoupon && !coupon.reusable) {
      return res.json({ success: false, message: 'You have already used this coupon' });
    }

    // Calculate order summary with coupon
    const orderSummary = calculateOrder(cartItems, {
      coupon: {
        type: coupon.discountType === 'percentage' ? 'percentage' : 'fixed',
        value: coupon.discountValue,

      }
    });

    // Save applied coupon in session
 req.session.appliedCoupon = {
  couponId: coupon._id,
  code: coupon.code,
  type: coupon.discountType,
  value: coupon.discountValue
};


    console.log("req.session.appliedCoupon:", req.session.appliedCoupon);
    console.log("orderSummary after applying coupon:", orderSummary);

    res.json({
      success: true,
      couponId: coupon._id,
      couponCode: coupon.code,
      appliedCoupon:req.session.appliedCoupon,
      discountText: coupon.discountType === 'percentage'
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} off`,
      orderSummary
    });

  } catch (error) {
    console.error('Error applying coupon by code:', error);
    res.json({ success: false, message: 'Error applying coupon' });
  }
};



exports.applyCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const userId = req.session.user.id;

    const coupon = await Coupon.findOne({
      _id: couponId,
      isActive: true,
      validTill: { $gte: new Date() }
    });
    console.log("coupon inside the applycoupon",coupon);
    if (!coupon) {
      return res.json({ success: false, message: 'Invalid or expired coupon' });
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    const cartItems = cart.items
      .filter(item => item.productId && item.productId.isActive)
      .map(item => ({
        id: item.productId._id,
        name: item.productId.productName,
        price: item.productId.discountedPrice || item.productId.price,
        originalPrice: item.productId.price,
        discountedPrice: item.productId.discountedPrice || null,
        quantity: item.quantity
      }));

    const subtotal = cartItems.reduce(
      (sum, i) => sum + i.originalPrice * i.quantity,
      0
    );
    if (subtotal < coupon.minCartValue) {
      const amountNeeded = (coupon.minCartValue - subtotal).toFixed(2);
      return res.json({
        success: false,
        message: `Add ₹${amountNeeded} more to apply this coupon`
      });
    }

    const hasUsedCoupon = await Order.exists({
      userId,
      'appliedCoupon.couponId': coupon._id,
      status: { $nin: ['cancelled', 'returned'] }
    });
    if (hasUsedCoupon && !coupon.reusable) {
      return res.json({ success: false, message: 'You have already used this coupon' });
    }

    const orderSummary = calculateOrder(cartItems, {
      coupon: {
        type: coupon.discountType === 'percentage' ? 'percentage' : 'flat',
        value: coupon.discountValue
      }
    });
      req.session.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code,
      type:coupon.discountType,
      value:coupon.discountValue
    };
    console.log("req.session:",req.session);
    console.log("ordersummary after the coupon applied :",orderSummary);
    res.json({
      success: true,
      couponId: coupon._id,
      couponCode: coupon.code,
      discountText: coupon.discountType === 'percentage'
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue} off`,
      orderSummary
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.json({ success: false, message: 'Error applying coupon' });
  }
};
exports.removeCoupon=async(req,res)=>{
  try {
    console.log("req session inside the remve coupon:",req.session);
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ success: false, message: 'Please log in to continue' });
    }
   const userId=req.session.user.id;
   console.log("userId inside the removecouon :",userId);
   const cart=await Cart.findOne({userId}).populate('items.productId');
   console.log("cart inside the  removeCoupon",cart);
   if(!cart){
    return res.json({success:false,message:'Cart not found'});
   }


if(!req.session.appliedCoupon){
  return res.json({success:false,message:'No coupon applied to remove'})
}

delete req.session.appliedCoupon;

const cartItems=cart.items
.filter(item=>item.productId&&item.productId.isActive)
.map(item=>({
  id:item.productId._id,
  name:item.productId.productName,
  price:item.productId.discountedPrice||item.productId.price,
  originalPrice:item.productId.price,
  discountedPrice:item.productId.discountedPrice||null,
  quantity:item.quantity
}));

const orderSummary=calculateOrder(cartItems,{});
console.log("orderSummary",orderSummary);
return res.json({
  success:true,
  message:'Coupon removed successfully',
  orderSummary
});
  } catch (error) {
    console.error('error removing coupon:',error);
    res.json({success:false,message:'error removing coupon'});
  }
}
