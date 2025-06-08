const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const passport =require("passport");

router.get("/", userController.loadHomepage);
router.get("/signup", userController.loadSignup);
router.get("/shop", userController.loadShopping);
router.get("/pageNotFound", userController.pageNotFound);
router.post("/signup", userController.signup);
router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/login", userController.loadLogin);
router.post("/login",userController.login);
router.get("/generateotp", userController.loadGenerateotp);
router.post('/login',userController.login)
router.get("/forgotpassword",userController.loadForgotPassword);
router.get('/validationotp',userController.loadOTPPage)
router.post("/forgotpassword",userController.sendOTP);
router.post('/validationotp',userController.verifyOTP);
router.post("/resend-forgot-otp",userController.resendForgotOtp);
router.get("/resetpassword",userController.loadResetPassword);
router.post("/reset-password",userController.resetPassword);
router.get('/error', (req, res) => {
  res.status(500).render('user/error', {message: "Something went wrong!"});
});
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
  res.redirect('/')
});
module.exports = router;
