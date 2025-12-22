import Joi from "joi";
exports.updateProfileSchema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters'
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        'string.pattern.base': 'Phone must be 10 digits',
        'string.empty': 'Phone is required'
    }),
    gender: Joi.string().valid('Male', 'Female', 'Other', 'Prefer not say').default('Prefer not say').messages({
        'any.only': 'Invalid gender selection'
    })
});

