import express from "express";
import passport from "passport";
import Joi from "joi";

// Import all controllers
import * as userController from "../controller/user/userController.js";
import * as profileController from "../controller/user/profileController.js";
import * as shopController from "../controller/user/shopController.js";
import * as productController from "../controller/user/productController.js";
import * as addressController from "../controller/user/address.controller.js";
import * as cartController from "../controller/user/cartController.js";
import * as checkoutController from "../controller/user/checkoutController.js";
import * as orderController from "../controller/user/orderController.js";
import * as orderdetailController from "../controller/user/orderDetailController.js";
import * as wishlistController from "../controller/user/wishlistController.js";
import * as walletController from "../controller/user/walletController.js";
import * as couponController from "../controller/user/couponController.js";
import * as razorpayController from "../controller/user/razorpayController.js";
import * as aboutusController from "../controller/user/aboutUs.controller.js";
import * as contactUsController from "../controller/user/contactUs.controller.js";

import { isLoggedIn, checkBlocked } from "../middlewares/auth.js";
import { upload } from "../config/multer.js";
import { validate } from "../middlewares/validate.js";
import * as V from "../validators/index.js";

const router = express.Router();

router.get("/home", userController.loadHomepage);
router.get("/signup", userController.loadSignup);
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

router.get("/error", (req, res) => {
  const message = req.query.msg || "Something went wrong!";
  res.status(500).render("user/error", { message });
});

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/user/login?error=google_failed",
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

// Profile routes
router.get("/profile", isLoggedIn, checkBlocked, profileController.getProfile);
router.get("/profile/edit", checkBlocked, profileController.getEditProfile);
router.post("/profile/update", checkBlocked, upload.avatar, validate(V.updateProfileSchema), profileController.updateProfile);
router.post("/request-email-change", checkBlocked, validate(V.emailChangeSchema), profileController.requestEmailChangeOTP);
router.post("/change-password", checkBlocked, validate(V.changePasswordSchema), profileController.changePassword);
router.post("/verify-email-change", checkBlocked, validate(V.verifyOtpSchema), profileController.verifyEmailChange);

// Shop all and product
router.get("/shopAll", shopController.loadShopping);
router.post("/shopall/filter", shopController.applyFilters);
router.get("/shopall/category/:id", shopController.getProductsByCategory);
router.get("/product/:id", isLoggedIn, checkBlocked, productController.productDetail);

// Address routes
router.get("/address", isLoggedIn, addressController.getAddressPage);
router.post("/addresses/add", isLoggedIn, validate({ body: V.addressSchema }), addressController.addAddress);
router.put("/addresses/edit/:id", isLoggedIn, validate({ body: V.addressSchema, params: Joi.object({ id: V.objectIdSchema.required() }) }), addressController.updateAddress);
router.delete("/addresses/delete/:id", isLoggedIn, validate({ params: Joi.object({ id: V.objectIdSchema.required() }) }), addressController.deleteAddress);
router.post("/set-default-address/:id", isLoggedIn, validate({ params: Joi.object({ id: V.objectIdSchema.required() }) }), addressController.setDefaultAddress);

// Cart routes
router.get("/cart", isLoggedIn, checkBlocked, cartController.getCart);
router.post("/cart/add/:productId", cartController.addToCart);
router.delete("/cart/remove/:itemId", checkBlocked, cartController.removeCartItem);
router.post("/cart/update", checkBlocked, cartController.updateCart);
router.get("/cart/validate-cart", cartController.validateCart);
router.post("/cart/remove-invalid", cartController.removeInvalidCartItems);
router.get("/cart/count", cartController.cartCount);

// Checkout routes
router.get("/checkout", isLoggedIn, checkBlocked, checkoutController.getCheckoutPage);
router.get("/retry-checkout/:orderId", isLoggedIn, checkBlocked, checkoutController.getRetryCheckoutPage);
router.post("/buy-now", checkBlocked, validate({ body: V.buyNowSchema }), checkoutController.buyNow);
router.post("/api/addresses", isLoggedIn, checkBlocked, validate({ body: V.addAddressSchema }), checkoutController.addAddress);
router.get("/api/addresses/:id", isLoggedIn, checkBlocked, validate({ params: Joi.object({ id: V.objectIdSchema.required() }) }), checkoutController.getAddress);

// Coupon routes
router.post(
  "/checkout/apply-coupon",
  isLoggedIn,
  checkBlocked,
  validate(V.applyCouponSchema),
  couponController.applyCoupon
);
router.post("/checkout/apply-coupon-by-code", isLoggedIn, checkBlocked, validate(V.validateCouponSchema), couponController.applyCouponByCode);
router.post("/checkout/remove-coupon", isLoggedIn, checkBlocked, couponController.removeCoupon);

// Offers routes
router.post("/api/offers/apply", checkBlocked, validate({ body: V.applyOfferSchema }), checkoutController.applyOffer);

// Orders routes
router.post("/orders-placed", checkBlocked, validate({ body: V.placeOrderSchema }), checkoutController.placeOrder);

// Razorpay routes
router.post("/createOrder", validate(V.createOrderSchema), razorpayController.createOrder);
router.post("/verifyPayment", checkBlocked, validate(V.verifyPaymentSchema), razorpayController.verifyPayment);
router.post("/mark-payment-failed", checkBlocked, validate(V.markPaymentFailedSchema), razorpayController.markPaymentFailed);

// Order success/failure
router.get("/order-success/:orderId", checkBlocked, validate(V.getOrderDetailsSchema), checkoutController.successPage);
router.get("/order-failure/:orderId", validate(V.getOrderDetailsSchema), checkoutController.failurePage);

// Order history and details
router.get("/orders", isLoggedIn, checkBlocked, orderController.getOrderHistory);
router.get("/orders-details/:orderId", isLoggedIn, checkBlocked, validate(V.getOrderDetailsSchema), orderdetailController.getOrderDetails);
router.post("/orders/:orderId/return", isLoggedIn, checkBlocked, validate(V.returnOrderSchema), orderdetailController.returnOrder);
router.get("/orders/:orderId/invoice", validate(V.getOrderDetailsSchema), orderdetailController.invoice);
router.post("/orders/:orderId/cancel", isLoggedIn, checkBlocked, validate(V.cancelOrderSchema), orderdetailController.cancelOrder);
router.get("/orders/:orderId/credit-note", orderdetailController.creditNote);
// Wishlist routes
router.get("/wishlist", isLoggedIn, checkBlocked, wishlistController.getWishlistPage);
router.post("/wishlist/add/:productId", isLoggedIn, validate(V.addToWishlistSchema, "params"), wishlistController.addToWishlist);
router.post("/wishlist/add-to-cart/:itemId", isLoggedIn, validate(V.addToCartFromWishlistSchema, "params"), wishlistController.addToCartFromWishlist);
router.delete("/wishlist/remove/:itemId", isLoggedIn, validate(V.removeWishlistSchema), wishlistController.removeFromWishlist);
router.get("/status/:productId", validate(V.objectIdSchema), wishlistController.checkWishlistStatus);
router.delete(
  "/wishlist/remove-product/:productId",
  isLoggedIn,
  wishlistController.removeProductFromWishlist
);
// Wallet routes

router.get("/wallet", isLoggedIn, checkBlocked, walletController.getWallet);
router.post("/wallet/create-order", checkBlocked, walletController.createWalletOrder);
router.post("/wallet/verify-payment", checkBlocked, walletController.verifyWalletPayment);

//About Us
router.get("/aboutUs", checkBlocked, aboutusController.getAboutUsPage);
//Contact Us
router.get("/contactUs", checkBlocked, contactUsController.getContactUsPage);
router.post("/contact", contactUsController.sendMessage);

export default router;