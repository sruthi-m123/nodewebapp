const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const passport =require("passport");
const { ifAuthenticated ,redirectIfLoggedIn,isLoggedIn,isNotLoggedIn} = require("../middlewares/auth");
const {singleUpload, multiUpload}=require('../config/multer')


router.get("/", userController.loadHomepage);
router.get("/signup", redirectIfLoggedIn,userController.loadSignup);
router.get("/shop", userController.loadShopping);
router.get("/pageNotFound", userController.pageNotFound);
router.post("/signup", userController.signup);
router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/login",ifAuthenticated, userController.loadLogin);
router.post("/login",userController.login);
router.get("/generateotp", userController.loadGenerateotp);
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
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
//logout
router.post('/logout',userController.logout);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  userController.googleAuthSuccess  
);
//profile page
router.get('/profile', isLoggedIn, userController.getProfile);
// //category page
// router.get('/categoryProducts/:id',userController.shopAllByCategory)
//shopall
router.get("/shopAll",userController.loadShopping);
router.post('/shopall/filter',userController.applyFilters);
router.get('/shopall/category/:id', userController.getProductsByCategory);
//product detail page 
router.get('/product/:id',userController.productDetail)
module.exports = router;
