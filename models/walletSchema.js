const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'refund', 'payment', 'transfer','referral','initial'],
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
reference: {
  type: String, 
  unique: true,
  sparse: true,
  default: () => `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
},

  metadata: {
    type: Object
  }
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true 
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  transactions: [transactionSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


walletSchema.index({ 'transactions.createdAt': -1 });
walletSchema.methods.addFunds = async function(amount, transactionData) {
  this.balance += amount;
  this.transactions.push({
    amount,
    type: 'refund',
     ...transactionData,
reference: transactionData?.reference ?? `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
   
     
  });
  return this.save();
};


const Wallet = mongoose.model('Wallet', walletSchema);
module.exports=Wallet;