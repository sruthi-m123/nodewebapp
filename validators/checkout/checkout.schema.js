import Joi from 'joi';

export const addAddressSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({ 'string.empty': 'Name is required' }),
  building: Joi.string().min(1).required().messages({ 'string.empty': 'Building is required' }),
  landmark: Joi.string().optional().allow(''),
  city: Joi.string().min(2).required().messages({ 'string.empty': 'City is required' }),
  state: Joi.string().min(2).required().messages({ 'string.empty': 'State is required' }),
  pincode: Joi.string().length(6).pattern(/^[0-9]{6}$/).required()
    .messages({ 'string.pattern.base': 'Valid 6-digit pincode is required' }),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required()
    .messages({ 'string.pattern.base': 'Valid 10-digit phone is required' }),
  altPhone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('')
    .messages({ 'string.pattern.base': 'Valid 10-digit alternate phone is required' }),
  addressType: Joi.string().valid('home', 'work', 'other').required()
    .messages({ 'any.only': 'Valid address type is required' }),
  isDefault: Joi.boolean().optional()
});

export const placeOrderSchema = Joi.object({
  addressId: Joi.string().required().messages({ 'string.empty': 'Address ID is required' }),
  paymentMethod: Joi.string().valid('cod', 'wallet', 'netbanking').required()
    .messages({ 'any.only': 'Valid payment method is required' }),
  appliedOffers: Joi.array().items(Joi.string()).optional(),
  isRetry: Joi.boolean().optional(),
   cartItems:Joi.array().items(

    Joi.object({
id:Joi.string().required(),
quantity:Joi.number().required(),
name:Joi.string(),
image:Joi.string(),
price:Joi.string(),
price: Joi.number(),
    originalPrice: Joi.number(),
    discountedPrice: Joi.allow(null),
    isBuyNow: Joi.boolean()

    })
   )
});

export const applyOfferSchema = Joi.object({
  offerId: Joi.string().required().messages({ 'string.empty': 'Offer ID is required' })
});

export const buyNowSchema = Joi.object({
  productId: Joi.string().required().messages({ 'string.empty': 'Product ID is required' }),
  variant: Joi.string().optional().allow(''),
  quantity: Joi.number().integer().min(1).required()
    .messages({ 'number.min': 'Quantity must be at least 1' }),
  price: Joi.number().min(0).optional()
});
