import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import logger from "../../utils/logger.js";

export const getCartService =async(userId)=>{
    logger.debug('Fetching user cart',{userId});

    let cart =await Cart.findOne({userId}).populate('items.productId');
    if(!cart){
        logger.info('no cart found user,creating emprty cart',{userId});
        cart={items:[],totalPrice:0}
    }
    return cart
}

export const processCartItemsService=async(cart)=>{
    logger.debug('Processing cart items for stock validation');
    const outOfStockItems=[];
    const validItems=[];
console.log("cart ",cart);
    for(const item of cart.items){
        const product=item.productId;

        if(!product||product.stock<1){
            outOfStockItems.push({
                productId:item.productId,
                name:product?.productName,
                availble:0,
                requested:item.quantity
            });
            continue;
        }
        const allowedQty=Math.min(item.quantity,product.stock);
        if(allowedQty>item.quantity){
            outOfStockItems.push({
                productId:product.productId,
                name:product.productName,
                available:product.stock,
                requested:item.quantity

            })
        }
        const unitPrice=(product.discountedPrice&&product.discountedPrice>0)
        ?product.discountedPrice
        :product.price;

        validItems.push({
            _id:item._id,
            quantity:allowedQty,
            productId:product,
            unitPrice,
            totalPrice:unitPrice*allowedQty
        });
    }

    logger.info('cart items processed',{
        validItems:validItems.length,
        outOfStockItems:outOfStockItems.length
    })
    return {validItems,outOfStockItems};
}

export const updateCartItemService=async(userId,validItems)=>{
    logger.debug('updating cart items with validated quantities',{userId});

    if(validItems.length>0){
        await Cart.findOneAndUpdate({userId},{$set:{items:validItems}});
        logger.info('cart updated with validated items',{userId});
  }
}



export const addToCartService=async(userId,productId,quantity,limit=10)=>{
logger.debug("adding product to cart",{userId,productId,quantity});
const product=await Product.findOne({
    _id:productId,
    stock:{$gte:quantity},
    isActive:true
}).populate("bestOffer");

if(!product){
    const current=await Product.findById(productId);
    const available=current?.stock||0;
    logger.warn("product unavailable for cart",{
        productId,
        available,
        requested:quantity
    });
    throw new Error(
        available>0
        ?`Only  ${available} units available`
        :"Product out of stock"
    )
}
if(quantity>limit){
    logger.warn("User exceeded cart limit",{productId,quantity,limit})
    throw new  Error(`Maximum ${limit} items allwed per product`);
}
let cart = await Cart.findOne({userId});
if(!cart){
    cart=new Cart({
        userId,
        items:[]
    })
}
//checking the existing item 
const existingItem=cart.items.find(
    item=>item.productId.toString()===productId
);
const price=product.bestOffer?.price||product.price;

if(existingItem){
   const newQty=existingItem.quantity+quantity;
   if(newQty>limit){
    throw new Error(`you can add a maximum of${limit} units `);
   }

   existingItem.quantity=newQty;
   existingItem.totalPrice=existingItem.quantity*price;
}else{
    cart.items.push({
        productId,
        quantity,
        price,
        totalPrice:price*quantity
    })
}
await cart.save();
logger.info("Item added to cart",{userId,productId});

 return {
        cartCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        cart
    };
}




export const removeCartItemService=async(userId,itemId)=>{
    logger.debug('Removing cart item',{userId,itemId});
    console.log("itemId:",itemId);
    const cart= await Cart.findOne({userId});
    if(!cart){
        logger.warn('cart not found for removal',{userId});
        throw new Error('Cart not found');
    }
    for(let i=0;i<cart.items.length;i++){
        console.log(cart.items[i]);
    }
    const removedItem=cart.items.find(item=>item._id.toString()===itemId);
    if(!removedItem){
        logger.warn('Item not found in cart for removal',{userId,itemId});
        throw new Error('Item not found in cart');

    }
        cart.items=cart.items.filter(i=>i._id.toString()!== itemId);

        await cart.save();
        logger.info("Item removed from cart",{userId,itemId});

        return {
            cartCount: cart.items.reduce((sum, it) => sum + it.quantity, 0),
        cart
        }
 
}

export const updateCartQuantityService=async(userId,updates)=>{
    logger.debug ("cart updates",{updates});
logger.debug('updating cart quantities',{userId,updatedCount:updates.length});
const cart=await Cart.findOne({userId});
if(!cart||!cart.items||cart.items.length===0){
    logger.warn('cart empty or not found for update',{userId});
    throw new Error('Cart is empty or not found');
}
const errors=[];
for(const update of updates){
    const item=cart.items.find((i)=>i.itemId.toString()===update.id);
    if(item){
        const product=await Product.findById(item.productId);
        if(!product){
            errors.push({
                productId:item.productId,
                message:'Product not  found'
            });
            continue;
        }
        if(update.quantity>product.stock){
            errors.push({
                productId:item.productId,
                message:`Only ${product.stock} units are availble for ${product.productName}`
            })
        }
    }
}
if(errors.length>0){
    logger.warn('cart update validation errors',{errors});
    throw new Error(JSON.stringify({
        message:"Some items exceed stock",
        errors
    }))
}

for(const update of updates ){
    const item =cart.items.find((i)=>i._id.toString()===update.id);
    if(item){
        item.quantity=update.quantity;
        item.totalPrice=item.quantity*item.price;
    }
}

cart.markModified("items");
logger.info('cart quantities updated successfully',{userId});

return{
    cart,
    cartCount:cart.items.reduce((acc,i)=>acc+i.quantity,0)
}

}

export const getCartCountService=async(userId)=>{
    logger.debug('getting cart count',{userId});

    const cart=await Cart.findOne({userId});
    const count=cart?cart.items.reduce((sum,item)=>sum+item.quantity,0):0;
    logger.debug('cart count retrived',{userId,count});
    return count;
}

export const validateCartService=async(userId)=>{
    logger.debug('validating cart items',{userId});
    const cart =await Cart.findOne({userId}).populate('items.productId');
    if(!cart||cart.items.length===0){
        logger.warn('empty cart during validation',{userId});
        throw new Error('Your cart is empty.');

    }
    let invalidItems=[];
    let invalidProductIds=[];
    let validItems=[];

    for(const item of cart.items){
        const product=item.productId;
        if(!product||
            !product.isActive||
            product.isBlocked ||
            product.isDeleted ||
            product.stock<item.quantity){
                invalidItems.push(product?product.productName:"Unknown Product");
                if(product &&product._id){
                    invalidProductIds.push(product._id.toString());
                }
            }else{
                validItems.push(item);
    
            }
        
    }
    logger.info("cart validation completed",{
        userId,
         totalItems: cart.items.length, 
        invalidItems: invalidItems.length,
        validItems: validItems.length
    })
      return { invalidItems, invalidProductIds, validItems };
}

export const removeInvalidCartItemsSerivce=async(userId,invalidProductIds)=>{
    logger.debug('removing invalid cart items',{userId,invalidProductIds});

    if(!Array.isArray(invalidProductIds)||invalidProductIds.length===0){
        throw new Error("No invalid items provided");
    }
    const stringProductIds=invalidProductIds.map(id=>id.toString());
    const cart=await Cart.findOne({userId}).populate('items.prodcuId');

    if(!cart||cart.items.length===0){
        throw new Error('Cart not found.'); 
         
    }
    const originalCount=cart.items.length;
    cart.items=cart.items.filter(item=>{
        const isInvalidProduct=stringProductIds.includes(item.productId._id.toString());
        return !isInvalidProduct
    });
    cart.items.forEach(item=>{
        const currentPrice=item.productId? item.productId.price:item.price;
        if(currentPrice&&item.quantity>0){
            item.totalPrice=currentPrice*item.quantity;
        }
    });
    await cart.save();
    const removedCount=originalCount-cart.items.length;
    const newCartTotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    logger.info('Invalid items removed from cart', { 
        userId, 
        removedCount, 
        remainingItems: cart.items.length 
    });

    return {
        removedCount,
        remainingItems: cart.items.length,
        newCartTotal
    };
}