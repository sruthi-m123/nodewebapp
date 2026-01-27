// controllers/user/coupon.controller.js
import * as couponApplicationService from '../../service/user/coupon.service.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import logger from '../../utils/logger.js';

export const removeCoupon = async (req, res) => {
  logger.info('removing applied coupon');

  const orderSummary = await couponApplicationService.removeCouponService(req.userId);

  delete req.session.appliedCoupon;
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Coupon removed successfully',
    orderSummary
  });
};

export const applyCouponByCode = async (req, res) => {
  logger.info('applying coupon by code');

  const userId = req.userId;
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
};

export const applyCoupon = async (req, res) => {
  logger.info('Applying coupon by Id');

  const userId = req.userId;
  const isRetry = req.query.retry === 'true';

  const { couponCode, couponId, retryCartItems } = req.validatedData;

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
};