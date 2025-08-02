const mongoose = require('mongoose');

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
      }
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
    enum: ['cod', 'netbanking', 'upi', 'credit_card', 'debit_card'],
    required: true
  },

  subtotal: { type: Number, required: true },
  delivery: { type: Number, required: true },
  tax: { type: Number, required: true },
  discount: { type: Number, required: true },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ['pending', 'ordered', 'processing', 'shipped', 'out for delivery', 'delivered', 'cancelled', 'returned'],
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
      enum: ['pending', 'approved', 'rejected', 'processed'],
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
    }
  }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
