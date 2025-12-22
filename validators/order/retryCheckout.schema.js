import Joi from "joi";


export const retryCheckoutSchema = Joi.object({
    couponCode: Joi.string().trim().uppercase().optional(),
    couponId: Joi.string().optional(),
    retryCartItems: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.number().min(0).required(),
            originalPrice: Joi.number().min(0).required(),
            discountedPrice: Joi.number().min(0).optional().allow(null),
            quantity: Joi.number().min(1).required()
        })
    ).optional()
}).or('couponCode', 'couponId');

