import express from 'express';

import * as adminController from '../controller/admin/admin.controller.js';
import * as categoryController from '../controller/admin/category.controller.js';
import * as customerController from '../controller/admin/customer.controller.js';
import * as productController from '../controller/admin/product.controller.js';
import * as orderController from '../controller/admin/order.controller.js';
import * as offerController from '../controller/admin/offer.controller.js';
import * as couponController from '../controller/admin/coupon.controller.js';
import * as dashboardController from '../controller/admin/dashboard.controller.js';

import { upload, handleMulterError } from '../config/multer.js';
import { adminAuth } from '../middlewares/auth.js';

const router = express.Router();

router.use((req, res, next) => {
  res.locals.layout = false;
  next();
});


router.get('/page_error', adminController.page_error);
router.get('/login', adminController.loadAdminLogin);
router.post('/login', adminController.login);
router.get('/', adminAuth, adminController.loadDashboard);
router.get('/dashboard', adminAuth, adminController.loadDashboard);
router.get('/logout', adminController.logout);

//dashboard
router.get('/api/stats', adminAuth, dashboardController.getDashboardStats);
router.get('/api/top-products', adminAuth, dashboardController.getTopProducts);
router.get('/api/sales-data', adminAuth, dashboardController.getSalesData);
router.post('/api/generate-pdf-report', adminAuth, dashboardController.generatePDFReport);
router.get('/api/sales-report', adminAuth, dashboardController.getSalesReport);
router.get('/api/export-sales-report', adminAuth, dashboardController.exportSalesReport);

//user managment
router.get('/users', adminAuth, customerController.customerInfo);
router.post('/toggle_block', adminAuth, customerController.toggleBlockStatus);


//category managment
router.get('/categories', adminAuth, categoryController.getAllCategories);
router.post('/addCategory', upload.category, handleMulterError, categoryController.addCategory);
router.delete('/categories/:id/delete', adminAuth, categoryController.deleteCategory);
router.put('/categories/status/:categoryId', adminAuth, categoryController.updateCategoryStatus);
router.put('/categories/:id/update', adminAuth, upload.category, handleMulterError, categoryController.updateCategory);
router.get('/categories/:id/details', adminAuth, categoryController.getCategory);


//product managment
router.get('/products', adminAuth, productController.renderProducts);
router.post('/addProducts', adminAuth, upload.products, productController.addProduct);
router.put('/products/:id', adminAuth, upload.products, productController.updateProduct);
router.put('/products/status/:productId', adminAuth, productController.updateProductStatus);
router.delete('/products/:id', adminAuth, productController.deleteProduct);
router.get('/products/:id/details', adminAuth, productController.getProductDetails);

//order managment
router.get('/orders', adminAuth, orderController.getOrderAdmin);
router.get('/order-details', adminAuth, orderController.getOrder);
router.post('/orders/:orderId/status', adminAuth, orderController.updateOrderStatus);
router.post('/orders/:orderId/verify-return', adminAuth, orderController.verifyReturnedRequest);
router.get('/orders/:orderId/verify-return', adminAuth, orderController.getReturnDetails);
router.get('/orders/:orderId/view', adminAuth, orderController.getOrderDetails);

//offer managment
router.get('/offers', adminAuth, offerController.getOfferPage);
router.post('/offers/add-offer', adminAuth, offerController.createOffer);
router.delete('/offers/delete-offer/:offerId', adminAuth, offerController.deleteOffer);
router.get('/offers/get-offer/:id', adminAuth, offerController.getEditOffer);
router.put('/offers/update-offer/:id', adminAuth, offerController.updateOffer);

//coupon managment
router.get('/coupons', adminAuth, couponController.getCouponPage);
router.post('/coupons/add-coupon', adminAuth, couponController.createCoupon);
router.get('/coupons/:id', adminAuth, couponController.getCouponById);
router.put('/coupons/edit-coupon/:id', adminAuth, couponController.updateCoupon);
router.delete('/coupons/delete-coupon/:id', adminAuth, couponController.deleteCoupon);

export default router;
