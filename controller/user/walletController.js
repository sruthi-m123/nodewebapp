const { default: mongoose } = require("mongoose");
const User=require("../../models/userSchema");
const Wallet=require("../../models/walletSchema");

const getWallet=async(req,res)=>{
    try {
      console.log("router hits the wallet controller")

      if(!req.session.user){
        console.warn('session missing-redirecting to home');
        return res.redirect('/');
      }
       const userId=req.session.user?.id;
       console.log("userId:",userId);
       const page=parseInt(req.query.page)||1;
       const limit=6;
       
       const wallet=await Wallet.findOne({user:userId})
    //    .populate({
    //     path:'transactions',
    //     options:{
    //         sort:{createdAt:-1},
    //         skip:(page-1)*limit,
    //         limit:limit
    //     }
    //    })

if(!wallet){
    return res.status(404).render('user/wallet',{
      pageCSS:'user/wallet.css',
      pageJS:'user/wallet.js',
        balance:0,
        transactions:[],
        currentPage:page,
        totalPages:0,
        user:req.session.user
    })
}
const sortedTransactions=[...wallet.transactions].sort((a,b)=>b.createdAt-a.createdAt);
const paginatedTransactions=sortedTransactions.slice((page-1)*limit,page*limit);
const totalPages=Math.ceil(wallet.transactions.length/limit)||1;

res.render('user/wallet',{
    pageCSS:'user/wallet.css',
    pageJS:'user/wallet.js',
    balance:wallet.balance,
    transactions:paginatedTransactions,
    currentPage:page,
    totalPages:totalPages,
    user:req.session.user
});

    } catch (error) {
     console.error('error fetching wallet:',error);
     res.status(500).render('error',{message:'failed to load wallet'})   
    }
}

const addFunds = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount } = req.body;
    const userId = req.session.user?._id;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ user: userId }).session(session);

    if (!wallet) {
      wallet = new Wallet({
        user: userId,
        balance: 0
      });
    }

    const transactionRef = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    wallet.balance += parseFloat(amount);
    wallet.transactions.push({
      amount: parseFloat(amount),
      type: 'deposit',
      status: 'completed',
      reference: transactionRef,
      description: 'Wallet top-up'
    });

    await wallet.save({ session });
    await session.commitTransaction(); 

    res.json({
      success: true,
      newBalance: wallet.balance,
      transactionId: wallet.transactions[wallet.transactions.length - 1]._id
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding funds:', error);
    res.status(500).json({ error: 'Failed to add funds' });
  } finally {
    session.endSession();
  }
};


const findOrCreateWallet=async(userId,session=null)=>{
    let wallet=await Wallet.findOne({user:userId}).session(session);
    if(!wallet){
        wallet=new Wallet({
            user:userId,
            balance:0
        })
    }
    return wallet;
};

const addTransaction=(wallet,amount,type,reference,description,orderId=null)=>{
 wallet.transactions.push({
    amount,
    type,
    status:'completed',
    reference,
    description,
    order:orderId,
    date:new Date()
 }) ;  
}




const creditWallet = async (userId, amount, orderId, referenceType) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const wallet = await findOrCreateWallet(userId, session); 

    wallet.balance += amount;

    addTransaction(
      wallet,
      amount,
      'credit',
      referenceType,
      'Credited by system',
      orderId
    );

    await wallet.save({ session });
    await session.commitTransaction();

    return true;
  } catch (error) {
    await session.abortTransaction();
    console.error('error crediting wallet:', error);
    return false;
  } finally {
    session.endSession();
  }
};

const getWalletTransactions=async(userId,page=1,limit=10)=>{
    const user=await User.findById(userId)
    .select('wallet.transactions')
    .slice('wallet.transactions',[(page-1)*limit,limit]);
    return user.wallet.transactions;
}


module.exports={
    creditWallet,
    getWalletTransactions,
    getWallet,addFunds,
    findOrCreateWallet,
    addTransaction
}