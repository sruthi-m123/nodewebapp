import Joi from "joi";

exports.changePasswordSchema = Joi.object({
    currentPassword: Joi.string().min(6).required().messages({
        'string.min': 'Current password must be at least 6 characters',
        'string.empty': 'Current password is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
        'string.min': 'New password must be at least 6 characters',
        'string.empty': 'New password is required'
    })
});
