// category.schema.js
import Joi from 'joi';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { objectIdSchema } from '../common/objectId.schema.js';

// Schema for CREATE category - image is handled by multer, not Joi
export const categorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required'
  }),
  description: Joi.string().allow('', null).max(500).messages({ 
    'string.max': 'Description cannot exceed 500 characters.'
  }),
  isActive: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .default(true),
  removeExistingImage: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .optional()
  // NOTE: image is NOT validated here because it's handled by multer as a file
});

// Schema for UPDATE category
export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).optional().messages({
    'string.min': 'Category name must be at least 2 characters'
  }),
  description: Joi.string().allow("", null).max(500).messages({
    'string.max': 'Description cannot exceed 500 characters.'
  }).optional(),
  isActive: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .optional(),
  removeExistingImage: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .optional()
});

// Schema for status update
export const categoryStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'inactive')
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Status must be either active or inactive'
    })
});

// Schema for get by ID
export const getCategoryByIdSchema = Joi.object({
  id: objectIdSchema.required()
});

// Validation middleware for category creation
export const validateCategory = (req, res, next) => {
  // Extract data from body (multer adds file to req.file)
  const data = {
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
    removeExistingImage: req.body.removeExistingImage
  };

  const { error, value } = categorySchema.validate(data);
  
  if (error) {
    const messages = error.details.map(d => d.message);
    
    logger.warn("Category validation failed at " + req.originalUrl);
    logger.warn("Errors: " + JSON.stringify(messages, null, 2));
    logger.warn("Payload: " + JSON.stringify(req.body, null, 2));
    
    const validationError = new Error(messages.join(', '));
    validationError.statusCode = STATUS_CODES.BAD_REQUEST;
    return next(validationError);
  }
  
  req.validatedData = value;
  next();
};

// Validation middleware for category update
export const validateCategoryUpdate = (req, res, next) => {
  const data = {
    name: req.body.name,
    description: req.body.description,
    isActive: req.body.isActive,
    removeExistingImage: req.body.removeExistingImage
  };

  const { error, value } = updateCategorySchema.validate(data);
  
  if (error) {
    const messages = error.details.map(d => d.message);
    
    logger.warn("Category update validation failed at " + req.originalUrl);
    logger.warn("Errors: " + JSON.stringify(messages, null, 2));
    logger.warn("Payload: " + JSON.stringify(req.body, null, 2));
    
    const validationError = new Error(messages.join(', '));
    validationError.statusCode = STATUS_CODES.BAD_REQUEST;
    return next(validationError);
  }
  
  req.validatedData = value;
  next();
};

// Status validation middleware
export const validateCategoryStatusBody = (req, res, next) => {
  const { error, value } = categoryStatusSchema.validate(req.body);
  if (error) {
    const messages = error.details.map(d => d.message);

    logger.warn("Category status validation failed at " + req.originalUrl);
    logger.warn("Errors: " + JSON.stringify(messages, null, 2));
    logger.warn("Payload: " + JSON.stringify(req.body, null, 2));

    const validationError = new Error("Invalid category status data");
    validationError.statusCode = STATUS_CODES.BAD_REQUEST;
    return next(validationError);
  }
  req.validatedStatusData = value;
  next();
};