import Joi from 'joi';

export const signupSchema = Joi.object({
    name: Joi.string().trim().pattern(/^[A-Za-z\s]+$/).min(2).max(50).required().messages({
        'string.empty': 'Please enter a valid name',
        'string.pattern.base': 'Name can only contain alphabets and spaces',
        'string.min': 'Name must be at least 2 characters long'
    }),
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email address is required',
        'string.email': 'Invalid email format'
    }),
    phone: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required().messages({
        'string.pattern.base': 'Enter a valid 10-digit Indian phone number',
        'string.empty': 'Phone number is required'
    }),
    password: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain both letters and numbers'
    }),
    confirmPassword: Joi.any().equal(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match'
    }),
    referralCode: Joi.string().trim().uppercase().pattern(/^[A-Z]{3}[0-9]{4}$/).optional().allow('', null).messages({
        'string.pattern.base': 'Referral code must be in the format ABC1234'
    })
}).options({ stripUnknown: true });
