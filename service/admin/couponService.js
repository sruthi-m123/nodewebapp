const crypto = require('crypto');
const Coupon = require('../models/Coupon');

async function generateRewardCoupon(userId) {
  const couponCode = `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  const coupon = new Coupon({
    code: couponCode,
    type: 'percentage',
    discountValue: 10, // 10% discount
    maxDiscount: 500,  // Max ₹500 discount
    applicableTo: 'all',
    createdFor: userId,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  });
  
  await coupon.save();
  return coupon;
}

module.exports = {
  generateRewardCoupon
};
