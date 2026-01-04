import { STATUS_CODES } from "../utils/statusCodes.js";

export const validate=(schema,property='body')=>{
    return(req,res,next)=>{
        const {error,value}=schema.validate(req[property],{
            abortEarly:false
        });
        if(error){
            return res.status(STATUS_CODES.BAD_REQUEST).json({
                message:"validation error",
                errors:error.details.amp(d=>d.message)
            });
        }
        req[property]=value;
        next();
    }
}