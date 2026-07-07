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

export const loginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email address is required',
        'string.email': 'Invalid email format'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required'
    })
}).options({ stripUnknown: true });

export const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email address is required',
        'string.email': 'Invalid email format'
    })
}).options({ stripUnknown: true });

export const otpVerifySchema = Joi.object({
    otp: Joi.string().trim().pattern(/^\d{6}$/).required().messages({
        'string.empty': 'OTP is required',
        'string.pattern.base': 'OTP must be a 6-digit number'
    })
}).options({ stripUnknown: true });

export const emailOtpSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email address is required',
        'string.email': 'Invalid email format'
    })
}).options({ stripUnknown: true });

export const resetPasswordSchema = Joi.object({
    userId: Joi.string().required().messages({
        'string.empty': 'User ID is required'
    }),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[A-Za-z])(?=.*\d)/).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain both letters and numbers'
    }),
    confirmPassword: Joi.any().equal(Joi.ref('newPassword')).required().messages({
        'any.only': 'Passwords do not match'
    })
}).options({ stripUnknown: true });

export const adminLoginSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email address is required',
        'string.email': 'Invalid email format'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required'
    })
}).options({ stripUnknown: true });

export const toggleBlockSchema = Joi.object({
    userId: Joi.string().required().messages({
        'string.empty': 'User ID is required'
    }),
    isBlocked: Joi.boolean().required().messages({
        'any.required': 'Block status is required'
    })
}).options({ stripUnknown: true });

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'partially_returned', 'partially_cancelled', 'return_requested', 'payment_failed', 'payment_pending', 'paid').required().messages({
        'any.only': 'Invalid order status',
        'any.required': 'Status is required'
    })
}).options({ stripUnknown: true });

export const verifyReturnRequestSchema = Joi.object({
    action: Joi.string().valid('approve', 'reject').required().messages({
        'any.only': 'Action must be approve or reject',
        'any.required': 'Action is required'
    }),
    adminNotes: Joi.string().allow('', null).optional(),
    itemIds: Joi.array().items(Joi.string()).optional(),
    rejectReason: Joi.string().allow('', null).optional()
}).options({ stripUnknown: true });

export const contactMessageSchema = Joi.object({
    name: Joi.string().trim().required().messages({
        'string.empty': 'Name is required'
    }),
    email: Joi.string().trim().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Invalid email format'
    }),
    message: Joi.string().trim().required().messages({
        'string.empty': 'Message is required'
    })
}).options({ stripUnknown: true });
