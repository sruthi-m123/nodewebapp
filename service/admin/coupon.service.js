import Coupon from '../../models/couponSchema.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getAllCouponService=async()=>{
    logger.debug('fetching all coupons');
    const coupons= await Coupon.find().sort({createdAt:-1});
    
    logger.info('coupons fetched successfully',{count:coupons.length});
    return coupons;
}

export const createCouponService=async(couponData)=>{
    const{
        description,
        code,
        discountType,
        discountValue,
        redeemAmount,
        minCartValue,
        validFrom,
        validTill,
        usageLimit,
        isActive
    }=couponData;
    logger.debug('creating new coupon',{code,discountType});
    const formattedData={
        description,
        code,
        discountType,
        discountValue:discountValue?parseFloat(discountValue):0,
        redeemAmount:redeemAmount?parseFloat(redeemAmount):0,
        minCartValue:minCartValue?parseFloat(minCartValue):0,
        validFrom:new Date(validFrom),
        validTill:new Date(validTill),
        usageLimit:usageLimit?parseInt(usageLimit):null,
        isActive:isActive==='on'||isActive===true||isActive==="true"


    }
    logger.debug('formatted coupon data',{formattedData});

    const existingCoupon=await Coupon.findOne({
        description:description.trim(),
        discountType:discountType,
        discountValue:formattedData.discountValue
    });
    if(existingCoupon){
        logger.warn('Duplicate coupon creation attempt',description,discountType);
        throw new Error()
    }
}