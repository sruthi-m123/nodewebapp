const express = require('express');
const router = express.Router();
const adminController = require("../controller/admin/adminController");
const catController = require("../controller/admin/catController")
const customerController = require("../controller/admin/customerController")
const productController = require('../controller/admin/productController');
const { upload, singleUpload, multiUpload } = require('../config/multer');
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

// category Management
router.get('/categories', adminAuth, catController.getAllCategories);
router.post('/addCategory', adminAuth,singleUpload, catController.addCategory);
router.get('/categories/:id', adminAuth, catController.getCategory);
router.post('/categories/status/:categoryId', adminAuth, catController.updateCategoryStatus);
router.post('/categories/:id/update', adminAuth, singleUpload, catController.updateCategory);
router.post('/categories/delete', adminAuth, catController.deleteCategory);

//product routes
router.get('/products', adminAuth, productController.renderProducts);
// router.get('/products/add', adminAuth, productController.renderForm);
router.post('/products',adminAuth,upload.products,productController.addProduct)
// router.get('/products/:id', adminAuth, productController.renderEditForm);
router.put('/products/:id', adminAuth, upload.products, productController.updateProduct);
router.put('/products/status/:productId',adminAuth,productController.updateProductStatus)
router.delete('/products/:id', adminAuth, productController.deleteProduct);
router.get('/products/:id/details', adminAuth,productController.getProductDetails);

module.exports = router;