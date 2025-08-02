const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema');

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
console.log("return request",orders.returnRequested);
    
    const formattedOrders = orders.map(order => ({
      id: order._id,
      user: order.userId.name,
      date: order.createdAt.toISOString().split('T')[0],
      total: order.total,
      status: order.status,
      statusClass: order.status.toLowerCase().replace(/\s+/g, '-'),
      returnRequest: order.returnRequested || false
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
const verifyReturnedRequest=async(req,res)=>{
    try {
        const{orderId}=req.params;
        const{action}=req.body;

        const order=await Order.findById(orderId);
        
         if (!order.returnRequested) {
      return res.status(400).json({ error: 'No return request for this order' });
    }

    if (action === 'approve') {
      order.returnRequested = false;
      order.returnApproved = true;
      order.status = 'returned';
      // Here you would typically add logic for refund processing
    } else if (action === 'reject') {
      order.returnRequested = false;
      order.returnApproved = false;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
    await order.save();
    res.json({ success: true });
    } catch (error) {
         console.error('Error verifying return request:', error);
    res.status(500).json({ error: 'Failed to process return request' 
    });
}
}
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
getOrderDetails
};
