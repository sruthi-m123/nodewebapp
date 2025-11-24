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
})