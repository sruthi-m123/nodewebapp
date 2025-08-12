const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  // description: String,

  code: {
    type: String,
    unique: true,
    trim: true,
    uppercase: true
  },

  type: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },

  discountValue: {
    type: Number,
    required: true
  },

  minOrderValue: {
    type: Number,
    default: 0
  },

  maxDiscount: {
    type: Number, 
    default: null
  },

  startDate: Date,
  endDate: Date,

  isActive: {
    type: Boolean,
    default: true
  },

  applicableTo: {
    type: String,
    enum: ['all', 'product', 'category'],
    default: 'all'
  },

  applicableItems: [Schema.Types.ObjectId], // Array of Product or Category IDs

  usageLimit: {
    type: Number,
    default: null 
  },

  usedCount: {
    type: Number,
    default: 0
  },

  icon: {
    type: String,
    default: '🎁'
  }
}, { timestamps: true });

const Offer=mongoose.model("Offer",offerSchema);
module.exports=Offer;
