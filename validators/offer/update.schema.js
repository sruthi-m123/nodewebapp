import Joi from 'joi';
import { MESSAGES } from '../../utils/messages';



export const updateOfferSchema = Joi.object({
    title: Joi.string().trim().optional(),
    type: Joi.string().valid('percentage', 'fixed', 'flat').optional(),
    discountValue: Joi.number().min(0).optional(),
    applicableTo: Joi.string().valid('all', 'category', 'product').optional(),
    applicableItems: Joi.when('applicableTo', {
        is: Joi.valid('category', 'product'),
        then: Joi.array().min(1).required().messages({
            'array.min': 'Please select at least one applicable item',
            'any.required': 'Please select applicable items'
        }),
        otherwise: Joi.optional()
    }),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    minOrderValue: Joi.number().min(0).optional(),
    maxDiscount: Joi.when('type', {
        is: 'percentage',
        then: Joi.number().min(0).optional().allow(null),
        otherwise: Joi.optional().allow(null)
    }),
    usageLimit: Joi.number().min(1).optional().allow(null),
    isActive: Joi.boolean().optional()
}).custom((value, helpers) => {
    if (value.startDate && value.endDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        
        if (end <= start) {
            return helpers.error('date.invalidRange', {
                message: MESSAGES.OFFER.INVALID_DATE_RANGE
            });
        }
    }
    
    if (value.type === 'fixed' && value.applicableTo && value.applicableTo !== 'all') {
        if (!value.applicableItems || !Array.isArray(value.applicableItems) || value.applicableItems.length === 0) {
            return helpers.error('array.min', {
                message: `Please select at least one ${value.applicableTo === 'category' ? 'category' : 'product'}`
            });
        }
    }
    
    return value;
}).messages({
    'date.invalidRange': MESSAGES.OFFER.INVALID_DATE_RANGE
});