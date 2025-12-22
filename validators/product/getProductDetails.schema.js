import Joi from "joi";

export const getProductDetailSchema = Joi.object({
    id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
    })
});
