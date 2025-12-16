

import * as orderManagmentService from '../../service/user/orderDetails.service.js';
import{
cancelOrderSchema,
returnOrderSchema,
getOrderDetailsSchema
} from '../../utils/validation.schema.js';
import {STATUS_CODES} from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getOrderDetails=async (req,res)=>{
  logger.info('loading order details page');

  if(!req.session.user||!req.session.user.id){
    logger.warn('Unauthorized access to order details');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.AUTH.LOGIN_REQUIRED
    });
  }

const userId=req.session.user.id;
const orderId=req.params.orderId;

const {error}=getOrderDetailsSchema.validate({orderId});
if(error){
  logger.warn('order details validation failed',{error:error.details[0].message});
  return res.status(STATUS_CODES.BAD_REQUEST).json({
    success:false,
    message:error.details[0].message
  })
}

const {order,getStatusMessage}=await orderManagmentService.getOrderDetailsService(orderId,userId);
res.render('user/orderDetails',{
  pageCSS:'user/orderDetails.css',
  pageJS: 'user/orderDetail.js',
        pageTitle: 'Order Detail',
        storeName: 'Chettinad Sarees',
        order: order,
        getStatusmessage: getStatusMessage,
        user: req.session.user
})

}


export  const invoice=async(req,res)=>{
  const orderId=req.params.orderId;

  logger.info('generating invoice',{orderId});

  const{error}=getOrderDetailsSchema.validate({orderId});
  if(error){
    logger.warn('Invoice generation validation failed',{error:error.details[0].message});
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success:false,
      message:error.details[0].message
    })
  }

    try {
        const pdfBuffer = await orderManagmentService.generateInvoiceService(orderId);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ChettinadSarees_Order_${orderId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        logger.error('Error generating invoice:', error);
        return res.status(STATUS_CODES.NOT_FOUND).json({ 
            success: false, 
            message: error.message 
        });
    }

}

export const cancelOrder=async(req,res)=>{
  logger.info('processing order cancellation');

  if(!req.session.user||!req.session.user.id){
    logger.warn('unauthorized cancellation attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.AUTH.LOGIN_REQUIRED
    });
  }

const userId=req.session.user.id;
const orderId=req.params.orderId;

const{error,value}=cancelOrderSchema.validate({...req.body,orderId});
if(error){
  logger.warn('order cancellation validation failed',{error:error.details[0].message});
  return res.status(STATUS_CODES.BAD_REQUEST).json({
    success:false,
    message:error.details[0].message
  });
}

const order=await orderManagmentService.cancelOrderService(userId,orderId,value);

res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:'Cancellation processed successfully',
  order
})

}

export const returnOrder=async(req,res)=>{
  logger.info('Processing order return');

  if(!req.session.user||!req.session.user.id){
    logger.warn('Unauthorized return attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.AUTH.LOGIN_REQUIRED
    })
  }

  const userId=req.session.user.id;
  const orderId=req.params.orderId;

  const{error,value}=returnOrderSchema.validate({...req.body,orderId});
  if(error){
    logger.warn('other return validation failed ',{error:error.details[0].message});
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success:false,
      message:error.details[0].message
    })
  }

const order=await orderManagmentService.returnOrderService(userId,orderId,value);

res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:'Return request submitted successfully',
  order
})

}


export const getReturnDetails=async(req,res)=>{
  logger.info('fetching return details ');

if(!req.session.user||!req.session.user.id){
    logger.warn('Unauthorized return attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.AUTH.LOGIN_REQUIRED
    })
  }

   const userId = req.session.user.id;
    const orderId = req.params.orderId;

    const returnDetails = await orderManagmentService.getReturnDetailsService(userId, orderId);
    
    res.status(STATUS_CODES.SUCCESS).json(returnDetails);

}
