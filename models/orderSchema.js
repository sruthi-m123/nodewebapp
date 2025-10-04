const mongoose = require('mongoose');
const razorpay = require('../helper/razorpay');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      variant: {
        type: String,
        default: "Default"
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      totalPrice: {
        type: Number,
        required: true
      },
      status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned','partially_returned','partially_cancelled','return_requested','payment_failed'],
    default: 'pending'
  },
    }
  ],

  shippingAddress: {
    name: { type: String, required: true },
    building: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    altPhone: { type: String, default: "" }
  },

  paymentMethod: {
    type: String,
    enum: ['cod', 'netbanking','wallet'],
    required: true
  },

  subtotal: { type: Number, required: true },
  delivery: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, required: true },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned','partially_returned','partially_cancelled','return_requested','payment_failed','paid'],
    default: 'pending'
  },

  orderedAt: Date,
  processingAt: Date,
  shippedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  returnedAt: Date,

  appliedOffers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer'
    }
  ],
  appliedCoupon:{
    couponId:{type:mongoose.Schema.Types.ObjectId,ref:'Coupon'},
    code:String,
    value:Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  returnRequested: {
    type: Boolean,
    default: false
  },
  
  returnDetails: {
    reason: String,
    requestDate: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed','partially_returned','delivered'],
      default: 'pending'
    },
    initiatedBy: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    type: {
      type: String,
      enum: ['full', 'partial']
    },
     items: [ 
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      quantity: Number,
      reason: String,
      price:Number
    }
  ]
  },
  cancellation: {
  reason: String,
  date: Date,
  initiatedBy: { type: String, enum: ['customer', 'admin'] },
  type: { type: String, enum: ['full', 'partial'] },
  cancelledItems: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      name: String
    }
  ]
},
refund:{
  amount:{type:Number,default:0},
  method:{type:String,enum:['cod','netbanking','wallet'],default:'wallet'},
status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    processedAt: Date
  }

});


const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
