import * as cartService from '../../service/user/cart.service.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';
import Cart from '../../models/cartSchema.js';

export const getCart=async(req,res)=>{
  logger.info('loading cart page');
  if(!req.session.user){
    logger.warn('unathorized access to cart page');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      message:MESSAGES.CART.LOGIN_REQUIRED
    });
 
  }
  const userId=req.session.user.id;
  console.log("userId",userId);
  const cart=await cartService.getCartService(userId);
  console.log("cart inside the cart controller",cart);
  
  
  const{validItems,outOfStockItems}=await cartService.processCartItemsService(cart);

  if(outOfStockItems.length>0){
    await cartService.updateCartItemService(userId,validItems);
    req.session.outOfStockItems=outOfStockItems;
    logger.info('Out of stock items handled',{outOfStockItems:outOfStockItems.length});
  }
if(req.query.error==="some items are out of stock"&& req.session.outOfStockItems){
  const total=validItems.reduce((sum,item)=>sum+item.totalPrice,0);
return res.render('user/cart', {
            cartItems: validItems,
            total: total.toFixed(2),
            pageCSS: "user/cart.css",
            pageJS: "user/cart.js",
            pageTitle: "Cart",
            error: 'Some items were adjusted due to stock limitations',
            outOfStockItems: req.session.outOfStockItems,
            showStockAlert: true
        });
}
const total = validItems.reduce((sum, item) => sum + item.totalPrice, 0);

    res.render('user/cart', {
        cartItems: validItems,
        total: total.toFixed(2),
        pageCSS: "user/cart.css",
        pageJS: "user/cart.js",
        pageTitle: "Cart",
        error: req.query.error || null,
        outOfStockItems: req.session.outOfStockItems || null,
        showStockAlert: outOfStockItems.length > 0
    });
     if (req.session.outOfStockItems) {
        delete req.session.outOfStockItems;
    }
};

export const addToCart = async (req, res) => {
  try {
    logger.info('Adding product to cart');
    if (!req.session.user) {
      logger.warn('Unauthorized cart add attempt');
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        message: MESSAGES.CART.LOGIN_REQUIRED
      });
    }

    const userId = req.session.user.id;
    const productId = req.params.productId;
    const quantity = parseInt(req.body.quantity);

    const result = await cartService.addToCartService(userId, productId, quantity);

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: MESSAGES.CART.ADD_SUCCESS,
      stock: result.stock,
      cartCount: result.cartCount
    });
  } catch (error) {
    logger.error('Error adding to cart:', error);
    res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: error.message || 'Failed to add product to cart'
    });
  }
};

export const removeCartItem=async(req,res)=>{
  logger.info('removing item form cart');

  if(!req.session.user){
    logger.warn('Unathorized cart removal attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      message:MESSAGES.CART.LOGIN_REQUIRED
    });
  }

  const userId=req.session.user.id;
  const itemId=req.params.itemId;

  const result=await cartService.removeCartItemService(userId,itemId);
  res.status(STATUS_CODES.SUCCESS).json({
    message:MESSAGES.CART.REMOVE_SUCCESS,
    cartCount:result.cartCount
  })
}

export const updateCart=async(req,res)=>{
  logger.info('Updating cart quantities');
  if(!req.session.user){
    logger.warn('Unathorized cart update attempt');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      message:MESSAGES.CART.LOGIN_REQUIRED
    })
  }

  const userId=req.session.user.id;
  const updates=req.body.updates;

  const result=await cartService.updateCartQuantityService(userId,updates);
  res.status(STATUS_CODES.SUCCESS).json({
    message:MESSAGES.CART.UPDATE_SUCCESS,
    cart:result.cart,
    cartCount:result.cartCount
  });
}

export const cartCount=async(req,res)=>{
  if(!req.session.user){
    return res.json({cartCount:0});
  }
  const count=await cartService.getCartCountService(req.session.user.id);

  res.json({cartCount:count});
}

export const validateCart=async(req,res)=>{
  logger.info('validating cart');

  if(!req.session.user){
    logger.warn('Unathourized cart validation attempt');
    if(!req.session.user){
      logger.warn('Unathorized cart validation attempt');
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        message:MESSAGES.CART.LOGIN_REQUIRED
      })
    }
  }

    const userId=req.session.user.id;
    const{invalidItems,invalidProductIds,validItems}=await cartService.validateCartService(userId);

    if (invalidItems.length > 0) {
      const isAllInvalid = invalidItems.length === (validItems.length + invalidItems.length);
      return res.json({
        success: false,
        message: isAllInvalid 
          ? `All selected products are currently unavailable: ${invalidItems.join(', ')}`
          : `Some products in your cart are currently unavailable: ${invalidItems.join(', ')}`,
        invalidProductIds: invalidProductIds
      });
    }
    res.json({success:true});
}
export const removeInvalidCartItems = async (req, res) => {
    logger.info('Removing invalid cart items');
    
    if (!req.session.user) {
        logger.warn('Unauthorized invalid items removal attempt');
        return res.status(STATUS_CODES.UNAUTHORIZED).json({ 
            message: MESSAGES.CART.LOGIN_REQUIRED 
        });
    }

    const userId = req.session.user.id;
    const { invalidProductIds } = req.body;

    const result = await cartService.removeInvalidCartItemsSerivce(userId, invalidProductIds);
    
    res.json({ 
        success: true, 
        message: MESSAGES.CART.REMOVE_INVALID_SUCCESS,
        removedCount: result.removedCount,
        remainingItems: result.remainingItems,
        newCartTotal: result.newCartTotal
    });
};




