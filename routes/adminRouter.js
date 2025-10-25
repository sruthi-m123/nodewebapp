
import express from 'express';

import adminController from "../controller/admin/adminController.js";
import catController from "../controller/admin/catController.js";
import customerController from "../controller/admin/customerController.js";
import productController from '../controller/admin/productController.js';
import orderController from '../controller/admin/orderController.js';
import offerController from '../controller/admin/offerController.js';
import couponController from '../controller/admin/couponController.js';
import dashboardController from '../controller/admin/dashboardController.js';

import { upload, singleUpload, multiUpload, handleMulterError } from '../config/multer.js';
import { adminAuth } from "../middlewares/auth.js";

const router=express.Router();

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

// Dashboard API routes
router.get('/api/stats', adminAuth, dashboardController.getDashboardStats);
router.get('/api/top-products', adminAuth, dashboardController.getTopProducts);
router.get('/api/sales-data', adminAuth, dashboardController.getSalesData);
router.post('/api/generate-pdf-report', adminAuth, dashboardController.generatePDFReport);
router.get('/api/sales-report', adminAuth, dashboardController.getSalesReport);
router.get('/api/export-sales-report', adminAuth, dashboardController.exportSalesReport);
//User or customer management
router.get("/users", adminAuth, customerController.customerInfo);
router.post("/toggle_block", adminAuth, customerController.toggleBlockStatus);
//category managment
router.get('/categories', adminAuth, catController.getAllCategories);
router.post('/addCategory', upload.category, handleMulterError, catController.addCategory);
router.delete('/categories/:id/delete', adminAuth, catController.deleteCategory);
router.put('/categories/status/:categoryId', adminAuth, catController.updateCategoryStatus);
router.put('/categories/:id/update', adminAuth, upload.category, handleMulterError, catController.updateCategory);
router.get('/categories/:id/details', adminAuth, catController.getCategory); 

//product routes
router.get('/products', adminAuth, productController.renderProducts);
router.post('/addProducts', adminAuth, upload.products, productController.addProduct)
router.put('/products/:id', adminAuth, upload.products, productController.updateProduct);
router.put('/products/status/:productId', adminAuth, productController.updateProductStatus)
router.delete('/products/:id', adminAuth, productController.deleteProduct);
router.get('/products/:id/details', adminAuth, productController.getProductDetails);
// order managment routes
router.get('/orders', adminAuth, orderController.getOrderAdmin);
router.get('/order-details', orderController.getOrder);
router.post('/orders/:orderId/status', orderController.updateOrderStatus)
router.post('/orders/:orderId/verify-return', orderController.verifyReturnedRequest);
router.get('/orders/:orderId/verify-return', orderController.getReturnDetails);
router.get('/orders/:orderId/view', orderController.getOrderDetails);


//offer managment
router.get('/offers', offerController.getOfferPage);
router.post('/offers/add-offer', offerController.createOffer);
router.delete('/offers/delete-offer/:offerId', offerController.deleteOffer)
router.get('/offers/get-offer/:id', offerController.getEditOffer);
router.put('/offers/update-offer/:id', offerController.updateOffer);

//coupon managment

router.get('/coupons', couponController.getCouponPage);
router.post('/coupons/add-coupon', couponController.createCoupon);
router.get('/coupons/:id', couponController.getCouponById);
router.put('/coupons/edit-coupon/:id', couponController.updateCoupon);
router.delete('/coupons/delete-coupon/:id', couponController.deleteCoupon);

module.exports = router;