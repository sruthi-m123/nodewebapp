import * as offerService from '../../service/admin/offer.service.js';
import Product from '../../models/productSchema.js';
import Category from '../../models/categorySchema.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';
import { createOfferSchema, updateOfferSchema } from '../../utils/validation.schema.js';

export const getOfferPage=async(req,res,)=>{
  logger.info('loading offer managment page');

  const currentPage=parseInt(req.query.page)||1;
  const offerType=req.query.type||'all';

  const{offers,totalPages}=await offerService.getOffersService(currentPage,6,offerType);

  const  products=await Product.find({});
  const categories=await Category.find({status:'active'}).sort({name:1});

  res.render("admin/offer",{
    layout:false,
    offers,
    currentPage,
    totalPages,
    offerType,
    categories,
    products
  })
}

export const getApplicableItems=async(req,res)=>{
  const type=req.query.type;
  logger.info('fetching applicable items',{type});
  const items=await offerService.getApplicableItemService(type);

  res.status(STATUS_CODES.SUCCESS).json(items);
}

export const createOffer=async(req,res)=>{
  logger.info('creating new Offer');
  const {error,value}=createOfferSchema.validate(req.body);
  if(error){
    logger.warn('offer creation validation failed',{error:error.details[0].message});
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success:false,
      message:error.details[0].message
    })
  }
  const offer=await offerService.createOfferService(value);
  res.status(STATUS_CODES.CREATED).json({
    success:true,
    message:MESSAGES.OFFER.CREATE_SUCCESS,
    offer
  })

}

export const deleteOffer=async(req,res)=>{
  const offerId=req.params.offerId;

  logger.info('Deletinf offer',{offerId});

  await offerService.deleteOfferService(offerId);
  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    message:MESSAGES.OFFER.DELETE_SUCCESS
  })
}

export const getEditOffer=async(req,res)=>{
  const offerId=req.params.id;
  logger.info('fetching offer for edit',{offerId});

  const offer=await offerService.getEditOfferService(offerId);
  res.status(STATUS_CODES.SUCCESS).json({
    success:true,
    offer
  })
}

export const updateOffer=async(req,res)=>{
  const offerId=req.params.id;
  logger.info('updating offer',{offerId});

  const {error,value}=updateOfferSchema.validate(req.body);
  if(error){
    logger.warn("offer update valiation failed",{error:error.details[0].message});
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success:false,
      message:error.details[0].message
    })
  }
const updatedOffer=await offerService.updateOfferService(offerId,value);

res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:MESSAGES.OFFER.UPDATE_SUCCESS,
  offer:updatedOffer
})

}