// validators/product/productFilterSchema.js (merged filter + shoppingQuery)
import Joi from 'joi';

export const productFilterSchema = Joi.object({
  search: Joi.string().allow('').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(12), 

  sort: Joi.string().valid('price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest').default('newest'),
  categories: Joi.array().items(Joi.string()).optional(), // Or use objectIdSchema if IDs
  availability: Joi.array().items(Joi.string().valid('in-stock', 'out-stock')).optional(),
  colors: Joi.array().items(Joi.string()).optional(),

  color: Joi.string().optional(), 
}).messages({
  'object.unknown': 'Invalid query parameters provided'
});

// Optional: Conditional logic example (if you want "simple" vs "advanced" mode)
export const productFilterSchemaSimple = productFilterSchema.fork(['availability', 'colors'], (schema) => schema.optional());