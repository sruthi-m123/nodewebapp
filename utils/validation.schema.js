import Joi from 'joi';
import { MESSAGES } from './messages.js';

export const categorySchema=Joi.object({
    name:Joi.string().trim().required().messages({
'string.empty': 'Category name is required',
    'any.required': 'Category name is required',
    }),
    description: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive').default('active'), 
});

export const categoryStatusSchema=Joi.object({
    status:Joi.alternatives()
    .try(Joi.string().valid('active','inactive'),Joi.boolean())
    .required()
    .messages({
         'any.only': 'Status must be either active or inactive',
      'any.required': 'Status is required',
    })
})



export const productSchema = Joi.object({
  productName: Joi.string().trim().required().messages({
    "string.empty": "Product name is required",
  }),
  category: Joi.string().trim().required().messages({
    "string.empty": "Category is required",
  }),
  description: Joi.string().allow("", null),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "any.required": "Price is required",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "any.required": "Stock is required",
  }),
  color: Joi.string().allow("", null),
  isNewArrival: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
});


export const addressSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),

  building: Joi.string().trim().required().messages({
    "string.empty": "Building / House details are required",
    "any.required": "Building / House details are required",
  }),

  city: Joi.string().trim().required().messages({
    "string.empty": "City is required",
    "any.required": "City is required",
  }),

  state: Joi.string().trim().required().messages({
    "string.empty": "State is required",
    "any.required": "State is required",
  }),

  pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.empty": "Pincode is required",
      "string.pattern.base": "Pincode must be exactly 6 digits",
      "any.required": "Pincode is required",
    }),

  phone: Joi.string()
    .pattern(/^\d{10}$/)
    .disallow("0000000000", "1111111111", "2222222222", "3333333333", "4444444444", "5555555555", 
              "6666666666", "7777777777", "8888888888", "9999999999")
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "string.pattern.base": "Phone number must be exactly 10 digits",
      "any.invalid": "Phone number cannot have all digits the same",
      "any.required": "Phone number is required",
    }),

  altPhone: Joi.string()
    .allow("", null)
    .pattern(/^\d{10}$/)
    .disallow("0000000000", "1111111111", "2222222222", "3333333333", "4444444444", "5555555555", 
              "6666666666", "7777777777", "8888888888", "9999999999")
    .messages({
      "string.pattern.base": "Alternate phone must be exactly 10 digits",
      "any.invalid": "Alternate phone cannot have all digits the same",
    })
    .custom((value, helpers) => {
      const { phone } = helpers?.state?.ancestors[0] ?? {};
      if (value && value === phone) {
        return helpers.error("any.same");
      }
      return value;
    })
    .messages({
      "any.same": "Alternate phone cannot be the same as primary phone",
    }),

  addressType: Joi.string()
    .valid("home", "office", "other")
    .required()
    .messages({
      "any.only": "Address type must be one of: home, office, other",
      "any.required": "Address type is required",
    }),
});

export const createCouponSchema = Joi.object({
    description: Joi.string().trim().required().messages({
        'string.empty': MESSAGES.COUPON.DESCRIPTION_REQUIRED,
        'any.required': MESSAGES.COUPON.DESCRIPTION_REQUIRED
    }),
    code: Joi.string().trim().uppercase().required().messages({
        'string.empty': MESSAGES.COUPON.CODE_REQUIRED,
        'any.required': MESSAGES.COUPON.CODE_REQUIRED
    }),
    discountType: Joi.string().valid('percentage', 'fixed').required().messages({
        'any.only': 'Discount type must be either percentage or fixed',
        'any.required': MESSAGES.COUPON.DISCOUNT_TYPE_REQUIRED
    }),
    discountValue: Joi.alternatives().conditional('discountType', {
        is: 'fixed',
        then: Joi.number().min(0).required().messages({
            'number.base': 'Discount value must be a number',
            'number.min': 'Discount value must be at least 0',
            'any.required': MESSAGES.COUPON.DISCOUNT_VALUE_REQUIRED
        }),
        otherwise: Joi.number().min(0).max(100).required().messages({
            'number.base': 'Discount value must be a number',
            'number.min': 'Discount value must be at least 0',
            'number.max': 'Discount value cannot exceed 100%',
            'any.required': MESSAGES.COUPON.DISCOUNT_VALUE_REQUIRED
        })
    }),
    redeemAmount: Joi.number().min(0).required().messages({
        'number.base': 'Redeem amount must be a number',
        'number.min': 'Redeem amount must be at least 0',
        'any.required': 'Redeem amount is required'
    }),
    minCartValue: Joi.number().min(0).required().messages({
        'number.base': 'Minimum cart value must be a number',
        'number.min': 'Minimum cart value must be at least 0',
        'any.required': 'Minimum cart value is required'
    }),
    validFrom: Joi.date().iso().required().messages({
        'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'date.format': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'any.required': MESSAGES.COUPON.DATES_REQUIRED
    }),
    validTill: Joi.date().iso().greater(Joi.ref('validFrom')).required().messages({
        'date.base': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'date.format': MESSAGES.COUPON.INVALID_DATE_FORMAT,
        'date.greater': MESSAGES.COUPON.INVALID_DATE_RANGE,
        'any.required': MESSAGES.COUPON.DATES_REQUIRED
    }),
    usageLimit: Joi.number().min(1).optional().allow(null).messages({
        'number.base': 'Usage limit must be a number',
        'number.min': MESSAGES.COUPON.INVALID_USAGE_LIMIT
    }),
    isActive: Joi.boolean().default(true)
});

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

export const validateCouponSchema = Joi.object({
    code: Joi.string().trim().uppercase().required().messages({
        'string.empty': 'Coupon code is required',
        'any.required': 'Coupon code is required'
    }),
    cartValue: Joi.number().min(0).required().messages({
        'number.base': 'Cart value must be a number',
        'number.min': 'Cart value must be at least 0',
        'any.required': 'Cart value is required'
    })
});


export const createOfferSchema = Joi.object({
    title: Joi.string().trim().required().messages({
        'string.empty': MESSAGES.OFFER.TITLE_REQUIRED,
        'any.required': MESSAGES.OFFER.TITLE_REQUIRED
    }),
    type: Joi.string().valid('percentage', 'fixed', 'flat').required().messages({
        'any.only': 'Offer type must be percentage, fixed, or flat',
        'any.required': MESSAGES.OFFER.TYPE_REQUIRED
    }),
    discountValue: Joi.number().min(0).required().messages({
        'number.base': 'Discount value must be a number',
        'number.min': 'Discount value must be at least 0',
        'any.required': MESSAGES.OFFER.DISCOUNT_VALUE_REQUIRED
    }),
    applicableTo: Joi.string().valid('all', 'category', 'product').required().messages({
        'any.only': 'Applicable to must be all, category, or product',
        'any.required': MESSAGES.OFFER.APPLICABLE_TO_REQUIRED
    }),
    applicableItems: Joi.when('applicableTo', {
        is: Joi.valid('category', 'product'),
        then: Joi.array().min(1).required().messages({
            'array.min': 'Please select at least one applicable item',
            'any.required': 'Please select applicable items'
        }),
        otherwise: Joi.optional()
    }),
    startDate: Joi.date().iso().required().messages({
        'date.base': MESSAGES.OFFER.INVALID_DATE_FORMAT,
        'date.format': MESSAGES.OFFER.INVALID_DATE_FORMAT,
        'any.required': MESSAGES.OFFER.START_DATE_REQUIRED
    }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
        'date.base': MESSAGES.OFFER.INVALID_DATE_FORMAT,
        'date.format': MESSAGES.OFFER.INVALID_DATE_FORMAT,
        'date.greater': MESSAGES.OFFER.INVALID_DATE_RANGE,
        'any.required': MESSAGES.OFFER.END_DATE_REQUIRED
    }),
    minOrderValue: Joi.number().min(0).default(0).messages({
        'number.base': 'Minimum order value must be a number',
        'number.min': 'Minimum order value must be at least 0'
    }),
    maxDiscount: Joi.when('type', {
        is: 'percentage',
        then: Joi.number().min(0).optional().allow(null),
        otherwise: Joi.optional().allow(null)
    }).messages({
        'number.base': 'Maximum discount must be a number',
        'number.min': 'Maximum discount must be at least 0'
    }),
    usageLimit: Joi.number().min(1).optional().allow(null).messages({
        'number.base': 'Usage limit must be a number',
        'number.min': MESSAGES.OFFER.INVALID_USAGE_LIMIT
    }),
    isActive: Joi.boolean().default(true)
});

export const updateOfferSchema = Joi.object({
    title: Joi.string().trim().optional(),
    type: Joi.string().valid('percentage', 'fixed', 'flat').optional(),
    discountValue: Joi.number().min(0).optional(),
    applicableTo: Joi.string().valid('all', 'category', 'product').optional(),
    applicableItems: Joi.when('applicableTo', {
        is: Joi.valid('category', 'product'),
        then: Joi.array().min(1).required().messages({
            'array.min': 'Please select at least one applicable item',
            'any.required': 'Please select applicable items'
        }),
        otherwise: Joi.optional()
    }),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    minOrderValue: Joi.number().min(0).optional(),
    maxDiscount: Joi.when('type', {
        is: 'percentage',
        then: Joi.number().min(0).optional().allow(null),
        otherwise: Joi.optional().allow(null)
    }),
    usageLimit: Joi.number().min(1).optional().allow(null),
    isActive: Joi.boolean().optional()
}).custom((value, helpers) => {
    if (value.startDate && value.endDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        
        if (end <= start) {
            return helpers.error('date.invalidRange', {
                message: MESSAGES.OFFER.INVALID_DATE_RANGE
            });
        }
    }
    
    if (value.type === 'fixed' && value.applicableTo && value.applicableTo !== 'all') {
        if (!value.applicableItems || !Array.isArray(value.applicableItems) || value.applicableItems.length === 0) {
            return helpers.error('array.min', {
                message: `Please select at least one ${value.applicableTo === 'category' ? 'category' : 'product'}`
            });
        }
    }
    
    return value;
}).messages({
    'date.invalidRange': MESSAGES.OFFER.INVALID_DATE_RANGE
});
export const applyCouponSchema = Joi.object({
    couponCode: Joi.string().trim().uppercase().optional().messages({
        'string.empty': 'Coupon code is required'
    }),
    couponId: Joi.string().optional(),
    retryCartItems: Joi.array().optional()
}).or('couponCode', 'couponId').messages({
    'object.missing': 'Either couponCode or couponId is required'
});

export const retryCheckoutSchema = Joi.object({
    couponCode: Joi.string().trim().uppercase().optional(),
    couponId: Joi.string().optional(),
    retryCartItems: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.number().min(0).required(),
            originalPrice: Joi.number().min(0).required(),
            discountedPrice: Joi.number().min(0).optional().allow(null),
            quantity: Joi.number().min(1).required()
        })
    ).optional()
}).or('couponCode', 'couponId');


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

export const getOrderDetailsSchema=Joi.object({
  orderId:Joi.string().required().messages({
    'string.empty':'Order Id is required',
    'any.required':'Order Id is required'
  })
});

export const cancelOrderSchema=Joi.object({
  orderId:Joi.string().required().messages({
    'string.empty':'order Id is required',
    'any.required':'Order Id is required'
  }),

 reason: Joi.string().optional(),
    itemId: Joi.string().optional(),
    customReason: Joi.string().optional(),
    ItemsIds: Joi.array().items(Joi.string()).optional()
}).custom((value, helpers) => {
   
    if (!value.reason && !value.customReason) {
        return helpers.error('any.custom', {
            message: 'Either reason or customReason is required'
        });
    }
    return value;
});

export const returnOrderSchema = Joi.object({
    orderId: Joi.string().required().messages({
        'string.empty': 'Order ID is required',
        'any.required': 'Order ID is required'
    }),
    reason: Joi.string().optional(),
    itemId: Joi.string().optional(),
    ItemsIds: Joi.array().items(Joi.string()).optional(),
    customReason: Joi.string().optional(),
    notes: Joi.string().allow('').optional(),
    status: Joi.string().optional()
}).custom((value, helpers) => {
    if (!value.reason && !value.customReason) {
        return helpers.error('any.custom', {
            message: 'Either reason or customReason is required'
        });
    }
    return value;
});

export const getProductDetailSchema = Joi.object({
    id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
    })
});

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


exports.emailChangeSchema = Joi.object({
    newEmail: Joi.string().email().required().messages({
        'string.email': 'Valid email is required',
        'string.empty': 'Email is required'
    })
});

exports.verifyOtpSchema = Joi.object({
    enteredOtp: Joi.string().pattern(/^[0-9]{6}$/).required().messages({
        'string.pattern.base': 'OTP must be 6 digits',
        'string.empty': 'OTP is required'
    })
})

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



export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({ 'string.empty': 'Name is required' }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({ 'string.pattern.base': 'Valid phone number is required' }),
  email: Joi.string().email().required().messages({ 'string.email': 'Valid email is required' }),
  password: Joi.string().min(6).required().messages({ 'string.min': 'Password must be at least 6 characters' }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' }),
  referralCode: Joi.string().optional().allow('')
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({ 'string.email': 'Valid email is required' }),
  password: Joi.string().min(6).required().messages({ 'string.min': 'Password is required' })
});

export const otpSchema = Joi.object({
  otp: Joi.string().length(6).pattern(/^[0-9]{6}$/).required().messages({ 'string.pattern.base': 'Valid 6-digit OTP is required' })
});

export const resetPasswordSchema = Joi.object({
  userId: Joi.string().required().messages({ 'string.empty': 'User ID is required' }),
  newPassword: Joi.string().min(6).required().messages({ 'string.min': 'Password must be at least 6 characters' }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({ 'any.only': 'Passwords do not match' })
});
