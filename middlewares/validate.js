import { STATUS_CODES } from "../utils/statusCodes.js";
import logger from '../utils/logger.js';

export const validate=(schema,property='body')=>{
    return(req,res,next)=>{
        const {error,value}=schema.validate(req[property],{
            abortEarly:false
        });
        if(error){
            const messages=error.details.map(d=>d.message);

logger.warn("validation error at"+req.originalUrl);
logger.warn("Method:"+req.method);
 logger.warn("Errors: " + JSON.stringify(messages, null, 2));
      logger.warn("Payload: " + JSON.stringify(req[property], null, 2));



            return res.status(STATUS_CODES.BAD_REQUEST).json({
                message:"Invalid request data",
                
            });
        }
         req.validatedData = value;
        next();
    }
}