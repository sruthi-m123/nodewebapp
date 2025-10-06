const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const User = require('../../models/userSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

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
      { $group: { _id: null, total: { $sum: '$subtotal' } } }
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

const getTopProducts = async (req, res) => {
  console.log("hiiiiiiiiiiiiii")
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
      name: item.product.productName,
      price: item.product.price,
      revenue: item.totalRevenue,
      quantity: item.totalQuantity
    }));
    console.log("products inside dashboardcontroller",products)
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
          totalSales: { $sum: '$subtotal' }
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
    console.log("top products:",topProducts);
    doc.text('Top 10 Products:');
    doc.moveDown(0.5);
    
    topProducts.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.product.productName} - Quantity: ${item.totalQuantity} - Revenue: ₹${item.totalRevenue.toLocaleString()}`);
    });
    
    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
};


// Get sales report with filters
const getSalesReport = async (req, res) => {
  try {
    const { page = 1, limit = 10, dateRange, startDate, endDate } = req.query;
    
    // Calculate date range based on filters
    let dateFilter = {};
    const now = new Date();
    
    switch (dateRange) {
      case '1d': // Today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
        break;
        
      case '1w': // This week
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
        
      case '1m': // This month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
        
      case '1y': // This year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
        break;
        
      case 'custom': // Custom range
        if (startDate && endDate) {
          const customStart = new Date(startDate);
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: customStart, $lte: customEnd } };
        }
        break;
        
      default:
        // Default to today
        const defaultStart = new Date();
        defaultStart.setHours(0, 0, 0, 0);
        const defaultEnd = new Date();
        defaultEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: defaultStart, $lte: defaultEnd } };
    }
    
    // Add status filter to exclude cancelled orders
    dateFilter.status = { $ne: 'cancelled' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch orders with pagination
    const orders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('items.productId', 'productName');
    
    // Calculate summary statistics
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
    console.log("summaryData:",summaryData);
    const summary = summaryData[0] || {
      totalSales: 0,
      totalDiscount: 0,
      netRevenue: 0,
      totalTax: 0
    };
    
   
    const formattedOrders = orders.map(order => ({
      date: order.createdAt,
      orderId:order.orderId,
      customerName: order.userId?.name || 'Guest',
      itemsCount: order.items.reduce((total, item) => total + item.quantity, 0),
      amount: order.subtotal,
      discount: order.discount || 0,
      coupons: order.appliedCoupon?.title || 'None',
      netAmount: order.subtotal - (order.discount || 0)
    }));
    
    res.json({
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
    });
    
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};


const exportSalesReport = async (req, res) => {
  try {
    const { dateRange, startDate, endDate, exportType = 'pdf' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (dateRange) {
      case '1d':
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };
        break;
      case '1w':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfWeek } };
        break;
      case '1m':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth } };
        break;
      case '1y':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        dateFilter = { createdAt: { $gte: startOfYear } };
        break;
      case 'custom':
        if (startDate && endDate) {
          const customStart = new Date(startDate);
          const customEnd = new Date(endDate);
          customEnd.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: customStart, $lte: customEnd } };
        }
        break;
      default:
        const defaultStart = new Date();
        defaultStart.setHours(0, 0, 0, 0);
        const defaultEnd = new Date();
        defaultEnd.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: defaultStart, $lte: defaultEnd } };
    }
    
    dateFilter.status = { $ne: 'cancelled' };
    
    const orders = await Order.find(dateFilter)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('items.productId', 'productName');
    
    // Calculate summary
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

const expectedNet = summary.totalSales - summary.totalDiscount;
    if (Math.abs(summary.netRevenue - expectedNet) > 0.01) { 
      console.warn('Summary inconsistency detected:', {
        totalSales: summary.totalSales,
        totalDiscount: summary.totalDiscount,
        reportedNet: summary.netRevenue,
        expectedNet
      });
    }


    if (exportType === 'pdf') {
      await generateSalesPDFReport(res, orders, summary, dateRange, startDate, endDate);
    } else if (exportType === 'excel') {
      await generateSalesExcelReport(res, orders, summary, dateRange, startDate, endDate);
    } else {
      res.status(400).json({ error: 'Invalid export type' });
    }
    
  } catch (error) {
    console.error('Error exporting sales report:', error);
    res.status(500).json({ error: 'Failed to export sales report' });
  }
};

// Generate PDF sales report
async function generateSalesPDFReport(res, orders, summary, dateRange, startDate, endDate) {
  const doc = new PDFDocument({ margin: 50 });
  
  // Set response headers
  res.setHeader('Content-Type', 'application/pdf');
  
  // Generate filename
  let filename = 'sales-report';
  if (dateRange === 'custom' && startDate && endDate) {
    filename = `sales-report-${startDate}-to-${endDate}`;
  } else {
    filename = `sales-report-${dateRange}`;
  }
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
  
  doc.pipe(res);
  
  // Header
  doc.fontSize(20).text('SALES REPORT', { align: 'center' });
  doc.moveDown();
  
  // Date range info
  let dateRangeText = '';
  switch (dateRange) {
    case '1d': dateRangeText = 'Today'; break;
    case '1w': dateRangeText = 'This Week'; break;
    case '1m': dateRangeText = 'This Month'; break;
    case '1y': dateRangeText = 'This Year'; break;
    case 'custom': dateRangeText = `${startDate} to ${endDate}`; break;
    default: dateRangeText = 'Today';
  }
  
  doc.fontSize(12).text(`Date Range: ${dateRangeText}`);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  
  // Summary section
  doc.fontSize(14).text('SUMMARY', { underline: true });
  doc.fontSize(12);
  doc.text(`Total Orders: ${orders.length}`);
  doc.text(`Total Sales: ₹${summary.totalSales.toLocaleString()}`);
  doc.text(`Total Discount: ₹${summary.totalDiscount.toLocaleString()}`);
  doc.text(`Total Tax: ₹${summary.totalTax.toLocaleString()}`);
  doc.text(`Net Revenue: ₹${summary.netRevenue.toLocaleString()}`);
  doc.moveDown();
  
  // Orders table header
  doc.fontSize(12).text('DETAILED ORDERS', { underline: true });
  doc.moveDown(0.5);
  
  // Table headers (now 8 columns including Coupons)
  const headers = ['Date', 'Order ID', 'Customer', 'Items', 'Amount (₹)', 'Discount (₹)', 'Coupons', 'Net Amount (₹)'];
  const columnWidths = [70, 70, 90, 40, 60, 60, 60, 70]; // Adjusted to sum ~530
  
  let currentY = doc.y;
  let xPosition = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPosition, currentY, { width: columnWidths[i], align: 'left' });
    xPosition += columnWidths[i];
  });
  
  // Draw header underline
  doc.moveTo(50, currentY + 15).lineTo(530, currentY + 15).stroke();
  currentY += 20;
  doc.y = currentY;
  
  // Orders data
  orders.forEach(order => {
    if (doc.y > 700) { 
      doc.addPage();
      currentY = 100; // Reset Y on new page
    }
    
    xPosition = 50;
    const preTaxNet = (order.subtotal || 0) - (order.discount || 0);
    const rowData = [
      new Date(order.createdAt).toLocaleDateString(),
      order._id.toString().slice(-8).toUpperCase(),
      order.userId?.name || 'Guest',
      order.items.reduce((total, item) => total + item.quantity, 0).toString(),
      `₹${(order.subtotal || 0).toLocaleString()}`,
      `₹${(order.discount || 0).toLocaleString()}`,
      order.appliedCoupon?.title || 'None',
      `₹${preTaxNet.toLocaleString()}`
    ];
    
    rowData.forEach((data, i) => {
      doc.text(data, xPosition, currentY, { width: columnWidths[i], align: 'left' });
      xPosition += columnWidths[i];
    });
    
    // Draw row separator line
    doc.moveTo(50, currentY + 15).lineTo(530, currentY + 15).stroke();
    currentY += 20;
    doc.y = currentY;
  });
  
  doc.end();
}
// Generate Excel sales report - FIXED VERSION
async function generateSalesExcelReport(res, orders, summary, dateRange, startDate, endDate) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  // Set headers
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Order ID', key: 'orderId', width: 15 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Items', key: 'items', width: 10 },
    { header: 'Amount (₹)', key: 'amount', width: 15 },
    { header: 'Discount (₹)', key: 'discount', width: 15 },
    { header: 'Coupons', key: 'coupons', width: 15 },
    { header: 'Net Amount (₹)', key: 'netAmount', width: 15 }
  ];

  // Add title
  worksheet.insertRow(1, ['SALES REPORT']);
  worksheet.mergeCells('A1:H1');
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Date range info
  let dateRangeText = '';
  switch (dateRange) {
    case '1d': dateRangeText = 'Today'; break;
    case '1w': dateRangeText = 'This Week'; break;
    case '1m': dateRangeText = 'This Month'; break;
    case '1y': dateRangeText = 'This Year'; break;
    case 'custom': dateRangeText = `${startDate} to ${endDate}`; break;
    default: dateRangeText = 'Today';
  }

  worksheet.insertRow(3, ['Date Range:', dateRangeText]);
  worksheet.insertRow(4, ['Generated on:', new Date().toLocaleDateString()]);
  worksheet.insertRow(5, ['']); // Empty row for spacing

  // DEBUG: Log the summary to see what we're working with
  console.log('Summary in Excel generation:', summary);
  console.log('Summary totalSales:', summary.totalSales);
  console.log('Summary totalDiscount:', summary.totalDiscount);
  console.log('Summary netRevenue:', summary.netRevenue);
  console.log('Summary totalTax:', summary.totalTax);

  // FIXED: Summary section with proper value access
  worksheet.insertRow(6, ['SUMMARY']);
  worksheet.mergeCells('A6:H6');
  worksheet.getCell('A6').font = { bold: true, size: 14 };

  // FIXED: Summary headers
  worksheet.insertRow(7, ['Total Orders', 'Total Sales (₹)', 'Total Discount (₹)', 'Total Tax (₹)', 'Net Revenue (₹)', '', '', '']);
  
  // FIXED: Summary values - ensure we're using the correct properties
  worksheet.insertRow(8, [
    orders.length,
    summary.totalSales || 0,
    summary.totalDiscount || 0, 
    summary.totalTax || 0,
    summary.netRevenue || 0,
    '', '', '' // Empty cells for the merged columns
  ]);

  // Format summary values as currency
  ['B8', 'C8', 'D8', 'E8'].forEach(cellAddress => {
    const cell = worksheet.getCell(cellAddress);
    cell.numFmt = '#,##0.00';
    cell.font = { bold: true };
  });

  worksheet.insertRow(9, ['']); // Empty row for spacing

  // Orders data header
  worksheet.insertRow(10, ['DETAILED ORDERS']);
  worksheet.mergeCells('A10:H10');
  worksheet.getCell('A10').font = { bold: true, size: 14 };

  // Add column headers for orders
  worksheet.insertRow(11, ['Date', 'Order ID', 'Customer', 'Items', 'Amount (₹)', 'Discount (₹)', 'Coupons', 'Net Amount (₹)']);
  
  // Style the header row
  const headerRow = worksheet.getRow(11);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add order data starting from row 12
  let currentRow = 12;
  orders.forEach(order => {
    const preTaxNet = (order.subtotal || 0) - (order.discount || 0);
    worksheet.addRow({
      date: new Date(order.createdAt).toLocaleDateString(),
      orderId: order._id.toString().slice(-8).toUpperCase(),
      customer: order.userId?.name || 'Guest',
      items: order.items.reduce((total, item) => total + item.quantity, 0),
      amount: order.subtotal || 0,
      discount: order.discount || 0,
      coupons: order.appliedCoupon?.title || 'None',
      netAmount: preTaxNet
    });
    
    // Format currency cells for this row
    ['E', 'F', 'H'].forEach(column => {
      const cell = worksheet.getCell(column + currentRow);
      cell.numFmt = '#,##0.00';
    });
    
    currentRow++;
  });

  // Set response headers
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  let filename = 'sales-report';
  if (dateRange === 'custom' && startDate && endDate) {
    filename = `sales-report-${startDate}-to-${endDate}`;
  } else {
    filename = `sales-report-${dateRange}`;
  }
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

  // Send the Excel file
  await workbook.xlsx.write(res);
  res.end();
}

// Helper function to get dashboard stats
async function getDashboardStatsData() {
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
  
  return { totalUsers, itemsSold, totalSales, pendingOrders };
}

module.exports = {
  getDashboardStats,
  getTopProducts,
  getSalesData,
  generatePDFReport,
  getSalesReport,
  exportSalesReport
};