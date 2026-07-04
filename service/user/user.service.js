import User from '../../models/userSchema.js';
import Product from'../../models/productSchema.js';
import Category  from '../../models/categorySchema.js';
// import Referral from '../../models/referralSchema';
import Wallet from '../../models/walletSchema.js';
import bcrypt from 'bcrypt';
import {generateOtp} from '../../utils/otpUtils.js';
import { sendVerificationEmail } from '../emailService.js';

export const getHomePageData=async(userId)=>{
    let userData=null;
    if(userId){
        userData=await User.findById(userId);

    };
    const categories=await Category.find({status:'active'}).limit(4);
    const products=await Product.find({isNewArrival:true})
    .sort({createdAt:-1})
    .limit(3);
    return {user:userData,categories,products};
};

export const  handleSingup=async({name,phone,email,password,referralCode})=>{
    const existingUser=await User.findOne({email});
    if(existingUser){
        return {success:false,message:'User with this email already exists'};

    }
    const sessionUserData={name,phone,email,password};

    let referralInfo=null;
    if(referralCode){
        const referringUser=await User.findOne({referralCode:referralCode.toUpperCase()});
        if(referringUser){
            referralInfo={referrerId:referringUser._id,amount:100};
        }
    }
    const otp=generateOtp();

    const emailSent=await sendVerificationEmail(email,otp);
    if(!emailSent){
        return {success:false,message:'Failed to send OTP.Please try again.'};

    }

    return {success:true,otp,sessionUserData:sessionUserData,referralInfo};

}

const updateReferralWallet=async(referrerId,referredEmail)=>{
    console.log("inside the update refferal");
    const referralAmount=100;
    let wallet=await Wallet.findOne({user:referrerId});
    const referralRef=`REF-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const transaction ={
        amount:referralAmount,
        type:'referral',
        decription :`Referral reward for ${referredEmail}`,
        status:'completed',
        refernce:referralRef,
        metadata:{referralMethod:'code',referredEmail}
    };
    if (!wallet) {
    wallet = await Wallet.create({
      user: referrerId,
      balance: referralAmount,
      transactions: [transaction]
    });
    } else {
    wallet.balance += referralAmount;
    wallet.transactions.push(transaction);
    await wallet.save();
  }
  return wallet;
}

export const sendSignupOtp=async(email)=>{
    const otp=generateOtp();
    const emailSent=await sendVerificationEmail(email,otp);
    if(!emailSent){
        return{success:false,message:'Failed to send otp'};
    };
    return {success:true,otp};
}

export const verifySignupOtp=async (otp,session)=>{
    
     if (!session.userOtp || !session.userData) {
    return { success: false, message: 'Session expired. Please signup again.' };
  }

  if (Date.now() > session.otpExpires) {
    return { success: false, message: 'OTP expired' };
  }
console.log("session otp inside the resend :",session.userOtp);
console.log("otp inside the resend:",otp);
  if (session.userOtp !== String(otp)) {
    return { success: false, message: 'Invalid OTP' };
  }
      const {name,phone,password,email}=session.userData;

      const existingUser=await User.findOne({email});
if(existingUser){
    return {success:false,message:'User already exists'};
}
      const hashedPassword=await bcrypt.hash(password,10);
      const newUser=await User.create({name,email,phone,password:hashedPassword});
     await Wallet.create({
    user: newUser._id,
    balance: 0,
    transactions: [{
      amount: 0,
      type: 'initial',
      description: 'Wallet created',
      status: 'completed',
      reference: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }]
  });
  const refferalInfo=session.referralInfo;
  console.log("refferalInfo:",refferalInfo);
  if(refferalInfo){
    //refferer reward
    await updateReferralWallet(
        refferalInfo.referrerId,
        newUser.email
    );
    //new user reward
    await updateReferralWallet(
        newUser._id,
        "signup referral bonus"
    )
  }
  return{success:true};
}

export const resendSignupOtp=async(email)=>{
    const otp=generateOtp();
    const emailSent=await sendVerificationEmail(email,otp);
    if(!emailSent){
        return {success:false,message:'Failed to resend OTP'};

    }
    return {success:true,otp};
}

export const handleLogin=async(email,password)=>{
    const findUser=await User.findOne({isAdmin:0,email});
    if(!findUser){
        return {success:false,message:'User not found'};
    }

    if(findUser.isBlocked){
        return {success:false,message:'User is blocked by admin'};
    }

    if(!findUser.password && findUser.googleId){
        return {success:false,message:'This account is linked with Google. Please log in using Google.'}
    }

    if(!findUser.password){
        return {success:false,message:'Incorrect password'}
    }

    const passwordMatch=await bcrypt.compare(password,findUser.password);
    if(!passwordMatch){
        return {success:false,message:'Incorrect password'}
    }

           const userSessionData = {
    id: findUser._id,
    name: findUser.name,
    email: findUser.email,
    isAdmin: findUser.isAdmin,
    googleId: findUser.googleId || null
  };

  return { success: true, userSessionData }; 
}

export const sendForgotPasswordOtp=async(email)=>{
    const user=await User.findOne({email});
    if(!user){
        return {success:false,message:'Email not found'};
    }
    const otp=generateOtp();
    const emailSent=await sendVerificationEmail(email,otp);
    if(!emailSent){
        return {success:false,message:'Failed to send OTP'};
    }
    return {success:true,otp,userId:user._id};
}

export const verifyForgotPassword=async(userOtp,email)=>{
    if(!userOtp||userOtp.length!==6||isNaN(userOtp)){
        return {success:false,message:'Please enter a valid 6  digit OTP'};
    }
    // Assume sessionOTP from session in controller call
  const user = await User.findOne({ email });
  if (!user || parseInt(userOtp) !== parseInt(/* sessionOTP from param or session */)) { // Integrate sessionOTP
    return { success: false, message: 'Invalid OTP' };
  }

  // Clear session in controller
  return { success: true, userId: user._id };
}

export const resendForgotPasswordOtp=async(email)=>{
    if(!email){
        return {success:false,message:'Session expired'};
        
    }
    const otp=generateOtp();
    const emailSent=await sendVerificationEmail(email,otp);
    if(!emailSent){
        return {success:false,message:'Falied to resend OTP'};
    }
    return {success:true,otp};
}

export const handlePasswordReset=async(userId,newPassword)=>{
    if(!userId){
        return {success:false,message:'Invalid userId'};
    }

    const hashedPassword=await bcrypt.hash(newPassword,10);
    await User.updateOne({_id:userId},{$set:{password:hashedPassword}});
    return {success:true};
}
