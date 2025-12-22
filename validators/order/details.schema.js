import Joi from "joi";
export const getOrderDetailsSchema=Joi.object({
  orderId:Joi.string().required().messages({
    'string.empty':'Order Id is required',
    'any.required':'Order Id is required'
  })
});