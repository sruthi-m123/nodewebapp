import Coupon  from '../../models/couponSchema.js';
import Cart from '../../models/cartSchema.js';
import Order from '../../models/orderSchema.js';
import {calculateOrder} from '../../helper/calculateTotal.js';
// import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';
// import items from 'razorpay/dist/types/items';

export const removeCouponService=async(userId, isRetry = false, retryCartItems = null)=>{
    logger.debug('Removing applied coupon',{userId, isRetry});

    let cartItems;

    if (isRetry) {
        // In retry mode, use the provided cart items from the frontend
        if (retryCartItems && retryCartItems.length > 0) {
            cartItems = retryCartItems.map(item => ({
                id: item.id || item.productId,
                name: item.name,
                price: item.price,
                originalPrice: item.originalPrice || item.price,
                discountedPrice: item.discountedPrice || null,
                quantity: item.quantity
            }));
        } else {
            // Fallback: fetch from the most recent failed order
            const failedOrder = await Order.findOne({
                userId,
                status: { $in: ['payment_failed', 'payment_pending'] }
            }).populate('items.productId').sort({ createdAt: -1 });

            if (!failedOrder) {
                logger.warn('No failed order found for retry coupon removal', { userId });
                throw new Error('No order found for retry');
            }

            cartItems = failedOrder.items.map(item => ({
                id: item.productId._id,
                name: item.productId.productName,
                price: item.discountedPrice || item.price,
                originalPrice: item.price,
                discountedPrice: item.discountedPrice || null,
                quantity: item.quantity
            }));
        }
    } else {
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            logger.warn('cart not found for coupon removal ', { userId });
            throw new Error('Cart not found');
        }

        cartItems = cart.items.map(item => ({
            id: item.productId._id,
            name: item.productId.productName,
            price: item.productId.discountedPrice || item.productId.price,
            originalPrice: item.productId.price,
            discountedPrice: item.productId.discountedPrice || null,
            quantity: item.quantity
        }));
    }

    // Recalculate without any coupon
    const orderSummary = calculateOrder(cartItems, {});
    logger.info('coupon removed successfully', { userId });
    return orderSummary;
    
};

export const getDiscountTextService=(coupon)=>{
    return coupon.discountType==='percentage'
    ?`${coupon.discountValue}% off`
    :`₹${coupon.discountValue} off`;
};

export const checkCouponUsageService=async(userId,coupon)=>{
    logger.debug('Checking coupon usage limit',{userId,couponId:coupon._id
        
    });
    const usageCount=await Order.countDocuments({
        userId,
        'appliedCoupon.couponId':coupon._id,
        status:{$nin:['cancelled','returned']}
    });
 

    if(coupon.usageLimit&&usageCount>=coupon.usageLimit){
        logger.warn('coupon usage limit reached',{userId,couponId:coupon._id,usageCount});
        throw new Error(`You cannot use this coupon only ${coupon.usageLimit} time(s`)
    }
    return true;
}

// export const prepareCartItemsService=(cart)=>{
//     return cart.items
//     .filter(item=>item.productId&&item.productId.isActive)
//     .map(item=>({
//         id:item.productId._id,
//         name:item.productId.productName,
//         price:item.productId.price,
//         originalPrice:item.productId.price,
//         discountedPrice:item.productId.discountedPrice||null,
//         quantity:item.quantity
//     }))
// }

export const prepareCartItemsService=(cart)=>{
    return cart.items
    .filter(item=>item.productId&& item.productId.isActive)
    .map(item=>{
        const product=item.productId;

        const  isOfferValid=
        product.offer&&
        product.offer.isActive&& 
        new Date(product.offer.validTill)>new Date();

        const finalPrice=isOfferValid
        ?product.discountedPrice
        :product.price;

        return {
            id:product._id,
            name:product.productName,
            price: finalPrice,
        originalPrice: product.price,
        discountedPrice: isOfferValid ? product.discountedPrice : null,
        quantity: item.quantity
        }
    })
}




export const checkMinCartValueService=(cartItems,coupon)=>{
    console.log("cartItems:",cartItems);

    const subtotal=cartItems.reduce(
        (sum,item)=>sum+item.originalPrice*item.quantity,0
    );
console.log("subtotal",subtotal);
    if(subtotal<coupon.minCartValue){
        const amountNeeded=parseFloat((coupon.minCartValue-subtotal).toFixed(2));
        logger.warn('minimum cart value not met',{subtotal,minCartValue:coupon.minCartValue});

        const err=new Error(
            `Add ${amountNeeded} more to apply this coupon`
        );
        err.status=400;
        throw err;
    }
    return subtotal;
}

export const getRetryCartItemsService=async(userId)=>{
    logger.debug('Getting retry cart items from failed order',{userId});

    const failedOrder=await Order.findOne({
        userId,
        status:'payment_failed'
    }).populate('items.productId').sort({createdAt:-1});

    if(!failedOrder){
        logger.warn('No failed order found for retry',{userId});
        throw new Error('No failed order for retry');
    }

    const retryCartItems=failedOrder.items.map(item=>({
        id:item.productId._id,
        name:item.productId.productName,
        price:item.discountedPrice||item.price,
        originalPrice:item.price,
        discountedPrice:item.discountedPrice||null,
        quantity:item.quantity
    }));

    logger.info('retry cart items fetched',{userId,itemCount:retryCartItems.length});
    return retryCartItems;
}

export const applyCouponLogicService=async({userId,coupon,retryCartItems=null})=>{
    logger.debug('Applying coupon logic',{userId,couponId:coupon._id,isRetry:!!retryCartItems});

    let cartItems=retryCartItems;

    if(!cartItems){
        const userCart=await Cart.findOne({userId}).populate('items.productId');
        if(!userCart||userCart.items.length===0){
            logger.warn('Empty cart during coupon application',{userId});
            throw new Error('cart is empty');
        }

        cartItems=userCart.items.map(item=>({
            id:item.productId._id,
            name:item.productId.productName,
            originalPrice:item.productId.price,
            discountedPrice:item.productId.discountedPrice||null,
            quantity:item.quantity
        }))
    } else {
        cartItems = retryCartItems.map(item => ({
            ...item,
            originalPrice: item.originalPrice || item.price,
        }));
    }
const subtotal=checkMinCartValueService(cartItems,coupon);

const calculatedSummary=calculateOrder(cartItems,{coupon});
const delivery=parseFloat((calculatedSummary.delivery||0).toFixed(2));
const tax=parseFloat((calculatedSummary.tax||0).toFixed(2));
const netAmount=parseFloat((calculatedSummary.netAmount||0).toFixed(2));
const total=parseFloat((calculatedSummary.total||0).toFixed(2));
const discountToApply=parseFloat((calculatedSummary.couponDiscount||0).toFixed(2));

if(discountToApply>subtotal){
    logger.warn('discount exceeds subtotal',{discountToApply,subtotal});
    throw new Error("this coupon cannot be applied because the coupon value exceeds the subtaotal");

}
console.log("dicount to apply here :",discountToApply);
console.log("total:",total);
const finalPrice=total;
console.log("finalPrice inside the applycoupon service logic:",finalPrice);
const discountText=getDiscountTextService(coupon);
const appliedCoupon={
    couponId:coupon._id,
    id:coupon._id,
    code:coupon.code,
    discountType:coupon.discountType,
    type:coupon.discountType,
    discountValue:coupon.discountValue,
    value:coupon.discountValue,
    discountApplied:discountToApply
}
 const orderSummary={
    items:cartItems,
    subtotal,
    delivery,
    tax,
    couponDiscount:discountToApply,
    netAmount,
    total:finalPrice
}

logger.info('coupon applied suucessfully',{
    userId,
    couponId:coupon._id,
    discountToApply
});

return {appliedCoupon,discountText,orderSummary};
};

export const validateAndApplyCouponService=async(userId,couponIdentifier,isRetry=false,provideRetryItems=null)=>{
    logger.debug('validating and applying coupon',{userId,couponIdentifier,isRetry});
    console.log("userId",userId);
    console.log("couponIdentifier",couponIdentifier);
    console.log("provide retry items:",provideRetryItems);

    // Determine if couponIdentifier is a MongoDB ObjectId or a coupon code string
    const isObjectId = /^[a-f\d]{24}$/i.test(String(couponIdentifier));

    const query = isObjectId
        ? { _id: couponIdentifier, isActive: true, validFrom: { $lte: new Date() }, validTill: { $gte: new Date() } }
        : { code: String(couponIdentifier).toUpperCase(), isActive: true, validFrom: { $lte: new Date() }, validTill: { $gte: new Date() } };

    const coupon = await Coupon.findOne(query);
    if(!coupon){
        logger.warn('coupon not found or expired',{couponIdentifier});
        throw new Error('Invalid or expired coupon');
    }

    let retryCartItems=provideRetryItems;
    if(isRetry&&!retryCartItems){
        retryCartItems=await getRetryCartItemsService(userId);
    }
    await checkCouponUsageService(userId,coupon);
    console.log("userId inside the apply coupon :",userId);
    const result=await applyCouponLogicService({userId,coupon,retryCartItems});

    return {
        coupon,
        ...result
    }
}
