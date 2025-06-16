const User = require("../../models/userSchema");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const pageNotFound = async (req, res) => {
  try {
    res.render("page-404", { pageCSS: "pageNotFound.css" });
  } catch (error) {
    console.error("Error rendering 404 page:", error);
    res.status(500).send("Internal Server Error");
  }
};

const loadHomepage = async (req, res) => {
  try {

    return res.render("user/home", {
      pageCSS: "home.css",
      currentPath: req.path,
    });
  } catch (error) {
    console.log("home page not found");
    res.status(500).send("Server error");
  }
};
const loadSignup = async (req, res) => {
  try {
    return res.render("user/signup", { pageCSS: "signup.css" });
  } catch (error) {
    console.log("home page not loading:", error);
    res.status(500).send("Server Error");
  }
};
const loadShopping = async (req, res) => {
  try {
    return res.render("shop", { pageCSS: "allproducts.css" });
  } catch (error) {
    console.log("Shopping page not loading:", error);
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
}

const signup = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("user/signup", { message: "Password do not match" });
    }
    const findUser = await User.findOne({ email });

    if (findUser) {
      return res.render("user/signup", {
        message: "User with this email already exists",
      });
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.render("user/signup", {
        message: "Failed to send OTP.plaease try again.",
        pageCSS: "singup.css",
      });
    }
    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password };
    req.session.otpExpires = Date.now() + 5 * 60 * 1000;
    res.render("user/generateotp", {
      email,
      pageCSS: "generateotp.css",
    });
    console.log("OTP Sent", otp);
  } catch (error) {
    console.error("signup error", error);
    res.redirect("/pageNotFound");
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res
        .status(500)
        .json({ success: false, message: "failed to send OTP" });
    }
    req.session.otp = otp;
    req.session.otpEmail = email;
    req.session.otpExpires = Date.now() + 300000;
    return res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("send otp error", error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (
      !req.session.userOtp ||
      !req.session.userData ||
      req.session.userData.email !== email ||
      req.session.userOtp !== otp ||
      Date.now() > req.session.otpExpires
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }
    const { name, phone, password } = req.session.userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });
    await newUser.save();

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
    res.render("user/login");
  } catch (error) {
     console.error("Error rendering login page:", error);
    res.redirect("/pageNotFound");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: 0, email: email });
    if (!findUser) {
      return res.render("user/login", { message: "User not found" });
    }
    if (findUser.isBlocked) {
      return res.render("login", { message: "User is blocked by admin" });
    }
    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("login", { message: "Incorrect password" });
    }
    req.session.user = findUser._id;
    res.redirect("/");
  } catch (error) {
    console.error("login error", error);
    res.render("user/login", {
      message: "login failed.please try again later ",
    });
  }
};

const loadGenerateotp = (req, res) => {
  res.render("user/generateotp");
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
      userId,
      pageCSS: "resetPassword.css",
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
        error: "Paswords do match",
        email
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
  res.render("user/forgotPassword");
};

const sendOTP = async (req, res) => {
  //forgotpassword otp
  try {
    const email = req.body.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("user/forgotPassword", { error: "email not found" });
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
  res.render("user/validationotp");
};

const verifyOTP = async (req, res) => {
  const userOTP = req.body.otp;
  const sessionOTP = req.session.otp;
  const email = req.session.resetEmail;

  if (!userOTP || userOTP.length !== 6 || isNaN(userOTP)) {
    return res.render("user/validationotp", {
      error: "Please enter a valid 6-digit OTP",
    });
  }

  if (parseInt(userOTP) === parseInt(sessionOTP)) {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("user/validationotp", {
        error: "User not found",
        pageCSS: "validationotp.css",
      });
    }

    req.session.otp = null;
    req.session.otpExpiry = null;
    return res.redirect(`/resetpassword?id=${user._id}`);
  } else {
    res.render("user/validationotp", { error: "invalid OTP" });
  }
};

const resendForgotOtp = async (req, res) => {
  try {
    const email = req.session.resetEmail;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Session expired" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    req.session.otp = otp;
    await sendVerificationEmail(email, otp);
    res.json({ success: false, message: "Server error" });
  } catch (error) {
    console.error("Resend forgot OTP error", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const resetforgotPassword = async (req, res) => {
  const { newPassword, confirmPassword, userId } = req.body;
  if (newPassword !== confirmPassword) {
    return res
      .staus(400)
      .json({ success: false, message: "Password do match" });
  }
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error(err);
    return res.status(500).json({ success: true, message: "Server error" });
  }
};

module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  loadShopping,
  signup,
  loadLogin,
  loadGenerateotp,
  resendOtp,
  verifyOtp, //signup otp
  sendOtp, //signup otp
  login,
  loadResetPassword,
  resetPassword,
  loadOTPPage, //validationotp page
  loadForgotPassword,
  sendOTP, //forgotpassword otp
  verifyOTP,
  resendForgotOtp,
  resetforgotPassword,
};
