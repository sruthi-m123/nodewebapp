const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema');
const Product=require('../../models/productSchema');
const mongoose=require('mongoose')

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

    // Apply status filter
  if (status) {
  userFilter.status = { $regex: new RegExp(`^${status}$`, 'i') };
}


    // Apply date range filter
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

    // Sort logic
    let sortOption = { createdAt: -1 }; 
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest') {
      sortOption = { total: -1 };
    } else if (sort === 'lowest') {
      sortOption = { total: 1 };
    }

    // Fetch orders
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
      orderId:order.orderId
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
    //   pageCSS: 'css/admin/order.css',
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

         const validStatuses = ['pending', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'returned','processing','ordered'];
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
      statusClass: updatedOrder.status.toLowerCase().replace(/\s+/g, '-')
    });
   
        }catch(error){
 console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update status' });
        }
    }
const getReturnDetails=async(req,res)=>{
  try {
   const orderId=req.params.orderId;
   console.log("orerId inside the verify :",orderId);
   const order=await Order.findOne({orderId:orderId});
   console.log("order imside the verify controller :",order);
   if(!order){
    return res.status(404).json({error:"order not found"});
   }
   
   if(!order.returnRequested){
    return res.status(400).json({error:"No return request for this order  "})
   }

res.json({
  reason:order.returnDetails.reason,
  notes:order.returnDetails.notes||"None"
});

  } catch (error) {
    console.error("error fetching return details :",error);
    res.status(500).json({error:"server error"})
  }
}








const verifyReturnedRequest = async (req, res) => {
  console.log("Return verification initiated");
  console.log("req.body:", req.body);

  const { orderId } = req.params;
  let wallet;

  try {
    const { action, adminNotes } = req.body;

    // Validate input
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        error: 'Invalid action. Must be either "approve" or "reject"',
        code: 'INVALID_ACTION'
      });
    }

    // Find order with necessary data (removed session)
    const order = await Order.findOne({orderId: orderId})
      .populate('user', 'name email')
      .populate('items.product', 'name price stock');

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

    if (action === 'approve') {
      if (order.returnApproved) {
        return res.status(400).json({ 
          error: 'Return already approved',
          code: 'ALREADY_APPROVED'
        });
      }

      // Validate refund amount
      if (order.totalAmount <= 0) {
        return res.status(400).json({
          error: 'Invalid refund amount',
          code: 'INVALID_REFUND_AMOUNT'
        });
      }

      // Update order status
      order.returnRequested = false;
      order.returnApproved = true;
      order.status = 'returned';
      order.returnProcessedAt = new Date();
      order.adminNotes = adminNotes || 'Return approved by administrator';

      const refundAmount = order.totalAmount;

      // Handle wallet operations (removed session)
      wallet = await Wallet.findOne({ user: order.user._id });
      
      if (!wallet) {
        wallet = new Wallet({
          user: order.user._id,
          balance: 0
        });
        await wallet.save();
      }

      // Create unique reference for the transaction
      const transactionRef = `REFUND-${order.orderId}-${Date.now()}`;
      
      await wallet.addFunds(refundAmount, {
        order: order._id,
        description: `Refund for order #${order.orderId}`,
        reference: transactionRef,
        status: 'completed'
      });

      // Create refund record
      const refund = new Refund({
        order: order._id,
        user: order.user._id,
        amount: refundAmount,
        status: 'completed',
        processedBy: req.user.id,
        notes: adminNotes,
        walletTransaction: wallet.transactions[wallet.transactions.length - 1]._id
      });

      // Restock products (removed session)
      const restockOps = order.items.map(item => 
        Product.findByIdAndUpdate(
          item.product._id,
          { $inc: { stock: item.quantity } },
          { new: true }
        )
      );

      // Execute all operations (removed session)
      await Promise.all([
        order.save(),
        refund.save(),
        ...restockOps
      ]);

      // Send notification
      try {
        await sendNotification({
          email: order.user.email,
          type: 'refund_approved',
          data: {
            orderId: order.orderId,
            amount: refundAmount,
            newBalance: wallet.balance
          }
        });
      } catch (notificationError) {
        console.error('Notification failed:', notificationError);
        // Notification failure shouldn't fail the request
      }

    } else {
      // Handle rejection (removed session)
      order.returnRequested = false;
      order.returnApproved = false;
      order.returnRejectedAt = new Date();
      order.adminNotes = adminNotes || 'Return rejected by administrator';
      
      await order.save();

      try {
        await sendNotification({
          email: order.user.email,
          type: 'refund_rejected',
          data: {
            orderId: order.orderId,
            reason: adminNotes
          }
        });
      } catch (notificationError) {
        console.error('Notification failed:', notificationError);
      }
    }

    return res.json({ 
      success: true,
      message: `Return request ${action}d successfully`,
      orderId: order.orderId,
      status: order.status,
      ...(action === 'approve' && { 
        refundAmount: order.totalAmount,
        newBalance: wallet.balance 
      })
    });

  } catch (error) {
    console.error('Return processing error:', {
      error: error.message,
      stack: error.stack,
      orderId,
      action: req.body.action
    });

    const response = {
      error: 'Failed to process return request',
      code: 'PROCESSING_ERROR'
    };

    if (process.env.NODE_ENV === 'development') {
      response.details = error.message;
      response.stack = error.stack;
    }

    return res.status(500).json(response);
  }
};
const getOrderDetails=async(req,res)=>{
  try {
    const orderId=req.params.orderId;
    const order=await Order.findById(orderId)
.populate('items.productId')
.exec();

if(!order){
  return res.status(404).send("order not found");
}
res.render('admin/orderDetailPage',{order,layout:false})
  } catch (error) {
    console.error(err);
    res.status(500).send("server error");
  }
}


module.exports = { 
  getOrderAdmin,
  getOrder,
  updateOrderStatus,
  verifyReturnedRequest,
getOrderDetails,
getReturnDetails
};
