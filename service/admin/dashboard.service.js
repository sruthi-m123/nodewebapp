import Order from '../../models/orderSchema.js';
// import Product from '../../models/productSchema.js';
import User from '../../models/userSchema.js';
import logger from '../../utils/logger.js';

export const getDashboardStatsService = async () => {
  const totalUsers = await User.countDocuments();
  
  const itemsSoldResult = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: null, total: { $sum: '$items.quantity' } } }
  ]);
  const itemsSold = itemsSoldResult.length > 0 ? itemsSoldResult[0].total : 0;
  
  const totalSalesResult = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$subtotal' } } }
  ]);
  const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
  
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  
  logger.info('Dashboard stats calculated', { totalUsers, itemsSold, totalSales, pendingOrders });
  
  return {
    totalUsers,
    itemsSold,
    totalSales,
    pendingOrders
  };
};

export const getTopProductsService = async (page = 1, limit = 4) => {
  const skip = (page - 1) * limit;
  
  logger.debug('Fetching top products', { page, limit, skip });
  
  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        totalQuantity: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' }
  ]);
  
  const totalCount = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productId' } },
    { $count: 'total' }
  ]);
  
  const totalPages = Math.ceil((totalCount[0]?.total || 0) / limit);
  
  const products = topProducts.map(item => ({
    id: item.product._id,
    image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '/images/placeholder.jpg',
    name: item.product.productName,
    price: item.product.price,
    revenue: item.totalRevenue,
    quantity: item.totalQuantity
  }));

  logger.debug('Top products fetched successfully', { 
    productCount: products.length,
    totalPages 
  });

  return {
    products,
    totalPages
  };
};

export const getSalesDataService = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);
  
  logger.debug('Fetching sales data for last 12 months');
  
  const salesData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalSales: { $sum: '$subtotal' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const labels = [];
  const values = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(currentDate.getMonth() - i);
    
    const month = date.getMonth();
    const year = date.getFullYear();
    
    labels.push(`${monthNames[month]} ${year}`);
    
    const monthData = salesData.find(d => d._id.year === year && d._id.month === month + 1);
    values.push(monthData ? monthData.totalSales : 0);
  }
  
  logger.info('Sales data processed successfully', { dataPoints: values.length });
  
  return { labels, values };
};

export const getSalesReportService = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    dateRange,
    startDate,
    endDate
  } = filters;
  
  let dateFilter = {};
  const now = new Date();
  
  switch (dateRange) {
    case '1d': {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
      break;
    }
      
    case '1w': {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
      break;
    }
      
    case '1m': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
      break;
    }
      
    case '1y': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: startOfYear } };
      break;
    }
      
    case 'custom': {
      if (startDate && endDate) {
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: customStart, $lte: customEnd } };
      }
      break;
    }
      
    default: {
      const defaultStart = new Date();
      defaultStart.setHours(0, 0, 0, 0);
      const defaultEnd = new Date();
      defaultEnd.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: defaultStart, $lte: defaultEnd } };
      break;
    }
  }
  
  dateFilter.status = { $ne: 'cancelled' };
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  logger.debug('Fetching sales report with filters', { 
    dateFilter, 
    page, 
    limit, 
    skip 
  });
  
  const orders = await Order.find(dateFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email')
    .populate('items.productId', 'productName');
  
  const totalOrders = await Order.countDocuments(dateFilter);
  
  const summaryData = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$subtotal' },
        totalDiscount: { $sum: '$discount' },
        netRevenue: { $sum: { $subtract: ["$subtotal", "$discount"] } },
        totalTax: { $sum: { $subtract: ["$total", { $subtract: ["$subtotal", "$discount"] }] } }
      }
    }
  ]);
  
  const summary = summaryData[0] || {
    totalSales: 0,
    totalDiscount: 0,
    netRevenue: 0,
    totalTax: 0
  };
  
  const formattedOrders = orders.map(order => ({
    date: order.createdAt,
    orderId: order.orderId,
    customerName: order.userId?.name || 'Guest',
    itemsCount: order.items.reduce((total, item) => total + item.quantity, 0),
    amount: order.subtotal,
    discount: order.discount || 0,
    coupons: order.appliedCoupon?.code || 'None',
    paymentMethod: order.paymentMethod || 'N/A',
    netAmount: order.subtotal - (order.discount || 0) - (order.appliedCoupon?.value || 0)
  }));
  
  logger.info('Sales report generated successfully', {
    orderCount: formattedOrders.length,
    totalOrders,
    totalPages: Math.ceil(totalOrders / parseInt(limit))
  });
  
  return {
    orders: formattedOrders,
    summary: {
      totalOrders,
      totalSales: summary.totalSales,
      totalDiscount: summary.totalDiscount,
      netRevenue: summary.netRevenue,
      totalTax: summary.totalTax
    },
    totalPages: Math.ceil(totalOrders / parseInt(limit)),
    currentPage: parseInt(page)
  };
};

export const getExportDataService = async (filters = {}) => {
  const { dateRange, startDate, endDate } = filters;
  
  let dateFilter = {};
  const now = new Date();
  
  switch (dateRange) {
    case '1d': {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
      break;
    }
    case '1w': {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
      break;
    }
    case '1m': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
      break;
    }
    case '1y': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      dateFilter = { createdAt: { $gte: startOfYear } };
      break;
    }
    case 'custom': {
      if (startDate && endDate) {
        const customStart = new Date(startDate);
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: customStart, $lte: customEnd } };
      }
      break;
    }
    default: {
      const defaultStart = new Date();
      defaultStart.setHours(0, 0, 0, 0);
      const defaultEnd = new Date();
      defaultEnd.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: defaultStart, $lte: defaultEnd } };
      break;
    }
  }
  
  dateFilter.status = { $ne: 'cancelled' };
  
  logger.debug('Fetching export data with filters', { dateFilter });
  
  const orders = await Order.find(dateFilter)
    .sort({ createdAt: -1 })
    .populate('userId', 'name email')
    .populate('items.productId', 'productName');
  
  const summaryData = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: '$subtotal' },
        totalDiscount: { $sum: '$discount' },
        netRevenue: { $sum: { $subtract: ["$subtotal", "$discount"] } },
        totalTax: { $sum: { $subtract: ["$total", { $subtract: ["$subtotal", "$discount"] }] } }
      }
    }
  ]);
  
  const summary = summaryData[0] || {
    totalSales: 0,
    totalDiscount: 0,
    netRevenue: 0,
    totalTax: 0
  };
  
  logger.info('Export data prepared successfully', { 
    orderCount: orders.length,
    summary 
  });
  
  return {
    orders,
    summary,
    dateRange,
    startDate,
    endDate
  };
};