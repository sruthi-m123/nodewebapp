// services/razorpayService.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../../models/orderSchema.js';
import Coupon from '../../models/couponSchema.js';
import Product from '../../models/productSchema.js';
import logger from '../../utils/logger.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (amount) => {
  logger.info('Razorpay service: Creating order');
  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };
  const order = await razorpay.orders.create(options);
  console.log("razor pay order created:", order);
  logger.info('Razorpay order created:', order);
  return { order };
};

export const verifyRazorpayPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, dborderId }) => {
  if (!dborderId) {
    logger.warn('Order ID required for payment verification');
    return { success: false, reason: 'order_id_required' };
  }

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generatedSignature = hmac.digest('hex');

  if (generatedSignature === razorpay_signature) {
    const order = await Order.findOneAndUpdate(
      { orderId: dborderId },
      {
        status: 'paid',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    logger.info('Updated order after payment verification:', order);

    if (!order) {
      logger.warn('Order not found for payment verification');
      return { success: false, reason: 'order_not_found' };
    }

    if (order.appliedCoupon && order.appliedCoupon.couponId) {
      await Coupon.findByIdAndUpdate(order.appliedCoupon.couponId, { $inc: { usedCount: 1 } });
      logger.info('Coupon used count incremented');
    }

    // Stock reduction 
    const stockUpdates = order.items.map(item => ({
      updateOne: {
        filter: { _id: item.productId, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } }
      }
    }));
    const bulkWriteResult = await Product.bulkWrite(stockUpdates);

    // Check if any product failed to update due to insufficient stock
    if (bulkWriteResult.matchedCount < order.items.length) {
      logger.warn('Stock validation failed during Razorpay verification - overbooked!', { dborderId });

      // Mark order as cancelled
      order.status = 'cancelled';
      order.cancelledAt = new Date();
      await order.save();

      // Automatically refund to user's wallet
      const Wallet = (await import('../../models/walletSchema.js')).default;
      let wallet = await Wallet.findOne({ user: order.userId });
      if (!wallet) {
        wallet = await Wallet.create({ user: order.userId, balance: 0, transactions: [] });
      }
      wallet.balance += order.total;
      wallet.transactions.push({
        amount: order.total,
        description: `Auto-refund for overbooked Order #${dborderId}`,
        type: 'credit',
        date: new Date()
      });
      await wallet.save();

      logger.info(`Refunded ${order.total} to wallet for overbooked order ${dborderId}`);
      return { success: true, overbooked: true };
    }
    logger.info('Stock reduced successfully');

    logger.info('Payment verification successful');
    return { success: true, overbooked: false };
  } else {
    logger.warn('Payment signature mismatch');
    return { success: false, reason: 'signature_mismatch' };
  }
};

export const markRazorpayPaymentFailed = async (dborderId) => {
  const order = await Order.findOne({ orderId: dborderId });
  logger.info('Order fetched for payment failure marking:', order);

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'payment_pending' || order.status === 'processing') {
    order.status = 'payment_failed';
    if (order.appliedCoupon && order.appliedCoupon.couponId) {
      await Coupon.findByIdAndUpdate(order.appliedCoupon.couponId, {
        $inc: { usedCount: -1 }
      });
      order.appliedCoupon = null;
      logger.info('Coupon used count decremented');
    }
    await order.save();
    logger.info('Order marked as payment failed');
  } else {
    logger.warn('Order status not eligible for failure marking');
  }
};