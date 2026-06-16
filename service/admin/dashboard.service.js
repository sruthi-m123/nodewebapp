import Order from '../../models/orderSchema.js';
// import Product from '../../models/productSchema.js';
import User from '../../models/userSchema.js';
import logger from '../../utils/logger.js';
import Category from '../../models/categorySchema.js';
import Product  from '../../models/productSchema.js';

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

export const getSalesDataService = async (period = 'monthly') => {
  return await getChartDataService(period);
};



export const getSalesReportService = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    dateRange,
    startDate,
    endDate,
    chartPeriod = 'monthly' // New parameter for chart data period
  } = filters;
  
  let dateFilter = {};
  const now = new Date();
  
  // Date range filter logic (existing)
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
  
  // Exclude cancelled orders
  dateFilter.status = { $ne: 'cancelled' };
  
  // Get chart data based on chartPeriod
  const chartData = await getChartDataService(chartPeriod);
  
  // Pagination logic
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  logger.debug('Fetching sales report with filters', { 
    dateFilter, 
    page, 
    limit, 
    skip,
    chartPeriod
  });
  
  // Get orders for the report
  const orders = await Order.find(dateFilter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'name email')
    .populate('items.productId', 'productName');
  
  const totalOrders = await Order.countDocuments(dateFilter);
  
  // Get summary data
  const summaryData = await Order.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $ifNull: ['$subtotal', 0] } },
        totalDiscount: { $sum: { $ifNull: ['$discount', 0] } },
        netRevenue: { $sum: { $subtract: [{ $ifNull: ['$subtotal', 0] }, { $ifNull: ['$discount', 0] }] } },
        totalTax: { $sum: { $subtract: [{ $ifNull: ['$total', 0] }, { $subtract: [{ $ifNull: ['$subtotal', 0] }, { $ifNull: ['$discount', 0] }] }] } }
      }
    }
  ]);
  
  const summary = summaryData[0] || {
    totalSales: 0,
    totalDiscount: 0,
    netRevenue: 0,
    totalTax: 0
  };
  
  // Format orders for display
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
    chartData: chartData, // Add chart data to response
    totalPages: Math.ceil(totalOrders / parseInt(limit)),
    currentPage: parseInt(page)
  };
};

// New function to get chart data (daily, weekly, monthly, yearly)
export const getChartDataService = async (period = 'monthly') => {
  let labels = [];
  let values = [];
  let currentDate = new Date();
  
  logger.info(`Generating chart data for period: ${period}`);
  
  switch(period) {
    case 'daily':
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(currentDate.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        labels.push(dateStr);
        
        const sales = await getSalesByDate(date);
        values.push(sales);
      }
      break;
      
    case 'weekly':
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekNumber = getWeekNumber(weekStart);
        labels.push(`Week ${weekNumber} (${weekStart.toLocaleDateString()})`);
        
        const sales = await getSalesByDateRange(weekStart, weekEnd);
        values.push(sales);
      }
      break;
      
    case 'monthly':
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        labels.push(monthStr);
        
        const sales = await getSalesByMonth(date.getFullYear(), date.getMonth());
        values.push(sales);
      }
      break;
      
    case 'yearly':
      // Last 5 years
      const startYear = currentDate.getFullYear() - 4;
      for (let year = startYear; year <= currentDate.getFullYear(); year++) {
        labels.push(year.toString());
        
        const sales = await getSalesByYear(year);
        values.push(sales);
      }
      break;
      
    default:
      throw new Error(`Invalid chart period: ${period}`);
  }
  
  return {
    labels: labels,
    values: values,
    period: period
  };
};

// Helper function to get week number
function getWeekNumber(date) {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startDate.getDay() + 1) / 7);
  return weekNumber;
}

// Helper functions for database queries

async function getSalesByDate(date) {
  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$subtotal' }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].totalSales : 0;
  } catch (error) {
    logger.error('Error in getSalesByDate:', error);
    return 0;
  }
}

async function getSalesByDateRange(startDate, endDate) {
  try {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$subtotal' }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].totalSales : 0;
  } catch (error) {
    logger.error('Error in getSalesByDateRange:', error);
    return 0;
  }
}

async function getSalesByMonth(year, month) {
  try {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    end.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$subtotal' }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].totalSales : 0;
  } catch (error) {
    logger.error('Error in getSalesByMonth:', error);
    return 0;
  }
}

async function getSalesByYear(year) {
  try {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    end.setHours(23, 59, 59, 999);
    
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$subtotal' }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].totalSales : 0;
  } catch (error) {
    logger.error('Error in getSalesByYear:', error);
    return 0;
  }
}






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


export const getTopCategoriesService = async (page = 1, limit = 4) => {
  const offset = (page - 1) * limit;
  console.log("Fetching top categories with offset:", offset);
  
  try {
    const deliveredOrdersCount = await Order.countDocuments({ status: 'delivered' });

    const allCategories = await Category.find().lean();

    if (!allCategories || allCategories.length === 0) {
      return {
        categories: [],
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        limit: limit
      };
    }

    if (deliveredOrdersCount === 0) {
      
      const categoriesWithProductCount = await Promise.all(
        allCategories.map(async (category) => {
          const productCount = await Product.countDocuments({
            category: category._id
          });
          
          return {
            id: category._id,
            name: category.name,
            image: category.image || '/images/default-category.png',
            total_products: productCount || 0,
            revenue: 0,
            quantity_sold: 0
          };
        })
      );
      
      categoriesWithProductCount.sort((a, b) => b.total_products - a.total_products);
      
      const total = categoriesWithProductCount.length;
      const paginatedCategories = categoriesWithProductCount.slice(offset, offset + limit);
      
      return {
        categories: paginatedCategories,
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total,
        limit: limit
      };
    }

    // FIXED AGGREGATION PIPELINE
    const result = await Order.aggregate([
      // Match only delivered orders
      { $match: { status: 'delivered' } },
      
      // Unwind items array
      { $unwind: '$items' },
      
      // Lookup product details - using correct field name 'productId'
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',  
          foreignField: '_id',
          as: 'product'
        }
      },
      
      { $unwind: '$product' },
      
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category_id',  
          foreignField: '_id',
          as: 'category'
        }
      },
      
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: false } },
      
      {
        $group: {
          _id: '$category._id',
          name: { $first: '$category.name' },
          image: { $first: '$category.image' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          quantity_sold: { $sum: '$items.quantity' },
          total_products: { $addToSet: '$product._id' }
        }
      },
      
      {
        $addFields: {
          total_products: { $size: '$total_products' }
        }
      },
      
      { $sort: { revenue: -1 } },
      
      { $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: offset }, { $limit: limit }]
      }}
    ]);

    
    const total = result[0]?.metadata[0]?.total || 0;
    const categories = result[0]?.data || [];
    
    const formattedCategories = categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      image: cat.image || '/images/default-category.png',
      total_products: cat.total_products || 0,
      revenue: cat.revenue || 0,
      quantity_sold: cat.quantity_sold || 0
    }));
    
    
    return {
      categories: formattedCategories,
      currentPage: page,
      totalPages: Math.ceil(total / limit) || 1,
      totalItems: total,
      limit: limit
    };
  } catch (error) {
    console.log("Error stack:", error.stack);
    logger.error('Error in getTopCategoriesService:', error);
    throw error;
  }
};