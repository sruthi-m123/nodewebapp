import { WishlistService } from "../../service/user/wishlist.service.js";
import { STATUS_CODES } from "../../utils/statusCodes.js";
import {MESSAGES} from "../../utils/messages.js";


export const getWishlistPage=async(req,res)=>{
  const userId=req.session.user.id;
  const {user,items}=await WishlistService.getWishlistPageData(userId);
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

export const addToWishlist=async (req,res)=>{
  const userId=req.session.user.id;
  const {productId}=req.params;

  const count=
  await WishlistService.addToWishlist(userId,productId);
  res.status(STATUS_CODES.CREATED).json({
    success:true,
    message:MESSAGES.WISHLIST.ADD_SUCCESS,
    wishlistCount:count
  })
}


export const removeFromWishlist= async(req,res)=>{
  const userId=req.session.user.id;
  const {itemId}=req.params;

  const count=
  await WishlistService.removeFromWishlist(userId,itemId);

  res.json({
    success:true,
    message:MESSAGES.WISHLIST.REMOVE_SUCCESS,
    wishlistCount:count
  })
}

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
