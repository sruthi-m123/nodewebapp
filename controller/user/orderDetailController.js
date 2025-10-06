const Order=require('../../models/orderSchema');
const Product=require('../../models/productSchema');
const User=require('../../models/userSchema');
const Wallet=require('../../models/walletSchema');
const PDFDocument=require('pdfkit');
const fs=require('fs');
const { log } = require('console');
const getOrderDetails = async (req, res) => {
  try {
    console.log("👉 Inside the orderDetail controller");
    console.log(req.session.user)

    const userId = req.session.user.id;
    const orderId = req.params.orderId;

 

    const order = await Order.findOne({ orderId, userId })
      .populate('items.productId')
      .lean();
console.log("orders",order);
    if (!order) {
      return res.status(404).render('error', { message: 'Order not found' });
    }
console.log("order inside orderdetailsssssss:",order);
    const formatItems = order.items.map(item => ({
      ...item,
      name: item.productId?.ProductName || item.name,
      imageUrl: item.productId?.images?.[0] || 'img/admin-workshop',
      color: item.productId?.color || 'N/A'
    }));

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
    console.log("Inside catch block");
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
        doc.pipe(res);
        
        const validateNumber = (value) => {
            const num = Number(value);
            return isNaN(num) ? 0 : num;
        };

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
        const colPositions = [50, 300, 370, 450]; 
        const colWidths = [250, 70, 80, 80];

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
const cancelOrder = async (req, res) => {
  try {
    console.log("Cancel controller called");

    const { orderId } = req.params;
    const { reason, itemId, customReason } = req.body;

    console.log("req.body inside cancel", req.body);

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const cancellationReason = customReason || reason;
    if (!cancellationReason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    // Only allow cancel if order is not delivered/shipped/returned
    if (!['pending', 'processing','paid'].includes(order.status.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    let cancelledItems = order.cancellation?.cancelledItems || [];
    const deliveryCharge = order.delivery || 0;
    const totalPaid = order.total;
    let refundAmount = 0;

    if (!itemId) {
      //  Full order cancellation
      order.items.forEach(item => {
        if (item.status !== 'cancelled') {
          item.status = 'cancelled';
          cancelledItems.push({
            product: item.productId,
            name: item.name,
            quantity: item.quantity,
            reason: cancellationReason
          });
        }
      });

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      refundAmount = totalPaid - deliveryCharge;

      order.cancellation = {
        reason: cancellationReason,
        date: new Date(),
        initiatedBy: 'customer',
        type: 'full',
        cancelledItems
      };

      // Restore stock for all items
      await Promise.all(order.items.map(item =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      ));

    } else {
      //  Partial (single item) cancellation
      const item = order.items.id(itemId);

      if (!item) {
        return res.status(404).json({ success: false, message: 'Item not found in order' });
      }

      if (item.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'Item already cancelled' });
      }

      // Restore stock
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });

      // Mark item as cancelled
      item.status = 'cancelled';
      cancelledItems.push({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        reason: cancellationReason
      });

      const allCancelled = order.items.every(i => i.status === 'cancelled');
      order.status = allCancelled ? 'cancelled' : 'partially_cancelled';

      const activeItemsCount = order.items.length;
      const perItemRefund = (totalPaid - deliveryCharge) / activeItemsCount;
      const perItemDelivery = deliveryCharge / activeItemsCount;
      refundAmount = perItemRefund - perItemDelivery;
console.log("refundAmount:",refundAmount);
      order.cancellation = {
        reason: cancellationReason,
        date: new Date(),
        initiatedBy: 'customer',
        type: allCancelled ? 'full' : 'partial',
        cancelledItems
      };
    }

    // Save order
    await order.save();

    // Wallet refund
    if (refundAmount > 0) {
      const wallet = await Wallet.findOne({ user: order.userId });
      if (wallet) {
        wallet.balance += refundAmount;
        wallet.transactions.push({
          amount: refundAmount,
          type: 'refund',
          order: order._id,
          description: `Refund for order cancellation (${order.orderId})`,
          status: 'completed'
        });
        await wallet.save();
      }
    }

    return res.json({
      success: true,
      message: 'Cancellation processed successfully',
      order
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};


const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("orderId",orderId);
    const { reason, itemId, customReason } = req.body;
    const returnReason = customReason || reason;
console.log("return reason:",reason)
    if (!returnReason) {
      return res.status(400).json({ success: false, message: "Return reason is required" });
    }

    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!["delivered", "partially_returned"].includes(order.status.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }

    order.returnRequested = true;

    if (!itemId) {
      // FULL RETURN
      console.log("inside the full order return controler ");
      const returnItems = [];
      order.items.forEach(item => {
        if (!["returned", "return_requested"].includes(item.status)) {
          item.status = "return_requested";
          returnItems.push({
            product: item.productId._id,
            quantity: item.quantity,
            name: item.name,
            reason: returnReason
          });
        }
      });

      order.status = "return_requested";
      order.returnDetails = {
        reason: returnReason,
        requestDate: new Date(),
        status: "pending",
        initiatedBy: "customer",
        type: "full",
        items: returnItems
      };
    } else {
      // PARTIAL RETURN
      const item = order.items.id(itemId);
      console.log("inside the partial return controller ")
      if (!item) {
        return res.status(400).json({ success: false, message: "Item not found in order" });
      }
      if (["returned", "return_requested"].includes(item.status)) {
        return res.status(400).json({ success: false, message: "Item already in return process" });
      }

      item.status = "return_requested";
      console.log("item status:",item.status);
      if (!order.returnDetails) {
        order.returnDetails = {
          reason: returnReason,
          requestDate: new Date(),
          status: "pending",
          initiatedBy: "customer",
          type: "partial",
          items: []
        };
      }
      order.returnDetails.items.push({
        product: item.productId._id,
        quantity: item.quantity,
        name: item.name,
        reason: returnReason,
        price:item.totalPrice
      });
      order.status = "partially_returned";
    }

    await order.save();
    return res.json({ success: true, message: "Return request submitted successfully", order });

  } catch (error) {
    console.error("Error creating return request:", error);
    res.status(500).json({ success: false, message: "Failed to submit return request" });
  }
};

const getReturnDetails=async(req,res)=>{
  try {
    const {orderId}=req.params;
    const order=await Order.findById(orderId).populate('items.productId');
    if(!order || !order.returnRequested){
      return res.status(404).json({error:'Return request not found'});
    }

    const {returnDetails}=order;
    res.json({
      reason:returnDetails.reason,
      notes:returnDetails.notes,
      type:returnDetails.type,
      totalItems:order.items.length,
      items:returnDetails.items.map(item=>({
        _id:item._id,
        name:item.name,
        quantity:item.quantity,
        price:item.price||order.items.find(i=>i.productId._id.toString()===item.product.toString())?.totalPrice||'N/A',
reason:item.reason
      }))
    });
  } catch (error) {
    console.error('error fetching return details:',error);
    res.status(500).json({error:'failed to fectch details'})
  }
}





const processReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { itemId, action, rejectionReason } = req.body;

    const order = await Order.findById(orderId).populate("items.productId");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // FULL RETURN
    if (!itemId) {
      if (action === "approve") {
        let refundAmount = 0;
        order.items.forEach(item => {
          if (item.status === "return_requested") {
            item.status = "returned";
            refundAmount += item.totalPrice; // include discounted price
            item.returnDetails = {
              status: "approved",
              processedDate: new Date(),
              processedBy: req.user.id
            };
          }
        });

        order.status = "returned";
        order.returnRequested = false;
        order.returnDetails.status = "completed";

        // Refund to wallet
        let wallet = await Wallet.findOne({ user: order.userId });
        if (!wallet) wallet = new Wallet({ user: order.userId });
        await wallet.addFunds(refundAmount, {
          type: "refund",
          order: order._id,
          description: `Full refund for order ${order.orderId}`
        });

      } else if (action === "reject") {
        order.items.forEach(item => {
          if (item.status === "return_requested") {
            item.status = "delivered";
            item.returnDetails = {
              status: "rejected",
              processedDate: new Date(),
              processedBy: req.user.id,
              rejectionReason: rejectionReason || "Not specified"
            };
          }
        });
        order.status = "delivered";
        order.returnRequested = false;
      }

      await order.save();
      return res.json({ success: true, message: `Full order return ${action}d successfully`, order });
    }

    // PARTIAL RETURN
    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (item.status !== "return_requested") {
      return res.status(400).json({ success: false, message: "This item does not have a pending return request" });
    }

    if (action === "approve") {
      item.status = "returned";
      item.returnDetails = {
        status: "approved",
        processedDate: new Date(),
        processedBy: req.user.id,
        refundAmount:item.totalPrice,
        name:item.productId.ProductName,
        quantity:item.quantity
      };

      // Refund single item to wallet
      const itemRefund = item.totalPrice;
      let wallet = await Wallet.findOne({ user: order.userId });
      if (!wallet) wallet = new Wallet({ user: order.userId });
      await wallet.addFunds(itemRefund, {
        type: "refund",
        order: order._id,
        description: `Refund for item ${item.name} in order ${order.orderId}`
      });

      // Restock product
      await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: item.quantity } });

    } else if (action === "reject") {
      item.status = "delivered";
      item.returnDetails = {
        status: "rejected",
        processedDate: new Date(),
        processedBy: req.user.id,
        rejectionReason: rejectionReason || "Not specified"
      };
    }

    // Check if all items are returned → mark order fully returned
    const allReturned = order.items.every(i => i.status === "returned");
    if (allReturned) {
      order.status = "returned";
      order.returnRequested = false;
      order.returnDetails.type = "full";
      order.returnDetails.status = "completed";
    } else {
      order.returnDetails.type = "partial";
    }

    await order.save();
    return res.json({ success: true, message: `Item return ${action}d successfully`, order });

  } catch (error) {
    console.error("Error processing return:", error);
    res.status(500).json({ success: false, message: "Failed to process return" });
  }
};



module.exports={
    processReturn,returnOrder,cancelOrder,invoice,getOrderDetails,getReturnDetails
}