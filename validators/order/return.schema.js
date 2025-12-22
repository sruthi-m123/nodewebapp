import Joi from "joi";
export const returnOrderSchema = Joi.object({
    orderId: Joi.string().required().messages({
        'string.empty': 'Order ID is required',
        'any.required': 'Order ID is required'
    }),
    reason: Joi.string().optional(),
    itemId: Joi.string().optional(),
    ItemsIds: Joi.array().items(Joi.string()).optional(),
    customReason: Joi.string().optional(),
    notes: Joi.string().allow('').optional(),
    status: Joi.string().optional()
}).custom((value, helpers) => {
    if (!value.reason && !value.customReason) {
        return helpers.error('any.custom', {
            message: 'Either reason or customReason is required'
        });
    }
    return value;
});
