import * as couponApplicationService from '../../service/user/coupon.service.js';
import { applyCouponSchema } from '../../utils/validation.schema.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const removeCoupon=async (req,res)=>{
  logger.info('removing applied coupon');

  if(!req.session.user||!req.session.user.id){
    logger.warn('unauthorized coupon removal attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.CART.LOGIN_REQUIRED
    })
  }

  const userId=req.session.user.id;
  const orderSummary=await couponApplicationService.removeCouponService(userId);

  delete req.session.appliedCoupon;
  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:'Coupon removed successfully',
    orderSummary
  })

}


export const applyCouponByCode=async(req,res)=>{
  logger.info('applying coupon by code');

  if(!req.session.user||!req.session.user.id){
    logger.warn('unauthorized coupon application attempt');

    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.CART.LOGIN_REQUIRED
    })
  }
  const userId=req.session.user.id;
  const isRetry=req.query.retry==='true';

  const{error,value}=applyCouponSchema.validate(req.body);
  if(error){
    logger.warn('coupon application validation failed',{error:error.details[0].context.message});
    return res.status=(STATUS_CODES.BAD_REQUEST).json({
      success:false,
      message:error.details[0].message
    });
  }

  const result=await couponApplicationService.validateAndApplyCouponService(
    userId,
    value.couponCode||value.couponId,
    isRetry,
    value.retryCartItems
  );

  req.session.appliedCoupon=result.appliedCoupon;
  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    couponId:result.coupon._id,
    couponCode:result.coupon.code,
    appliedCoupon:result.appliedCoupon,
    discountText:result.discountText,
    orderSummary:result.orderSummary
  });
}

export const applyCoupon=async(req,res)=>{
  logger.info('Applying coupon by Id');
  if(!req.session.user||!req.session.user.id){
    logger.warn('Unathorized copon application attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.CART.LOGIN_REQUIRED
    });
  }
  const userId=req.session.user.id;
  const isRetry=req.query.retry==='true';

  const{error,value}=applyCouponSchema.validate(req.body);
  if(error){
    logger.warn('coupon application validation failed',{error:error.details[0].message});
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success:false,
      messsage:error.details[0].message
    })
  }
const result=await couponApplicationService.validateAndApplyCouponService(
  userId,
  value.couponId||value.couponCode,
  isRetry,
  value.retryCartItems
);
req.session.appliedCoupon=result.appliedCoupon
    res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        couponId: result.coupon._id,
        couponCode: result.coupon.code,
        appliedCoupon: result.appliedCoupon,
        discountText: result.discountText,
        orderSummary: result.orderSummary
    });

}
