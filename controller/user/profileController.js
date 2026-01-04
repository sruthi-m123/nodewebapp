import  ProfileService  from "../../service/user/profile.service.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import { MESSAGES } from "../../utils/messages.js";
import logger from "../../utils/logger.js";

export const getProfile = async (req, res) => {
  logger.info("Loading user profile page");

  const userId = req.session?.user?._id;

  if (!userId) {
    const error = new Error(MESSAGES.AUTH.SESSION_LOST);
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const user = await ProfileService.getUserProfile(userId);

  res.render("user/profile", {
    activeTab: "profile",
    user: {
      name: user.name || "",
      email: user.email,
      phone: user.phone,
      gender: user.gender || "Prefer not say",
      avatar: user.avatar || "/img/admin-products.png",
    },
  });
};

export const getEditProfile = async (req, res) => {
  logger.info("Loading edit profile page");

  const userId = req.session?.user?._id;

  if (!userId) {
    const error = new Error(MESSAGES.AUTH.SESSION_LOST);
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  const user = await ProfileService.getUserProfile(userId);

  res.render("user/editProfile", {
    activeTab: "profile",
    user: {
      name: user.name || "",
      email: user.email,
      phone: user.phone || "",
      gender: user.gender || "Prefer not say",
      avatar: user.avatar || "/img/admin-products.png",
      googleId: user.googleId,
    },
  });
};

export const updateProfile = async (req, res) => {
  logger.info("Updating user profile");

  const userId = req.session?.user?._id;

  if (!userId) {
    const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  
  const user = await ProfileService.updateUserProfile(userId, req.body, req.file);

  res.json({
    success: true,
    message: MESSAGES.PROFILE.UPDATE_SUCCESS,
    updatedAvatarUrl: user.avatar,
  });
};

export const requestEmailChangeOTP = async (req, res) => {
  logger.info("Requesting email change OTP");

  const userId = req.session?.user?._id;

  if (!userId) {
    const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

 
  const { otp, newEmail } = await ProfileService.requestEmailChange(
    userId,
    req.body.newEmail
  );

  req.session.emailChangeOTP = otp;
  req.session.emailChangeTarget = newEmail;

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.AUTH.OTP_SENT,
  });
};

export const verifyEmailChange = async (req, res) => {
  logger.info("Verifying email change OTP");

  const userId = req.session?.user?._id;

  if (!userId) {
    const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  if (!req.session.emailChangeOTP || !req.session.emailChangeTarget) {
    const error = new Error(MESSAGES.AUTH.SESSION_EXPIRED);
    error.statusCode = STATUS_CODES.BAD_REQUEST;
    throw error;
  }

  await ProfileService.verifyEmailChange(
    userId,
    req.body.enteredOtp,          
    req.session.emailChangeOTP,
    req.session.emailChangeTarget
  );

  delete req.session.emailChangeOTP;
  delete req.session.emailChangeTarget;

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.PROFILE.EMAIL_UPDATE_SUCCESS,
  });
};

export const changePassword = async (req, res) => {
  logger.info("Changing password");

  const userId = req.session?.user?._id;

  if (!userId) {
    const error = new Error(MESSAGES.AUTH.UNAUTHORIZED);
    error.statusCode = STATUS_CODES.UNAUTHORIZED;
    throw error;
  }

  await ProfileService.changePassword(
    userId,
    req.body.currentPassword,     
    req.body.newPassword          
  );

  res.status(STATUS_CODES.SUCCESS).json({
    success: true,
    message: MESSAGES.AUTH.PASSWORD_CHANGE_SUCCESS,
  });
};
