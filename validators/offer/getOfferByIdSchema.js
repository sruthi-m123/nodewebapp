import Joi from 'joi';
import { objectIdSchema } from '../common/objectId.schema.js'; 

export const getOfferByIdSchema = Joi.object({
  id: objectIdSchema, 
  offerId: objectIdSchema.optional() 
}).messages({
  'object.unknown': 'Invalid parameters provided'
});