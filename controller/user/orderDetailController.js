// controllers/user/orderDetails.controller.js
import * as orderManagmentService from '../../service/user/orderDetails.service.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import logger from '../../utils/logger.js';

export const getOrderDetails = async (req, res) => {
  logger.info('loading order details page');
  const {orderId}=req.params;
  const userId=req.session.user.id;
  console.log("orderId",orderId);
  console.log("userId",userId);
const result=
await orderManagmentService.getOrderDetailsService(
 userId,
 orderId
);

if(!result||result.success===false){
  return res.status(404).render('user/pageNotFound',{
     pageTitle: 'Order Not Found',
      message: result?.message || 'Order not found',
      user: req.session.user
  })
}

  res.render('user/orderDetails', {
    pageCSS: 'user/orderDetail.css',
    pageJS: 'user/orderDetail.js',
    pageTitle: 'Order Detail',
    storeName: 'Chettinad Sarees',
    order: result.order,
    getStatusmessage: result.getStatusMessage,
    user: req.session.user
  });
};

export const invoice = async (req, res) => {
  const orderId = req.params.orderId;

  logger.info('generating invoice', { orderId });

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
};

export const cancelOrder = async (req, res) => {
  logger.info('processing order cancellation');

  const orderId = req.params.orderId;
  const userId = req.session.user.id;
  const cancelData = req.validatedData || req.body;

  const order = await orderManagmentService.cancelOrderService(userId, orderId, cancelData);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Cancellation processed successfully',
    order
  });
};

export const returnOrder = async (req, res) => {
  logger.info('Processing order return');
  console.log("inside the controler",req.validatedData);
  const {orderId,...returnData}=req.validatedData;
  const order = await orderManagmentService.returnOrderService(req.session.user.id, orderId, returnData);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Return request submitted successfully',
    order
  });
};

export const getReturnDetails = async (req, res) => {
  logger.info('fetching return details');

  const returnDetails = await orderManagmentService.getReturnDetailsService(req.userId, req.orderId);

  res.status(STATUS_CODES.SUCCESS).json(returnDetails);
};