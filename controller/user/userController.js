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

<<<<<<< Updated upstream
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
=======
const loadHomepage = async (req, res) => {
  try {
    console.log("reached home page ");
    let userData = null;
    if (req.session.user) {
      userData = await User.findById(req.session.user.id);
      console.log("userdata in home page",userData);
    }

    const categories = await Category.find({ status: "active" }).limit(4);
    const products = await Product.find({ isNewArrival: true })
      .sort({ createdAt: -1 })
      .limit(3);

    const testimonials = await Testimonial.findOne({ isVisible: true });

    return res.render("user/home", {
      user:userData,
      pageCSS:"home.css",
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
const loadSignup = async (req, res) => {
  try {
    return res.render("user/signup", {layout:false, pageCSS: "signup.css" });
  } catch (error) {
    console.log("home page not loading:", error);
    res.status(500).send("Server Error");
  }
};

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
      text: `Your OTP is${otp}`,
      html: `<b>Your OTP:${otp}</b>,
  `,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("error sending email", error);
    return false;
  }
>>>>>>> Stashed changes
}

export const loadSignup = async (req, res) => {
  logger.info('Loading signup page');
  res.render('user/signup', { layout: false, pageCSS: 'signup.css' });
}

<<<<<<< Updated upstream
export const signup=async(req,res)=>{
  logger.info('Processing signUp');
  const {name,phone,email,password,confirmPassword,referralCode}=req.body;
  if(password!==confirmPassword){
    return res.render('user/signup',{layout:false,pageCSS: 'signup.css', message: MESSAGES.SIGNUP_PASSWORD_MISMATCH})
=======
const signup = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword, referralCode } = req.body;
    console.log("referral code:",req.body.referralCode);

    if (password !== confirmPassword) {
      return res.render("user/signup", { message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user/signup", {
        layout: false,
        message: "User with this email already exists",
      });
    }
console.log("signup password:",password);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("hased password in the signup",hashedPassword);

    req.session.userData = {
      name,
      phone,
      email,
      password: hashedPassword,
    };

    let referralAmount = 100;
    if (referralCode) {
      const referringUser = await User.findOne({
        referralCode: referralCode.toUpperCase(),
      });
console.log("refferingUser",referringUser);
      if (referringUser) {
        req.session.referralInfo = {
          referrerId: referringUser._id,
          amount: referralAmount,
        };

        // Ensure wallet exists for referrer
        let wallet = await Wallet.findOne({ user: referringUser._id });
        const referralRef = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        if (!wallet) {
          wallet = await Wallet.create({
            user: referringUser._id,
            balance: referralAmount,
            transactions: [
              {
                amount: referralAmount,
                type: "referral",
                description: `Referral reward for ${email}`,
                status: "completed",
                reference: referralRef,
                metadata: {
                  referralMethod: "code",
                  referredEmail: email,
                },
              },
            ],
          });
        } else {
          wallet.balance += referralAmount;
          wallet.transactions.push({
            amount: referralAmount,
            type: "referral",
            description: `Referral reward for ${email}`,
            status: "completed",
            reference: referralRef,
            metadata: {
              referralMethod: "code",
              referredEmail: email,
            },
          });
          await wallet.save();
          console.log("wallet info while signup:",wallet);
        }
      }
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.render("user/signup", {
        layout: false,
        message: "Failed to send OTP. Please try again.",
        pageCSS: "signup.css",
        pageTitle: "Chettinad-Premium sarees",
      });
    }

    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 5 * 60 * 1000;

    // 7. Render OTP entry page
    res.render("user/generateotp", {
      layout: false,
      email,
      pageCSS: "generateotp.css",
      pageTitle: "Chettinad-Premium sarees",
    });

    console.log("OTP Sent", otp);
  } catch (error) {
    console.error("signup error", error);
    res.redirect("/pageNotFound");
>>>>>>> Stashed changes
  }
  const result = await userService.handleSingup({ name, phone, email, password, referralCode });


  if (!result.success) {
    logger.warn('Signup failed', { error: result.message });
    return res.render('user/signup', { layout: false, pageCSS: 'signup.css', message: result.message });
  }

<<<<<<< Updated upstream
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
=======
const verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (
      !req.session.userOtp ||
      !req.session.userData ||
      req.session.userData.email !== email ||
      req.session.userOtp !== String(otp) ||
      Date.now() > req.session.otpExpires
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    const { name, phone, password } = req.session.userData;
    const newUser = new User({
      name,
      email,
      phone,
      password: password,
    });
    await newUser.save();
    await Wallet.create({
      user: newUser._id,
      balance: 0,
      transactions: [
        {
          amount: 0,
          type: "initial",
          description: "Wallet created",
          status: "completed",
          reference: `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        },
      ],
    });

    req.session.userOtp = null;
    req.session.userData = null;
    req.session.otpExpires = null;

    return res.json({
      success: true,
      message: "User registered successfully ",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "internal server error ",
    });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "failed to resend OTP",
      });
    }
    req.session.userOtp = otp;
    return res.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const loadLogin = async (req, res) => {
  try {
    res.render("user/login",{ layout:false, pageTitle:"Chettinad-Premium sarees",message:null});
  } catch (error) {
    console.error("Error rendering login page:", error);
    res.redirect("/pageNotFound");
  }
};

// const login = async (req, res) => {
//   console.log("enter the controller");
//   try {
//     const { email, password } = req.body;
//     console.log("req.body", req.body);
//      console.log("🔍 Input password:", password);
//     console.log("🔍 Input password type:", typeof password);
//     console.log("🔍 Input password length:", password.length);
    
    
//     const findUser = await User.findOne({ isAdmin: 0, email: email });
//     console.log("founded user:", findUser);
    
//     if (!findUser) {
//       return res.render("user/login", { layout: false, message: "User not found" });
//     }
    
//     if (findUser.isBlocked) {
//       return res.render("user/login", { layout: false, message: "User is blocked by admin" });
//     }
//      console.log("🔍 Stored hash:", findUser.password);
//     console.log("🔍 Hash length:", findUser.password.length);
//     console.log("🔍 Hash starts with $2b$:", findUser.password.startsWith('$2b$'));
    
//     const passwordMatch = await bcrypt.compare(password, findUser.password);
//     console.log("passwordmatch",passwordMatch);

// // const testHash = await bcrypt.hash("1234567a", 10);
// // console.log("Generated Hash:", testHash);
// // console.log("Matches Stored Hash:", testHash === findUser.password);


//     if (!passwordMatch) {
//       return res.render("user/login", { layout: false, message: "Incorrect password" });
//     }

//     // Set session data
//     req.session.user = {
//       id: findUser._id,
//       name: findUser.name, 
//       email: findUser.email,
//       isAdmin: findUser.isAdmin,
//       googleId: findUser.googleId || null  
//     };

//     console.log("✅ Session data set:", req.session.user);
//     console.log("🔄 Redirecting to home page");
    
//     // Direct redirect - session middleware will save automatically
//     res.redirect("/");

//   } catch (error) {
//     console.error("login error", error);
//     res.render("user/login", {
//       layout: false,
//       message: "Login failed. Please try again later",
//     });
//   }
// };
const login = async (req, res) => {
  console.log("enter the controller");
  try {
    const { email, password } = req.body || {};
    const trimmedEmail = email ? email.trim() : '';
    const trimmedPassword = password ? password.trim() : '';

    console.log("req.body", { email: trimmedEmail, password: trimmedPassword });
    console.log(" Input email:", trimmedEmail);
    console.log(" Input password:", trimmedPassword);
    console.log(" Input password type:", typeof trimmedPassword);
    console.log(" Input password length:", trimmedPassword.length);

    if (!trimmedEmail || !trimmedPassword) {
      return res.render("user/login", { layout: false, message: "Email and password are required" });
    }

    const findUser = await User.findOne({ isAdmin: 0, email: trimmedEmail });
    console.log("Retrieved user from DB:", findUser);

    if (!findUser) {
      return res.render("user/login", { layout: false, message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("user/login", { layout: false, message: "User is blocked by admin" });
    }

    console.log("🔍 Stored hash:", findUser.password);
    console.log("🔍 Hash length:", findUser.password.length);
    console.log("🔍 Hash starts with $2b$:", findUser.password.startsWith('$2b$'));

    const passwordMatch = await bcrypt.compare(trimmedPassword, findUser.password);
    console.log("🔍 Password match result:", passwordMatch);

    if (!passwordMatch) {
      return res.render("user/login", { layout: false, message: "Incorrect password" });
    }

    req.session.user = {
      id: findUser._id,
      name: findUser.name,
      email: findUser.email,
      isAdmin: findUser.isAdmin,
      googleId: findUser.googleId || null
    };

    console.log(" Session data set:", req.session.user);
    console.log(" Redirecting to home page");

    res.redirect("/");

  } catch (error) {
    console.error("login error", error.message, error.stack);
    res.render("user/login", {
      layout: false,
      message: "Login failed. Please try again later",
    });
  }
};


const loadGenerateotp = (req, res) => {
  res.render("user/generateotp",{layout:false});
};

const loadResetPassword = async (req, res) => {
  try {
    const userEmail = req.session.resetEmail;
    if (!userEmail) {
      return res.redirect("/forgotpassword");
    }
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.redirect("/forgotpassword");
    }

    const userId = req.query.id;
    return res.render("user/resetPassword", {
      layout:false,
      userId,
      pageCSS: "resetPassword.css",
        pageTitle:"Chettinad-Premium sarees"
    });
  } catch (error) {
    console.log(error.message);
    res.redirect("/error");
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID" });
    }

    if (newPassword !== confirmPassword) {
      return res.render("user/resetPassword", {
        layout:false,
        error: "Paswords do match",
        email,
          pageTitle:"Chettinad-Premium sarees"
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );
    req.session.resetEmail = null;
    res.json({
      success: true,
      message: "password reset successfully",
      redirect: "/login?reset=success",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      redirect: "/error",
    });
  }
};

const loadForgotPassword = (req, res) => {
  res.render("user/forgotPassword",{layout:false,pageTitle:"Chettinad"});
};

const sendOTP = async (req, res) => {
  //forgotpassword otp
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("user/forgotPassword", {layout:false, error: "email not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log("otp is:", otp);
    req.session.otp = otp;
    req.session.resetEmail = email;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is <b>${otp}</b>. It will expire in 5 minutes.</p>
         <p>Or click this link to reset directly: <a href="http://yourdomain.com/resetpassword?id=${user._id}">Reset Password</a></p>`,
    };
    await transporter.sendMail(mailOptions);
    res.redirect("/validationotp");
  } catch (error) {
    console.log(error.message);
    res.redirect("/error");
  }
};

const loadOTPPage = (req, res) => {
  res.render("user/validationotp",{layout:false,pageTitle:"Chettinad"});
};

const verifyOTP = async (req, res) => {
  const userOTP = req.body.otp;
  const sessionOTP = req.session.otp;
  const email = req.session.resetEmail;
>>>>>>> Stashed changes

  
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