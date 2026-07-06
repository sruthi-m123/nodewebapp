import Wishlist from "../../models/wishlistSchema.js";
import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import User from "../../models/userSchema.js";
import logger from "../../utils/logger.js";
import {STATUS_CODES} from '../../utils/statusCodes.js';

export const WishlistService={
    async getWishlistPageData(userId){
        logger.info("fetching wishlist data",{userId});

        const user=await User.findById(userId);
console.log("userId:",userId);
       

        const wishlist=await Wishlist.findOne({user:userId}).populate("items.productId");
        console.log("wislist items:",wishlist);
console.log("wishlist :",wishlist);
        const validItems=wishlist?.items?.filter(i=>i.productId)||[];
      
        const formattedItems=validItems.map(item=>({
            id:item._id,
            name:item.productId.productName,
            discountedPrice:item.productId.discountedPrice,
            price:item.productId.discountedPrice>0
            ?item.productId.discountedPrice
            :item.productId.price,
            originalPrice:item.productId.price,
            image:item.productId.images[0],
            color:item.productId.color,
            stock:item.productId.stock

        }));
        console.log("formated items inside the wishlist controller :",formattedItems);
        return {
            user,
            items:formattedItems
        }
            },

            async addToWishlist(userId,productId){
                logger.info("Adding products to wishlist",{userId,productId});
                 const product=await Product.findOne({
                    _id:productId,
                    isDeleted:false,
                    isActive:true,
                    status:"In Stock"
                 })
                if(!product){
                    const err=new Error("Product not available");
                    err.statusCode=STATUS_CODES.NOT_FOUND;
                    throw err;
                }

                let wishlist= await Wishlist.findOne({user:userId});
                if(!wishlist){
                    wishlist=new Wishlist({
                        user:userId,
                        items:[{productId}]
                    });
                    await wishlist.save();
                    return wishlist.items.length;
                }else{
                    const exists=wishlist.items.some(
                        item=>item.productId.toString()===productId.toString()
                    );

                  if (exists) {
  const err = new Error("Product already in the wishlist.");
  err.statusCode = STATUS_CODES.BAD_REQUEST;
  err.status = STATUS_CODES.BAD_REQUEST;
  throw err;
}
                    wishlist.items.push({productId});
                    await wishlist.save();
                    console.log("wishlist.items:",wishlist.items);
                    return wishlist.items.length;
                }
            },

            async removeFromWishlist(userId,itemId){
                logger.info("Removing wishlist item",{userId,itemId});
                const wishlist=await Wishlist.findOneAndUpdate(
                    {user:userId},
                    {$pull:{items:{_id:itemId}}},
                    {new:true}
                );

                if(!wishlist){
                    const err=new Error("wishlit item not found");
                    err.statusCode=STATUS_CODES.NOT_FOUND;
                    throw err;
                }
                return wishlist.items.length;
            },

            async addToCartFromWishlist(userId,itemId){
                logger.info("moving wishlist item to cart",{userId,itemId});

                const wishlist=await Wishlist.findOne({user:userId}).populate("items.productId");
const wishlistItem=wishlist?.items.find(
    i=>i._id.toString()===itemId
);
if (!wishlistItem) {
      const err = new Error("Wishlist item not found");
      err.statusCode = STATUS_CODES.NOT_FOUND;
      throw err;
    }
 const product=wishlistItem.productId;
 if(product.isDeleted||product.isActive===false){
    await Wishlist.updateOne(
        {user:userId},
        {$pull:{items:{_id:itemId}}}
    );
    const err=new Error("product no longer available");
    err.statusCode=STATUS_CODES.NOT_FOUND;
    throw err;
 }
 let cart=await Cart.findOne({userId});
 const price=product.discountedPrice?? product.price;
 if(!cart){
    cart=new Cart({
        userId,
        items:[{
            productId:product._id,
            quantity:1,
            price,
            totalPrice:price
        }]
    })
 }else{
    const cartItem=cart.items.find(i=>
        i.productId.equals(product._id)
    );
    if(cartItem){
        if(cartItem.quantity+1>product.stock){
            const err=new Error("Not enough stock");
            err.statusCode=STATUS_CODES.NOT_FOUND;
            throw err;
        };
        cartItem.quantity+=1;
        cartItem.totalPrice=cartItem.quantity*cartItem.price;

    }else{
        if(product.stock<=0){
            const err=new Error("product out of stock");
            err.statusCode=STATUS_CODES.NOT_FOUND;
            throw err;

        }

        cart.items.push({
            productId:product._id,
            quantity:1,
            price,
            totalPrice:price
        });
    
    }
 }
await cart.save();

await Wishlist.updateOne({user:userId},{
    $pull:{items:{_id:itemId}}
});

const [wishlistCount,cartCount]=await Promise.all([
    Wishlist.countDocuments({user:userId}),
    Cart.countDocuments({user:userId})
])

return {wishlistCount,cartCount};
            },

      
            
            async checkWishlistStatus(userId,productId){
                const exists=await Wishlist.exists({
                    user:userId,
                    "items.productId":productId
                });
                return Boolean(exists);
            },

           async removeProductFromWishlist(userId, productId) {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { items: { productId } } },
    { new: true }
  );

  if (!wishlist) {
    const err = new Error("Wishlist not found");
    err.status = STATUS_CODES.NOT_FOUND;
    throw err;
  }

  return wishlist.items.length;
}
}