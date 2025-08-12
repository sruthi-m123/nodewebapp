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
  

  orderHistory: [{
    type: Schema.Types.ObjectId,
    ref: "Order"
  }],
  referralCode: {
    type: String,
    unique:true,
    uppercase:true
  },
  referredBy:{
    type:Schema.Types.ObjectId,
    ref:"User"
  },
  referralStats:{
     totalReferrals: { type: Number, default: 0 },
  successfulReferrals: { type: Number, default: 0 },
  earnedRewards: { type: Number, default: 0 }
  },
  wishlist:{
    type:Schema.Types.ObjectId,
    ref:"Wishlist"
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

userSchema.pre("save",function(next){
if(!this.referralCode){
  this.referralCode=this.name.substring(0,3).toUpperCase()+Math.floor(1000+Math.random()*9000);
}
next();
})

const User = mongoose.model("User", userSchema);
module.exports = User;
