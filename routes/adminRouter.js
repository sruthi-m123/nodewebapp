const express=require('express');
const router= express.Router();
const adminController=require("../controller/admin/adminController");
const catController=require("../controller/admin/catController")
const customerController=require("../controller/admin/customerController")
const productController = require('../controller/admin/productController');
const {upload, singleUpload,multiUpload}=require('../config/multer');
const {adminAuth}=require("../middlewares/auth");


router.get('/page_error',adminController.page_error);
router.get('/login',adminController.loadAdminLogin);
router.post('/login',adminController.login);
router.get('/', adminAuth, adminController.loadDashboard);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get("/logout",adminController.logout);
//User or customer managment
router.get("/users",adminAuth,customerController.customerInfo);
router.post("/toggle_block",adminAuth,customerController.toggleBlockStatus);
// category Managment
router.get('/categories', adminAuth,catController.getAllCategories);
router.post('/addCategory', adminAuth, singleUpload, catController.addCategory);
//id based routes
// router.get('/categories/:id/details', adminAuth, catController.getCategoryDetails);
router.put('/categories/:id/status', adminAuth, catController.updateCategoryStatus);
router.post('/categories/:id/update', adminAuth, singleUpload, catController.updateCategory);
router.delete('/categories/:id', adminAuth, catController.deleteCategory);
router.get('/categories/:id', adminAuth, catController.getCategory);
//product routes
router.get('/products', adminAuth, productController.renderProducts);
router.get('/products/add', adminAuth, productController.renderForm);
router.post('/products/add', adminAuth, multiUpload, productController.addProduct);
router.get('/products/edit/:id', adminAuth, productController.renderEditForm);
router.post('/products/edit/:id', adminAuth,multiUpload, productController.updateProduct);
router.delete('/products/:id', adminAuth, productController.deleteProduct);


module.exports=router;