import Joi from 'joi';
import { MESSAGES } from '../messages.js';


export const createCouponSchema = Joi.object({
    description: Joi.string().trim().required().messages({
        'string.empty': MESSAGES.COUPON.DESCRIPTION_REQUIRED,
        'any.required': MESSAGES.COUPON.DESCRIPTION_REQUIRED
    }),
    code: Joi.string().trim().uppercase().required().messages({
        'string.empty': MESSAGES.COUPON.CODE_REQUIRED,
        'any.required': MESSAGES.COUPON.CODE_REQUIRED
    }),
    discountType: Joi.string().valid('percentage', 'fixed').required().messages({
        'any.only': 'Discount type must be either percentage or fixed',
        'any.required': MESSAGES.COUPON.DISCOUNT_TYPE_REQUIRED
    }),
    discountValue: Joi.alternatives().conditional('discountType', {
        is: 'fixed',
        then: Joi.number().min(0).required().messages({
            'number.base': 'Discount value must be a number',
            'number.min': 'Discount value must be at least 0',
            'any.required': MESSAGES.COUPON.DISCOUNT_VALUE_REQUIRED
        }),
        otherwise: Joi.number().min(0).max(100).required().messages({
            'number.base': 'Discount value must be a number',
            'number.min': 'Discount value must be at least 0',
            'number.max': 'Discount value cannot exceed 100%',
            'any.required': MESSAGES.COUPON.DISCOUNT_VALUE_REQUIRED
        })
    }),
    redeemAmount: Joi.number().min(0).required().messages({
        'number.base': 'Redeem amount must be a number',
        'number.min': 'Redeem amount must be at least 0',
        'any.required': 'Redeem amount is required'
    }),
    minCartValue: Joi.number().min(0).required().messages({
        'number.base': 'Minimum cart value must be a number',
        'number.min': 'Minimum cart value must be at least 0',
        'any.required': 'Minimum cart value is required'
    }),
    validFrom: Joi.date().iso().required().messages({
        'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'date.format': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'any.required': MESSAGES.COUPON.DATES_REQUIRED
    }),
    validTill: Joi.date().iso().greater(Joi.ref('validFrom')).required().messages({
        'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'date.format': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'date.greater': MESSAGES.COUPON.INVALID_DATE_RANGE,
        'any.required': MESSAGES.COUPON.DATES_REQUIRED
    }),
    usageLimit: Joi.number().min(1).optional().allow(null).messages({
        'number.base': 'Usage limit must be a number',
        'number.min': MESSAGES.COUPON.INVALID_USAGE_LIMIT
    }),
    isActive: Joi.boolean().default(true)
});