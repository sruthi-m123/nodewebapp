import Joi from "joi";
export const returnOrderSchema = {
  params: Joi.object({
    orderId: Joi.string().required().messages({
      'string.empty': 'Order ID is required',
      'any.required': 'Order ID is required'
    })
  }),

  body: Joi.object({
    reason: Joi.string().optional(),
    itemId: Joi.string().optional(),
    ItemsIds: Joi.array().items(Joi.string()).optional(),
    customReason: Joi.string().optional(),
    notes: Joi.string().allow('').optional(),
    status: Joi.string().optional(),
    returnRequest: Joi.boolean().optional() 
  }).custom((value, helpers) => {
    if (!value.reason && !value.customReason) {
      return helpers.message('Either reason or customReason is required');
    }
    return value;
  })
};