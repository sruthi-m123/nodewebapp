const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const passport =require("passport");
const { ifAuthenticated ,redirectIfLoggedIn,isLoggedIn,isNotLoggedIn} = require("../middlewares/auth");
const {singleUpload, multiUpload,upload}=require('../config/multer');
const profileController = require("../controller/user/profileController");
const shopController=require("../controller/user/shopController");
const productController=require("../controller/user/productController")
const addressController=require("../controller/user/addressController");
const cartController=require("../controller/user/cartController")
const checkoutController=require("../controller/user/checkoutController");
const orderController=require("../controller/user/orderController")

router.get("/", userController.loadHomepage);
router.get("/signup", redirectIfLoggedIn,userController.loadSignup);
router.get("/shop", shopController.loadShopping);
router.get("/pageNotFound", userController.pageNotFound);
router.post("/signup", userController.signup);
router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
router.get("/login", userController.loadLogin);
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
  const message = req.query.msg || "Something went wrong!";
  res.status(500).render('/error', { message });
});


router.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

router.get('/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login?error=google_failed'
  }),
  (req, res) => {
req.session.user = {
      _id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || null
    };
        res.redirect('/');
  }
);
//logout
router.post('/logout',userController.logout);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  userController.googleAuthSuccess  
);
//profile page
router.get('/profile', isLoggedIn,upload.avatar, profileController.getProfile);
router.get('/profile/edit',upload.avatar,profileController.getEditProfile);
router.post('/profile/update', upload.avatar, profileController.postEditProfile);
//shopall
router.get("/shopAll",shopController.loadShopping);
router.post('/shopall/filter',shopController.applyFilters);
router.get('/shopall/category/:id', shopController.getProductsByCategory);
//product detail page 
router.get('/product/:id',productController.productDetail);
//address page
router.get('/address',isLoggedIn,addressController.getAddressPage);
router.post('/addresses/add',addressController.addAddress);
router.put('/addresses/edit/:id',addressController.updateAddress);
router.delete('/addresses/delete/:id',addressController.deleteAddress);
router.post('/set-default-address/:id',addressController.setDefaultAddress)
//cart page
router.get('/cart',cartController.getCart);
router.post('/cart/add/:productId',cartController.addToCart);
router.delete('/cart/remove/:itemId',cartController.removeCartItem);
router.post('/cart/update',cartController.updateCart);

//checkout page
router.get('/checkout',isLoggedIn, checkoutController.getCheckoutPage);
//address checkout page 
router.post('/api/addresses',checkoutController.addAddress);
router.put('/api/addresses/:id',checkoutController.updateAddress);
router.get('/api/addresses/:id',checkoutController.getAddress);

//offer checkout routes
router.post('/api/offers/apply',checkoutController.applyOffer);
//order chekout routes
router.post('/api/orders',checkoutController.placeOrder);
//success page
router.get('/order-success/:orderId',checkoutController.successPage);
//order history page
router.get('/orders',orderController.getOrderHistory);

module.exports = router;