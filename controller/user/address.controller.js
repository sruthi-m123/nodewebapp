import * as addressService from "../../service/user/address.service.js";
import { addressSchema } from "../../validators/address/address.schema.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { MESSAGES } from "../../utils/messages.js";
import logger from "../../utils/logger.js";


logger.debug("Available addressService functions",Object.keys(addressService))
export const getAddressPage=async (req,res)=>{
  logger.info('loading address page');
  if(!req.session.user){
    logger.warn('unauthorized access to address page- no session');
    return res.status (STATUS_CODES.UNAUTHORIZED).json({
message:MESSAGES.ADDRESS.LOGIN_REQUIRED
    });
  }

  const userId=req.session.user.id;
  const data=await addressService.getUserAddressesService(userId);

  res.render("user/address",{
    pageCSS:"user/address.css",
    pageJS:"user/address.js",
    user:data.user,
    activeTab:"addresses"
  })
}

export const addAddress=async(req,res)=>{
  const userId=req.session.user.id;
  logger.info('Adding new address',{userId});
const{error,value}=addressSchema.validate(req.body,{abortEarly:false});
if(error){
  const messages=error.details.map((err)=>err.message).join(", ");
  throw Object.assign(new Error(messages),{status:STATUS_CODES.BAD_REQUEST})
}
 const result =await addressService.addAddress(userId,value);
 res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:MESSAGES.ADDRESS.ADD_SUCCESS,
  data:result
 }) 
}

export const deleteAddress=async(req,res)=>{
  const userId=req.session.user.id;
  const addressId=req.params.id;

  logger.info('Deleting address',{userId,addressId});
  await addressService.deleteAddress(userId,addressId);

  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:MESSAGES.ADDRESS.DELETE_SUCCESS
  })
}

export const getEditAddress=async(req,res)=>{
  const userId=req.session.user.id;
  const addressId=req.params.id;

  logger.info('Fetching address for edit',{userId,addressId});
  const data =await addressService.getEditAddress(userId,addressId);

  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    address:data.address
  })
}

export const updateAddress=async(req,res)=>{
  const userId=req.session.user.id;
  const addressId=req.params.id;

  logger.info('updating address',{userId,addressId});

  const updates={
    ...req.body,
    pincode:Number(req.body.pincode)
  }

  const {error,value}=addressSchema.validate(updates,{abortEarly:false});
  if(error){
    const messages=error.details.map((err)=>err.message).join(",");
    throw Object.assign(new Error(messages),
    {status:STATUS_CODES.BAD_REQUEST});
  }

 await addressService.updateAddress(userId,addressId,value);

 res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:MESSAGES.ADDRESS.UPDATE_SUCCESS
 })
}

export const setDefaultAddress=async(req,res)=>{
  const userId=req.session.user.id;
  const addressId=req.params.id;
  logger.info('setting default address',{userId,addressId});
  if(!userId){
    logger.warn('Unauthorized attempt to set default address');
    return res.status(STATUS_CODES.UNAUTHORIZED).json(MESSAGES.LOGIN_REQUIRED);
    
  }
await addressService.setDefaultAddress(userId,addressId);

res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:MESSAGES.ADDRESS.SET_DEFAULT_SUCCESS
})
}