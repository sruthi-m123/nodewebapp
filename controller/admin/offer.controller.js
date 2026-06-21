import * as offerService from '../../service/admin/offer.service.js';
import Product from '../../models/productSchema.js';
import Category from '../../models/categorySchema.js';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';

export const getOfferPage = async (req, res) => {
  logger.info('loading offer management page');
console.log("req.validateData",req.validatedData);
  const { page = 1, type = 'all' } = req.validatedData; 
  const currentPage = parseInt(page);
  const offerType = type;

  const { offers, totalPages } = await offerService.getOffersService(currentPage, 6, offerType);
  console.log("offers:",offers);

  const products = await Product.find({});
  const categories = await Category.find({ status: 'active' }).sort({ name: 1 });

  res.render("admin/offer", {
    layout: false,
    offers,
    currentPage,
    totalPages,
    offerType,
    categories,
    products
  });
};

export const getApplicableItems = async (req, res) => {
  const { type } = req.validatedData; 
  logger.info('fetching applicable items', { type });
  const items = await offerService.getApplicableItemService(type);

  res.status(STATUS_CODES.SUCCESS).json(items);
};

export const createOffer = async (req, res) => {
  logger.info('creating new Offer');

  const offer = await offerService.createOfferService(req.validatedData); 
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.OFFER.CREATE_SUCCESS,
    offer
  });
};

export const deleteOffer = async (req, res) => {
  const { offerId } = req.validatedData; 
  logger.info('Deleting offer', { offerId });

  await offerService.deleteOfferService(offerId);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.OFFER.DELETE_SUCCESS
  });
};

export const getEditOffer = async (req, res) => {
  console.log("req.params:",req.params);

  const offerId=req.params.id;

  const offer = await offerService.getEditOfferService(offerId);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    offer
  });
};

export const updateOffer = async (req, res) => {
  const { id } = req.validatedData; 
  logger.info('updating offer', { id });

  const updatedOffer = await offerService.updateOfferService(id, req.validatedData); 
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.OFFER.UPDATE_SUCCESS,
    offer: updatedOffer
  });
};