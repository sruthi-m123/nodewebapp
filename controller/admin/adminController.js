const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Product = require("../../models/productSchema");
const saltRounds = 10;
const newPassword = "admin@123";

bcrypt.hash(newPassword, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log(hash);
});

const page_error = async (req, res) => {
  res.render("admin/admin-error",{layout:false});
};

const loadAdminLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  } else {
    const error=req.flash("error");

    res.render("admin/login", { 
      layout:false,
      error:error.length>0?error[0]:null,
      pageCSS: "login.css"
        });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, isAdmin: true });
    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (passwordMatch) {
        req.session.admin = true;
        req.session.admin = {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        };

        // console.log('Session after login:', req.session); // ✅ Debug
        return res.redirect("/admin/dashboard");
      } else {
         req.flash("error", "Invalid password");
        return res.redirect("/admin/login");
      }
    } else {
      req.flash("error", "Invalid email or not an admin");
      return res.redirect("/admin/login");
    }
  } catch (error) {
     req.flash("error", "Something went wrong");
    console.log("login error", error);
    return res.redirect("/page_error");
  }
};

const loadDashboard = async (req, res) => {
  if (req.session.admin) {
    try {
      res.render("admin/dashboard", {layout:false, pageCSS: "/css/admin/dashboard.css" });
    } catch (error) {
      res.redirect("/pageNotFound");
    }
  } else {
    return res.redirect("/admin/login");
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("error destroying session", err);
        return res.redirect("/page_error");
      }
      res.redirect("/admin/login");
    });
  } catch (error) {
    console.log("unexpected error during logout", error);
    res.redirect("/page_error");
  }
};


module.exports = {
  loadAdminLogin,
  login,
  loadDashboard,
  page_error,
  logout,
};
