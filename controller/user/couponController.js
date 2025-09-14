const User=require('../../models/userSchema');
const Coupon=require('../../models/couponSchema');
const Cart=require('../../models/cartSchema');
const{calculateOrder}=require('../../helper/calculateTotal');
const Order=require('../../models/orderSchema');

exports.applyCouponByCode=async(req,res)=>{
    try {
        const {couponCode}=req.body;
        const userId=req.session.user.id;

        const coupon=await Coupon.findOne({
            code:couponCode,
            isActive:true,
            validTill:{$gte:new Date()}
        });

        if(!coupon){
            return res.json({success:false,message:'Invalid or expired coupon code '});
                    }
                    const cart=await Cart.findOne({userId}).populate('items.productId');
                    
                    const cartTotal=cart.total;
                    if(cartTotal<coupon.minCartValue){
                        const amountNeeded=(coupon.minCartValue-cartTotal).toFixed(2);
                        return res.json({
                            success:false,
                            message:`Add ₹${amountNeeded} more to apply this coupon.`
                        })
                    }

                  const hasUsedCoupon = await Order.exists({ 
            userId: userId, 
            'coupon.couponId': coupon._id,
            status: { $nin: ['cancelled', 'returned'] }
        });
          if (hasUsedCoupon && !coupon.reusable) {
            return res.json({ success: false, message: 'You have already used this coupon' });
        }
          const discountAmount = calculateDiscount(coupon, cartTotal);
        
        // Apply coupon to cart
        cart.coupon = {
            couponId: coupon._id,
            code: coupon.code,
            discountAmount: discountAmount
        };
        
        await cart.save();
         res.json({
            success: true,
            couponId: coupon._id,
            couponCode: coupon.code,
            discountText: coupon.discountType === 'percentage' 
                ? `${coupon.discountValue}% off` 
                : `₹${coupon.discountValue} off`,
            updatedSummary: {
                subtotal: cartTotal,
                discount: discountAmount,
                total: cartTotal - discountAmount
            }
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.json({ success: false, message: 'Error applying coupon' });
    }
}


exports.applyCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const userId = req.session.user.id;

    // 1. Validate coupon
    const coupon = await Coupon.findOne({
      _id: couponId,
      isActive: true,
      validTill: { $gte: new Date() }
    });
    if (!coupon) {
      return res.json({ success: false, message: 'Invalid or expired coupon' });
    }

    // 2. Get cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: 'Cart is empty' });
    }

    // 3. Build cart items
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

    // 4. Check minimum cart value
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

    // 5. Usage limits
    const hasUsedCoupon = await Order.exists({
      userId,
      'coupon.couponId': coupon._id,
      status: { $nin: ['cancelled', 'returned'] }
    });
    if (hasUsedCoupon && !coupon.reusable) {
      return res.json({ success: false, message: 'You have already used this coupon' });
    }

    // 6. Calculate order summary
    const orderSummary = calculateOrder(cartItems, {
      coupon: {
        type: coupon.discountType === 'percentage' ? 'percentage' : 'flat',
        value: coupon.discountValue
      }
    });
      req.session.appliedCoupon = {
      couponId: coupon._id,
      code: coupon.code
    };
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
