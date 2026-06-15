// controllers/user/coupon.controller.js
import * as couponApplicationService from '../../service/user/coupon.service.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import logger from '../../utils/logger.js';

export const removeCoupon = async (req, res) => {
  try {
    logger.info('removing applied coupon');
    const userId = req.session.user?.id;
    const { isRetry = false, retryCartItems = null } = req.body || {};
    const orderSummary = await couponApplicationService.removeCouponService(userId, isRetry, retryCartItems);
    
    delete req.session.appliedCoupon;
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: 'Coupon removed successfully',
      orderSummary
    });
  } catch (error) {
    logger.error('Error removing coupon:', error);
    res.status(error.status || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Failed to remove coupon'
    });
  }
};

export const applyCouponByCode = async (req, res) => {
  try {
    logger.info('applying coupon by code');
    const userId = req.session.user.id;
    console.log("userId:",userId);
    console.log("req.query inside the applycupn:",req.query);
    const isRetry = req.query.retry === 'true';

    const { couponCode, couponId, retryCartItems } = req.validatedData;

    const result = await couponApplicationService.validateAndApplyCouponService(
      userId,
      couponCode || couponId,
      isRetry,
      retryCartItems
    );

    req.session.appliedCoupon = result.appliedCoupon;
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      couponId: result.coupon._id,
      couponCode: result.coupon.code,
      appliedCoupon: result.appliedCoupon,
      discountText: result.discountText,
      orderSummary: result.orderSummary
    });
  } catch (error) {
    logger.error('Error applying coupon by code:', error);
    res.status(error.status || STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to apply coupon'
    });
  }
};

export const applyCoupon = async (req, res) => {
  try {
    logger.info('Applying coupon by Id');
    console.log("session details:",req.session.user)
    const userId = req.session.user.id;
    const isRetry = req.query.retry === 'true';
    console.log("validated data inside the controller:",req.validatedData);
    const { couponCode, couponId, retryCartItems } = req.validatedData;
    console.log("retry cart items inside the controller:",retryCartItems);

    console.log("userId in the apply coupon :",userId);

    const result = await couponApplicationService.validateAndApplyCouponService(
      userId,
      couponId || couponCode,
      isRetry,
      retryCartItems
    );

    req.session.appliedCoupon = result.appliedCoupon;
    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      couponId: result.coupon._id,
      couponCode: result.coupon.code,
      appliedCoupon: result.appliedCoupon,
      discountText: result.discountText,
      orderSummary: result.orderSummary
    });
  } catch (error) {
    logger.error('Error applying coupon by ID:', error);
    res.status(error.status || STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to apply coupon'
    });
  }
};