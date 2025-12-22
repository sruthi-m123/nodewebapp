// validators/razorpayValidator.js
import Joi from 'joi';

export const createOrderSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  })
});

export const verifyPaymentSchema = Joi.object({
  razorpay_order_id: Joi.string().required().messages({
    'string.base': 'Razorpay order ID must be a string',
    'any.required': 'Razorpay order ID is required'
  }),
  razorpay_payment_id: Joi.string().required().messages({
    'string.base': 'Razorpay payment ID must be a string',
    'any.required': 'Razorpay payment ID is required'
  }),
  razorpay_signature: Joi.string().required().messages({
    'string.base': 'Razorpay signature must be a string',
    'any.required': 'Razorpay signature is required'
  }),
  dborderId: Joi.string().required().messages({
    'string.base': 'Database order ID must be a string',
    'any.required': 'Database order ID is required'
  })
});

export const markPaymentFailedSchema = Joi.object({
  dborderId: Joi.string().required().messages({
    'string.base': 'Database order ID must be a string',
    'any.required': 'Database order ID is required'
  })
});