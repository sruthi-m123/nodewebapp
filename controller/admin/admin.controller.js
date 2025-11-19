



import { findAdminByEmail,verifyPassword } from "../../service/admin/admin.service.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import {MESSAGES} from "../../utils/messages.js";
import logger from "../../utils/logger.js";

 export const page_error = async (req, res) => {
  logger.error("Admin error page triggered")
  res.status(STATUS_CODES.INTERNAL_ERROR).render("admin/admin-error",{layout:false});
};

export const loadAdminLogin = (req, res) => {
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
 export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin=await findAdminByEmail(email);
    if (admin) {
      const passwordMatch=await verifyPassword(password,admin.password);
      if (passwordMatch) {
        req.session.admin = {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        };
logger.info(MESSAGES.ADMIN.LOGIN_SUCCESS);
        return res.redirect("/admin/dashboard");
      } else {
         logger.warn(MESSAGES.ADMIN.INVALID_PASSWORD)
        return res.redirect("/admin/login");
      }
    } else {
 req.flash("error", MESSAGES.ADMIN.INVALID_EMAIL);
      logger.warn(MESSAGES.ADMIN.INVALID_EMAIL);
            return res.redirect("/admin/login");
    }
  } catch (error) {
     req.flash("error", "Something went wrong");
     logger.error(`Admin login error:${error.message}`)
    return res.redirect("/page_error");
  }
};

export const loadDashboard = async (req, res) => {
  if (req.session.admin) {
    try {
      res.render("admin/dashboard", {layout:false, pageCSS: "/css/admin/dashboard.css" });
    } catch (error) {
      logger.error(`${MESSAGES.ADMIN.DASHBOARD_ERROR}:${error.message}`)
      res.redirect("/pageNotFound");
    }
  } else {
    return res.redirect("/admin/login");
  }
};


export const logout=async(req,res)=>{
  try {
    if(req.session.admin){
      delete req.session.admin;
      logger.info("admin session cleared successfully");
    }else{
      logger.warn("logout attempted without active session");
    }
    res.redirect("/admin/login");
  } catch (error) {
   console.log("unexpected error during admin logout:",error);
   res.redirect("/admin/page_error"); 
  }
}




