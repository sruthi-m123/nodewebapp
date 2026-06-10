// validators/coupon/validateCouponSchema.js
import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';

export const validateCouponSchema = Joi.object({
  couponCode: Joi.string().trim().required().messages({
    'string.empty': MESSAGES.COUPON.CODE_REQUIRED,
    'any.required': MESSAGES.COUPON.CODE_REQUIRED
  }),
//  cartValue: Joi.number().min(0).required().messages({
//   'number.base': 'Cart value must be a number',
//   'number.min': 'Cart value must be at least 0',
//   'any.required': 'Cart value is required'
// })

}).messages({
  'object.unknown': 'Invalid fields provided'
});