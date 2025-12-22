import Joi from 'joi';


export const validateCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().required().messages({
        'string.empty': 'Coupon code is required',
        'any.required': 'Coupon code is required'
    }),
    cartValue: Joi.number().min(0).required().messages({
        'number.base': 'Cart value must be a number',
        'number.min': 'Cart value must be at least 0',
        'any.required': 'Cart value is required'
    })
});
