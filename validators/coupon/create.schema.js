import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';

export const createCouponSchema = Joi.object({
  id: Joi.string().allow('').optional(), 

  code: Joi.string().trim().required().min(3).max(20).messages({
    'string.empty': MESSAGES.COUPON.CODE_REQUIRED,
    'string.min': 'Coupon code must be at least 3 characters',
    'string.max': 'Coupon code must not exceed 20 characters',
    'any.required': MESSAGES.COUPON.CODE_REQUIRED
  }),

  description: Joi.string().allow('').optional(),

  discountType: Joi.string().valid('percentage', 'fixed').required().messages({
    'any.only': 'Discount type must be percentage or fixed',
    'any.required': MESSAGES.COUPON.DISCOUNT_TYPE_REQUIRED
  }),
discountType: Joi.string()
  .valid('fixed', 'percentage')
  .required(),

discountValue: Joi.when('discountType', {
  is: 'percentage',
  then: Joi.number().min(1).max(99).required(),
  otherwise: Joi.number().min(1).required()
}),

  

  minCartValue: Joi.number().min(0).default(0).messages({
    'number.base': 'Minimum cart value must be a number',
    'number.min': 'Minimum cart value must be at least 0'
  }),

  validFrom: Joi.date().required(),

  validTill: Joi.date().min(Joi.ref('validFrom')).required().messages({
    'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
    'date.min': 'Expiry date cannot be before start date',
    'any.required': 'Expiry date is required'
  }),

  usageLimit: Joi.number().min(1).optional().allow(null).messages({
    'number.base': 'Usage limit must be a number',
    'number.min': MESSAGES.COUPON.INVALID_USAGE_LIMIT
  }),

  isActive: Joi.boolean().truthy('on').falsy('off').default(true)
}).messages({
  'object.unknown': 'Invalid fields provided'
});
