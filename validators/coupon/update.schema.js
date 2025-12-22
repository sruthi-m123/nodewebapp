import Joi from 'joi';
import { MESSAGES } from '../../utils/messages.js';

export const updateCouponSchema = Joi.object({
    description: Joi.string().trim().optional(),
    code: Joi.string().trim().uppercase().optional(),
    discountType: Joi.string().valid('percentage', 'fixed').optional(),
    discountValue: Joi.alternatives().conditional('discountType', {
        is: 'fixed',
        then: Joi.number().min(0).optional(),
        otherwise: Joi.number().min(0).max(100).optional()
    }),
    redeemAmount: Joi.number().min(0).optional(),
    minCartValue: Joi.number().min(0).optional(),
    validFrom: Joi.date().iso().optional(),
    validTill: Joi.date().iso().optional(),
    usageLimit: Joi.number().min(1).optional().allow(null),
    isActive: Joi.boolean().optional()
}).custom((value, helpers) => {
    // Custom validation for date range when both dates are provided
    if (value.validFrom && value.validTill) {
        const validFrom = new Date(value.validFrom);
        const validTill = new Date(value.validTill);
        
        if (validTill <= validFrom) {
            return helpers.error('date.invalidRange', {
                message: MESSAGES.COUPON.INVALID_DATE_RANGE
            });
        }
    }
    return value;
}).messages({
    'date.invalidRange': MESSAGES.COUPON.INVALID_DATE_RANGE
});