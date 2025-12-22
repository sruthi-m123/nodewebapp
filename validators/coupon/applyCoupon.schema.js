import Joi from "joi";

export const applyCouponSchema = Joi.object({
    couponCode: Joi.string().trim().uppercase().optional().messages({
        'string.empty': 'Coupon code is required'
    }),
    couponId: Joi.string().optional(),
    retryCartItems: Joi.array().optional()
}).or('couponCode', 'couponId').messages({
    'object.missing': 'Either couponCode or couponId is required'
});