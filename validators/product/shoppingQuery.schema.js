
import Joi from'joi';
export const shoppingQuerySchema = Joi.object({
    availability: Joi.string().valid('In Stock', 'out of stock', 'all').default('all'),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    color: Joi.string().optional(),
    search: Joi.string().allow('').optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(6)
});