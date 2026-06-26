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
    console.log("order inside the razorpay controellr",order);
    
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
