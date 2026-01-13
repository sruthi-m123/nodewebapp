import Joi from "joi";

export const removeWishlistSchema = Joi.object({
  itemId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.base": "Wishlist item ID must be a string",
      "string.hex": "Invalid Wishlist item ID",
      "string.length": "Invalid Wishlist item ID length",
      "any.required": "Wishlist item ID is required"
    })
});
