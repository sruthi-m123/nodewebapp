import User from '../../models/userSchema.js';
import bcrypt from 'bcrypt';
// import fs from 'fs';
// import path from 'path';
import {sendEmailChangeOTP} from '../../service/emailService.js';
import {MESSAGES} from '../../utils/messages.js';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';

import { deleteFromCloudinary } from '../../utils/cloudinary.js';


class ProfileService{
    static async getUserProfile(userId){
        logger.debug('fetching user profile',{userId});

        const user =await User.findById(userId).select("-password  -isBlocked -isAdmin");
console.log("user inside the getuserprofie: ",user)
        if(!user){
            logger.warn('User not found for profile',{userId});
            const error=new Error(MESSAGES.USER.NOT_FOUND);
            error.statusCode=STATUS_CODES.NOT_FOUND;
            throw error;
        }

        logger.info('user profile fetched successfully',{userId});
        return user;

    }
    

    static async updateUserProfile(userId,updates,file=null){
        logger.debug('updating user profile',{userId,updates});

        if(file){
         updates.avatar=file.path;
         updates.avatarPublicId=file.filename;

         await this.cleanupOldAvatar(userId);
        }
const user=await User.findByIdAndUpdate(
    userId,
    updates,
    {new:true,runValidators:true}
).select('-password');

if(!user){
    logger.warn('User not found for update',{userId});
    const error=new Error(MESSAGES.USER.NOT_FOUND);
    error.statusCode=STATUS_CODES.NOT_FOUND;
    throw error;
}
logger.info('user profile updated successfully',{userId});
return user

    }

    static async cleanupOldAvatar(userId){
        const user=await User.findById(userId);

        if(!user||!user.avatar) return;

        await deleteFromCloudinary(user.avatar,"chettinad/uploads/avatar");
    }

static async requestEmailChange(userId,newEmail){
    logger.debug('Requesting email change OTP',{userId,newEmail});

    const existingUser=await User.findOne({email:newEmail});
    if(existingUser){
        logger.warn('email already in use',{newEmail});
        const error=new Error(MESSAGES.USER.EMAIL_EXISTS);
        error.statusCode=STATUS_CODES.BAD_REQUEST;
        throw error;
    }
    const otp=Math.floor(100000+Math.random()*900000);
    logger.debug('Generated OTP for email change',{otp});
    await sendEmailChangeOTP(newEmail,otp);
    logger.info('email change otp send successfully',{newEmail});
    return {otp,newEmail};
}

static async verifyEmailChange(userId,enteredOtp,sessionOtp,taregetEmail){
    logger.debug('verify email change OTP',{userId,enteredOtp});

    if(parseInt(enteredOtp)!==sessionOtp){
        logger.warn('Invalid OTP provided',{enteredOtp,sessionOtp});
        const error=new Error(MESSAGES.AUTH.INVALID_OTP);
        error.statusCode=STATUS_CODES.BAD_REQUEST;
        throw error;
    }

    const user=await User.findByIdAndUpdate(userId,
        {email:taregetEmail},
        {new:true}
    );
    if(!user){
        logger.warn('User not found during email uodate',{userId});
        const error=new Error(MESSAGES.USER.NOT_FOUND);
        error.statusCode=STATUS_CODES.NOT_FOUND;
        throw error;
    }

    logger.info('email already upated successfully',{userId,newEmail:taregetEmail});
    return user;
}

static async changePassword(userId,currentPassword,newPassword){
    logger.debug('changing user password',{userId});
    const user=await User.findById(userId);

    if(!user){
        logger.warn('User not found for password change',{userId});
        const error=new Error(MESSAGES.USER.NOT_FOUND);
        error.statusCode=STATUS_CODES.NOT_FOUND;
        throw error;
    }
const isMatch=await bcrypt.compare(currentPassword,user.password);
if(!isMatch){
    logger.warn('current passwrd incorrect',{userId});
    const error = new Error(MESSAGES.AUTH.INCORRECT_PASSWORD);
            error.statusCode = 400;
            throw error;
}

const hashedPassword=await bcrypt.hash(newPassword,10);
user.password=hashedPassword;
await user.save();
logger.info('password changed successfully',{userId});
return user;

}

}
export default ProfileService;