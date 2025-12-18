import Product from '../../models/productSchema.js';
import { MESSAGES } from '../../utils/messages.js';
import logger from '../../utils/logger.js';

export const getProductDetailService=async(productId)=>{
    logger.debug('fetching product details',{productId});

    const product=await Product.findById(productId)
    .populate('bestOffer')
    .populate('category');

    if(!product){
        logger.warn('Product not found',{productId});
        throw new Error(MESSAGES.PRODUCT.NOT_FOUND);

    }

    if(product.isDeleted||!product.isActive){
        logger.warn('product not available',{productId,isDeleted:product.isDeleted,isActive:product.isActive});
        throw new Error(MESSAGES.PRODUCT.NOT_AVAILABLE);
    }

    logger.info('product details fetched successfully',{productId,productName:product.productName});
    return product;
}


export const getRelatedProductsService=async(productId,category,limit=4)=>{
    logger.debug('fetching realted products',{productId,category});

    const relatedProducts=await Product.find({
        category:category,
        _id:{$ne:productId},
        isActive:true,
        isDeleted:false
    })
    .limit(limit)
    .populate('bestOffer');

     logger.debug('Related products fetched', { 
        productId, 
        count: relatedProducts.length 
    });
    
    return relatedProducts;
}

export const checkProductAvailabilityService = (product) => {
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= 10;
    
    return {
        isOutOfStock,
        isLowStock,
        stockMessage: isOutOfStock 
            ? MESSAGES.PRODUCT.OUT_OF_STOCK 
            : isLowStock 
                ? `Only ${product.stock} left in stock!` 
                : null
    };
};