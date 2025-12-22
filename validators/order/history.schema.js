import Joi from "joi";

export const getOrderHistorySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(50).default(6).messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
    }),
    search: Joi.string().trim().allow('').default('').messages({
        'string.base': 'Search query must be a string'
    })
});