import Joi from 'joi';

export const offerQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1).messages({
    'number.base': 'Page must be a number',
    'number.min': 'Page must be at least 1'
  }),
  type: Joi.string().valid('all', 'product', 'category').default('all').messages({
    'string.base': 'Type must be a string',
    'any.only': 'Type must be "all", "product", or "category"'
  })
}).messages({
  'object.unknown': 'Invalid query parameters provided'
});