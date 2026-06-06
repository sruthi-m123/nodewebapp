import * as cartService from '../../service/user/cart.service.js';
import { STATUS_CODES } from '../../utils/statusCodes.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getCart=async(req,res)=>{
  logger.info('loading cart page');
  if(!req.session.user){
    logger.warn('unathorized access to cart page');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      message:MESSAGES.CART.LOGIN_REQUIRED
    });
 
  }
  const userId=req.session.user.id;
  const cart=await cartService.getCartService(userId);
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

export const addToCart=async(req,res)=>{
  logger.info('Adding product to cart');
  if(!req.session.user){
    logger.warn('Unathorized cart add attempt ');
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      message:MESSAGES.CART.LOGIN_REQUIRED
    })
  }

  const userId=req.session.user.id;
  const productId=req.params.productId;
  const quantity=parseInt(req.body.quantity)

const result=await cartService.addToCartService(userId,productId,quantity)

res.status(STATUS_CODES.SUCCESS).json({
  success:true,
  message:MESSAGES.CART.ADD_SUCCESS,
  stock:result.stock,
  cartCount:result.cartCount
})
}

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
  const count=await cartService.getCartCountService(req.session.user._id);

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

    if(invalidItems.length===validItems.length+invalidItems.length){
      return res.json({
        success:false,
        message:`All selected products are currently unvaliable :${invalidItems.join(', ')}`,
        invalidProductIds:invalidProductIds
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
<<<<<<< Updated upstream
=======

const removeCartItem=async(req,res)=>{
  console.log("remove controller hit  ")
  if (!req.session.user && !req.user) {
  return res.status(401).json({ message: 'please login to continue' });
}

    const userId=req.session.user?.id;
    const itemId=req.params.itemId;
    if(!userId){
        return res.status(401).json({message:'please login to continue'});
    }
    try {
        const cart=await Cart.findOne({userId});
        if(!cart){
            return res.status(404).json({message:'cart not found'});
        }

cart.items=cart.items.filter(item=>item._id.toString()!==itemId)
.map(item=>({
  ...item.toObject(),
  totalPrice:item.price*item.quantity
}))
await cart.save();
return res.status(200).json({ message: 'Item removed from cart' ,cartCount:cartCount});
    } catch (error) {
        console.error('Error removing item from cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
    }
}

//quantity update in cart
const updateCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const updates = req.body.updates;

    console.log(" Updates received:", updates);

    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(200).json({ message: "Cart is empty or not found", cart: [] });
    }

    for (const update of updates) {
      const item = cart.items.find((i) => i._id.toString() === update.id);

      if (item) {
        const product=await Product.findById(item.productId);
        if(update.quantity>product.stock){
          return res.status(400).json({
            message:`cannot update quantity:Only ${product.stock}
            units available for ${product.name}`,
            productId:item.productId
          })
        }
       
      }
    }

for(const update of updates){
  const item=cart.items.find((i)=>i._id.toString()===update.id);

if(item){
  item.quantity=update.quantity;
item.totalPrice=item.quantity*item.price;
}
}



    await cart.save();

    console.log(" Cart updated successfully:", cart);

    res.status(200).json({ message: "Cart updated successfully", cart,cartCount:cartCount });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCartCount=async(userId)=>{
  const cart=await Cart.findOne({userId});
  return cart?cart.items.length:0;
};
const cartCount=async(req,res)=>{
  if(!req.session.user) return res.json({cartCount:0});

  try {
    const count=await getCartCount(req.session.user._id);
    res.json({cartCount:count});
  } catch (error) {
    console.error("cart count fetch error:",error);
  }
}


module.exports={
    getCart,
    addToCart,
    removeCartItem,
    updateCart,
    cartCount,
    getCartCount,
    cartCount
   }
>>>>>>> Stashed changes
