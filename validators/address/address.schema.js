import Joi from 'joi';
import { phoneSchema } from '../common/phone.schema.js';
export const addressSchema = Joi.object({
  name: Joi.string().trim().pattern(/^[a-zA-Z\s.]+$/).required().messages({ 'string.pattern.base': 'Name must contain only letters, dots and spaces' }),
  building: Joi.string().trim().required(),
  landmark: Joi.string().trim().allow("", null),

  city: Joi.string().trim().required(),
  state: Joi.string().trim().required(),

  pincode: Joi.string().pattern(/^\d{6}$/).required(),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Enter a valid Indian mobile number.',
      'string.empty': 'Phone number is required.',
      'any.required': 'Phone number is required.'
    }),

  altPhone: phoneSchema
    .allow("", null)
    .custom((value, helpers) => {
      const { phone } = helpers.state.ancestors[0];
      if (value && value === phone) {
        return helpers.error("any.same");
      }
      return value;
    })
    .messages({
      "any.same": "Alternate phone cannot be the same as primary phone"
    }),

  addressType: Joi.string()
    .lowercase()
    .valid("home", "work", "other")
    .required(),

  isDefault: Joi.boolean().default(false),
  setAsDefault: Joi.boolean().default(false),
});
