import User from '../../models/userSchema.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import {sendEmailChangeOTP} from '../../service/emailService.js';
import {MESSAGES} from '../../utils/messages.js';
import logger from '../../utils/logger.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { updateSearchIndex } from '../../models/testimonialSchema';
import { deleteFromCloudinary } from '../../utils/cloudinary.js';


class ProfileService{
    static async getUserProfile(userId){
        logger.debug('fetching user profile',{userId});

        const user =await User.findById(userId).select("-password -googleId -isBlocked -isAdmin");

        if(!user){
            logger.warn('User not found for profile',{userId});
            const error=new Error(MESSAGES.USER.NOT_FOUND);
            error.statusCode=STATUS_CODES.NOT_FOUND;
            throw error;
        }

        logger.info('user profile fetched successfully',{userId});
        return user;

    }
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