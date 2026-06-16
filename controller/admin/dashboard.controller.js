import * as dashboardService from '../../service/admin/dashboard.service.js';
import * as reportService from '../../service/admin/report.service.js';
import logger from '../../utils/logger.js';

export const getDashboardStats = async (req, res) => {
  logger.info('Fetching dashboard stats');
  
  const stats = await dashboardService.getDashboardStatsService();
  const salesReport = await dashboardService.getSalesReportService();
  
  logger.info('Dashboard stats delivered successfully');
  res.json({ stats, salesReport });
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
  try {
    const period = req.query.period || 'monthly';
    logger.info(`Fetching sales chart data for period: ${period}`);
    const salesData = await dashboardService.getSalesDataService(period);
    logger.info(`Sales chart data delivered successfully for period: ${period}`);
    res.json(salesData);
  } catch (error) {
    logger.error('Error in getSalesData controller:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

export const getSalesReport = async (req, res) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      dateRange: req.query.dateRange,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      chartPeriod: req.query.period || 'monthly'
    };
    
    logger.info('Fetching sales report', { filters });
    
    const result = await dashboardService.getSalesReportService(filters);
    
    logger.info('Sales report delivered successfully');
    res.json(result);
  } catch (error) {
    logger.error('Error in getSalesReport controller:', error);
    res.status(500).json({ error: 'Failed to fetch sales report' });
  }
};

export const exportSalesReport = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Error in exportSalesReport controller:', error);
    res.status(500).json({ error: 'Failed to export sales report' });
  }
};

export const getTopCategories=async(req,res)=>{
  const page=parseInt(req.query.page)||1;
  const limit=parseInt(req.query.limit)||4;

  logger.info('fetching top categories',{page,limit});
  try {
    const result=await dashboardService.getTopCategoriesService(page,limit);
    logger.info('Top categories delivered successfully');
    res.json(result);
  } catch (error) {
    console.log("error form controller",error);
    logger.error('Error in getTopCategories controller:',error);
    res.status(500).json({error:'Failed to fetch top categories'});
  }
}