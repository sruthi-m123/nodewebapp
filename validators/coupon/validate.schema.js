// validators/coupon/validateCouponSchema.js
import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';

export const validateCouponSchema = Joi.object({
  couponCode: Joi.string().trim().required().messages({
    'string.empty': MESSAGES.COUPON.CODE_REQUIRED,
    'any.required': MESSAGES.COUPON.CODE_REQUIRED
  }),
  // Included for retry payment flow — frontend sends cart items since there is no active cart
  retryCartItems: Joi.array().optional()
}).messages({
  'object.unknown': 'Invalid fields provided'
});