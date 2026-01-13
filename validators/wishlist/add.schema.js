import Joi from "joi";

export const addToWishlistSchema = Joi.object({
  productId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.base": "Product ID must be a string",
      "string.hex": "Invalid Product ID",
      "string.length": "Invalid Product ID length",
      "any.required": "Product ID is required"
    })
});
