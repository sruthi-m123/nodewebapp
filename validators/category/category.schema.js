import Joi from 'joi';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { objectIdSchema } from '../common/objectId.schema.js';


export const categorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required'
  }),
  description: Joi.string().allow('', null),

  isActive:Joi.boolean()
  .truthy("true")
  .falsy("false")
  .default(true)
});

export const categoryStatusSchema = Joi.object({
 isActive: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .required()
});

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
  req.validatedStatusData=value;
  next()
};


export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),

  description: Joi.string().allow("", null).optional(),

  isActive: Joi.boolean()
    .truthy("true")
    .falsy("false")
    .optional()
});

export const getCategoryByIdSchema=Joi.object({
  id:objectIdSchema.required()
})