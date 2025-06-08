const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds=10;
const newPassword="admin@123";

bcrypt.hash(newPassword, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log(hash); 
});

const pageerror=async(req,res)=>{
  res.render("admin/admin-error")
}

const loadAdminLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }else{
  res.render("admin/login", { pageCSS: "login.css" });
  }
};
const login = async (req, res) => {
  try{
const {email,password}=req.body;
const admin=await User.findOne({email,isAdmin:true});
if(admin){
    const passwordMatch= await bcrypt.compare(password,admin.password);
if(passwordMatch){
    req.session.admin=true;
    return res.redirect("/admin/dashboard")
}else{
    return res.redirect("/login");
}
}else{
    return res.redirect("/login")
}
  }catch(error){
console.log("login error",error);
return res.redirect("/pageerror")
  }
}

const loadDashboard=async(req,res)=>{
    if(req.session.admin){
        try {
          res.render("admin/dashboard",{pageCSS: "/css/admin/dashboard.css" })  
        } catch (error) {
            res.redirect("/pageNotFound");
        }
    }else{
        return res.redirect("/admin/login");
            }
}

const logout=async(req,res)=>{
  try {
    req.session.destroy(err=>{
      if(err){
        console.log("error destroying session",err);
        return res.redirect("/pageerror")
      }
      res.redirect("/admin/login")
    })
  } catch (error) {
    console.log("unexpected error during logout",error);
    res.redirect("/pageerror")
  }
}

module.exports = {
  loadAdminLogin,
  login,
  loadDashboard,
  pageerror,
  logout
};
