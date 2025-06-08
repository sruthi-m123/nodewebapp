const express=require('express');
const router= express.Router();
const adminController=require("../controller/admin/adminController");
const passport =require("passport");
const customerController=require("../controller/admin/customerController")
const {userAuth,adminAuth}=require("../middlewares/auth");

router.get('/pageerror',adminController.pageerror);
router.get('/login',adminController.loadAdminLogin);
router.post('/login',adminController.login);
router.get('/dashboard',adminAuth,adminController.loadDashboard);
router.get("/logout",adminController.logout);
//User or customer managment
router.get("/users",adminAuth,customerController.customerInfo);

module.exports=router;