const express = require('express');
const router = express.Router();
const adminController = require("../controller/admin/adminController");
const catController = require("../controller/admin/catController")
const customerController = require("../controller/admin/customerController")
const productController = require('../controller/admin/productController');
const orderController=require('../controller/admin/orderController');
const offerController=require('../controller/admin/offerController');
const couponController=require('../controller/admin/couponController');
const { upload, singleUpload, multiUpload,handleMulterError } = require('../config/multer');
const { adminAuth } = require("../middlewares/auth");

// Disable layout for all admin views
router.use((req, res, next) => {
  res.locals.layout = false;
  next();
});


router.get('/page_error', adminController.page_error);
router.get('/login', adminController.loadAdminLogin);
router.post('/login', adminController.login);
router.get('/', adminAuth, adminController.loadDashboard);
router.get('/dashboard', adminAuth, adminController.loadDashboard);
router.get("/logout", adminController.logout);

//User or customer management
router.get("/users", adminAuth, customerController.customerInfo);
router.post("/toggle_block", adminAuth, customerController.toggleBlockStatus);
//category managment
router.get('/categories', adminAuth, catController.getAllCategories);
router.post('/addCategory', upload.category, handleMulterError,catController.addCategory);
router.delete('/categories/:id/delete', adminAuth, catController.deleteCategory);
router.put('/categories/status/:categoryId', adminAuth, catController.updateCategoryStatus);
router.put('/categories/:id/update', adminAuth,  upload.category, handleMulterError, catController.updateCategory);
router.get('/categories/:id/details', adminAuth, catController.getCategory); // keep this last

//product routes
router.get('/products', adminAuth, productController.renderProducts);
router.post('/addProducts',adminAuth,upload.products,productController.addProduct)
router.put('/products/:id', adminAuth, upload.products, productController.updateProduct);
router.put('/products/status/:productId',adminAuth,productController.updateProductStatus)
router.delete('/products/:id', adminAuth, productController.deleteProduct);
router.get('/products/:id/details', adminAuth,productController.getProductDetails);
// order managment routes
router.get('/orders',adminAuth,orderController.getOrderAdmin);
router.get('order-details',orderController.getOrder);
router.post('/orders/:orderId/status',orderController.updateOrderStatus)
router.post('/orders/:orderId/verify-return',orderController.verifyReturnedRequest);
router.get('/orders/:orderId/verify-return',orderController.getReturnDetails);
router.get('/orders/:orderId/view',orderController.getOrderDetails);

//offer managment
router.get('/offers',offerController.getOfferPage);
router.post('/offers/add-offer',offerController.createOffer);
router.delete('/offers/delete-offer/:offerId',offerController.deleteOffer)
router.get('/offers/get-offer/:id',offerController.getEditOffer);
router.put('/offers/update-offer/:id',offerController.updateOffer);

//coupon managment

router.get('/coupons',couponController.getCouponPage);
router.post('/coupons/add-coupon',couponController.createCoupon);
router.get('/coupons/:id',couponController.getCouponById);
router.put('/coupons/edit-coupon/:id',couponController.updateCoupon);
router.delete('/coupons/delete-coupon/:id',couponController.deleteCoupon);

module.exports = router;