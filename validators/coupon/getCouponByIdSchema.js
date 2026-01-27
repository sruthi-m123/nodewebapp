import Joi from 'joi';
import { objectIdSchema } from '../common/objectId.schema.js'; 
export const getCouponByIdSchema = Joi.object({
  id: objectIdSchema 
}).messages({
  'object.unknown': 'Invalid parameters provided'
});