import Order from '../../models/orderSchema.js';
import Product from '../../models/productSchema.js';
import Wallet from '../../models/walletSchema.js';
import PDFDocument from 'pdfkit';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getOrderDetailsService=async(userId,orderId)=>{
    logger.debug('fetching order details',{userId,orderId});
console.log("userID:",userId);
console.log("orderId",orderId);
    const order=await Order.findOne({orderId,userId})
    .populate('items.productId')
    .lean();

    if(!order){
        logger.warn('order not found',{userId,orderId});
        return {
            success:false,
            message:MESSAGES.ORDER.NOT_FOUND
        }
    }

const formatItems=order.items.map(item=>({
    ...item,
    name:item.productId?.ProductName||item.name,
    imageUrl:item.productId?.images?.[0]||'/img/product-placeholder.svg',
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
    console.log("inside the full cancellation block");
    //full order cancellation
    await processFullCancellation(order,cancellationReason,cancelledItems);
    refundAmount=calculateFullRefund(order,deliveryCharge,couponAmount,tax);
    console.log("refund amount in the full order:",refundAmount);
}else{
    //partial cancellation
    refundAmount=await processPartialCancellation(order,itemId,cancellationReason,cancelledItems,deliveryCharge,couponAmount,tax);
console.log("refund amount inside the partial cancellation:",refundAmount);
}
await order.save();


if(refundAmount>0){
    await processRefund(order,refundAmount);
}
logger.info('order cancelled successfully',{orderId,refundAmount});
return order;
}

export const returnOrderService=async(userId,orderId,returnData)=>{
    console.log("check inside the service :",returnData);
    const{reason,itemIds,ItemsIds,customReason,notes}=returnData;
    const finalItemIds = itemIds || ItemsIds;
    logger.debug('processing order return',{userId,orderId,finalItemIds});
    const order=await Order.findById(orderId).populate("items.productId");

    if(!order){
        logger.warn('order not found for return',{orderId});
        throw new Error(MESSAGES.ORDER.NOT_FOUND);

    }
    if(order.userId.toString()!==userId.toString()){
        logger.warn('unauthorized return attempt',{userId,orderId});
        throw new Error(MESSAGES.ORDER.UNAUTHORIZED_ACCESS);
    }
    const returnReason=customReason||reason;

    if(!returnReason){
        throw new Error('return reason is required');
    }

    if(!['delivered','partially_returned'].includes(order.status.toLowerCase())){
        throw new Error('Only delivered orders can be returned');
    }

    order.returnRequested=true;

   const isPartialReturn=
   Array.isArray(finalItemIds)&& finalItemIds.length>0;

if(isPartialReturn){
    processPartialReturn(order,finalItemIds,returnReason,notes);
}else{
    processFullReturn(order,returnReason,notes);
}

    await order.save();
    logger.info('return request sunmitted successfully',{orderId});
    return order;
};

export const getReturnDetailsService=async(userId,orderId)=>{
    logger.debug('fetching return details',{userId,orderId});
    const order=await Order.findById(orderId).populate('items.productId');
    if(!order||!order.returnRequested){
        logger.warn('return request not found',{orderId});
        throw new Error('return reuest not found');
    }
    const{returnDetails}=order;
    let returnType=determineReturnType(order);
    const items=returnDetails.items?.map(item=>({
        _id:item._id,
        name:item.name,
        quantity:item.quantity,
        price:item.price||order.items.find(i=>i.produductId._id.toString()
    ===item.product.toString())?.totalPrice||'N/A',
    reson:item.reason
    }))||[];

    if(returnType==='full'){
        items.length=0;
    }

    logger.debug('Return details fetched',{orderId,returnType});
    return{
        reason:returnDetails.reason||'Not specified',
        notes:returnDetails.notes||'None',
        type:returnType,
        totalItems:order.items.length,
        items
    }
}

//helper functions

const buildStatusHistory=(order)=>{
    const statusHistory=[
        {
            date:order.createdAt,
            message:'Your order has been placed.'
        }
    ];

    if(order.processingAt){
        statusHistory.push({
            date:order.processingAt,
            message:'Your order is being processed.'
        });
    }

    if(order.shippedAt){
        statusHistory.push({
            date:order.shippedAt,
            message:'Your order has been shipped.'
        })
    }

    if(order.deliveredAt){
        statusHistory.push({
            date:order.deliveredAt,
            message:'Your order has been delivered.'
        })
    }

    // Handle cancellations (both full and partial)
    if (order.cancellation && order.cancellation.date) {
        if (order.cancellation.type === 'partial') {
            let itemNames = '';
            if (order.cancellation.cancelledItems && order.cancellation.cancelledItems.length > 0) {
                const names = order.cancellation.cancelledItems
                    .map(item => item.name)
                    .filter(name => name);
                if (names.length > 0) {
                    itemNames = names.join(', ');
                }
            }
            if (!itemNames) {
                const cancelled = order.items.filter(item => item.status === 'cancelled');
                if (cancelled.length > 0) {
                    itemNames = cancelled.map(item => item.name).join(', ');
                }
            }
            if (!itemNames) {
                itemNames = 'item';
            }
            statusHistory.push({
                date: order.cancellation.date,
                message: `Your ${itemNames} has been cancelled.`
            });
        } else {
            statusHistory.push({
                date: order.cancellation.date,
                message: 'Your order has been cancelled.'
            });
        }
    } else if (order.cancelledAt) {
        statusHistory.push({
            date: order.cancelledAt,
            message: 'Your order has been cancelled.'
        });
    }

    // Handle return requests
    if (order.returnDetails && order.returnDetails.requestDate) {
        statusHistory.push({
            date: order.returnDetails.requestDate,
            message: order.returnDetails.type === 'partial' 
                ? 'Return requested for some items.' 
                : 'Return requested for the order.'
        });
    }

    // Handle completed returns
    const returnDate = order.returnedAt || order.returnProcessedAt;
    if (returnDate) {
        statusHistory.push({
            date: returnDate,
            message: order.status === 'partially_returned' 
                ? 'Some items have been successfully returned.' 
                : 'Your order has been returned.'
        });
    }

    statusHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    return statusHistory;
}

const getStatusMessage=(status)=>{
    const messages = {
        processing: 'Seller is preparing your item for shipment.',
        payment_failed: 'Your order payment is pending.',
        shipped: 'Your item has been shipped and is on its way.',
        delivered: 'Your item has been delivered.',
        cancelled: 'Your order has been cancelled.',
        returned: 'The returned product has been received.',
        partially_cancelled: 'Some items in your order have been cancelled.',
        partially_returned: 'Some items in your order have been returned.',
        return_requested: 'Return request has been initiated.'
    };
    return messages[status.toLowerCase()]||'Your order is being processed'; 
}


const generateInvoiceContent = (doc, order) => {
    const validateNumber = (value) => {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    };

    doc.fontSize(20).text('Chettinad Sarees', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Traditional Handwoven Sarees | Kerala, India', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(14).text(`Invoice #${order.orderId}`, { align: 'left' });
    doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'left' });
    doc.moveDown(1.5);

    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.text(`Name: ${order.shippingAddress?.name || 'N/A'}`);
    doc.text(`Address: ${order.shippingAddress?.building || ''}, ${order.shippingAddress?.city || ''}`);
    doc.text(`Phone: ${order.shippingAddress?.phone || 'N/A'}`);
    doc.moveDown(2);

    const tableTop = doc.y;
    const colPositions = [50, 300, 370, 450];
    const colWidths = [250, 70, 80, 80];

    doc.font('Helvetica-Bold');
    doc.text('Product', colPositions[0], tableTop);
    doc.text('Qty', colPositions[1], tableTop, { width: colWidths[1], align: 'right' });
    doc.text('Price', colPositions[2], tableTop, { width: colWidths[2], align: 'right' });
    doc.text('Total', colPositions[3], tableTop, { width: colWidths[3], align: 'right' });
    
    doc.font('Helvetica');
    let y = tableTop + 20;
    
    order.items.forEach(item => {
        const price = validateNumber(item.price);
        const quantity = validateNumber(item.quantity);
        const total = price * quantity;

        doc.text(item.name || 'Product', colPositions[0], y);
        doc.text(quantity.toString(), colPositions[1], y, { width: colWidths[1], align: 'right' });
        doc.text(`₹${price.toFixed(2)}`, colPositions[2], y, { width: colWidths[2], align: 'right' });
        doc.text(`₹${total.toFixed(2)}`, colPositions[3], y, { width: colWidths[3], align: 'right' });
        y += 20;
    });

    const summaryTop = y + 20;
    const subtotal = validateNumber(order.subtotal);
    const delivery = validateNumber(order.delivery);
    const discount = validateNumber(order.discount);
    const total = validateNumber(order.total);

    doc.moveTo(colPositions[2], summaryTop - 10).lineTo(colPositions[3] + colWidths[3], summaryTop - 10).stroke();

    doc.text('Subtotal:', colPositions[2], summaryTop, { width: colWidths[2], align: 'right' });
    doc.text(`₹${subtotal.toFixed(2)}`, colPositions[3], summaryTop, { width: colWidths[3], align: 'right' });

    doc.text('Delivery:', colPositions[2], summaryTop + 20, { width: colWidths[2], align: 'right' });
    doc.text(`₹${delivery.toFixed(2)}`, colPositions[3], summaryTop + 20, { width: colWidths[3], align: 'right' });

    if (discount > 0) {
        doc.text('Discount:', colPositions[2], summaryTop + 40, { width: colWidths[2], align: 'right' });
        doc.text(`-₹${discount.toFixed(2)}`, colPositions[3], summaryTop + 40, { width: colWidths[3], align: 'right' });
    }

    doc.font('Helvetica-Bold');
    doc.text('Total:', colPositions[2], summaryTop + 60, { width: colWidths[2], align: 'right' });
    doc.text(`₹${total.toFixed(2)}`, colPositions[3], summaryTop + 60, { width: colWidths[3], align: 'right' });
    doc.font('Helvetica');

    doc.moveDown(4);
    doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });
    doc.text('Contact us at contact@chettinadsarees.com for any queries', { align: 'center' });
};

const processFullCancellation=async(order,reason,cancelledItems)=>{
    console.log("check inside the full cancellation process");
    const activeItems=order.items.filter(item=>item.status!=='cancelled');
    if(activeItems.length===0){
        return;
    }
    activeItems.forEach(item=>{
        item.status='cancelled';
        cancelledItems.push({
            product:item.productId,
            name:item.name,
            quantity:item.quantity,
            reason
        });
    });

    order.status='cancelled';
    order.cancelledAt=new Date();
    order.cancellation={
        reason,
        date:new Date(),
        intiatedBy:'customer',
        type:'full',
        cancelledItems
    }

    await Promise.all(activeItems.map(item=>
        Product.findByIdAndUpdate(item.productId,{$inc:{stock:item.quantity}})
    ));
}

const calculateFullRefund=(order,deliveryCharge,couponAmount,tax)=>{
    console.log("order",order);
    console.log("couponAmount",couponAmount);
    
    const activeItems=order.items.filter(item=>item.status =='cancelled');
    if(activeItems.lenght ===0) return 0;
    const activeSubtotal=activeItems.reduce((sum,item)=>sum+item.totalPrice,0);
    const netRefundable=activeSubtotal-couponAmount+tax;
    const refundAmount=Math.max(0,netRefundable-deliveryCharge);
    console.log("refund amount:",refundAmount);
     
    return refundAmount;

}

const processPartialCancellation = async (order, itemId, reason, cancelledItems, deliveryCharge, couponAmount, tax) => {
    const item = order.items.id(itemId);
    console.log("item inside the partial order cancellation :",item);
    console.log("item status:",item.status);
    
    if (!item || item.status === 'cancelled') {
        throw new Error('Item cannot be cancelled');
    }

    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });

    item.status = 'cancelled';
    cancelledItems.push({
        product: item.productId,
        name: item.name || item.productName,
        quantity: item.quantity,
        reason
    });
console.log("order here after pushing the items :",order);
    const allCancelled = order.items.every(i => i.status === 'cancelled');
    order.status = allCancelled ? 'cancelled' : 'partially_cancelled';

    const totalOriginalSubtotal = order.items.reduce((sum, i) => sum + i.totalPrice, 0);
    
    const totalPaidExcludingDelivery = totalOriginalSubtotal - couponAmount + tax;
    
    const itemProportion = item.totalPrice / totalOriginalSubtotal;
    const refundAmount = itemProportion * totalPaidExcludingDelivery;

    order.cancellation = {
        reason,
        date: new Date(),
        initiatedBy: 'customer',
        type: allCancelled ? 'full' : 'partial',
        cancelledItems,
        refundAmount: Math.max(0, refundAmount)
    };

    return Math.max(0, refundAmount);
};

const processRefund= async(order,refundAmount)=>{
    console.log("inside the refund process:",refundAmount);
    if(refundAmount<=0) return;

    order.refund={
        amount:refundAmount,
     method:"wallet",
     status:"completed"
            
        }
        if(order.paymentMethod&&order.paymentMethod.toLowerCase()==='cod'){
            logger.debug('cod order,no refund needed');
            return;
            
        }
console.log("order.userId",order.userId);
        let wallet=await Wallet.findOne({user:order.userId});
        console.log("wallet found: ",wallet);
        if(!wallet){
            wallet=await Wallet.create({
                user:order.userId,
                balance:0
            })

        }
       
            wallet.balance+=refundAmount;
            wallet.transactions.push({
                amount:refundAmount,
                type:'refund',
                order:order._id,
                description:`Refund for order ${order.orderId}`,
                status:'completed'
            });

            await wallet.save();
            order.refund.status="completed";
            logger.info(`wallet refunded: ${refundAmount}`);
        
    }

    const processFullReturn=(order,reason,notes)=>{
        order.items.forEach(item=>{
            if(!['returned','return_requested'].includes(item.status)){
                item.status="return_requested";
            }
        });

        const eligibleCount=order.items.filter(i=>i.status=='return_requested').length;
        order.status=eligibleCount===order.items.length?"return_requested":"partially_returned";

        order.returnDetails={
            reason,
            notes,
            requestDate:new Date(),
            status:"pending",
            type:'full',
            items:[]
        }
    }

    const processPartialReturn=(order,itemIds,reason,notes)=>{

        if(!Array.isArray(itemIds)||itemIds.length===0){
            throw new Error('no items selected for return')
        }

        let eligibleCount=0;
        if(!order.returnDetails){
            order.returnDetails={
                reason,
                notes,
                requestDate:new Date(),
                status:"pending",
                initiatedBy:"customer",
                type:"partial",
                items:[]
            }
        }
       for(const itemId of itemIds){
        const item=order.items.id(itemId);
        if(!item){
            throw new Error('Item not found in order');
                }

                if(["returned","return_requested"].includes(item.status)){
                    throw new Error('Item alreasy in return process');
                }
item.status="return_requested";
               eligibleCount++;
                
                   

                order.returnDetails.items.push({
                    product:item.productId._id,
                    quantity:item.quantity,
                    name:item.name,
                    reason,
                    price:item.totalPrice
                });
            }
            order.status=
            eligibleCount===order.items.length?"return_requested":"partially_returned"

}

    const determineReturnType=(order)=>{
        if(order.status.toLowerCase()==='return_requested'){
            return 'full';
        }else if(order.status.toLowerCase()==='partially_returned'){
            return 'partial';
        }else{
            return order.returnDetails?.items?.length>0?'partial':'full';
        }
    }
