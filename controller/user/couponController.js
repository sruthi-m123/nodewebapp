const User = require('../../models/userSchema');
const Coupon = require('../../models/couponSchema');
const Cart = require('../../models/cartSchema');
const { calculateOrder } = require('../../helper/calculateTotal');
const Order = require('../../models/orderSchema');

exports.removeCoupon = async (req, res) => {
  try {
    console.log("req session inside the remove coupon:", req.session);
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ success: false, message: 'Please log in to continue' });
    }
    const userId = req.session.user.id;
    console.log("userId inside the removecoupon :", userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    console.log("cart inside the removeCoupon", cart);
    if (!cart) {
      return res.json({ success: false, message: 'Cart not found' });
    }

    if (!req.session.appliedCoupon) {
      return res.json({ success: false, message: 'No coupon applied to remove' })
    }

    delete req.session.appliedCoupon;

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

    const orderSummary = calculateOrder(cartItems, {});
    console.log("orderSummary", orderSummary);
    return res.json({
      success: true,
      message: 'Coupon removed successfully',
      orderSummary
    });
  } catch (error) {
    console.error('error removing coupon:', error);
    res.json({ success: false, message: 'error removing coupon' });
  }
}

//discount text
function getDiscountText(coupon) {
  return coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% off`
    : `${coupon.discountValue} off`
}

//validating coupon per usage
async function checkCouponUsage(userId, coupon) {
  const usageCount = await Order.countDocuments({
    userId,
    'appliedCoupon.couponId': coupon._id,
    status: { $nin: ['cancelled', 'returned'] }
  });
  if (!coupon.reusable && usageCount > 0) {
    return { valid: false, message: 'you have already used this coupon' }
  }

  if (coupon.usageLimit && usageCount >= coupon.usageLimit) {
    return {
      valid: false,
      message: `you can use this coupon only ${coupon.usageLimit} times`
    }
  }

  return { valid: true };
}

function prepareCartItems(cart) {
  return cart.items
    .filter(item => item.productId && item.productId.isActive)
    .map(item => ({
      id: item.productId._id,
      name: item.productId.productName,
      price: item.productId.discountedPrice || item.productId.price,
      originalPrice: item.productId.price,
      discountedPrice: item.productId.discountedPrice || null,
      quantity: item.quantity
    }))
}

function checkMinCartValue(cartItems, coupon) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity, 0
  );
  if (subtotal < coupon.minCartValue) {
    const amountNeeded = parseFloat((coupon.minCartValue - subtotal).toFixed(2));
    return {
      valid: false,
      message: `Add ₹${amountNeeded} more to apply this coupon `
    };
  }
  return { valid: true };
}

async function applyCouponLogic({ userId, coupon, retryCartItems = null }) {
  let cartItems;  // Declare the variable

  if (retryCartItems) {
    console.log('applyCouponLogic: Using retry cart items (count:', retryCartItems.length, ')');
    cartItems = retryCartItems;
  } else {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length == 0) {
      return { success: false, message: 'cart is empty' };
    }
    cartItems = prepareCartItems(cart);
  }

  const cartCheck = checkMinCartValue(cartItems, coupon);
  if (!cartCheck.valid) return { success: false, message: cartCheck.message };

  const usageCheck = await checkCouponUsage(userId, coupon);
  if (!usageCheck.valid) return { success: false, message: usageCheck.message };

  const orderSummary = calculateOrder(cartItems, {
    coupon: {
      type: coupon.discountType === 'percentage' ? 'percentage' : 'fixed',
      value: coupon.discountValue
    }
  });

  return {
    success: true,
    orderSummary,
    discountText: getDiscountText(coupon),
    appliedCoupon: {
      couponId: coupon._id,
      code: coupon.code,
      type: coupon.discountType,
      value: coupon.discountValue
    }
  };
}

exports.applyCouponByCode = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.user.id;
    const isRetry = req.query.retry === 'true';
    console.log("isRetry:", isRetry);

    const coupon = await Coupon.findOne({
      code: couponCode,
      isActive: true,
      validTill: { $gte: new Date() }
    });

    if (!coupon) {
      return res.json({ success: false, message: 'Invalid or expired coupon code' })
    };

    //retry
    let retryCartItems = null;
    if (isRetry) {
      const failedOrder = await Order.findOne({
        userId,
        status: 'payment_failed'
      }).populate('items.productId').sort({ createdAt: -1 });

      if (failedOrder) {
        retryCartItems = failedOrder.items.map(item => ({
          id: item.productId._id,
          name: item.productId.productName,
          price: item.discountedPrice || item.price,
          originalPrice: item.price,
          discountedPrice: item.discountedPrice || null,
          quantity: item.quantity
        }))
      } else {
        return res.json({ success: false, message: 'No failed order for retry' })
      }
    }

    const result = await applyCouponLogic({ userId, coupon, retryCartItems });
    if (!result.success) return res.json(result);
    req.session.appliedCoupon = result.appliedCoupon;
    const responseData = {
      success: true,
      couponId: coupon._id,
      couponCode: coupon.code,
      appliedCoupon: result.appliedCoupon,
      discountText: result.discountText,
      orderSummary: result.orderSummary
    };
    return res.json(responseData);
  } catch (error) {
    console.error('Error applying coupon by code:', error);
    res.json({ success: false, message: 'error applying coupon' });
  }
}

exports.applyCoupon = async (req, res) => {
  try {
    const { couponId } = req.body;
    const userId = req.session.user.id;
    const isRetry = req.query.retry === 'true';

    const coupon = await Coupon.findOne({
      _id: couponId,
      isActive: true,
      validTill: { $gte: new Date() }
    });

    if (!coupon) {
      return res.json({ success: false, message: 'Invalid or expired coupon' })
    }

    //retry checkout
    let retryCartItems = null;
    if (isRetry) {
      const failedOrder = await Order.findOne({
        userId,
        status: 'payment_failed'
      }).populate('items.productId');

      if (failedOrder) {
        retryCartItems = failedOrder.items.map(item => ({
          id: item.productId._id,
          name: item.productId.productName,
          price: item.discountedPrice || item.price,
          originalPrice: item.price,
          discountedPrice: item.discountedPrice || null,
          quantity: item.quantity
        }));
        console.log('retry items fetched:', retryCartItems ? retryCartItems.length : 0);
        console.log('applyCoupon:Retry mode,using failed order items ');
      } else {
        return res.json({ success: false, message: 'No failed order for retry' })
      }
    }
    const result = await applyCouponLogic({ userId, coupon, retryCartItems });
    if (!result.success) return res.json(result);
    console.log("result inside the apply coupon:", result);
    req.session.appliedCoupon = result.appliedCoupon;
    const responseData = {
      success: true,
      couponId: coupon._id,
      couponCode: coupon.code,
      appliedCoupon: result.appliedCoupon,  // Added for consistency
      discountText: result.discountText,
      orderSummary: result.orderSummary
    };
    console.log('Sending success response:', responseData);
    return res.json(responseData);
  } catch (error) {
    console.error('error applying coupon:', error);
    res.json({ success: false, message: 'error applying coupon' })
  }
}