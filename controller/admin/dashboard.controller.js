import * as dashboardService from '../../service/admin/dashboard.service.js';
import * as reportService from '../../service/admin/report.service.js';
import logger from '../../utils/logger.js';

export const getDashboardStats = async (req, res) => {
  logger.info('Fetching dashboard stats');
  
  const stats = await dashboardService.getDashboardStatsService();
  
  logger.info('Dashboard stats delivered successfully');
  res.json(stats);
};

export const getTopProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 4;
  
  logger.info('Fetching top products', { page, limit });
  
  const result = await dashboardService.getTopProductsService(page, limit);
  
  logger.info('Top products delivered successfully');
  res.json(result);
};

export const getSalesData = async (req, res) => {
  logger.info('Fetching sales chart data');
  
  const salesData = await dashboardService.getSalesDataService();
  
  logger.info('Sales chart data delivered successfully');
  res.json(salesData);
};

export const getSalesReport = async (req, res) => {
  const filters = {
    page: req.query.page,
    limit: req.query.limit,
    dateRange: req.query.dateRange,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  };
  
  logger.info('Fetching sales report', { filters });
  
  const result = await dashboardService.getSalesReportService(filters);
  
  logger.info('Sales report delivered successfully');
  res.json(result);
};

export const exportSalesReport = async (req, res) => {
  const filters = {
    dateRange: req.query.dateRange,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    exportType: req.query.exportType || 'pdf'
  };
  
  logger.info('Exporting sales report', { filters });
  
  const exportData = await dashboardService.getExportDataService(filters);
  
  if (filters.exportType === 'pdf') {
    await reportService.generateSalesPDFReport(res, exportData);
  } else if (filters.exportType === 'excel') {
    await reportService.generateSalesExcelReport(res, exportData);
  } else {
    logger.error('Invalid export type requested', { exportType: filters.exportType });
    return res.status(400).json({ error: 'Invalid export type' });
  }
  
  logger.info('Sales report export completed successfully');
};