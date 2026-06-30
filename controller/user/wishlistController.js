import { WishlistService } from "../../service/user/wishlist.service.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import {MESSAGES} from "../../utils/messages.js";


export const getWishlistPage=async(req,res)=>{
  const userId=req.session.user.id;
  const {user,items}=await WishlistService.getWishlistPageData(userId);
  console.log("items in the wishlist",items);
  res.render("user/wishlist",{
    pageCSS: "user/wishlist.css",
    pageJS: "user/wishlist.js",
    wishlistItems: items,
    user,
    itemCount: items.length,
    message: items.length === 0
      ? MESSAGES.WISHLIST.EMPTY
      : null
  
  })
};

export const addToWishlist = async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) {
    return res.status(STATUS_CODES.UNAUTHORIZED).json({ success: false, message: "Please login to continue" });
  }
  const { productId } = req.params;

  try {
    const count = await WishlistService.addToWishlist(userId, productId);
    res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.WISHLIST.ADD_SUCCESS,
      wishlistCount: count
    });
  } catch (err) {
    const statusCode = err.status || err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
    res.status(statusCode).json({ success: false, message: err.message || 'Failed to add to wishlist' });
  }
};


export const removeFromWishlist = async (req, res) => {
  const userId = req.session.user.id;
  const { itemId } = req.params;

  try {
    const count = await WishlistService.removeFromWishlist(userId, itemId);
    res.json({
      success: true,
      message: MESSAGES.WISHLIST.REMOVE_SUCCESS,
      wishlistCount: count
    });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({ success: false, message: err.message || 'Failed to remove from wishlist' });
  }
};
export const removeProductFromWishlist = async (req, res) => {
  const userId = req.session.user.id;
  const { productId } = req.params;

  try {
    const count = await WishlistService.removeProductFromWishlist(userId, productId);
    res.json({
      success: true,
      message: "Removed from wishlist",
      wishlistCount: count
    });
  } catch (err) {
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({ success: false, message: err.message || 'Failed to remove from wishlist' });
  }
};

export const addToCartFromWishlist = async (req, res) => {
  const userId = req.session.user.id;
  const { itemId } = req.params;

  const result =
    await WishlistService.addToCartFromWishlist(userId, itemId);

  res.json({
    success: true,
    message: MESSAGES.WISHLIST.MOVED_TO_CART,
    ...result
  });
};


export const checkWishlistStatus = async (req, res) => {
  const userId = req.session.user.id;
  const { productId } = req.params;

  const inWishlist =
    await WishlistService.checkWishlistStatus(userId, productId);

  res.json({ inWishlist });
};
