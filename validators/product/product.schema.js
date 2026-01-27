import Joi from 'joi';
import { objectIdSchema } from '../common/objectId.schema.js';

export const productSchema = Joi.object({
  productName: Joi.string().required().min(3).max(200).messages({
    'string.base': 'Product name must be a string',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name must not exceed 200 characters',
    'any.required': 'Product name is required'
  }),
  description: Joi.string().optional().max(1000).messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description must not exceed 1000 characters'
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive',
    'any.required': 'Price is required'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock is required'
  }),
  category: objectIdSchema.required(), 
  sku: Joi.string().required().messages({ 'any.required': 'SKU is required' }),
  color: Joi.string().required(),
  isNewArrival: Joi.string().optional().valid('true', 'false', 'on'), 
  isActive: Joi.string().optional().valid('true', 'false'), 
  removedImages: Joi.string().optional().allow('').messages({ 
    'string.base': 'Removed images must be a valid JSON string'
  }),
   id: objectIdSchema.optional() 
}).messages({
  'object.unknown': 'Invalid fields provided'
});