import { WalletService } from "../../service/user/wallet.sevice.js";
import * as razorpayservice from "../../service/user/razorpayService.js";
import{STATUS_CODES} from "../../utils/statusCodes.js";
import logger from "../../utils/logger.js";

export const getWallet=async(req,res)=>{
  logger.info("Loading wallet page");
  const userId=req.session.user.id;
  const page=Number(req.query.page)||1;
  const limit=6;

  const wallet=await WalletService.getWallet(userId);
 if (!wallet) {
    return res.render("user/wallet", {
      pageCSS: "user/wallet.css",
      pageJS: "user/wallet.js",
      balance: 0,
      transactions: [],
      currentPage: page,
      totalPages: 0,
      user: req.session.user
    });
  }

  const sorted=[...wallet.transactions].sort(
    (a,b)=>b.createdAt-a.createdAt
  );

  const paginated=sorted.slice((page-1)*limit,page*limit);
 res.render("user/wallet", {
    pageCSS: "user/wallet.css",
    pageJS: "user/wallet.js",
    balance: wallet.balance,
    transactions: paginated,
    currentPage: page,
    totalPages: Math.ceil(wallet.transactions.length / limit),
    user: req.session.user
  });
}

// export const addFunds=async(req,res)=>{
//   const userId=req.session.user.id;
//   const{amount}=req.body;

//   const result=await WalletService.addFunds(userId,amount);

//   res.status(STATUS_CODES.SUCCESS).json({
//     success:true,
//     message:"successfully added the fund",
//     data:result
//   });
// }

export const createWalletOrder=async(req,res)=>{
  const {amount}=req.body;
  const {order}=await razorpayservice.createRazorpayOrder (amount);
  res.json({
    success:true,
    order,
    key:process.env.RAZORPAY_KEY_ID
  })
}

export const verifyWalletPayment=async(req,res)=>{
  const userId=req.session.user.id;
  const{
    amount,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  }=req.body;

  const verified=await WalletService.verifyWalletPayment(req.body);
  if(!verified){
    return res.status(400).json({
      success:false
    })
  }
  const wallet=await WalletService.addFunds(userId,Number(amount));
  res.json({
    success:true,
    data:wallet
  })
}