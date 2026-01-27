// validators/offer/createOfferSchema.js
import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';
import { objectIdSchema } from '../common/objectId.schema.js'; // Reuse for IDs

export const createOfferSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': MESSAGES.OFFER.TITLE_REQUIRED,
    'any.required': MESSAGES.OFFER.TITLE_REQUIRED
  }),
  type: Joi.string().valid('percentage', 'fixed', 'flat').required().messages({
    'any.only': 'Offer type must be percentage, fixed, or flat',
    'any.required': MESSAGES.OFFER.TYPE_REQUIRED
  }),
  discountValue: Joi.number().min(0).required().messages({
    'number.base': 'Discount value must be a number',
    'number.min': 'Discount value must be at least 0',
    'any.required': MESSAGES.OFFER.DISCOUNT_VALUE_REQUIRED
  }),
  applicableTo: Joi.string().valid('all', 'category', 'product').required().messages({
    'any.only': 'Applicable to must be all, category, or product',
    'any.required': MESSAGES.OFFER.APPLICABLE_TO_REQUIRED
  }),
  applicableItems: Joi.when('applicableTo', {
    is: Joi.valid('category', 'product'),
    then: Joi.array().min(1).items(objectIdSchema).required().messages({ // Reuse ObjectId for array items
      'array.min': 'Please select at least one applicable item',
      'any.required': 'Please select applicable items',
      'array.includes': 'Each applicable item must be a valid ID' // For ObjectId pattern
    }),
    otherwise: Joi.optional()
  }),
  startDate: Joi.date().iso().required().messages({
    'date.base': MESSAGES.OFFER.INVALID_DATE_FORMAT,
    'date.format': MESSAGES.OFFER.INVALID_DATE_FORMAT,
    'any.required': MESSAGES.OFFER.START_DATE_REQUIRED
  }),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
    'date.base': MESSAGES.OFFER.INVALID_DATE_FORMAT,
    'date.format': MESSAGES.OFFER.INVALID_DATE_FORMAT,
    'date.greater': MESSAGES.OFFER.INVALID_DATE_RANGE,
    'any.required': MESSAGES.OFFER.END_DATE_REQUIRED
  }),
  minOrderValue: Joi.number().min(0).default(0).messages({
    'number.base': 'Minimum order value must be a number',
    'number.min': 'Minimum order value must be at least 0'
  }),
  maxDiscount: Joi.when('type', {
    is: 'percentage',
    then: Joi.number().min(0).optional().allow(null).messages({
      'number.base': 'Maximum discount must be a number',
      'number.min': 'Maximum discount must be at least 0'
    }),
    otherwise: Joi.optional().allow(null)
  }),
  usageLimit: Joi.number().min(1).optional().allow(null).messages({
    'number.base': 'Usage limit must be a number',
    'number.min': MESSAGES.OFFER.INVALID_USAGE_LIMIT
  }),
  isActive: Joi.boolean().default(true)
}).messages({
  'object.unknown': 'Invalid fields provided'
});