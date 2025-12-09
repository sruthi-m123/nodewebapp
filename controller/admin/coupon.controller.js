import * as couponService from '../../service/admin/coupon.service.js';
import {
    createCouponSchema,
    updateCouponSchema,
    validateCouponSchema
} from '../../utils/validation.schema.js';
import {STATUS_CODES} from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';


export const getCouponPage=async(req,res)=>{
    logger.info('Loading oupon managment page');

    const coupons=await couponService.getAllCouponService();

    res.render('admin/coupons',{
        coupons,
        layout:false
    })


}
export const createCoupon=async(req,res)=>{
    logger.info('creating new coupon');

   
    const body=Object.fromEntries(
        Object.entries(req.body).map(([key,val])=>[key,val?.toString()||""])
    );


    const {error,value}=createCouponSchema.validate(body);
    if(error){
        logger.warn('Coupon creation validation failed',{error:error.details[0].message});
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:error.details[0].message
        })
    }

    const coupon=await couponService.createCouponService(value);

    res.status(STATUS_CODES.CREATED).json({
        success:true,
        message:MESSAGES.COUPON.CREATE_SUCCESS,
        data:coupon
    })
}

export const getCouponById=async(req,res)=>{
    const couponId=req.params.id;

    logger.info('Fetching coupon by Id',{couponId});

    const coupon=await couponService.getCouponByIdService(couponId);
    res.status(STATUS_CODES.SUCCESS).json(coupon);
}

export const updateCoupon=async(req,res)=>{
    const couponId=req.params.id;

    logger.info('updating coupon',{couponId});

    const body=Object.fromEntries(
        Object.entries(req.body).map(([key,value])=>[key,value?.toString()||""])
    );

    const {error,value}=updateCouponSchema.validate(body);
    if(error){
        logger.warn('Coupon update validation failed',{error:error.details[0].message});
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:error.details[0].message,

        });
    }
    const coupon=await couponService.updatedCouponService(couponId,value);

    res.status(STATUS_CODES.SUCCESS).json({
        success:true,
        message:MESSAGES.COUPON.UPDATE_SUCCESS,
        coupon
    })
}



export const deleteCoupon=async(req,res)=>{
    const couponId=req.params.id;

    logger.info('Deleting coupon',{couponId});

    await couponService.deleteCouponService(couponId);

    res.status(STATUS_CODES.SUCCESS).json({
        success:true,
        message:MESSAGES.COUPON.DELETE_SUCCESS
    });
}

export const validateCoupon=async(req,res)=>{
    const{code,cartValue}=req.body;
    logger.info('validating coupon for use',{code});

    const {error,value}=validateCouponSchema.validate({code,cartValue});

    if(error){
        logger.warn('coupon validation input failed',{error:error.details[0].message});
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success:false,
            message:error.details[0].message
        })
    }

    const result=await couponService.validateCouponService(value.code,value.cartValue);

    res.status(STATUS_CODES.SUCCESS).json(result);
}

