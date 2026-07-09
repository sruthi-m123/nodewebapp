import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import logger from "../../utils/logger.js";
import * as userService from '../../service/user/user.service.js';
import { MESSAGES } from "../../utils/messages.js";
import User from "../../models/userSchema.js";
import Category from "../../models/categorySchema.js";
import Product from "../../models/productSchema.js";
import Testimonial from "../../models/testimonialSchema.js";
import Wallet from "../../models/walletSchema.js";
import { signupSchema } from "../../validators/index.js";


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}




async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("error sending email", error);
    return false;
  }
}

export const pageNotFound = async (req, res) => {
  logger.info('Rendering 404 page');
  res.render('user/page-404', {
    pageCSS: 'pageNotFound.css',
    pageTitle: 'Chettinad - Premium Sarees'
  });
};

export const loadHomepage = async (req, res) => {
  logger.info('loading homepage');
  try {
    let userData = null;
    if (req.session.user) {
      userData = await User.findById(req.session.user.id);
    }

    const categories = await Category.find({ status: "active" }).limit(4);
    const products = await Product.find({ isNewArrival: true })
      .sort({ createdAt: -1 })
      .limit(3);
    const testimonials = await Testimonial.findOne({ isVisible: true });

    res.render('user/home', {
      user: userData,
      pageCSS: 'home.css',
      pageTitle: 'Chettinad - Premium Saree Boutique',
      currentPath: req.path,
      categories,
      products,
      testimonials
    });
  } catch (error) {
    console.log("home page not found", error);
    res.status(500).send("Server error:", error);
  }
};

export const loadSignup = async (req, res) => {
  logger.info('Loading signup page');
  res.render('user/signup', { layout: false, pageCSS: 'signup.css' });
};

export const signup = async (req, res) => {
  logger.info('Processing signUp');
  const { error, value } = signupSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const firstErrorMessage = error.details[0].message;
    return res.render('user/signup', {
      layout: false,
      pageCSS: 'signup.css',
      message: firstErrorMessage,
      formData: req.body
    });
  }
  const { name, phone, email, password, referralCode } = value;


  const result = await userService.handleSingup({ name, phone, email, password, referralCode });

  if (!result.success) {
    logger.warn('Signup failed', { error: result.message });
    return res.render('user/signup', {
      layout: false,
      pageCSS: 'signup.css',
      message: result.message,
      formData: req.body
    });
  }

  req.session.userData = result.sessionUserData;
  req.session.userOtp = result.otp;
  req.session.otpExpires = Date.now() + 60 * 1000;
  req.session.referralInfo = result.referralInfo;

  await req.session.save();
  res.render('user/generateotp', {
    layout: false,
    email,
    pageCSS: 'generateotp.css',
    pageTitle: 'Chettinad - Premium Sarees'
  });
};

export const sendOtp = async (req, res) => {
  logger.info('Sending OTP for signup');
  const { email } = req.body;
  const result = await userService.sendSignupOtp(email);
  if (!result.success) {
    logger.warn('OTP send failed', { error: result.message });
    return res.status(STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: result.message });
  }
  res.json({ success: true, message: MESSAGES.OTP_SENT_SUCCESS });
};

export const verifyOtp = async (req, res) => {
  logger.info('Verifying signup OTP');
  const { otp } = req.body;
  const session = req.session;
  const result = await userService.verifySignupOtp(otp, session);

  if (!result.success) {
    logger.warn('OTP verification failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: result.message });
  }

  delete req.session.userOtp;
  delete req.session.userData;
  delete req.session.otpExpires;

  res.json({ success: true, message: "logged in successfully" });
};

export const resendOtp = async (req, res) => {
  logger.info('Resending signup OTP');
  const { email } = req.body;
  const result = await userService.resendSignupOtp(email);
  if (!result.success) {
    logger.warn('OTP resend failed', { error: result.message });
    return res.status(STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: result.message });
  }
  req.session.userOtp = result.otp;
  req.session.otpExpires = Date.now() + 60 * 1000;

  await req.session.save();
  res.json({ success: true, message: MESSAGES.OTP_RESENT_SUCCESS });
};

export const loadLogin = async (req, res) => {
  logger.info('Loading login page');
  const message = req.query.message || null;
  res.render('user/login', { layout: false, pageTitle: 'Chettinad - Premium Sarees', message });
};

export const login = async (req, res) => {
  logger.info('Processing login');
  const { email, password } = req.body;
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  const result = await userService.handleLogin(trimmedEmail, trimmedPassword);

  if (!result.success) {
    logger.warn('Login failed', { error: result.message });
    return res.render('user/login', { layout: false, message: result.message });
  }

  req.session.user = result.userSessionData;
  logger.info('Login successful', { userId: result.userSessionData.id });
  res.redirect('/user/home');
};

export const loadGenerateotp = async (req, res) => {
  logger.info('Loading OTP generation page');
  res.render('user/generateotp', { layout: false });
};

export const loadForgotPassword = async (req, res) => {
  logger.info('Loading forgot password page');
  res.render('user/forgotpassword', { layout: false, pageTitle: 'Chettinad' });
};

export const sendOTP = async (req, res) => {
  logger.info('Sending forgot password OTP');
  const { email } = req.body;
  const result = await userService.sendForgotPasswordOtp(email);
  if (!result.success) {
    logger.warn('Forgot password OTP send failed', { error: result.message });
    return res.render('user/forgotPassword', { layout: false, error: result.message });
  }
  req.session.forgotOtp = result.otp;
  req.session.email = email;
  req.session.forgotOtpExpires = Date.now() + 60 * 1000;
  res.redirect('/user/validationotp');
};

export const loadOTPPage = async (req, res) => {
  logger.info('Loading OTP validation page');
  res.render('user/validationotp', { layout: false, pageTitle: 'Chettinad' });
};

export const verifyOTP = async (req, res) => {
  logger.info('Verifying forgot password OTP');
  console.log("session in fp:", req.session)
  const { otp } = req.body;

  if (!req.session.forgotOtpExpires || Date.now() > req.session.forgotOtpExpires) {
    return res.render('user/validationotp', {
      layout: false,
      error: 'OTP expired. Please resend the code.',
      otpExpired: true,
      pageTitle: 'Chettinad'
    });
  }

  const result = await userService.verifyForgotPassword(
    otp,
    req.session.forgotOtp,
    req.session.email
  );
  console.log("result in the otp:", result);
  if (!result.success) {
    logger.warn('Forgot password OTP verification failed', { error: result.message });
    console.log("error in the forgot password:", result.message);
    return res.render('user/validationotp', {
      layout: false,
      error: result.message,
      pageTitle: 'Chettinad'
    });
  }
  res.redirect(`/user/resetpassword?id=${result.userId}`);
};

export const resendForgotOtp = async (req, res) => {
  logger.info('Resending forgot password OTP');
  const email = req.session.email;
  const result = await userService.resendForgotPasswordOtp(email);
  if (!result.success) {
    logger.warn('Forgot password OTP resend failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: result.message });
  }
  req.session.forgotOtp = result.otp;
  req.session.forgotOtpExpires = Date.now() + 60 * 1000;
  res.json({ success: true, message: MESSAGES.OTP_RESENT_SUCCESS });
};

export const loadResetPassword = async (req, res) => {
  logger.info('Loading reset password page');
  const userEmail = req.session.email;
  if (!userEmail) {
    return res.redirect('/user/forgotpassword');
  }
  const userId = req.query.id;
  res.render('user/resetPassword', {
    layout: false,
    userId,
    pageCSS: 'resetPassword.css',
    pageTitle: 'Chettinad - Premium Sarees'
  });
};

export const resetPassword = async (req, res) => {
  logger.info('Processing password reset');
  const { userId, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.render('user/resetPassword', {
      layout: false,
      error: MESSAGES.RESET_PASSWORD_MISMATCH,
      pageTitle: 'Chettinad - Premium Sarees'
    });
  }

  const result = await userService.handlePasswordReset(userId, newPassword);
  if (!result.success) {
    logger.warn('Password reset failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: result.message });
  }
  req.session.resetEmail = null;
  res.json({
    success: true,
    message: MESSAGES.RESET_PASSWORD_SUCCESS,
    redirect: '/login?reset=success'
  });
};

export const resetforgotPassword = async (req, res) => {
  logger.info('Processing forgot password reset');
  const { newPassword, confirmPassword, userId } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.RESET_PASSWORD_MISMATCH });
  }

  const result = await userService.handlePasswordReset(userId, newPassword);
  if (!result.success) {
    logger.warn('Forgot password reset failed', { error: result.message });
    return res.status(STATUS_CODES.INTERNAL_ERROR).json({ success: false, message: result.message });
  }
  res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.RESET_PASSWORD_SUCCESS });
};

export const logout = async (req, res) => {
  logger.info('Processing logout');
  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destroy error', { error: err });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send(MESSAGES.LOGOUT_FAILED);
    }
    res.clearCookie('connect.sid');
    res.redirect('/user/login');
  });

};
