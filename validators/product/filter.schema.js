
import Joi from 'joi';
export const filterSchema = Joi.object({
    search: Joi.string().allow('').optional(),
    sort: Joi.string().valid('price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest').default('newest'),
    categories: Joi.array().items(Joi.string()).optional(),
    availability: Joi.array().items(Joi.string().valid('in-stock', 'out-stock')).optional(),
    colors: Joi.array().items(Joi.string()).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(12)
});