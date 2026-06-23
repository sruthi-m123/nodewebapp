import Joi from "joi";
import { objectIdSchema } from "../common/objectId.schema.js";
export const getProductDetailSchema = Joi.object({
   productId:objectIdSchema
});
