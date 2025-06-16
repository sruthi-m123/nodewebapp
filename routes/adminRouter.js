const express=require('express');
const router= express.Router();
const adminController=require("../controller/admin/adminController");
const catController=require("../controller/admin/catController")
const customerController=require("../controller/admin/customerController")
const upload=require('../config/multer');
const {adminAuth}=require("../middlewares/auth");

// const {
// getAllCategories,
//     getCategory,
//    addCategory,
//     updateCategoryStatus,
//     updateCategory,
//     deleteCategory,
//     exportCategories,
//     getCategoryDetails
// } = require('../controller/admin/catController');

// // Debug: Log the imported functions
// console.log('Imported functions:', {
//   getAllCategories,
//     getCategory,
//    addCategory,
//     updateCategoryStatus,
//     updateCategory,
//     deleteCategory,
//     exportCategories,
//     getCategoryDetails
// });

router.get('/page_error',adminController.page_error);
router.get('/login',adminController.loadAdminLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get("/logout",adminController.logout);
//User or customer managment
router.get("/users",adminAuth,customerController.customerInfo);
router.post("/toggle_block",adminAuth,customerController.toggleBlockStatus);
// category Managment
router.get('/categories', adminAuth,catController.getAllCategories);
router.post('/addCategory', adminAuth, upload.single('image'), catController.addCategory);
//id based routes
// router.get('/categories/:id/details', adminAuth, catController.getCategoryDetails);
router.put('/categories/:id/status', adminAuth, catController.updateCategoryStatus);
router.post('/categories/:id/update', adminAuth, upload.single('image'), catController.updateCategory);
router.delete('/categories/:id', adminAuth, catController.deleteCategory);
router.get('/categories/:id', adminAuth, catController.getCategory);


module.exports=router;