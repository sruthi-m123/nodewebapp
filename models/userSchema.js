const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    unique: false,
    sparse: true,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say']
  },
  avatar: {
    type: String,
   default:'/img/admin-products.png'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  lastUpdated: {
    type: Date
  },
  password: {
    type: String
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  cart: {
    type: Schema.Types.ObjectId,
    ref: "Cart"
  },
  wallet: {
    type: Number,
    default: 0
  },
  wishlist: [{
    type: Schema.Types.ObjectId,
    ref: "Wishlist"
  }],
  orderHistory: [{
    type: Schema.Types.ObjectId,
    ref: "Order"
  }],
  referalCode: {
    type: String
  },
  redeemed: {
    type: Boolean
  },
  
  redeemedUsers: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  searchHistory: [{
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category"
    },
    searchOn: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true 
});

// Auto-split name into firstName and lastName before saving
userSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const nameParts = this.name.split(' ');
    this.firstName = nameParts[0] || '';
    this.lastName = nameParts.slice(1).join(' ') || '';
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
