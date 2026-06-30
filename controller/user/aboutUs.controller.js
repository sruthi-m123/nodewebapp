import { STATUS_CODES } from "../../utils/statusCodes.js";
import ShopService from "../../service/user/shop.service.js";

export const getAboutUsPage = async (req, res) => {
  const userId = req.session.user?.id;
  const userData = userId ? await ShopService.getUserData(userId) : null;

  return res.render('user/aboutUs', {
    pageCSS: "user/aboutUs.css",
    pageTitle: 'About Us - Chettinad Sarees',
    user: userData,
    
  });
};

export const getContactUsPage = async (req, res) => {
  const userId = req.session.user?.id;
  const userData = userId ? await ShopService.getUserData(userId) : null;
  const wishlistCount = userId ? await ShopService.getUserWishlistCount(userId) : 0;
  const cartCount = userId ? await ShopService.getUserCartCount(userId) : 0;

  return res.render('user/contactUs', {
    pageCSS: "user/aboutUs.css",
    pageTitle: 'Contact Us - Chettinad Sarees',
    user: userData,
    wishlistCount,
    cartCount,
  });
};