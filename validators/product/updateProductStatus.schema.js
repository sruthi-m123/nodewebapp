import Joi from "joi";

export const updateProductStatusBodySchema = Joi.object({
  isActive: Joi.boolean().required().messages({
    "boolean.base": "isActive must be true or false",
    "any.required": "isActive is required"
  })
});
