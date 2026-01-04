import Joi from "joi";

export const emailChangeSchema = Joi.object({
    newEmail: Joi.string().email().required().messages({
        'string.email': 'Valid email is required',
        'string.empty': 'Email is required'
    })
});
