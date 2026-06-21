import * as couponService from '../../service/admin/coupon.service.js';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';

export const getCouponPage = async (req, res) => {
  logger.info('Loading coupon management page');
  const page=parseInt(req.query.page)||1;
  const limit=parseInt(req.query.limit)||10;
  const search=req.query.search||'';

  let searchQuery={};
  if(search){
    searchQuery={
      $or:[
        {code:{$regex:search,$options:'i'}},
        {description:{$regex:search,$options:'i'}}
      ]
    }
  }
const totalCoupons=await couponService.getTotalCouponsCount(searchQuery);
const totalPages=Math.ceil(totalCoupons/limit);
const skip=(page-1)*limit;

  const coupons = await couponService.getAllCouponService(searchQuery,skip,limit);


  res.render('admin/coupons', {
    coupons,
    currentPage:page,
    totalPages:totalPages,
    totalCoupons:totalCoupons,
    limit:limit,
    search:search,
        layout: false
  });
};

export const createCoupon = async (req, res) => {
  logger.info('creating new coupon');

  const coupon = await couponService.createCouponService(req.validatedData); 
  res.status(STATUS_CODES.CREATED).json({
    success: true,
    message: MESSAGES.COUPON.CREATE_SUCCESS,
    data: coupon
  });
};

export const getCouponById = async (req, res) => {
  console.log("req.params",req.params);
  const { id } = req.params; 
  console.log(id);
  logger.info('Fetching coupon by Id', { id });

  const coupon = await couponService.getCouponByIdService(id);
  res.status(STATUS_CODES.SUCCESS).json(coupon);
};

export const updateCoupon = async (req, res) => {
  console.log("inside the update coupon");
  const { id } = req.validatedData; 
  console.log("req.validatedData:",req.validatedData);
  console.log("req.params.id",req.params.id);
  logger.info('updating coupon', { id });

  const coupon = await couponService.updatedCouponService(id, req.validatedData); 
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.COUPON.UPDATE_SUCCESS,
    coupon
  });
};

export const deleteCoupon = async (req, res) => {
const id=req.params.id;
  logger.info('Deleting coupon',  id );

  await couponService.deleteCouponService(id);
  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.COUPON.DELETE_SUCCESS
  });
};

export const validateCoupon = async (req, res) => {
  const { code, cartValue } = req.validatedData;
  logger.info('validating coupon for use', { code });

  const result = await couponService.validateCouponService(code, cartValue);
  res.status(STATUS_CODES.SUCCESS).json(result);
};