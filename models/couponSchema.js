import mongoose from 'mongoose';

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
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
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

// Pre-save hook
couponSchema.pre('save', function (next) {
  if (this.validTill && this.validFrom && this.validTill <= this.validFrom) {
    const error = new Error('Valid till date must be after valid from date');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Pre-update hook
couponSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();
  const updateData = update.$set || update;

  if (updateData.validFrom && updateData.validTill) {
    const fromDate = new Date(updateData.validFrom);
    const tillDate = new Date(updateData.validTill);

    if (tillDate <= fromDate) {
      const error = new Error('Valid till date must be after valid from date');
      error.name = 'ValidationError';
      return next(error);
    }
  }

  next();
});

// Index
couponSchema.index({ code: 1, isActive: 1, validTill: 1 });

// Static method
couponSchema.statics.validateCoupon = async function (code, cartValue) {
  const coupon = await this.findOne({
    code,
    isActive: true,
    isDeleted: { $ne: true },
    validFrom: { $lte: new Date() },
    validTill: { $gte: new Date() },
    $or: [{ usageLimit: null }, { usageLimit: { $gt: 0 } }]
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

export default Coupon;
