const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const User = require('../../models/userSchema');
const PDFDocument = require('pdfkit');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    const itemsSoldResult = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);
    const itemsSold = itemsSoldResult.length > 0 ? itemsSoldResult[0].total : 0;
    
    const totalSalesResult = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
    
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    
    res.json({
      totalUsers,
      itemsSold,
      totalSales,
      pendingOrders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get top products
const getTopProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;
    
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
      name: item.product.name,
      price: item.product.price,
      revenue: item.totalRevenue,
      quantity: item.totalQuantity
    }));
    
    res.json({
      products,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sales data for chart
const getSalesData = async (req, res) => {
  try {
    // Get sales data for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    
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
          totalSales: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Generate labels and values for the last 12 months
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
      
      // Find sales data for this month
      const monthData = salesData.find(d => d._id.year === year && d._id.month === month + 1);
      values.push(monthData ? monthData.totalSales : 0);
    }
    
    res.json({ labels, values });
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate PDF report
const generatePDFReport = async (req, res) => {
  try {
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();
    
    // Get stats for the report
    const stats = await getDashboardStatsData();
    
    doc.fontSize(14).text(`Total Users: ${stats.totalUsers}`);
    doc.text(`Items Sold: ${stats.itemsSold}`);
    doc.text(`Total Sales: ₹${stats.totalSales.toLocaleString()}`);
    doc.text(`Pending Orders: ${stats.pendingOrders}`);
    doc.moveDown();
    
    // Get top products for the report
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
      { $limit: 10 },
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
    
    doc.text('Top 10 Products:');
    doc.moveDown(0.5);
    
    topProducts.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.product.name} - Quantity: ${item.totalQuantity} - Revenue: ₹${item.totalRevenue.toLocaleString()}`);
    });
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};

// Helper function to get dashboard stats
async function getDashboardStatsData() {
  const totalUsers = await User.countDocuments();
  
  const itemsSoldResult = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: null, total: { $sum: '$items.quantity' } } }
  ]);
  const itemsSold = itemsSoldResult.length > 0 ? itemsSoldResult[0].total : 0;
  
  const totalSalesResult = await Order.aggregate([
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;
  
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  
  return { totalUsers, itemsSold, totalSales, pendingOrders };
}

module.exports = {
  getDashboardStats,
  getTopProducts,
  getSalesData,
  generatePDFReport
};