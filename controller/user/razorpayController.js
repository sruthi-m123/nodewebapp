<<<<<<< Updated upstream
import * as razorpayService from '../../service/user/razorpayService.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const createOrder = async (req, res) => {
    logger.info('Creating Razorpay order', {
        userId: req.session?.user?.id,
        amount: req.body.amount
    });
    
    const { order } = await razorpayService.createRazorpayOrder(req.body.amount);
    
    res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        order,
        key: process.env.RAZORPAY_KEY_ID
    });
};

export const verifyPayment = async (req, res) => {
    logger.info('Verifying payment', {
        userId: req.session?.user?.id,
        razorpay_order_id: req.body.razorpay_order_id,
        dborderId: req.body.dborderId
    });
    
    const isVerified = await razorpayService.verifyRazorpayPayment(req.body);
    
    if (isVerified) {
        logger.info('Payment verification successful', {
            dborderId: req.body.dborderId,
            razorpay_order_id: req.body.razorpay_order_id
        });
        
        res.status(STATUS_CODES.SUCCESS).json({
            success: true,
            message: MESSAGES.PAYMENT.VERIFICATION_SUCCESS
        });
    } else {
        logger.warn('Payment verification failed', {
            dborderId: req.body.dborderId,
            razorpay_order_id: req.body.razorpay_order_id
        });
        
        const error = new Error(MESSAGES.PAYMENT.VERIFICATION_FAILED);
        error.statusCode = STATUS_CODES.BAD_REQUEST;
        throw error;
    }
};

export const markPaymentFailed = async (req, res) => {
    logger.info('Marking payment as failed', {
        userId: req.session?.user?.id,
        dborderId: req.body.dborderId
    });
    
    await razorpayService.markRazorpayPaymentFailed(req.body.dborderId);
    
    logger.info('Payment marked as failed successfully', {
        dborderId: req.body.dborderId
    });
    
    res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: MESSAGES.PAYMENT.MARKED_FAILED
    });
};
=======
const crypto=require('crypto');
exports.verifyPayment=async(req,res)=>{
    try {
        const{
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId
        }=req.body;

        console.log("verifying payment for order:",orderId);

        const generatedSignature=crypto
        .createHmac('sha256',process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

if (generatedSignature !== razorpay_signature) {
            console.log("Payment signature mismatch!");
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid payment signature' 
            });
        }
         const order = await Order.findOne({ orderId: orderId });
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: 'Order not found' 
            });
        }

        console.log("Updating stock for order:", orderId);
   
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
            console.log(`Stock updated for product ${item.productId}: -${item.quantity}`);
        }
order.paymentStatus = 'completed';
        order.status = 'processing';
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpayOrderId = razorpay_order_id;
        await order.save();

        // 5. Clear the cart (if not buy now)
        if (!req.session.buyNowItem) {
            await Cart.findOneAndUpdate(
                { userId: order.userId },
                { $set: { items: [] } }
            );
            console.log("Cart cleared for user:", order.userId);
        } else {
            // Clear buy now session
            delete req.session.buyNowItem;
        }
        console.log("Payment verified and stock updated successfully!");
        
        res.json({ 
            success: true, 
            message: 'Payment verified successfully',
            order: {
                id: order._id,
                orderId: order.orderId,
                status: order.status
            }
        });

    } catch (error) {
         console.error('Payment verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Payment verification failed: ' + error.message 
        });
    }
    }
}
>>>>>>> Stashed changes
