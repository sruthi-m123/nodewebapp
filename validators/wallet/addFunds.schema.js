import Joi from "joi";

export const addFundsSchema=Joi.object({
  amount: Joi.number()
    .positive()
    .precision(2)
    .required()
    .messages({
      "number.base": "Amount must be a number",
      "number.positive": "Amount must be greater than 0",
      "number.precision": "Amount can have at most 2 decimal places",
      "any.required": "Amount is required"
    })   
})

export const verifyWalletPaymentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required()
}).options({ stripUnknown: true });