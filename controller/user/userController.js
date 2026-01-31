import { STATUS_CODES } from "../../utils/statusCodes.js";
import logger from "../../utils/logger.js";
import * as userService from '../../service/user/user.service.js';
import { MESSAGES } from "../../utils/messages.js";

export const pageNotFound = async (req, res) => {
  logger.info('Rendering 404 page');
  res.render('user/page-404', {
    pageCSS: 'pageNotFound.css',
    pageTitle: 'Chettinad - Premium Sarees'
  });
};

export const loadHomepage=async(req,res)=>{
  logger.info('loading homepage');
  const{user,categories,products,testimonials}=await userService.getHomePageData(req.session.user?.id)
res.render('user/home', {
    user,
    pageCSS: 'home.css',
    pageTitle: 'Chettinad - Premium Saree Boutique',
    currentPath: req.path,
    categories,
    products,
    testimonials
  });
}

export const loadSignup = async (req, res) => {
  logger.info('Loading signup page');
  res.render('user/signup', { layout: false, pageCSS: 'signup.css' });
}

export const signup=async(req,res)=>{
  logger.info('Processing signUp');
  const {name,phone,email,password,confirmPassword,referralCode}=req.body;
  if(password!==confirmPassword){
    return res.render('user/signup',{layout:false,pageCSS: 'signup.css', message: MESSAGES.SIGNUP_PASSWORD_MISMATCH})
  }
  const result = await userService.handleSingup({ name, phone, email, password, referralCode });


  if (!result.success) {
    logger.warn('Signup failed', { error: result.message });
    return res.render('user/signup', { layout: false, pageCSS: 'signup.css', message: result.message });
  }

 req.session.userData=result.sessionUserData;
 req.session.userOtp=result.otp;
 req.session.otpExpires=Date.now()+5*60*1000;
 req.session.referralInfo = result.referralInfo;

 
 await req.session.save();
  res.render('user/generateotp', {
    layout: false,
    email,
    pageCSS: 'generateotp.css',
    pageTitle: 'Chettinad - Premium Sarees'
  });

  
}

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
  const session=req.session;
  const result = await userService.verifySignupOtp(otp,session);
  if (!result.success) {
    logger.warn('OTP verification failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: result.message });
  }

    delete req.session.userOtp;
  delete req.session.userData;
  delete req.session.otpExpires;

  res.json({ success: true, message: MESSAGES.SIGNUP_SUCCESS });
};
export const resendOtp = async (req, res) => {
  logger.info('Resending signup OTP');
  const { email } = req.body;
  const result = await userService.resendSignupOtp(email);
  if (!result.success) {
    logger.warn('OTP resend failed', { error: result.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: result.message });
  }
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
  res.render('user/forgotPassword', { layout: false, pageTitle: 'Chettinad' });
};

export const sendOTP = async (req, res) => {
  logger.info('Sending forgot password OTP');
  const { email } = req.body;
  const result = await userService.sendForgotPasswordOtp(email);
  if (!result.success) {
    logger.warn('Forgot password OTP send failed', { error: result.message });
    return res.render('user/forgotPassword', { layout: false, error: result.message });
  }
  res.redirect('/user/validationotp');
};

export const loadOTPPage = async (req, res) => {
  logger.info('Loading OTP validation page');
  res.render('user/validationotp', { layout: false, pageTitle: 'Chettinad' });
};

export const verifyOTP = async (req, res) => {
  logger.info('Verifying forgot password OTP');
  const { otp } = req.body;
  const result = await userService.verifyForgotPassword(otp, req.session.resetEmail);
  if (!result.success) {
    logger.warn('Forgot password OTP verification failed', { error: result.message });
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
  const email = req.session.resetEmail;
  const result = await userService.resendForgotPasswordOtp(email);
  if (!result.success) {
    logger.warn('Forgot password OTP resend failed', { error: result.message });
    return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: result.message });
  }
  res.json({ success: true, message: MESSAGES.OTP_RESENT_SUCCESS });
}

export const loadResetPassword = async (req, res) => {
  logger.info('Loading reset password page');
  const userEmail = req.session.resetEmail;
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
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: result.message });
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