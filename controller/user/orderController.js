import *as orderService from '../../service/user/order.service.js';
import {STATUS_CODES} from "../../utils/statusCodes.js";
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getOrderHistory=async(req,res)=>{
  logger.info('loading order history page');

  if(!req.session.user||!req.session.user.id){
    logger.warn('Unathorized access to order history');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success:false,
      message:MESSAGES.AUTH.LOGIN_REQUIRED
    })
  }
  const userId=req.session.user.id;


  const{page,limit,search}=req.query;
  const{orders,totalPages,currentPage}=await orderService.getOrderHistoryService(
    userId,
    {page,limit,search}
  );

  const formattedOrders=orderService.formatOrderHistoryService(orders);
  res.render('user/orderHistory',{
       pageCSS: 'user/orderHistory.css',
        pageJS: 'user/orderHistory.js',
        pagetitle: 'Order History',
        storeName: 'Chettinad sarees',
        orders: formattedOrders,
        user: req.session.user,
        totalPages: totalPages,
        currentPage: currentPage,
        searchQuery: search
  })
}
