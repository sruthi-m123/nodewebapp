const Order = require('../../models/orderSchema');

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search?.trim() || '';

    let orderFilter = { userId };

    if (searchQuery) {
      const regex = new RegExp(searchQuery, 'i');
      orderFilter = {
        userId,
        $or: [
          { orderId: { $regex: regex } },
          { 'items.name': { $regex: regex } },
          { 'items.productId.name': { $regex: regex } }
        ]
      };
    }

    const totalOrders = await Order.countDocuments(orderFilter);
    const totalPages = Math.ceil(totalOrders / limit);

    // Fetching orders
    const orders = await Order.find(orderFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.productId")
      .lean();

    const formatOrders = orders.map(order => ({
      id: order.orderId,
      price: order.total,
      deliveryDate: new Date(order.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000).toDateString(),
      imageUrl: order.items[0]?.productId?.images?.[0] || '/img/admin-products.png',
      productName: order.items[0]?.name || 'Product',
      varient: order.items[0]?.variant || 'Default',
      quantity: order.items[0]?.quantity || 1,
      status: order.status || 'pending'
    }));

    res.render('user/orderhistory', {
      pageCSS: 'user/orderHistory.css',
      pageJS: 'user/orderHistory.js',
      pagetitle: 'Order History',
      storeName: 'Chettinad sarees',
      orders: formatOrders,
      user: req.session.user,
      totalPages: totalPages,
      currentPage: page,
      searchQuery: searchQuery
    });

  } catch (error) {
    console.error('Error loading the history:', error);
    res.status(500).send("Error loading the order history page");
  }
};

module.exports = {
  getOrderHistory
};
