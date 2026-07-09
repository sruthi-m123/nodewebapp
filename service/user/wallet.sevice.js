import mongoose from "mongoose";
import Wallet from '../../models/walletSchema.js';
import logger from '../../utils/logger.js';
import crypto from 'crypto';

export const WalletService ={
    async getWallet(userId){
        return Wallet.findOne({user:userId});
    },

    async addFunds(userId,amount){
        return mongoose.connection.transaction(async(session)=>{
            let wallet=await Wallet.findOne({user:userId}).session(session);
            
            if(!wallet){
                wallet=new Wallet({user:userId,balance:0});
            }
            const reference=`DEP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            wallet.balance+=amount;
            wallet.transactions.push({
                amount,
                type:"deposit",
                status:"completed",
                reference,
                description:"Wallet top-up"
            });
            console.log("checking the transactions:",wallet.transactions);
            await wallet.save({session});
            logger.info("Wallet funded successfully",{userId,amount});
            return{
                balance:wallet.balance,
                transactionId:wallet.transactions.at(-1)._id
            };
        });
    },

    async getTransactionsWithFilters(userId,page,limit,searchTerm,sortBy,sortOrder,filterType,filterStatus){
        const wallet=await Wallet.findOne({user:userId});
        if(!wallet){
            return [];
        }

        let transactions=[...wallet.transactions];
        const skip=(page-1)*limit;

        if(filterType && filterType !== 'all'){
            transactions=transactions.filter((t)=>{
                if(filterType === 'refund') {
                    return t.type === 'refund' || t.type === 'credit';
                }
                return t.type===filterType;
            });
        }
        if(filterStatus && filterStatus !== 'all'){
            transactions=transactions.filter(
                (t)=>t.status===filterStatus
            );
        }
        if(searchTerm && searchTerm.trim() !== ''){
            const search=searchTerm.toLowerCase();
            transactions=transactions.filter((t)=>{
                return (
                    t.type?.toLowerCase().includes(search) ||
                    t.status?.toLowerCase().includes(search) ||
                    t.description?.toLowerCase().includes(search) ||
                    t.reference?.toLowerCase().includes(search) ||
                    (!isNaN(searchTerm) && t.amount === parseFloat(searchTerm))
                );
            });
        }

        transactions.sort((a,b)=>{
            let comparison=0;
            switch(sortBy){
                case 'amount':
                    comparison=a.amount-b.amount;
                    break;
                case 'type':
                    comparison = a.type.localeCompare(b.type);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'date':
                default:
                    comparison = new Date(a.createdAt) - new Date(b.createdAt);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return transactions.slice(skip, skip + limit);
    },

    async countTransactions(userId,searchTerm,filterType,filterStatus) {
      const wallet = await Wallet.findOne({ user: userId });

      if (!wallet) {
        return 0;
      }

      let transactions = [...wallet.transactions];

      // Filter by type
      if (filterType && filterType !== "all") {
        transactions = transactions.filter((t) => {
          if (filterType === 'refund') {
            return t.type === 'refund' || t.type === 'credit';
          }
          return t.type === filterType;
        });
      }

      // Filter by status
      if (filterStatus && filterStatus !== "all") {
        transactions = transactions.filter(
          (t) => t.status === filterStatus
        );
      }

      // Search
      if (searchTerm && searchTerm.trim() !== "") {
        const search = searchTerm.toLowerCase();

        transactions = transactions.filter((t) => {
          return (
            t.type?.toLowerCase().includes(search) ||
            t.status?.toLowerCase().includes(search) ||
            t.description?.toLowerCase().includes(search) ||
            t.reference?.toLowerCase().includes(search) ||
            (!isNaN(searchTerm) && t.amount === parseFloat(searchTerm))
          );
        });
      }

      return transactions.length;
    },

    async creditWallet(userId,amount,orderId,referenceType){
        return mongoose.connection.transaction(async(session)=>{
            let wallet=await Wallet.findOne({user:userId}).session(session);
            if(!wallet)wallet=new Wallet({user:userId,balance:0});
            const alreadyCredited=wallet.transactions.some(
                t=>t.order?.toString()===orderId.toString()&& t.type==="credit"
            );
            if(alreadyCredited){
                logger.warn("Wallet already credited",{userId,orderId});
                return true;
            }

            wallet.balance+=amount;
            wallet.transactions.push({
                amount,
                type:"credit",
                status:"completed",
                reference: `${referenceType}-${orderId}`,
                description:"Credited by system",
                order:orderId
            });
            await wallet.save({session});
            logger.info("Wallet credited",{userId,amount,orderId});
            return true;
        })
    },

    async debitWallet(userId,amount,orderId,referenceType){
        return mongoose.connection.transaction(async(session)=>{
            const wallet=await Wallet.findOne({user:userId}).session(session);
            if(!wallet||wallet.balance<amount){
                logger.warn ("Insufficent wallet balance",{userId,amount});
                return false;
            }

            wallet.balance-=amount;
            wallet.transactions.push({
                amount,
                type:"withdrawal",
                status:"completed",
                reference: `${referenceType}-${orderId}`,
                description:`Debited for ${referenceType}`,
                order:orderId
            });
            await wallet.save({session});
            logger.info("wallet debited",{userId,amount,orderId});
            return true;
        })
    },

    async verifyWalletPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    }) {
        const hmac = crypto.createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
        );

        hmac.update(
            `${razorpay_order_id}|${razorpay_payment_id}`
        );

        const generatedSignature = hmac.digest("hex");

        if (generatedSignature === razorpay_signature) {
            logger.info("Wallet payment verified");
            return true;
        }

        logger.warn("Wallet payment signature mismatch");
        return false;
    }
}