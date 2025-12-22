import ProfileService  from "../../service/user/profile.service";
import{
  updateProfileSchema,
  emailChangeSchema,
  verifyOtpSchema,
  changePasswordSchema
} from '../../utils/validation.schema.js';
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { MESSAGES } from "../../utils/messages";
import logger from '../../utils/logger.js';

export const getProfile=async(req,res)=>{
  logger.info('loading user profile page');
  const userId=req.sesssion?.user?.id||req.user?.id;
  if(!user){
    const error=new Error(MESSAGES.AUTH.SESSION_LOST);
    error.statusCode=STATUS_CODES.UNAUTHORIZED;
    throw error;
  }
  const user =await ProfileService.getUserProfile(userId);
  res.render('user/profile',{
      activeTab: "profile",
        user: {
            name: user.name || "",
            email: user.email,
            phone: user.phone,
            gender: user.gender || "Prefer not say",
            avatar: user.avatar || "/img/admin-products.png",
        },

  })
}

export const getEditProfile=async(req,res)=>{
  logger.info('loading edit profile page');

  const userId= req.session?.user?.id;
  if(!userId){
    const error=new Error(MESSAGES.AUTH.SESSION_LOST);
    error.statusCode=STATUS_CODES.UNAUTHORIZED;
    throw error;
  }
  const user= await ProfileService.getUserProfile(userId);
  res.render('user/editProfile',{
    
activeTab: "profile",
        user: {
            name: user.name || "",
            email: user.email,
            phone: user.phone || "",
            gender: user.gender || "Prefer not say",
            avatar: user.avatar || "/img/admin-products.png",
            googleId: user.googleId
        }
    });

}

export const upadateProfile=async(req,res)=>{
  logger.info('Updating user profile');
    
    const userId = req.session?.user?._id;
    
    if (!userId) {
        const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
        error.statusCode = STATUS_CODES.UNAUTHORIZED;
        throw error;
    }
     const { error, value } = updateProfileSchema.validate(req.body);
    if (error) {
        logger.warn('Profile update validation failed', { error: error.details[0].message });
        const validationError = new Error(error.details[0].message);
        validationError.statusCode = STATUS_CODES.BAD_REQUEST;
        throw validationError;
    }
    const user = await ProfileService.updateUserProfile(userId, value, req.file);

    res.json({
        success: true,
        message: MESSAGES.PROFILE.UPDATE_SUCCESS,
        updatedAvatarUrl: user.avatar
    });
        
}

export const requestEmailChangeOTP=async(req,res)=>{
  logger.info('Requesting email change OTP');
    
    const userId = req.session?.user?._id;
    
    if (!userId) {
        const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
        error.statusCode = STATUS_CODES.UNAUTHORIZED;
        throw error;
    }

    const { error, value } = emailChangeSchema.validate(req.body);
    if (error) {
        logger.warn('Email change validation failed', { error: error.details[0].message });
        const validationError = new Error(error.details[0].message);
        validationError.statusCode = STATUS_CODES.BAD_REQUEST;
        throw validationError;
    }

    const { otp, newEmail } = await ProfileService.requestEmailChange(userId, value.newEmail);

    req.session.emailChangeOTP = otp;
    req.session.emailChangeTarget = newEmail;

    res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: MESSAGES.AUTH.OTP_SENT
    });
}


export const verifyEmailChange = async (req, res) => {
    logger.info('Verifying email change OTP');
    
    const userId = req.session?.user?._id;
    
    if (!userId) {
        const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
        error.statusCode = STATUS_CODES.UNAUTHORIZED;
        throw error;
    }

    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
        logger.warn('OTP validation failed', { error: error.details[0].message });
        const validationError = new Error(error.details[0].message);
        validationError.statusCode = STATUS_CODES.BAD_REQUEST;
        throw validationError;
    }

    if (!req.session.emailChangeOTP || !req.session.emailChangeTarget) {
        const error = new Error(MESSAGES.AUTH.SESSION_EXPIRED);
        error.statusCode = STATUS_CODES.BAD_REQUEST;
        throw error;
    }

    await ProfileService.verifyEmailChange(
        userId,
        value.enteredOtp,
        req.session.emailChangeOTP,
        req.session.emailChangeTarget
    );

    delete req.session.emailChangeOTP;
    delete req.session.emailChangeTarget;

    res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: MESSAGES.PROFILE.EMAIL_UPDATE_SUCCESS
    });
};

export const changePassword = async (req, res) => {
    logger.info('Changing user password');
    
    const userId = req.session?.user?._id;
    
    if (!userId) {
        const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
        error.statusCode = STATUS_CODES.UNAUTHORIZED;
        throw error;
    }

    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
        logger.warn('Password change validation failed', { error: error.details[0].message });
        const validationError = new Error(error.details[0].message);
        validationError.statusCode = STATUS_CODES.BAD_REQUEST;
        throw validationError;
    }

    await ProfileService.changePassword(userId, value.currentPassword, value.newPassword);

    res.status(STATUS_CODES.SUCCESS).json({
        success: true,
        message: MESSAGES.AUTH.PASSWORD_CHANGE_SUCCESS
    });
};