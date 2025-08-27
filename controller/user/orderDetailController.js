const Order=require('../../models/orderSchema');
const Product=require('../../models/productSchema');
const User=require('../../models/userSchema');
const PDFDocument=require('pdfkit');
const fs=require('fs');
const { log } = require('console');
const getOrderDetails = async (req, res) => {
  try {
    console.log("👉 Inside the orderDetail controller");
    console.log(req.session.user)

    const userId = req.session.user.id;
    const orderId = req.params.orderId;

    console.log("User ID:", userId);
    console.log("Order ID:", orderId);

    const order = await Order.findOne({ orderId, userId })
      .populate('items.productId')
      .lean();
console.log("orders",order);
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }

    // Format items with image & color
    const formatItems = order.items.map(item => ({
      ...item,
      name: item.productId?.ProductName || item.name,
      imageUrl: item.productId?.images?.[0] || 'img/admin-workshop',
      color: item.productId?.color || 'N/A'
    }));
console.log("formated items:",formatItems)
    // Build status history timeline
    const statusHistory = [
      {
        date: order.createdAt,
        message: 'Your order has been placed.'
      }
    ];

    if (order.status === 'processing' && order.processingAt) {
      statusHistory.push({
        date: order.processingAt,
        message: 'Your order is being processed.'
      });
    }

    if (order.status === 'shipped' && order.shippedAt) {
      statusHistory.push({
        date: order.shippedAt,
        message: 'Your order has been shipped.'
      });
    }



    if (order.status === 'delivered' && order.deliveredAt) {
      statusHistory.push({
        date: order.deliveredAt,
        message: 'Your order has been delivered.'
      });
    }

    if (order.status === 'cancelled' && order.cancelledAt) {
      statusHistory.push({
        date: order.cancelledAt,
        message: 'Your order has been cancelled.'
      });
    }

    if (order.status === 'returned' && order.returnedAt) {
      statusHistory.push({
        date: order.returnedAt,
        message: 'Your order has been returned.'
      });
    }
console.log("status history",statusHistory);
    // Status message map
    const getStatusMessage = (status) => {
      const messages = {
        processing: 'Seller is preparing your item for shipment.',
        shipped: 'Your item has been shipped and is on its way.',
        delivered: 'Your item has been delivered.',
        cancelled: 'Your order has been cancelled.',
        returned: 'The returned product has been received.'
      };
      return messages[status.toLowerCase()] || 'Your order is being processed.';
    };

    // Render the page
    res.render('user/orderDetails', {
      pageCSS: 'user/orderDetail.css',
      pageJS: 'user/orderDetail.js',
      pageTitle: 'Order Detail',
      storeName: 'Chettinad Sarees',
      order: {
        ...order,
        items: formatItems,
        statusHistory
      },
      getStatusmessage: getStatusMessage,
      user: req.session.user
    });
  } catch (error) {
    console.log("❗ Inside catch block");
    console.error(error.stack);
    res.status(500).render('user/error', {
      message: 'Error loading order details'
    });
  }
};


const invoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findOne({ orderId: orderId }).populate('items.productId');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        
        const doc = new PDFDocument({ size: 'A4', margin: 50, rightMargin: 70 });
        
        res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `attachment; filename=ChettinadSarees_Order_${orderId}.pdf`);        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Helper function to validate numbers
        const validateNumber = (value) => {
            const num = Number(value);
            return isNaN(num) ? 0 : num;
        };

        // Header Section - Changed to Chettinad Sarees
        doc.fontSize(20).text('Chettinad Sarees', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text('Traditional Handwoven Sarees | Kerala, India', { align: 'center' });
        doc.moveDown(1.5);

        // Invoice Info Section
        doc.fontSize(14).text(`Invoice #${order.orderId}`, { align: 'left' });
        doc.fontSize(12).text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: 'left' });
        doc.moveDown(1.5);

        // Customer Information
        doc.fontSize(12).text('Bill To:', { underline: true });
        doc.text(`Name: ${order.shippingAddress?.name || 'N/A'}`);
        doc.text(`Address: ${order.shippingAddress?.building || ''}, ${order.shippingAddress?.city || ''}`);
        doc.text(`Phone: ${order.shippingAddress?.phone || 'N/A'}`);
        doc.moveDown(2);

        // Items Table Setup
        const tableTop = doc.y;
        const colPositions = [50, 300, 370, 450]; // Adjusted column positions
        const colWidths = [250, 70, 80, 80]; // Column widths

        // Table Headers
        doc.font('Helvetica-Bold');
        doc.text('Product', colPositions[0], tableTop);
        doc.text('Qty', colPositions[1], tableTop, { width: colWidths[1], align: 'right' });
        doc.text('Price', colPositions[2], tableTop, { width: colWidths[2], align: 'right' });
        doc.text('Total', colPositions[3], tableTop, { width: colWidths[3], align: 'right' });
        
        // Table Rows
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

        // Order Summary
        const summaryTop = y + 20;
        const subtotal = validateNumber(order.subtotal);
        const delivery = validateNumber(order.delivery);
        const discount = validateNumber(order.discount);
        const total = validateNumber(order.total);

        // Draw line above summary
        doc.moveTo(colPositions[2], summaryTop - 10).lineTo(colPositions[3] + colWidths[3], summaryTop - 10).stroke();

        doc.text('Subtotal:', colPositions[2], summaryTop, { width: colWidths[2], align: 'right' });
        doc.text(`₹${subtotal.toFixed(2)}`, colPositions[3], summaryTop, { width: colWidths[3], align: 'right' });

        doc.text('Delivery:', colPositions[2], summaryTop + 20, { width: colWidths[2], align: 'right' });
        doc.text(`₹${delivery.toFixed(2)}`, colPositions[3], summaryTop + 20, { width: colWidths[3], align: 'right' });

        if (discount > 0) {
            doc.text('Discount:', colPositions[2], summaryTop + 40, { width: colWidths[2], align: 'right' });
            doc.text(`-₹${discount.toFixed(2)}`, colPositions[3], summaryTop + 40, { width: colWidths[3], align: 'right' });
        }

        // Total with bold font
        doc.font('Helvetica-Bold');
        doc.text('Total:', colPositions[2], summaryTop + 60, { width: colWidths[2], align: 'right' });
        doc.text(`₹${total.toFixed(2)}`, colPositions[3], summaryTop + 60, { width: colWidths[3], align: 'right' });
        doc.font('Helvetica');

        // Footer
        doc.moveDown(4);
        doc.fontSize(10).text('Thank you for your purchase!', { align: 'center' });
        doc.text('Contact us at contact@chettinadsarees.com for any queries', { align: 'center' });

        // Finalize the PDF
        doc.end();
        
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
};

const cancelOrder=async(req,res)=>{
    try {
        console.log("inside the cancel order controller ",req.params);

        const{orderId}=req.params;
        const{reason,itemsToCancel}=req.body;
//validation
if(!reason){
    return res.status(400).json({success:false,message:'cancellation reason is required'})
}
//find the other 
const order=await Order.findById(orderId);
if(!order){
    return res.status(404).json({success:false,message:'order not found'})
}
if(order.status!=='pending'&&order.status!=='processing'&&  order.status !== 'PENDING'){
    return res.status(400).json({
        success:false,
        message:'order cannt be cancelled at this stage '
    });
}

// full order cancellation
if(!itemsToCancel||itemsToCancel.length===0){
    order.status='cancelled';
    order.cancellation={
        reason,
        date:new Date(),
        initiatedBy:'customer',
        type:'full'
    }


await Promise.all(order.items.map(async item=>{
    await Product.findByIdAndUpdate(item.productId,{
        $inc:{stock:item.quantity}
    })
}))
    }else{
        // partial item cancelation 
        const cancelledItems=[];
for(const itemId of itemsToCancel){
    const itemIndex=order.items.findIndex(item=>item._id.toString()===itemId)
if(itemIndex===-1) continue;

const item=order.items[itemIndex];
cancelledItems.push({

    product:item.productId,
    quantity:item.quantity,
    name:item.name
});
await Product.findByIdAndUpdate(item.productId,{
    $inc:{stock:item.quantity}
});

order.items.splice(itemIndex,1);
}
if(cancelledItems.length===0){
    return res.status(400).json({
        success:false,
        message:'No valid items specified for cancellation'
    });
}
order.cancellation={
    reason,
    date:new Date(),
    initiatedBy:'customer',
    type:'partial',
    cancelledItems
}
    }
    await order.save();
res.json({success:true,message:'order cancelled successfully'})


    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Failed to cancel order' }); 
    }
}
const returnOrder = async (req, res) => {
    try {
        console.log("inside the return controller ")
        console.log(req.body);
        const { orderId } = req.params;
        const { reason, itemsToReturn,status} = req.body;

        // Validate input
        if (!reason) {
            return res.status(400).json({ success: false, message: 'Return reason is required' });
        }

        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
console.log("order",order);

        if (order.status.toLowerCase() !== 'delivered') {
            return res.status(400).json({ 
                success: false, 
                message: 'Only delivered orders can be returned' 
            });
        }

        // Check return window (14 days from delivery)
        const returnWindowDays = 14;
        const deliveryDate = new Date(order.deliveryDate);
        const returnDeadline = new Date(deliveryDate.setDate(deliveryDate.getDate() + returnWindowDays));
        
        if (new Date() > returnDeadline) {
            return res.status(400).json({ 
                success: false, 
                message: `Return window has expired (${returnWindowDays} days from delivery)` 
            });
        }

        // Check if return was already requested
        if (order.returnRequested) {
            return res.status(400).json({ 
                success: false, 
                message: 'Return already requested for this order' 
            });
        }

        // Handle full order return
        if (!itemsToReturn || itemsToReturn.length === 0) {
            // Full return
            order.returnRequested = true;
            order.returnDetails = {
                reason,
                requestDate: new Date(),
                status: 'pending',
                initiatedBy: 'customer',
                type: 'full',
                items: order.items.map(item => ({
                    product: item.productId,
                    quantity: item.quantity,
                    name: item.name
                }))
            };
        } else {
            // Partial return
            const returnedItems = [];
            
            // Validate items to return exist in order
            for (const itemReturn of itemsToReturn) {
                const item = order.items.find(i => i._id.toString() === itemReturn.itemId);
                if (!item) continue;

                returnedItems.push({
                    product: item.productId,
                    quantity: itemReturn.quantity || item.quantity,
                    name: item.name,
                    reason: itemReturn.reason || reason
                });
            }

            if (returnedItems.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No valid items specified for return' 
                });
            }

            order.returnRequested = true;
            order.returnDetails = {
                reason,
                requestDate: new Date(),
                status: 'pending',
                initiatedBy: 'customer',
                type: 'partial',
                items: returnedItems
            };
        }

        await order.save();

console.log("updated order:",order.returnRequested);
        res.json({ 
            success: true, 
            message: 'Return request submitted successfully',
            returnType: order.returnDetails.type,
            returnRequest:order.returnRequested
        });

    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'Failed to process return request' });
    }
};

// Additional controller to process approved returns (for admin)
const processReturn = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { action } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!order.returnRequested || order.returnDetails.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'No pending return request for this order' 
            });
        }

        if (action === 'approve') {
            // Update return status
            order.returnDetails.status = 'approved';
            order.returnDetails.processedDate = new Date();
            order.returnDetails.processedBy = req.user.id; 

            // Restock returned items
            await Promise.all(order.returnDetails.items.map(async item => {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }));

            // Optionally process refund here

            await order.save();
            return res.json({ success: true, message: 'Return approved and items restocked' });
        } else if (action === 'reject') {
            order.returnDetails.status = 'rejected';
            order.returnDetails.processedDate = new Date();
            order.returnDetails.processedBy = req.user.id;
            order.returnDetails.rejectionReason = req.body.rejectionReason || 'Not specified';

            await order.save();
            return res.json({ success: true, message: 'Return rejected' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ success: false, message: 'Failed to process return' });
    }
};
module.exports={
    processReturn,returnOrder,cancelOrder,invoice,getOrderDetails
}