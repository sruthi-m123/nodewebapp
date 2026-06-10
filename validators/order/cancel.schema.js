import Joi from "joi";

export const cancelOrderSchema=Joi.object({


 reason: Joi.string().optional(),
    itemId: Joi.string().optional(),
    customReason: Joi.string().optional(),
    ItemsIds: Joi.array().items(Joi.string()).optional()
}).custom((value, helpers) => {
   
    if (!value.reason && !value.customReason) {
        return helpers.error('any.custom', {
            message: 'Either reason or customReason is required'
        });
    }
    return value;
});
