import Coupon from '../../models/couponSchema.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getAllCouponService=async(searchQuery={},skip=0,limit=10)=>{
    logger.debug('fetching all coupons',{searchQuery,skip,limit});
    const coupons= await Coupon.find(searchQuery)
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit);
    
    logger.info('coupons fetched successfully',{count:coupons.length});
    return coupons;
}
export const getTotalCouponsCount=async(searchQuery={})=>{
    logger.debug('getting total coupons count',{searchQuery});
    const count=await Coupon.countDocuments(searchQuery);
    logger.info('total coupons count retrieved',{count});
    return count;
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
        throw new Error(MESSAGES.COUPON.DUPLICATE);
            }
          
            const coupon =new Coupon(formattedData)
            await coupon.save();
            logger.info('coupon created successfully',{couponId:coupon._id,code});
            return coupon;
}

export const getCouponByIdService=async(couponId)=>{
    logger.debug('fetching coupon by ID',couponId);
    const coupon=await Coupon.findById(couponId);

    if(!coupon){
        logger.warn('coupon not found',couponId);
        throw new Error(MESSAGES.COUPON.NOT_FOUND)
    }
logger.debug('coupon fetched carefully',couponId);
return coupon;
}

export const updatedCouponService=async(couponId,updateData)=>{
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
    }=updateData;
    logger.debug('updating coupon',{couponId,code});

if(code){
    const existingCoupon=await Coupon.findOne({
        code:code.toUpperCase(),
        _id:{$ne:couponId}
    });
if(discountValue>minCartValue){
    throw new Error("Coupon discount value cant be greater than minimum Cart Vale");
}




    if(existingCoupon){
        logger.warn('duplicated coupon code during update',{code,couponId});
        throw new Error(MESSAGES.COUPON.DUPLICATE_CODE);
    }
}

const formattedUpdateData={
    ...(description && {description}),
...(code&&{code}),
...(discountType&&{discountType}),
...(discountValue&&{discountValue:parseFloat(discountValue)}),
...(redeemAmount&&{redeemAmount:parseFloat(redeemAmount)}),
...(minCartValue&&{minCartValue:parseFloat(minCartValue)}),
...(validFrom&& {validFrom:new Date(validFrom)}),
...(validTill&&{validTill:new Date(validTill)}),
...(usageLimit!==undefined&&{usageLimit:usageLimit?parseInt(usageLimit):null}),
isActive:isActive==='on'||isActive===true||isActive==="true"

};

const coupon=await Coupon.findByIdAndUpdate(couponId,formattedUpdateData,{new:true,runValidators:true})
if(!coupon){
    logger.warn('coupon not found for update',{couponId});
    throw new Error(MESSAGES.COUPON.NOT_FOUND);
}
logger.info('coupon updated successfully',{couponId,code:coupon.code});
return coupon;
}

export const deleteCouponService=async(couponId)=>{
    logger.debug('deleting coupon',{couponId});

    const coupon=await Coupon.findByIdAndDelete(couponId);
    if(!coupon){
        logger.warn('coupon not found for deletion ',{couponId});
        throw new Error (MESSAGES.COUPON.NOT_FOUND)
    }
    logger.info('coupon deleted successfully',{couponId})
return coupon;       
}

export const validateCouponService=async(code,cartValue)=>{
    logger.debug('validating coupon',{code,cartValue});

    const result =await Coupon.validateCoupon(code,cartValue);
    logger.info('coupon validation completed',{
        code,
        isValid:result.valid,
        discount:result.discount
    })
return result;
}