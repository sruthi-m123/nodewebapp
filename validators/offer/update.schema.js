// validators/offer/updateOfferSchema.js
import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';
import { objectIdSchema } from '../common/objectId.schema.js'; // Reuse for IDs

export const updateOfferSchema = Joi.object({
  title: Joi.string().trim().optional(),
  type: Joi.string().valid('percentage', 'fixed', 'flat').optional(),
  discountValue: Joi.when('type', {
  is: 'percentage',
  then: Joi.number().min(1).max(99).required(),
  otherwise: Joi.number().min(1).required()
}),
  applicableTo: Joi.string().valid('all', 'category', 'product').optional(),
  applicableItems: Joi.when('applicableTo', {
    is: Joi.valid('category', 'product'),
    then: Joi.array().min(1).items(objectIdSchema).optional().messages({ // Optional for partial updates
      'array.min': 'Please select at least one applicable item',
      'array.includes': 'Each applicable item must be a valid ID'
    }),
    otherwise: Joi.optional()
  }),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional().messages({
    'date.base': MESSAGES.OFFER.INVALID_DATE_FORMAT,
    'date.format': MESSAGES.OFFER.INVALID_DATE_FORMAT,
    'date.greater': MESSAGES.OFFER.INVALID_DATE_RANGE
  }),
  minOrderValue: Joi.number().min(0).optional(),
  maxDiscount: Joi.when(Joi.ref('type'), { // Use ref for conditional
    is: 'percentage',
    then: Joi.number().min(0).optional().allow(null).messages({
      'number.base': 'Maximum discount must be a number',
      'number.min': 'Maximum discount must be at least 0'
    }),
    otherwise: Joi.optional().allow(null)
  }),
  usageLimit: Joi.number().min(1).optional().allow(null),
  isActive: Joi.boolean().optional()
}).messages({
  'object.unknown': 'Invalid fields provided'
});