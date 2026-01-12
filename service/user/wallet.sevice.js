import mongoose from "mongoose";
import Wallet from '../../models/walletSchema.js';
import logger from '../../utils/logger.js';

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
            await wallet.save({session});
            logger.info("Wallet funded successfully",{userId,amount});
            return{
                balance:wallet.balance,
                transactionId:wallet.transaction.at(-1)._id
            };
        });
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
    refernce:referenceType,
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
    reference:referenceType,
    description:`Debited for ${referenceType}`,
    order:orderId
});
await wallet.save({session});
logger.info("wallet debited",{userId,amount,orderId});
return true;
    })
}

}