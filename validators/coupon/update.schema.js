// validators/coupon/updateCouponSchema.js
import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';

export const updateCouponSchema = Joi.object({
  code: Joi.string().trim().optional().min(3).max(20).messages({
    'string.min': 'Coupon code must be at least 3 characters',
    'string.max': 'Coupon code must not exceed 20 characters'
  }),
  discountType: Joi.string().valid('percentage', 'fixed').optional().messages({
    'any.only': 'Discount type must be percentage or fixed'
  }),
  discountValue: Joi.number().min(0).optional().messages({
    'number.base': 'Discount value must be a number',
    'number.min': 'Discount value must be at least 0'
  }),
  minCartValue: Joi.number().min(0).optional().messages({
    'number.base': 'Minimum cart value must be a number',
    'number.min': 'Minimum cart value must be at least 0'
  }),
  expiryDate: Joi.date().min('now').optional().messages({
    'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
    'date.min': 'Expiry date cannot be in the past'
  }),
  usageLimit: Joi.number().min(1).optional().allow(null),
  isActive: Joi.boolean().optional()
}).messages({
  'object.unknown': 'Invalid fields provided'
});