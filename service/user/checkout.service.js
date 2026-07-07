import User from '../../models/userSchema.js';
import Order from '../../models/orderSchema.js';
import Address from '../../models/addressSchema.js';
import Cart from '../../models/cartSchema.js';
import Product from '../../models/productSchema.js';
import Offer from '../../models/offerSchema.js';
import Coupon from '../../models/couponSchema.js';
import Wallet from '../../models/walletSchema.js';
import { addAddressService } from './address.service.js';
import Razorpay from 'razorpay';
import { calculateOrder } from '../../helper/calculateTotal.js';
import { WalletService } from './wallet.sevice.js';
import { MESSAGES } from '../../utils/messages.js';
import mongoose from 'mongoose';
export const getCheckoutData = async (userId, session) => {
  const userData = await User.findById(userId);
  let addressesDoc = await Address.findOne({ userId }).lean();
  let addresses = addressesDoc ? addressesDoc.address.filter(addr => !addr.isDeleted) : [];

  let cartItems = [];
  let fromCart = true;
  let stockValidationFailed = false;
  let outOfStockItems = [];
  console.log("session:", session);
  if (session.buyNowItem) {
    fromCart = false;
    const product = await Product.findById(session.buyNowItem.productId);
    if (product) {
      const requestedQty = session.buyNowItem.quantity || 1;
      if (product.stock < requestedQty) {
        stockValidationFailed = true;
        outOfStockItems.push({
          productId: product._id,
          name: product.productName,
          available: product.stock,
          requested: requestedQty
        })
      }
      cartItems = [{
        id: product._id,
        name: product.productName,
        image: product.images[0],
        price: product.discountedPrice || product.price,
        originalPrice: product.price,
        discountedPrice: product.discountedPrice || null,
        quantity: requestedQty,
        isBuyNow: true

      }]
    }
  } else {
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (cart) {
      for (const item of cart.items) {
        if (item.productId && item.productId.isActive) {
          const product = item.productId;
          if (product.stock < item.quantity) {
            stockValidationFailed = true;
            outOfStockItems.push({
              productId: product._id,
              name: product.productName,
              available: product.stock,
              requested: item.quantity
            })
          }
        }
      }
      cartItems = cart.items
        .filter(item => item.productId && item.productId.isActive)
        .map(item => ({
          id: item.productId._id,
          name: item.productId.productName,
          image: item.productId.images[0],
          variant: item.variant,
          price: item.productId.discountedPrice || item.productId.price,
          originalPrice: item.productId.price,
          discountedPrice: item.productId.discountedPrice || null,
          quantity: item.quantity,
          isBuyNow: false
        }))
    }
  }
  console.log("cart items inside the checkout service:", cartItems);
  const coupons = await Coupon.find({ isActive: true }).lean();
  const usedOrders = await Order.find({
    userId,
    'appliedCoupon.couponId': { $in: coupons.map(c => c._id) },
    status: { $nin: ['cancelled', 'returned'] }
  }).lean();
  const usedCouponIds = usedOrders.map(o => o.appliedCoupon.couponId.toString());
  const couponWithStatus = coupons.map(coupon => ({
    ...coupon,
    isUsed: usedCouponIds.includes(coupon._id.toString())
  }));
  const taxRate = 18;
  const offers = await Offer.find({
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
    isActive: true
  }).lean();

  const orderSummary = calculateOrder(cartItems);
  orderSummary.stockValidationFailed = stockValidationFailed;
  orderSummary.outOfStockItems = outOfStockItems;
  const paymentMethods = [
    { id: 'netbanking', title: 'Net Banking', icon: '🏦', description: 'Pay via Internet Banking' },
    { id: 'cod', title: 'Cash on Delivery', icon: '💰', description: 'Pay when you receive the order' },
    { id: 'wallet', title: 'Wallet', description: 'Purchase through your wallet amount' }
  ];
  const wallet = await walletAmount(userId);

  return { addresses, cartItems, fromCart, taxRate, orderSummary, offers, paymentMethods, coupons: couponWithStatus, userData, wallet };

}

export const getRetryCheckoutData = async (userId, orderId) => {
  const order = await Order.findOne({ orderId }).populate('items.productId').populate('userId');
  if (!order || order.userId._id.toString() !== userId) {
    return { success: false, message: 'Order not dound or not authorized' };
  }
  if (order.status !== 'payment_failed') {
    return { success: false, message: 'Cannot retry this order' };
  }

  const addressesDoc = await Address.findOne({ userId }).lean();
  const addresses = addressesDoc ? addressesDoc.address.filter(addr => !addr.isDeleted) : [];
  const cartItems = order.items.map(item => ({
    id: item.productId._id,
    name: item.productId.productName,
    image: item.productId.images[0],
    variant: item.variant,
    price: item.productId.discountedPrice || item.productId.price,
    originalPrice: item.price,
    discountedPrice: item.productId.discountedPrice || null,
    quantity: item.quantity,
    isBuyNow: false
  }));
  const coupons = await Coupon.find({ isActive: true }).lean();
  const usedOrders = await Order.find({
    userId,
    'appliedCoupon.couponId': { $in: coupons.map(c => c._id) },
    status: { $nin: ['cancelled', 'returned', 'payment_failed'] }
  }).lean();
  const userCouponIds = usedOrders.map(o => o.appliedCoupon.couponId.toString());
  const couponsWithStatus = coupons.map(coupon => ({
    ...coupon,
    isUsed: userCouponIds.includes(coupon._id.toString())
  }));

  const retryAppliedCoupon = null;
  const orderSummary = calculateOrder(cartItems, { coupon: retryAppliedCoupon, taxRate: 18 });
  const paymentMethods = [
    { id: 'netbanking', title: 'Net Banking', icon: '🏦', description: 'Pay via Internet Banking' },
    { id: 'cod', title: 'Cash on Delivery', icon: '💰', description: 'Pay when you receive the order' },
    { id: 'wallet', title: 'Wallet', description: 'Pay via Wallet' }
  ];
  const wallet = await walletAmount(userId);
  return {
    success: true,
    addresses,
    cartItems,
    orderSummary,
    coupons: couponsWithStatus,
    paymentMethods,
    order,
    wallet
  };
}






export const addAddressFromCheckout = async (userId, addressData) => {
  const result = await addAddressService(userId, addressData);
  if (!result.success) {
    return result;
  }
  return {
    success: true,
    message: MESSAGES.ADDRESS.ADD_SUCCESS,
    address: result.address
  };
}

export const getAddress = async (userId, addressId) => {
  const userData = await Address.findOne({ userId });
  if (!userData) {
    return { success: false, message: MESSAGES.ADDRESS.NO_ADDRESSES }
  }
  const address = userData.address.find(addr => addr._id.toString() === addressId);
  if (!address) {
    return { success: false, message: MESSAGES.ADDRESS.NOT_FOUND };
  }
  return { success: true, address };
}

export const applyOffer = async (userId, offerId) => {
  const offer = await Offer.findById(offerId);
  if (!offer) {
    return { success: false, messages: MESSAGES.OFFER.NOT_FOUND };
  }
  if (offer.userSpecific && offer.userSpecific.toString() !== userId.toString()) {
    return { success: false, message: MESSAGES.OFFER_NOT_VALID_USER };
  }

  if (offer.validUntil && offer.validUntil < new Date()) {
    return { success: false, message: MESSAGES.OFFER_EXPIRED };
  }

  return {
    success: true,
    offer: {
      id: offer._id,
      title: offer.title,
      description: offer.description,
      discountAmount: offer.discountValue,
      discountType: offer.discountType,
      code: offer.code
    }
  };
}

export const placeOrder = async (orderData) => {
  console.log("this is inside the placeorder");
  console.log("orderData", orderData);
  const { userId, addressId, paymentMethod, appliedOffers = [], isRetry = false, session } = orderData;
  let items = [];
  let isBuyNow = false;
  let orderId;
  let order;
  let buynow = orderData.session.buyNowItem
  if (buynow) {
    console.log("inside the buy now controller");
    const { productId, quantity = 1, variant = 'Default', price } = orderData.session.buyNowItem;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return { success: false, message: MESSAGES.PRODUCT.NOT_AVAILABLE }
    }

    if (product.stock < quantity) {
      return { success: false, message: "insuffient stock " }
    }
    const effectivePrice = price || product.discountedPrice || product.price;
    items = [{
      productId,
      name: product.productName,
      variant,
      quantity,
      price: product.price,
      discountedPrice: product.discountedPrice || null,
      totalPrice: effectivePrice * quantity
    }];
    isBuyNow = true;

  } else if (isRetry) {
    console.log("entering isretry condition");
    const failedOrder = await Order.findOne({ userId, status: 'payment_failed' }).populate('items.productId').sort({ createdAt: -1 });
    console.log("failed Order:", failedOrder);
    if (!failedOrder || failedOrder.items.length === 0) {
      return { success: false, message: 'No failed order found for retry' };
    }
    items = failedOrder.items.map(item => ({
      productId: item.productId,
      name: item.productId.productName,
      variant: item.variant || 'Default',
      quantity: item.quantity,
      price: item.price,
      discountedPrice: item.discountedPrice || null,
      totalPrice: (item.discountedPrice || item.price) * item.quantity
    }));

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive || product.stock < item.quantity) {
        return { success: false, message: `Product ${item.name} not available or insufficient stock for retry` };
      }
    }
    orderId = failedOrder.orderId;
    order = failedOrder;

  } else {
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      select: 'productName price discountedPrice stock  isActive'
    });
    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Cart is empty' };
    }
    const activeCartItems = cart.items.filter(item => item.productId && item.productId.isActive);
    items = activeCartItems.map(item => {
      const effectivePrice = item.productId.discountedPrice || item.productId.price;
      return {
        productId: item.productId._id,
        name: item.productId.productName,
        variant: item.variant || 'Default',
        quantity: item.quantity,
        price: item.productId.price,
        discountedPrice: item.productId.discountedPrice || null,
        totalPrice: effectivePrice * item.quantity
      }

    });
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product.stock < item.quantity) {
        return { success: false, message: `Product ${item.name} not available or insufficient stock for retry` };

      }
    }
  }
  console.log("userId:", userId);
  console.log("addressId:", addressId);
  const addresses = await Address.findOne({ userId, 'address._id': addressId }, { address: { $elemMatch: { _id: addressId } } });

  if (!addresses || addresses.address.length === 0) {
    return { success: false, message: MESSAGES.ADDRESS.NOT_FOUND };

  }
  const selectedAddress = addresses.address[0];
  let appliedCoupon = session.appliedCoupon || null;
  const cartItemsForCalculation = items.map(item => ({
    originalPrice: item.price,
    discountedPrice: item.discountedPrice || null,
    quantity: item.quantity
  }));
  const orderSummary = calculateOrder(cartItemsForCalculation, { coupon: appliedCoupon, taxRate: 18 });
  const { subtotal, delivery, discount, tax, total } = orderSummary;
  if (paymentMethod === 'cod' && total > 1000) {
    return { success: false, message: 'cash on delivery is not possible for orders above 1000 rupees' };
  }

  const status = paymentMethod === 'cod' ? 'pending' : (paymentMethod === 'wallet' ? 'processing' : 'payment_pending');
  if (!isRetry) {
    orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    order = new Order({
      orderId,
      userId,
      items,
      shippingAddress: selectedAddress,
      paymentMethod,
      subtotal,
      delivery,
      tax,
      discount,
      total,
      // Snapshot at order-creation time — used by the invoice PDF so it
      // is never affected by later partial cancellations.
      originalSubtotal: subtotal,
      originalTotal: total,
      status,
      appliedOffers: appliedOffers.map(o => o.id),
      appliedCoupon
    });
  } else {
    // Update existing order details for retry payment
    order.shippingAddress = selectedAddress;
    order.paymentMethod = paymentMethod;
    order.subtotal = subtotal;
    order.delivery = delivery;
    order.tax = tax;
    order.discount = discount;
    order.total = total;
    order.status = status;
    order.appliedCoupon = appliedCoupon;
  }

  // Stock check and debit verification
  if (paymentMethod === 'cod' || paymentMethod === 'wallet') {
    const decrementedItems = [];
    let stockOk = true;
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (updated) {
        decrementedItems.push({ productId: item.productId, quantity: item.quantity });
      } else {
        stockOk = false;
        break;
      }
    }

    if (!stockOk) {
      for (const rolledBackItem of decrementedItems) {
        await Product.updateOne(
          { _id: rolledBackItem.productId },
          { $inc: { stock: rolledBackItem.quantity } }
        );
      }
      return { success: false, message: "One or more items went out of stock. Please update your cart." };
    }

    if (paymentMethod === 'wallet') {
      const debitSuccess = await WalletService.debitWallet(userId, total, order._id, 'order');
      if (!debitSuccess) {
        // Rollback stock
        for (const rolledBackItem of decrementedItems) {
          await Product.updateOne(
            { _id: rolledBackItem.productId },
            { $inc: { stock: rolledBackItem.quantity } }
          );
        }
        return { success: false, message: "insufficient balance" };
      }
      order.status = 'paid';
    }

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon.couponId, { $inc: { usedCount: 1 } });
    }
  }

  // Save the order to DB now that all checks passed successfully
  await order.save();

  if (!isBuyNow && !isRetry) {
    await Cart.updateOne({ userId }, { $pull: { items: { productId: { $in: items.map(i => i.productId) } } } });
  } else if (isBuyNow) {
    delete session.buyNowItem;
  }

  let razorpayOrder = null;
  if (paymentMethod === 'netbanking') {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    razorpayOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt: orderId
    });
  }

  return { success: true, order, razorpayOrder };
}

export const getOrderForSuccess = async (orderId) => {
  const order = await Order.findOne({ orderId }).populate('userId').populate('items.productId');
  if (!order) {
    return { success: false };
  }

  const orderData = {
    storeName: 'Chettinad sarees',
    customerName: order.userId.name,
    customerEmail: order.userId.email,
    orderId,
    deliveryDate: new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    continueShoppingUrl: '/user/shopAll',
    orderItems: order.items.map(item => ({
      name: item.name,
      imageUrl: item.productId.images[0] || '/images/default-product.jpg',
      quantity: item.quantity,
      price: item.price
    }))
  };

  return { success: true, orderData };
};

export const getOrderForFailure = async (orderId) => {
  const order = await Order.findOne({ orderId }).populate('userId').populate('items.productId');
  if (!order) {
    return { success: false };
  }

  return {
    success: true,
    storeName: 'Chettinad Sarees',
    customerName: order.userId.name,
    customerEmail: order.userId.email,
    orderId: order.orderNumber || order._id,
    failureMessage: "Your payment didn't go through as it was declined by the bank. Try another payment method or contact your bank.",
    retryPaymentUrl: `/user/retry-checkout/${orderId}`,
    goToHomeUrl: '/user/shopAll'
  };
};
export const walletAmount = async (userId) => {
  const walletBalance = await Wallet.findOne({ user: userId }).populate('balance');
  console.log(walletBalance);
  return walletBalance;
}

