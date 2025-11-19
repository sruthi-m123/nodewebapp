import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import logger from '../../utils/logger.js';

export const generateSalesPDFReport = async (res, exportData) => {
  const { orders, summary, dateRange, startDate, endDate } = exportData;
  
  logger.debug('Generating PDF sales report');
  
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  
  let filename = 'sales-report';
  if (dateRange === 'custom' && startDate && endDate) {
    filename = `sales-report-${startDate}-to-${endDate}`;
  } else {
    filename = `sales-report-${dateRange}`;
  }
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
  
  doc.pipe(res);
  
  doc.fontSize(20).text('SALES REPORT', { align: 'center' });
  doc.moveDown();
  
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
  
  doc.fontSize(14).text('SUMMARY', { underline: true });
  doc.fontSize(12);
  doc.text(`Total Orders: ${orders.length}`);
  doc.text(`Total Sales: ₹${summary.totalSales.toLocaleString()}`);
  doc.text(`Total Discount: ₹${summary.totalDiscount.toLocaleString()}`);
  doc.text(`Total Tax: ₹${summary.totalTax.toLocaleString()}`);
  doc.text(`Net Revenue: ₹${summary.netRevenue.toLocaleString()}`);
  doc.moveDown();
  
  doc.fontSize(12).text('DETAILED ORDERS', { underline: true });
  doc.moveDown(0.5);
  
  const headers = ['Date', 'Order ID', 'Customer', 'Items', 'Amount (₹)', 'Discount (₹)', 'Coupons', 'Payment Method', 'Net Amount (₹)'];
  const columnWidths = [70, 70, 90, 40, 60, 60, 60, 70, 70];
  
  let currentY = doc.y;
  let xPosition = 50;
  headers.forEach((header, i) => {
    doc.text(header, xPosition, currentY, { width: columnWidths[i], align: 'left' });
    xPosition += columnWidths[i];
  });
  
  doc.moveTo(50, currentY + 15).lineTo(590, currentY + 15).stroke();
  currentY += 20;
  doc.y = currentY;
  
  orders.forEach(order => {
    if (doc.y > 700) {
      doc.addPage();
      currentY = 100;
    }
    
    xPosition = 50;
    const preTaxNet = (order.subtotal || 0) - (order.discount || 0) - (order.appliedCoupon?.value || 0);
    const rowData = [
      new Date(order.createdAt).toLocaleDateString(),
      order._id.toString().slice(-8).toUpperCase(),
      order.userId?.name || 'Guest',
      order.items.reduce((total, item) => total + item.quantity, 0).toString(),
      `₹${(order.subtotal || 0).toLocaleString()}`,
      `₹${(order.discount || 0).toLocaleString()}`,
      order.appliedCoupon?.title || 'None',
      order.paymentMethod || 'N/A',
      `₹${preTaxNet.toLocaleString()}`
    ];
    
    rowData.forEach((data, i) => {
      doc.text(data, xPosition, currentY, { width: columnWidths[i], align: 'left' });
      xPosition += columnWidths[i];
    });
    
    doc.moveTo(50, currentY + 15).lineTo(590, currentY + 15).stroke();
    currentY += 20;
    doc.y = currentY;
  });
  
  doc.end();
  
  logger.info('PDF sales report generated successfully');
};

export const generateSalesExcelReport = async (res, exportData) => {
  const { orders, summary, dateRange, startDate, endDate } = exportData;
  
  logger.debug('Generating Excel sales report');
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Order ID', key: 'orderId', width: 15 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Items', key: 'items', width: 10 },
    { header: 'Amount (₹)', key: 'amount', width: 15 },
    { header: 'Discount (₹)', key: 'discount', width: 15 },
    { header: 'Coupons', key: 'coupons', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Net Amount (₹)', key: 'netAmount', width: 15 }
  ];

  worksheet.insertRow(1, ['SALES REPORT']);
  worksheet.mergeCells('A1:I1');
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

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
  worksheet.insertRow(5, ['']);

  worksheet.insertRow(6, ['SUMMARY']);
  worksheet.mergeCells('A6:I6');
  worksheet.getCell('A6').font = { bold: true, size: 14 };

  worksheet.insertRow(7, ['Total Orders', 'Total Sales (₹)', 'Total Discount (₹)', 'Total Tax (₹)', 'Net Revenue (₹)', '', '', '', '']);
  
  worksheet.insertRow(8, [
    orders.length,
    summary.totalSales || 0,
    summary.totalDiscount || 0,
    summary.totalTax || 0,
    summary.netRevenue || 0,
    '', '', '', ''
  ]);

  ['B8', 'C8', 'D8', 'E8'].forEach(cellAddress => {
    const cell = worksheet.getCell(cellAddress);
    cell.numFmt = '#,##0.00';
    cell.font = { bold: true };
  });

  worksheet.insertRow(9, ['']);

  worksheet.insertRow(10, ['DETAILED ORDERS']);
  worksheet.mergeCells('A10:I10');
  worksheet.getCell('A10').font = { bold: true, size: 14 };

  worksheet.insertRow(11, ['Date', 'Order ID', 'Customer', 'Items', 'Amount (₹)', 'Discount (₹)', 'Coupons', 'Payment Method', 'Net Amount (₹)']);
  
  const headerRow = worksheet.getRow(11);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  let currentRow = 12;
  orders.forEach(order => {
    const preTaxNet = (order.subtotal || 0) - (order.discount || 0) - (order.appliedCoupon?.value || 0);
    worksheet.addRow({
      date: new Date(order.createdAt).toLocaleDateString(),
      orderId: order._id.toString().slice(-8).toUpperCase(),
      customer: order.userId?.name || 'Guest',
      items: order.items.reduce((total, item) => total + item.quantity, 0),
      amount: order.subtotal || 0,
      discount: order.discount || 0,
      coupons: order.appliedCoupon?.code || 'None',
      paymentMethod: order.paymentMethod || 'N/A',
      netAmount: preTaxNet
    });
    
    ['E', 'F', 'I'].forEach(column => {
      const cell = worksheet.getCell(column + currentRow);
      cell.numFmt = '#,##0.00';
    });
    
    currentRow++;
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  let filename = 'sales-report';
  if (dateRange === 'custom' && startDate && endDate) {
    filename = `sales-report-${startDate}-to-${endDate}`;
  } else {
    filename = `sales-report-${dateRange}`;
  }
  res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
  
  logger.info('Excel sales report generated successfully');
};