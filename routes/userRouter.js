import express from "express";
const router = express.Router();

import userController from "../controller/user/userController.js";
import passport from "passport";

import {
  isLoggedIn,

} from "../middlewares/auth.js";

import { checkBlocked } from "../middlewares/checkBlocked.js";

import {
 
  upload
} from "../config/multer.js";

import * as  profileController from "../controller/user/profileController.js";
import * as shopController from "../controller/user/shopController.js";
import * as productController from "../controller/user/productController.js";
import * as addressController from "../controller/user/address.controller.js";
import * as  cartController from "../controller/user/cartController.js";
import * as checkoutController from "../controller/user/checkoutController.js";
import * as orderController from "../controller/user/orderController.js";
import * as orderdetailController from "../controller/user/orderDetailController.js";
import * as wishlistController from "../controller/user/wishlistController.js";
import * as walletController from "../controller/user/walletController.js";
import * as couponController from "../controller/user/couponController.js";
import * as razorpayController from "../controller/user/razorpayController.js";



router.get("/home", userController.loadHomepage);
router.get("/signup", redirectIfLoggedIn, userController.loadSignup);
router.get("/shop", shopController.loadShopping);
router.get("/pageNotFound", userController.pageNotFound);

router.post("/signup", userController.signup);
router.post("/send-otp", userController.sendOtp);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

router.get("/login", userController.loadLogin);
router.post("/login", userController.login);

router.get("/generateotp", userController.loadGenerateotp);
router.get("/forgotpassword", userController.loadForgotPassword);
router.get("/validationotp", userController.loadOTPPage);

router.post("/forgotpassword", userController.sendOTP);
router.post("/validationotp", userController.verifyOTP);
router.post("/resend-forgot-otp", userController.resendForgotOtp);

router.get("/resetpassword", userController.loadResetPassword);
router.post("/reset-password", userController.resetPassword);


// Error Page
router.get("/error", (req, res) => {
  const message = req.query.msg || "Something went wrong!";
  res.status(500).render("user/error", { message });
});


//google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login?error=google_failed",
  }),
  (req, res) => {
    req.session.user = {
      id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || null,
      googleId: req.user.googleId || null,
    };

    req.session.save((err) => {
      if (err) console.error("Session save error:", err);
      res.redirect("/user/home");
    });
  }
);

router.post("/logout", userController.logout);


//profile
router.get("/profile", isLoggedIn, checkBlocked, profileController.getProfile);
router.get("/profile/edit", checkBlocked, profileController.getEditProfile);
router.post("/profile/update", checkBlocked, upload.avatar, profileController.updateProfile);

router.post("/request-email-change", checkBlocked, profileController.requestEmailChangeOTP);
router.post("/change-password", checkBlocked, profileController.changePassword);
router.post("/verify-email-change", checkBlocked, profileController.verifyEmailChange);


//shopall and product
router.get("/shopAll", shopController.loadShopping);
router.post("/shopall/filter", shopController.applyFilters);
router.get("/shopall/category/:id", shopController.getProductsByCategory);

router.get("/product/:id", productController.productDetail);


//address
router.get("/address", isLoggedIn, addressController.getAddressPage);
router.post("/addresses/add", addressController.addAddress);
router.put("/addresses/edit/:id", addressController.updateAddress);
router.delete("/addresses/delete/:id", addressController.deleteAddress);
router.post("/set-default-address/:id", addressController.setDefaultAddress);


//cart 
router.get("/cart", isLoggedIn, checkBlocked, cartController.getCart);
router.post("/cart/add/:productId", cartController.addToCart);
router.delete("/cart/remove/:itemId", checkBlocked, cartController.removeCartItem);
router.post("/cart/update", checkBlocked, cartController.updateCart);
router.get("/cart/validate-cart", cartController.validateCart);
router.post("/cart/remove-invalid", cartController.removeInvalidCartItems);

router.get("/cart/count", cartController.cartCount);


//checkout
router.get("/checkout", isLoggedIn, checkBlocked, checkoutController.getCheckoutPage);
router.get("/retry-checkout/:orderId", isLoggedIn, checkBlocked, checkoutController.getRetryCheckoutPage);

router.post("/buy-now", checkBlocked, checkoutController.buyNow);
router.post("/api/addresses", checkoutController.addAddress);

router.get("/api/addresses/:id", checkoutController.getAddress);

// Coupon
router.post("/checkout/apply-coupon", checkBlocked, couponController.applyCoupon);
router.post("/checkout/apply-coupon-by-code", checkBlocked, couponController.applyCouponByCode);
router.post("/checkout/remove-coupon", checkBlocked, couponController.removeCoupon);

// Offers
router.post("/api/offers/apply", checkBlocked, checkoutController.applyOffer);

// Orders
router.post("/orders-placed", checkBlocked, checkoutController.placeOrder);


//razorpay
// router.post("/createOrder", razorpayController.createOrder);
router.post("/verifyPayment", checkBlocked, razorpayController.verifyPayment);
router.post("/mark-payment-failed", checkBlocked, razorpayController.markPaymentFailed);


//order
router.get("/order-success/:orderId", checkBlocked, checkoutController.successPage);
router.get("/order-failure/:orderId", checkoutController.failurePage);

router.get("/orders", isLoggedIn, checkBlocked, orderController.getOrderHistory);
router.get("/orders-details/:orderId", isLoggedIn, checkBlocked, orderdetailController.getOrderDetails);

router.post("/orders/:orderId/return", orderdetailController.returnOrder);
router.get("/orders/:orderId/invoice", orderdetailController.invoice);
router.post("/orders/:orderId/cancel", orderdetailController.cancelOrder);

//wishlist
router.get("/wishlist", isLoggedIn, checkBlocked, wishlistController.getWishlistPage);
router.post("/wishlist/add/:productId", isLoggedIn, wishlistController.addToWishlist);
router.post("/wishlist/add-to-cart/:itemId", isLoggedIn, wishlistController.addToCartFromWishlist);
router.delete("/wishlist/remove/:itemId", isLoggedIn, wishlistController.removeFromWishlist);


//wallet 
router.get("/wallet", checkBlocked, walletController.getWallet);
router.post("/add-funds", checkBlocked, walletController.addFunds);


export default router;
