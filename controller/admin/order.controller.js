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
  console.log("orderId", orderId);

  try {
    const { action, adminNotes, ItemsIds, rejectionReason } = req.body;  // Support ItemsIds array; ignore itemId if sent
    
    console.log("req.body inside the verify", req.body);
    if (!['approve', 'reject', 'reject-all', 'approve-all'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be either "approve" or "reject"',
        code: 'INVALID_ACTION'
      });
    }

    const order = await Order.findOne({ orderId: orderId })
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

    // Determine refundItems: Use ItemsIds if provided (partial/bulk), else all return_requested items
    const refundItems = ItemsIds?.length > 0
      ? order.items.filter(i => ItemsIds.includes(i._id.toString()) && i.status === 'return_requested')
      : order.items.filter(i => i.status === 'return_requested');

    if (refundItems.length === 0) {
      return res.status(400).json({ 
        error: 'No eligible items for processing',
        code: 'NO_ELIGIBLE_ITEMS'
      });
    }

    // Refund calculation (fixed: subtract delivery share)
    const couponDiscount = order.appliedCoupon?.value || 0;
    console.log("couponDiscount", couponDiscount);
    const deliveryCharge = order.deliveryCharge || 0;
    const totalPaid = order.total;
    let refundAmount = 0;

    if (totalPaid > 0) {  // Avoid division by zero
      refundItems.forEach(item => {
        const itemPrice = item.discountedPrice ?? item.price;
        const itemTotal = itemPrice * item.quantity;
        const itemCouponShare = (itemTotal / totalPaid) * couponDiscount;
        const itemDeliveryShare = (itemTotal / totalPaid) * deliveryCharge;
        refundAmount += itemTotal - itemCouponShare - itemDeliveryShare;  // Fixed: - deliveryShare
        console.log("Per-item refund:", itemTotal - itemCouponShare - itemDeliveryShare);
      });
    }
    refundAmount = Math.max(refundAmount, 0);
    console.log("Total refundAmount:", refundAmount);

    let wallet = await Wallet.findOne({ user: order.userId }) || new Wallet({ user: order.userId, balance: 0 });

    if (action === 'approve' || action === 'approve-all') {
      // Update items to returned
      refundItems.forEach(item => {
        item.status = 'returned';
        item.returnDetails = {  // Add per-item return details
          status: 'completed',
          processedDate: new Date(),
          processedBy: req.user?.id || 'admin',
          notes: adminNotes
        };
      });

      // Wallet refund (direct update for consistency)
      if (refundAmount > 0) {
        wallet.balance += refundAmount;
        wallet.transactions.push({
          amount: refundAmount,
          type: 'refund',
          order: order._id,
          description: `Refund for order #${order.orderId}`,
          reference: `REFUND=${order.orderId}-${Date.now()}`,
          status: 'completed'
        });
        await wallet.save();
        console.log(`Wallet refunded: +${refundAmount}, new balance: ${wallet.balance}`);
      }

      // Restock ONLY on approve (moved inside)
      const restockOps = refundItems.map(item =>
        Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: item.quantity } }, { new: true })
      );
      await Promise.all(restockOps);

      order.returnRequested = false;
      order.returnProcessedAt = new Date();
      order.adminNotes = adminNotes || 'Return approved by administrator';
      order.returnDetails.status = 'completed';  // Global status update
    } else {
      // Reject (or reject-all)
      refundItems.forEach(item => {
        item.status = 'return_rejected';
        item.returnDetails = {
          status: 'rejected',
          processedDate: new Date(),
          processedBy: req.user?.id || 'admin',
          rejectionReason: rejectionReason || 'Not specified',
          notes: adminNotes
        };
      });

      order.returnRequested = false;
      order.returnRejectedAt = new Date();
      order.adminNotes = adminNotes || `Return rejected: ${rejectionReason || 'Not specified'}`;
      order.returnDetails.status = 'rejected';  // Global status update
    }

    // Update order status
  const allReturned = order.items.every(i => i.status === 'returned');
    const hasSomeReturned = order.items.some(i => i.status === 'returned');
    const noPendingRequests = order.items.filter(i => i.status === 'return_requested').length === 0;
    
    if (allReturned) {
      order.status = 'returned';
    } else if (hasSomeReturned && noPendingRequests) {
      order.status = 'partially_returned';  
    } else if (noPendingRequests) {
      order.status = 'delivered'; 
    } else {
      order.status = 'partially_returned';  
    }
    
    order.returnDetails.type = refundItems.length === order.items.length ? 'full' : 'partial';

    console.log("order status inside the verify :", order.status);
    await order.save();
if (action.includes('approve')) {  
      await wallet.save();
    }
    return res.json({
      success: true,
      message: `Return request ${action.replace('-all', '')}d successfully`,
      orderId: order.orderId,
      status: order.status,
      ...(action.includes('approve') && { refundAmount, walletBalance: wallet.balance })
    });

  } catch (error) {
    console.error('return processing error:', error);
    return res.status(500).json({ 
      error: 'failed to process return request', 
      code: 'PROCESSING_ERROR', 
      details: error.message 
    });
  }
};

      

    
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
