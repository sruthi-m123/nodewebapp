const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed',
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  minCartValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    required: function() {
      return this.discountType === 'percentage';
    }
  },
  minDiscount: {
    type: Number,
    default: 0
  },
  redeemAmount: {
    type: Number,
    required: true,
    min: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTill: {
    type: Date,
    required: true
    // Remove the validator here - we'll handle it in pre-save hooks
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook for new documents
couponSchema.pre('save', function(next) {
  if (this.validTill && this.validFrom && this.validTill <= this.validFrom) {
    const error = new Error('Valid till date must be after valid from date');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Pre-update hook for findOneAndUpdate, updateOne, etc.
couponSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();
  const options = this.getOptions();
  
  // Handle both $set and direct updates
  const updateData = update.$set || update;
  
  if (updateData.validFrom || updateData.validTill) {
    // If we're updating dates, we need to validate them
    const validFrom = updateData.validFrom || this.getQuery()._id;
    const validTill = updateData.validTill;
    
    // If both dates are being updated
    if (updateData.validFrom && updateData.validTill) {
      const fromDate = new Date(updateData.validFrom);
      const tillDate = new Date(updateData.validTill);
      
      if (tillDate <= fromDate) {
        const error = new Error('Valid till date must be after valid from date');
        error.name = 'ValidationError';
        return next(error);
      }
    }
    // If only validTill is being updated, we need to check against existing validFrom
    else if (updateData.validTill && !updateData.validFrom) {
      // We'll handle this validation in the controller since we need the existing document
      // This hook will just pass through
    }
  }
  
  next();
});

// Add index for frequently queried fields
couponSchema.index({ code: 1, isActive: 1, validTill: 1 });

// Static method to validate a coupon
couponSchema.statics.validateCoupon = async function(code, cartValue) {
  const coupon = await this.findOne({
    code,
    isActive: true,
    validTill: { $gte: new Date() },
    $or: [
      { usageLimit: null },
      { usageLimit: { $gt: 0 } }
    ]
  });

  if (!coupon) {
    return { valid: false, message: 'Invalid or expired coupon' };
  }

  if (cartValue < coupon.minCartValue) {
    return { 
      valid: false, 
      message: `Minimum cart value of Rs.${coupon.minCartValue} required` 
    };
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  return { valid: true, coupon };
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;