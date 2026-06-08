import Coupon from '../models/couponSchema.js';
import logger from '../utils/logger.js';

export const startCronJobs = () => {
  // Run the check once when the server starts
  checkExpiredCoupons();
  
  // Then run it continuously (e.g. every 1 hour = 3600000 ms)
  setInterval(checkExpiredCoupons, 3600000);
  
  logger.info('Coupon expiry cron job started');
};

const checkExpiredCoupons = async () => {
  try {
    const currentDate = new Date();
    
    // Find coupons that are still active but their validTill date has passed
    const result = await Coupon.updateMany(
      { 
        validTill: { $lt: currentDate },
        isActive: true 
      },
      { 
        $set: { isActive: false } 
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Automatically expired ${result.modifiedCount} coupons.`);
    }
  } catch (error) {
    logger.error('Error in checkExpiredCoupons cron job:', error);
  }
};
