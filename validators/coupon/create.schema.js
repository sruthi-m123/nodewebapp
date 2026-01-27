// validators/coupon/createCouponSchema.js
import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';

export const createCouponSchema = Joi.object({
  code: Joi.string().trim().required().min(3).max(20).messages({
    'string.empty': MESSAGES.COUPON.CODE_REQUIRED,
    'string.min': 'Coupon code must be at least 3 characters',
    'string.max': 'Coupon code must not exceed 20 characters',
    'any.required': MESSAGES.COUPON.CODE_REQUIRED
  }),
  discountType: Joi.string().valid('percentage', 'fixed').required().messages({
    'any.only': 'Discount type must be percentage or fixed',
    'any.required': MESSAGES.COUPON.DISCOUNT_TYPE_REQUIRED
  }),
  discountValue: Joi.number().min(0).required().messages({
    'number.base': 'Discount value must be a number',
    'number.min': 'Discount value must be at least 0',
    'any.required': MESSAGES.COUPON.DISCOUNT_VALUE_REQUIRED
  }),
  minCartValue: Joi.number().min(0).default(0).messages({
    'number.base': 'Minimum cart value must be a number',
    'number.min': 'Minimum cart value must be at least 0'
  }),
expiryDate: Joi.date().min('now').required().messages({
  'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
  'date.min': 'Expiry date cannot be in the past',
  'any.required': 'Expiry date is required'
}),

  usageLimit: Joi.number().min(1).optional().allow(null).messages({
    'number.base': 'Usage limit must be a number',
    'number.min': MESSAGES.COUPON.INVALID_USAGE_LIMIT
  }),
  isActive: Joi.boolean().default(true)
}).messages({
  'object.unknown': 'Invalid fields provided'
});