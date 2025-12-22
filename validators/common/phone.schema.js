import Joi from 'joi';

export const phoneSchema = Joi.string()
  .pattern(/^\d{10}$/)
  .disallow(
    "0000000000","1111111111","2222222222","3333333333",
    "4444444444","5555555555","6666666666","7777777777",
    "8888888888","9999999999"
  )
  .messages({
    "string.pattern.base": "Phone number must be exactly 10 digits",
    "any.invalid": "Phone number cannot have all digits the same"
  });
