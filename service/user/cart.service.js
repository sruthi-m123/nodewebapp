import Cart from "../../models/cartSchema.js";
import Product from "../../models/productSchema.js";
import { MESSAGES } from "../../utils/messages.js";
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

    logger.info('cart updated with validated items',{userId});
}
}

export const addToCartService=async(userId,productId,quantity,limit=10)=>{
    logger.debug('adding product to cart',{userId,productId,quantity});

    const product=await Product.findOne({
        _id:productId,
        stock:{$get:quantity},
        isActive:true
    }).populate('bestOffer');
    if(!product){
        const currentProduct=await Product.findById(productId);
        const available=currentProduct?.stock||0;

        logger.warn('Product not available for cart', { productId, available, requested: quantity });
        throw new Error(available > 0 
            ? `Only ${available} units available` 
            : 'Product out of stock'
        );
    }

    if(quantity>limit){
        await Product.findByIdAndUpdate(productId,{$inc:{stock:quantity}});
        logger.warn('user exceeded cart limit ',{productId,quantity,limit});
        throw new Error(`Maximum ${limit} items alloed per order`);

    }
    return product;
};
