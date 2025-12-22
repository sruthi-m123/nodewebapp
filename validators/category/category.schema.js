import Joi from 'joi';

export const categorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required'
  }),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active')
});

export const categoryStatusSchema = Joi.object({
  status: Joi.alternatives().try(
    Joi.string().valid('active','inactive'),
    Joi.boolean()
  ).required()
});
