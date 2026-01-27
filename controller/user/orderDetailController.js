// controllers/user/orderDetails.controller.js
import * as orderManagmentService from '../../service/user/orderDetails.service.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getOrderDetails = async (req, res) => {
  logger.info('loading order details page');

  const { order, getStatusMessage } = await orderManagmentService.getOrderDetailsService(req.orderId, req.userId);
  res.render('user/orderDetails', {
    pageCSS: 'user/orderDetails.css',
    pageJS: 'user/orderDetail.js',
    pageTitle: 'Order Detail',
    storeName: 'Chettinad Sarees',
    order: order,
    getStatusmessage: getStatusMessage,
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

  const order = await orderManagmentService.cancelOrderService(req.userId, req.orderId, req.cancelData);

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: 'Cancellation processed successfully',
    order
  });
};

export const returnOrder = async (req, res) => {
  logger.info('Processing order return');

  const order = await orderManagmentService.returnOrderService(req.userId, req.orderId, req.returnData);

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