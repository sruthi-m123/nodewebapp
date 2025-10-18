const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema');
const Product=require('../../models/productSchema');
const mongoose=require('mongoose')
const Refund=require('../../models/refundSchema');
const getOrderAdmin = async (req, res) => {
  try {
    const limit = 6;
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search?.trim() || '';
    const status = req.query.status || '';
    const sort = req.query.sort || 'newest';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';


    let userFilter = {};
    if (search !== '') {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const userIds = users.map(u => u._id);
      userFilter.userId = { $in: userIds };
    }

  if (status) {
  userFilter.status = { $regex: new RegExp(`^${status}$`, 'i') };
}


    if (startDate || endDate) {
      userFilter.createdAt = {};
      if (startDate) {
        userFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        userFilter.createdAt.$lte = end;
      }
    }

    let sortOption = { createdAt: -1 }; 
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { total: -1 };
    } else if (sort === 'lowest') {
      sortOption = { total: 1 };
    }

    const orders = await Order.find(userFilter)
      .populate('userId', 'name email')
       .populate('items.productId', 'name image')
      .sort(sortOption)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const totalOrders = await Order.countDocuments(userFilter);
    const totalPages = Math.ceil(totalOrders / limit);

    
    if (page > totalPages && totalPages > 0) {
      return res.redirect(`/admin/orders?page=${totalPages}&search=${search}`);
    }
    
    const formattedOrders = orders.map(order => ({
      id: order._id,
      user: order.userId.name,
      date: order.createdAt.toISOString().split('T')[0],
      total: order.total,
      status: order.status,
      statusClass: order.status.toLowerCase().replace(/\s+/g, '-'),
      returnRequest: order.returnRequested || false,
      orderId:order.orderId,
      returnItems:order.returnDetails?.items||[]
    }));
    console.log("formatted Order:",formattedOrders);
     const buildPaginationUrl = (pageNum) => {
      const queryParams = new URLSearchParams({ ...req.query, page: pageNum });
      return `/admin/orders?${queryParams.toString()}`;
    };



    res.render('admin/orders', {
      pageTitle: 'Order Management - Chettinad Sarees',
      pageJs:'admin/order.js',
      layout: false,
      orders: formattedOrders,
      totalPages,
      currentPage: page,
      searchQuery: search,
      statusFilter: status,
      sortOption: sort,
      startDate,
      endDate,
      buildPaginationUrl,
      
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Server Error');
  }
};

const getOrder=async(req,res)=>{
    try {
        const order=Order.findById(req.params.id)
        .populate('userId','name email')
        .populate('items.productId','name images');
if(!order){
    return res.status(404).render('error',{error:'order not found'});
}
console.log('order staaatus',order.status)
res.render('admin/order-details',{
    title:'Order Details',
    order,
    layout:false
})
    } catch (error) {
      console.error('error fecthing order :',error);
      res.status(500).render('error',{error:'failed to load order'})  
    }
}

const updateOrderStatus=async(req,res)=>{
    try{
        console.log("reached the update controller ")
        const{orderId}=req.params;
        const {status}=req.body;

         const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled', 'returned','processing'];
   if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
const updatedOrder=await Order.findByIdAndUpdate(
    orderId,
    {status},
    {new:true}
).populate('userId','name email');
if(!updatedOrder){
    return res.status(404).json({error:'order not found'});
}

    res.json({
      success: true,
      status: updatedOrder.status,
      statusClass: updatedOrder.status.toLowerCase().replace(/\s+/g, '-'),
      
    });
   
        }catch(error){
 console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update status' });
        }
    }
const getReturnDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId }).populate('items.productId');
    if (!order || !order.returnRequested) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    const { returnDetails } = order;
    const returnType = returnDetails.items?.length > 0 ? 'partial' : 'full';
    console.log(`Fetching return details for order ${orderId}: type=${returnType}, raw items length=${returnDetails.items?.length || 0}`);

    let items = [];
    if (returnType === 'partial' && returnDetails.items?.length > 0) {
      items = returnDetails.items.map(returnItem => {
        // Fix matching: Use product OID from DB schema (returnItem.product === i.productId)
        const matchedItem = order.items.find(i => i.productId.toString() === returnItem.product.toString());
        return {
          _id: returnItem._id,
          name: matchedItem?.name || returnItem.name || 'Unknown Item',
          quantity: matchedItem?.quantity || returnItem.quantity || 0,
          price: matchedItem?.totalPrice || returnItem.price || 'N/A',
          reason: returnItem.reason || 'Not specified',
          status: returnItem.status || matchedItem?.status || 'Pending',
        };
      });
    }

    // Fix reason: Use global if set, else first item's reason for partial
    const globalReason = returnDetails.reason || (returnType === 'partial' ? items[0]?.reason : 'Not specified');

    res.json({
      reason: globalReason,
      notes: returnDetails.notes || 'None',
      type: returnType,  // Use computed returnType (fixes inconsistency!)
      totalItems: order.items.length,
      items,
    });

  } catch (error) {
    console.error('Error fetching return details:', error);
    res.status(500).json({ error: 'Failed to fetch return details' });
  }
};








const verifyReturnedRequest = async (req, res) => {
  console.log("Return verification initiated");
  console.log("req.body:", req.body);

  const { orderId } = req.params;
  console.log("orderId",orderId);

  let wallet;

  try {

    const{action,adminNotes,ItemsIds}=req.body;
    
console.log("req.body inside the verify",req.body);
    if (!['approve', 'reject','reject-all','approve-all'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be either "approve" or "reject"',
        code: 'INVALID_ACTION'
      });
    }


    const order = await Order.findOne({orderId: orderId})
      .populate('userId', 'name email')
      .populate('items.productId', 'name price stock');

    if (!order) {
      return res.status(404).json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (!order.returnRequested) {
      return res.status(400).json({ 
        error: 'No return request exists for this order',
        code: 'NO_RETURN_REQUEST'
      });
    }

const refundItems=ItemsIds?.length
? order.items.filter(i=>ItemsIds.includes(i._id.toString()))
:order.items;

//refund calculation
const couponDiscount=order.appliedCoupon?.value||0;
console.log("couponDiscount",couponDiscount);
const deliveryCharge=order.deliveryCharge||0;

const totalPaid=order.total;
let refundAmount=0;
refundItems.forEach(item=>{

  const itemPrice=item.discountedPrice??item.price;
  const itemTotal=itemPrice*item.quantity;


const itemCouponshare=(itemTotal/totalPaid)*couponDiscount;
const itemDeliveryShare=(itemTotal/totalPaid)*deliveryCharge;

refundAmount+=itemTotal-itemCouponshare+itemDeliveryShare;
console.log("refundAmount:",refundAmount);
});
const wallet=await Wallet.findOne({user:order.userId})||new Wallet({user:order.userId,balance:0})



    if (action === 'approve') {


      refundAmount=Math.max(refundAmount,0)

      //Update Wallet
await wallet.addFunds(refundAmount,{
  order:order._id,
  description:`Refund for order #${order.orderId}`,
  reference:`REFUND=${order.orderId}-${Date.now()}`,
  status:'completed'
})

refundItems.forEach(item=>{
  item.status='returned';
});

      

      order.returnRequested = false;
      order.status =refundItems.length===order.items.length?'returned':'partially_returned';
      console.log("order status inside the verify :",order.status);
      order.returnProcessedAt = new Date();
      order.adminNotes = adminNotes || 'Return approved by administrator';

      
      }else{
        //reject
refundItems.forEach(item=>{
  item.status='return_rejected';
});

order.returnRequested=false;
order.returnRejectedAt=new Date();
order.adminNotes=adminNotes||'rejected by admin'
      }
const restockOps=refundItems.map(item=>
  Product.findByIdAndUpdate(item.productId._id,{$inc:{stock:item.quantity}},{new:true})
)
await Promise.all([order.save(),wallet.save(),...restockOps]);

 return res.json({
      success: true,
      message: `Return request ${action} successfully`,
      orderId: order.orderId,
      status: order.status,
      ...(action === 'approve' && { refundAmount, walletBalance: wallet.balance })
    });
    }catch(error){
      console.error('return processing error:',error);
      return res.status(500).json({error:'failed to process return request',code:'PROCESSING_ERROR',details:error.message})
    }
  }

const getOrderDetails=async(req,res)=>{
  try {
    const orderId=req.params.orderId;
    const order=await Order.findOne({orderId})
.populate('items.productId')
.exec();

if(!order){
  return res.status(404).send("order not found");
}
console.log("ORDEEERS",order.status)
res.render('admin/orderDetailPage',{order,layout:false})
  } catch (error) {
    console.error(error);
    res.status(500).send("server error");
  }
}

const crypto = require("crypto");

function generateRefundId(orderId) {
  const random = crypto.randomBytes(2).toString("hex"); 
  return `REF-${orderId.slice(-6)}-${Date.now()}-${random}`;
}


module.exports = { 
  getOrderAdmin,
  getOrder,
  updateOrderStatus,
  verifyReturnedRequest,
getOrderDetails,
getReturnDetails
};
