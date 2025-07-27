const Order=require('../../models/orderSchema');
const User=require('../../models/userSchema');
const PDFDocument=require('pdfkit');
const fs=require('fs');

const getOrderDetails=async(req,res)=>{
    try {
        console.log("inside the orderDetail controller");
        const userId=req.session.user._id;
        const orderId=req.params.orderId;
        console.log(userId);
        console.log(orderId);

const order=await Order.findOne({orderId:orderId,userId})
.populate('items.productId')
.lean();
console.log('orders inside the orderdetailController',order);
if(!order){
    return res.status(404).render('error',{message:'order not found'})
}
//format data 
const formatItems=order.items.map(item=>({
    ...item,
    name:item.productId.ProductName,
    imageUrl:item.productId.images[0]||'img/admin-workshop',
    color:item.productId.color

}))
console.log("order status:",order.status);
const statusHistory=[
    {
        date:order.createdAt,
        message:'your order has been placed'
    }
];
if(order.status==='Shipped'){
    statusHistory.push({
        date:order.shippedAt,
        message:'your order has been shipped'
    });
};
if(order.status==='Out for Delivery'){
    statusHistory.push({
        date:order.outForDeliveryAt,
message:'your order is out for delivery.'
    })
}

if(order.status==='Delivered'){
    statusHistory.push({
        date:order.deliveredAt,
        message:'your order has been cancelled.'
    })
}
const getStatusmessage=(status)=>{
    const messages={
        'ORDERED':'your order has been recived and is being processed.',
        'PROCESSING':'Seller is preparing yout item for shipment.',
        'SHIPPED':'Your item has beed shipped and is on its way.',
        'DELIVERED':'You have requested to return this item.',
        'RETURN_REQUESTED':'You have requested to return this item,',
        'RETURNED':'the returned product has beed recived ',
        'CANCELLED':'Your order has been cancelled.'
    };
    return messages[status.toUpperCase()]||'Your order is being processed.'
};
res.render('user/orderDetails',{
    pageCSS:'user/orderDetail.css',
    pageJS:'user/orderDetail.js',
    pageTitle:'Order Detail',
    storeName:'Chettinad sarees',
    order:{
        ...order,
        items:formatItems,
        statusHistory
    },
    getStatusmessage,
    user:req.session.user
})


    } catch (error) {
        console.error('error fetching order details:',error);
        res.status(500).render('user/error',{
            message:'error loading order details'
        });
    }
}

// In your Express routes (e.g., routes/orders.js)
const invoice= async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('items.product');
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Create a PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${orderId}.pdf`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Add content to the PDF
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();
        
        // Order details
        doc.fontSize(14).text(`Order #: ${order.orderId}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.moveDown();
        
        // Customer information
        doc.fontSize(12).text('BILL TO:', { underline: true });
        doc.text(order.shippingAddress.name);
        doc.text(order.shippingAddress.building);
        doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`);
        doc.moveDown();
        
        // Items table
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Description', 50, tableTop);
        doc.text('Price', 300, tableTop, { width: 100, align: 'right' });
        doc.text('Qty', 400, tableTop, { width: 50, align: 'right' });
        doc.text('Amount', 450, tableTop, { width: 100, align: 'right' });
        doc.font('Helvetica');
        
        let y = tableTop + 25;
        order.items.forEach(item => {
            doc.text(item.name, 50, y);
            doc.text(`₹${item.price.toFixed(2)}`, 300, y, { width: 100, align: 'right' });
            doc.text(item.quantity.toString(), 400, y, { width: 50, align: 'right' });
            doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 450, y, { width: 100, align: 'right' });
            y += 20;
        });
        
        // Total
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 20;
        doc.font('Helvetica-Bold');
        doc.text('TOTAL', 350, y, { width: 100, align: 'right' });
        doc.text(`₹${order.total.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
        
        // Footer
        doc.font('Helvetica');
        doc.fontSize(10).text('Thank you for your business!', 50, doc.page.height - 50, { align: 'center' });
        
        // Finalize the PDF
        doc.end();
        
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
}







module.exports={
    getOrderDetails,
    invoice
}