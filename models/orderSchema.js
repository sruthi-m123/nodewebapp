const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    default: "/img/placeholder.jpg"
  },
  variant: {
    type: String,
    default: "Default"
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
    default: "pending"
  },
  cancellationReason: {
    type: String,
    default: null
  },
  returnReason: {
    type: String,
    default: null
  },
  returnStatus: {
    type: String,
    enum: ["requested", "approved", "rejected", "completed"],
    default: null
  }
}, { _id: false });

const addressSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  addressType: {
    type: String,
    enum: ["Home", "Work", "Other"],
    required: true
  },
  building: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: Number,
    required: true
  },
  landmark: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  altPhone: {
    type: String
  }
}, { _id: false });

const paymentSchema = new Schema({
  method: {
    type: String,
    enum: ["cod", "razorpay", "wallet"],
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  transactionId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayPaymentId: {
    type: String
  },
  razorpayOrderId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  address: addressSchema,
  payment: paymentSchema,
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  delivery: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 18
  },
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending"
  },
  appliedOffers: [{
    type: Schema.Types.ObjectId,
    ref: "Offer"
  }],
  trackingNumber: {
    type: String
  },
  shippingProvider: {
    type: String
  },
  expectedDelivery: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  cancellationRequest: {
    requestedAt: {
      type: Date
    },
    reason: {
      type: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"]
    },
    processedAt: {
      type: Date
    }
  },
  returnRequest: {
    requestedAt: {
      type: Date
    },
    reason: {
      type: String
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"]
    },
    processedAt: {
      type: Date
    },
    refundAmount: {
      type: Number
    }
  },
  notes: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order ID before saving
orderSchema.pre("save", async function(next) {
  if (!this.orderId) {
    const count = await this.constructor.countDocuments();
    this.orderId = `ORD${Date.now()}${(count + 1).toString().padStart(6, "0")}`;
  }
  next();
});

// Update product stock when order is cancelled
orderSchema.methods.cancelOrder = async function(reason) {
  if (this.status === "cancelled") {
    throw new Error("Order is already cancelled");
  }

  // Update product stocks
  for (const item of this.items) {
    await mongoose.model("Product").findByIdAndUpdate(
      item.productId,
      { $inc: { stock: item.quantity } }
    );
  }

  this.status = "cancelled";
  this.cancellationRequest = {
    reason,
    status: "approved",
    processedAt: new Date()
  };

  // Initiate refund if payment was completed
  if (this.payment.status === "completed") {
    this.payment.status = "refunded";
    this.payment.refundAmount = this.total;
  }

  return this.save();
};

// Virtual for formatted order date
orderSchema.virtual("formattedDate").get(function() {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
});

// Virtual for order status display
orderSchema.virtual("statusDisplay").get(function() {
  const statusMap = {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  return statusMap[this.status] || this.status;
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;