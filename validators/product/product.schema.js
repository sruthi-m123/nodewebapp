import Joi from 'joi';

export const productSchema = Joi.object({
  productName: Joi.string().trim().required(),
  category: Joi.string().trim().required(),
  description: Joi.string().allow("", null),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  color: Joi.string().allow("", null),
  isNewArrival: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true)
});
