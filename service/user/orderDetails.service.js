import Order from '../../models/orderSchema.js';
import Product from '../../models/productSchema.js';
import Wallet from '../../models/walletSchema.js';
import PDFDocument from 'pdfkit';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getOrderDetailsService=async(userId,orderId)=>{
    logger.debug('fetching order details',{userId,orderId});

    const order=await Order.findOne({orderId,userId})
    .populate('items.productId')
    .lean();

    if(!order){
        logger.warn('order not found',{userId,orderId});
        throw new Error(MESSAGES.ORDER.NOT_FOUND);
    }

const formatItems=order.items.map(item=>({
    ...item,
    name:item.productId?.ProductName||item.name,
    imageUrl:item.productId?.images?.[0]||'/img/admin-workshop.png',
    color:item.productId?.color||'N/A'
}));

const statusHistory=buildStatusHistory(order);

logger.info('order details fetched successfully',{orderId});
return{
    order:{
        ...order,
        items:formatItems,
        statusHistory

    },
    getStatusMessage:getStatusMessage
}
}

export const generateInvoiceService=async(orderId)=>{
    logger.debug('Generating invoice',{orderId});

    const order=await Order.findOne({orderId}).populate('items.productId');

    if(!order){
        logger.warn('order not found for invoice',{orderId});
        throw new Error('order not found');
    }

    return new Promise((resolve,reject)=>{
         const doc = new PDFDocument({ size: 'A4', margin: 50, rightMargin: 70 });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err) => reject(err));   // handles PDF errors

        generateInvoiceContent(doc, order);
        doc.end();

        logger.info('Invoice started generating', { orderId });
    });
  
}

export const cancelOrderService=async(userId,orderId,cancellationData)=>{
    const {reason,itemId,customReason}=cancellationData;
    logger.debug('Processing order cancellation',{userId,orderId,itemId});
    const order=await Order.findById(orderId);

    if(!order){
        logger.warn('order not found for cancellation',{orderId});
        throw new Error(MESSAGES.ORDER.NOT_FOUND);

    }
    if(order.userId.toString()!==userId.toString()){
        logger.warn('Unathorized cancellation attempt',{userId,orderId})
        throw new Error(MESSAGES.ORDER.UNAUTHORIZED_ACCESS);
    }

    const cancellationReason=customReason||reason;
    if(!cancellationReason){
        throw new Error('cancellation reason is required');
    }
    if(!['pending','processing','paid','partially_cancelled'].includes(order.status.toLowerCase())){
        throw new Error('order cannot be cancelled at this stage');
    }

    const cancelledItems=order.cancellation?.cancelledItems||[];
    const deliveryCharge=order.delivery||0;
    const couponAmount=order.appliedCoupon?.value||0;
    const tax=order.tax||0;

let refundAmount=0;

if(!itemId){
    //full order cancellation
    await processFullCancellation(order,cancellationReason,cancelledItems);
    refundAmount=calculateFullRefund(order,deliveryCharge,couponAmount,tax);
}else{
    //partial cancellation
    refundAmount=await processPartialCancellation(order,itemId,cancellationReason,cancelledItems,deliveryCharge,couponAmount,tax);

}
await order.save();

if(refundAmount>0){
    await processRefund(order,refundAmount);
}
logger.info('order cancelled successfully',{orderId,refundAmount});
return order;
}